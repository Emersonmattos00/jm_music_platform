import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlaybackService } from './playback.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('playback')
export class PlaybackController {
  constructor(private readonly playback: PlaybackService) {}

  @Get(':trackId')
  @UseGuards(OptionalJwtAuthGuard)
  authorize(
    @Param('trackId', new ParseUUIDPipe()) trackId: string,
    @Req() req: any,
  ) {
    return this.playback.authorize(trackId, req.user?.id ?? null);
  }

  @Post(':trackId/progress')
  @UseGuards(JwtAuthGuard)
  updateProgress(
    @Param('trackId', new ParseUUIDPipe()) trackId: string,
    @Body() dto: UpdateProgressDto,
    @Req() req: any,
  ) {
    return this.playback.updateProgress(trackId, req.user.id, dto.secondsPlayed);
  }
}