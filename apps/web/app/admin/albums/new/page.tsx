'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewAlbumPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [upc, setUpc] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/catalog/albums`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jm_access_token')}`,
          },
          body: JSON.stringify({
            title,
            coverUrl: coverUrl || undefined,
            upc: upc || undefined,
            releaseDate: releaseDate || undefined,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        const msg = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message ?? 'Erro ao criar álbum';
        throw new Error(msg);
      }

      router.push('/admin/albums');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/admin/albums" className="text-sm text-muted hover:text-gold2">
        ← Álbuns
      </Link>
      <h1 className="text-3xl font-black mt-4 mb-6">Novo álbum</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-2">Título *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Mentalidade de Ouro Vol. 6"
            className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">URL da capa</label>
          <input
            type="text"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://f005.backblazeb2.com/file/joseph.matthos/assets/img/..."
            className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none text-sm"
          />
          <p className="text-xs text-muted mt-2">
            Cole a URL pública da capa no Backblaze.
          </p>
        </div>

        <div>
          <label className="block text-sm mb-2">UPC</label>
          <input
            type="text"
            value={upc}
            onChange={(e) => setUpc(e.target.value)}
            placeholder="789123456789"
            maxLength={14}
            className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none font-mono"
          />
          <p className="text-xs text-muted mt-2">
            Código de barras do álbum (12 dígitos). Opcional.
          </p>
        </div>

        <div>
          <label className="block text-sm mb-2">Data de lançamento</label>
          <input
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
          />
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !title}
            className="px-6 py-3 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
          >
            {saving ? 'Criando…' : 'Criar álbum'}
          </button>
          <Link
            href="/admin/albums"
            className="px-6 py-3 rounded-lg border border-line hover:border-gold transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}