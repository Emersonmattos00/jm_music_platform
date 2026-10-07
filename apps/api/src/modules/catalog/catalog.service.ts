import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TrackStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPagination, Paginated } from '../../common/pagination';
import { ListTracksQueryDto } from './dto/list-tracks-query.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { normalizeISRC, normalizeUPC } from '../../common/validators/isrc-upc.validator';

// Campos que PODEM ser expostos ao público.
// NUNCA incluir previewKey, streamKey ou masterKey aqui.
const PUBLIC_TRACK_SELECT = {
  id: true,
  title: true,
  slug: true,
  trackNumber: true,
  isrc: true,
  upc: true,
  genre: true,
  mood: true,
  durationSeconds: true,
  status: true,
  createdAt: true,
  artist: { select: { id: true, name: true, slug: true, imageUrl: true } },
  album: { select: { id: true, title: true, slug: true, coverUrl: true } },
} as const;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // PÚBLICO
  // ============================================================

  async listPublicTracks(query: ListTracksQueryDto): Promise<Paginated<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { status: TrackStatus.PUBLISHED };

    if (query.genre) where.genre = query.genre;
    if (query.mood) where.mood = query.mood;

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { genre: { contains: query.q, mode: 'insensitive' } },
        { mood: { contains: query.q, mode: 'insensitive' } },
        { artist: { name: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.track.count({ where }),
      this.prisma.track.findMany({
        where,
        select: PUBLIC_TRACK_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data, meta: buildPagination(page, limit, total) };
  }

  async getPublicTrackBySlug(slug: string) {
    const track = await this.prisma.track.findFirst({
      where: { slug, status: TrackStatus.PUBLISHED },
      select: PUBLIC_TRACK_SELECT,
    });
    if (!track) throw new NotFoundException('Faixa não encontrada');
    return track;
  }

  async listPublicAlbums() {
    return this.prisma.album.findMany({
      orderBy: [{ sortOrder: 'asc' }, { releaseDate: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        upc: true,
        releaseDate: true,
        artist: { select: { id: true, name: true, slug: true, imageUrl: true } },
        _count: {
          select: { tracks: { where: { status: TrackStatus.PUBLISHED } } },
        },
      },
    });
  }

  async getPublicAlbumBySlug(slug: string) {
    const album = await this.prisma.album.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        upc: true,
        releaseDate: true,
        artist: { select: { id: true, name: true, slug: true, imageUrl: true } },
        tracks: {
          where: { status: TrackStatus.PUBLISHED },
          select: PUBLIC_TRACK_SELECT,
          orderBy: [{ trackNumber: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!album) throw new NotFoundException('Álbum não encontrado');
    return album;
  }

  async getArtistBySlug(slug: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        imageUrl: true,
        albums: {
          orderBy: [{ sortOrder: 'asc' }, { releaseDate: 'desc' }],
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            releaseDate: true,
            _count: {
              select: { tracks: { where: { status: TrackStatus.PUBLISHED } } },
            },
          },
        },
        _count: {
          select: {
            albums: true,
            tracks: { where: { status: TrackStatus.PUBLISHED } },
          },
        },
      },
    });
    if (!artist) throw new NotFoundException('Artista não encontrado');
    return artist;
  }

  // ============================================================
  // ADMIN
  // ============================================================

  async createAlbum(dto: CreateAlbumDto) {
    const slug = await this.generateUniqueSlug('album', dto.title);

    let artistId = dto.artistId;
    if (!artistId) {
      const defaultArtist = await this.prisma.artist.findUnique({
        where: { name: 'Joseph Matthos' },
      });
      if (!defaultArtist) {
        throw new ConflictException('Artista padrão não configurado');
      }
      artistId = defaultArtist.id;
    }

    return this.prisma.album.create({
      data: {
        title: dto.title,
        slug,
        coverUrl: dto.coverUrl,
        upc: normalizeUPC(dto.upc),
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null,
        artistId,
      },
    });
  }

  async updateAlbum(id: string, data: UpdateAlbumDto) {
    const album = await this.prisma.album.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!album) throw new NotFoundException('Álbum não encontrado');

    const updateData: any = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
      updateData.slug = await this.generateUniqueSlugForUpdate(
        'album',
        data.title,
        id,
      );
    }
    if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;
    if (data.upc !== undefined) updateData.upc = normalizeUPC(data.upc);
    if (data.releaseDate !== undefined) {
      updateData.releaseDate = data.releaseDate
        ? new Date(data.releaseDate)
        : null;
    }

    return this.prisma.album.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        upc: true,
        releaseDate: true,
      },
    });
  }

  async createTrack(dto: CreateTrackDto) {
    const slug = await this.generateUniqueSlug('track', dto.title);

    let artistId = dto.artistId;
    if (!artistId) {
      const defaultArtist = await this.prisma.artist.findUnique({
        where: { name: 'Joseph Matthos' },
      });
      if (!defaultArtist) {
        throw new ConflictException('Artista padrão não configurado');
      }
      artistId = defaultArtist.id;
    }

    let trackNumber: number | null = null;
    if (dto.albumId) {
      const max = await this.prisma.track.aggregate({
        where: { albumId: dto.albumId },
        _max: { trackNumber: true },
      });
      trackNumber = (max._max.trackNumber ?? 0) + 1;
    }

    return this.prisma.track.create({
      data: {
        title: dto.title,
        slug,
        trackNumber,
        albumId: dto.albumId,
        artistId,
        isrc: normalizeISRC(dto.isrc),
        upc: normalizeUPC(dto.upc),
        genre: dto.genre,
        mood: dto.mood,
        durationSeconds: dto.durationSeconds,
        status: TrackStatus.DRAFT,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        trackNumber: true,
        isrc: true,
        upc: true,
        status: true,
        genre: true,
        mood: true,
        durationSeconds: true,
        createdAt: true,
        artist: { select: { id: true, name: true } },
        album: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  async updateTrack(id: string, data: UpdateTrackDto) {
    await this.ensureTrackExists(id);

    const updateData: any = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
      updateData.slug = await this.generateUniqueSlugForUpdate(
        'track',
        data.title,
        id,
      );
    }
    if (data.isrc !== undefined) updateData.isrc = normalizeISRC(data.isrc);
    if (data.upc !== undefined) updateData.upc = normalizeUPC(data.upc);
    if (data.genre !== undefined) updateData.genre = data.genre;
    if (data.mood !== undefined) updateData.mood = data.mood;
    if (data.durationSeconds !== undefined)
      updateData.durationSeconds = data.durationSeconds;

    return this.prisma.track.update({
      where: { id },
      data: updateData,
      select: PUBLIC_TRACK_SELECT,
    });
  }

  async publishTrack(id: string) {
    await this.ensureTrackExists(id);

    const track = await this.prisma.track.update({
      where: { id },
      data: { status: TrackStatus.PUBLISHED },
      select: PUBLIC_TRACK_SELECT,
    });

    await this.ensureRentalProducts(id);

    return track;
  }

  async archiveTrack(id: string) {
    await this.ensureTrackExists(id);
    return this.prisma.track.update({
      where: { id },
      data: { status: TrackStatus.ARCHIVED },
      select: PUBLIC_TRACK_SELECT,
    });
  }

  async reorderAlbumTracks(albumId: string, orderedIds: string[]) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true },
    });
    if (!album) throw new NotFoundException('Álbum não encontrado');

    const tracks = await this.prisma.track.findMany({
      where: { albumId, id: { in: orderedIds } },
      select: { id: true },
    });

    if (tracks.length !== orderedIds.length) {
      throw new NotFoundException(
        'Uma ou mais faixas não pertencem a este álbum',
      );
    }

    await this.prisma.$transaction(
      orderedIds.map((trackId, index) =>
        this.prisma.track.update({
          where: { id: trackId },
          data: { trackNumber: index + 1 },
        }),
      ),
    );

    return { ok: true, count: orderedIds.length };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async ensureRentalProducts(trackId: string) {
    const existing = await this.prisma.rentalProduct.count({
      where: { trackId },
    });
    if (existing > 0) return;

    const tiers = [
      { hours: 24,  name: '24 horas', priceCents: 290,  sortOrder: 1 },
      { hours: 48,  name: '48 horas', priceCents: 490,  sortOrder: 2 },
      { hours: 72,  name: '3 dias',   priceCents: 690,  sortOrder: 3 },
      { hours: 120, name: '5 dias',   priceCents: 990,  sortOrder: 4 },
      { hours: 240, name: '10 dias',  priceCents: 1290, sortOrder: 5 },
      { hours: 360, name: '15 dias',  priceCents: 1990, sortOrder: 6 },
    ];

    await this.prisma.rentalProduct.createMany({
      data: tiers.map((t) => ({
        trackId,
        name: t.name,
        durationHours: t.hours,
        priceCents: t.priceCents,
        currency: 'BRL',
        active: true,
        sortOrder: t.sortOrder,
      })),
    });
  }

  private async ensureTrackExists(id: string) {
    const exists = await this.prisma.track.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Faixa não encontrada');
  }

  private slugify(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  private async generateUniqueSlug(
    kind: 'album' | 'track',
    title: string,
  ): Promise<string> {
    const base = this.slugify(title) || kind;
    let candidate = base;
    let n = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing =
        kind === 'album'
          ? await this.prisma.album.findUnique({
              where: { slug: candidate },
              select: { id: true },
            })
          : await this.prisma.track.findUnique({
              where: { slug: candidate },
              select: { id: true },
            });

      if (!existing) return candidate;
      n += 1;
      candidate = `${base}-${n}`;
    }
  }

  private async generateUniqueSlugForUpdate(
    kind: 'album' | 'track',
    title: string,
    ignoreId: string,
  ): Promise<string> {
    const base = this.slugify(title) || kind;
    let candidate = base;
    let n = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing =
        kind === 'album'
          ? await this.prisma.album.findUnique({
              where: { slug: candidate },
              select: { id: true },
            })
          : await this.prisma.track.findUnique({
              where: { slug: candidate },
              select: { id: true },
            });

      if (!existing || existing.id === ignoreId) return candidate;
      n += 1;
      candidate = `${base}-${n}`;
    }
  }
}