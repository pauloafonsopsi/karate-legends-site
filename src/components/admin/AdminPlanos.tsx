import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { fetchPlanos, formatPreco, type Plano } from '@/lib/planos';
import { LANGS, type Lang } from '@/lib/conteudos';
import { getStripeEnvironment } from '@/lib/stripe';

const LABEL: Record<Lang, string> = { pt: 'Português', en: 'English', es: 'Español' };
const ICONES = [{ v: 'crown', l: 'Coroa' }, { v: 'radio', l: 'Transmissão' }, { v: 'mail', l: 'Carta' }];

const AdminPlanos = () => {
  const [planos, setPlanos] = useState<Plano[] | null>(null);
  const [error, setError] = useState(false);
  const [sel, setSel] = useState<Plano | null>(null);
  const [preco, setPreco] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => { setError(false); fetchPlanos(false).then(setPlanos).catch(() => setError(true)); };
  useEffect(load, []);

  const open = (p: Plano) => { setSel(structuredClone(p)); setPreco(((p.preco_centavos ?? 0) / 100).toFixed(2).replace('.', ',')); };
  const upd = (patch: Partial<Plano>) => setSel(s => s && { ...s, ...patch });

  const salvar = async () => {
    if (!sel) return;
    setSaving(true);
    const { error } = await supabase.from('planos').update({
      icone: sel.icone, ordem: sel.ordem, ativo: sel.ativo, destaque: sel.destaque,
      titulo: sel.titulo, periodo: sel.periodo, beneficios: sel.beneficios, atualizado_em: new Date().toISOString(),
    }).eq('id', sel.id);
    if (error) { setSaving(false); toast.error('Não foi possível salvar os textos.'); return; }
    const centavos = Math.round(parseFloat(preco.replace(/\./g, '').replace(',', '.')) * 100);
    if (centavos !== sel.preco_centavos) {
      const { data, error: e2 } = await supabase.functions.invoke('admin-plano-preco', {
        body: { chave: sel.chave, centavos, environment: getStripeEnvironment() },
      });
      if (e2 || data?.error) { setSaving(false); toast.error('Textos salvos, mas o preço não mudou: ' + (data?.error ?? 'erro no pagamento')); load(); return; }
    }
    setSaving(false);
    toast.success('Plano salvo.');
    setSel(null);
    load();
  };

  if (error) return (
    <div role="alert" className="surface-elevated p-6 rounded-sm">
      <p className="mb-4">Não foi possível carregar os planos.</p>
      <button onClick={load} className="btn-outline-gold">Tentar de novo</button>
    </div>
  );
  if (!planos) return <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-20 surface-elevated rounded-sm animate-pulse" />)}</div>;

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Planos exibidos na página Membros e no PPV. O preço é cobrado pelo Stripe; ao mudar aqui, um novo preço é criado lá.</p>
        {planos.map(p => (
          <button key={p.id} onClick={() => open(p)}
            className={`w-full text-left surface-elevated rounded-sm p-4 min-h-[44px] border ${sel?.id === p.id ? 'border-gold' : 'border-transparent'}`}>
            <div className="flex justify-between gap-3">
              <span className="font-semibold">{p.titulo.pt}</span>
              <span className="text-gold">{formatPreco(p.preco_centavos, p.moeda)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{p.ativo ? 'Visível no site' : 'Oculto'}{p.destaque ? ', em destaque' : ''}</p>
          </button>
        ))}
      </div>

      {!sel ? (
        <div className="surface-elevated rounded-sm p-8 text-muted-foreground text-sm">Escolha um plano para editar.</div>
      ) : (
        <div className="surface-elevated rounded-sm p-6 space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label" htmlFor="pl-preco">Preço (R$)</label>
              <input id="pl-preco" inputMode="decimal" className="form-field text-base" value={preco} onChange={e => setPreco(e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="pl-ordem">Ordem</label>
              <input id="pl-ordem" type="number" className="form-field text-base" value={sel.ordem} onChange={e => upd({ ordem: Number(e.target.value) })} />
            </div>
            <div>
              <label className="form-label" htmlFor="pl-icone">Ícone</label>
              <select id="pl-icone" className="form-field text-base" value={sel.icone} onChange={e => upd({ icone: e.target.value })}>
                {ICONES.map(i => <option key={i.v} value={i.v}>{i.l}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2 min-h-[44px]"><input type="checkbox" className="w-5 h-5 accent-gold" checked={sel.ativo} onChange={e => upd({ ativo: e.target.checked })} /> Visível no site</label>
            <label className="flex items-center gap-2 min-h-[44px]"><input type="checkbox" className="w-5 h-5 accent-gold" checked={sel.destaque} onChange={e => upd({ destaque: e.target.checked })} /> Destaque</label>
          </div>
          {LANGS.map(l => {
            const ben = sel.beneficios[l] ?? [];
            const setBen = (b: string[]) => upd({ beneficios: { ...sel.beneficios, [l]: b } });
            return (
              <fieldset key={l} className="border-t border-border pt-4 space-y-3">
                <legend className="eyebrow pr-2">{LABEL[l]}</legend>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Nome</label>
                    <input className="form-field text-base" value={sel.titulo[l] ?? ''} onChange={e => upd({ titulo: { ...sel.titulo, [l]: e.target.value } })} />
                  </div>
                  <div>
                    <label className="form-label">Período</label>
                    <input className="form-field text-base" value={sel.periodo[l] ?? ''} onChange={e => upd({ periodo: { ...sel.periodo, [l]: e.target.value } })} />
                  </div>
                </div>
                <label className="form-label">Benefícios</label>
                {ben.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="form-field text-base" value={b} onChange={e => setBen(ben.map((x, j) => j === i ? e.target.value : x))} />
                    <button type="button" aria-label="Remover benefício" onClick={() => setBen(ben.filter((_, j) => j !== i))} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-gold"><Trash2 size={16} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setBen([...ben, ''])} className="text-gold text-xs uppercase tracking-widest flex items-center gap-2 min-h-[44px]"><Plus size={14} /> Adicionar benefício</button>
              </fieldset>
            );
          })}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setSel(null)} className="btn-outline-gold">Cancelar</button>
            <button onClick={salvar} disabled={saving} className="btn-gold flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlanos;
