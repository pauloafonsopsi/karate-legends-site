import { useTranslation } from 'react-i18next';
import { Tv, Smartphone, Tablet } from 'lucide-react';
import WaitlistForm from '@/components/WaitlistForm';

const PPV = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <header className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl mb-6">{t('ppv.title')}</h1>
          <p className="text-[#F5F0E6]/60 text-xl max-w-2xl mx-auto">{t('ppv.subtitle')}</p>
        </header>

        {/* Waitlist Form */}
        <div className="mb-20">
          <WaitlistForm />
        </div>

        {/* Pricing preview (coming soon) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 opacity-50 pointer-events-none">
          {[
            { name: t('ppv.main_fight'), price: t('ppv.main_fight_price'), popular: false },
            { name: t('ppv.premium_pass'), price: t('ppv.premium_pass_price'), popular: true }
          ].map((plan, i) => (
            <div key={i} className={`card-premium relative flex flex-col ${plan.popular ? 'border-gold' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-[#050505] text-[10px] font-bold px-4 py-1 uppercase tracking-[0.2em]">
                  {t('ppv.coming_soon_label')}
                </div>
              )}
              <h3 className="text-3xl mb-2">{plan.name}</h3>
              <span className="text-4xl font-display text-gold">{plan.price}</span>
              <p className="text-white/40 text-sm mt-4">{t('ppv.coming_soon_msg')}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0A0A0A] p-12 border border-white/5 text-center">
          <h3 className="text-2xl mb-8 uppercase tracking-widest">{t('ppv.devices_title')}</h3>
          <div className="flex justify-center gap-12 text-white/40">
            <div className="flex flex-col items-center gap-2"><Tv size={40} /><span className="text-[10px] uppercase tracking-widest">Smart TV</span></div>
            <div className="flex flex-col items-center gap-2"><Smartphone size={40} /><span className="text-[10px] uppercase tracking-widest">Mobile</span></div>
            <div className="flex flex-col items-center gap-2"><Tablet size={40} /><span className="text-[10px] uppercase tracking-widest">Tablet</span></div>
          </div>
          <p className="mt-12 text-white/30 text-sm max-w-xl mx-auto italic">
            {t('ppv.streaming_note')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PPV;
