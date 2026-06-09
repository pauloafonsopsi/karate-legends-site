import { useTranslation } from 'react-i18next';

const TermosAtleta = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <header className="mb-12">
          <h1 className="text-5xl md:text-6xl mb-6">{t('legal.terms_title')}</h1>
          <div className="h-1 w-24 gold-gradient"></div>
          <p className="text-white/40 text-sm mt-6 uppercase tracking-widest">{t('legal.last_updated')}</p>
        </header>

        <div className="prose prose-invert max-w-none space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.terms.acceptance_title')}</h2>
            <p>{t('legal.terms.acceptance_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.terms.voluntary_title')}</h2>
            <p>{t('legal.terms.voluntary_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.terms.accuracy_title')}</h2>
            <p>{t('legal.terms.accuracy_text')}</p>
            <p>{t('legal.terms.accuracy_text2')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.terms.no_notify_title')}</h2>
            <p>{t('legal.terms.no_notify_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.terms.deadline_title')}</h2>
            <p>{t('legal.terms.deadline_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.terms.fee_title')}</h2>
            <p>{t('legal.terms.fee_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.terms.approval_title')}</h2>
            <p>{t('legal.terms.approval_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.terms.image_title')}</h2>
            <p>{t('legal.terms.image_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.terms.liability_title')}</h2>
            <p>{t('legal.terms.liability_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.terms.venue_title')}</h2>
            <p>{t('legal.terms.venue_text')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermosAtleta;