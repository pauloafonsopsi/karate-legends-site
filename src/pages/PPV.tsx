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
          <p className="text-[#F5F0E6]/60 text-xl max-w-2xl mx-auto">{t('ppv.subtitle')}</p>
        </header>

        {/* Waitlist Form */}
        <div className="mb-24">
          <WaitlistForm />
        </div>

        {/* Recursos da transmissão */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { icon: Radio, label: t('ppv.features.live') },
            { icon: Repeat, label: t('ppv.features.replay') },
            { icon: Lock, label: t('ppv.features.exclusive') }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="card-premium flex flex-col items-center text-center py-12">
                <Icon size={32} className="text-gold mb-6" />
                <p className="text-sm text-white/70 leading-relaxed max-w-[200px]">{feature.label}</p>
              </div>
            );
          })}
        </div>

        {/* Dispositivos */}
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
