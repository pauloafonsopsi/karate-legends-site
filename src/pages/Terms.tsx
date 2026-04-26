import { useTranslation } from 'react-i18next';

const Terms = () => {
  const { t: _t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <header className="mb-16">
          <h1 className="text-5xl md:text-7xl mb-6">Termos de Uso</h1>
          <div className="h-1 w-24 gold-gradient"></div>
          <p className="text-white/40 text-sm mt-6 uppercase tracking-widest">Última atualização: __DATA_ATUALIZACAO__</p>
        </header>

        <div className="prose prose-invert max-w-none space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-2xl text-gold mb-4">1. Aceite dos Termos</h2>
            <p>
              Ao acessar e utilizar o site Karate Legends, ao inscrever-se como atleta ou ao adquirir
              acesso à transmissão Pay-Per-View (PPV), você declara ter lido, compreendido e aceitado
              integralmente estes Termos de Uso, bem como a Política de Privacidade. Se não concordar
              com qualquer disposição, não utilize nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">2. Identificação do Responsável</h2>
            <p>
              O Karate Legends é organizado e operado por __RAZAO_SOCIAL__, inscrita no CNPJ sob o
              nº __CNPJ__, com sede em __ENDERECO_COMPLETO__. Contato: __EMAIL_CONTATO__.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">3. Inscrição de Atletas</h2>
            <p>
              A inscrição como atleta implica o pagamento de uma taxa de análise no valor de
              R$ 99,00 (noventa e nove reais), destinada exclusivamente a custear o trabalho do
              consultor técnico Legends — análise do vídeo, do certificado de graduação e do
              documento de identificação enviados. O pagamento é processado pela Hotmart, após
              o envio do formulário, por link enviado ao e-mail informado pelo atleta. A
              aprovação na análise técnica não garante participação no próximo evento, mas torna
              o atleta elegível para futuras convocações (Luta Casada ou Grand Prix), conforme
              critérios definidos pela organização.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">4. Aquisição do PPV</h2>
            <p>
              A aquisição do acesso à transmissão Pay-Per-View dá direito ao espectador de
              assistir à edição contratada em transmissão ao vivo, na data e horário comunicados
              previamente, e ao replay disponibilizado por 7 (sete) dias após o evento. O acesso
              é pessoal e intransferível, vinculado ao e-mail informado na compra. É vedada a
              redistribuição, gravação, transmissão pública ou compartilhamento do conteúdo, sob
              pena de bloqueio do acesso e responsabilização civil e criminal nos termos da
              legislação de direitos autorais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">5. Disponibilidade da Transmissão</h2>
            <p>
              Empenhamo-nos para garantir alta qualidade e estabilidade da transmissão, mas não
              nos responsabilizamos por falhas ou interrupções decorrentes da conexão de internet
              do espectador, de equipamentos do espectador, ou de eventos de força maior. Em caso
              de falha técnica grave de nossa parte que impeça a fruição do evento, oferecemos
              acesso ao replay completo conforme previsto em nossa Política de Reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do site Karate Legends — textos, logotipos, imagens, vídeos, marcas
              e designs — é de propriedade exclusiva de __RAZAO_SOCIAL__ ou de seus licenciantes,
              protegido pelas leis de propriedade intelectual. Qualquer uso não autorizado é vedado.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">7. Conduta do Usuário</h2>
            <p>
              O usuário compromete-se a fornecer informações verdadeiras, atualizadas e completas
              ao se cadastrar; a não utilizar o site para fins ilícitos, fraudulentos ou que
              violem direitos de terceiros; e a respeitar as regras esportivas, técnicas e éticas
              do evento, caso seja convocado como atleta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">8. Foro</h2>
            <p>
              Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca
              de __FORO__ para dirimir quaisquer controvérsias, com renúncia expressa a qualquer
              outro, por mais privilegiado que seja.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
