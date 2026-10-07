'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function AuthGate({ children, requireAdmin = false, redirectTo = '/login' }: Props) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }
    if (requireAdmin && !isAdmin) {
      router.push('/');
    }
  }, [loading, isAuthenticated, isAdmin, requireAdmin, redirectTo, router]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-20 text-muted">Carregando…</div>;
  }

  if (!isAuthenticated) return null;
  if (requireAdmin && !isAdmin) return null;

  return <>{children}</>;
}