import { useTranslation } from 'react-i18next';

const Athletes = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <header className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl mb-6">{t('athletes.title')}</h1>
          <p className="text-creme/60 text-xl max-w-2xl mx-auto">
            Become part of the elite. The path to becoming a legend starts here.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-20">
          <div className="lg:col-span-1">
            <h2 className="text-3xl mb-8 text-gold">{t('athletes.requirements')}</h2>
            <ul className="space-y-4">
              {[t('athletes.req_1'), t('athletes.req_2'), t('athletes.req_3'), t('athletes.req_4'), t('athletes.req_5')].map((req, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full border border-gold flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[10px] text-gold font-bold">{i + 1}</span>
                  </div>
                  <span className="text-white/80 text-sm leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-12 p-6 bg-gold/5 border border-gold/20">
              <p className="text-gold font-bold mb-2 uppercase tracking-widest">{t('athletes.fee_notice')}</p>
              <p className="text-xs text-white/40">Includes administrative processing and technical evaluation.</p>
            </div>

            <div className="mt-8">
              <h3 className="text-xl text-gold mb-4 uppercase tracking-widest">{t('athletes.how_it_works')}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{t('athletes.process_desc')}</p>
            </div>

            <div className="mt-8">
              <h3 className="text-xl text-gold mb-4 uppercase tracking-widest">{t('athletes.event_types_title')}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{t('athletes.event_types_desc')}</p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-black-card border border-white/10 min-h-[800px] relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 border-2 border-gold/20 rounded-full flex items-center justify-center mb-6">
                <div className="w-12 h-12 border-2 border-gold rounded-full animate-ping"></div>
              </div>
              <h3 className="text-2xl mb-4 uppercase tracking-widest">Typeform Integration</h3>
              <p className="text-white/40 max-w-md mb-8">
                This section will contain the embedded Typeform application. 
                Athletes will fill their data, upload videos, and pay the fee via PayPal.
              </p>
              <button className="btn-gold">{t('athletes.apply_now')}</button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-4xl mb-12 text-center">FAQ</h2>
          <div className="space-y-4">
            {[
              { q: "Quais são os requisitos mínimos para participar?", a: "Ser faixa preta de karatê shotokan, ter um vídeo de highlights com Kumite e performance do kata Bassai Dai, e possuir certificado de graduação válido." },
              { q: "O que deve conter no vídeo de aplicação?", a: "O vídeo deve mostrar seus melhores momentos em Kumite (luta) e uma execução técnica do kata Bassai Dai. Buscamos técnica, explosão e espírito marcial." },
              { q: "Como funciona a taxa de aplicação?", a: "A taxa de R$ 29,90 cobre os custos de análise técnica da nossa equipe. O pagamento é feito via PayPal dentro do formulário de inscrição." },
              { q: "Serei avisado se for selecionado?", a: "Sim, todos os candidatos recebem uma resposta oficial por e-mail em até 15 dias úteis após a submissão." }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-black-accent border border-white/5">
                <h4 className="text-gold font-bold mb-2 uppercase tracking-widest">{item.q}</h4>
                <p className="text-white/60 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Athletes;
