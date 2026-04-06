import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-07-11T20:00:00').getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) { clearInterval(timer); return; }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center pt-20 overflow-hidden">
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
            <div className="mb-6 flex flex-col items-center">
              <img 
                src="/logo.png" 
                alt="Karate Legends Logo" 
                className="w-32 h-32 md:w-48 md:h-48 object-contain mb-8 animate-pulse"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs uppercase tracking-[0.5em] text-gold font-bold mb-4 block">The World Stage for Shotokan</span>
              <h1 className="text-8xl md:text-[12rem] font-display mb-4 tracking-tighter leading-[0.85] uppercase">
                <span className="block text-white-warm drop-shadow-2xl">KARATE</span>
                <span className="block gold-text-gradient drop-shadow-2xl">LEGENDS</span>
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

            {/* Countdown */}
            <div className="inline-flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-8 font-bold flex items-center gap-4">
                <span className="h-[1px] w-8 bg-white/20"></span>
                {t('hero.countdown_label')}
                <span className="h-[1px] w-8 bg-white/20"></span>
              </p>
              <div className="flex gap-12 md:gap-20">
                {[
                  { label: 'Days', value: timeLeft.days },
                  { label: 'Hours', value: timeLeft.hours },
                  { label: 'Mins', value: timeLeft.minutes },
                  { label: 'Secs', value: timeLeft.seconds }
                ].map((unit, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-5xl md:text-7xl font-display text-white-warm mb-2 tabular-nums">
                      {unit.value.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-gold font-bold">{unit.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Summary & Stats */}
      <section className="py-40 bg-black-deep relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
            <div className="lg:col-span-7">
              <h2 className="text-6xl md:text-8xl mb-12 leading-[0.9] uppercase font-display tracking-tighter">
                {t('summary.title')}
              </h2>
              <div className="h-1 w-24 gold-gradient mb-12"></div>
              <p className="text-xl md:text-2xl text-white/60 leading-relaxed mb-16 font-light">
                {t('summary.text')}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 px-1 bg-white/5 border border-white/5">
                {[
                  { label: t('stats.countries'), value: '3' },
                  { label: t('stats.belts'), value: '3' },
                  { label: t('stats.editions'), value: '5' }
                ].map((stat, i) => (
                  <div key={i} className="bg-black-deep p-12 flex flex-col items-center text-center group hover:bg-white/[0.02] transition-colors">
                    <span className="text-7xl md:text-8xl font-display gold-text-gradient mb-4 leading-none">{stat.value}</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">{stat.label}</span>
                    {stat.label === t('stats.belts') && (
                      <span className="text-[9px] text-white/20 mt-4 leading-tight font-medium max-w-[150px]">{t('stats.belts_desc')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-5 relative mt-12 lg:mt-0">
              <div className="aspect-[3/4] relative group">
                <div className="absolute -inset-4 border border-gold/20 -z-10 translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-700"></div>
                <img 
                  src="https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2072&auto=format&fit=crop" 
                  className="w-full h-full object-cover grayscale brightness-75 border border-white/10"
                  alt="Karate Spirit"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-8 left-8 right-8 p-8 glass-morphism border border-white/10">
                  <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">The Legacy</p>
                  <p className="text-sm text-white/60 italic font-serif">"Onde lendas são forjadas e o respeito é conquistado."</p>
                </div>
              </div>
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
