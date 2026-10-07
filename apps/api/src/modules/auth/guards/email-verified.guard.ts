import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Bloqueia se o usuário estiver logado mas o email não foi verificado.
 * Usar APÓS o JwtAuthGuard.
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;

    if (!userId) throw new UnauthorizedException('Não autenticado');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Confirme seu email antes de continuar. Verifique sua caixa de entrada.',
      );
    }

    return true;
  }
}