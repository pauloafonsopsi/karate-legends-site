import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStripeEnvironment } from '@/lib/stripe';
import { STATUS_APLICACAO } from '@/components/registro/AplicacoesAtleta';
import type { Tables } from '@/integrations/supabase/types';

type Linha = Tables<'aplicacoes'> & { contas: Pick<Tables<'contas'>, 'nome' | 'email' | 'whatsapp' | 'estilo' | 'graduacao' | 'dojo' | 'cidade' | 'nascimento' | 'doc_frente_path' | 'doc_verso_path'> | null };
const dataBR = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '');
const paraData = (s: string) => (s ? new Date(s + 'T23:59:59-03:00').toISOString() : null);

const csv = (linhas: Record<string, unknown>[], nome: string) => {
  if (!linhas.length) return;
  const cols = Object.keys(linhas[0]);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const txt = '\uFEFF' + [cols.join(';'), ...linhas.map(l => cols.map(c => esc(l[c])).join(';'))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = nome; a.click();
};

/** Configuração da janela do evento (só admin). */
const Janela = ({ eventoId, cats }: { eventoId: string; cats: Tables<'categorias'>[] }) => {
  const [j, setJ] = useState<Partial<Tables<'janelas_aplicacao'>> | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.from('janelas_aplicacao').select('*').eq('evento_id', eventoId).maybeSingle()
      .then(({ data }) => setJ(data ?? { evento_id: eventoId, ativo: false, taxa_centavos: 1990, categorias: [] }));
  }, [eventoId]);
  if (!j) return <div className="h-40 surface-elevated animate-pulse" aria-label="Carregando" />;
  const salvar = async () => {
    setBusy(true);
    const { error } = await supabase.from('janelas_aplicacao').upsert({
      evento_id: eventoId, ativo: !!j.ativo, abre_em: j.abre_em ?? null, fecha_em: j.fecha_em ?? null, resposta_ate: j.resposta_ate ?? null,
      vagas: j.vagas ?? null, taxa_centavos: j.taxa_centavos ?? 1990, categorias: j.categorias ?? [], atualizado_em: new Date().toISOString(),
    });
    setBusy(false);
    error ? toast.error('Não foi possível salvar.') : toast.success('Aplicações do evento salvas.');
  };
  const data = (k: 'abre_em' | 'fecha_em' | 'resposta_ate', label: string) => (
    <div><label className="form-label" htmlFor={k}>{label}</label>
      <input id={k} type="date" className="form-field text-base" value={j[k]?.slice(0, 10) ?? ''} onChange={e => setJ({ ...j, [k]: paraData(e.target.value) })} /></div>
  );
  const toggleCat = (id: string) => setJ({ ...j, categorias: j.categorias?.includes(id) ? j.categorias.filter(x => x !== id) : [...(j.categorias ?? []), id] });
  return (
    <div className="surface-elevated p-5 grid md:grid-cols-3 gap-4">
      <label className="md:col-span-3 flex items-center gap-3 min-h-[44px]"><input type="checkbox" className="h-5 w-5" checked={!!j.ativo} onChange={e => setJ({ ...j, ativo: e.target.checked })} /> Aplicações abertas para este evento</label>
      {data('abre_em', 'Abre em')}{data('fecha_em', 'Fecha em')}{data('resposta_ate', 'Resposta até')}
      <div><label className="form-label" htmlFor="vagas">Vagas</label>
        <input id="vagas" type="number" min={0} className="form-field text-base" value={j.vagas ?? ''} onChange={e => setJ({ ...j, vagas: e.target.value ? Number(e.target.value) : null })} /></div>
      <div><label className="form-label" htmlFor="taxa">Taxa (R$)</label>
        <input id="taxa" type="number" min={0} step="0.01" className="form-field text-base" value={((j.taxa_centavos ?? 0) / 100).toFixed(2)}
          onChange={e => setJ({ ...j, taxa_centavos: Math.round(Number(e.target.value) * 100) })} /></div>
      <div className="md:col-span-3"><p className="form-label">Categorias abertas</p>
        {!cats.length ? <p className="text-sm text-muted-foreground">Cadastre categorias em Legends, Categorias.</p> : (
          <div className="flex flex-wrap gap-2">{cats.map(c => (
            <label key={c.id} className="flex items-center gap-2 border border-border px-3 min-h-[44px] rounded-sm text-sm">
              <input type="checkbox" className="h-4 w-4" checked={!!j.categorias?.includes(c.id)} onChange={() => toggleCat(c.id)} />{c.nome}</label>))}</div>)}</div>
      <button disabled={busy} onClick={salvar} className="btn-gold min-h-[44px] md:col-span-3 flex items-center justify-center gap-2">{busy && <Loader2 size={14} className="animate-spin" />} Salvar</button>
    </div>
  );
};

