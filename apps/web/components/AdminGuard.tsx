'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      // CORREÇÃO 41.2: Redireciona com replace (sem espera artificial)
      router.replace('/login');
      return;
    }

    if (!isAdmin) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-muted">
        Verificando acesso…
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (!isAdmin) return null;

  return <>{children}</>;
}