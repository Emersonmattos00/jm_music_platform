'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, Track } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { usePlayer } from '@/lib/player';

export default function TrackPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { isAuthenticated } = useAuth();
  const { play, current, isPlaying, toggle } = usePlayer();

  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    api
      .getTrack(slug)
      .then((t) => {
        if (!cancelled) setTrack(t);
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
  }, [slug]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-6 py-20 text-muted">Carregando…</div>;
  }

  if (error || !track) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-2xl font-bold mb-2">Faixa não encontrada</h1>
        <p className="text-muted mb-6">{error ?? 'Verifique o link ou volte ao catálogo.'}</p>
        <Link
          href="/catalog"
          className="inline-block px-4 py-2 rounded-lg border border-line hover:border-gold transition"
        >
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const isThisPlaying = current?.id === track.id && isPlaying;
  const cover = track.album?.coverUrl;

  return (
    <section className="py-14">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/catalog" className="text-sm text-muted hover:text-gold2">
          ← Catálogo
        </Link>

        <div className="grid md:grid-cols-[280px_1fr] gap-8 mt-6">
          {/* Capa do álbum */}
          <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={track.album?.title ?? track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full p-6 flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)',
                }}
              >
                <div className="text-xs tracking-[2px]">JM MUSIC</div>
                <div className="text-2xl font-black leading-tight">{track.title}</div>
                <div className="text-xs tracking-[2px]">
                  {track.artist?.name?.toUpperCase() ?? 'JOSEPH MATTHOS'}
                </div>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-black">{track.title}</h1>
            <p className="text-muted mt-2">
              {track.artist?.name ?? 'JM Music'}
              {track.genre && ` · ${track.genre}`}
              {track.mood && ` · ${track.mood}`}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => (current?.id === track.id ? toggle() : play(track))}
                  className="px-5 py-3 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
                >
                  {isThisPlaying ? '⏸ Pausar' : '▶ Tocar'}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-3 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
                >
                  Entrar para ouvir
                </Link>
              )}
              <Link
                href="/plans"
                className="px-5 py-3 rounded-lg border border-line hover:border-gold transition"
              >
                Ver planos
              </Link>
            </div>

            <div className="mt-8 text-sm text-muted space-y-1">
              <div>
                <strong className="text-text">Duração:</strong>{' '}
                {track.durationSeconds
                  ? `${Math.floor(track.durationSeconds / 60)}:${String(
                      track.durationSeconds % 60,
                    ).padStart(2, '0')}`
                  : '—'}
              </div>
              <div>
                <strong className="text-text">Status:</strong> {track.status}
              </div>
              {track.album && (
                <div>
                  <strong className="text-text">Álbum:</strong>{' '}
                  <Link
                    href={`/albums/${track.album.slug}`}
                    className="text-gold2 hover:underline"
                  >
                    {track.album.title}
                  </Link>
                </div>
              )}
                            {(track as any).isrc && (
                <div>
                  <strong className="text-text">ISRC:</strong>{' '}
                  <span className="font-mono">{(track as any).isrc}</span>
                </div>
              )}
              {(track as any).upc && (
                <div>
                  <strong className="text-text">UPC:</strong>{' '}
                  <span className="font-mono">{(track as any).upc}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}