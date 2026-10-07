import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1');

  // Em desenvolvimento, aceita qualquer origem *.app.github.dev (Codespaces)
  // e localhost. Em produção, restringe a WEB_URL.
  const isDev = process.env.NODE_ENV !== 'production';
  const webUrl = process.env.WEB_URL ?? 'http://localhost:3001';

    app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Sem origin (ex.: curl, Postman) → permite
      if (!origin) return callback(null, true);

      // Produção: só a WEB_URL exata
      if (!isDev) {
        return callback(null, origin === webUrl);
      }

      // Dev: localhost, 127.0.0.1 e qualquer *.app.github.dev
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
  await app.listen(port);
  console.log(`🚀 JM Music API em http://localhost:${port}/v1`);
  if (isDev) console.log(`   CORS: aceitando *.app.github.dev e localhost`);
}

bootstrap();