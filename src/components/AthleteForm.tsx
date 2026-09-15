import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2, CheckCircle, Upload, FileCheck2, X, ArrowLeft, ArrowRight, User, ShieldCheck, Files, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, formatBytes } from '@/lib/imageCompress';

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
  socialMedia: string;
  ownsDojo: boolean;
  senseiName: string;
  senseiPhone: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

type UploadSlot = 'certificate' | 'idFront' | 'idBack';
type SlotFile = { file: File; processed?: Blob; ext?: string; processing?: boolean };
const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

const AthleteForm = () => {
  const { t } = useTranslation();
  const initialData: FormData = {
    name: '', email: '', whatsapp: '+55 ', style: '', belt: '',
    association: '', city: '', country: '', videoLink: '', socialMedia: '',
    ownsDojo: true, senseiName: '', senseiPhone: '',
    acceptTerms: false, acceptPrivacy: false,
  };
  const [formData, setFormData] = useState<FormData>(initialData);
  const [files, setFiles] = useState<Record<UploadSlot, SlotFile | null>>({
    certificate: null, idFront: null, idBack: null,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [stage, setStage] = useState<'' | 'processing' | 'uploading'>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.type === 'checkbox') {
      setFormData(prev => ({ ...prev, [target.name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [target.name]: target.value }));
    }
  };

  const handleFile = async (slot: UploadSlot, file: File | null) => {
    setErrorMsg('');
    if (!file) { setFiles(p => ({ ...p, [slot]: null })); return; }
    if (file.size > MAX_INPUT_BYTES) { setErrorMsg(t('form.upload_too_large')); return; }
    if (!ACCEPTED.includes(file.type) && !file.type.startsWith('image/')) {
      setErrorMsg(t('form.upload_invalid_type')); return;
    }
    setFiles(p => ({ ...p, [slot]: { file, processing: true } }));
    try {
      const { blob, ext } = await compressImage(file);
      setFiles(p => ({ ...p, [slot]: { file, processed: blob, ext, processing: false } }));
    } catch (err) {
      setFiles(p => ({ ...p, [slot]: null }));
      setErrorMsg(err instanceof Error ? err.message : t('form.upload_invalid_type'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredText = [
      formData.name, formData.email, formData.whatsapp, formData.style,
      formData.belt, formData.association, formData.city, formData.country,
      formData.videoLink, formData.socialMedia,
    ];
    if (requiredText.some(v => !v.trim())) {
      setErrorMsg(t('form.required_fields'));
      return;
    }
    if (!files.certificate?.processed || !files.idFront?.processed || !files.idBack?.processed) {
      setErrorMsg(t('form.required_fields'));
      return;
    }
    if (!formData.ownsDojo && (!formData.senseiName.trim() || !formData.senseiPhone.trim())) {
      setErrorMsg(t('form.required_fields'));
      return;
    }
    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      setErrorMsg(t('form.must_accept'));
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // 1) Upload files to private storage bucket
      setStage('uploading');
      const folder = crypto.randomUUID();
      const uploadOne = async (slot: UploadSlot, name: string) => {
        const f = files[slot];
        if (!f?.processed || !f.ext) throw new Error(`Arquivo ${name} indisponível`);
        const path = `${folder}/${name}.${f.ext}`;
        const { error } = await supabase.storage
          .from('atletas-docs')
          .upload(path, f.processed, { contentType: f.processed.type, upsert: false });
        if (error) throw new Error(`Upload ${name}: ${error.message}`);
        return path;
      };
      const [certPath, idFrontPath, idBackPath] = await Promise.all([
        uploadOne('certificate', 'certificado'),
        uploadOne('idFront', 'identidade-frente'),
        uploadOne('idBack', 'identidade-verso'),
      ]);

      // 2) Insert row referencing the storage paths
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
        link_certificado: certPath,
        link_documento: idFrontPath,
        link_documento_verso: idBackPath,
        redes_sociais: formData.socialMedia,
        dono_dojo: formData.ownsDojo,
        sensei_nome: formData.ownsDojo ? null : formData.senseiName,
        sensei_telefone: formData.ownsDojo ? null : formData.senseiPhone,
        aceite_termos: formData.acceptTerms,
        aceite_privacidade: formData.acceptPrivacy,
      });

      if (dbError) {
        console.error('Supabase error:', dbError);
        throw new Error(dbError.message);
      }

      setStatus('success');
      setStage('');
      setFormData(initialData);
      setFiles({ certificate: null, idFront: null, idBack: null });
      setStep(1);
    } catch {
      setStatus('error');
      setStage('');
      setErrorMsg(t('form.error'));
    }
  };

  const inputClass = "form-field";
  const labelClass = "form-label";
  const optionClass = "bg-black-card text-white-warm";
  const steps = [
    { n: 1, label: 'Perfil', icon: User },
    { n: 2, label: 'Graduação', icon: ShieldCheck },
    { n: 3, label: 'Documentos', icon: Files },
    { n: 4, label: 'Revisão', icon: CreditCard },
  ];

  const nextStep = () => {
    setErrorMsg('');
    if (step === 1 && [formData.name, formData.email, formData.whatsapp, formData.city, formData.country, formData.socialMedia].some(v => !v.trim())) {
      setErrorMsg(t('form.required_fields')); return;
    }
    if (step === 2 && [formData.style, formData.belt, formData.association, formData.videoLink].some(v => !v.trim())) {
      setErrorMsg(t('form.required_fields')); return;
    }
    if (step === 2 && !formData.ownsDojo && (!formData.senseiName.trim() || !formData.senseiPhone.trim())) {
      setErrorMsg(t('form.required_fields')); return;
    }
    if (step === 3 && (!files.certificate?.processed || !files.idFront?.processed || !files.idBack?.processed)) {
      setErrorMsg(t('form.required_fields')); return;
    }
    setStep(s => Math.min(4, s + 1));
  };

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
    <form onSubmit={handleSubmit} className="p-5 md:p-9" aria-label={t('form.athlete_title')}>
      <div className="mb-9 border-b border-border pb-7">
        <p className="eyebrow mb-2">Aplicação oficial</p>
        <h3 className="text-3xl md:text-4xl text-foreground">{t('form.athlete_title')}</h3>
        <div className="grid grid-cols-4 mt-7" aria-label="Progresso da inscrição">
          {steps.map(({ n, label, icon: Icon }) => (
            <button key={n} type="button" onClick={() => n < step && setStep(n)} disabled={n > step}
              className={`relative flex flex-col items-start gap-2 border-t pt-3 text-left transition-colors ${n <= step ? 'border-gold text-gold' : 'border-border text-muted-foreground'}`}>
              <span className="flex items-center gap-2"><Icon size={14} /><span className="hidden sm:inline text-[10px] uppercase tracking-widest">{label}</span></span>
              <span className="text-xs">0{n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 min-h-[430px]">
      {step === 1 && <>

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

      <div><label htmlFor="athlete-whatsapp" className={labelClass}>{t('form.whatsapp')} *</label><input id="athlete-whatsapp" name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange} required autoComplete="tel" className={inputClass} placeholder="+55 11 99999-9999" /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label htmlFor="athlete-city" className={labelClass}>{t('form.city')} *</label><input id="athlete-city" name="city" value={formData.city} onChange={handleChange} required autoComplete="address-level2" className={inputClass} placeholder={t('form.city_placeholder')} /></div>
        <div><label htmlFor="athlete-country" className={labelClass}>{t('form.country')} *</label><input id="athlete-country" name="country" value={formData.country} onChange={handleChange} required autoComplete="country-name" className={inputClass} placeholder={t('form.country_placeholder')} /></div>
      </div>
      <div><label htmlFor="athlete-social" className={labelClass}>{t('form.social_media')} *</label><input id="athlete-social" name="socialMedia" value={formData.socialMedia} onChange={handleChange} required className={inputClass} placeholder="@seu_perfil" /></div>
      </>}

      {step === 2 && <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label htmlFor="athlete-style" className={labelClass}>{t('form.style')} *</label><select id="athlete-style" name="style" value={formData.style} onChange={handleChange} required className={inputClass}><option value="" className={optionClass}>{t('form.select')}</option><option value="Shotokan" className={optionClass}>Shotokan</option><option value="Shito-Ryu" className={optionClass}>Shito-Ryu</option></select></div>
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
        <div className="md:col-span-1">
          <label htmlFor="athlete-association" className={labelClass}>{t('form.association')} *</label>
          <input id="athlete-association" name="association" value={formData.association} onChange={handleChange} required autoComplete="organization"
            className={inputClass} placeholder={t('form.association_placeholder')} />
          <label className="flex items-center gap-2 mt-3 text-sm text-white/70 cursor-pointer">
            <input type="checkbox" name="ownsDojo" checked={formData.ownsDojo} onChange={handleChange}
              className="w-4 h-4 accent-gold" />
            <span>{t('form.owns_dojo_label')}</span>
          </label>
        </div>
      </div>

      {!formData.ownsDojo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="athlete-sensei-name" className={labelClass}>{t('form.sensei_name')} *</label>
            <input id="athlete-sensei-name" name="senseiName" value={formData.senseiName} onChange={handleChange}
              required={!formData.ownsDojo}
              className={inputClass} placeholder={t('form.sensei_name_placeholder')} />
          </div>
          <div>
            <label htmlFor="athlete-sensei-phone" className={labelClass}>{t('form.sensei_phone')} *</label>
            <input id="athlete-sensei-phone" name="senseiPhone" type="tel" value={formData.senseiPhone} onChange={handleChange}
              required={!formData.ownsDojo}
              className={inputClass} placeholder={t('form.sensei_phone_placeholder')} />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="athlete-video" className={labelClass}>{t('form.video_link')} *</label>
        <input id="athlete-video" name="videoLink" type="url" value={formData.videoLink} onChange={handleChange} required
          aria-describedby="athlete-video-hint"
          className={inputClass} placeholder={t('form.video_placeholder')} />
        <p id="athlete-video-hint" className="text-white/50 text-xs mt-2">{t('form.video_hint')}</p>
      </div>
      </>}

      {step === 3 && <>
      <div className="border-l border-gold pl-4 mb-7"><p className="text-sm text-foreground">Envie arquivos nítidos e completos.</p><p className="text-xs text-muted-foreground mt-1">As imagens são otimizadas automaticamente antes do armazenamento seguro.</p></div>
      <FileField
        id="athlete-certificate"
        label={`${t('form.certificate_link')} *`}
        hint={t('form.certificate_hint')}
        slot={files.certificate}
        onChange={(f) => handleFile('certificate', f)}
        t={t}
      />

      <FileField
        id="athlete-id-front"
        label={`${t('form.id_front_label')} *`}
        hint={t('form.id_hint')}
        slot={files.idFront}
        onChange={(f) => handleFile('idFront', f)}
        t={t}
      />

      <FileField
        id="athlete-id-back"
        label={`${t('form.id_back_label')} *`}
        slot={files.idBack}
        onChange={(f) => handleFile('idBack', f)}
        t={t}
      />
      </>}

      {step === 4 && <>
      <div className="surface-elevated p-5 space-y-4">
        <div className="flex justify-between gap-4"><span className="text-muted-foreground text-sm">Atleta</span><strong className="text-sm text-right">{formData.name}</strong></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground text-sm">Categoria</span><strong className="text-sm text-right">{formData.style} · {formData.belt}</strong></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground text-sm">Documentos</span><strong className="text-sm text-gold">3 arquivos prontos</strong></div>
      </div>
      <div className="space-y-3 pt-2 border-t border-white/10">
        <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer">
          <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange}
            className="w-4 h-4 mt-0.5 accent-gold flex-shrink-0" required />
          <span>
            {t('form.accept_terms_pre')}
            <a href="/termos-atleta" target="_blank" rel="noopener noreferrer" className="text-gold underline hover:text-gold/80">
              {t('form.accept_terms_link')}
            </a>
            {t('form.accept_terms_post')}
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer">
          <input type="checkbox" name="acceptPrivacy" checked={formData.acceptPrivacy} onChange={handleChange}
            className="w-4 h-4 mt-0.5 accent-gold flex-shrink-0" required />
          <span>
            {t('form.accept_privacy_pre')}
            <a href="/politica-dados" target="_blank" rel="noopener noreferrer" className="text-gold underline hover:text-gold/80">
              {t('form.accept_privacy_link')}
            </a>
            {t('form.accept_privacy_post')}
          </span>
        </label>
      </div>
      </>}

      {errorMsg && <p role="alert" className="text-red-400 text-sm">{errorMsg}</p>}
      </div>
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
      {step > 1 ? <button type="button" onClick={() => { setErrorMsg(''); setStep(s => s - 1); }} className="btn-outline-gold px-4 md:px-6 flex items-center gap-2"><ArrowLeft size={16} /> Voltar</button> : <span />}
      {step < 4 ? <button type="button" onClick={nextStep} className="btn-gold px-5 md:px-7 flex items-center gap-2">Continuar <ArrowRight size={16} /></button> : <button type="submit" disabled={status === 'loading'} className="btn-gold flex items-center justify-center gap-3">
        {status === 'loading' ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
        {status === 'loading'
          ? (stage === 'uploading' ? t('form.uploading') : t('form.sending'))
          : t('athletes.apply_now')}
      </button>}
      </div>
    </form>
  );
};

type TFn = (k: string) => string;
const FileField = ({ id, label, hint, slot, onChange, t }: {
  id: string; label: string; hint?: string; slot: SlotFile | null;
  onChange: (f: File | null) => void; t: TFn;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const has = !!slot;
  return (
    <div>
      <label htmlFor={id} className="form-label">{label}</label>
      <input ref={ref} id={id} type="file" accept="image/*,application/pdf" className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      {!has ? (
        <button type="button" onClick={() => ref.current?.click()}
          className="w-full flex items-center justify-center gap-3 rounded-sm border border-dashed border-border hover:border-gold/50 hover:bg-secondary px-4 py-7 text-sm text-muted-foreground transition-colors">
          <Upload size={18} className="text-gold" />
          <span>{t('form.upload_choose')}</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
          {slot!.processing ? (
            <Loader2 size={16} className="text-gold animate-spin flex-shrink-0" />
          ) : (
            <FileCheck2 size={16} className="text-green-400 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-white/90 truncate">{slot.file.name}</p>
            <p className="text-xs text-white/40">
              {slot.processing
                ? t('form.processing')
                : `${formatBytes(slot.file.size)} → ${slot.processed ? formatBytes(slot.processed.size) : '—'}`}
            </p>
          </div>
          <button type="button" onClick={() => ref.current?.click()}
            className="text-xs text-gold hover:underline whitespace-nowrap">
            {t('form.upload_change')}
          </button>
          <button type="button" onClick={() => onChange(null)}
            className="text-white/40 hover:text-red-400" aria-label="Remover">
            <X size={14} />
          </button>
        </div>
      )}
      <p className="text-white/50 text-xs mt-2">{hint ?? t('form.upload_hint')}</p>
      {hint && <p className="text-white/40 text-[11px] mt-1">{t('form.upload_hint')}</p>}
    </div>
  );
};

export default AthleteForm;
