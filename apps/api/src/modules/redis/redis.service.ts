import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');

    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      retryStrategy(times) {
        // Reconecta com backoff exponencial (máx 3s)
        return Math.min(times * 200, 3000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log(`Redis conectado: ${url}`);
    });
    this.client.on('error', (err) => {
      this.logger.warn(`Redis erro: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis desconectado');
    }
  }

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      this.logger.warn(`Redis get falhou (${key}): ${(e as Error).message}`);
      return null;
    }
  }

  async setex(key: string, ttlSeconds: number, value: unknown): Promise<void> {
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (e) {
      this.logger.warn(`Redis setex falhou (${key}): ${(e as Error).message}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch (e) {
      this.logger.warn(`Redis del falhou: ${(e as Error).message}`);
    }
  }

  /** Deleta todas as chaves que batem com o pattern (ex: `ent:user:*`) */
  async delPattern(pattern: string): Promise<number> {
    try {
      let cursor = '0';
      let total = 0;
      do {
        const [next, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = next;
        if (keys.length > 0) {
          await this.client.del(...keys);
          total += keys.length;
        }
      } while (cursor !== '0');
      return total;
    } catch (e) {
      this.logger.warn(`Redis delPattern falhou: ${(e as Error).message}`);
      return 0;
    }
  }
}