import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle } from 'lucide-react';

const CheckoutRetorno = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="pt-40 pb-32">
      <div className="max-w-xl mx-auto px-6 text-center">
        {sessionId ? (
          <>
            <CheckCircle size={64} className="text-gold mx-auto mb-8" aria-hidden="true" />
            <h1 className="text-5xl mb-5">{t('members.success_title')}</h1>
            <p className="text-muted-foreground mb-10">{t('members.success_text')}</p>
          </>
        ) : (
          <>
            <AlertCircle size={64} className="text-gold mx-auto mb-8" aria-hidden="true" />
            <h1 className="text-5xl mb-5">{t('members.no_session_title')}</h1>
            <p className="text-muted-foreground mb-10">{t('members.no_session_text')}</p>
          </>
        )}
        <Link to="/membros" className="btn-outline-gold">{t('members.back_to_plans')}</Link>
      </div>
    </div>
  );
};

export default CheckoutRetorno;
