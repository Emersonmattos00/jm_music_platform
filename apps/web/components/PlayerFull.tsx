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
  const [activeTab, setActiveTab] = useState<'player' | 'queue'>('player');

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#05080c]">
      {current.album?.coverUrl && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${current.album.coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
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

      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button
          onClick={() => {
            const el = document.documentElement;
            if (!document.fullscreenElement) {
              el.requestFullscreen?.().catch(() => undefined);
            } else {
              document.exitFullscreen?.();
            }
          }}
          className="w-10 h-10 rounded-full grid place-items-center bg-[#0f141a]/70 border border-line"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
        <button
          onClick={closeFullScreen}
          className="w-10 h-10 rounded-full grid place-items-center bg-[#0f141a]/70 border border-line"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex md:hidden justify-center gap-4 pt-16 pb-4">
        <button
          onClick={() => setActiveTab('player')}
          className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition ${
            activeTab === 'player' ? 'border-gold text-gold' : 'border-transparent text-muted'
          }`}
        >
          Tocando
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition ${
            activeTab === 'queue' ? 'border-gold text-gold' : 'border-transparent text-muted'
          }`}
        >
          A seguir ({queue.length})
        </button>
      </div>

      <div className="h-full flex flex-col px-4 md:px-12 pt-4 pb-6 md:pt-10 overflow-y-auto">
        <div className="flex-1 grid md:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
          
          <div className={`flex flex-col justify-center ${activeTab === 'queue' ? 'hidden md:flex' : 'flex'}`}>
            {isPreview && (
              <div className="mb-4 inline-flex items-center gap-2 self-center md:self-start bg-[#e7b95f] text-[#17120a] text-xs font-black px-3 py-1.5 rounded-full">
                🎧 PRÉVIA DE 30 SEGUNDOS
              </div>
            )}

            <div className="w-full max-w-[280px] md:max-w-[420px] mx-auto aspect-square rounded-2xl overflow-hidden shadow-2xl">
              {current.album?.coverUrl ? (
                <img
                  src={current.album.coverUrl}
                  alt={current.album.title ?? current.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br from-[#202e3a] to-[#d0a34c]">
                  <div className="text-xs tracking-[2px] font-bold">{(current.album?.title ?? 'JM MUSIC').toUpperCase()}</div>
                  <div className="text-3xl font-black">{current.title}</div>
                  <div className="text-xs tracking-[2px]">{(current.artist?.name ?? 'JOSEPH MATTHOS').toUpperCase()}</div>
                </div>
              )}
            </div>

            <div className="mt-6 text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-black">{current.title}</h1>
              <p className="text-muted text-sm mt-1">
                {current.artist?.name ?? 'JM Music'}
                {current.album?.title ? ` · ${current.album.title}` : ''}
              </p>
            </div>

            <div className="mt-6">
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
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>{formatTime(displayTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center md:justify-start gap-4">
              <button onClick={toggleShuffle} className={`w-10 h-10 ${shuffle ? 'text-gold2' : 'text-muted'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>
              </button>
              <button onClick={previous} className="w-12 h-12 text-muted">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM9.5 12l8.5 6V6z" /></svg>
              </button>
              <button onClick={toggle} className="w-16 h-16 rounded-full bg-gold text-black flex items-center justify-center">
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <button onClick={next} className="w-12 h-12 text-muted">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" /></svg>
              </button>
              <button onClick={cycleRepeat} className={`w-10 h-10 ${repeat !== 'off' ? 'text-gold2' : 'text-muted'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
              </button>
            </div>

            {(showSubscribeButton || showRentButton) && (
              <div className="mt-6 flex flex-col md:flex-row gap-3 justify-center md:justify-start">
                {showSubscribeButton && (
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="px-6 py-3 rounded-full font-bold bg-gold text-[#16130c]"
                  >
                    {subscribing ? 'Redirecionando…' : '💎 ASSINAR PRO'}
                  </button>
                )}
                {showRentButton && (
                  <button
                    onClick={handleRent}
                    className="px-6 py-3 rounded-full font-bold border border-line hover:border-gold"
                  >
                    🔓 ALUGAR FAIXA
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={`flex flex-col min-h-0 ${activeTab === 'player' ? 'hidden md:flex' : 'flex'}`}>
             <div className="hidden md:flex flex-col min-h-0 mb-6">
              <div className="text-xs uppercase tracking-[2px] text-gold font-extrabold mb-3">Letra</div>
              <div className="text-[#e6dfc9] text-lg">Letra não disponível.</div>
            </div>

            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-[2px] text-gold font-extrabold">A seguir</div>
                <div className="text-xs text-muted">{queue.length} faixas</div>
              </div>
              <div className="overflow-y-auto pr-2 space-y-1 flex-1">
                {queue.map((t, i) => {
                  const isCurrent = current.id === t.id;
                  const locked = isLocked(t);
                  return (
                    <button
                      key={`${t.id}-${i}`}
                      onClick={() => handleQueuePlay(t)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition ${isCurrent ? 'bg-[#e7b95f15]' : 'hover:bg-[#1b2430]'}`}
                    >
                      <div className="w-10 h-10 rounded flex-shrink-0 overflow-hidden">
                        {t.album?.coverUrl ? <img src={t.album.coverUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`truncate text-sm ${isCurrent ? 'text-gold2' : ''}`}>{t.title}</div>
                        <div className="text-xs text-muted truncate">{t.artist?.name ?? 'JM Music'}</div>
                      </div>
                      {locked && <span className="text-muted text-xs">🔒</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {rentOpen && current && (
        <RentModal
          track={current}
          onClose={() => setRentOpen(false)}
          onConfirmed={() => setRentOpen(false)}
          onPlay={() => { play(current); setRentOpen(false); }}
        />
      )}
    </div>
  );
}
