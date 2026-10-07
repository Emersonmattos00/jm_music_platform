'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { RadioModal } from './RadioModal';

export function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [radioOpen, setRadioOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-[rgba(12,16,21,0.91)] backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-[72px] flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://f005.backblazeb2.com/file/joseph.matthos/assets/img/josephmatthos-Photoroom.webp"
              alt="JM Music"
              className="h-10 w-auto"
            />
            <span className="font-extrabold tracking-wide hidden sm:inline">
              Joseph Matthos <span className="text-gold2">OFICIAL</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
            <Link href="/catalog" className="hover:text-gold2">Catálogo</Link>
            <Link href="/albums" className="hover:text-gold2">Discografia</Link>
            <Link href="/plans" className="hover:text-gold2">Planos</Link>
            {isAuthenticated && (
              <Link href="/account" className="hover:text-gold2">Minha conta</Link>
            )}
            {isAuthenticated && (
              <Link href="/account/rentals" className="hover:text-gold2">
                Meus aluguéis
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRadioOpen(true)}
              className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full border border-gold/40 text-gold2 hover:bg-[#e7b95f15] transition text-sm font-bold"
              aria-label="Rádio Joseph Matthos"
            >
              <span className="text-base">📻</span>
              <span className="hidden md:inline">Rádio</span>
            </button>

            {isAuthenticated ? (
              <>
                <span className="hidden lg:inline text-sm text-muted">
                  Olá, {user?.name.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm border border-line hover:border-gold transition"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline px-4 py-2 rounded-lg text-sm border border-line hover:border-gold transition"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-bold text-[#16130c] bg-gold hover:bg-gold2 transition"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {radioOpen && <RadioModal onClose={() => setRadioOpen(false)} />}
    </>
  );
}