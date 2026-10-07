'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [waited, setWaited] = useState(false);

  // Espera 500ms para o AuthProvider carregar o user do localStorage
  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !waited) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/');
    }
  }, [loading, waited, isAuthenticated, isAdmin, router]);

  if (loading || !waited) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-muted">
        Carregando…
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (!isAdmin) return null;

  return <>{children}</>;
}