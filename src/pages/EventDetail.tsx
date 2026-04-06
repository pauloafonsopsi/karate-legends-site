import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Shield, Clock, ArrowLeft } from 'lucide-react';

const EventDetail = () => {
  const { slug } = useParams();
  const { t } = useTranslation();

  const event = {
    title: "LEGENDS: CURITIBA",
    date: "11 DE JULHO, 2025",
    location: "Hard Rock Café Arena, Curitiba - PR",
    description: "A edição de Curitiba traz o melhor do karatê Shotokan para a arena do Hard Rock Café. Prepare-se para lutas épicas e a definição de novos talentos.",
    schedule: [
      { time: "18:00", activity: "Abertura dos Portões" },
      { time: "19:00", activity: "Início do Card Preliminar" },
      { time: "21:00", activity: "Card Principal" },
      { time: "22:30", activity: "Luta Principal" }
    ],
    rules: [
      "Regras Shotokan Legends",
      "Contato pleno no corpo, controlado na cabeça",
      "Duração: 3 minutos",
      "Golden score em caso de empate"
    ]
  };

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <Link to="/eventos" className="flex items-center gap-2 text-gold text-sm font-bold uppercase tracking-widest mb-12 hover:translate-x-[-4px] transition-transform">
          <ArrowLeft size={16} />
          Back to Events
        </Link>

        <header className="mb-16">
          <h1 className="text-5xl md:text-7xl mb-6">{event.title}</h1>
          <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-2 text-white/60">
              <Calendar size={18} className="text-gold" />
              <span className="text-sm uppercase tracking-widest">{event.date}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <MapPin size={18} className="text-gold" />
              <span className="text-sm uppercase tracking-widest">{event.location}</span>
            </div>
          </div>
        </header>

        <div className="aspect-video bg-black-card border border-white/10 mb-16 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1526671315163-1aa5e1267e8e?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale brightness-50"
            alt="Venue"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="md:col-span-2">
            <section className="mb-16">
              <h2 className="text-3xl mb-6 text-gold">Overview</h2>
              <p className="text-white/70 leading-relaxed text-lg">{event.description}</p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl mb-6 text-gold">Schedule</h2>
              <div className="space-y-4">
                {event.schedule.map((item, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 bg-black-accent border border-white/5">
                    <div className="flex items-center gap-2 text-gold font-bold">
                      <Clock size={16} />
                      {item.time}
                    </div>
                    <div className="text-white-warm uppercase tracking-widest text-sm">{item.activity}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="md:col-span-1">
            <section className="sticky top-32">
              <div className="p-8 bg-black-card border border-gold/20">
                <h3 className="text-xl mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-gold" />
                  Regulations
                </h3>
                <ul className="space-y-4">
                  {event.rules.map((rule, i) => (
                    <li key={i} className="text-xs text-white/60 leading-relaxed list-disc ml-4">{rule}</li>
                  ))}
                </ul>
                <button className="btn-gold w-full mt-10 text-xs">Register Now</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
