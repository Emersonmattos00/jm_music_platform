import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1');

  // Habilita leitura de cookies (refresh token em httpOnly)
  app.use(cookieParser());

  const isDev = process.env.NODE_ENV !== 'production';
  const webUrl = process.env.WEB_URL ?? 'http://localhost:3001';

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);

      if (!isDev) {
        return callback(null, origin === webUrl);
      }

      const allowed =
        origin === webUrl ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
        /^https:\/\/[a-z0-9-]+\.app\.github\.dev$/.test(origin);

      return callback(null, allowed);
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
  if (isDev) console.log(`   CORS: aceitando *.app.github.dev e localhost`);
}

bootstrap();