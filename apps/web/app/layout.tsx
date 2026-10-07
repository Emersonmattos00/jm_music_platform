import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { SocialBar } from '@/components/SocialBar';
import { PlayerBar } from '@/components/PlayerBar';
import { PlayerFull } from '@/components/PlayerFull';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'JM Music — Música para suas ideias',
  description:
    'Plataforma de streaming, assinatura e licenciamento musical com catálogo exclusivo de Joseph Matthos.',
};

const WATERMARK_URL =
  'https://f005.backblazeb2.com/file/joseph.matthos/assets/img/publico.webp';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className="min-h-screen text-text antialiased pb-24 relative"
        style={{ background: '#0c1015' }}
        suppressHydrationWarning
      >
        {/* Camada 1: marca d'água fixa */}
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: `url(${WATERMARK_URL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.38,
            filter: 'blur(2px)',
          }}
        />

        {/* Camada 2: overlay escuro para legibilidade */}
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse at center, hsla(180, 22%, 21%, 0.00) 0%, rgba(18, 22, 27, 0) 75%)',
          }}
        />

        {/* Camada 3: conteúdo por cima */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Providers>
            <KeyboardShortcuts />

            {/* Header + SocialBar agrupados: hover no header revela os ícones */}
            <div className="group/header">
              <Header />
              <SocialBar />
            </div>

            <main>{children}</main>
            <Footer />
            <PlayerBar />
            <PlayerFull />
          </Providers>
        </div>
      </body>
    </html>
  );
}