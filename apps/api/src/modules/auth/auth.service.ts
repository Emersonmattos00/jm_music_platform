import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 10;

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'CUSTOMER' | 'ADMIN';
    emailVerified: Date | null;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { email, name: dto.name.trim(), passwordHash },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    // Envia email de verificação
    await this.sendVerificationEmail(user.id, user.email, user.name);

    const tokens = await this.issueTokens(user);
    return { user, ...tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      // Hash "dummy" pra equalizar o tempo (anti user enumeration)
      await bcrypt.compare(
        dto.password,
        '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva',
      );
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const tokens = await this.issueTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const tokenHash = this.hashToken(refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Detecção de reuso
    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Sessão comprometida. Faça login novamente.',
      );
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Rotação
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(stored.user);

    return {
      user: {
        id: stored.user.id,
        email: stored.user.email,
        name: stored.user.name,
        role: stored.user.role,
        emailVerified: stored.user.emailVerified,
      },
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  // ----------------------------------------------------------
  // FORGOT PASSWORD — anti-enumeração (sempre retorna sucesso)
  // ----------------------------------------------------------
  async forgotPassword(email: string) {
    const normalized = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return {
        ok: true,
        message:
          'Se este email estiver cadastrado, você receberá um link de redefinição.',
      };
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    await this.mail.sendPasswordResetEmail(user.email, user.name, rawToken);

    return {
      ok: true,
      message:
        'Se este email estiver cadastrado, você receberá um link de redefinição.',
    };
  }

  // ----------------------------------------------------------
  // RESET PASSWORD
  // ----------------------------------------------------------
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);

    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) throw new BadRequestException('Link inválido ou expirado');
    if (stored.usedAt) {
      throw new BadRequestException(
        'Este link já foi utilizado. Solicite um novo.',
      );
    }
    if (stored.expiresAt < new Date()) {
      throw new BadRequestException('Link expirado. Solicite um novo.');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      ok: true,
      message: 'Senha redefinida com sucesso. Faça login novamente.',
    };
  }

  // ----------------------------------------------------------
  // EMAIL VERIFICATION
  // ----------------------------------------------------------

  /** Gera e envia o email de verificação (register + reenvio) */
  private async sendVerificationEmail(
    userId: string,
    email: string,
    name: string,
  ) {
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId, usedAt: null },
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    await this.mail.sendVerificationEmail(email, name, rawToken);
  }

  /** Reenvia o email (chamado pelo endpoint resend-verification) */
  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    if (user.emailVerified) {
      return { ok: true, message: 'Email já verificado.' };
    }

    await this.sendVerificationEmail(user.id, user.email, user.name);

    return {
      ok: true,
      message:
        'Email de verificação reenviado. Verifique sua caixa de entrada.',
    };
  }

  /** Valida o token e marca o email como verificado */
  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);

    const stored = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new BadRequestException('Link inválido ou expirado');
    }
    if (stored.usedAt) {
      throw new BadRequestException(
        'Este link já foi utilizado. Solicite um novo.',
      );
    }
    if (stored.expiresAt < new Date()) {
      throw new BadRequestException('Link expirado. Solicite um novo.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { emailVerified: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      ok: true,
      message: 'Email verificado com sucesso!',
    };
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------
  private async issueTokens(user: {
    id: string;
    email: string;
    role: 'CUSTOMER' | 'ADMIN';
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessExpiresSeconds = this.parseExpirySeconds(
      this.config.get<string>('JWT_ACCESS_EXPIRES', '15m'),
    );

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresSeconds,
    });

    const rawRefresh = randomBytes(48).toString('hex');
    const refreshHash = this.hashToken(rawRefresh);

    const refreshExpiresSeconds = this.parseExpirySeconds(
      this.config.get<string>('JWT_REFRESH_EXPIRES', '30d'),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: new Date(Date.now() + refreshExpiresSeconds * 1000),
      },
    });

    return { accessToken, refreshToken: rawRefresh };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpirySeconds(value: string): number {
    const match = value.match(/^(\d+)\s*([smhd])$/);
    if (!match) return 30 * 24 * 60 * 60;
    const n = parseInt(match[1], 10);
    switch (match[2]) {
      case 's': return n;
      case 'm': return n * 60;
      case 'h': return n * 60 * 60;
      case 'd': return n * 24 * 60 * 60;
      default:  return 30 * 24 * 60 * 60;
    }
  }
}