import { useTranslation } from 'react-i18next';
import { Tv, Smartphone, Tablet, Radio, Repeat, Lock } from 'lucide-react';
import WaitlistForm from '@/components/WaitlistForm';

const PPV = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <header className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl mb-6">{t('ppv.title')}</h1>
          <p className="text-white-warm/70 text-xl max-w-2xl mx-auto">{t('ppv.subtitle')}</p>
        </header>

        {/* Waitlist Form */}
        <div className="mb-24">
          <WaitlistForm />
        </div>

        {/* Recursos da transmissão */}
        <section aria-labelledby="ppv-features-heading" className="mb-20">
          <h2 id="ppv-features-heading" className="sr-only">{t('ppv.features_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Radio, label: t('ppv.features.live') },
              { icon: Repeat, label: t('ppv.features.replay') },
              { icon: Lock, label: t('ppv.features.exclusive') }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="card-premium flex flex-col items-center text-center py-12">
                  <Icon size={32} className="text-gold mb-6" aria-hidden="true" />
                  <p className="text-sm text-white/80 leading-relaxed max-w-[220px]">{feature.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dispositivos */}
        <section aria-labelledby="ppv-devices-heading" className="bg-black-card p-12 border border-white/5 text-center">
          <h2 id="ppv-devices-heading" className="text-2xl mb-8 uppercase tracking-widest">{t('ppv.devices_title')}</h2>
          <div className="flex justify-center gap-12 text-white/60">
            <div className="flex flex-col items-center gap-2"><Tv size={40} aria-hidden="true" /><span className="text-xs uppercase tracking-widest">Smart TV</span></div>
            <div className="flex flex-col items-center gap-2"><Smartphone size={40} aria-hidden="true" /><span className="text-xs uppercase tracking-widest">Mobile</span></div>
            <div className="flex flex-col items-center gap-2"><Tablet size={40} aria-hidden="true" /><span className="text-xs uppercase tracking-widest">Tablet</span></div>
          </div>
          <p className="mt-12 text-white/50 text-sm max-w-xl mx-auto italic">
            {t('ppv.streaming_note')}
          </p>
        </section>
      </div>
    </div>
  );
};

export default PPV;
