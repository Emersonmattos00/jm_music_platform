'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/albums', label: 'Álbuns', icon: '💿' },
  { href: '/admin/tracks', label: 'Faixas', icon: '🎵' },
  { href: '/admin/users', label: 'Usuários', icon: '👥' },
  { href: '/admin/subscriptions', label: 'Assinaturas', icon: '💳' },
  { href: '/admin/rentals', label: 'Aluguéis', icon: '⏱️' },
  { href: '/admin/reports', label: 'Relatórios', icon: '📈' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-line min-h-[calc(100vh-72px)] py-6">
      <div className="px-4 mb-6">
        <div className="text-xs uppercase tracking-[2px] text-gold font-extrabold">
          Admin
        </div>
        <div className="text-sm text-muted mt-1">JM Music</div>
      </div>

      <nav className="space-y-1 px-2">
        {ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-[#e7b95f15] text-gold2 font-semibold'
                  : 'text-muted hover:text-text hover:bg-[#1b2430]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 mt-8">
        <Link
          href="/"
          className="text-xs text-muted hover:text-gold2 transition"
        >
          ← Voltar ao site
        </Link>
      </div>
    </aside>
  );
}