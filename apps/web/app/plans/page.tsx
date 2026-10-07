'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, Plan } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/format';

type Interval = 'month' | 'year';

const PRO_FEATURES = [
  'Streaming ilimitado de todas as 330 músicas',
  'Novos lançamentos inclusos automaticamente',
  'Rádio JM Music ao vivo',
  'Histórico de reprodução e favoritos',
  'Cancele a qualquer momento',
];

export default function PlansPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [interval, setInterval] = useState<Interval>('month');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  // Pega o plano Pro do intervalo selecionado
  const currentPlan = useMemo(() => {
    return plans.find(
      (p) =>
        p.intervalUnit === interval &&
        p.name.toLowerCase().includes('pro'),
    );
  }, [plans, interval]);

  // Calcula a economia do anual
  const monthlyPlan = useMemo(
    () => plans.find((p) => p.intervalUnit === 'month'),
    [plans],
  );
  const yearlyPlan = useMemo(
    () => plans.find((p) => p.intervalUnit === 'year'),
    [plans],
  );

  const savings = useMemo(() => {
    if (!monthlyPlan || !yearlyPlan) return 0;
    return monthlyPlan.priceCents * 12 - yearlyPlan.priceCents;
  }, [monthlyPlan, yearlyPlan]);

  async function handleSubscribe() {
    if (!currentPlan) return;
    setError(null);

    if (!isAuthenticated) {
      router.push('/login?next=/plans');
      return;
    }

    setCheckingOut(currentPlan.id);
    try {
      const res = await api.checkoutSubscription(currentPlan.id);
      if (res.checkoutUrl) {
        sessionStorage.setItem('jm_last_subscription_id', res.subscription.id);
        window.location.href = res.checkoutUrl;
      } else {
        setError('Não foi possível iniciar o checkout. Tente novamente.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <section className="py-16 bg-gradient-to-b from-transparent via-[#131920] to-transparent">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-gold uppercase text-xs font-extrabold tracking-[2px]">
            Assinatura
          </div>
          <h1 className="text-4xl md:text-5xl font-black mt-2">
            Ouça tudo. <span className="text-gold2">Sem limites.</span>
          </h1>
          <p className="text-muted mt-3 max-w-xl mx-auto">
            Acesso completo às 330 músicas do catálogo Joseph Matthos, rádio ao vivo
            e novos lançamentos inclusos. Cancele quando quiser.
          </p>
        </div>

        {/* Toggle Mensal / Anual */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-[#151b23] border border-line rounded-full p-1 relative">
            <button
              onClick={() => setInterval('month')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition ${
                interval === 'month'
                  ? 'bg-gold text-[#16130c]'
                  : 'text-muted hover:text-text'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`relative px-6 py-2 rounded-full text-sm font-bold transition ${
                interval === 'year'
                  ? 'bg-gold text-[#16130c]'
                  : 'text-muted hover:text-text'
              }`}
            >
              Anual
              <span className="absolute -top-3 -right-4 hidden md:inline-block text-[10px] font-black text-[#17120a] bg-[#5bd6a2] px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">
                2 MESES GRÁTIS
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-center">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-muted text-center py-10">Carregando plano…</div>
        )}

        {!loading && !currentPlan && (
          <div className="text-center text-muted py-10">
            Nenhum plano disponível no momento. Tente novamente mais tarde.
          </div>
        )}

        {!loading && currentPlan && (
          <div className="bg-panel border border-gold rounded-3xl p-8 md:p-10 shadow-[0_0_0_1px_rgba(231,185,95,0.15)] max-w-2xl mx-auto">
            {/* Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-gold uppercase text-xs font-extrabold tracking-[2px]">
                Plano Pro
              </div>
              <span className="text-[11px] font-black text-[#17120a] bg-gold px-3 py-1 rounded-full">
                {interval === 'year' ? 'MELHOR OFERTA' : 'RECOMENDADO'}
              </span>
            </div>

            {/* Preço */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-black tracking-tight text-gold2">
                  {formatPrice(currentPlan.priceCents, currentPlan.currency)}
                </span>
                <span className="text-muted text-lg">
                  /{interval === 'year' ? 'ano' : 'mês'}
                </span>
              </div>

              {interval === 'year' && savings > 0 && (
                <div className="text-sm text-[#5bd6a2] font-semibold mt-2">
                  Equivale a{' '}
                  {formatPrice(Math.round(currentPlan.priceCents / 12), currentPlan.currency)}
                  /mês · economia de {formatPrice(savings, currentPlan.currency)} por ano
                </div>
              )}

              {interval === 'month' && (
                <div className="text-sm text-muted mt-2">
                  Ou economize 2 meses no plano anual
                </div>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[#d2dae2]">
                  <span className="text-gold2 font-bold flex-shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={handleSubscribe}
              disabled={checkingOut !== null}
              className="w-full px-6 py-4 rounded-xl font-bold text-lg bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
            >
              {checkingOut
                ? 'Redirecionando…'
                : isAuthenticated
                ? `Assinar por ${formatPrice(currentPlan.priceCents, currentPlan.currency)}`
                : 'Criar conta para assinar'}
            </button>

            <p className="text-center text-xs text-muted mt-4">
              Pagamento seguro via Mercado Pago · Cancele a qualquer momento
            </p>
          </div>
        )}

        {/* Comparativo aluguel vs assinatura */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-2">
            Assinatura ou aluguel?
          </h2>
          <p className="text-muted text-center text-sm mb-6">
            Escolha o que faz mais sentido pra você.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-panel border border-line rounded-2xl p-6">
              <div className="text-2xl mb-2">🔓</div>
              <div className="font-black mb-2">Aluguel avulso</div>
              <p className="text-muted text-sm mb-4">
                Pague uma vez, ouça pelo período escolhido. Ideal pra quem quer uma faixa
                específica.
              </p>
              <ul className="text-xs text-muted space-y-1">
                <li>• A partir de R$ 2,90 (faixa)</li>
                <li>• De 24h a 15 dias</li>
                <li>• Não renova automaticamente</li>
              </ul>
            </div>

            <div className="bg-panel border border-gold rounded-2xl p-6">
              <div className="text-2xl mb-2">💎</div>
              <div className="font-black mb-2">Assinatura Pro</div>
              <p className="text-muted text-sm mb-4">
                Ouça tudo sem limite, incluindo lançamentos. Ideal pra quem ama música.
              </p>
              <ul className="text-xs text-muted space-y-1">
                <li>• R$ 19,90/mês ou R$ 179,90/ano</li>
                <li>• Acesso a 330 músicas + rádio</li>
                <li>• Cancele quando quiser</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}