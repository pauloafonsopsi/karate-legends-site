const PoliticaDados = () => (
  <div className="pt-32 pb-20">
    <div className="max-w-3xl mx-auto px-6">
      <header className="mb-12">
        <h1 className="text-5xl md:text-6xl mb-6">Política de Dados</h1>
        <div className="h-1 w-24 gold-gradient"></div>
        <p className="text-white/40 text-sm mt-6 uppercase tracking-widest">Última atualização: 11/05/2026</p>
      </header>

      <div className="prose prose-invert max-w-none space-y-8 text-white/80 leading-relaxed">
        <section>
          <h2 className="text-2xl text-gold mb-4">1. Quais dados coletamos</h2>
          <p>Coletamos: nome completo, e-mail, WhatsApp, cidade, país, estilo, graduação, associação/dojo, dados do sensei responsável (quando aplicável), redes sociais e links públicos para vídeo, certificado de graduação e documento de identificação enviados pelo próprio candidato.</p>
        </section>

        <section>
          <h2 className="text-2xl text-gold mb-4">2. Finalidade do tratamento</h2>
          <p>Os dados são usados exclusivamente para: (i) análise técnica da inscrição pelo consultor Legends; (ii) comunicação do resultado em caso de aprovação; (iii) gestão administrativa de pagamentos e convocações; (iv) divulgação institucional do evento, em conformidade com a autorização de uso de imagem dada pelo candidato.</p>
        </section>

        <section>
          <h2 className="text-2xl text-gold mb-4">3. Base legal (LGPD)</h2>
          <p>O tratamento se baseia no consentimento expresso do titular ao marcar a caixa de aceite no formulário e na execução de procedimentos preliminares relativos a contrato (art. 7º, I e V da Lei 13.709/2018).</p>
        </section>

        <section>
          <h2 className="text-2xl text-gold mb-4">4. Compartilhamento</h2>
          <p>Os dados não são vendidos. Podem ser compartilhados com: (i) provedores de infraestrutura (Lovable Cloud / Supabase) para armazenamento; (ii) processadores de pagamento; (iii) autoridades públicas, quando exigido por lei.</p>
        </section>

        <section>
          <h2 className="text-2xl text-gold mb-4">5. Retenção</h2>
          <p>Os dados são mantidos enquanto o candidato puder ser convocado para edições futuras. O titular pode solicitar a exclusão a qualquer momento, ressalvadas as obrigações legais de guarda.</p>
        </section>

        <section>
          <h2 className="text-2xl text-gold mb-4">6. Direitos do titular</h2>
          <p>O titular pode solicitar, a qualquer tempo: acesso, correção, anonimização, portabilidade, eliminação dos dados e revogação do consentimento. Solicitações devem ser enviadas pelo Instagram oficial @karatelegendsleague.</p>
        </section>

        <section>
          <h2 className="text-2xl text-gold mb-4">7. Segurança</h2>
          <p>Adotamos medidas técnicas e administrativas razoáveis para proteger os dados. O candidato é responsável por compartilhar links de Google Drive cientes de que ele mesmo definiu o acesso público — a organização não se responsabiliza por acessos indevidos a links tornados públicos pelo próprio candidato.</p>
        </section>
      </div>
    </div>
  </div>
);
export default PoliticaDados;