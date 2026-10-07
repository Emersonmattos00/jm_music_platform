import { Injectable } from '@nestjs/common';
import {
  RentalStatus,
  SubscriptionStatus,
  TrackStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface EntitlementResult {
  allowed: boolean;
  reason: string;
  source: 'subscription' | 'rental' | 'preview' | 'admin' | 'none';
}

@Injectable()
export class EntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Regras (em ordem de prioridade):
   *   1. Faixa publicada?
   *   2. Admin?
   *   3. Assinatura ativa?
   *   4. Aluguel ativo (faixa ou álbum)?
   *   5. Preview público existe?
   */
  async canPlay(
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
      return { allowed: false, reason: 'Faixa sem áudio disponível', source: 'none' };
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
        return { allowed: true, reason: 'Assinatura ativa', source: 'subscription' };
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