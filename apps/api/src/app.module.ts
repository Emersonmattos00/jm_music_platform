import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { StorageModule } from './modules/storage/storage.module';
import { MediaModule } from './modules/media/media.module';
import { EntitlementModule } from './modules/entitlement/entitlement.module';
import { PlaybackModule } from './modules/playback/playback.module';
import { RentalModule } from './modules/rental/rental.module';
import { BillingModule } from './modules/billing/billing.module';
import { RadioModule } from './modules/radio/radio.module';
import { SocialModule } from './modules/social/social.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { MercadopagoModule } from './modules/mercadopago/mercadopago.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    PrismaModule,
    RedisModule,
    MailModule,
    MercadopagoModule,
    StorageModule,
    AuthModule,
    CatalogModule,
    MediaModule,
    EntitlementModule,
    PlaybackModule,
    RentalModule,
    BillingModule,
    RadioModule,
    SocialModule,
    NewsletterModule,
    PaymentsModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}