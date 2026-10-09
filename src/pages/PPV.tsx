import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Loader2, MapPin, PlayCircle } from 'lucide-react';
import { fetchPlanos, formatPreco, txt, type Plano } from '@/lib/planos';
import { useLegends } from '@/hooks/useLegends';
import { dataBR, proximoEvento, realizados } from '@/lib/legends';
import Contagem from '@/components/legends/Contagem';
import CardLutas from '@/components/legends/CardLutas';
import WaitlistForm from '@/components/WaitlistForm';
import { StripeEmbeddedCheckout } from '@/components/StripeEmbeddedCheckout';

const PPV = () => {
  const { t, i18n } = useTranslation();
  const { data, error, reload } = useLegends();
  const [plano, setPlano] = useState<Plano | null>(null);
  const [email, setEmail] = useState('');
  const [checkout, setCheckout] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    fetchPlanos().then(ps => setPlano(ps.find(p => p.chave.startsWith('ppv')) ?? null)).catch(() => {});
  }, []);

  const prox = data ? proximoEvento(data.eventos) : null;
  const acervo = data ? realizados(data.eventos) : [];
  const lutasDe = (id: string) => data?.lutas.filter(l => l.evento_id === id) ?? [];

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <header className="text-center mb-14 max-w-3xl mx-auto">
          <p className="eyebrow mb-4">{t('ppv.eyebrow', 'Pay-per-view')}</p>
          <h1 className="text-6xl md:text-8xl mb-6">{t('ppv.title')}</h1>
          <p className="text-muted-foreground text-lg">{t('ppv.subtitle')}</p>
        </header>

        {error && (
          <div role="alert" className="surface-elevated p-6 rounded-sm text-center mb-12">
            <p className="mb-4">{t('legends.load_error')}</p>
            <button onClick={reload} className="btn-outline-gold min-h-[44px]">{t('legends.retry')}</button>
          </div>
        )}
        {!data && !error && <div className="h-96 surface-elevated rounded-sm animate-pulse mb-16" aria-label="Carregando" />}

        {data && (prox ? (
          <section aria-labelledby="prox" className="surface-elevated rounded-sm p-6 md:p-10 mb-20">
            <p className="eyebrow mb-3 text-center">{t('legends.next_event')}</p>
            <h2 id="prox" className="text-4xl md:text-6xl text-center mb-3">{prox.nome}</h2>
            <p className="text-center text-muted-foreground mb-8 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
              <span>{dataBR(prox.data_evento, i18n.language, t('legends.date_tbd'))}</span>
              {(prox.local || prox.cidade) && <span className="flex items-center gap-1"><MapPin size={14} aria-hidden="true" />{[prox.local, prox.cidade].filter(Boolean).join(', ')}</span>}
            </p>
            <div className="mb-10"><Contagem data={prox.data_evento} /></div>

            <div className="max-w-md mx-auto mb-12 text-center">
              {plano ? (
                checkout ? (
                  <StripeEmbeddedCheckout priceId={plano.chave} customerEmail={email} />
                ) : (
                  <form onSubmit={e => { e.preventDefault(); if (/\S+@\S+\.\S+/.test(email)) setCheckout(true); }} className="space-y-3">
                    <p className="font-display text-4xl text-gold">{formatPreco(plano.preco_centavos, plano.moeda)}</p>
                    <p className="text-sm text-muted-foreground">{txt(plano.periodo, i18n.language)}</p>
                    <label htmlFor="ppv-email" className="sr-only">E-mail</label>
                    <input id="ppv-email" type="email" required placeholder={t('legends.email')} value={email} onChange={e => setEmail(e.target.value)} className="form-field text-base w-full" />
                    <button type="submit" className="btn-gold w-full min-h-[44px]">{t('legends.buy')}</button>
                  </form>
                )
              ) : <Loader2 className="animate-spin mx-auto text-gold" aria-label="Carregando" />}
            </div>

            <h3 className="eyebrow mb-4">{t('legends.card')}</h3>
            <CardLutas lutas={lutasDe(prox.id)} atletas={data.atletas} categorias={data.categorias} />
          </section>
        ) : (
          <section className="mb-20">
            <p className="text-center text-muted-foreground mb-8">{t('legends.coming')}</p>
            <WaitlistForm />
          </section>
        ))}

        {data && (
          <section aria-labelledby="acervo">
            <p className="eyebrow mb-3">{t('legends.archive')}</p>
            <h2 id="acervo" className="text-4xl md:text-6xl mb-8">{t('legends.editions')}</h2>
            {acervo.length === 0 ? (
              <p className="text-muted-foreground">{t('legends.archive_empty')}</p>
            ) : (
              <div className="space-y-4">
                {acervo.map(ev => (
                  <article key={ev.id} className="surface-elevated rounded-sm">
                    <button onClick={() => setAberto(aberto === ev.id ? null : ev.id)} aria-expanded={aberto === ev.id}
                      className="w-full text-left p-5 md:p-6 flex flex-wrap items-center justify-between gap-3 min-h-[44px]">
                      <div>
                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground mb-1">
                          {[ev.edicao ? t('legends.edition', { n: ev.edicao }) : null, t(`legends.${ev.formato}`), dataBR(ev.data_evento, i18n.language, t('legends.date_tbd'))].filter(Boolean).join('  |  ')}
                        </p>
                        <h3 className="font-display text-2xl md:text-3xl uppercase">{ev.nome}</h3>
                      </div>
                      <span className="text-xs uppercase tracking-widest text-gold">{aberto === ev.id ? t('legends.close') : t('legends.results')}</span>
                    </button>
                    {aberto === ev.id && (
                      <div className="px-5 md:px-6 pb-6">
                        {ev.gravacao_publica && ev.link_gravacao && (
                          <a href={ev.link_gravacao} target="_blank" rel="noopener noreferrer" className="btn-outline-gold inline-flex items-center gap-2 mb-5 min-h-[44px]">
                            <PlayCircle size={16} aria-hidden="true" /> {t('legends.watch_full')}
                          </a>
                        )}
                        <CardLutas lutas={lutasDe(ev.id)} atletas={data.atletas} categorias={data.categorias} mostrarResultado />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
            <p className="text-center mt-12 text-sm text-muted-foreground">
              {t('legends.see_belts')} <Link to="/atletas" className="text-gold underline">{t('nav.athletes')}</Link>.
            </p>
          </section>
        )}
      </div>
    </div>
  );
};

export default PPV;
