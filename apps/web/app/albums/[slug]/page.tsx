'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, Album, Track } from '@/lib/api';
import { usePlayer } from '@/lib/player';
import { useAuth } from '@/lib/auth';
import { RentModal } from '@/components/RentModal';
import { formatYear, formatPrice } from '@/lib/format';

interface AlbumDetail extends Album {
  upc: string | null;        // 🆕
  tracks: Track[];
}

export default function AlbumPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const { playQueue, current, isPlaying, toggle } = usePlayer();
  const { isAuthenticated } = useAuth();

  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentTrack, setRentTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    api
      .getAlbum(slug)
      .then((a) => {
        if (!cancelled) setAlbum(a as AlbumDetail);
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
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-muted">
        Carregando…
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-2xl font-bold mb-2">Álbum não encontrado</h1>
        <p className="text-muted mb-6">{error ?? 'Tente outro link.'}</p>
        <Link
          href="/albums"
          className="inline-block px-4 py-2 rounded-lg border border-line hover:border-gold transition"
        >
          ← Voltar para discografia
        </Link>
      </div>
    );
  }

  const tracks = album.tracks ?? [];

  function handlePlayAll() {
    if (tracks.length === 0) return;
    playQueue(tracks, 0);
  }

  function handlePlayTrack(track: Track) {
    if (current?.id === track.id) {
      toggle();
      return;
    }
    playQueue(
      tracks,
      tracks.findIndex((t) => t.id === track.id),
    );
  }

  const isAlbumPlaying =
    current && tracks.some((t) => t.id === current.id) && isPlaying;

  function openRentAlbum() {
    if (tracks.length === 0) return;
    setRentTrack(tracks[0]);
  }

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-6">
        <Link href="/albums" className="text-sm text-muted hover:text-gold2">
          ← Discografia
        </Link>

        {/* Cabeçalho */}
        <div className="grid md:grid-cols-[260px_1fr] gap-8 mt-6 mb-10">
          <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
            {album.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-full h-full object-cover"
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

          <div className="flex flex-col justify-end">
            <div className="text-gold uppercase text-xs font-extrabold tracking-[2px] mb-3">
              Álbum
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-3">
              {album.title}
            </h1>
            <p className="text-muted">
              {album.artist?.name ?? 'Joseph Matthos'}
              {album.releaseDate ? ` · ${formatYear(album.releaseDate)}` : ''}
              {tracks.length > 0 ? ` · ${tracks.length} faixas` : ''}
            </p>

            {album.upc && (
              <p className="text-xs text-muted mt-2 font-mono">
                UPC: {album.upc}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handlePlayAll}
                disabled={tracks.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
              >
                {isAlbumPlaying ? '⏸ Pausar álbum' : '▶ Reproduzir álbum'}
              </button>

              <button
                onClick={openRentAlbum}
                disabled={tracks.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold border border-gold text-gold2 hover:bg-[#e7b95f15] transition disabled:opacity-50"
              >
                🔒 Alugar álbum
              </button>
            </div>
          </div>
        </div>

        {/* Lista de faixas */}
        <div>
          <div className="grid grid-cols-[40px_1fr_80px_130px_140px] md:grid-cols-[40px_1fr_100px_140px_180px] gap-3 px-3 pb-3 border-b border-line text-xs uppercase tracking-wide text-muted font-bold">
            <div>#</div>
            <div>Título</div>
            <div className="text-right">Duração</div>
            <div className="text-right">Preço</div>
            <div className="text-right">Ações</div>
          </div>

          <div>
            {tracks.map((track, index) => {
              const isCurrent = current?.id === track.id;
              const isThisPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  className={`grid grid-cols-[40px_1fr_80px_130px_140px] md:grid-cols-[40px_1fr_100px_140px_180px] gap-3 px-3 py-3 rounded-lg items-center transition ${
                    isCurrent ? 'bg-[#e7b95f10]' : 'hover:bg-[#1b2430]'
                  }`}
                >
                  <div className="text-muted text-sm tabular-nums">
                    {isThisPlaying ? (
                      <span className="text-gold2">▶</span>
                    ) : (
                      String(index + 1).padStart(2, '0')
                    )}
                  </div>

                  <Link
                    href={`/tracks/${track.slug}`}
                    className={`truncate font-medium hover:underline ${
                      isCurrent ? 'text-gold2' : ''
                    }`}
                  >
                    {track.title}
                  </Link>

                  <div className="text-right text-muted text-sm tabular-nums">
                    {track.durationSeconds
                      ? `${Math.floor(track.durationSeconds / 60)}:${String(
                          track.durationSeconds % 60,
                        ).padStart(2, '0')}`
                      : '—'}
                  </div>

                  <div className="text-right text-gold2 font-semibold text-sm whitespace-nowrap">
                    A partir de {formatPrice(290, 'BRL')}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handlePlayTrack(track)}
                      aria-label="Ouvir"
                      className="w-9 h-9 grid place-items-center rounded-full border border-line hover:border-gold transition"
                    >
                      {isThisPlaying ? '⏸' : '▶'}
                    </button>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          window.location.href = '/login';
                          return;
                        }
                        setRentTrack(track);
                      }}
                      aria-label="Alugar"
                      className="w-9 h-9 grid place-items-center rounded-full border border-line hover:border-gold transition"
                    >
                      🔒
                    </button>
                  </div>
                </div>
              );
            })}

            {tracks.length === 0 && (
              <div className="text-center text-muted py-10 border border-dashed border-line rounded-xl mt-4">
                Nenhuma faixa publicada neste álbum.
              </div>
            )}
          </div>
        </div>
      </div>

      {rentTrack && (
        <RentModal
          track={rentTrack}
          initialTab={
            tracks.length > 0 && tracks[0].id === rentTrack.id ? 'album' : 'track'
          }
          onClose={() => setRentTrack(null)}
          onConfirmed={() => {
            setRentTrack(null);
            window.location.reload();
          }}
        />
      )}
    </section>
  );
}