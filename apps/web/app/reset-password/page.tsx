'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Link inválido. Solicite um novo.');
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError('A senha deve conter letras e números');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-20">
      <div className="max-w-md mx-auto px-6">
        <h1 className="text-3xl font-black mb-2">Nova senha</h1>
        <p className="text-muted mb-8">
          Escolha uma nova senha para sua conta.
        </p>

        {success ? (
          <div className="bg-[#5bd6a210] border border-[#5bd6a2] rounded-xl p-6">
            <div className="text-3xl mb-3">✅</div>
            <div className="font-bold text-lg mb-2 text-[#5bd6a2]">
              Senha redefinida!
            </div>
            <p className="text-muted text-sm">
              Redirecionando para o login…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Nova senha</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-3 rounded-lg bg-panel border border-line focus:border-gold outline-none"
              />
              <p className="text-xs text-muted mt-1">
                Deve conter letras e números
              </p>
            </div>
            <div>
              <label className="block text-sm mb-1">Confirme a senha</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-4 py-3 rounded-lg bg-panel border border-line focus:border-gold outline-none"
              />
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full px-4 py-3 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
            >
              {loading ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </form>
        )}

        <p className="text-sm text-muted mt-6">
          <Link href="/login" className="text-gold2 hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </section>
  );
}