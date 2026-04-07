import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Loader2, CheckCircle } from 'lucide-react';

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4_bAT7GBjskA_kLb0TeY5UUGDhp_ZHpyUmFeIHHIabAti8h4uFWsnoUk9IHsx5If_Ng/exec';

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
      const iframe = document.createElement('iframe');
      iframe.name = 'ppv-submit-frame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'GET';
      form.action = GOOGLE_APPS_SCRIPT_URL;
      form.target = 'ppv-submit-frame';

      const fields = {
        type: 'ppv_interest',
        timestamp: new Date().toISOString(),
        ...formData,
        whatsapp: "'" + formData.whatsapp
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

      setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
      }, 5000);

      setStatus('success');
      setFormData({ name: '', email: '', whatsapp: '' });
    } catch {
      setStatus('error');
      setErrorMsg(t('form.error'));
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <CheckCircle size={48} className="text-gold mb-4" />
        <h3 className="text-2xl mb-2">{t('form.success_title')}</h3>
        <p className="text-white/60 max-w-md">{t('form.success_ppv')}</p>
      </div>
    );
  }

  return (
    <div className="card-premium border-gold/30 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Bell size={40} className="text-gold mx-auto mb-4" />
        <h3 className="text-3xl mb-2">{t('ppv.waitlist_title')}</h3>
        <p className="text-white/60">{t('ppv.waitlist_subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={formData.name} onChange={handleChange} required
          className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none transition-colors"
          placeholder={t('form.name')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="email" type="email" value={formData.email} onChange={handleChange} required
            className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none transition-colors"
            placeholder={t('form.email')} />
          <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} required
            className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none transition-colors"
            placeholder="WhatsApp: +55 11 99999-9999" />
        </div>
        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
        <button type="submit" disabled={status === 'loading'} className="btn-gold w-full flex items-center justify-center gap-3">
          {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
          {status === 'loading' ? t('form.sending') : t('ppv.notify_me')}
        </button>
      </form>
    </div>
  );
};

export default WaitlistForm;
