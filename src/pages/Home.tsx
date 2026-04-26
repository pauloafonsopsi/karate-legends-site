import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://lh3.googleusercontent.com/d/14fUNhoYfrrzIXBLUuzkbJ8LFNz8LkaE_"
            className="w-full h-full object-cover opacity-80"
            alt="Karate Legends Hero"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black-deep via-black-deep/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black-deep/60 via-transparent to-transparent"></div>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="mb-4 flex flex-col items-center">
              <img
                src="/logo.png"
                alt="Karate Legends Logo"
                className="w-40 md:w-64 object-contain mb-4"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm uppercase tracking-[0.5em] text-gold font-bold mb-4 block">The World Stage for Shotokan &amp; Shito-Ryu</span>
              <h1 className="text-7xl md:text-[10rem] font-display mb-4 tracking-tighter leading-[0.85] uppercase">
                <span className="block text-white-warm drop-shadow-2xl">KARATE</span>
                <span className="block text-gold drop-shadow-2xl">LEGENDS</span>
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-creme/80 max-w-2xl mx-auto mb-12 font-light tracking-wide leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-20">
              <Link to="/ppv" className="btn-gold flex items-center gap-2 px-10 py-4 text-sm">
                <Play size={18} fill="currentColor" />
                {t('hero.cta_ppv')}
              </Link>
              <Link to="/atletas" className="btn-outline-gold px-10 py-4 text-sm">
                {t('hero.cta_apply')}
              </Link>
            </div>

            {/* Próxima Edição: placeholder elegante */}
            <div className="inline-flex flex-col items-center">
              <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-6 font-bold flex items-center gap-4">
                <span className="h-[1px] w-8 bg-white/20" aria-hidden="true"></span>
                {t('hero.countdown_label')}
                <span className="h-[1px] w-8 bg-white/20" aria-hidden="true"></span>
              </p>
              <span className="text-5xl md:text-7xl font-display text-gold tracking-tight uppercase">
                {t('hero.countdown_value')}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Summary & Stats */}
      <section className="py-40 bg-black-deep relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            <h2 className="text-6xl md:text-8xl mb-12 leading-[0.9] uppercase font-display tracking-tighter">
              {t('summary.title')}
            </h2>
            <div className="h-1 w-24 gold-gradient mb-12"></div>
            <p className="text-xl md:text-2xl text-white/60 leading-relaxed mb-16 font-light">
              {t('summary.text')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 px-1 bg-white/5 border border-white/5">
              {[
                { label: t('stats.countries'), value: '2' },
                { label: t('stats.belts'), value: '2' },
                { label: t('stats.editions'), value: '4' }
              ].map((stat, i) => (
                <div key={i} className="bg-black-deep p-12 flex flex-col items-center text-center group hover:bg-white/[0.02] transition-colors">
                  <span className="text-7xl md:text-8xl font-display text-gold mb-4 leading-none">{stat.value}</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/60 font-bold">{stat.label}</span>
                  {stat.label === t('stats.belts') && (
                    <span className="text-xs text-white/40 mt-4 leading-tight font-medium max-w-[180px]">{t('stats.belts_desc')}</span>
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
