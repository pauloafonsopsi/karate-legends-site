import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const WaitlistForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '+55 ' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.whatsapp) {
      setErrorMsg(t('form.required_fields'));
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // Save to Supabase (primary)
      const { error: dbError } = await supabase.from('lista_espera_ppv').insert({
        nome: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
      });

      if (dbError) {
        console.error('Supabase error:', dbError);
        throw new Error(dbError.message);
      }

      setStatus('success');
      setFormData({ name: '', email: '', whatsapp: '+55 ' });
    } catch {
      setStatus('error');
      setErrorMsg(t('form.error'));
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <CheckCircle size={48} className="text-gold mb-4" aria-hidden="true" />
        <h3 className="text-2xl mb-2">{t('form.success_title')}</h3>
        <p className="text-white/60 max-w-md">{t('form.success_ppv')}</p>
      </div>
    );
  }

  const inputClass = "w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white-warm placeholder:text-white/30 focus:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black-card transition-colors";
  const labelClass = "block text-xs uppercase tracking-widest text-white/50 mb-2";

  return (
    <div className="card-premium border-gold/30 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Bell size={40} className="text-gold mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-3xl mb-2">{t('ppv.waitlist_title')}</h3>
        <p className="text-white/60">{t('ppv.waitlist_subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" aria-label={t('ppv.waitlist_title')}>
        <div>
          <label htmlFor="ppv-name" className={labelClass}>{t('form.name')} *</label>
          <input id="ppv-name" name="name" value={formData.name} onChange={handleChange} required autoComplete="name"
            className={inputClass}
            placeholder={t('form.name_placeholder')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ppv-email" className={labelClass}>{t('form.email')} *</label>
            <input id="ppv-email" name="email" type="email" value={formData.email} onChange={handleChange} required autoComplete="email"
              className={inputClass}
              placeholder={t('form.email_placeholder')} />
          </div>
          <div>
            <label htmlFor="ppv-whatsapp" className={labelClass}>{t('form.whatsapp')} *</label>
            <input id="ppv-whatsapp" name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange} required autoComplete="tel"
              className={inputClass}
              placeholder="+55 11 99999-9999" />
          </div>
        </div>
        {errorMsg && <p role="alert" className="text-red-400 text-sm">{errorMsg}</p>}
        <button type="submit" disabled={status === 'loading'} className="btn-gold w-full flex items-center justify-center gap-3">
          {status === 'loading' ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Bell size={18} aria-hidden="true" />}
          {status === 'loading' ? t('form.sending') : t('ppv.notify_me')}
        </button>
      </form>
    </div>
  );
};

export default WaitlistForm;
