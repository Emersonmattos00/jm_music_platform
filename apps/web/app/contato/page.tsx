export default function ContatoPage() {
  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-black mb-6">Contato</h1>
        <p className="text-muted mb-8">
          Para convites, parcerias, imprensa ou suporte, use um dos canais abaixo.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="mailto:contato@josephmatthos.com"
            className="block bg-[#151b23] border border-line rounded-2xl p-6 hover:border-gold transition"
          >
            <div className="text-2xl mb-2">✉️</div>
            <div className="font-bold mb-1">E-mail</div>
            <div className="text-muted text-sm">contato@josephmatthos.com</div>
          </a>

          <a
            href="https://www.instagram.com/josephmatthos"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#151b23] border border-line rounded-2xl p-6 hover:border-gold transition"
          >
            <div className="text-2xl mb-2">📸</div>
            <div className="font-bold mb-1">Instagram</div>
            <div className="text-muted text-sm">@josephmatthos</div>
          </a>
        </div>

        <div className="mt-10 text-sm text-muted">
          Para consultas sobre licenciamento comercial, informe: faixa, tipo de uso
          pretendido, território, prazo e orçamento estimado.
        </div>
      </div>
    </section>
  );
}