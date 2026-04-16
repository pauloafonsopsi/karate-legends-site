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

  const inputClass = "w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none transition-colors";

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[600px]">
        <CheckCircle size={64} className="text-gold mb-6" />
        <h3 className="text-3xl mb-4">{t('form.success_title')}</h3>
        <p className="text-white/60 max-w-md mb-8">{t('form.success_athlete')}</p>
        <button onClick={() => setStatus('idle')} className="btn-outline-gold">{t('form.send_another')}</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8">
      <h3 className="text-2xl text-gold mb-6 uppercase tracking-widest">{t('form.athlete_title')}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.name')} *</label>
          <input name="name" value={formData.name} onChange={handleChange} required
            className={inputClass} placeholder={t('form.name_placeholder')} />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.email')} *</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} required
            className={inputClass} placeholder={t('form.email_placeholder')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.whatsapp')} *</label>
          <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} required
            className={inputClass} placeholder="+55 11 99999-9999" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.style')} *</label>
          <select name="style" value={formData.style} onChange={handleChange} required
            className={inputClass}>
            <option value="" className="bg-black">{t('form.select')}</option>
            <option value="Shotokan" className="bg-black">Shotokan</option>
            <option value="Shito-Ryu" className="bg-black">Shito-Ryu</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.belt')} *</label>
          <select name="belt" value={formData.belt} onChange={handleChange} required
            className={inputClass}>
            <option value="" className="bg-black">{t('form.select')}</option>
            <option value="Brown Belt" className="bg-black">{t('form.brown_belt')}</option>
            <option value="1st Dan" className="bg-black">1º Dan</option>
            <option value="2nd Dan" className="bg-black">2º Dan</option>
            <option value="3rd Dan" className="bg-black">3º Dan</option>
            <option value="4th Dan" className="bg-black">4º Dan</option>
            <option value="5th Dan+" className="bg-black">5º Dan+</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.association')} *</label>
          <input name="association" value={formData.association} onChange={handleChange} required
            className={inputClass} placeholder={t('form.association_placeholder')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.social_media')} *</label>
          <input name="socialMedia" value={formData.socialMedia} onChange={handleChange} required
            className={inputClass} placeholder="@seu_perfil" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.city')} *</label>
          <input name="city" value={formData.city} onChange={handleChange} required
            className={inputClass} placeholder={t('form.city_placeholder')} />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.country')} *</label>
        <input name="country" value={formData.country} onChange={handleChange} required
          className={inputClass} placeholder={t('form.country_placeholder')} />
      </div>

      {/* Tutorial de Google Drive */}
      <DriveTutorial />

      <div>
        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.video_link')} *</label>
        <input name="videoLink" value={formData.videoLink} onChange={handleChange} required
          className={inputClass} placeholder={t('form.video_placeholder')} />
        <p className="text-white/30 text-xs mt-2">{t('form.video_hint')}</p>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.certificate_link')} *</label>
        <input name="certificateLink" value={formData.certificateLink} onChange={handleChange} required
          className={inputClass} placeholder={t('form.certificate_placeholder')} />
        <p className="text-white/30 text-xs mt-2">{t('form.certificate_hint')}</p>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{t('form.id_link')} *</label>
        <input name="idLink" value={formData.idLink} onChange={handleChange} required
          className={inputClass} placeholder={t('form.id_placeholder')} />
        <p className="text-white/30 text-xs mt-2">{t('form.id_hint')}</p>
      </div>

      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

      <button type="submit" disabled={status === 'loading'} className="btn-gold w-full flex items-center justify-center gap-3">
        {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {status === 'loading' ? t('form.sending') : t('athletes.apply_now')}
      </button>

      <p className="text-white/30 text-xs text-center">{t('athletes.fee_notice')}</p>
    </form>
  );
};

export default AthleteForm;
