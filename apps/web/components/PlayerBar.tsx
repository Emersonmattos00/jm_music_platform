'use client';

import Link from 'next/link';
import { usePlayer, formatTime } from '@/lib/player';
import { useAuth } from '@/lib/auth';

export function PlayerBar() {
  const {
    current,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    openFullScreen,
    close,
    isPreview,
  } = usePlayer();

  const { isAuthenticated } = useAuth();

  if (!current) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const cover = current.album?.coverUrl;

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-[#0f141a]/95 backdrop-blur">
      {/* 🎧 Banner de preview */}
      {isPreview && (
        <div className="bg-gradient-to-r from-[#e7b95f] to-[#f5d58e] text-[#17120a] text-xs md:text-sm font-bold py-2 px-4 flex items-center justify-center gap-3 flex-wrap">
          <span>🎧 Você está ouvindo uma prévia de 30s</span>
          <Link
            href="/plans"
            className="bg-[#17120a] text-gold2 px-3 py-1 rounded-full text-xs font-black hover:bg-[#202e3a] transition whitespace-nowrap"
          >
            {isAuthenticated ? 'Assinar por R$ 19,90 →' : 'Criar conta →'}
          </Link>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Capa + título */}
          <button
            onClick={openFullScreen}
            className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-90 transition"
          >
            <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden relative">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={current.album?.title ?? current.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = 'none';
                    if (el.parentElement) {
                      el.parentElement.style.background =
                        'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)';
                    }
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-end p-2"
                  style={{
                    background:
                      'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)',
                  }}
                >
                  <span className="text-[10px] font-black leading-tight line-clamp-2">
                    {current.title}
                  </span>
                </div>
              )}
              {isPreview && (
                <span className="absolute top-1 left-1 bg-[#e7b95f] text-[#17120a] text-[8px] font-black px-1.5 py-0.5 rounded">
                  PREVIEW
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate text-sm">{current.title}</div>
              <div className="text-muted text-xs truncate">
                {current.artist?.name ?? 'JM Music'}
                {current.album?.title ? ` · ${current.album.title}` : ''}
              </div>
            </div>
          </button>

          {/* Controles */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              aria-label="Aleatório"
              title="Aleatório"
              className={`hidden md:grid w-9 h-9 place-items-center rounded-full transition ${
                shuffle ? 'text-gold2' : 'text-muted hover:text-text'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </button>

            <button
              onClick={previous}
              aria-label="Anterior"
              className="w-9 h-9 grid place-items-center rounded-full text-muted hover:text-text transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zM9.5 12l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={toggle}
              aria-label={isPlaying ? 'Pausar' : 'Tocar'}
              className="w-11 h-11 grid place-items-center rounded-full bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="30 10" />
                </svg>
              ) : isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={next}
              aria-label="Próxima"
              className="w-9 h-9 grid place-items-center rounded-full text-muted hover:text-text transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" />
              </svg>
            </button>

            <button
              onClick={cycleRepeat}
              aria-label="Repetir"
              title="Repetir"
              className={`hidden md:grid w-9 h-9 place-items-center rounded-full transition ${
                repeat !== 'off' ? 'text-gold2' : 'text-muted hover:text-text'
              }`}
            >
              {repeat === 'one' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  <text x="12" y="16" fontSize="7" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="bold">1</text>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              )}
            </button>
          </div>

          {/* Progresso */}
          <div className="hidden md:flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs text-muted w-10 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <div
              onClick={handleSeek}
              className="flex-1 h-1 bg-[#2a3542] rounded-full cursor-pointer group relative"
            >
              <div
                className="h-full bg-gold rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            <span className="text-xs text-muted w-10 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume + close */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleMute}
              aria-label="Mudo"
              className="w-9 h-9 grid place-items-center rounded-full text-muted hover:text-text transition"
            >
              {muted || volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume < 0.5 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 accent-[#e7b95f]"
              aria-label="Volume"
            />
          </div>

          <button
            onClick={close}
            aria-label="Fechar player"
            className="w-9 h-9 grid place-items-center rounded-full text-muted hover:text-text transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}