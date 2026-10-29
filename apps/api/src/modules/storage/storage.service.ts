import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
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
export class StorageService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StorageService.name);

  private driver: StorageDriver = 'b2';
  private client!: S3Client;
  private bucket!: string;
  private publicBaseUrl: string | null = null;

  private uploadExpires = 900;
  private playbackExpires = 1800;
  private imageExpires = 604800; // 7 dias (limite do SigV4)

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const driver = (this.config.get<string>('STORAGE_DRIVER', 'b2') ??
      'b2') as StorageDriver;

    if (driver !== 'b2' && driver !== 's3' && driver !== 'rustfs') {
      throw new Error(
        `STORAGE_DRIVER inválido: "${driver}". Valores aceitos: b2, s3, rustfs.`,
      );
    }
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
      this.config.get<string>('SIGNED_URL_IMAGE_EXPIRES', '604800'),
    );

    this.logger.log(
      `Storage: ${this.driver.toUpperCase()} • bucket: ${this.bucket}`,
    );
  }

  async onModuleDestroy() {
    if (this.client) {
      this.client.destroy();
      this.logger.log('S3Client encerrado.');
    }
  }

  getDriver(): StorageDriver {
    return this.driver;
  }

  getBucket(): string {
    return this.bucket;
  }

  /**
   * Verifica se um objeto existe no bucket.
   * Retorna false em 404/NotFound; assume existente em 403/erro de rede
   * (para não derrubar o playback).
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
      this.logger.warn(
        `Falha ao verificar ${key} (assumindo existente): ${err?.message ?? err}`,
      );
      return true;
    }
  }

  /** Alias de compatibilidade para chamadas existentes. */
  async objectExists(key: string | null | undefined): Promise<boolean> {
    return this.exists(key);
  }

  /**
   * Retorna o tamanho do objeto em bytes, ou null se não existir.
   * Usado pelo MediaService para validar uploads.
   */
  async getObjectSize(key: string): Promise<number | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return head.ContentLength ?? null;
    } catch (err: any) {
      const status = err?.$metadata?.httpStatusCode;
      if (
        status === 404 ||
        err?.name === 'NotFound' ||
        err?.Code === 'NotFound' ||
        err?.name === 'NoSuchKey'
      ) {
        return null;
      }
      throw err;
    }
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
    if (!contentType) {
      throw new Error('Content-Type é obrigatório.');
    }
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
    const base = this.publicBaseUrl.replace(/\/$/, '');
    const encoded = key
      .replace(/^\//, '')
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${base}/${encoded}`;
  }
}