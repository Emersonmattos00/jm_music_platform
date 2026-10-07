import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from =
      this.config.get<string>('MAIL_FROM') ??
      'JM Music <onboarding@resend.dev>';
  }

  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3001');
    const resetUrl = `${webUrl}/reset-password?token=${token}`;

    const subject = 'Redefinir senha — JM Music';
    const html = this.buildResetHtml(name, resetUrl);

    if (!this.resend) {
      // Fallback dev: loga o link no console
      this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.warn('RESEND_API_KEY não configurado — email NÃO enviado');
      this.logger.warn(`Para: ${to}`);
      this.logger.warn(`Link: ${resetUrl}`);
      this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { ok: true, dev: true };
    }

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      return { ok: true };
    } catch (e) {
      this.logger.error(`Erro enviando email: ${(e as Error).message}`);
      // Não re-lança: forgot-password sempre retorna 200 (anti-enumeração)
      return { ok: false };
    }
  }
    async sendVerificationEmail(to: string, name: string, token: string) {
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3001');
    const verifyUrl = `${webUrl}/verify-email?token=${token}`;

    const subject = 'Confirme seu email — JM Music';
    const html = this.buildVerificationHtml(name, verifyUrl);

    if (!this.resend) {
      this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.warn('RESEND_API_KEY não configurado — email NÃO enviado');
      this.logger.warn(`Para: ${to}`);
      this.logger.warn(`Link: ${verifyUrl}`);
      this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { ok: true, dev: true };
    }

    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
      return { ok: true };
    } catch (e) {
      this.logger.error(`Erro enviando email: ${(e as Error).message}`);
      return { ok: false };
    }
  }

  private buildVerificationHtml(name: string, url: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirme seu email</title>
</head>
<body style="margin:0;padding:0;background:#0c1015;font-family:Arial,sans-serif;color:#f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c1015;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#151b23;border-radius:16px;border:1px solid #2b3542;">
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:24px;color:#e7b95f;">JM Music</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Olá, ${name}!</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
                Bem-vindo à JM Music. Falta só um passo: confirme seu email pra liberar sua conta.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">
                O link expira em <strong>24 horas</strong>.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#e7b95f;border-radius:12px;">
                    <a href="${url}" style="display:inline-block;padding:14px 28px;color:#16130c;font-weight:bold;text-decoration:none;font-size:16px;">
                      Confirmar meu email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;color:#9da9b8;word-break:break-all;">
                Ou cole este link no navegador:<br />
                <span style="color:#e7b95f;">${url}</span>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#9da9b8;">
          © ${new Date().getFullYear()} JM Music · Joseph Matthos
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private buildResetHtml(name: string, url: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redefinir senha</title>
</head>
<body style="margin:0;padding:0;background:#0c1015;font-family:Arial,sans-serif;color:#f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c1015;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#151b23;border-radius:16px;border:1px solid #2b3542;">
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:24px;color:#e7b95f;">
                JM Music
              </h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
                Olá, ${name}!
              </p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
                Recebemos uma solicitação para redefinir a senha da sua conta.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">
                Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong> e só pode ser usado uma vez.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#e7b95f;border-radius:12px;">
                    <a href="${url}" style="display:inline-block;padding:14px 28px;color:#16130c;font-weight:bold;text-decoration:none;font-size:16px;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#9da9b8;line-height:1.5;">
                Se você não solicitou, ignore este email — sua senha continua a mesma.
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#9da9b8;word-break:break-all;">
                Ou cole este link no navegador:<br />
                <span style="color:#e7b95f;">${url}</span>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#9da9b8;">
          © ${new Date().getFullYear()} JM Music · Joseph Matthos
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}