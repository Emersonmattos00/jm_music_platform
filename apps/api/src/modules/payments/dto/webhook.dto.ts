import { IsOptional, IsString } from 'class-validator';

export class WebhookDto {
  @IsOptional()
  id?: string | number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  data?: { id?: string | number };

  @IsOptional()
  @IsString()
  resource?: string;
}