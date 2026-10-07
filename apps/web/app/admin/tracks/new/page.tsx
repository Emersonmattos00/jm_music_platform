'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Album } from '@/lib/api';

export default function NewTrackPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [title, setTitle] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [isrc, setIsrc] = useState('');
  const [upc, setUpc] = useState('');
  const [genre, setGenre] = useState('Hip Hop');
  const [mood, setMood] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listAlbums().then(setAlbums).catch(() => undefined);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/catalog/tracks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jm_access_token')}`,
          },
          body: JSON.stringify({
            title,
            albumId: albumId || undefined,
            isrc: isrc || undefined,
            upc: upc || undefined,
            genre: genre || undefined,
            mood: mood || undefined,
            durationSeconds: durationSeconds
              ? parseInt(durationSeconds, 10)
              : undefined,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        const msg = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message ?? 'Erro ao criar faixa';
        throw new Error(msg);
      }

      const track = await res.json();
      router.push(`/admin/tracks/${track.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/admin/tracks" className="text-sm text-muted hover:text-gold2">
        ← Faixas
      </Link>
      <h1 className="text-3xl font-black mt-4 mb-6">Nova faixa</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-2">Título *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Álbum</label>
          <select
            value={albumId}
            onChange={(e) => setAlbumId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
          >
            <option value="">— Sem álbum —</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">ISRC</label>
            <input
              type="text"
              value={isrc}
              onChange={(e) => setIsrc(e.target.value)}
              placeholder="BR-JM1-26-00001"
              maxLength={15}
              className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">UPC</label>
            <input
              type="text"
              value={upc}
              onChange={(e) => setUpc(e.target.value)}
              placeholder="789123456789"
              maxLength={14}
              className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none font-mono text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-muted -mt-3">
          Ambos opcionais. ISRC formato CC-XXX-YY-NNNNN · UPC 12 dígitos.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Gênero</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Mood</label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Inspirador"
              className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2">Duração (segundos)</label>
          <input
            type="number"
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(e.target.value)}
            placeholder="180"
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
            {saving ? 'Criando…' : 'Criar faixa'}
          </button>
          <Link
            href="/admin/tracks"
            className="px-6 py-3 rounded-lg border border-line hover:border-gold transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}