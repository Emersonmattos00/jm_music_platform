'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface AlbumData {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  upc: string | null;
  releaseDate: string | null;
  tracks: Array<{
    id: string;
    title: string;
    slug: string;
    trackNumber: number | null;
    durationSeconds: number | null;
  }>;
}

export default function AdminAlbumEditPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [upc, setUpc] = useState('');
  const [releaseDate, setReleaseDate] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/catalog/albums/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setAlbum(data);
          setTitle(data.title ?? '');
          setCoverUrl(data.coverUrl ?? '');
          setUpc(data.upc ?? '');
          setReleaseDate(
            data.releaseDate
              ? new Date(data.releaseDate).toISOString().slice(0, 10)
              : '',
          );
        } else {
          setError('Álbum não encontrado');
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!album) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.adminUpdateAlbum(album.id, {
        title: title || undefined,
        coverUrl: coverUrl || undefined,
        upc: upc || undefined,
        releaseDate: releaseDate || undefined,
      });
      setSuccess('Álbum atualizado! O player já reflete na próxima recarga.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-muted">Carregando álbum…</div>;
  if (!album) {
    return (
      <div className="p-8">
        <div className="text-red-400 mb-4">{error ?? 'Álbum não encontrado'}</div>
        <Link href="/admin/albums" className="text-gold2 hover:underline text-sm">
          ← Voltar pra lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link href="/admin/albums" className="text-sm text-muted hover:text-gold2">
        ← Álbuns
      </Link>

      <h1 className="text-3xl font-black mt-4 mb-2">{album.title}</h1>
      <p className="text-muted text-sm mb-8">
        {album.tracks.length} faixas ·{' '}
        <span className="font-mono">{album.slug}</span>
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-green bg-green/10 border border-green/30 rounded-lg p-3">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted font-bold mb-2">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-muted font-bold mb-2">
            URL da capa
          </label>
          <input
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://f005.backblazeb2.com/..."
            className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none text-sm"
          />
          {coverUrl && (
            <div className="mt-3 w-32 h-32 rounded-lg overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt="Prévia da capa"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted font-bold mb-2">
              UPC
            </label>
            <input
              type="text"
              value={upc}
              onChange={(e) => setUpc(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted font-bold mb-2">
              Data de lançamento
            </label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-line">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
          <Link
            href="/admin/albums"
            className="px-6 py-3 rounded-lg border border-line hover:border-gold transition"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {/* Lista de faixas (só referência) */}
      <div className="mt-12">
        <h2 className="text-xl font-black mb-4">Faixas</h2>
        <div className="space-y-2">
          {album.tracks.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tracks/${t.id}`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#151b23] border border-line hover:border-gold transition"
            >
              <div>
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs text-muted font-mono">{t.slug}</div>
              </div>
              <div className="text-sm text-muted">
                {t.durationSeconds
                  ? `${Math.floor(t.durationSeconds / 60)}:${String(
                      t.durationSeconds % 60,
                    ).padStart(2, '0')}`
                  : '—'}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}