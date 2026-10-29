import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { MediaService } from './media.service';
import { UploadUrlDto } from './dto/upload-url.dto';
import { AttachMediaDto } from './dto/attach-media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload-url')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  createUploadUrl(@Body() dto: UploadUrlDto) {
    return this.media.createUploadUrl(dto);
  }

  @Post('attach')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  attach(@Body() dto: AttachMediaDto) {
    return this.media.attach(dto);
  }
}