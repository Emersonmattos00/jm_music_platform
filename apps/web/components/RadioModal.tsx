'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePlayer } from '@/lib/player';
import { Track } from '@/lib/api';
import { fetchRadioTracks, fetchRadioAccess, RadioAccess } from '@/lib/radio';

interface Props {
  onClose: () => void;
}

export function RadioModal({ onClose }: Props) {
  const { isAuthenticated } = useAuth();
  const { playQueue, current, isPlaying, next, toggle } = usePlayer();

  const [access, setAccess] = useState<RadioAccess | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [acc, list] = await Promise.all([
          isAuthenticated ? fetchRadioAccess() : Promise.resolve(null),
          fetchRadioTracks(300),
        ]);
        if (!cancelled) {
          setAccess(
            acc ?? {
              hasAccess: false,
              isAdmin: false,
              isSubscriber: false,
              subscription: null,
            },
          );
          setTracks(list);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleStart() {
    if (tracks.length === 0) return;
    setStarting(true);
    try {
      // Embaralha
      const shuffled = [...tracks];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      await playQueue(shuffled, 0);
    } finally {
      setStarting(false);
    }
  }

  const isSubscriber = access?.hasAccess === true;
  const nowPlaying = current;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/75 flex items-start md:items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[#0f141a] border border-line rounded-2xl p-6 shadow-2xl my-8">
        <div className="flex items-start justify-end mb-1">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 grid place-items-center rounded-full text-muted hover:text-text"
          >
            ✕
          </button>
        </div>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📻</div>
          <h2 className="text-2xl font-black">
            Rádio <span className="text-gold">Joseph Matthos</span>
          </h2>
          <p className="text-muted text-sm mt-2">
            Toda a discografia, em ordem aleatória, sem parar.
          </p>
        </div>

        {loading && (
          <div className="text-muted text-center py-10">Carregando…</div>
        )}

        {error && (
          <div className="text-red-400 text-sm text-center py-4">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Bloqueado */}
            {!isSubscriber && (
              <>
                <div className="bg-[#151b23] border border-gold/30 rounded-xl p-6 text-center mb-5">
                  <div className="text-3xl mb-3">🔒</div>
                  <div className="font-bold text-gold2 mb-2">
                    Exclusivo para assinantes
                  </div>
                  <p className="text-muted text-sm leading-relaxed">
                    A Rádio Joseph Matthos toca <strong>toda a discografia</strong> em
                    ordem aleatória, sem parar.
                  </p>
                  <p className="text-muted text-sm mt-3">
                    Assine o Premium para ouvir sem limites, com downloads inclusos.
                  </p>
                </div>

                <Link
                  href="/plans"
                  onClick={onClose}
                  className="block w-full py-3.5 rounded-xl font-bold text-center bg-gold text-[#16130c] hover:bg-gold2 transition mb-2"
                >
                  ASSINAR PREMIUM
                </Link>

                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="w-full py-3 rounded-xl font-bold border border-line hover:border-gold transition text-sm"
                >
                  JÁ SOU ASSINANTE
                </button>

                <div className="text-xs text-muted text-center mt-4">
                  {tracks.length} faixas disponíveis para assinantes
                </div>
              </>
            )}

            {/* Liberado (assinante/admin) */}
            {isSubscriber && (
              <>
                {nowPlaying ? (
                  <div className="bg-[#151b23] border border-gold/30 rounded-xl p-5 text-center mb-5">
                    <div className="aspect-square w-32 h-32 mx-auto rounded-lg overflow-hidden mb-4 shadow-lg">
                      {nowPlaying.album?.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={nowPlaying.album.coverUrl}
                          alt={nowPlaying.album.title ?? nowPlaying.title}
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

                    <div className="text-[11px] uppercase tracking-[2px] text-gold font-extrabold">
                      Tocando agora
                    </div>
                    <div className="font-bold text-lg mt-1 truncate">
                      {nowPlaying.title}
                    </div>
                    <div className="text-muted text-sm truncate">
                      {nowPlaying.album?.title ?? 'JM Music'} ·{' '}
                      {nowPlaying.artist?.name ?? 'Joseph Matthos'}
                    </div>

                    <div className="flex gap-3 justify-center mt-5">
                      <button
                        onClick={toggle}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
                      >
                        {isPlaying ? '⏸ Pausar' : '▶ Retomar'}
                      </button>
                      <button
                        onClick={next}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold border border-line hover:border-gold transition"
                      >
                        ⏭ Próxima
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#151b23] border border-gold/30 rounded-xl p-6 text-center mb-5">
                    <div className="text-3xl mb-3">📻</div>
                    <div className="font-bold text-gold2 mb-2">
                      Pronto para tocar
                    </div>
                    <p className="text-muted text-sm">
                      Comece a tocar a discografia completa em ordem aleatória.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleStart}
                  disabled={starting || tracks.length === 0}
                  className="w-full py-3.5 rounded-xl font-bold bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50 mb-2"
                >
                  {starting
                    ? 'Iniciando…'
                    : nowPlaying
                    ? '🔄 EMBARALHAR DE NOVO'
                    : '▶ COMEÇAR A TOCAR'}
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl border border-line hover:border-gold transition text-sm"
                >
                  MINIMIZAR (CONTINUA TOCANDO)
                </button>

                <div className="flex justify-center gap-4 text-xs text-muted mt-5">
                  <span>
                    <strong className="text-gold2">{tracks.length}</strong> faixas na fila
                  </span>
                  <span>·</span>
                  <span className="text-gold2">🔀 aleatório</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}