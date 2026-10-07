import { Global, Module } from '@nestjs/common';
import { MercadopagoService } from './mercadopago.service';

@Global()
@Module({
  providers: [MercadopagoService],
  exports: [MercadopagoService],
})
export class MercadopagoModule {}