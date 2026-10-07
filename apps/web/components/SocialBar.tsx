'use client';

import { SocialIcons } from './SocialIcons';

export function SocialBar() {
  return (
    <div className="sticky top-[72px] z-30 h-0">
      {/* Área sensível — pequena zona que também captura hover */}
      <div className="h-2" aria-hidden />

      {/* Faixa que desliza quando o mouse está sobre o wrapper .group/header */}
      <div
        className="
          border-b border-line bg-[rgba(12, 16, 21, 0)] backdrop-blur
          transition-all duration-300 ease-out overflow-hidden
          max-h-0 opacity-0.28
          group-hover/header:max-h-20 group-hover/header:opacity-100
        "
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-center">
          <SocialIcons />
        </div>
      </div>
    </div>
  );
}