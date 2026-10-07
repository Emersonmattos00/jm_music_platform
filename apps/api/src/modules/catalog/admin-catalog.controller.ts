import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { ReorderTracksDto } from './dto/reorder-tracks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/catalog')
export class AdminCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  // ---------------- ÁLBUNS ----------------

  @Post('albums')
  createAlbum(@Body() dto: CreateAlbumDto) {
    return this.catalog.createAlbum(dto);
  }

  @Patch('albums/:id')
  updateAlbum(@Param('id') id: string, @Body() dto: UpdateAlbumDto) {
    return this.catalog.updateAlbum(id, dto);
  }

  @Patch('albums/:albumId/tracks/reorder')
  reorderAlbumTracks(
    @Param('albumId') albumId: string,
    @Body() dto: ReorderTracksDto,
  ) {
    return this.catalog.reorderAlbumTracks(albumId, dto.orderedIds);
  }

  // ---------------- FAIXAS ----------------

  @Post('tracks')
  createTrack(@Body() dto: CreateTrackDto) {
    return this.catalog.createTrack(dto);
  }

  @Patch('tracks/:id')
  updateTrack(@Param('id') id: string, @Body() dto: UpdateTrackDto) {
    return this.catalog.updateTrack(id, dto);
  }

  @Patch('tracks/:id/publish')
  publishTrack(@Param('id') id: string) {
    return this.catalog.publishTrack(id);
  }

  @Patch('tracks/:id/archive')
  archiveTrack(@Param('id') id: string) {
    return this.catalog.archiveTrack(id);
  }
}