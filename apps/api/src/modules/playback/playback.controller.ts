import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { PlaybackService } from './playback.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('playback')
export class PlaybackController {
  constructor(private readonly playback: PlaybackService) {}

  @Get(':trackId')
  @UseGuards(OptionalJwtAuthGuard)
  authorize(@Param('trackId') trackId: string, @Req() req: any) {
    return this.playback.authorize(trackId, req.user?.id ?? null);
  }
}