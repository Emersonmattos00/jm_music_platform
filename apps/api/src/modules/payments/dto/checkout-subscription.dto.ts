import { IsUUID } from 'class-validator';

export class CheckoutSubscriptionDto {
  @IsUUID()
  planId!: string;
}