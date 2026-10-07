'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, Album } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { AlbumCarousel } from '@/components/AlbumCarousel';
import { ConnectSection } from '@/components/ConnectSection';

const HERO_IMAGE =
  'https://f005.backblazeb2.com/file/joseph.matthos/assets/img/josephmatthos.webp';

const MONTHLY_PRICE_CENTS = 1990; // R$ 19,90

const RENTAL_PLANS = [
  { duration: '24h',     hours: 24,  priceCents: 290 },
  { duration: '48h',     hours: 48,  priceCents: 490 },
  { duration: '3 dias',  hours: 72,  priceCents: 690 },
  { duration: '5 dias',  hours: 120, priceCents: 990 },
  { duration: '10 dias', hours: 240, priceCents: 1290 },
  { duration: '15 dias', hours: 360, priceCents: 1990 },
];

export default function HomePage() {
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    api.listAlbums().then(setAlbums).catch(() => setAlbums([]));
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 75% 10%, rgba(201,151,62,0.18), transparent 40%), radial-gradient(ellipse at 10% 40%, rgba(50,105,128,0.15), transparent 40%)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 grid md:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <div>
            <div className="text-gold uppercase text-xs font-extrabold tracking-[2px]">
              Streaming · Aluguel · Assinatura
            </div>
            <h1 className="text-5xl md:text-7xl leading-[1.02] tracking-tight mt-4 mb-5">
              Ouça Joseph Matthos.
              <br />
              <span className="text-gold2">Sem limites.</span>
            </h1>
            <p className="text-muted text-lg max-w-xl">
              330 músicas no catálogo. Ouça uma <strong className="text-text">prévia de 30s</strong> de graça,
              alugue faixas por <strong className="text-text">24h a 15 dias</strong>, ou
              assine e ouça tudo sem parar.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
              >
                ▶ Ouvir prévia grátis
              </Link>
              <Link
                href="/plans"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold border border-gold text-gold2 hover:bg-[#e7b95f15] transition"
              >
                💎 Assinar por {formatPrice(MONTHLY_PRICE_CENTS)}
              </Link>
            </div>

            <div className="mt-6 text-xs text-muted">
              Já tem conta?{' '}
              <Link href="/login" className="text-gold2 hover:underline">
                Entrar
              </Link>{' '}
              · Ou{' '}
              <Link href="/register" className="text-gold2 hover:underline">
                criar conta grátis
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#202b37] to-[#11171e] border border-[#34404d] rounded-3xl p-6 shadow-2xl md:rotate-1">
            <div className="h-[225px] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${HERO_IMAGE})`, opacity: 0.45 }}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(32,46,58,0.85) 0%, rgba(111,82,39,0.55) 58%, rgba(208,163,76,0.35) 100%)',
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(12,16,21,0.8) 0%, rgba(12,16,21,0.2) 55%, transparent 100%)',
                }}
              />
              <div className="relative text-xs tracking-[2px] font-bold text-gold">
                EM DESTAQUE • JM MUSIC
              </div>
              <div className="relative text-2xl md:text-3xl font-black leading-tight">
                NOVOS
                <br />
                LANÇAMENTOS
                <br />
                <span className="text-[#ffe0a0]">2026</span>
              </div>
              <div className="relative text-xs tracking-[2px]">
                JOSEPH MATTHOS · ORIGINALS
              </div>
            </div>
            <p className="text-sm text-muted mt-4">
              <span className="text-gold2 font-bold">Prévia grátis de 30s</span> em qualquer
              faixa. Alugue por tempo ou assine sem limites.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          COMO FUNCIONA
      ═══════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black mb-2">
              Como funciona
            </h2>
            <p className="text-muted">
              Três formas de ouvir. Você escolhe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-panel border border-line rounded-2xl p-6 hover:border-gold transition">
              <div className="text-4xl mb-3">▶</div>
              <div className="text-xl font-black mb-2">Ouça a prévia</div>
              <p className="text-muted text-sm mb-4">
                30 segundos grátis de qualquer faixa. Sem login, sem cartão.
              </p>
              <Link
                href="/catalog"
                className="text-gold2 text-sm font-bold hover:underline"
              >
                Explorar catálogo →
              </Link>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-6 hover:border-gold transition">
              <div className="text-4xl mb-3">🔓</div>
              <div className="text-xl font-black mb-2">Alugue por tempo</div>
              <p className="text-muted text-sm mb-4">
                Acesso completo à faixa ou ao álbum por 24h, 48h, 3d, 5d, 10d ou 15d.
              </p>
              <div className="text-xs text-muted">
                A partir de{' '}
                <span className="text-gold2 font-bold">
                  {formatPrice(290)}
                </span>
              </div>
            </div>

            <div className="bg-panel border border-gold rounded-2xl p-6 relative">
              <span className="absolute -top-3 right-4 text-[10px] font-black text-[#17120a] bg-gold px-2 py-1 rounded">
                RECOMENDADO
              </span>
              <div className="text-4xl mb-3">💎</div>
              <div className="text-xl font-black mb-2">Ou assine</div>
              <p className="text-muted text-sm mb-4">
                Ouça as 330 músicas do catálogo sem limite, incluindo novos lançamentos.
              </p>
              <div className="text-xs text-muted">
                <span className="text-gold2 font-bold text-lg">
                  {formatPrice(MONTHLY_PRICE_CENTS)}
                </span>
                /mês
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          ÁLBUNS EM DESTAQUE
      ═══════════════════════════════════════════════════ */}
      {albums.length > 0 && (
        <AlbumCarousel title="Lançamentos" albums={albums.slice(0, 12)} />
      )}

      {/* ═══════════════════════════════════════════════════
          PREÇOS DE ALUGUEL
      ═══════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black mb-2">
              Alugue pelo tempo que precisar
            </h2>
            <p className="text-muted">
              Sem cobrança recorrente. Você paga uma vez, ouve pelo período escolhido.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {RENTAL_PLANS.map((plan) => (
              <div
                key={plan.hours}
                className="bg-panel border border-line rounded-xl p-4 text-center hover:border-gold transition"
              >
                <div className="text-xs uppercase tracking-wide text-muted font-bold mb-2">
                  {plan.duration}
                </div>
                <div className="text-xl font-black text-gold2">
                  {formatPrice(plan.priceCents)}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted mt-6">
            Preço por faixa. Álbum completo tem valor único.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA ASSINATURA
      ═══════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative bg-gradient-to-br from-[#1f1810] to-[#0f141a] border border-gold rounded-3xl p-8 md:p-12 overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-10 bg-cover bg-center"
              style={{ backgroundImage: `url(${HERO_IMAGE})` }}
            />
            <div className="relative grid md:grid-cols-[1.5fr_1fr] gap-8 items-center">
              <div>
                <div className="text-gold uppercase text-xs font-extrabold tracking-[2px] mb-3">
                  Plano Mensal
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4">
                  Ouça as 330 músicas <span className="text-gold2">sem limites</span>
                </h2>
                <ul className="space-y-2 text-muted text-sm mb-6">
                  <li>✓ Acesso completo a todo o catálogo</li>
                  <li>✓ Novos lançamentos inclusos automaticamente</li>
                  <li>✓ Rádio JM Music ao vivo</li>
                  <li>✓ Cancele quando quiser</li>
                </ul>
              </div>
              <div className="text-center md:text-right">
                <div className="text-5xl font-black text-gold2 mb-1">
                  {formatPrice(MONTHLY_PRICE_CENTS)}
                </div>
                <div className="text-muted text-sm mb-6">por mês</div>
                <Link
                  href="/plans"
                  className="inline-block w-full md:w-auto px-8 py-4 rounded-xl font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
                >
                  Assinar agora →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SOBRE O ARTISTA
      ═══════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1fr_1.3fr] gap-10 items-center">
          <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE}
              alt="Joseph Matthos"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-gold uppercase text-xs font-extrabold tracking-[2px] mb-3">
              O artista
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Joseph Matthos
            </h2>
            <p className="text-muted leading-relaxed">
              Hip hop poético e consciente. Letras que falam de vida, fé, superação e
              identidade — com batidas que misturam o clássico e o contemporâneo.
            </p>
            <p className="text-muted leading-relaxed mt-3">
              330 músicas gravadas, novos lançamentos todo mês.
            </p>
            <div className="flex gap-3 mt-6">
              <Link
                href="/albums"
                className="px-5 py-3 rounded-lg border border-line hover:border-gold transition text-sm font-bold"
              >
                Ver discografia
              </Link>
              <Link
                href="/catalog"
                className="px-5 py-3 rounded-lg border border-line hover:border-gold transition text-sm font-bold"
              >
                Explorar catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}