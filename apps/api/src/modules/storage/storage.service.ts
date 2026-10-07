import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type StorageDriver = 'rustfs' | 'b2';

@Injectable()
export class StorageService implements OnModuleInit {
  private client!: S3Client;
  private bucket!: string;
  private publicBaseUrl: string | null = null;
  private uploadExpires!: number;
  private playbackExpires!: number;
  private imageExpires!: number;
  private driver!: StorageDriver;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const driver = (this.config.get<string>('STORAGE_DRIVER', 'rustfs') ??
      'rustfs') as StorageDriver;
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

    this.uploadExpires = parseInt(
      this.config.get<string>('SIGNED_URL_UPLOAD_EXPIRES', '900'),
      10,
    );
    this.playbackExpires = parseInt(
      this.config.get<string>('SIGNED_URL_PLAYBACK_EXPIRES', '1800'), // 🆕 subiu de 300 → 1800
      10,
    );
    this.imageExpires = parseInt(
      this.config.get<string>('SIGNED_URL_IMAGE_EXPIRES', '31536000'),
      10,
    );

    console.log(
      `   Storage: ${this.driver.toUpperCase()} • bucket: ${this.bucket}`,
    );
  }

  getDriver(): StorageDriver {
    return this.driver;
  }

  getBucket(): string {
    return this.bucket;
  }

  async getUploadUrl(key: string, contentType: string): Promise<string> {
    if (!key) throw new Error('Key obrigatória');
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: this.uploadExpires,
    });
  }

  async getPlaybackUrl(key: string): Promise<{ url: string; expiresAt: Date }> {
    if (!key) throw new Error('Key obrigatória'); // 🆕
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

  async getImageUrl(key: string): Promise<string> {
    if (!key) throw new Error('Key obrigatória'); // 🆕
    // Se tiver URL pública configurada, usa direto (mais rápido)
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: this.imageExpires });
  }

  async objectExists(key: string): Promise<boolean> {
    if (!key) return false;
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteObject(key: string): Promise<void> {
    if (!key) return;
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}