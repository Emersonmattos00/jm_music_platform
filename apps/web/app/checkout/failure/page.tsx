import Link from 'next/link';

export default function CheckoutFailurePage() {
  return (
    <section className="py-20">
      <div className="max-w-lg mx-auto px-6 text-center">
        <div className="text-5xl mb-4">😔</div>
        <h1 className="text-3xl font-black mb-3">Pagamento não concluído</h1>
        <p className="text-muted mb-8">
          Não conseguimos confirmar seu pagamento. Nenhuma cobrança foi feita. Você pode tentar
          novamente quando quiser.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/plans"
            className="px-6 py-3 rounded-full font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
          >
            Tentar novamente
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-full border border-line hover:border-gold transition"
          >
            Voltar à Home
          </Link>
        </div>
      </div>
    </section>
  );
}