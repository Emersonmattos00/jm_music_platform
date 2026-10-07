'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Album } from '@/lib/api';
import { formatYear } from '@/lib/format';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listAlbums()
      .then((list) => {
        if (!cancelled) setAlbums(list);
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

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/catalog" className="text-sm text-muted hover:text-gold2">
            ← Voltar
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mt-4">Discografia</h1>
          <p className="text-muted mt-2">
            {albums.length} {albums.length === 1 ? 'álbum' : 'álbuns'} de Joseph Matthos
          </p>
        </div>

        {loading && <div className="text-muted py-10 text-center">Carregando…</div>}
        {error && <div className="text-red-400 py-10 text-center">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/albums/${album.slug}`}
                className="group block"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-3 shadow-lg group-hover:scale-[1.02] transition-transform">
                  {album.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        background:
                          'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)',
                      }}
                    />
                  )}
                </div>
                <div className="font-semibold text-sm truncate group-hover:text-gold2 transition">
                  {album.title}
                </div>
                <div className="text-muted text-xs mt-1 truncate">
                  {album.artist?.name ?? 'Joseph Matthos'} ·{' '}
                  {formatYear(album.releaseDate)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}