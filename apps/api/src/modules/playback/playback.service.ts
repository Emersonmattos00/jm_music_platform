import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EntitlementService } from '../entitlement/entitlement.service';

@Injectable()
export class PlaybackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly entitlement: EntitlementService,
  ) {}

  async authorize(trackId: string, userId: string | null) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        title: true,
        slug: true,
        previewKey: true,
        streamKey: true,
      },
    });

    if (!track) throw new NotFoundException('Faixa não encontrada');

    const decision = await this.entitlement.canPlay(userId, trackId);

    if (!decision.allowed) {
      throw new ForbiddenException(decision.reason);
    }

    const usePreview = decision.source === 'preview';
    const key = usePreview ? track.previewKey : track.streamKey;

    if (!key) {
      throw new ForbiddenException(
        usePreview
          ? 'Preview não disponível para esta faixa.'
          : 'Áudio completo indisponível no momento. Contate o suporte.',
      );
    }

    const { url, expiresAt } = await this.storage.getPlaybackUrl(key);

    if (userId) {
      await this.prisma.playbackEvent.create({
        data: {
          userId,
          trackId,
          source: decision.source,
          secondsPlayed: 0,
        },
      });
    }

    return {
      trackId: track.id,
      title: track.title,
      slug: track.slug,
      url,
      expiresAt,
      source: decision.source,
      isPreview: usePreview,
    };
  }

  /**
   * Atualiza o progresso de reprodução (segundos efetivamente tocados).
   */
  async updateProgress(trackId: string, userId: string, secondsPlayed: number) {
    const event = await this.prisma.playbackEvent.findFirst({
      where: { userId, trackId },
      orderBy: { createdAt: 'desc' },
    });

    if (!event) {
      throw new NotFoundException(
        'Evento de reprodução não encontrado. Inicie a reprodução primeiro.',
      );
    }

    if (secondsPlayed > event.secondsPlayed) {
      await this.prisma.playbackEvent.update({
        where: { id: event.id },
        data: { secondsPlayed },
      });
    }

    return {
      ok: true,
      secondsPlayed: Math.max(secondsPlayed, event.secondsPlayed),
    };
  }
}