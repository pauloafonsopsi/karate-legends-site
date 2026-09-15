import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import prestigeLogo from '@/assets/karate-legends-prestige-lockup.png';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[92svh] flex items-end md:items-center pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://lh3.googleusercontent.com/d/14fUNhoYfrrzIXBLUuzkbJ8LFNz8LkaE_"
            className="w-full h-full object-cover opacity-75"
            alt="Competição Karate Legends em uma arena iluminada"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/60"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <h1 className="text-base md:text-2xl text-gold uppercase font-bold tracking-[0.45em] md:tracking-[0.6em] mb-8">
              {t('hero.tagline')}
            </h1>
            <img
              src={prestigeLogo}
              alt="Karate Legends Logo"
              className="w-56 md:w-[27rem] h-auto object-contain mb-8"
            />
            <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mb-10 font-light leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 mb-14">
              <Link to="/ppv" className="btn-gold flex items-center justify-center gap-2 px-10 py-4 text-sm">
                <Play size={18} fill="currentColor" />
                {t('hero.cta_ppv')}
              </Link>
              <Link to="/atletas" className="btn-outline-gold px-10 py-4 text-sm">
                {t('hero.cta_apply')}
              </Link>
            </div>

            {/* Próxima Edição: placeholder elegante */}
            <div className="inline-flex flex-col items-center border-t border-gold/60 pt-5">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground mb-3 font-bold flex items-center gap-4">
                {t('hero.countdown_label')}
              </p>
              <span className="text-4xl md:text-5xl font-display text-foreground uppercase">
                {t('hero.countdown_value')}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Summary & Stats */}
      <section className="py-28 md:py-36 bg-background relative border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            <span className="eyebrow block mb-5">Karate Legends</span>
            <h2 className="text-5xl md:text-7xl mb-10 leading-[0.9] uppercase font-display">
              {t('summary.title')}
            </h2>
            <div className="h-1 w-24 gold-gradient mb-12"></div>
            <p className="text-lg md:text-2xl text-muted-foreground leading-relaxed mb-16 font-light">
              {t('summary.text')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 border-y border-border">
              {[
                { label: t('stats.countries'), value: '2' },
                { label: t('stats.belts'), value: '2' },
                { label: t('stats.editions'), value: '4' }
              ].map((stat, i) => (
                <div key={i} className="bg-background p-10 flex flex-col items-start text-left border-b md:border-b-0 md:border-r last:border-0 border-border group hover:bg-card transition-colors">
                  <span className="text-7xl md:text-8xl font-display text-gold mb-4 leading-none">{stat.value}</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold">{stat.label}</span>
                  {stat.label === t('stats.belts') && (
                    <span className="text-xs text-muted-foreground mt-4 leading-tight font-medium max-w-[180px]">{t('stats.belts_desc')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Next Event */}
      <section className="py-32 bg-black-deep">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-5xl md:text-6xl mb-4">{t('events.title')}</h2>
              <div className="h-1 w-24 gold-gradient"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: t('events.curitiba_title'),
                date: t('events.curitiba_date'),
                location: t('events.curitiba_loc'),
                img: "https://images.unsplash.com/photo-1526671315163-1aa5e1267e8e?q=80&w=2070&auto=format&fit=crop"
              }
            ].map((event, i) => (
              <div key={i} className="card-premium group">
                <div className="relative h-48 mb-6 overflow-hidden">
                  <img
                    src={event.img}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                    alt={event.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-2xl mb-2 text-white-warm group-hover:text-gold transition-colors">{event.title}</h3>
                <p className="text-gold text-sm font-bold mb-4 tracking-widest">{event.date}</p>
                <p className="text-white/40 text-sm mb-8">{event.location}</p>
                <Link to="/eventos" className="text-xs uppercase tracking-[0.2em] font-bold border-b border-gold/30 pb-1 hover:border-gold transition-colors">
                  {t('events.view_details')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
