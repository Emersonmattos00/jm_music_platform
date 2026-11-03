'use client';

import { useState } from 'react';
import { usePlayer } from '@/lib/player';
import { RentModal } from '@/components/RentModal';

export function PlayerFull() {
  const {
    current,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    toggle,
    previous,
    next,
    seek,
    closeFullScreen,
    toggleShuffle,
    cycleRepeat,
    isPreview,
    shuffle,
    repeat,
  } = usePlayer();

  const [isRentModalOpen, setIsRentModalOpen] = useState(false);

  if (!current) return null;

  const cover = current.album?.coverUrl;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const goToPlans = () => {
    closeFullScreen();
    setTimeout(() => {
      window.location.href = '/plans';
    }, 100);
  };

  return (
    // AQUI: fixed inset-0 (trava a tela), overflow-hidden (sem rolagem)
    <div className="fixed inset-0 z-[9999] bg-[#0c1015] flex flex-col overflow-hidden h-[100dvh]">
      
      {/* Fundo */}
      {cover && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${cover})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1015]/60 via-[#0c1015]/90 to-[#0c1015] pointer-events-none" />

      {/* Container principal (flex-col para distribuir o espaço) */}
      <div className="relative z-10 flex flex-col h-full p-4 sm:p-6 pointer-events-auto">
        
        {/* Topo */}
        <div className="flex justify-between items-center mb-4 sm:mb-8 flex-shrink-0">
          <div className="flex gap-4 sm:gap-6 text-sm font-bold uppercase tracking-wider">
            <button className="text-gold2 border-b-2 border-gold2 pb-1">Tocando</button>
            <button className="text-muted hover:text-text transition">A seguir</button>
          </div>
          <button
            onClick={closeFullScreen}
            className="text-muted hover:text-white text-3xl transition p-2 cursor-pointer z-50"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Área central (capa e título) - flex-1 para ocupar o espaço restante */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 mb-4">
          <div className="w-full max-w-[280px] sm:max-w-md aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl mb-4 sm:mb-8 flex-shrink-0">
            {cover ? (
              <img src={cover} alt={current.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)' }} />
            )}
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-center mb-1 px-4 line-clamp-2">{current.title}</h2>
          <p className="text-muted text-xs sm:text-base text-center px-4 truncate w-full">
            {current.artist?.name ?? 'Joseph Matthos'}
            {current.album?.title ? ` · ${current.album.title}` : ''}
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="w-full max-w-md mx-auto mb-4 sm:mb-6 flex-shrink-0">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gold2"
            style={{ background: `linear-gradient(to right, #e7b95f ${progressPercent}%, #333 ${progressPercent}%)` }}
          />
          <div className="flex justify-between text-xs text-muted mt-1 font-mono">
            <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6 sm:mb-10 flex-shrink-0">
          <button onClick={toggleShuffle} className={`transition ${shuffle ? 'text-gold2' : 'text-muted hover:text-white'}`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button onClick={previous} className="text-white hover:text-gold2 transition">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-8 sm:h-8"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button onClick={toggle} disabled={isLoading} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold text-[#16130c] flex items-center justify-center shadow-lg hover:scale-105 transition disabled:opacity-50 flex-shrink-0">
            {isLoading ? <span className="text-xl animate-pulse">⏳</span> : isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 sm:w-10 sm:h-10"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 sm:w-10 sm:h-10 ml-1"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button onClick={next} className="text-white hover:text-gold2 transition">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-8 sm:h-8"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
          <button onClick={cycleRepeat} className={`transition relative ${repeat !== 'off' ? 'text-gold2' : 'text-muted hover:text-white'}`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[10px] font-bold">1</span>}
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="w-full max-w-md mx-auto mt-auto pb-4 flex gap-2 sm:gap-3 flex-shrink-0 z-50">
          <button onClick={() => setIsRentModalOpen(true)} type="button" className="flex-1 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base border-2 border-gold text-gold2 hover:bg-[#e7b95f15] transition flex items-center justify-center gap-2 cursor-pointer">
            🔒 Alugar
          </button>
          <button onClick={goToPlans} type="button" className="flex-1 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base bg-gold text-[#16130c] hover:bg-gold2 transition flex items-center justify-center gap-2 cursor-pointer">
            💎 Assinar PRO
          </button>
        </div>
      </div>

      {isRentModalOpen && (
        <RentModal track={current} initialTab="track" onClose={() => setIsRentModalOpen(false)} onConfirmed={() => setIsRentModalOpen(false)} onPlay={() => setIsRentModalOpen(false)} />
      )}
    </div>
  );
}