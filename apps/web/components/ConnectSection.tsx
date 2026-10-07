'use client';

import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { api, SocialLink } from '@/lib/api';

const ICONS: Record<string, JSX.Element> = {
  spotify: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.22.36-.68.47-1.04.25-2.85-1.74-6.44-2.13-10.66-1.17-.4.1-.8-.16-.9-.56-.1-.4.16-.8.56-.9 4.62-1.05 8.6-.6 11.79 1.35.37.22.48.68.25 1.03zm1.47-3.27c-.27.44-.85.58-1.3.3-3.26-2-8.23-2.58-12.08-1.41-.5.15-1.02-.14-1.17-.63-.15-.5.14-1.02.63-1.17 4.4-1.34 9.88-.68 13.63 1.62.44.27.58.85.3 1.3zm.13-3.4C15.2 8.3 8.7 8.07 5.05 9.18c-.58.18-1.18-.15-1.35-.72-.18-.58.15-1.18.72-1.35 4.2-1.28 11.35-1.03 15.83 1.62.52.3.68.98.38 1.5-.3.5-.98.67-1.5.37z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
    </svg>
  ),
  amazon: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M13.7 14.8c-1.2.9-2.9 1.4-4.4 1.4-2.1 0-4-.8-5.4-2.1-.1-.1 0-.3.2-.2 1.5.9 3.4 1.4 5.3 1.4 1.3 0 2.7-.3 4-.8.2-.1.4.1.3.3zm.5-.5c-.2-.2-1.1-.1-1.6-.1-.1 0-.2-.2 0-.3.8-.6 2.1-.4 2.2-.2.2.2-.1 1.5-.8 2.2-.1.1-.2 0-.2-.1.2-.5.6-1.4.4-1.5zM11 4c-2.9 0-6 .6-6 4.6 0 3 1.8 3.6 3.1 3.6 1.5 0 2.3-.8 2.9-1.9 0 0 0 1.9 0 2.1-.1.3 0 .6.3.6h1.8c.3 0 .5-.2.5-.5V8.6c0-2.4-1.1-4.6-4.6-4.6h-.9zm-.5 6.5c-.6 0-1.4-.3-1.4-1.6 0-1.2.9-1.7 1.9-1.7.5 0 .9.1 1.4.2v2.5c-.5.4-1.2.6-1.9.6z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M22.7 0H1.3C.6 0 0 .6 0 1.3v21.3c0 .7.6 1.3 1.3 1.3h11.5v-9.3H9.7v-3.6h3.1V8.4c0-3.1 1.9-4.7 4.6-4.7 1.3 0 2.4.1 2.7.1v3.2h-1.9c-1.5 0-1.7.7-1.7 1.7v2.2h3.4l-.4 3.6h-3v9.3h5.8c.7 0 1.3-.6 1.3-1.3V1.3c0-.7-.6-1.3-1.3-1.3z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M19.6 6.3a5.3 5.3 0 0 1-3.2-1.1 5.3 5.3 0 0 1-1.9-2.6h-3.3v13a2.8 2.8 0 0 1-2.8 2.6 2.8 2.8 0 0 1-2.8-2.8 2.8 2.8 0 0 1 2.8-2.8c.3 0 .6 0 .9.1V9.4c-.3-.1-.6-.1-1-.1a6.1 6.1 0 0 0-6.1 6.1 6.1 6.1 0 0 0 6.1 6.1 6.1 6.1 0 0 0 6.1-6.1v-6a8.6 8.6 0 0 0 5.2 1.7V7.8c0 0-.7-.1-2-.1.1-.3 0-1 0-1.4z" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M17.1 12.3c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.8 3-.8 1.4 0 1.8.8 3 .7 1.2 0 2-1.1 2.7-2.2.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.3-.9-2.3-3.3zM14.8 4.7c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.7 1.3-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.8-1.3z" />
    </svg>
  ),
  audiomack: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zM9.5 16.5H7v-9h2.5v9zm3.5 0h-2.5v-9H13v9zm3.5 0h-2.5v-9h2.5v9z" />
    </svg>
  ),
};

export function ConnectSection() {
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listSocial().then(setSocials).catch(() => undefined);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.subscribeNewsletter(email, name || undefined);
      setSubmitted(true);
      setEmail('');
      setName('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-t border-line">
      <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-[1fr_1fr] gap-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-black mb-3">Conecte-se</h2>
          <p className="text-muted mb-10">
            Receba letras inéditas, reflexões e datas de shows.
          </p>

          <h3 className="text-2xl font-bold mb-3">Vamos trocar ideias.</h3>
          <p className="text-muted max-w-md mb-6 text-sm leading-relaxed">
            Para convites, parcerias ou apenas para compartilhar um verso, me encontre nas redes.
          </p>

          <div className="flex flex-wrap gap-3">
            {socials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="w-11 h-11 grid place-items-center rounded-full bg-[#151b23] border border-line text-muted hover:text-gold hover:border-gold transition"
              >
                {ICONS[s.platform] ?? <span className="text-xs">{s.label[0]}</span>}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          {submitted ? (
            <div className="bg-[#151b23] border border-gold/40 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">✓</div>
              <div className="font-bold text-gold2 mb-2">Inscrição confirmada!</div>
              <p className="text-muted text-sm">
                Em breve você receberá novidades no seu e-mail.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-xs text-muted hover:text-text underline"
              >
                Inscrever outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-[#151b23] border border-line focus:border-gold outline-none text-sm"
              />
              <input
                type="email"
                required
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-[#151b23] border border-line focus:border-gold outline-none text-sm"
              />
              {error && <div className="text-red-400 text-xs">{error}</div>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto px-8 py-4 rounded-full font-bold bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
              >
                {submitting ? 'Enviando…' : 'QUERO RECEBER'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}