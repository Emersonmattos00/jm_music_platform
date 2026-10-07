'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .adminListSubscriptions()
      .then((list) => {
        if (!cancelled) setSubs(list);
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

  const active = subs.filter((s) => s.status === 'ACTIVE');
  const others = subs.filter((s) => s.status !== 'ACTIVE');

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Assinaturas</h1>
        <p className="text-muted mt-1">
          {active.length} ativas · {subs.length} no total
        </p>
      </div>

      {loading && <div className="text-muted">Carregando…</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && subs.length === 0 && (
        <div className="bg-[#151b23] border border-line rounded-2xl p-10 text-center text-muted">
          Nenhuma assinatura ainda.
        </div>
      )}

      {!loading && subs.length > 0 && (
        <div className="bg-[#151b23] border border-line rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-bold">Usuário</th>
                <th className="px-4 py-3 font-bold">Plano</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Valor</th>
                <th className="px-4 py-3 font-bold text-right">Renova em</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold truncate max-w-[220px]">
                      {s.user?.name ?? '—'}
                    </div>
                    <div className="text-xs text-muted truncate max-w-[220px]">
                      {s.user?.email ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted text-sm">
                    {s.plan?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-gold2 text-sm tabular-nums">
                    {s.plan ? formatPrice(s.plan.priceCents) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-muted text-xs">
                    {s.currentPeriodEnd ? formatDate(s.currentPeriodEnd).split(' ')[0] : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'text-[#5bd6a2] border-[#5bd6a2]/40',
    PENDING: 'text-gold2 border-gold/40',
    CANCELLED: 'text-muted border-line',
    EXPIRED: 'text-red-400 border-red-900/40',
    PAST_DUE: 'text-red-400 border-red-900/40',
  };
  return (
    <span
      className={`inline-block text-[11px] font-bold uppercase px-2 py-1 rounded border ${
        map[status] ?? 'text-muted border-line'
      }`}
    >
      {status}
    </span>
  );
}