import { useTranslation } from 'react-i18next';
import { Check, Tv, Smartphone, Tablet } from 'lucide-react';

const PPV = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <header className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl mb-6">{t('ppv.title')}</h1>
          <p className="text-creme/60 text-xl max-w-2xl mx-auto">{t('ppv.subtitle')}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {[
            { name: t('ppv.main_fight'), price: t('ppv.main_fight_price'), features: [t('ppv.features.live'), t('ppv.features.replay')], popular: false },
            { name: t('ppv.premium_pass'), price: t('ppv.premium_pass_price'), features: [t('ppv.features.live'), t('ppv.features.replay'), t('ppv.features.exclusive')], popular: true }
          ].map((plan, i) => (
            <div key={i} className={`card-premium relative flex flex-col ${plan.popular ? 'border-gold shadow-[0_0_50px_rgba(201,168,76,0.15)]' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-black-deep text-[10px] font-bold px-4 py-1 uppercase tracking-[0.2em]">
                  Most Popular
                </div>
              )}
              <h3 className="text-3xl mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-display text-gold">{plan.price}</span>
              </div>
              <ul className="space-y-4 mb-12 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                    <Check size={16} className="text-gold" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a href="https://hotmart.com" target="_blank" rel="noopener noreferrer"
                className={`w-full text-center ${plan.popular ? 'btn-gold' : 'btn-outline-gold'}`}>
                {t('ppv.buy_now')}
              </a>
            </div>
          ))}
        </div>

        <section className="mb-20">
          <h2 className="text-4xl mb-12 text-center uppercase tracking-widest">{t('ppv.past_events_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-premium flex flex-col items-center text-center">
              <h3 className="text-2xl mb-4">{t('ppv.single_past')}</h3>
              <p className="text-3xl font-display text-gold mb-6">{t('ppv.single_past_price')}</p>
              <a href="https://hotmart.com" className="btn-outline-gold w-full text-center">{t('ppv.buy_now')}</a>
            </div>
            <div className="card-premium flex flex-col items-center text-center border-gold/30">
              <h3 className="text-2xl mb-4">{t('ppv.all_past')}</h3>
              <p className="text-3xl font-display text-gold mb-6">{t('ppv.all_past_price')}</p>
              <a href="https://hotmart.com" className="btn-gold w-full text-center">{t('ppv.buy_now')}</a>
            </div>
          </div>
        </section>

        <div className="bg-black-accent p-12 border border-white/5 text-center">
          <h3 className="text-2xl mb-8 uppercase tracking-widest">Available on all devices</h3>
          <div className="flex justify-center gap-12 text-white/40">
            <div className="flex flex-col items-center gap-2"><Tv size={40} /><span className="text-[10px] uppercase tracking-widest">Smart TV</span></div>
            <div className="flex flex-col items-center gap-2"><Smartphone size={40} /><span className="text-[10px] uppercase tracking-widest">Mobile</span></div>
            <div className="flex flex-col items-center gap-2"><Tablet size={40} /><span className="text-[10px] uppercase tracking-widest">Tablet</span></div>
          </div>
          <p className="mt-12 text-white/30 text-sm max-w-xl mx-auto italic">
            Streaming is powered by Hotmart. After purchase, you will receive an email with your access credentials to the exclusive members area.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PPV;
