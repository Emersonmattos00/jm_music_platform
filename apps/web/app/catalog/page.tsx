'use client';

import { useEffect, useState } from 'react';
import { api, ArtistDetail, Album } from '@/lib/api';
import { HeroArtist } from '@/components/HeroArtist';
import { AlbumCarousel } from '@/components/AlbumCarousel';
import { HighlightsList } from '@/components/HighlightsList';

export default function CatalogPage() {
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getArtist('joseph-matthos'), api.listAlbums()])
      .then(([a, al]) => {
        if (cancelled) return;
        setArtist(a);
        setAlbums(al);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-muted">Carregando…</div>
    );
  }

  if (error || !artist) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-2xl font-bold mb-2">Catálogo indisponível</h1>
        <p className="text-muted">{error ?? 'Tente novamente em instantes.'}</p>
      </div>
    );
  }

  // Ordena por releaseDate desc para os destaques
  const highlights = [...albums].sort((a, b) => {
    const da = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
    const db = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
    return db - da;
  });

  return (
    <>
      <HeroArtist artist={artist} />
      <AlbumCarousel title="Lançamentos" albums={albums} />
      <HighlightsList albums={highlights} />
    </>
  );
}