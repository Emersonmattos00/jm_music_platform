import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

    afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SenhaForte123';

  it('/v1/auth/register (POST) - deve criar usuário', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Test User' })
      .expect(201)
      .expect((res: any) => {
        expect(res.body.user.email).toBe(testEmail);
        expect(res.body.accessToken).toBeDefined();
      });
  });

  it('/v1/auth/login (POST) - deve autenticar com sucesso', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200) // <-- Corrigido de 201 para 200
      .expect((res: any) => {
        expect(res.body.accessToken).toBeDefined();
      });
  });

  it('/v1/auth/login (POST) - deve rejeitar senha incorreta', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: 'SenhaErrada123' })
      .expect(401);
  });
});