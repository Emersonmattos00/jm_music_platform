export default function PrivacidadePage() {
  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-black mb-6">Política de Privacidade</h1>
        <p className="text-muted mb-4">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">1. Dados coletados</h2>
        <p className="text-muted mb-4">
          Coletamos apenas os dados necessários para prestar o serviço: nome, e-mail, dados
          de pagamento (processados por terceiros) e registros de uso da plataforma.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">2. Finalidade</h2>
        <p className="text-muted mb-4">
          Os dados são usados para autenticação, cobrança, comunicação sobre a conta e
          melhoria contínua da plataforma.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">3. Compartilhamento</h2>
        <p className="text-muted mb-4">
          Não vendemos dados pessoais. Compartilhamos apenas com prestadores essenciais à
          operação (processadores de pagamento, CDN, hospedagem) e quando exigido por lei.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">4. Seus direitos (LGPD)</h2>
        <p className="text-muted mb-4">
          Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados
          a qualquer momento pela página de contato.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">5. Cookies</h2>
        <p className="text-muted mb-4">
          Usamos cookies estritamente necessários para sessão e segurança. Não usamos
          rastreadores de terceiros para publicidade.
        </p>

        <p className="text-muted text-sm mt-10 italic">
          Este documento é um modelo e deve ser revisado por profissional jurídico antes da
          publicação em produção.
        </p>
      </div>
    </section>
  );
}