'use client';

import { useState } from 'react';
import { ArtistDetail } from '@/lib/api';
import { usePlayer } from '@/lib/player';

interface Props {
  artist: ArtistDetail;
}

export function HeroArtist({ artist }: Props) {
  const { playQueue } = usePlayer();
  const [following, setFollowing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handlePlay() {
    // Pega as primeiras 20 faixas publicadas do artista para tocar
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog/tracks?limit=20`,
      );
      const data = await res.json();
      const tracks = data.data ?? [];
      if (tracks.length > 0) {
        playQueue(tracks, 0);
      } else {
        showToast('Nenhuma faixa disponível');
      }
    } catch {
      showToast('Erro ao carregar faixas');
    }
  }

  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copiado');
    }
  }

  return (
    <section className="relative min-h-[420px] md:min-h-[520px] overflow-hidden">
      {/* Foto de fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: artist.imageUrl ? `url(${artist.imageUrl})` : undefined,
          background: artist.imageUrl
            ? undefined
            : 'linear-gradient(135deg, #2a1f0e, #6f5227 58%, #d0a34c)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1015] via-[#0c1015]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1015] via-transparent to-transparent" />
      </div>

      {/* Conteúdo */}
      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-12 flex flex-col justify-end min-h-[420px] md:min-h-[520px]">
        <div className="text-gold uppercase text-xs font-extrabold tracking-[2px] mb-3">
          Artista
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-4">
          {artist.name}
        </h1>
        <p className="text-muted text-base md:text-lg mb-6">
          Seja um dos primeiros seguidores
        </p>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePlay}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[#0c1015] bg-[#5bd6a2] hover:bg-[#7ae6b8] transition"
          >
            <span className="text-lg leading-none">▶</span>
            Reproduzir Músicas Semelhantes
          </button>

          <button
            onClick={() => {
              setFollowing((v) => !v);
              showToast(following ? 'Deixou de seguir' : 'Seguindo agora');
            }}
            aria-label="Seguir"
            className={`w-11 h-11 grid place-items-center rounded-full border transition ${
              following
                ? 'border-[#5bd6a2] text-[#5bd6a2] bg-[#5bd6a2]/10'
                : 'border-line text-muted hover:border-gold hover:text-text'
            }`}
          >
            {following ? '💚' : '💙'}
          </button>

          <button
            onClick={handleShare}
            aria-label="Compartilhar"
            className="w-11 h-11 grid place-items-center rounded-full border border-line text-muted hover:border-gold hover:text-text transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gold text-[#16130c] px-5 py-3 rounded-lg font-bold text-sm shadow-lg">
          {toast}
        </div>
      )}
    </section>
  );
}