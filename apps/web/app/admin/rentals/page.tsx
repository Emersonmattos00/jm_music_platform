'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .adminListRentals()
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

  const now = Date.now();
  const active = rentals.filter(
    (r) => r.status === 'ACTIVE' && new Date(r.expiresAt).getTime() > now,
  );
  const expired = rentals.filter(
    (r) => r.status !== 'ACTIVE' || new Date(r.expiresAt).getTime() <= now,
  );

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Aluguéis</h1>
        <p className="text-muted mt-1">
          {active.length} ativos · {rentals.length} no total
        </p>
      </div>

      {loading && <div className="text-muted">Carregando…</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && rentals.length === 0 && (
        <div className="bg-[#151b23] border border-line rounded-2xl p-10 text-center text-muted">
          Nenhum aluguel ainda.
        </div>
      )}

      {!loading && rentals.length > 0 && (
        <div className="bg-[#151b23] border border-line rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-bold">Código</th>
                <th className="px-4 py-3 font-bold">Usuário</th>
                <th className="px-4 py-3 font-bold">Faixa / Álbum</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Expira em</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((r) => {
                const isActive =
                  r.status === 'ACTIVE' && new Date(r.expiresAt).getTime() > now;
                const title = r.album?.title ?? r.track?.title ?? '—';
                const kind = r.album ? 'Álbum' : 'Faixa';
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-line last:border-b-0 ${
                      !isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gold2">
                      {r.rentalCode}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold truncate max-w-[180px]">
                        {r.user?.name ?? '—'}
                      </div>
                      <div className="text-xs text-muted truncate max-w-[180px]">
                        {r.user?.email ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm truncate max-w-[220px]">{title}</div>
                      <div className="text-xs text-muted">{kind}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[11px] font-bold uppercase px-2 py-1 rounded border ${
                          isActive
                            ? 'text-[#5bd6a2] border-[#5bd6a2]/40'
                            : 'text-muted border-line'
                        }`}
                      >
                        {isActive ? 'ACTIVE' : 'EXPIRED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted text-xs">
                      {formatDate(r.expiresAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}