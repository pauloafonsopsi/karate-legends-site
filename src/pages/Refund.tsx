import { useTranslation } from 'react-i18next';

const Refund = () => {
  const { t: _t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <header className="mb-16">
          <h1 className="text-5xl md:text-7xl mb-6">Política de Reembolso</h1>
          <div className="h-1 w-24 gold-gradient"></div>
          <p className="text-white/40 text-sm mt-6 uppercase tracking-widest">Última atualização: __DATA_ATUALIZACAO__</p>
        </header>

        <div className="prose prose-invert max-w-none space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-2xl text-gold mb-4">1. Direito de Arrependimento (Art. 49 do CDC)</h2>
            <p>
              Conforme o art. 49 do Código de Defesa do Consumidor, qualquer compra realizada
              fora do estabelecimento comercial pode ser cancelada em até 7 (sete) dias corridos
              a contar da data do pagamento, com restituição integral dos valores pagos. Esse
              direito aplica-se aos produtos descritos abaixo, observadas as condições específicas
              de cada um.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">2. PPV — Acesso à Transmissão</h2>
            <p>
              O reembolso integral da compra do PPV poderá ser solicitado em até 7 (sete) dias
              corridos após o pagamento, desde que <strong>o evento ainda não tenha começado</strong>.
              Após o início da transmissão ao vivo, o serviço é considerado prestado e não há
              direito a reembolso, ainda que o espectador opte por não assistir.
            </p>
            <p>
              <strong>Falha técnica grave da organização:</strong> caso a transmissão sofra
              interrupção significativa por falha de nossa responsabilidade que impossibilite a
              fruição do evento, o espectador terá direito ao acesso ao replay completo da edição
              ou, alternativamente, ao reembolso integral, à sua escolha.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">3. Inscrição de Atleta — Taxa de Análise</h2>
            <p>
              O reembolso da taxa de análise (R$ 99,00) poderá ser solicitado em até 7 (sete)
              dias corridos após o pagamento, desde que <strong>a análise técnica ainda não
              tenha sido iniciada</strong> pelo consultor Legends. A confirmação do início da
              análise é registrada no momento em que o consultor inicia a avaliação dos materiais
              enviados, e o atleta é notificado por e-mail.
            </p>
            <p>
              Após o início da análise técnica, o serviço é considerado prestado e não há direito
              a reembolso, independentemente do resultado da avaliação. A não aprovação do atleta
              também não gera direito a devolução, uma vez que a taxa cobre o trabalho de análise,
              não a aprovação.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">4. Como Solicitar Reembolso</h2>
            <p>
              Para solicitar reembolso, envie um e-mail para __EMAIL_CONTATO__ informando:
              nome completo, e-mail utilizado na compra, número do pedido (recebido por e-mail
              após o pagamento) e o motivo do pedido de reembolso. Solicitações são respondidas
              em até 5 (cinco) dias úteis. O reembolso, quando devido, é processado diretamente
              pela Hotmart, na mesma forma de pagamento utilizada na compra, no prazo previsto
              pela operadora do meio de pagamento (geralmente até 30 dias para cartão de crédito
              e até 5 dias úteis para PIX e boleto).
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">5. Cancelamento do Evento pela Organização</h2>
            <p>
              Em caso de cancelamento total da edição por iniciativa da organização (caso
              fortuito, força maior, problemas operacionais), todos os valores pagos serão
              integralmente restituídos no prazo de até 30 dias.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Refund;
