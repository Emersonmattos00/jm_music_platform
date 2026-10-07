export default function TermosPage() {
  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-black mb-6">Termos de Uso</h1>
        <p className="text-muted mb-4">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">1. Aceitação</h2>
        <p className="text-muted mb-4">
          Ao acessar ou usar a plataforma JM Music, você concorda com estes Termos. Se não
          concordar, não utilize o serviço.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">2. Descrição do serviço</h2>
        <p className="text-muted mb-4">
          A JM Music oferece streaming, assinatura e licenciamento de músicas do catálogo
          exclusivo de Joseph Matthos. O acesso ao conteúdo está condicionado à contratação
          de plano de assinatura ou de licença individual.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">3. Conta do usuário</h2>
        <p className="text-muted mb-4">
          Você é responsável pela veracidade das informações cadastradas e pela segurança
          das suas credenciais. Não compartilhe sua senha.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">4. Licenças e uso</h2>
        <p className="text-muted mb-4">
          As assinaturas concedem direito de audição pela plataforma. Licenças individuais
          concedem direitos específicos descritos no momento da contratação. É vedado
          redistribuir, revender ou explorar o conteúdo fora dos termos da licença.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">5. Cancelamento</h2>
        <p className="text-muted mb-4">
          Assinaturas podem ser canceladas a qualquer momento. O acesso permanece até o fim
          do período já pago.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">6. Contato</h2>
        <p className="text-muted mb-4">
          Dúvidas sobre estes termos podem ser enviadas pela página de contato.
        </p>

        <p className="text-muted text-sm mt-10 italic">
          Este documento é um modelo e deve ser revisado por profissional jurídico antes da
          publicação em produção.
        </p>
      </div>
    </section>
  );
}