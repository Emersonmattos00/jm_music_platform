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

    // Escolhe a melhor key disponível:
    // - assinatura/aluguel/admin → streamKey (qualidade cheia)
    // - preview → previewKey (só amostra)
    const usePreview = decision.source === 'preview';
    const key = usePreview
      ? track.previewKey
      : (track.streamKey ?? track.previewKey);

    if (!key) {
      throw new ForbiddenException('Sem áudio disponível');
    }

    const { url, expiresAt } = await this.storage.getPlaybackUrl(key);

    // Registra o evento de playback (auditoria)
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
}