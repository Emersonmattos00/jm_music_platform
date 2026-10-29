'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer, formatTime } from '@/lib/player';
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
    isPreview, // <-- ADICIONADO AQUI
  } = usePlayer();

  const [isRentModalOpen, setIsRentModalOpen] = useState(false);

  if (!current) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[999] bg-[#0c1015] flex flex-col p-6 overflow-y-auto">
      {/* Topo: Tabs e Fechar */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-6 text-sm font-bold uppercase tracking-wider">
          <button className="text-gold2 border-b-2 border-gold2 pb-1">
            Tocando
          </button>
          <button className="text-muted hover:text-text transition">
            A seguir (5)
          </button>
        </div>
        <button
          onClick={closeFullScreen}
          className="text-muted hover:text-text text-2xl transition"
          aria-label="Fechar player"
        >
          ✕
        </button>
      </div>

      {/* Badge de Prévia (CORRIGIDO) */}
      {isPreview && (
        <div className="self-center flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7b95f] text-[#16130c] font-bold text-xs mb-6">
          🎧 PRÉVIA DE 30 SEGUNDOS
        </div>
      )}

      {/* Capa do Álbum */}
      <div className="flex-1 flex flex-col items-center justify-center mb-8 w-full max-w-md mx-auto">
        <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-2xl mb-8">
          {current.album?.coverUrl ? (
            <img
              src={current.album.coverUrl}
              alt={current.title}
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

        {/* Título e Artista */}
        <h2 className="text-2xl md:text-3xl font-black text-center mb-2 px-4">
          {current.title}
        </h2>
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
          style={{
            background: `linear-gradient(to right, #e7b95f ${progressPercent}%, #333 ${progressPercent}%)`,
          }}
        />
        <div className="flex justify-between text-xs text-muted mt-2 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles de Reprodução */}
      <div className="flex items-center justify-center gap-6 md:gap-8 mb-10">
        <button
          onClick={toggleShuffle}
          className="text-muted hover:text-text transition"
          aria-label="Aleatório"
        >
          🔀
        </button>
        <button
          onClick={previous}
          className="text-white hover:text-gold2 transition"
          aria-label="Anterior"
        >
          ⏮
        </button>
        <button
          onClick={toggle}
          disabled={isLoading}
          className="w-20 h-20 rounded-full bg-gold text-[#16130c] flex items-center justify-center text-3xl font-bold shadow-lg hover:bg-gold2 transition disabled:opacity-50"
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isLoading ? '...' : isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={next}
          className="text-white hover:text-gold2 transition"
          aria-label="Próxima"
        >
          ⏭
        </button>
        <button
          onClick={cycleRepeat}
          className="text-muted hover:text-text transition"
          aria-label="Repetir"
        >
          🔁
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
            router.push('/plans');
          }}
          className="flex-1 py-4 rounded-full font-bold text-sm md:text-base bg-gold text-[#16130c] hover:bg-gold2 transition flex items-center justify-center gap-2"
        >
          💎 Assinar PRO
        </button>
      </div>

      {/* Modal de Aluguel */}
      {isRentModalOpen && (
        <RentModal
          track={current}
          initialTab="track"
          onClose={() => setIsRentModalOpen(false)}
          onConfirmed={() => setIsRentModalOpen(false)}
          onPlay={() => {
            setIsRentModalOpen(false);
          }}
        />
      )}
    </div>
  );
}