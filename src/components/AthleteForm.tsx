import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DriveTutorial from './DriveTutorial';

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcXIdnB-dWAPhHlarjerfuZBnKEXbmADzAnUTKMqQ2mE7eaD2_9wp0tXeq3pQxAKJs/exec';

interface FormData {
  name: string;
  email: string;
  whatsapp: string;
  style: string;
  belt: string;
  association: string;
  city: string;
  country: string;
  videoLink: string;
  certificateLink: string;
  idLink: string;
  socialMedia: string;
}

const AthleteForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', whatsapp: '+55 ', style: '', belt: '',
    association: '', city: '', country: '', videoLink: '',
    certificateLink: '', idLink: '', socialMedia: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allFields = Object.values(formData);
    if (allFields.some(v => !v.trim())) {
      setErrorMsg(t('form.required_fields'));
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // Save to Supabase (primary)
      const { error: dbError } = await supabase.from('inscricoes_atletas').insert({
        nome: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        estilo: formData.style,
        graduacao: formData.belt,
        associacao: formData.association,
        cidade: formData.city,
        pais: formData.country,
        link_video: formData.videoLink,
        link_certificado: formData.certificateLink,
        link_documento: formData.idLink,
        redes_sociais: formData.socialMedia,
      });

      if (dbError) {
        console.error('Supabase error:', dbError);
        throw new Error(dbError.message);
      }

      // Backup to Google Sheets
      try {
        const iframe = document.createElement('iframe');
        iframe.name = 'athlete-submit-frame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const form = document.createElement('form');
        form.method = 'GET';
        form.action = GOOGLE_APPS_SCRIPT_URL;
        form.target = 'athlete-submit-frame';

        const fields = {
          type: 'athlete',
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
      } catch {
        // Backup failure is non-critical
        console.warn('Google Sheets backup failed');
      }

      setStatus('success');
      setFormData({ name: '', email: '', whatsapp: '+55 ', style: '', belt: '', association: '', city: '', country: '', videoLink: '', certificateLink: '', idLink: '', socialMedia: '' });
    } catch {
      setStatus('error');
      setErrorMsg(t('form.error'));
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white-warm placeholder:text-white/30 focus:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black-card transition-colors";
  const labelClass = "block text-xs uppercase tracking-widest text-white/50 mb-2";
  const optionClass = "bg-black-card text-white-warm";

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center min-h-[60svh]">
        <CheckCircle size={64} className="text-gold mb-6" aria-hidden="true" />
        <h3 className="text-3xl mb-4">{t('form.success_title')}</h3>
        <p className="text-white/60 max-w-md mb-8">{t('form.success_athlete')}</p>
        <button onClick={() => setStatus('idle')} className="btn-outline-gold">{t('form.send_another')}</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8" aria-label={t('form.athlete_title')}>
      <h3 className="text-2xl text-gold mb-6 uppercase tracking-widest">{t('form.athlete_title')}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="athlete-name" className={labelClass}>{t('form.name')} *</label>
          <input id="athlete-name" name="name" value={formData.name} onChange={handleChange} required autoComplete="name"
            className={inputClass} placeholder={t('form.name_placeholder')} />
        </div>
        <div>
          <label htmlFor="athlete-email" className={labelClass}>{t('form.email')} *</label>
          <input id="athlete-email" name="email" type="email" value={formData.email} onChange={handleChange} required autoComplete="email"
            className={inputClass} placeholder={t('form.email_placeholder')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="athlete-whatsapp" className={labelClass}>{t('form.whatsapp')} *</label>
          <input id="athlete-whatsapp" name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange} required autoComplete="tel"
            className={inputClass} placeholder="+55 11 99999-9999" />
        </div>
        <div>
          <label htmlFor="athlete-style" className={labelClass}>{t('form.style')} *</label>
          <select id="athlete-style" name="style" value={formData.style} onChange={handleChange} required
            className={inputClass}>
            <option value="" className={optionClass}>{t('form.select')}</option>
            <option value="Shotokan" className={optionClass}>Shotokan</option>
            <option value="Shito-Ryu" className={optionClass}>Shito-Ryu</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="athlete-belt" className={labelClass}>{t('form.belt')} *</label>
          <select id="athlete-belt" name="belt" value={formData.belt} onChange={handleChange} required
            className={inputClass}>
            <option value="" className={optionClass}>{t('form.select')}</option>
            <option value="Brown Belt" className={optionClass}>{t('form.brown_belt')}</option>
            <option value="1st Dan" className={optionClass}>1º Dan</option>
            <option value="2nd Dan" className={optionClass}>2º Dan</option>
            <option value="3rd Dan" className={optionClass}>3º Dan</option>
            <option value="4th Dan" className={optionClass}>4º Dan</option>
            <option value="5th Dan+" className={optionClass}>5º Dan+</option>
          </select>
        </div>
        <div>
          <label htmlFor="athlete-association" className={labelClass}>{t('form.association')} *</label>
          <input id="athlete-association" name="association" value={formData.association} onChange={handleChange} required autoComplete="organization"
            className={inputClass} placeholder={t('form.association_placeholder')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="athlete-social" className={labelClass}>{t('form.social_media')} *</label>
          <input id="athlete-social" name="socialMedia" value={formData.socialMedia} onChange={handleChange} required
            className={inputClass} placeholder="@seu_perfil" />
        </div>
        <div>
          <label htmlFor="athlete-city" className={labelClass}>{t('form.city')} *</label>
          <input id="athlete-city" name="city" value={formData.city} onChange={handleChange} required autoComplete="address-level2"
            className={inputClass} placeholder={t('form.city_placeholder')} />
        </div>
      </div>

      <div>
        <label htmlFor="athlete-country" className={labelClass}>{t('form.country')} *</label>
        <input id="athlete-country" name="country" value={formData.country} onChange={handleChange} required autoComplete="country-name"
          className={inputClass} placeholder={t('form.country_placeholder')} />
      </div>

      {/* Tutorial de Google Drive */}
      <DriveTutorial />

      <div>
        <label htmlFor="athlete-video" className={labelClass}>{t('form.video_link')} *</label>
        <input id="athlete-video" name="videoLink" type="url" value={formData.videoLink} onChange={handleChange} required
          aria-describedby="athlete-video-hint"
          className={inputClass} placeholder={t('form.video_placeholder')} />
        <p id="athlete-video-hint" className="text-white/50 text-xs mt-2">{t('form.video_hint')}</p>
      </div>

      <div>
        <label htmlFor="athlete-certificate" className={labelClass}>{t('form.certificate_link')} *</label>
        <input id="athlete-certificate" name="certificateLink" type="url" value={formData.certificateLink} onChange={handleChange} required
          aria-describedby="athlete-certificate-hint"
          className={inputClass} placeholder={t('form.certificate_placeholder')} />
        <p id="athlete-certificate-hint" className="text-white/50 text-xs mt-2">{t('form.certificate_hint')}</p>
      </div>

      <div>
        <label htmlFor="athlete-id" className={labelClass}>{t('form.id_link')} *</label>
        <input id="athlete-id" name="idLink" type="url" value={formData.idLink} onChange={handleChange} required
          aria-describedby="athlete-id-hint"
          className={inputClass} placeholder={t('form.id_placeholder')} />
        <p id="athlete-id-hint" className="text-white/50 text-xs mt-2">{t('form.id_hint')}</p>
      </div>

      {errorMsg && <p role="alert" className="text-red-400 text-sm">{errorMsg}</p>}

      <button type="submit" disabled={status === 'loading'} className="btn-gold w-full flex items-center justify-center gap-3">
        {status === 'loading' ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
        {status === 'loading' ? t('form.sending') : t('athletes.apply_now')}
      </button>
    </form>
  );
};

export default AthleteForm;
