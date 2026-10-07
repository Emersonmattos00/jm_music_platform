'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .adminListUsers({ q: q || undefined, role: role || undefined, page, limit: 20 })
        .then((res) => {
          if (cancelled) return;
          setUsers(res.data);
          setMeta({ total: res.meta.total, totalPages: res.meta.totalPages });
        })
        .catch((e) => {
          if (!cancelled) setError((e as Error).message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, role, page]);

  async function handleRoleChange(userId: string, newRole: 'CUSTOMER' | 'ADMIN') {
    setUpdating(userId);
    try {
      await api.adminUpdateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Usuários</h1>
        <p className="text-muted mt-1">{meta.total} usuários cadastrados</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Buscar por e-mail ou nome…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 rounded-lg bg-[#151b23] border border-line focus:border-gold outline-none"
        >
          <option value="">Todos os perfis</option>
          <option value="CUSTOMER">Cliente</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {loading && <div className="text-muted">Carregando…</div>}
      {error && <div className="text-red-400 mb-4">{error}</div>}

      {!loading && (
        <>
          <div className="bg-[#151b23] border border-line rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-line">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-bold">Nome</th>
                  <th className="px-4 py-3 font-bold">E-mail</th>
                  <th className="px-4 py-3 font-bold">Perfil</th>
                  <th className="px-4 py-3 font-bold text-right">Assin.</th>
                  <th className="px-4 py-3 font-bold text-right">Aluguéis</th>
                  <th className="px-4 py-3 font-bold text-right">Cadastro</th>
                  <th className="px-4 py-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3 font-semibold truncate max-w-[180px]">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-muted text-sm truncate max-w-[220px]">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[11px] font-bold uppercase px-2 py-1 rounded border ${
                          u.role === 'ADMIN'
                            ? 'text-gold2 border-gold/40'
                            : 'text-muted border-line'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted text-sm tabular-nums">
                      {u._count?.subscriptions ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-muted text-sm tabular-nums">
                      {u._count?.rentals ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-muted text-xs tabular-nums">
                      {formatDate(u.createdAt).split(' ')[0]}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value as any)
                        }
                        disabled={updating === u.id}
                        className="text-xs bg-[#0f141a] border border-line rounded px-2 py-1 disabled:opacity-50"
                      >
                        <option value="CUSTOMER">Cliente</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="px-4 py-10 text-center text-muted">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-line hover:border-gold transition text-sm disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-muted">
                Página {page} de {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-4 py-2 rounded-lg border border-line hover:border-gold transition text-sm disabled:opacity-40"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}