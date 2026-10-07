'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-20">
      <div className="max-w-md mx-auto px-6">
        <h1 className="text-3xl font-black mb-2">Esqueci minha senha</h1>
        <p className="text-muted mb-8">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>

        {sent ? (
          <div className="bg-[#e7b95f10] border border-gold rounded-xl p-6">
            <div className="text-3xl mb-3">📧</div>
            <div className="font-bold text-lg mb-2 text-gold2">
              Verifique seu email
            </div>
            <p className="text-muted text-sm mb-4">
              Se <strong className="text-text">{email}</strong> estiver
              cadastrado, você receberá um link para redefinir sua senha. O link
              expira em 1 hora.
            </p>
            <p className="text-muted text-xs">
              Não recebeu? Verifique a caixa de spam ou{' '}
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="text-gold2 hover:underline"
              >
                tente novamente
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-lg bg-panel border border-line focus:border-gold outline-none"
              />
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
            >
              {loading ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        )}

        <p className="text-sm text-muted mt-6">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-gold2 hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </section>
  );
}