import { Crown, PlayCircle } from 'lucide-react';
import type { Atleta, Categoria, Luta } from '@/lib/legends';
import { useTranslation } from 'react-i18next';

type Props = { lutas: Luta[]; atletas: Atleta[]; categorias: Categoria[]; mostrarResultado?: boolean };

/** Fight card: same structure for the upcoming card and for past editions. */
const CardLutas = ({ lutas, atletas, categorias, mostrarResultado }: Props) => {
  const { t } = useTranslation();
  const nome = (id: string | null) => atletas.find(a => a.id === id)?.nome ?? t('legends.tbd');
  const cat = (id: string | null) => categorias.find(c => c.id === id)?.nome;
  if (!lutas.length) return <p className="text-muted-foreground text-sm">{t('legends.card_empty')}</p>;
  return (
    <ol className="divide-y divide-border border-y border-border">
      {lutas.map(l => {
        const venceuA = mostrarResultado && l.vencedor_id && l.vencedor_id === l.atleta_a_id;
        const venceuB = mostrarResultado && l.vencedor_id && l.vencedor_id === l.atleta_b_id;
        return (
          <li key={l.id} className={`py-5 ${l.status === 'cancelada' ? 'opacity-50' : ''}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
              {cat(l.categoria_id) && <span>{cat(l.categoria_id)}</span>}
              {l.fase && <span>{l.fase}</span>}
              {l.vale_cinturao && <span className="text-gold flex items-center gap-1"><Crown size={12} aria-hidden="true" /> {t('legends.belt')}</span>}
              {l.status !== 'realizada' && <span>{t(`legends.st_${l.status}`)}</span>}
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span className={`font-display text-xl md:text-3xl uppercase leading-tight ${venceuA ? 'text-gold' : 'text-foreground'}`}>{nome(l.atleta_a_id)}</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">vs</span>
              <span className={`font-display text-xl md:text-3xl uppercase leading-tight text-right ${venceuB ? 'text-gold' : 'text-foreground'}`}>{nome(l.atleta_b_id)}</span>
            </div>
            {(mostrarResultado && (l.resultado || l.metodo)) || l.link_gravacao ? (
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-sm">
                {mostrarResultado && <span className="text-muted-foreground">{[l.resultado, l.metodo].filter(Boolean).join(', ')}</span>}
                {l.link_gravacao && (
                  <a href={l.link_gravacao} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold min-h-[44px] text-xs uppercase tracking-widest">
                    <PlayCircle size={16} aria-hidden="true" /> {t('legends.watch_fight')}
                  </a>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
};

export default CardLutas;
