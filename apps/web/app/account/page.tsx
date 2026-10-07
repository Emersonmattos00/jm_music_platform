'use client';

import Link from 'next/link';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function AccountPage() {
  return (
    <AuthGate>
      <AccountContent />
    </AuthGate>
  );
}

function AccountContent() {
  const { user, isAdmin } = useAuth();

  return (
    <section className="py-14">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-black mb-6">Minha conta</h1>

        {/* Dados do usuário */}
        <div className="bg-panel border border-line rounded-2xl p-6 space-y-3">
          <div>
            <span className="text-muted text-sm">Nome</span>
            <div className="text-lg">{user?.name}</div>
          </div>
          <div>
            <span className="text-muted text-sm">E-mail</span>
            <div className="text-lg">{user?.email}</div>
          </div>
          <div>
            <span className="text-muted text-sm">Perfil</span>
            <div className="text-lg">{user?.role}</div>
          </div>
        </div>

        {/* Assinatura */}
        <div className="mt-6 bg-panel border border-line rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-2">Assinatura</h2>
          <p className="text-muted text-sm mb-4">
            Assine um plano para ouvir todo o catálogo sem limites.
          </p>
          <Link
            href="/plans"
            className="inline-block px-5 py-2.5 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition text-sm"
          >
            Ver planos
          </Link>
        </div>

        {/* Meus aluguéis */}
        <div className="mt-6 bg-panel border border-line rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-2">Meus aluguéis</h2>
          <p className="text-muted text-sm mb-4">
            Faixas e álbuns que você alugou por tempo limitado.
          </p>
          <Link
            href="/account/rentals"
            className="inline-block px-5 py-2.5 rounded-lg font-bold bg-gold text-[#16130c] hover:bg-gold2 transition text-sm"
          >
            Ver meus aluguéis
          </Link>
        </div>

        {/* Área administrativa */}
        {isAdmin && (
          <div className="mt-6 bg-panel border border-line rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-2">Área administrativa</h2>
            <p className="text-muted text-sm">
              Publicação de faixas, upload de áudio e gestão do catálogo.
              Endpoints admin disponíveis em <code className="text-gold2">/v1/admin/catalog</code>.
            </p>
          </div>
        )}
        {user && !user.emailVerified && (
  <div className="max-w-4xl mx-auto mb-6 bg-[#e7b95f10] border border-gold rounded-xl p-4 flex items-center gap-4 flex-wrap">
    <div className="text-2xl">📧</div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-gold2">Confirme seu email</div>
      <div className="text-muted text-sm">
        Enviamos um link para <strong>{user.email}</strong>. Confirme para
        liberar aluguéis e assinaturas.
      </div>
    </div>
    <button
      onClick={async () => {
        try {
          await api.resendVerification();
          alert('Email reenviado! Verifique sua caixa de entrada.');
        } catch (e) {
          alert((e as Error).message);
        }
      }}
      className="px-4 py-2 rounded-lg text-sm font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
    >
      Reenviar email
    </button>
  </div>
)}
      </div>
    </section>
  );
}