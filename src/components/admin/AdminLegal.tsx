import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Corpo } from '@/pages/DocumentoLegal';
import type { Tables } from '@/integrations/supabase/types';

const CAMPOS = [['razao_social', 'Razão social'], ['cnpj', 'CNPJ'], ['endereco', 'Endereço completo'], ['email_contato', 'E-mail de contato'], ['foro', 'Cidade do foro']] as const;
const ROTA: Record<string, string> = { termos: '/termos', reembolso: '/reembolso', privacidade: '/privacidade', 'termos-atleta': '/termos-atleta' };

/** Textos legais e dados da empresa. Só admin. Cada alteração do texto gera nova versão. */
const AdminLegal = () => {
  const [docs, setDocs] = useState<Tables<'documentos_legais'>[] | null>(null);
  const [empresa, setEmpresa] = useState<Partial<Tables<'dados_empresa'>>>({});
  const [sel, setSel] = useState('termos');
  const [edit, setEdit] = useState<{ titulo: string; corpo: string } | null>(null);
  const [previa, setPrevia] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const carregar = async () => {
    const [d, e] = await Promise.all([supabase.from('documentos_legais').select('*').order('slug'), supabase.from('dados_empresa').select('*').maybeSingle()]);
    setDocs(d.data ?? []); setEmpresa(e.data ?? {});
  };
  useEffect(() => { carregar(); }, []);
  const doc = docs?.find(d => d.slug === sel);
  useEffect(() => { if (doc) setEdit({ titulo: doc.titulo, corpo: doc.corpo }); }, [doc]);

  const salvarEmpresa = async () => {
    setBusy('empresa');
    const { error } = await supabase.from('dados_empresa').upsert({ id: true, ...Object.fromEntries(CAMPOS.map(([k]) => [k, empresa[k] || null])), atualizado_em: new Date().toISOString() });
    setBusy(null); error ? toast.error('Não foi possível salvar.') : toast.success('Dados da empresa salvos.');
  };
  const salvarDoc = async () => {
    if (!edit) return;
    setBusy('doc');
    const { error } = await supabase.from('documentos_legais').update(edit).eq('slug', sel);
    setBusy(null);
    if (error) { toast.error('Não foi possível salvar.'); return; }
    toast.success('Documento salvo como nova versão.'); carregar();
  };

  if (!docs) return <div className="h-40 surface-elevated animate-pulse" aria-label="Carregando" />;
  const faltam = CAMPOS.filter(([k]) => !empresa[k]).length;

  return (
    <div className="space-y-8">
      <section className="surface-elevated p-5 space-y-4">
        <div><p className="eyebrow">Dados da empresa</p>
          <p className="text-sm text-muted-foreground">Entram nos textos onde aparecem {'{razao_social}'}, {'{cnpj}'}, {'{endereco}'}, {'{email_contato}'} e {'{foro}'}.{faltam ? ` Faltam ${faltam} campo(s); o site mostra "[a preencher]".` : ''}</p></div>
        <div className="grid md:grid-cols-2 gap-4">
          {CAMPOS.map(([k, t]) => (
            <div key={k}><label htmlFor={`e-${k}`} className="form-label">{t}</label>
              <input id={`e-${k}`} className="form-field text-base" value={empresa[k] ?? ''} onChange={e => setEmpresa({ ...empresa, [k]: e.target.value })} /></div>
          ))}
        </div>
        <button disabled={busy === 'empresa'} onClick={salvarEmpresa} className="btn-gold text-sm min-h-[44px] flex items-center gap-2">{busy === 'empresa' && <Loader2 size={14} className="animate-spin" />} Salvar dados</button>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {docs.map(d => (
            <button key={d.slug} role="tab" aria-selected={sel === d.slug} onClick={() => { setSel(d.slug); setPrevia(false); }}
              className={`text-sm px-4 min-h-[44px] border rounded-sm ${sel === d.slug ? 'border-gold text-gold' : 'border-border text-muted-foreground'}`}>{d.titulo}</button>
          ))}
        </div>
        {doc && edit && (
          <div className="surface-elevated p-5 space-y-4">
            <div className="flex flex-wrap justify-between gap-3 items-center">
              <p className="text-sm text-muted-foreground">Versão {doc.versao}, atualizada em {new Date(doc.atualizado_em).toLocaleDateString('pt-BR')}</p>
              <div className="flex gap-2">
                <button onClick={() => setPrevia(!previa)} className="btn-outline-gold text-sm min-h-[44px]">{previa ? 'Editar' : 'Prévia'}</button>
                <a href={ROTA[doc.slug]} target="_blank" rel="noopener noreferrer" className="btn-outline-gold text-sm min-h-[44px] flex items-center gap-2">Ver no site <ExternalLink size={12} /></a>
              </div>
            </div>
            {previa ? <Corpo texto={edit.corpo} empresa={empresa} /> : <>
              <div><label htmlFor="dt" className="form-label">Título</label>
                <input id="dt" className="form-field text-base" value={edit.titulo} onChange={e => setEdit({ ...edit, titulo: e.target.value })} /></div>
              <div><label htmlFor="dc" className="form-label">Texto (linha começando com "## " vira título; linha em branco separa parágrafos)</label>
                <textarea id="dc" rows={22} className="form-field text-base font-mono" value={edit.corpo} onChange={e => setEdit({ ...edit, corpo: e.target.value })} /></div>
            </>}
            <button disabled={busy === 'doc'} onClick={salvarDoc} className="btn-gold text-sm min-h-[44px] flex items-center gap-2">{busy === 'doc' && <Loader2 size={14} className="animate-spin" />} Salvar nova versão</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminLegal;
