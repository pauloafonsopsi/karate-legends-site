import { useTranslation } from 'react-i18next';
import AthleteForm from '@/components/AthleteForm';

const Athletes = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <header className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl mb-6">{t('athletes.title')}</h1>
          <p className="text-[#F5F0E6]/60 text-xl max-w-2xl mx-auto">
            {t('athletes.subtitle')}
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

            <div className="mt-8">
              <h3 className="text-xl text-gold mb-4 uppercase tracking-widest">{t('athletes.how_it_works')}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{t('athletes.process_desc')}</p>
            </div>

            <div className="mt-8">
              <h3 className="text-xl text-gold mb-4 uppercase tracking-widest">{t('athletes.event_types_title')}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{t('athletes.event_types_desc')}</p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 overflow-hidden">
            <AthleteForm />
          </div>
        </div>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-4xl mb-12 text-center">FAQ</h2>
          <div className="space-y-4">
            {[
              { q: t('faq.q1'), a: t('faq.a1') },
              { q: t('faq.q2'), a: t('faq.a2') },
              { q: t('faq.q3'), a: t('faq.a3') },
              { q: t('faq.q4'), a: t('faq.a4') }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-[#0A0A0A] border border-white/5">
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
