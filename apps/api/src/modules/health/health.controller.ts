import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'unknown',
      redis: 'unknown',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
      checks.status = 'degraded';
    }

    try {
      // Tenta um ping simples no Redis
      await this.redis.get('health-check-ping');
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
      checks.status = 'degraded';
    }

    return checks;
  }
}
