'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface SubInfo {
  id: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  plan: { name: string };
}

export default function CheckoutSuccessPage() {
  const [status, setStatus] = useState<'polling' | 'active' | 'pending' | 'error'>('polling');
  const [subscription, setSubscription] = useState<SubInfo | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subId = sessionStorage.getItem('jm_last_subscription_id');
    if (!subId) {
      setStatus('error');
      setError('Não encontramos uma assinatura pendente. Volte para os planos.');
      return;
    }

    let cancelled = false;
    let attempt = 0;

    async function poll() {
      if (cancelled) return;
      attempt += 1;
      setAttempts(attempt);

      try {
        const sub = await api.getSubscriptionStatus(subId!);
        if (cancelled) return;

        setSubscription(sub as unknown as SubInfo);

        if (sub.status === 'ACTIVE') {
          setStatus('active');
          sessionStorage.removeItem('jm_last_subscription_id');
          return;
        }

        // Se passou muito tempo sem ativar, mostra "pending" com aviso
        if (attempt >= 15) {
          setStatus('pending');
          return;
        }

        // Continua polling a cada 2s
        setTimeout(poll, 2000);
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setError((e as Error).message);
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-20">
      <div className="max-w-lg mx-auto px-6 text-center">
        {status === 'polling' && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-3xl font-black mb-3">Confirmando seu pagamento…</h1>
            <p className="text-muted mb-6">
              Aguarde alguns segundos enquanto o Mercado Pago confirma sua assinatura.
            </p>
            <div className="text-xs text-muted">Verificação {attempts}/15</div>
          </>
        )}

        {status === 'active' && (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-3xl font-black mb-3">Assinatura ativada!</h1>
            <p className="text-muted mb-2">
              {subscription?.plan?.name ?? 'Seu plano'} está ativo.
            </p>
            <p className="text-sm text-muted mb-8">
              Você já pode ouvir o catálogo completo e a Rádio Joseph Matthos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/catalog"
                className="px-6 py-3 rounded-full font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
              >
                Ir para o catálogo
              </Link>
              <Link
                href="/account/subscription"
                className="px-6 py-3 rounded-full border border-line hover:border-gold transition"
              >
                Ver minha assinatura
              </Link>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="text-5xl mb-4">⏱️</div>
            <h1 className="text-3xl font-black mb-3">Pagamento em análise</h1>
            <p className="text-muted mb-6">
              Recebemos sua solicitação, mas o Mercado Pago ainda não confirmou. Isso pode levar
              alguns minutos. Você receberá acesso assim que o pagamento for aprovado.
            </p>
            <Link
              href="/account/subscription"
              className="inline-block px-6 py-3 rounded-full font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
            >
              Ver status da assinatura
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-3xl font-black mb-3">Algo deu errado</h1>
            <p className="text-muted mb-6">{error}</p>
            <Link
              href="/plans"
              className="inline-block px-6 py-3 rounded-full font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
            >
              Voltar aos planos
            </Link>
          </>
        )}
      </div>
    </section>
  );
}