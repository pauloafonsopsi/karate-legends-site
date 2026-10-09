import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompress';
import { formatPreco } from '@/lib/planos';
import { StripeEmbeddedCheckout } from '@/components/StripeEmbeddedCheckout';
import type { Tables } from '@/integrations/supabase/types';
import type { Conta } from '@/hooks/useConta';

type Janela = Tables<'janelas_aplicacao'>;
type Aplicacao = Tables<'aplicacoes'>;

export const STATUS_APLICACAO: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento', em_analise: 'Em análise', convocado: 'Convocado',
  nao_convocado: 'Não convocado nesta edição', reembolsada: 'Evento cancelado, taxa devolvida',
};
const dataBR = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '');
const aberta = (j: Janela) => j.ativo && (!j.abre_em || new Date(j.abre_em) <= new Date()) && (!j.fecha_em || new Date(j.fecha_em) >= new Date());

/** Eventos com aplicação aberta e as aplicações do atleta. */
const AplicacoesAtleta = ({ conta, userId, apto, highlightPadrao, onMudou }: {
  conta: Conta; userId: string; apto: boolean; highlightPadrao: string; onMudou: () => void;
}) => {
  const [janelas, setJanelas] = useState<Janela[] | null>(null);
  const [eventos, setEventos] = useState<Tables<'eventos'>[]>([]);
  const [cats, setCats] = useState<Tables<'categorias'>[]>([]);
  const [minhas, setMinhas] = useState<Aplicacao[]>([]);
  const [erro, setErro] = useState(false);
  const [form, setForm] = useState<string | null>(null);
  const [pagar, setPagar] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErro(false);
    const [j, e, c, a] = await Promise.all([
      supabase.from('janelas_aplicacao').select('*'),
      supabase.from('eventos').select('*').eq('publicado', true),
      supabase.from('categorias').select('*'),
      supabase.from('aplicacoes').select('*').eq('conta_id', conta.id).order('criado_em', { ascending: false }),
    ]);
    if (j.error || a.error) { setErro(true); return; }
    setJanelas(j.data); setEventos(e.data ?? []); setCats(c.data ?? []); setMinhas(a.data ?? []);
  }, [conta.id]);
  useEffect(() => { load(); }, [load]);

  const ev = (id: string) => eventos.find(x => x.id === id);
  const confirmar = async (id: string) => {
    const { data, error } = await supabase.rpc('confirmar_presenca', { _aplicacao_id: id });
    if (error || !data) { toast.error('Não foi possível confirmar.'); return; }
    toast.success('Presença confirmada.'); load(); onMudou();
  };

  if (erro) return <div role="alert" className="surface-elevated p-6">Não foi possível carregar os eventos. <button onClick={load} className="text-gold ml-2 min-h-[44px]">Tentar de novo</button></div>;
  if (!janelas) return <div className="h-32 surface-elevated animate-pulse rounded-sm" aria-label="Carregando" />;

  const abertas = janelas.filter(j => aberta(j) && ev(j.evento_id)?.status === 'agendado');

  return (
    <div className="space-y-6">
      {minhas.length > 0 && (
        <ul className="space-y-3">
          {minhas.map(a => {
            const j = janelas.find(x => x.evento_id === a.evento_id);
            return (
              <li key={a.id} className="surface-elevated rounded-sm p-4 space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <div><p className="font-medium">{ev(a.evento_id)?.nome ?? 'Evento'}</p>
                    <p className="text-sm text-muted-foreground">{cats.find(c => c.id === a.categoria_id)?.nome}</p></div>
                  <span className={`text-xs uppercase tracking-widest ${a.status === 'convocado' ? 'text-gold' : 'text-muted-foreground'}`}>{STATUS_APLICACAO[a.status]}</span>
                </div>
                {a.status === 'em_analise' && j?.resposta_ate && <p className="text-sm text-muted-foreground">Você recebe a resposta até {dataBR(j.resposta_ate)}.</p>}
                {a.status === 'aguardando_pagamento' && (pagar === a.id
                  ? <StripeEmbeddedCheckout priceId="aplicacao_evento" aplicacaoId={a.id} returnUrl={`${window.location.origin}/atleta?pagamento=ok`} />
                  : <button onClick={() => setPagar(a.id)} className="btn-gold text-sm min-h-[44px]">Pagar taxa {j && formatPreco(j.taxa_centavos)}</button>)}
                {a.status === 'convocado' && (a.presenca_confirmada
                  ? <p className="text-sm text-gold flex items-center gap-2"><Check size={14} /> Presença confirmada</p>
                  : <button onClick={() => confirmar(a.id)} className="btn-gold text-sm min-h-[44px]">Confirmar presença</button>)}
              </li>
            );
          })}
        </ul>
      )}

      {!abertas.length ? <p className="text-muted-foreground surface-elevated p-6">Nenhum evento com aplicações abertas agora.</p> : (
        <ul className="space-y-3">
          {abertas.map(j => {
            const ja = minhas.find(a => a.evento_id === j.evento_id && a.status !== 'aguardando_pagamento');
            const e = ev(j.evento_id)!;
            return (
              <li key={j.evento_id} className="surface-elevated rounded-sm p-5 space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <div><p className="font-display text-2xl uppercase">{e.nome}</p>
                    <p className="text-sm text-muted-foreground">Aplicações até {dataBR(j.fecha_em) || 'aviso'}{j.resposta_ate ? `. Resposta até ${dataBR(j.resposta_ate)}` : ''}{j.vagas ? `. ${j.vagas} vagas` : ''}</p></div>
                  <p className="font-display text-2xl text-gold">{j.taxa_centavos ? formatPreco(j.taxa_centavos) : 'Sem taxa'}</p>
                </div>
                {ja ? <p className="text-sm text-muted-foreground">Você já aplicou para este evento.</p>
                  : !apto ? <p className="text-sm text-muted-foreground">Para aplicar, todas as suas metas precisam estar verificadas.</p>
                  : form === j.evento_id ? <FormAplicar janela={j} cats={cats} conta={conta} userId={userId} highlightPadrao={highlightPadrao}
                      onCancelar={() => setForm(null)} onOk={id => { setForm(null); load(); onMudou(); if (j.taxa_centavos) setPagar(id); }} />
                  : <button onClick={() => setForm(j.evento_id)} className="btn-gold min-h-[44px]">Aplicar</button>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const FormAplicar = ({ janela, cats, conta, userId, highlightPadrao, onCancelar, onOk }: {
  janela: Janela; cats: Tables<'categorias'>[]; conta: Conta; userId: string; highlightPadrao: string;
  onCancelar: () => void; onOk: (id: string) => void;
}) => {
  const abertas = cats.filter(c => janela.categorias.includes(c.id));
  const [cat, setCat] = useState(abertas.length === 1 ? abertas[0].id : '');
  const [hl, setHl] = useState(highlightPadrao);
  const [autoriza, setAutoriza] = useState(false);
  const [aceite, setAceite] = useState(false);
  const [frente, setFrente] = useState<File | null>(null);
  const [verso, setVerso] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const precisaDoc = !conta.doc_frente_path || !conta.doc_verso_path;

  const subir = async (f: File, lado: string) => {
    if (f.size > 15 * 1024 * 1024) throw new Error('Arquivo acima de 15 MB.');
    const c = await compressImage(f);
    const path = `contas/${userId}/identidade-${lado}-${Date.now()}.${c.ext}`;
    const { error } = await supabase.storage.from('atletas-docs').upload(path, c.blob, { contentType: c.mime });
    if (error) throw new Error('Falha no envio do documento.');
    return path;
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (precisaDoc && (!frente || !verso)) { toast.error('Envie frente e verso do documento.'); return; }
    setBusy(true);
    try {
      if (precisaDoc) {
        const [pf, pv] = await Promise.all([subir(frente!, 'frente'), subir(verso!, 'verso')]);
        const { error } = await supabase.from('contas').update({ doc_frente_path: pf, doc_verso_path: pv }).eq('id', conta.id);
        if (error) throw new Error('Não foi possível salvar o documento.');
      }
      const { data, error } = await supabase.rpc('aplicar_evento', {
        _evento_id: janela.evento_id, _categoria_id: cat, _highlight: hl.trim(), _autoriza: autoriza, _aceite: aceite,
      });
      if (error) throw new Error(error.message);
      toast.success(janela.taxa_centavos ? 'Aplicação salva. Falta pagar a taxa.' : 'Aplicação enviada.');
      onOk(data as string);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível aplicar.');
    } finally { setBusy(false); }
  };

  const arquivo = (id: string, label: string, f: File | null, set: (f: File | null) => void) => (
    <label htmlFor={id} className="btn-outline-gold text-sm min-h-[44px] flex items-center gap-2 cursor-pointer">
      <Upload size={14} /> {f ? f.name : label}
      <input id={id} type="file" accept="image/*,application/pdf" className="sr-only" onChange={e => set(e.target.files?.[0] ?? null)} />
    </label>
  );

  return (
    <form onSubmit={enviar} className="space-y-4 border-t border-border pt-4">
      <p className="text-sm text-muted-foreground">Seus dados vêm da sua conta: {conta.nome}, {conta.estilo}, {conta.graduacao}.</p>
      <div><label className="form-label" htmlFor="cat">Categoria</label>
        <select id="cat" required className="form-field text-base" value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">Escolha</option>
          {abertas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select></div>
      <div><label className="form-label" htmlFor="hl">Link do highlight</label>
        <input id="hl" type="url" required className="form-field text-base" value={hl} onChange={e => setHl(e.target.value)} placeholder="https://" /></div>
      {precisaDoc && (
        <div><p className="form-label">Documento de identidade (só na primeira vez)</p>
          <div className="flex flex-col md:flex-row gap-2">{arquivo('df', 'Frente', frente, setFrente)}{arquivo('dv', 'Verso', verso, setVerso)}</div></div>
      )}
      <label className="flex gap-3 text-sm min-h-[44px] items-start"><input type="checkbox" className="mt-1 h-5 w-5" checked={aceite} onChange={e => setAceite(e.target.checked)} required />
        <span>Li e aceito os <Link to="/termos-atleta" target="_blank" className="text-gold underline">termos</Link> e a <Link to="/politica-dados" target="_blank" className="text-gold underline">política de dados</Link>.</span></label>
      <label className="flex gap-3 text-sm min-h-[44px] items-start"><input type="checkbox" className="mt-1 h-5 w-5" checked={autoriza} onChange={e => setAutoriza(e.target.checked)} />
        <span>Autorizo o uso do meu highlight na divulgação do evento (opcional).</span></label>
      <div className="flex gap-2">
        <button type="button" onClick={onCancelar} className="btn-outline-gold min-h-[44px]">Cancelar</button>
        <button disabled={busy} className="btn-gold min-h-[44px] flex items-center gap-2">{busy && <Loader2 size={14} className="animate-spin" />} Enviar aplicação</button>
      </div>
    </form>
  );
};

export default AplicacoesAtleta;
