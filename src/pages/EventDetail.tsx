import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Shield, ArrowLeft } from 'lucide-react';

interface EventData {
  title: string;
  date: string;
  location: string;
  description: string;
  rules: string[];
}

const EVENTS: Record<string, EventData> = {
  'curitiba': {
    title: 'LEGENDS: CURITIBA',
    date: 'EM BREVE',
    location: 'Curitiba — Brasil',
    description: 'A próxima edição do Karate Legends acontece em Curitiba. Detalhes de local, data e programação serão divulgados em breve. Cadastre-se na lista de espera do PPV para ser notificado em primeira mão.',
    rules: [
      'Regras Shotokan Legends',
      'Contato pleno no corpo, controlado na cabeça',
      'Duração: 3 minutos',
      'Golden score em caso de empate'
    ]
  }
};

const EventDetail = () => {
  const { slug } = useParams();
  const { t } = useTranslation();

  const event = slug && EVENTS[slug] ? EVENTS[slug] : null;

  if (!event) {
    return (
      <div className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl mb-6">Evento não encontrado</h1>
          <p className="text-white/60 mb-12">Os detalhes deste evento ainda não estão disponíveis.</p>
          <Link to="/eventos" className="btn-outline-gold inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Voltar aos Eventos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <Link to="/eventos" className="flex items-center gap-2 text-gold text-sm font-bold uppercase tracking-widest mb-12 hover:translate-x-[-4px] transition-transform">
          <ArrowLeft size={16} />
          {t('events.title')}
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
            alt={event.title}
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="md:col-span-2">
            <section className="mb-16">
              <h2 className="text-3xl mb-6 text-gold">Sobre a Edição</h2>
              <p className="text-white/70 leading-relaxed text-lg">{event.description}</p>
            </section>
          </div>

          <div className="md:col-span-1">
            <section className="sticky top-32">
              <div className="p-8 bg-black-card border border-gold/20">
                <h3 className="text-xl mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-gold" />
                  Regulamento
                </h3>
                <ul className="space-y-4">
                  {event.rules.map((rule, i) => (
                    <li key={i} className="text-xs text-white/60 leading-relaxed list-disc ml-4">{rule}</li>
                  ))}
                </ul>
                <Link to="/ppv" className="btn-gold w-full mt-10 text-xs flex items-center justify-center">
                  {t('ppv.notify_me')}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
