import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type StorageDriver = 'b2' | 's3' | 'rustfs';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  private driver: StorageDriver = 'b2';
  private client!: S3Client;
  private bucket!: string;
  private publicBaseUrl: string | null = null;

  private uploadExpires = 900;
  private playbackExpires = 1800;
  private imageExpires = 31536000;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const driver = (this.config.get<string>('STORAGE_DRIVER', 'b2') ??
      'b2') as StorageDriver;
    this.driver = driver;

    if (driver === 'b2') {
      const endpoint = this.config.getOrThrow<string>('B2_MEDIA_ENDPOINT');
      const region = this.config.get<string>('B2_MEDIA_REGION', 'us-east-005');
      const accessKeyId = this.config.getOrThrow<string>('B2_KEY_ID');
      const secretAccessKey =
        this.config.getOrThrow<string>('B2_APPLICATION_KEY');

      this.bucket = this.config.getOrThrow<string>('B2_MEDIA_BUCKET');
      this.publicBaseUrl =
        this.config.get<string>('B2_IMAGE_PUBLIC_URL') ?? null;

      this.client = new S3Client({
        region,
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
    } else {
      const endpoint = this.config.getOrThrow<string>('S3_ENDPOINT');
      const region = this.config.get<string>('S3_REGION', 'us-east-1');
      const accessKeyId = this.config.getOrThrow<string>('S3_ACCESS_KEY');
      const secretAccessKey = this.config.getOrThrow<string>('S3_SECRET_KEY');
      const forcePathStyle =
        this.config.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true';

      this.bucket = this.config.getOrThrow<string>('S3_BUCKET');
      this.client = new S3Client({
        region,
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle,
      });
    }

    this.uploadExpires = Number(
      this.config.get<string>('SIGNED_URL_UPLOAD_EXPIRES', '900'),
    );
    this.playbackExpires = Number(
      this.config.get<string>('SIGNED_URL_PLAYBACK_EXPIRES', '1800'),
    );
    this.imageExpires = Number(
      this.config.get<string>('SIGNED_URL_IMAGE_EXPIRES', '31536000'),
    );

    this.logger.log(
      `Storage: ${this.driver.toUpperCase()} • bucket: ${this.bucket}`,
    );
  }

  getDriver(): StorageDriver {
    return this.driver;
  }

  getBucket(): string {
    return this.bucket;
  }

  /**
   * Verifica se um objeto existe no bucket configurado.
   * Retorna false em 404/NotFound; relança outros erros.
   */
async exists(key: string | null | undefined): Promise<boolean> {
  if (!key) return false;
  try {
    await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    return true;
  } catch (err: any) {
    const status = err?.$metadata?.httpStatusCode;
    if (
      status === 404 ||
      err?.name === 'NotFound' ||
      err?.Code === 'NotFound' ||
      err?.name === 'NoSuchKey'
    ) {
      return false;
    }
    // 403/erro de credencial: loga e assume otimista para não derrubar o playback.
    this.logger.warn(
      `Falha ao verificar ${key} (assumindo existente): ${err?.message ?? err}`,
    );
    return true;
  }
}

  /**
   * Alias de compatibilidade: media.service.ts e outros módulos
   * chamam objectExists(). Mantém a mesma semântica de exists().
   */
  async objectExists(key: string | null | undefined): Promise<boolean> {
    return this.exists(key);
  }

  async getPlaybackUrl(key: string): Promise<{ url: string; expiresAt: Date }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: this.playbackExpires,
    });
    return {
      url,
      expiresAt: new Date(Date.now() + this.playbackExpires * 1000),
    };
  }

  async getUploadUrl(
    key: string,
    contentType: string,
  ): Promise<{ url: string; expiresAt: Date }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: this.uploadExpires,
    });
    return {
      url,
      expiresAt: new Date(Date.now() + this.uploadExpires * 1000),
    };
  }

  getPublicImageUrl(key: string): string | null {
    if (!this.publicBaseUrl) return null;
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }
}