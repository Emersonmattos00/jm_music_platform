'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface TrackData {
  id: string;
  title: string;
  slug: string;
  trackNumber: number | null;
  isrc: string | null;
  upc: string | null;
  genre: string | null;
  mood: string | null;
  durationSeconds: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  artist: { id: string; name: string };
  album: { id: string; title: string; slug: string } | null;
}

export default function AdminTrackEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  const [track, setTrack] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [isrc, setIsrc] = useState('');
  const [upc, setUpc] = useState('');
  const [duration, setDuration] = useState<number | ''>('');

  useEffect(() => {
        if (!id) return;
    // Como não temos GET admin/tracks/:id, usamos o público como fallback
    // (você pode adicionar depois um endpoint admin dedicado)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/catalog/tracks/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('jm_access_token')}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setTrack(data);
          setTitle(data.title ?? '');
          setGenre(data.genre ?? '');
          setMood(data.mood ?? '');
          setIsrc(data.isrc ?? '');
          setUpc(data.upc ?? '');
          setDuration(data.durationSeconds ?? '');
        } else {
          setError('Faixa não encontrada');
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.adminUpdateTrack(id, {
        title: title || undefined,
        genre: genre || undefined,
        mood: mood || undefined,
        isrc: isrc || undefined,
        upc: upc || undefined,
        durationSeconds: duration === '' ? undefined : Number(duration),
      });
      setSuccess('Faixa atualizada! O player já reflete na próxima recarga.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!confirm('Publicar esta faixa? Ela ficará visível no catálogo público.')) return;
    setSaving(true);
    try {
      await api.adminPublishTrack(id);
      setSuccess('Faixa publicada!');
      setTrack((t) => (t ? { ...t, status: 'PUBLISHED' } : t));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!confirm('Arquivar esta faixa? Ela sairá do catálogo público.')) return;
    setSaving(true);
    try {
      await api.adminArchiveTrack(id);
      setSuccess('Faixa arquivada.');
      setTrack((t) => (t ? { ...t, status: 'ARCHIVED' } : t));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-muted">Carregando faixa…</div>
    );
  }

  if (!track) {
    return (
      <div className="p-8">
        <div className="text-red-400 mb-4">{error ?? 'Faixa não encontrada'}</div>
        <Link
          href="/admin/tracks"
          className="text-gold2 hover:underline text-sm"
        >
          ← Voltar pra lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Breadcrumb */}
      <Link
        href="/admin/tracks"
        className="text-sm text-muted hover:text-gold2"
      >
        ← Faixas
      </Link>

      {/* Header */}
      <div className="mt-4 mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black">{track.title}</h1>
          <p className="text-muted text-sm mt-1">
            {track.album?.title ?? 'Sem álbum'} · {track.artist.name}
          </p>
          <div className="text-xs text-muted mt-1">
            Slug: <span className="font-mono">{track.slug}</span> · Status:{' '}
            <span
              className={
                track.status === 'PUBLISHED'
                  ? 'text-green font-bold'
                  : track.status === 'DRAFT'
                    ? 'text-gold2 font-bold'
                    : 'text-muted'
              }
            >
              {track.status}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {track.status !== 'PUBLISHED' && (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-green text-[#16130c] hover:opacity-90 disabled:opacity-50"
            >
              Publicar
            </button>
          )}
          {track.status === 'PUBLISHED' && (
            <button
              onClick={handleArchive}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm border border-line hover:border-gold disabled:opacity-50"
            >
              Arquivar
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
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

      {/* Formulário */}
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
          <p className="text-xs text-muted mt-1">
            Alterar o título regera o slug automaticamente.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted font-bold mb-2">
              Gênero
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              maxLength={80}
              placeholder="Hip Hop, Ambient, Cinemática…"
              className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted font-bold mb-2">
              Mood
            </label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              maxLength={80}
              placeholder="Inspirador, Reflexivo…"
              className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted font-bold mb-2">
              ISRC
            </label>
            <input
              type="text"
              value={isrc}
              onChange={(e) => setIsrc(e.target.value.toUpperCase())}
              placeholder="BR-XXX-00-00000"
              className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted font-bold mb-2">
              UPC
            </label>
            <input
              type="text"
              value={upc}
              onChange={(e) => setUpc(e.target.value)}
              placeholder="000000000000"
              className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-muted font-bold mb-2">
            Duração (segundos)
          </label>
          <input
            type="number"
            min={0}
            value={duration}
            onChange={(e) =>
              setDuration(e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="180"
            className="w-full px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
          />
          <p className="text-xs text-muted mt-1">
            {typeof duration === 'number'
              ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`
              : ''}
          </p>
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
            href="/admin/tracks"
            className="px-6 py-3 rounded-lg border border-line hover:border-gold transition"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {/* Aviso de reflexão no player */}
      <div className="mt-8 text-xs text-muted bg-[#151b23] border border-line rounded-lg p-4">
        💡 <strong className="text-gold2">Reflexo no player:</strong> as
        alterações são salvas no banco imediatamente. O player mostra os dados
        atualizados na próxima vez que a página for recarregada.
      </div>
    </div>
  );
}