'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Track } from '@/lib/api';

export function RentPlaceholder() {
  const router = useRouter();

  useEffect(() => {
    function onOpen(e: Event) {
      const ce = e as CustomEvent<{ track: Track }>;
      const track = ce.detail?.track;
      // Por enquanto, manda para /plans com um alerta.
      // O Bloco 7 substitui isso por um modal real.
      alert(
        `Aluguel da faixa "${track?.title ?? ''}" será implementado no Bloco 7 (Aluguel).\n\n` +
          `Agora você será levado à página de planos.`,
      );
      router.push('/plans');
    }
    window.addEventListener('jm:open-rent-modal', onOpen);
    return () => window.removeEventListener('jm:open-rent-modal', onOpen);
  }, [router]);

  return null;
}