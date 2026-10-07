'use client';

import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line">
      <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-muted">
        <div className="flex flex-col items-center gap-3 text-center">
          <div>
            © {year} Joseph Matthos - Emerson Mattos. Todos os direitos reservados.{' '}
            <span className="text-gold2">✦</span> Feito com poesia e beat.
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 uppercase tracking-wider">
            <Link href="/termos" className="hover:text-text transition">
              Termos de uso
            </Link>
            <span className="opacity-30">·</span>
            <Link href="/privacidade" className="hover:text-text transition">
              Política de privacidade
            </Link>
            <span className="opacity-30">·</span>
            <Link href="/contato" className="hover:text-text transition">
              Contato
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}