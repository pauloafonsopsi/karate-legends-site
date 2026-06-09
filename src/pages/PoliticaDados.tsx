import { useTranslation } from 'react-i18next';

const PoliticaDados = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <header className="mb-12">
          <h1 className="text-5xl md:text-6xl mb-6">{t('legal.privacy_title')}</h1>
          <div className="h-1 w-24 gold-gradient"></div>
          <p className="text-white/40 text-sm mt-6 uppercase tracking-widest">{t('legal.last_updated')}</p>
        </header>

        <div className="prose prose-invert max-w-none space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.privacy.collected_title')}</h2>
            <p>{t('legal.privacy.collected_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.privacy.purpose_title')}</h2>
            <p>{t('legal.privacy.purpose_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.privacy.legal_title')}</h2>
            <p>{t('legal.privacy.legal_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.privacy.sharing_title')}</h2>
            <p>{t('legal.privacy.sharing_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.privacy.retention_title')}</h2>
            <p>{t('legal.privacy.retention_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.privacy.rights_title')}</h2>
            <p>{t('legal.privacy.rights_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl text-gold mb-4">{t('legal.privacy.security_title')}</h2>
            <p>{t('legal.privacy.security_text')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDados;