'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Rental } from '@/lib/api';
import { AuthGate } from '@/components/AuthGate';
import { formatDate } from '@/lib/format';

export default function RentalsPage() {
  return (
    <AuthGate>
      <RentalsContent />
    </AuthGate>
  );
}

function RentalsContent() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listMyRentals()
      .then((list) => {
        if (!cancelled) setRentals(list);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = rentals.filter((r) => r.status === 'ACTIVE');
  const expired = rentals.filter((r) => r.status !== 'ACTIVE');

  return (
    <section className="py-14">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/account" className="text-sm text-muted hover:text-gold2">
            ← Minha conta
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mt-4">Meus aluguéis</h1>
          <p className="text-muted mt-2">
            Faixas e álbuns alugados por tempo limitado.
          </p>
        </div>

        {loading && <div className="text-muted text-center py-10">Carregando…</div>}
        {error && <div className="text-red-400 text-center py-10">{error}</div>}

        {!loading && !error && rentals.length === 0 && (
          <div className="bg-[#151b23] border border-line rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2">Nenhum aluguel ainda</h2>
            <p className="text-muted mb-6">
              Alugue faixas ou álbuns inteiros para ouvir por tempo limitado.
            </p>
            <Link
              href="/albums"
              className="inline-block px-6 py-3 rounded-full font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
            >
              Explorar discografia
            </Link>
          </div>
        )}

        {/* Ativos */}
        {active.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4 text-gold2">
              Ativos ({active.length})
            </h2>
            <div className="space-y-3">
              {active.map((r) => (
                <RentalCard key={r.id} rental={r} />
              ))}
            </div>
          </div>
        )}

        {/* Expirados / cancelados */}
        {expired.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-muted">
              Histórico ({expired.length})
            </h2>
            <div className="space-y-3">
              {expired.map((r) => (
                <RentalCard key={r.id} rental={r} expired />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function RentalCard({ rental, expired = false }: { rental: Rental; expired?: boolean }) {
  const isAlbum = !!rental.album;

  const title = isAlbum
    ? rental.album?.title ?? 'Álbum'
    : rental.track?.title ?? 'Faixa';

  const subtitle = isAlbum
    ? 'Álbum inteiro'
    : rental.track?.album?.title ?? 'Single';

  return (
    <div
      className={`bg-[#151b23] border rounded-2xl p-4 flex items-center gap-4 ${
        expired ? 'border-line opacity-60' : 'border-gold/40'
      }`}
    >
      <div className="w-12 h-12 rounded-lg grid place-items-center bg-[#0f141a] border border-line flex-shrink-0">
        <span className="text-xl">{isAlbum ? '💿' : '🎵'}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{title}</div>
        <div className="text-xs text-muted truncate">{subtitle}</div>
        <div className="text-xs text-muted mt-1">
          Código: <span className="text-gold2 font-mono">{rental.rentalCode}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div
          className={`text-xs font-bold uppercase ${
            expired ? 'text-muted' : 'text-[#5bd6a2]'
          }`}
        >
          {rental.status}
        </div>
        <div className="text-xs text-muted mt-1">
          Expira em {formatDate(rental.expiresAt)}
        </div>
      </div>

      {!expired && rental.track && (
        <Link
          href={`/tracks/${rental.track.slug}`}
          className="px-4 py-2 rounded-lg text-sm font-bold border border-line hover:border-gold transition flex-shrink-0"
        >
          Ouvir
        </Link>
      )}
    </div>
  );
}