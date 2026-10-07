'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCompactNumber } from '@/lib/format';

export default function AdminReportsPage() {
  const [top, setTop] = useState<{ track: any; plays: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .adminTopTracks(30)
      .then((list) => {
        if (!cancelled) setTop(list);
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

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Relatórios</h1>
        <p className="text-muted mt-1">Faixas mais ouvidas</p>
      </div>

      {loading && <div className="text-muted">Carregando…</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && top.length === 0 && (
        <div className="bg-[#151b23] border border-line rounded-2xl p-10 text-center text-muted">
          Nenhuma reprodução registrada ainda.
        </div>
      )}

      {!loading && top.length > 0 && (
        <div className="bg-[#151b23] border border-line rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-bold w-12">#</th>
                <th className="px-4 py-3 font-bold">Faixa</th>
                <th className="px-4 py-3 font-bold">Álbum</th>
                <th className="px-4 py-3 font-bold text-right">Reproduções</th>
              </tr>
            </thead>
            <tbody>
              {top.map((item, i) => (
                <tr key={item.track?.id ?? i} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3 text-muted text-sm tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md overflow-hidden bg-[#0f141a] flex-shrink-0">
                        {item.track?.album?.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.track.album.coverUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{
                              background:
                                'linear-gradient(135deg, #202e3a, #6f5227, #d0a34c)',
                            }}
                          />
                        )}
                      </div>
                      <div className="font-semibold truncate max-w-[240px]">
                        {item.track?.title ?? 'Faixa removida'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted text-sm truncate max-w-[200px]">
                    {item.track?.album?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gold2 font-bold tabular-nums">
                    {formatCompactNumber(item.plays)}
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