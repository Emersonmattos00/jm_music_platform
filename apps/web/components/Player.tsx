'use client';

import { useEffect, useRef, useState } from 'react';
import { api, PlaybackResponse, Track } from '@/lib/api';

interface Props {
  track: Track;
  onClose: () => void;
}

export function Player({ track, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playback, setPlayback] = useState<PlaybackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setPlayback(null);
      try {
        const res = await api.authorize(track.id);
        if (!cancelled) {
          setPlayback(res);
          // Toca automaticamente
          setTimeout(() => {
            audioRef.current?.play().catch(() => {
              // Alguns navegadores exigem gesto do usuário
            });
          }, 100);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const err = e as { status?: number; message?: string };
          if (err.status === 403) {
            setError('Você não tem assinatura ou licença para esta faixa.');
          } else if (err.status === 401) {
            setError('Faça login para ouvir esta faixa.');
          } else {
            setError(err.message ?? 'Erro ao carregar o áudio');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [track.id]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => setError('Não foi possível reproduzir'));
    } else {
      a.pause();
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-panel/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
        <button
          onClick={togglePlay}
          disabled={!playback}
          className="w-11 h-11 rounded-full bg-gold text-[#111] grid place-items-center disabled:opacity-40"
          aria-label={playing ? 'Pausar' : 'Tocar'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{track.title}</div>
          <div className="text-sm text-muted truncate">
            {track.artist?.name ?? 'JM Music'}
            {playback?.isPreview && ' · prévia'}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 max-w-md text-right">{error}</div>
        )}

        {loading && !error && (
          <div className="text-sm text-muted">Carregando…</div>
        )}

        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg border border-line hover:border-gold transition text-sm"
        >
          Fechar
        </button>
      </div>

      {playback && (
        <audio
          ref={audioRef}
          src={playback.url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => setError('Erro ao reproduzir o áudio')}
        />
      )}
    </div>
  );
}