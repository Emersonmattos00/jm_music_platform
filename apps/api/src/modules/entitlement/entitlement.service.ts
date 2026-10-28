import { Injectable, Logger } from '@nestjs/common';
import {
  RentalStatus,
  SubscriptionStatus,
  TrackStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';

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
    private readonly storage: StorageService,
  ) {}

  /**
   * Regras (em ordem de prioridade):
   *   1. Faixa publicada?
   *   2. Admin?
   *   3. Assinatura ativa?
   *   4. Aluguel ativo (faixa ou álbum)?
   *   5. Preview público existe (no storage)?
   *
   * Cache em Redis com TTL de 30s. Cache inclui negativas, por isso
   * invalidateUser é obrigatório ao mudar assinatura/aluguel.
   */
  async canPlay(
    userId: string | null,
    trackId: string,
  ): Promise<EntitlementResult> {
    if (!userId) {
      return this.computeEntitlement(null, trackId);
    }

    const cacheKey = `ent:${userId}:${trackId}`;

    try {
      const cached = await this.redis.get<EntitlementResult>(cacheKey);
      if (cached) return cached;
    } catch (error) {
      this.logger.warn(
        `Falha ao ler cache do Redis (user ${userId}, track ${trackId}). Caindo para o PostgreSQL.`,
        error as any,
      );
    }

    const result = await this.computeEntitlement(userId, trackId);

    void this.redis
      .setex(cacheKey, CACHE_TTL_SECONDS, result)
      .catch((error) =>
        this.logger.warn(
          `Falha ao salvar cache no Redis (user ${userId}, track ${trackId}).`,
          error as any,
        ),
      );

    return result;
  }

  /**
   * Invalida o cache de um usuário específico.
   * Chame depois de: cancelar assinatura, confirmar pagamento (webhook),
   * reembolsar pedido, criar aluguel, expirar aluguel manualmente.
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
        error as any,
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
        if (await this.anyAudioExists(track)) {
          return {
            allowed: true,
            reason: 'Assinatura ativa',
            source: 'subscription',
          };
        }
        return {
          allowed: false,
          reason: 'Áudio indisponível no storage',
          source: 'none',
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
        if (await this.anyAudioExists(track)) {
          return { allowed: true, reason: 'Aluguel ativo', source: 'rental' };
        }
        return {
          allowed: false,
          reason: 'Áudio indisponível no storage',
          source: 'none',
        };
      }
    }

    // 5. Preview público (confirma no storage)
    if (track.previewKey && (await this.storage.exists(track.previewKey))) {
      return { allowed: true, reason: 'Preview público', source: 'preview' };
    }

    return {
      allowed: false,
      reason: 'Sem assinatura, aluguel ou preview disponível',
      source: 'none',
    };
  }

  private async anyAudioExists(track: {
    streamKey: string | null;
    previewKey: string | null;
  }): Promise<boolean> {
    if (track.streamKey && (await this.storage.exists(track.streamKey))) {
      return true;
    }
    if (track.previewKey && (await this.storage.exists(track.previewKey))) {
      return true;
    }
    return false;
  }
}