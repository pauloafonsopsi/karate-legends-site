import { useTranslation } from 'react-i18next';

const Privacy = () => {
  const { t: _t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <header className="mb-16">
          <h1 className="text-5xl md:text-7xl mb-6">Política de Privacidade</h1>
          <div className="h-1 w-24 gold-gradient"></div>
          <p className="text-white/40 text-sm mt-6 uppercase tracking-widest">Última atualização: __DATA_ATUALIZACAO__</p>
        </header>

        <div className="prose prose-invert max-w-none space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-2xl text-gold mb-4">1. Quem somos</h2>
            <p>
              Esta Política de Privacidade aplica-se ao site Karate Legends, operado por __RAZAO_SOCIAL__,
              inscrita no CNPJ sob o nº __CNPJ__, com sede em __ENDERECO_COMPLETO__. Para qualquer
              questão relativa a esta política, entre em contato pelo e-mail __EMAIL_CONTATO__.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">2. Quais dados coletamos</h2>
            <p>
              Coletamos os dados que você fornece voluntariamente nos formulários do site:
              nome completo, e-mail, número de WhatsApp, cidade, país, estilo de karatê,
              graduação, associação ou dojo, redes sociais, e os links dos arquivos enviados
              (vídeo de aplicação, certificado de graduação, documento de identificação).
              Também coletamos automaticamente dados técnicos de navegação como endereço IP,
              tipo de dispositivo e páginas acessadas, por meio de cookies estritamente necessários.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">3. Para que usamos seus dados</h2>
            <p>
              Os dados de inscrição de atletas são utilizados exclusivamente para análise da
              candidatura pelo consultor técnico Legends, comunicação sobre o resultado dessa
              análise e eventual convocação para futuras edições do evento. Os dados da lista
              de espera de PPV são utilizados para notificá-lo quando as inscrições para a
              transmissão estiverem disponíveis. Não vendemos, alugamos ou compartilhamos seus
              dados com terceiros para fins comerciais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">4. Com quem compartilhamos</h2>
            <p>
              Compartilhamos dados estritamente necessários com: a Hotmart (plataforma de
              processamento de pagamentos para a taxa de análise e venda de PPV), o Google
              (Google Drive, onde ficam hospedados os arquivos enviados por você, e Google
              Workspace, onde recebemos seu e-mail), e a Supabase (banco de dados que armazena
              os registros de inscrição). Esses parceiros possuem suas próprias políticas de
              privacidade, e seguem padrões de proteção de dados compatíveis com a LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">5. Seus direitos (LGPD)</h2>
            <p>
              Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a
              acessar, corrigir, atualizar, excluir ou portar seus dados, bem como a revogar o
              consentimento de tratamento a qualquer momento. Para exercer qualquer um desses
              direitos, escreva para __EMAIL_CONTATO__. Responderemos em até 15 dias úteis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">6. Por quanto tempo guardamos</h2>
            <p>
              Dados de inscrição de atletas são mantidos pelo período em que o atleta permanece
              elegível para futuras edições, ou até que o atleta solicite exclusão. Dados da lista
              de espera de PPV são mantidos enquanto a edição correspondente estiver ativa, e
              excluídos em até 12 meses após o evento. Dados financeiros (recibos de pagamento)
              são retidos pelo prazo legal mínimo de 5 anos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">7. Cookies</h2>
            <p>
              Utilizamos apenas cookies estritamente necessários ao funcionamento do site (ex.: idioma
              selecionado, sessão de navegação). Não utilizamos cookies publicitários nem de
              rastreamento entre sites de terceiros sem o seu consentimento explícito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">8. Alterações nesta política</h2>
            <p>
              Esta política pode ser revisada periodicamente. Em caso de mudanças relevantes,
              avisaremos por e-mail aos cadastrados ou por aviso visível no site, e atualizaremos
              a data no topo deste documento.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
