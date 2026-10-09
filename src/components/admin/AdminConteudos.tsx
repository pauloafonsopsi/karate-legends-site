import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, RotateCcw, Save, Search } from 'lucide-react';
import pt from '@/messages/pt.json';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import { flatten, LANGS, type Lang, reloadConteudos } from '@/lib/conteudos';

const DEFAULTS: Record<Lang, Record<string, string>> = { pt: flatten(pt), en: flatten(en), es: flatten(es) };
const LABEL: Record<Lang, string> = { pt: 'Português', en: 'English', es: 'Español' };

type Row = { chave: string; idioma: string; valor: string };

const AdminConteudos = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);
  const [busca, setBusca] = useState('');
  const [secao, setSecao] = useState('todas');
  const [sel, setSel] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<Lang, string>>({ pt: '', en: '', es: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError(false);
    const { data, error } = await supabase.from('conteudos').select('chave, idioma, valor');
    if (error) { setError(true); return; }
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const override = (k: string, l: Lang) => rows?.find(r => r.chave === k && r.idioma === l)?.valor;
  const valor = (k: string, l: Lang) => override(k, l) ?? DEFAULTS[l][k] ?? '';

  const chaves = Object.keys(DEFAULTS.pt);
  const secoes = useMemo(() => Array.from(new Set(chaves.map(k => k.split('.')[0]))).sort(), []);
  const lista = chaves.filter(k =>
    (secao === 'todas' || k.startsWith(secao + '.')) &&
    (!busca || (k + ' ' + valor(k, 'pt')).toLowerCase().includes(busca.toLowerCase())));

  const abrir = (k: string) => {
    setSel(k);
    setDraft({ pt: valor(k, 'pt'), en: valor(k, 'en'), es: valor(k, 'es') });
  };

  const salvar = async () => {
    if (!sel) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const upserts = LANGS.filter(l => draft[l] !== DEFAULTS[l][sel]).map(l => ({ chave: sel, idioma: l, valor: draft[l], atualizado_por: u.user?.id ?? null, atualizado_em: new Date().toISOString() }));
    const iguais = LANGS.filter(l => draft[l] === DEFAULTS[l][sel]);
    let err = null;
    if (upserts.length) err = (await supabase.from('conteudos').upsert(upserts, { onConflict: 'chave,idioma' })).error;
    if (!err && iguais.length) err = (await supabase.from('conteudos').delete().eq('chave', sel).in('idioma', iguais)).error;
    setSaving(false);
    if (err) { toast.error('Não foi possível salvar. Tente novamente.'); return; }
    toast.success('Texto atualizado no site');
    await load();
    reloadConteudos();
  };

  const restaurar = async () => {
    if (!sel) return;
    setSaving(true);
    const { error } = await supabase.from('conteudos').delete().eq('chave', sel);
    setSaving(false);
    if (error) { toast.error('Não foi possível restaurar.'); return; }
    setDraft({ pt: DEFAULTS.pt[sel] ?? '', en: DEFAULTS.en[sel] ?? '', es: DEFAULTS.es[sel] ?? '' });
    toast.success('Texto original restaurado');
    await load();
    reloadConteudos();
  };

  if (error) return (
    <div className="surface-elevated p-8 text-center">
      <p className="mb-4 text-foreground/80">Não foi possível carregar os textos.</p>
      <button onClick={load} className="btn-outline-gold">Tentar de novo</button>
    </div>
  );
  if (!rows) return <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-card animate-pulse rounded-sm" />)}</div>;

  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
      <div>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar texto" className="form-field pl-9 text-base" />
          </div>
          <select value={secao} onChange={e => setSecao(e.target.value)} className="form-field sm:w-44 text-base">
            <option value="todas">Todas as seções</option>
            {secoes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {lista.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6 text-center">Nenhum texto encontrado para essa busca.</p>
        ) : (
          <ul className="border border-border rounded-sm divide-y divide-border max-h-[70vh] overflow-auto">
            {lista.map(k => {
              const editado = LANGS.some(l => override(k, l) !== undefined);
              return (
                <li key={k}>
                  <button onClick={() => abrir(k)} className={`w-full text-left px-4 py-3 min-h-[44px] hover:bg-card ${sel === k ? 'bg-card' : ''}`}>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">{k}{editado && <span className="text-gold">editado</span>}</span>
                    <span className="block text-sm text-foreground/90 truncate">{valor(k, 'pt')}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="surface-elevated p-5 rounded-sm h-fit lg:sticky lg:top-28">
        {!sel ? (
          <p className="text-muted-foreground text-sm">Escolha um texto na lista para editar nos três idiomas.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground break-all">{sel}</p>
            {LANGS.map(l => (
              <div key={l}>
                <label className="form-label">{LABEL[l]}</label>
                <textarea value={draft[l]} onChange={e => setDraft(d => ({ ...d, [l]: e.target.value }))} rows={3} className="form-field text-base" />
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={salvar} disabled={saving} className="btn-gold flex-1 flex items-center justify-center gap-2 min-h-[44px]">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
              </button>
              <button onClick={restaurar} disabled={saving} className="btn-outline-gold flex items-center justify-center gap-2 min-h-[44px]">
                <RotateCcw size={16} /> Restaurar original
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConteudos;
