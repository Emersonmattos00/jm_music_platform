'use client';

import { AdminGuard } from '@/components/AdminGuard';
import { AdminSidebar } from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-[calc(100vh-72px)]">
        <AdminSidebar />
        <main className="flex-1 min-w-0 overflow-x-auto">{children}</main>
      </div>
    </AdminGuard>
  );
}