import { useEffect, useState } from 'react';
import { fetchPlanos, formatPreco, txt, type Plano } from '@/lib/planos';
import { useTranslation } from 'react-i18next';
import { Check, ArrowLeft, Loader2, Crown, Radio, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StripeEmbeddedCheckout } from '@/components/StripeEmbeddedCheckout';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';

type PlanId = string;
const ICONS: Record<string, typeof Crown> = { crown: Crown, radio: Radio, mail: Mail };

const Membros = () => {
  const { t, i18n } = useTranslation();
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [checkout, setCheckout] = useState<{ priceId: PlanId; email: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    nome: '', email: '', whatsapp: '+55 ', cidade: '', pais: '',
    aceiteTermos: false, aceitePrivacidade: false,
  });

  const [plans, setPlans] = useState<Plano[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const load = () => { setLoadError(false); fetchPlanos().then(setPlans).catch(() => setLoadError(true)); };
  useEffect(load, []);
  const lang = i18n.language;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    setForm(prev => ({ ...prev, [target.name]: target.type === 'checkbox' ? target.checked : target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    setErrorMsg('');
    if (![form.nome, form.email, form.whatsapp].every(v => v.trim())) {
      setErrorMsg(t('form.required_fields'));
      return;
    }
    if (!form.aceiteTermos || !form.aceitePrivacidade) {
      setErrorMsg(t('form.must_accept'));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('membros').insert({
      nome: form.nome,
      email: form.email,
      whatsapp: form.whatsapp,
      cidade: form.cidade || null,
      pais: form.pais || null,
      plano: plan,
      aceite_termos: form.aceiteTermos,
      aceite_privacidade: form.aceitePrivacidade,
    });
    setSaving(false);
    if (error) {
      setErrorMsg(t('form.error'));
      return;
    }
    setCheckout({ priceId: plan, email: form.email });
  };

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <header className="max-w-3xl mb-14">
          <p className="eyebrow mb-4">{t('members.eyebrow')}</p>
          <h1 className="text-6xl md:text-8xl mb-6 leading-none">{t('members.title')}</h1>
          <p className="text-muted-foreground text-lg md:text-xl">{t('members.subtitle')}</p>
        </header>

        {!plan && loadError && (
          <div role="alert" className="surface-elevated p-7 rounded-sm max-w-xl">
            <p className="mb-4">{t('form.error')}</p>
            <button onClick={load} className="btn-outline-gold">Tentar de novo</button>
          </div>
        )}
        {!plan && !loadError && !plans && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true">
            {[0, 1, 2].map(i => <div key={i} className="surface-elevated rounded-sm h-96 animate-pulse" />)}
          </div>
        )}
        {!plan && plans && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(p => {
              const Icon = ICONS[p.icone] ?? Crown;
              const features = txt(p.beneficios, lang) ?? [];
              return (
              <div key={p.id} className={`surface-elevated p-7 rounded-sm flex flex-col ${p.destaque ? 'border border-gold/60' : ''}`}>
                {p.destaque && <p className="eyebrow mb-3">{t('members.best_value')}</p>}
                <Icon size={24} className="text-gold mb-5" aria-hidden="true" />
                <h2 className="text-3xl mb-2">{txt(p.titulo, lang)}</h2>
                <p className="mb-6">
                  <span className="text-4xl font-display text-gold">{formatPreco(p.preco_centavos, p.moeda)}</span>
                  <span className="text-muted-foreground text-sm ml-2">{txt(p.periodo, lang)}</span>
                </p>
                <ul className="space-y-3 mb-8 flex-grow">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <Check size={16} className="text-gold mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setPlan(p.chave)} className={p.destaque ? 'btn-gold w-full' : 'btn-outline-gold w-full'}>
                  {t('members.choose')}
                </button>
              </div>
            );})}
          </div>
        )}

        {plan && !checkout && (
          <div className="max-w-2xl bg-card border border-border rounded-sm">
            <form onSubmit={submit} className="p-6 md:p-9 space-y-5">
              <button type="button" onClick={() => { setPlan(null); setErrorMsg(''); }} className="text-gold text-xs uppercase tracking-widest flex items-center gap-2">
                <ArrowLeft size={14} /> {t('members.change_plan')}
              </button>
              <h2 className="text-3xl">{t('members.your_data')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="m-nome" className="form-label">{t('form.name')} *</label>
                  <input id="m-nome" name="nome" value={form.nome} onChange={handleChange} required autoComplete="name" className="form-field" placeholder={t('form.name_placeholder')} />
                </div>
                <div>
                  <label htmlFor="m-email" className="form-label">{t('form.email')} *</label>
                  <input id="m-email" name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" className="form-field" placeholder={t('form.email_placeholder')} />
                </div>
              </div>
              <div>
                <label htmlFor="m-whats" className="form-label">{t('form.whatsapp')} *</label>
                <input id="m-whats" name="whatsapp" type="tel" value={form.whatsapp} onChange={handleChange} required autoComplete="tel" className="form-field" placeholder="+55 11 99999-9999" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="m-cidade" className="form-label">{t('form.city')}</label>
                  <input id="m-cidade" name="cidade" value={form.cidade} onChange={handleChange} autoComplete="address-level2" className="form-field" placeholder={t('form.city_placeholder')} />
                </div>
                <div>
                  <label htmlFor="m-pais" className="form-label">{t('form.country')}</label>
                  <input id="m-pais" name="pais" value={form.pais} onChange={handleChange} autoComplete="country-name" className="form-field" placeholder={t('form.country_placeholder')} />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/10">
                <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer">
                  <input type="checkbox" name="aceiteTermos" checked={form.aceiteTermos} onChange={handleChange} className="w-4 h-4 mt-0.5 accent-gold flex-shrink-0" required />
                  <span>
                    {t('form.accept_terms_pre')}
                    <a href="/termos-atleta" target="_blank" rel="noopener noreferrer" className="text-gold underline">{t('form.accept_terms_link')}</a>
                    {t('form.accept_terms_post')}
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer">
                  <input type="checkbox" name="aceitePrivacidade" checked={form.aceitePrivacidade} onChange={handleChange} className="w-4 h-4 mt-0.5 accent-gold flex-shrink-0" required />
                  <span>
                    {t('form.accept_privacy_pre')}
                    <a href="/politica-dados" target="_blank" rel="noopener noreferrer" className="text-gold underline">{t('form.accept_privacy_link')}</a>
                  </span>
                </label>
              </div>

              {errorMsg && <p role="alert" className="text-red-400 text-sm">{errorMsg}</p>}

              <button type="submit" disabled={saving} className="btn-gold w-full flex items-center justify-center gap-3">
                {saving && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                {t('members.go_to_payment')}
              </button>
            </form>
          </div>
        )}

        {checkout && (
          <div className="max-w-3xl">
            <PaymentTestModeBanner />
            <div className="mt-6 bg-card border border-border rounded-sm p-4 md:p-6">
              <StripeEmbeddedCheckout priceId={checkout.priceId} customerEmail={checkout.email} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Membros;
