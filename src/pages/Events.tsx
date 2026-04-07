import { useTranslation } from 'react-i18next';

const Events = () => {
  const { t } = useTranslation();

  const events = [
    { 
      title: t('events.curitiba_title'), 
      date: t('events.curitiba_date'), 
      location: t('events.curitiba_loc'),
      status: null,
      type: "Championship",
      img: "https://images.unsplash.com/photo-1526671315163-1aa5e1267e8e?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-20">
          <h1 className="text-6xl md:text-8xl mb-6">{t('events.title')}</h1>
          <div className="h-1 w-24 gold-gradient"></div>
        </header>

        <div className="space-y-12">
          {events.map((event, i) => (
            <div key={i} className="group bg-black-card border border-white/5 flex flex-col md:flex-row overflow-hidden hover:border-gold/30 transition-colors">
              <div className="md:w-1/3 aspect-video md:aspect-auto overflow-hidden">
                <img 
                  src={event.img} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                  alt={event.title}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-8 md:p-12 flex-grow flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">{event.type}</span>
                </div>
                <h3 className="text-3xl md:text-4xl mb-4">{event.title}</h3>
                <div className="flex flex-wrap gap-8 text-white/40 text-sm uppercase tracking-widest font-bold">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gold/50 mb-1">Date</span>
                    {event.date}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gold/50 mb-1">Location</span>
                    {event.location}
                  </div>
                </div>
                <div className="mt-8">
                  <button className="btn-outline-gold text-xs py-2 px-6">
                    {t('events.view_details')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-32">
          <h2 className="text-4xl mb-12 uppercase tracking-widest">{t('events.past_title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-square bg-black-accent border border-white/5 flex items-center justify-center group cursor-pointer overflow-hidden relative">
                <div className="text-center z-10">
                  <span className="block text-2xl font-display text-white-warm group-hover:text-gold transition-colors">LEGENDS {n}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">Results</span>
                </div>
                <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Events;