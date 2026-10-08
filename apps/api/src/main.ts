import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1');
  app.use(cookieParser());

  const isDev = process.env.NODE_ENV !== 'production';

  const configuredOrigins = (
    process.env.WEB_URLS ??
    process.env.WEB_URL ??
    'http://localhost:3001'
  )
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);

      const normalized = normalizeOrigin(origin);

      if (configuredOrigins.includes(normalized)) {
        return callback(null, true);
      }

      if (isDev) {
        const isLocal =
          /^https?:\/\/localhost(:\d+)?$/.test(normalized) ||
          /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(normalized);
        const isCodespace =
          /^https:\/\/[a-z0-9-]+\.app\.github\.dev$/.test(normalized);
        if (isLocal || isCodespace) return callback(null, true);
      }

      return callback(
        new Error(`CORS: origem não autorizada: ${normalized}`),
        false,
      );
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 JM Music API em http://localhost:${port}/v1`);
  console.log(`   CORS (prod): ${configuredOrigins.join(', ') || '(vazio)'}`);
}

bootstrap();
