'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice, formatCompactNumber } from '@/lib/format';

interface DashboardData {
  users: { total: number; newThisMonth: number };
  catalog: { albums: number; tracks: number; publishedTracks: number };
  revenue: { monthCents: number; monthOrders: number };
  activity: {
    activeSubscriptions: number;
    activeRentals: number;
    playsLast30Days: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .adminDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="p-8 text-muted">Carregando…</div>;
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Erro</h1>
        <p className="text-muted">{error ?? 'Não foi possível carregar.'}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-3xl font-black mb-1">Dashboard</h1>
      <p className="text-muted mb-8">Visão geral da plataforma JM Music.</p>

      {/* Primeira linha: usuários e catálogo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="👥"
          label="Usuários"
          value={formatCompactNumber(data.users.total)}
          hint={`+${data.users.newThisMonth} este mês`}
        />
        <StatCard
          icon="💿"
          label="Álbuns"
          value={String(data.catalog.albums)}
        />
        <StatCard
          icon="🎵"
          label="Faixas"
          value={String(data.catalog.publishedTracks)}
          hint={`de ${data.catalog.tracks} total`}
        />
        <StatCard
          icon="💰"
          label="Receita (mês)"
          value={formatPrice(data.revenue.monthCents)}
          hint={`${data.revenue.monthOrders} pedidos`}
        />
      </div>

      {/* Segunda linha: atividade */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon="💳"
          label="Assinaturas ativas"
          value={String(data.activity.activeSubscriptions)}
        />
        <StatCard
          icon="⏱️"
          label="Aluguéis ativos"
          value={String(data.activity.activeRentals)}
        />
        <StatCard
          icon="▶️"
          label="Reproduções (30d)"
          value={formatCompactNumber(data.activity.playsLast30Days)}
        />
      </div>

      {/* Atalhos rápidos */}
      <div className="bg-[#151b23] border border-line rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction href="/admin/albums/new" icon="💿" label="Novo álbum" />
          <QuickAction href="/admin/tracks/new" icon="🎵" label="Nova faixa" />
          <QuickAction href="/admin/users" icon="👥" label="Ver usuários" />
          <QuickAction href="/admin/reports" icon="📈" label="Relatórios" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-[#151b23] border border-line rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-black text-gold2">{value}</div>
      {hint && <div className="text-xs text-muted mt-2">{hint}</div>}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-line hover:border-gold transition text-sm"
    >
      <span className="text-xl">{icon}</span>
      <span className="font-semibold">{label}</span>
    </Link>
  );
}