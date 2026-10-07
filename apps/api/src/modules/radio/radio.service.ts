import { Injectable } from '@nestjs/common';
import { SubscriptionStatus, TrackStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RadioService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna a discografia completa em ordem embaralhada.
   * Público — o frontend decide se toca (só assinantes) ou bloqueia (CTA).
   */
  async getRadioTracks(limit = 300) {
    const tracks = await this.prisma.track.findMany({
      where: { status: TrackStatus.PUBLISHED },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        genre: true,
        mood: true,
        durationSeconds: true,
        createdAt: true,
        artist: { select: { id: true, name: true, slug: true, imageUrl: true } },
        album: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            releaseDate: true,
          },
        },
      },
    });

    // Embaralha (Fisher-Yates)
    const shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Retorna o status de assinatura do usuário.
   * Usado pelo frontend para decidir se libera o Rádio.
   */
  async getUserAccess(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gt: new Date() },
      },
      select: {
        id: true,
        status: true,
        currentPeriodEnd: true,
        plan: { select: { name: true, intervalUnit: true } },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin = user?.role === 'ADMIN';
    const isSubscriber = !!sub;

    return {
      hasAccess: isAdmin || isSubscriber,
      isAdmin,
      isSubscriber,
      subscription: sub
        ? {
            id: sub.id,
            planName: sub.plan.name,
            interval: sub.plan.intervalUnit,
            renewsAt: sub.currentPeriodEnd,
          }
        : null,
    };
  }
}