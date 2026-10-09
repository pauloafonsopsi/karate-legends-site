import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, ExternalLink, Loader2 } from 'lucide-react';

type Linha = {
  id: string; status: string; link: string | null; arquivo_path: string | null; atualizado_em: string;
  metas: { nome: string } | null; contas: { nome: string | null; email: string } | null;
};

/** Fila de metas enviadas. Usada pelo admin e pelo consultor técnico (sem dados financeiros). */
const MetasVerificar = () => {
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setErro(false);
    const { data, error } = await supabase.from('metas_atleta')
      .select('id,status,link,arquivo_path,atualizado_em,metas(nome),contas(nome,email)')
      .eq('status', 'enviada').order('atualizado_em').limit(100);
    if (error) { setErro(true); return; }
    setLinhas(data as unknown as Linha[]);
  };
  useEffect(() => { load(); }, []);

  const abrir = async (path: string) => {
    const { data } = await supabase.storage.from('atletas-docs').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
  };
  const decidir = async (id: string, status: 'verificada' | 'pendente') => {
    setBusy(id);
    const { error } = await supabase.from('metas_atleta').update({ status }).eq('id', id);
    setBusy(null);
    if (error) { toast.error('Não foi possível salvar.'); return; }
    toast.success(status === 'verificada' ? 'Meta verificada.' : 'Devolvida ao atleta.');
    setLinhas(l => l?.filter(x => x.id !== id) ?? null);
  };

  if (erro) return <div role="alert" className="surface-elevated p-6">Não foi possível carregar. <button onClick={load} className="text-gold ml-2 min-h-[44px]">Tentar de novo</button></div>;
  if (!linhas) return <div className="h-40 surface-elevated animate-pulse rounded-sm" aria-label="Carregando" />;
  if (!linhas.length) return <p className="text-muted-foreground surface-elevated p-6">Nenhuma meta esperando verificação.</p>;

  return (
    <ul className="space-y-3">
      {linhas.map(l => (
        <li key={l.id} className="surface-elevated rounded-sm p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div>
            <p className="font-medium">{l.contas?.nome || l.contas?.email}</p>
            <p className="text-sm text-muted-foreground">{l.metas?.nome}</p>
            <div className="flex gap-4 mt-1 text-sm">
              {l.link && <a href={l.link} target="_blank" rel="noopener noreferrer" className="text-gold flex items-center gap-1 min-h-[44px]">Abrir link <ExternalLink size={12} /></a>}
              {l.arquivo_path && <button onClick={() => abrir(l.arquivo_path!)} className="text-gold min-h-[44px]">Ver arquivo</button>}
            </div>
          </div>
          <div className="flex gap-2">
            <button disabled={busy === l.id} onClick={() => decidir(l.id, 'pendente')} className="btn-outline-gold text-sm min-h-[44px]">Devolver</button>
            <button disabled={busy === l.id} onClick={() => decidir(l.id, 'verificada')} className="btn-gold text-sm min-h-[44px] flex items-center gap-2">
              {busy === l.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Verificar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};
export default MetasVerificar;
