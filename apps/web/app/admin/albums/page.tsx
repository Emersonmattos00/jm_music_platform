'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Album } from '@/lib/api';

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listAlbums()
      .then((list) => {
        if (!cancelled) setAlbums(list);
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
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Álbuns</h1>
          <p className="text-muted mt-1">{albums.length} álbuns no catálogo</p>
        </div>
        <Link
          href="/admin/albums/new"
          className="px-4 py-2.5 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
        >
          + Novo álbum
        </Link>
      </div>

      {loading && <div className="text-muted">Carregando…</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && (
        <div className="bg-[#151b23] border border-line rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-bold">Capa</th>
                <th className="px-4 py-3 font-bold">Título</th>
                <th className="px-4 py-3 font-bold">Ano</th>
                <th className="px-4 py-3 font-bold text-right">Faixas</th>
                <th className="px-4 py-3 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {albums.map((album) => (
                <tr key={album.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-[#0f141a]">
                      {album.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{
                            background:
                              'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)',
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold truncate max-w-xs">{album.title}</div>
                    <div className="text-xs text-muted">{album.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted text-sm">
                    {album.releaseDate
                      ? new Date(album.releaseDate).getFullYear()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-muted text-sm">
                    {album._count?.tracks ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/albums/${album.slug}`}
                      target="_blank"
                      className="text-xs text-gold2 hover:underline"
                    >
                      Ver no site ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {albums.length === 0 && (
            <div className="px-4 py-10 text-center text-muted">
              Nenhum álbum cadastrado ainda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}