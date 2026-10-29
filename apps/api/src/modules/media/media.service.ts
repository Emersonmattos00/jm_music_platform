import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UploadUrlDto } from './dto/upload-url.dto';
import { AttachMediaDto } from './dto/attach-media.dto';

const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB
const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'];

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createUploadUrl(dto: UploadUrlDto) {
    const track = await this.prisma.track.findUnique({
      where: { id: dto.trackId },
      select: { id: true, slug: true },
    });
    if (!track) throw new NotFoundException('Faixa não encontrada');

    const extension = this.extensionFromMime(dto.contentType);
    const key = this.buildKey(dto.type, track.slug, extension);

    // CORREÇÃO: getUploadUrl retorna { url, expiresAt }
    const { url, expiresAt } = await this.storage.getUploadUrl(
      key,
      dto.contentType,
    );

    return {
      url,
      key,
      expiresAt,
      expiresInSeconds: 900,
      method: 'PUT',
      headers: { 'Content-Type': dto.contentType },
    };
  }

  async attach(dto: AttachMediaDto) {
    const track = await this.prisma.track.findUnique({
      where: { id: dto.trackId },
      select: { id: true, slug: true },
    });
    if (!track) throw new NotFoundException('Faixa não encontrada');

    // CORREÇÃO: extrai a extensão direto da chave (sem mimeFromKey)
    const parts = dto.key.split('.');
    const actualExtension = parts.pop()?.toLowerCase();

    if (!actualExtension || !/^[a-z0-9]+$/.test(actualExtension)) {
      throw new BadRequestException('Extensão de arquivo inválida.');
    }

    if (!SUPPORTED_EXTENSIONS.includes(actualExtension)) {
      throw new BadRequestException(
        `Extensão não suportada: ${actualExtension}`,
      );
    }

    const expectedKey = this.buildKey(dto.type, track.slug, actualExtension);

    if (dto.key !== expectedKey) {
      throw new BadRequestException(
        'A chave do arquivo não corresponde à faixa e ao tipo de mídia.',
      );
    }

    // CORREÇÃO: valida tamanho real do arquivo
    const size = await this.storage.getObjectSize(dto.key);
    if (size === null) {
      throw new BadRequestException(
        'Objeto não encontrado no storage. Faça o upload antes de anexar.',
      );
    }
    if (size > MAX_UPLOAD_SIZE) {
      throw new BadRequestException(
        `Arquivo muito grande (${(size / 1024 / 1024).toFixed(1)} MB). Máximo: ${MAX_UPLOAD_SIZE / 1024 / 1024} MB.`,
      );
    }

    const field = this.fieldForType(dto.type);
    return this.prisma.track.update({
      where: { id: dto.trackId },
      data: { [field]: dto.key },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        previewKey: true,
        streamKey: true,
        masterKey: true,
      },
    });
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  private buildKey(type: string, slug: string, extension: string): string {
    // CORREÇÃO: valida o slug contra path traversal
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new BadRequestException('Slug da faixa inválido.');
    }

    switch (type) {
      case 'master':
        return `masters/${slug}/master.${extension}`;
      case 'stream':
        return `streaming/${slug}/stream.${extension}`;
      case 'preview':
        return `previews/${slug}/preview.${extension}`;
      default:
        throw new BadRequestException('Tipo de mídia inválido');
    }
  }

  private fieldForType(type: string): 'masterKey' | 'streamKey' | 'previewKey' {
    switch (type) {
      case 'master':
        return 'masterKey';
      case 'stream':
        return 'streamKey';
      case 'preview':
        return 'previewKey';
      default:
        throw new BadRequestException('Tipo de mídia inválido');
    }
  }

  private extensionFromMime(mime: string): string {
    const map: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/flac': 'flac',
      'audio/x-flac': 'flac',
      'audio/aac': 'aac',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
    };

    const extension = map[mime.toLowerCase()];
    if (!extension) {
      throw new BadRequestException('Formato de áudio não suportado.');
    }
    return extension;
  }
}