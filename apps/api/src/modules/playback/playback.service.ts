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

    // Assinante/aluguel/admin → streamKey (qualidade cheia)
    // Preview → previewKey (amostra de 30s)
    // ⚠️ Sem fallback: se falta a key esperada, é erro (não serve preview pro assinante)
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

    // Registra intent-to-play (auditoria).
    // NOTA: `secondsPlayed: 0` porque o áudio ainda não tocou. Um endpoint
    // separado (`POST /playback/:id/progress`) deve atualizar isso conforme
    // o frontend reporta progresso (a cada 15-30s).
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