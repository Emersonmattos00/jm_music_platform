import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que permite anônimo, mas valida o token SE presente.
 *
 * - Sem header `Authorization` → libera como anônimo (`req.user = null`)
 * - Com header válido → popula `req.user`
 * - Com header inválido/expirado → 401
 *   (o frontend detecta e renova via /auth/refresh automaticamente)
 *
 * Use em rotas que aceitam visitante (ex.: preview de faixa).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.authorization;

    // Sem header Authorization → trata como anônimo
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }

    // Tem header → valida normal. Se inválido, 401 sobe.
    return (await super.canActivate(context)) as boolean;
  }
}