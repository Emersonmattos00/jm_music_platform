import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ListTracksQueryDto } from './dto/list-tracks-query.dto';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('catalog/tracks')
  listTracks(@Query() query: ListTracksQueryDto) {
    return this.catalog.listPublicTracks(query);
  }

  @Get('catalog/tracks/:slug')
  getTrack(@Param('slug') slug: string) {
    return this.catalog.getPublicTrackBySlug(slug);
  }

  @Get('catalog/albums')
  listAlbums() {
    return this.catalog.listPublicAlbums();
  }

  @Get('catalog/albums/:slug')
  getAlbum(@Param('slug') slug: string) {
    return this.catalog.getPublicAlbumBySlug(slug);
  }

  @Get('artists/:slug')
  getArtist(@Param('slug') slug: string) {
    return this.catalog.getArtistBySlug(slug);
  }
}