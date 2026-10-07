import { Controller, Get } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('plans')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  list() {
    return this.billing.listPublicPlans();
  }
}