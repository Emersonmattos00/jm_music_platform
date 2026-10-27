'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { user } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('Verificando seu email…');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link inválido. Solicite um novo email de verificação.');
      return;
    }

    api
      .verifyEmail(token)
      .then(async (res) => {
        setStatus('success');
        setMessage(res.message ?? 'Email verificado com sucesso!');

        // Se o usuário estiver logado, atualiza o estado global
        if (user) {
          try {
            const freshUser = await api.me();
            // Como o AuthProvider atualiza o estado via api.me() na inicialização,
            // aqui podemos apenas recarregar a página ou confiar no próximo ciclo.
            // Uma opção é recarregar a página para garantir a consistência.
            // window.location.reload(); // Descomente se necessário.
          } catch {
            // Ignora falhas silenciosamente
          }
        }
      })
      .catch((err: any) => {
        setStatus('error');
        const message = Array.isArray(err?.message)
          ? err.message[0]
          : err?.message ?? 'Não foi possível verificar o email.';
        setMessage(message);
      });
  }, [token, user]);

  return (
    <section className="py-20">
      <div className="max-w-md mx-auto px-6">
        <h1 className="text-3xl font-black mb-2">Verificação de email</h1>

        <div
          className={`rounded-xl p-6 mt-6 ${
            status === 'success'
              ? 'bg-[#5bd6a210] border border-[#5bd6a2]'
              : status === 'error'
                ? 'bg-red-950/30 border border-red-900/50'
                : 'bg-panel border border-line'
          }`}
        >
          <div className="text-3xl mb-3">
            {status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌'}
          </div>
          <p
            className={`text-sm ${
              status === 'success'
                ? 'text-[#5bd6a2]'
                : status === 'error'
                  ? 'text-red-400'
                  : 'text-muted'
            }`}
          >
            {message}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="px-5 py-3 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
          >
            Fazer login
          </Link>
          <Link
            href="/catalog"
            className="px-5 py-3 rounded-lg border border-line hover:border-gold transition"
          >
            Explorar catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}