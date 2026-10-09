import { Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLegends } from '@/hooks/useLegends';

const Atletas = () => {
  const { t } = useTranslation();
  const { data, error, reload } = useLegends();
  const nome = (id: string) => data?.atletas.find(a => a.id === id)?.nome ?? '';
  const cats = data?.categorias.filter(c =>
    data.cinturoes.some(x => x.categoria_id === c.id) || data.rankings.some(r => r.categoria_id === c.id)) ?? [];

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <header className="text-center mb-14 max-w-3xl mx-auto">
          <p className="eyebrow mb-4">{t('nav.athletes')}</p>
          <h1 className="text-6xl md:text-8xl mb-6">{t('legends.ath_title')}</h1>
          <p className="text-muted-foreground text-lg">{t('legends.ath_sub')}</p>
        </header>

        <section className="grid md:grid-cols-2 gap-4 mb-20" aria-label="Acesso do atleta">
          {[
            { t: t('legends.door1'), d: t('legends.door1_d') },
            { t: t('legends.door2'), d: t('legends.door2_d') },
          ].map(p => (
            <div key={p.t} className="surface-elevated rounded-sm p-8">
              <h2 className="font-display text-3xl uppercase mb-2">{p.t}</h2>
              <p className="text-muted-foreground text-sm mb-6">{p.d}</p>
              <Link to="/atleta" className="btn-gold inline-flex items-center min-h-[44px]">{p.t}</Link>
            </div>
          ))}
        </section>

        <section aria-labelledby="cint">
          <p className="eyebrow mb-3">{t('legends.belts_eyebrow')}</p>
          <h2 id="cint" className="text-4xl md:text-6xl mb-8">{t('legends.belts_title')}</h2>
          {error && <div role="alert" className="surface-elevated p-6"><p className="mb-4">{t('legends.load_error')}</p><button onClick={reload} className="btn-outline-gold min-h-[44px]">{t('legends.retry')}</button></div>}
          {!data && !error && <div className="h-64 surface-elevated animate-pulse rounded-sm" aria-label="Carregando" />}
          {data && cats.length === 0 && <p className="text-muted-foreground">{t('legends.belts_empty')}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            {cats.map(c => {
              const cin = data!.cinturoes.find(x => x.categoria_id === c.id);
              const rk = data!.rankings.filter(r => r.categoria_id === c.id).sort((a, b) => a.posicao - b.posicao);
              return (
                <article key={c.id} className="surface-elevated rounded-sm p-6">
                  <h3 className="eyebrow mb-4">{c.nome}</h3>
                  {cin && (
                    <p className="flex items-center gap-3 mb-5">
                      <Crown className="text-gold" size={22} aria-label={t('legends.champion')} />
                      <span className="font-display text-3xl uppercase">{nome(cin.atleta_id)}</span>
                    </p>
                  )}
                  <ol className="space-y-2">
                    {rk.map(r => (
                      <li key={r.id} className="flex gap-4 text-sm border-t border-border pt-2">
                        <span className="font-display text-gold w-5">{r.posicao}</span>{nome(r.atleta_id)}
                      </li>
                    ))}
                  </ol>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Atletas;
