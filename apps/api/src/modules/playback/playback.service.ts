import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
        durationSeconds: true,
      },
    });

    if (!track) throw new NotFoundException('Faixa não encontrada');

    const decision = await this.entitlement.canPlay(userId, trackId);

    if (!decision.allowed) {
      throw new ForbiddenException(decision.reason);
    }

    // Decidir fonte com base no que REALMENTE existe no storage,
    // não apenas no que está no banco.
    const streamExists = await this.storage.exists(track.streamKey);
    const previewExists = await this.storage.exists(track.previewKey);

    if (!streamExists && !previewExists) {
      throw new NotFoundException(
        'Áudio indisponível no momento. Contate o suporte.',
      );
    }

    const wantsPreviewOnly = decision.source === 'preview';
    const usePreview = wantsPreviewOnly || (!streamExists && previewExists);

    const key = usePreview ? track.previewKey : track.streamKey;

    if (!key) {
      throw new NotFoundException('Áudio indisponível no momento.');
    }

    const { url, expiresAt } = await this.storage.getPlaybackUrl(key);

    if (userId) {
      await this.prisma.playbackEvent.create({
        data: {
          userId,
          trackId,
          source: usePreview ? 'preview' : decision.source,
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
      source: usePreview ? 'preview' : decision.source,
      isPreview: usePreview,
    };
  }

  /**
   * Atualiza o progresso de reprodução (segundos efetivamente tocados).
   * - Limita à duração conhecida da faixa (se houver).
   * - Usa updateMany com condição `lt` para evitar regressão sob concorrência.
   */
  async updateProgress(
    trackId: string,
    userId: string,
    secondsPlayed: number,
  ) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: { durationSeconds: true },
    });

    if (!track) throw new NotFoundException('Faixa não encontrada');

    const max =
      track.durationSeconds != null
        ? track.durationSeconds
        : Number.POSITIVE_INFINITY;

    const safeSeconds = Math.min(
      Math.max(0, Math.floor(secondsPlayed)),
      max,
    );

    const event = await this.prisma.playbackEvent.findFirst({
      where: { userId, trackId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, secondsPlayed: true },
    });

    if (!event) {
      throw new NotFoundException(
        'Evento de reprodução não encontrado. Inicie a reprodução primeiro.',
      );
    }

    // Atualização atômica: só grava se for maior que o valor atual.
    await this.prisma.playbackEvent.updateMany({
      where: { id: event.id, secondsPlayed: { lt: safeSeconds } },
      data: { secondsPlayed: safeSeconds },
    });

    const finalSeconds = Math.max(safeSeconds, event.secondsPlayed);

    return { ok: true, secondsPlayed: finalSeconds };
  }
}