/** Aplicações por evento. Admin configura; admin e consultor analisam, convocam e anotam. */
const AdminAplicacoes = ({ admin = true }: { admin?: boolean }) => {
  const [params, setParams] = useSearchParams();
  const eventoId = params.get('evento') ?? '';
  const filtro = params.get('st') ?? 'em_analise';
  const setParam = (k: string, v: string) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };

  const [eventos, setEventos] = useState<Tables<'eventos'>[] | null>(null);
  const [cats, setCats] = useState<Tables<'categorias'>[]>([]);
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    Promise.all([supabase.from('eventos').select('*').order('data_evento', { ascending: false }), supabase.from('categorias').select('*').order('ordem')])
      .then(([e, c]) => { setEventos(e.data ?? []); setCats(c.data ?? []); if (!eventoId && e.data?.[0]) setParam('evento', e.data[0].id); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    if (!eventoId) return;
    setErro(false); setLinhas(null);
    const [a, n] = await Promise.all([
      supabase.from('aplicacoes').select('*,contas(nome,email,whatsapp,estilo,graduacao,dojo,cidade,nascimento,doc_frente_path,doc_verso_path)')
        .eq('evento_id', eventoId).neq('status', 'aguardando_pagamento').order('criado_em'),
      supabase.from('aplicacoes_notas').select('aplicacao_id,nota'),
    ]);
    if (a.error) { setErro(true); return; }
    setLinhas(a.data as unknown as Linha[]);
    setNotas(Object.fromEntries((n.data ?? []).map(x => [x.aplicacao_id, x.nota])));
  }, [eventoId]);
  useEffect(() => { load(); }, [load]);

  const evento = eventos?.find(e => e.id === eventoId);
  const decidir = async (id: string, status: string) => {
    setBusy(id);
    const { error } = await supabase.from('aplicacoes').update({ status }).eq('id', id);
    setBusy(null);
    if (error) { toast.error('Não foi possível salvar.'); return; }
    toast.success(STATUS_APLICACAO[status]); load();
  };
  const salvarNota = async (id: string) => {
    const { error } = await supabase.from('aplicacoes_notas').upsert({ aplicacao_id: id, nota: notas[id] ?? '', atualizado_em: new Date().toISOString() });
    error ? toast.error('Não foi possível salvar a nota.') : toast.success('Nota salva.');
  };
  const abrir = async (path: string) => {
    const { data } = await supabase.storage.from('atletas-docs').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
  };
  const reembolsar = async () => {
    setBusy('reembolso');
    const { data, error } = await supabase.functions.invoke('admin-aplicacoes-reembolso', { body: { eventoId, environment: getStripeEnvironment() } });
    setBusy(null);
    if (error || data?.error) { toast.error(data?.error ?? 'Não foi possível devolver.'); return; }
    toast.success(`${data.reembolsadas} taxa(s) devolvida(s)${data.falhas ? `, ${data.falhas} com falha` : ''}.`); load();
  };

  if (!eventos) return <div className="h-40 surface-elevated animate-pulse" aria-label="Carregando" />;
  if (!eventos.length) return <p className="surface-elevated p-6 text-muted-foreground">Cadastre um evento em Legends para abrir aplicações.</p>;

  const visiveis = (linhas ?? []).filter(l => filtro === 'todas' || l.status === filtro);
  const conta = (s: string) => (linhas ?? []).filter(l => l.status === s).length;
  const catNome = (id: string | null) => cats.find(c => c.id === id)?.nome ?? '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[240px]"><label className="form-label" htmlFor="ev">Evento</label>
          <select id="ev" className="form-field text-base" value={eventoId} onChange={e => setParam('evento', e.target.value)}>
            {eventos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select></div>
        <button onClick={() => csv(visiveis.map(l => ({
          nome: l.contas?.nome, email: l.contas?.email, whatsapp: l.contas?.whatsapp, categoria: catNome(l.categoria_id), estilo: l.contas?.estilo,
          graduacao: l.contas?.graduacao, dojo: l.contas?.dojo, cidade: l.contas?.cidade, highlight: l.highlight_link,
          autoriza_divulgacao: l.autoriza_divulgacao ? 'sim' : 'não', status: STATUS_APLICACAO[l.status], presenca: l.presenca_confirmada ? 'confirmada' : '',
          aplicou_em: dataBR(l.criado_em), respondido_em: dataBR(l.respondido_em), origem: l.origem, nota: notas[l.id],
        })), `aplicacoes-${evento?.slug ?? 'evento'}.csv`)} className="btn-outline-gold text-sm min-h-[44px] flex items-center gap-2"><Download size={14} /> CSV</button>
      </div>

      {admin && <Janela key={eventoId} eventoId={eventoId} cats={cats} />}

      {admin && evento?.status === 'cancelado' && (
        <div role="alert" className="surface-elevated p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">Evento cancelado. As taxas pagas devem ser devolvidas.</p>
          <button disabled={busy === 'reembolso'} onClick={reembolsar} className="btn-gold text-sm min-h-[44px] flex items-center gap-2">
            {busy === 'reembolso' && <Loader2 size={14} className="animate-spin" />} Devolver todas as taxas</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="tablist">
        {['em_analise', 'convocado', 'nao_convocado', 'reembolsada', 'todas'].map(s => (
          <button key={s} role="tab" aria-selected={filtro === s} onClick={() => setParam('st', s)}
            className={`text-sm px-4 min-h-[44px] border rounded-sm ${filtro === s ? 'border-gold text-gold' : 'border-border text-muted-foreground'}`}>
            {s === 'todas' ? 'Todas' : STATUS_APLICACAO[s]} {s !== 'todas' && linhas ? `(${conta(s)})` : ''}</button>
        ))}
      </div>

      {erro ? <div role="alert" className="surface-elevated p-6">Não foi possível carregar. <button onClick={load} className="text-gold ml-2 min-h-[44px]">Tentar de novo</button></div>
        : !linhas ? <div className="h-40 surface-elevated animate-pulse" aria-label="Carregando" />
        : !visiveis.length ? <p className="surface-elevated p-6 text-muted-foreground">Nenhuma aplicação neste filtro.</p> : (
          <ul className="space-y-3">
            {visiveis.map(l => (
              <li key={l.id} className="surface-elevated rounded-sm p-5 space-y-3">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium">{l.contas?.nome || l.contas?.email}</p>
                    <p className="text-sm text-muted-foreground">{[catNome(l.categoria_id), l.contas?.estilo, l.contas?.graduacao, l.contas?.dojo, l.contas?.cidade].filter(Boolean).join(' / ')}</p>
                    <p className="text-xs text-muted-foreground mt-1">Aplicou em {dataBR(l.criado_em)}{l.autoriza_divulgacao ? '. Autoriza divulgação do highlight' : ''}{l.presenca_confirmada ? '. Presença confirmada' : ''}</p>
                  </div>
                  <span className={`text-xs uppercase tracking-widest ${l.status === 'convocado' ? 'text-gold' : 'text-muted-foreground'}`}>{STATUS_APLICACAO[l.status]}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  {l.highlight_link && <a href={l.highlight_link} target="_blank" rel="noopener noreferrer" className="text-gold flex items-center gap-1 min-h-[44px]">Ver highlight <ExternalLink size={12} /></a>}
                  {l.contas?.doc_frente_path && <button onClick={() => abrir(l.contas!.doc_frente_path!)} className="text-gold min-h-[44px]">Identidade frente</button>}
                  {l.contas?.doc_verso_path && <button onClick={() => abrir(l.contas!.doc_verso_path!)} className="text-gold min-h-[44px]">Identidade verso</button>}
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <label htmlFor={`n-${l.id}`} className="sr-only">Nota interna</label>
                  <input id={`n-${l.id}`} placeholder="Nota interna (o atleta não vê)" className="form-field text-base flex-1" value={notas[l.id] ?? ''}
                    onChange={e => setNotas({ ...notas, [l.id]: e.target.value })} onBlur={() => salvarNota(l.id)} />
                  {l.status !== 'reembolsada' && <div className="flex gap-2">
                    {l.status !== 'nao_convocado' && <button disabled={busy === l.id} onClick={() => decidir(l.id, 'nao_convocado')} className="btn-outline-gold text-sm min-h-[44px]">Não convocar</button>}
                    {l.status !== 'convocado' && <button disabled={busy === l.id} onClick={() => decidir(l.id, 'convocado')} className="btn-gold text-sm min-h-[44px]">Convocar</button>}
                    {l.status !== 'em_analise' && <button disabled={busy === l.id} onClick={() => decidir(l.id, 'em_analise')} className="btn-outline-gold text-sm min-h-[44px]">Voltar para análise</button>}
                  </div>}
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
};

export default AdminAplicacoes;
