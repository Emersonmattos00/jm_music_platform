import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { RadioService } from './radio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('radio')
export class RadioController {
  constructor(private readonly radio: RadioService) {}

  @Get('tracks')
  getTracks(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 300;
    return this.radio.getRadioTracks(isNaN(n) ? 300 : Math.min(n, 500));
  }

  @Get('access')
  @UseGuards(JwtAuthGuard)
  getAccess(@Req() req: any) {
    return this.radio.getUserAccess(req.user.id);
  }
}