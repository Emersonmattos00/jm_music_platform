import { Injectable, Logger } from '@nestjs/common';
import {
  RentalStatus,
  SubscriptionStatus,
  TrackStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface EntitlementResult {
  allowed: boolean;
  reason: string;
  source: 'subscription' | 'rental' | 'preview' | 'admin' | 'none';
}

const CACHE_TTL_SECONDS = 30;

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Regras (em ordem de prioridade):
   *   1. Faixa publicada?
   *   2. Admin?
   *   3. Assinatura ativa?
   *   4. Aluguel ativo (faixa ou álbum)?
   *   5. Preview público existe?
   *
   * Cache em Redis com TTL de 30s para reduzir load no Postgres.
   */
  async canPlay(
    userId: string | null,
    trackId: string,
  ): Promise<EntitlementResult> {
    // Anônimo: pula cache (não tem nada mutável pra cachear)
    if (!userId) {
      return this.computeEntitlement(null, trackId);
    }

    const cacheKey = `ent:${userId}:${trackId}`;

    // CORREÇÃO 19.2: Fallback para o PostgreSQL se o Redis falhar.
    try {
      const cached = await this.redis.get<EntitlementResult>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error) {
      // Se o Redis estiver fora do ar, apenas loga e segue para o banco.
      this.logger.warn(
        `Falha ao ler cache do Redis (user ${userId}, track ${trackId}). Caindo para o PostgreSQL.`,
        error,
      );
    }

    const result = await this.computeEntitlement(userId, trackId);

    // Salva no cache em background (fire-and-forget), ignorando erros.
    void this.redis
      .setex(cacheKey, CACHE_TTL_SECONDS, result)
      .catch((error) => {
        this.logger.warn(
          `Falha ao salvar cache no Redis (user ${userId}, track ${trackId}).`,
          error,
        );
      });

    return result;
  }

  /**
   * Invalida o cache de um usuário específico.
   * Chame depois de: cancelar assinatura, reembolsar pedido, expirar aluguel.
   */
  async invalidateUser(userId: string): Promise<void> {
    try {
      const deleted = await this.redis.delPattern(`ent:${userId}:*`);
      if (deleted > 0) {
        this.logger.log(
          `Cache invalidado: ${deleted} chaves de entitlement (user ${userId})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Falha ao invalidar cache no Redis (user ${userId}).`,
        error,
      );
    }
  }

  // ----------------------------------------------------------
  // Lógica real (sem cache)
  // ----------------------------------------------------------
  private async computeEntitlement(
    userId: string | null,
    trackId: string,
  ): Promise<EntitlementResult> {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        status: true,
        albumId: true,
        previewKey: true,
        streamKey: true,
      },
    });

    if (!track) {
      return { allowed: false, reason: 'Faixa não encontrada', source: 'none' };
    }

    if (track.status !== TrackStatus.PUBLISHED) {
      return { allowed: false, reason: 'Faixa não publicada', source: 'none' };
    }

    if (!track.streamKey && !track.previewKey) {
      return {
        allowed: false,
        reason: 'Faixa sem áudio disponível',
        source: 'none',
      };
    }

    // 2. Admin
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role === 'ADMIN') {
        return { allowed: true, reason: 'Admin', source: 'admin' };
      }
    }

    // 3. Assinatura ativa
    if (userId) {
      const sub = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { gt: new Date() },
        },
        select: { id: true },
      });
      if (sub) {
        return {
          allowed: true,
          reason: 'Assinatura ativa',
          source: 'subscription',
        };
      }
    }

    // 4. Aluguel ativo (faixa ou álbum)
    if (userId) {
      const now = new Date();
      const rental = await this.prisma.rental.findFirst({
        where: {
          userId,
          status: RentalStatus.ACTIVE,
          startsAt: { lte: now },
          expiresAt: { gt: now },
          OR: [
            { trackId },
            ...(track.albumId ? [{ albumId: track.albumId }] : []),
          ],
        },
        select: { id: true },
      });
      if (rental) {
        return { allowed: true, reason: 'Aluguel ativo', source: 'rental' };
      }
    }

    // 5. Preview público
    if (track.previewKey) {
      return { allowed: true, reason: 'Preview público', source: 'preview' };
    }

    return {
      allowed: false,
      reason: 'Sem assinatura, aluguel ou preview disponível',
      source: 'none',
    };
  }
}