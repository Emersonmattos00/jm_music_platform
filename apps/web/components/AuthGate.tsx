'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function AuthGate({
  children,
  requireAdmin = false,
  redirectTo = '/login',
}: Props) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      // CORREÇÃO 41.1: Preserva a URL atual para redirecionar após o login
      const next = encodeURIComponent(pathname);
      router.replace(`${redirectTo}?next=${next}`);
      return;
    }

    if (requireAdmin && !isAdmin) {
      // CORREÇÃO 41.1: Usa replace para não deixar a página no histórico
      router.replace('/');
    }
  }, [
    loading,
    isAuthenticated,
    isAdmin,
    requireAdmin,
    redirectTo,
    pathname,
    router,
  ]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-muted">
        Carregando…
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (requireAdmin && !isAdmin) return null;

  return <>{children}</>;
}