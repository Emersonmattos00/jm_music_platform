import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MercadopagoModule } from '../mercadopago/mercadopago.module';
import { EntitlementModule } from '../entitlement/entitlement.module'; // <-- ADICIONE

@Module({
  imports: [
    PrismaModule,
    MercadopagoModule,
    EntitlementModule, // <-- ADICIONE
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}