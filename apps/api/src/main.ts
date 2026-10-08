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

      // 1) Origens explícitas em WEB_URLS / WEB_URL
      if (configuredOrigins.includes(normalized)) {
        return callback(null, true);
      }

      // 2) Domínios de preview da Vercel deste projeto
      //    Ex.: https://josephmatthosmusic-lmtnaq2t0-emersonmattos00s-projects.vercel.app
      const isVercelPreview =
        /^https:\/\/josephmatthosmusic-[a-z0-9]+-emersonmattos00s-projects\.vercel\.app$/.test(
          normalized,
        );
      if (isVercelPreview) {
        return callback(null, true);
      }

      // 3) Em dev: localhost e Codespaces
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
  console.log(`   CORS (vercel preview): josephmatthosmusic-*.vercel.app`);
}

bootstrap();
