import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CheckoutSubscriptionDto } from './dto/checkout-subscription.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // ---- Assinatura (bloqueia se email não verificado)

  @Post('checkout/subscription')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  createCheckout(@Req() req: any, @Body() dto: CheckoutSubscriptionDto) {
    return this.payments.createSubscriptionCheckout(req.user.id, dto.planId);
  }

  // ---- Status / cancelar / minhas (não precisa verificar)

  @Get('checkout/subscription/:id/status')
  @UseGuards(JwtAuthGuard)
  getStatus(@Req() req: any, @Param('id') id: string) {
    return this.payments.getSubscriptionStatus(req.user.id, id);
  }

  @Post('me/subscription/:id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.payments.cancelSubscription(req.user.id, id);
  }

  @Get('me/subscription')
  @UseGuards(JwtAuthGuard)
  getMine(@Req() req: any) {
    return this.payments.getMySubscription(req.user.id);
  }

  // ---- Aluguel — checkout (bloqueia se email não verificado)

  @Post('checkout/rental/:orderId')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  createRentalCheckout(@Req() req: any, @Param('orderId') orderId: string) {
    return this.payments.createRentalCheckout(req.user.id, orderId);
  }
}