import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RentalService } from './rental.service';

@Injectable()
export class RentalExpirationService implements OnModuleInit {
  private readonly logger = new Logger(RentalExpirationService.name);

  constructor(private readonly rental: RentalService) {}

  /** Roda no boot da API — limpa vencidos enquanto API estava desligada */
  async onModuleInit() {
    const count = await this.rental.expireOutdatedRentals();
    if (count > 0) {
      this.logger.log(`Boot: ${count} aluguel(is) expirado(s)`);
    }
  }

  /** Roda a cada hora, no minuto 0 */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiration() {
    const count = await this.rental.expireOutdatedRentals();
    if (count > 0) {
      this.logger.log(`Job: ${count} aluguel(is) expirado(s)`);
    }
  }
}