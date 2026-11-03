'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/lib/player';
import { RentModal } from '@/components/RentModal';

export function PlayerFull() {
  const router = useRouter();
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

  return (
    <div className="fixed inset-0 z-[999] bg-[#0c1015] flex flex-col overflow-hidden">
      {/* Fundo com a capa do álbum (marca d'água) */}
      {cover && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${cover})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1015]/40 via-[#0c1015]/80 to-[#0c1015] pointer-events-none" />

      {/* Conteúdo principal (z-10 para ficar acima do fundo) */}
      <div className="relative z-10 flex flex-col h-full p-6 overflow-y-auto">
        
        {/* Topo: Tabs e Fechar */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-6 text-sm font-bold uppercase tracking-wider">
            <button className="text-gold2 border-b-2 border-gold2 pb-1">Tocando</button>
            <button className="text-muted hover:text-text transition">A seguir (5)</button>
          </div>
          <button
            onClick={closeFullScreen}
            className="text-muted hover:text-white text-3xl transition p-2 cursor-pointer"
            aria-label="Fechar player"
          >
            ✕
          </button>
        </div>

        {/* Badge de Prévia */}
        {isPreview && (
          <div className="self-center flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7b95f] text-[#16130c] font-bold text-xs mb-6">
            🎧 PRÉVIA DE 30 SEGUNDOS
          </div>
        )}

        {/* Capa do Álbum */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8 w-full max-w-md mx-auto">
          <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-2xl mb-8">
            {cover ? (
              <img src={cover} alt={current.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)' }} />
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-center mb-2 px-4">{current.title}</h2>
          <p className="text-muted text-sm md:text-base text-center px-4">
            {current.artist?.name ?? 'Joseph Matthos'}
            {current.album?.title ? ` · ${current.album.title}` : ''}
          </p>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full max-w-md mx-auto mb-6">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gold2"
            style={{ background: `linear-gradient(to right, #e7b95f ${progressPercent}%, #333 ${progressPercent}%)` }}
          />
          <div className="flex justify-between text-xs text-muted mt-2 font-mono">
            <span>{Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Controles de Reprodução (Estilo Spotify) */}
        <div className="flex items-center justify-center gap-6 md:gap-8 mb-10">
          <button onClick={toggleShuffle} className={`transition ${shuffle ? 'text-gold2' : 'text-muted hover:text-white'}`} aria-label="Aleatório">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button onClick={previous} className="text-white hover:text-gold2 transition" aria-label="Anterior">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button
            onClick={toggle}
            disabled={isLoading}
            className="w-20 h-20 rounded-full bg-gold text-[#16130c] flex items-center justify-center shadow-lg hover:scale-105 transition disabled:opacity-50"
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isLoading ? (
              <span className="text-xl animate-pulse">⏳</span>
            ) : isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 ml-1"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button onClick={next} className="text-white hover:text-gold2 transition" aria-label="Próxima">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
          <button onClick={cycleRepeat} className={`transition relative ${repeat !== 'off' ? 'text-gold2' : 'text-muted hover:text-white'}`} aria-label="Repetir">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[10px] font-bold">1</span>}
          </button>
        </div>

        {/* Botões de Ação (Alugar + Assinar) */}
        <div className="w-full max-w-md mx-auto mt-auto pb-6 flex gap-3">
          <button
            onClick={() => setIsRentModalOpen(true)}
            className="flex-1 py-4 rounded-full font-bold text-sm md:text-base border-2 border-gold text-gold2 hover:bg-[#e7b95f15] transition flex items-center justify-center gap-2"
          >
            🔒 Alugar
          </button>
          <button
            onClick={() => {
              closeFullScreen();
              // Pequeno delay para garantir que o player feche antes de navegar
              setTimeout(() => router.push('/plans'), 100);
            }}
            className="flex-1 py-4 rounded-full font-bold text-sm md:text-base bg-gold text-[#16130c] hover:bg-gold2 transition flex items-center justify-center gap-2"
          >
            💎 Assinar PRO
          </button>
        </div>
      </div>

      {/* Modal de Aluguel */}
      {isRentModalOpen && (
        <RentModal
          track={current}
          initialTab="track"
          onClose={() => setIsRentModalOpen(false)}
          onConfirmed={() => setIsRentModalOpen(false)}
          onPlay={() => setIsRentModalOpen(false)}
        />
      )}
    </div>
  );
}