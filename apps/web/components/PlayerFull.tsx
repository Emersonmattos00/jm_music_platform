'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePlayer, formatTime } from '@/lib/player';
import { useAuth } from '@/lib/auth';
import { api, Track } from '@/lib/api';
import { RentModal } from './RentModal';

export function PlayerFull() {
  const {
    current,
    queue,
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    isFullScreen,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    closeFullScreen,
    play,
    isPreview,
  } = usePlayer();

  const { isAuthenticated } = useAuth();

  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [rentOpen, setRentOpen] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const currentTrackRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isFullScreen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isFullScreen]);

  useEffect(() => {
    if (!isFullScreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !rentOpen) closeFullScreen();
      if (e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullScreen, closeFullScreen, toggle, rentOpen]);

  useEffect(() => {
    if (isFullScreen && currentTrackRef.current) {
      currentTrackRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [current?.id, isFullScreen]);

  if (!isFullScreen || !current) return null;

  const displayTime = seeking ? seekValue : currentTime;
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

  function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSeekValue(parseFloat(e.target.value));
    setSeeking(true);
  }

  function handleSeekCommit(
    e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>,
  ) {
    const target = e.target as HTMLInputElement;
    const value = parseFloat(target.value);
    seek(value);
    setSeeking(false);
  }

  function isLocked(track: Track): boolean {
    if (current && track.id === current.id) return false;
    return isPreview;
  }

  async function handleQueuePlay(track: Track) {
    if (current?.id === track.id) {
      toggle();
      return;
    }
    await play(track, queue);
  }

  // ----------------------------------------------------------
  // ASSINAR → busca plano Pro Mensal e redireciona pro MP
  // ----------------------------------------------------------
  async function handleSubscribe() {
    if (!isAuthenticated) {
      window.location.href = '/login?next=/plans';
      return;
    }

    setSubscribing(true);
    try {
      const plans = await api.listPlans();
      const proPlan = plans.find(
        (p) =>
          p.intervalUnit === 'month' &&
          p.name.toLowerCase().includes('pro'),
      );

      if (!proPlan) {
        alert('Plano Pro não encontrado. Rode o seed no backend.');
        setSubscribing(false);
        return;
      }

      const res = await api.checkoutSubscription(proPlan.id);

      if (res.checkoutUrl) {
        sessionStorage.setItem(
          'jm_last_subscription_id',
          res.subscription.id,
        );
        window.location.href = res.checkoutUrl;
      } else {
        alert('Não foi possível iniciar o pagamento. Tente novamente.');
        setSubscribing(false);
      }
    } catch (e) {
      alert((e as Error).message);
      setSubscribing(false);
    }
  }

  // ----------------------------------------------------------
  // ALUGAR → abre modal
  // ----------------------------------------------------------
  function handleRent() {
    if (!isAuthenticated) {
      window.location.href = '/login?next=/catalog';
      return;
    }
    setRentOpen(true);
  }

  const showSubscribeButton = isPreview;
  const showRentButton = isPreview;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Fundo */}
      <div className="absolute inset-0 -z-10" style={{ background: '#05080c' }} />
      {current.album?.coverUrl && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${current.album.coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.12,
            filter: 'blur(3px)',
          }}
        />
      )}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(201,151,62,0.22), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(50,105,128,0.18), transparent 55%)',
        }}
      />

      {/* Botões topo direito */}
      <div className="absolute top-6 right-6 flex gap-3 z-20">
        <button
          onClick={() => {
            const el = document.documentElement;
            if (!document.fullscreenElement) {
              el.requestFullscreen?.().catch(() => undefined);
            } else {
              document.exitFullscreen?.();
            }
          }}
          aria-label="Tela cheia do navegador"
          className="w-11 h-11 rounded-full grid place-items-center bg-[#0f141a]/70 border border-line hover:border-gold transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
        <button
          onClick={closeFullScreen}
          aria-label="Fechar"
          className="w-11 h-11 rounded-full grid place-items-center bg-[#0f141a]/70 border border-line hover:border-gold transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="h-full w-full flex flex-col px-6 md:px-12 py-10">
        <div className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 max-w-7xl mx-auto w-full">
          {/* Coluna esquerda */}
          <div className="flex flex-col justify-center">
            {isPreview && (
              <div className="mb-4 inline-flex items-center gap-2 self-center lg:self-start bg-[#e7b95f] text-[#17120a] text-xs font-black px-3 py-1.5 rounded-full">
                🎧 PRÉVIA DE 30 SEGUNDOS
              </div>
            )}

            <div className="w-full max-w-[420px] mx-auto lg:mx-0 aspect-square rounded-2xl overflow-hidden shadow-2xl">
              {current.album?.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.album.coverUrl}
                  alt={current.album.title ?? current.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full p-6 flex flex-col justify-between"
                  style={{
                    background: 'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)',
                  }}
                >
                  <div className="text-xs tracking-[2px] font-bold">
                    {(current.album?.title ?? 'JM MUSIC').toUpperCase()}
                  </div>
                  <div className="text-3xl md:text-4xl font-black leading-tight">
                    {current.title}
                  </div>
                  <div className="text-xs tracking-[2px]">
                    {(current.artist?.name ?? 'JOSEPH MATTHOS').toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl font-black">{current.title}</h1>
              <p className="text-muted mt-2">
                {current.artist?.name ?? 'JM Music'}
                {current.album?.title ? ` · ${current.album.title}` : ''}
              </p>
            </div>

            <div className="mt-8">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={displayTime}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                className="w-full accent-[#e7b95f] cursor-pointer"
                aria-label="Progresso"
              />
              <div className="flex justify-between text-xs text-muted tabular-nums mt-1">
                <span>{formatTime(displayTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center lg:justify-start gap-5">
              <button
                onClick={toggleShuffle}
                aria-label="Aleatório"
                className={`w-10 h-10 grid place-items-center rounded-full transition ${
                  shuffle ? 'text-gold2' : 'text-muted hover:text-text'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                className="w-12 h-12 grid place-items-center rounded-full text-muted hover:text-text transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zM9.5 12l8.5 6V6z" />
                </svg>
              </button>

              <button
                onClick={toggle}
                disabled={isLoading}
                aria-label={isPlaying ? 'Pausar' : 'Tocar'}
                className="w-16 h-16 grid place-items-center rounded-full bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="30 10" />
                  </svg>
                ) : isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={next}
                aria-label="Próxima"
                className="w-12 h-12 grid place-items-center rounded-full text-muted hover:text-text transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" />
                </svg>
              </button>

              <button
                onClick={cycleRepeat}
                aria-label="Repetir"
                className={`w-10 h-10 grid place-items-center rounded-full transition ${
                  repeat !== 'off' ? 'text-gold2' : 'text-muted hover:text-text'
                }`}
              >
                {repeat === 'one' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    <text x="12" y="16" fontSize="7" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="bold">1</text>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center lg:justify-start gap-3">
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
                className="w-40 accent-[#e7b95f]"
                aria-label="Volume"
              />
            </div>

            {/* BOTÕES DE AÇÃO */}
            {(showSubscribeButton || showRentButton) && (
              <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
                {showSubscribeButton && (
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="px-6 py-3 rounded-full font-bold bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
                  >
                    {subscribing ? 'Redirecionando…' : '💎 ASSINAR PRO — R$ 19,90/MÊS'}
                  </button>
                )}
                {showRentButton && (
                  <button
                    onClick={handleRent}
                    className="px-6 py-3 rounded-full font-bold border border-line hover:border-gold transition"
                  >
                    🔓 ALUGAR ESTA FAIXA
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="mt-5 text-sm text-red-400 text-center lg:text-left">
                {error}
              </div>
            )}
          </div>

          {/* Coluna direita */}
          <div className="flex flex-col justify-center min-h-0">
            <div className="hidden lg:flex flex-col min-h-0 mb-8 max-h-[40vh]">
              <div className="text-xs uppercase tracking-[2px] text-gold font-extrabold mb-4">
                Letra
              </div>
              <div className="overflow-y-auto pr-2 text-[#e6dfc9] text-lg leading-relaxed">
                <p className="text-muted italic">
                  Letra ainda não disponível para esta faixa.
                </p>
              </div>
            </div>

            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase tracking-[2px] text-gold font-extrabold">
                  A seguir
                </div>
                <div className="text-xs text-muted">
                  {queue.length} {queue.length === 1 ? 'faixa' : 'faixas'}
                </div>
              </div>

              <div className="overflow-y-auto pr-2 flex-1 space-y-1 max-h-[40vh]">
                {queue.map((t, i) => {
                  const isCurrent = current.id === t.id;
                  const locked = isLocked(t);
                  const cover = t.album?.coverUrl;
                  return (
                    <button
                      key={`${t.id}-${i}`}
                      ref={isCurrent ? currentTrackRef : null}
                      onClick={() => handleQueuePlay(t)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${
                        isCurrent
                          ? 'bg-[#e7b95f15] border border-gold/40'
                          : 'hover:bg-[#1b2430]'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-md flex-shrink-0 overflow-hidden">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={t.album?.title ?? t.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-end p-1.5"
                            style={{
                              background:
                                'linear-gradient(135deg, #202e3a, #6f5227, #d0a34c)',
                            }}
                          >
                            <span className="text-[8px] font-black leading-tight line-clamp-2">
                              {t.title}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`truncate text-sm ${
                            isCurrent ? 'text-gold2' : ''
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="text-xs text-muted truncate">
                          {t.artist?.name ?? 'JM Music'}
                        </div>
                      </div>
                      <div className="text-xs text-muted tabular-nums w-10 text-right">
                        {t.durationSeconds
                          ? `${Math.floor(t.durationSeconds / 60)}:${String(
                              t.durationSeconds % 60,
                            ).padStart(2, '0')}`
                          : '—'}
                      </div>
                      {locked && <span className="text-muted text-sm ml-1">🔒</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de aluguel */}
      {rentOpen && current && (
        <RentModal
          track={current}
          onClose={() => setRentOpen(false)}
          onConfirmed={() => {
            setRentOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}