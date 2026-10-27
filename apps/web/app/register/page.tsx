'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Normalização do e-mail e do nome
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    try {
      await register(trimmedName, normalizedEmail, password);
      // Mensagem informando sobre a verificação de e-mail
      setSuccessMsg(
        'Conta criada! Enviamos um e-mail de verificação. Verifique sua caixa de entrada para liberar todos os recursos.',
      );
      // Redireciona após 3 segundos
      setTimeout(() => router.push('/catalog'), 3000);
    } catch (err: any) {
      const message = Array.isArray(err?.message)
        ? err.message[0]
        : err?.message ?? 'Não foi possível criar a conta. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-20">
      <div className="max-w-md mx-auto px-6">
        <h1 className="text-3xl font-black mb-2">Criar conta</h1>
        <p className="text-muted mb-8">Comece a ouvir e licenciar músicas.</p>

        {successMsg ? (
          <div className="bg-[#e7b95f10] border border-gold rounded-xl p-6">
            <div className="text-3xl mb-3">📧</div>
            <div className="font-bold text-lg mb-2 text-gold2">
              Quase lá!
            </div>
            <p className="text-muted text-sm">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Nome</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-panel border border-line focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-panel border border-line focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Senha (mínimo 8 caracteres)</label>
              <input
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-panel border border-line focus:border-gold outline-none"
              />
              <p className="text-xs text-muted mt-1">
                Deve conter letras e números.
              </p>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
            >
              {loading ? 'Criando…' : 'Criar conta'}
            </button>
          </form>
        )}

        <p className="text-sm text-muted mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-gold2 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </section>
  );
}