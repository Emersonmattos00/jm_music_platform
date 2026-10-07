import { Controller, Get } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Get()
  list() {
    return this.social.listActive();
  }
}