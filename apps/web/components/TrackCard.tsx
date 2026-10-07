'use client';

import Link from 'next/link';
import { Track } from '@/lib/api';
import { usePlayer } from '@/lib/player';

interface Props {
  track: Track;
  onPlay?: (track: Track) => void;
}

export function TrackCard({ track, onPlay }: Props) {
  const { current, isPlaying, toggle } = usePlayer();
  const isCurrent = current?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;

  function handlePlayClick() {
    if (isCurrent) {
      toggle();
      return;
    }
    onPlay?.(track);
  }

  return (
    <article
      className={`bg-panel border rounded-2xl p-4 transition-all hover:-translate-y-[3px] ${
        isCurrent ? 'border-gold shadow-[0_0_0_1px_rgba(231,185,95,0.35)]' : 'border-line hover:border-[#78623a]'
      }`}
    >
      <div
        className="h-[140px] rounded-xl mb-4 p-4 flex items-end relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)',
        }}
      >
        <div
          className="absolute w-[130px] h-[130px] border border-white/20 rounded-full -right-4 -top-6"
          style={{
            boxShadow: '0 0 0 18px rgba(255,255,255,0.035), 0 0 0 38px rgba(255,255,255,0.03)',
          }}
        />
        <span className="text-lg font-black leading-tight max-w-[70%] relative z-10">
          {track.title}
        </span>

        {isThisPlaying && (
          <div className="absolute top-3 right-3 flex items-end gap-0.5 h-4">
            <span className="w-0.5 bg-gold animate-eq-1" />
            <span className="w-0.5 bg-gold animate-eq-2" />
            <span className="w-0.5 bg-gold animate-eq-3" />
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`m-0 text-base font-semibold truncate ${isCurrent ? 'text-gold2' : ''}`}>
            {track.title}
          </h3>
          <p className="text-muted text-sm mt-1 truncate">
            {track.artist?.name ?? 'JM Music'} {track.genre ? `· ${track.genre}` : ''}
          </p>
        </div>
        {track.mood && (
          <span className="text-[11px] px-2 py-1 border border-[#3c4a58] rounded-md text-[#c6d1dc] whitespace-nowrap h-max">
            {track.mood}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-4">
        <span className="text-sm text-muted tabular-nums">
          {track.durationSeconds
            ? `${Math.floor(track.durationSeconds / 60)}:${String(track.durationSeconds % 60).padStart(2, '0')}`
            : '—'}
        </span>

        <div className="flex gap-2">
          {onPlay && (
            <button
              onClick={handlePlayClick}
              aria-label={isThisPlaying ? 'Pausar' : 'Ouvir'}
              className={`px-3 py-2 rounded-lg border transition text-sm ${
                isCurrent
                  ? 'border-gold text-gold2 bg-[#e7b95f15]'
                  : 'border-line hover:border-gold'
              }`}
            >
              {isThisPlaying ? '⏸' : '▶'}
            </button>
          )}
          <Link
            href={`/tracks/${track.slug}`}
            className="px-3 py-2 rounded-lg border border-line hover:border-gold transition text-sm"
          >
            Detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}