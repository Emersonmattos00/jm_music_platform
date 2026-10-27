import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UploadUrlDto } from './dto/upload-url.dto';
import { AttachMediaDto } from './dto/attach-media.dto';

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

    // CORREÇÃO 30.1: extensionFromMime agora lança erro para MIME inválido
    const extension = this.extensionFromMime(dto.contentType);
    const key = this.buildKey(dto.type, track.slug, extension);

    const url = await this.storage.getUploadUrl(key, dto.contentType);

    return {
      url,
      key,
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

    // CORREÇÃO 30.2: Valida se a chave recebida corresponde ao padrão
    // esperado para esta faixa e este tipo de mídia.
    const expectedExtension = this.extensionFromMime(
      this.mimeFromKey(dto.key), // ou usa a extensão direta
    );
    
    // A forma mais segura é reconstruir a chave esperada e comparar.
    // Precisamos extrair a extensão da chave.
    const parts = dto.key.split('.');
    const actualExtension = parts.pop()?.toLowerCase();
    
    if (!actualExtension || !/^[a-z0-9]+$/.test(actualExtension)) {
      throw new BadRequestException('Extensão de arquivo inválida.');
    }

    const expectedKey = this.buildKey(dto.type, track.slug, actualExtension);

    if (dto.key !== expectedKey) {
      throw new BadRequestException(
        'A chave do arquivo não corresponde à faixa e ao tipo de mídia.',
      );
    }

    const exists = await this.storage.objectExists(dto.key);
    if (!exists) {
      throw new BadRequestException(
        'Objeto não encontrado no storage. Faça o upload antes de anexar.',
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

  // Helper adicionado para extrair o MIME fictício da chave
  // (não é usado para validação real, mas para manter a consistência)
  private mimeFromKey(key: string): string {
    const extension = key.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      ogg: 'audio/ogg',
    };
    return map[extension ?? ''] ?? 'application/octet-stream';
  }
}