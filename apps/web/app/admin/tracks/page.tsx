'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Track } from '@/lib/api';

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number }>({
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .listTracks({ q: q || undefined, page, limit: 20 })
        .then((res) => {
          if (cancelled) return;
          setTracks(res.data);
          setMeta({ total: res.meta.total, totalPages: res.meta.totalPages });
        })
        .catch((e) => {
          if (!cancelled) setError((e as Error).message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, page]);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Faixas</h1>
          <p className="text-muted mt-1">{meta.total} faixas publicadas</p>
        </div>
        <Link
          href="/admin/tracks/new"
          className="px-4 py-2.5 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
        >
          + Nova faixa
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Buscar por título, artista, gênero…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
        />
      </div>

      {loading && <div className="text-muted">Carregando…</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && (
        <>
          <div className="bg-[#151b23] border border-line rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-line">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-bold">Faixa</th>
                  <th className="px-4 py-3 font-bold">Álbum</th>
                  <th className="px-4 py-3 font-bold">Gênero</th>
                  <th className="px-4 py-3 font-bold text-right">Duração</th>
                  <th className="px-4 py-3 font-bold text-right">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr key={track.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-semibold truncate max-w-[220px]">
                        {track.title}
                      </div>
                      <div className="text-xs text-muted truncate max-w-[220px]">
                        {track.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-sm truncate max-w-[180px]">
                      {track.album?.title ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted text-sm">
                      {track.genre ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-muted text-sm tabular-nums">
                      {track.durationSeconds
                        ? `${Math.floor(track.durationSeconds / 60)}:${String(
                            track.durationSeconds % 60,
                          ).padStart(2, '0')}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={track.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/tracks/${track.slug}`}
                        target="_blank"
                        className="text-xs text-gold2 hover:underline"
                      >
                        Ver ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {tracks.length === 0 && (
              <div className="px-4 py-10 text-center text-muted">
                Nenhuma faixa encontrada.
              </div>
            )}
          </div>

          {/* Paginação */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-line hover:border-gold transition text-sm disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-muted">
                Página {page} de {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-4 py-2 rounded-lg border border-line hover:border-gold transition text-sm disabled:opacity-40"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    DRAFT: { color: 'text-muted border-line', label: 'Rascunho' },
    PUBLISHED: { color: 'text-[#5bd6a2] border-[#5bd6a2]/40', label: 'Publicada' },
    ARCHIVED: { color: 'text-muted border-line', label: 'Arquivada' },
  };
  const { color, label } = map[status] ?? map.DRAFT;
  return (
    <span
      className={`inline-block text-[11px] font-bold uppercase px-2 py-1 rounded border ${color}`}
    >
      {label}
    </span>
  );
}