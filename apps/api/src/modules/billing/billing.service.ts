import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicPlans() {
    const plans = await this.prisma.plan.findMany({
      where: { active: true },
      orderBy: [{ intervalUnit: 'asc' }, { priceCents: 'asc' }],
      select: {
        id: true,
        name: true,
        priceCents: true,
        currency: true,
        intervalUnit: true,
        intervalCount: true,
      },
    });

    return plans;
  }
}