import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Download, Loader2, MessageCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStripeEnvironment } from '@/lib/stripe';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { exportarCSV, exportarXLSX, preencher, type Coluna } from '@/lib/exportar';

type Resumo = {
  funil: Record<'conta' | 'cadastro' | 'pago' | 'apto' | 'aplicou' | 'convocado', number>;
  fundadores: number; fundador_ate: string | null;
  receita: { produto: string; mes: string; total: number; qtd: number }[];
  origem: { origem: string; contas: number; compras: number; fechou: number }[];
  aplicacoes_categoria: { evento_id: string; evento: string; categoria_id: string | null; categoria: string; qtd: number }[];
  ppv_evento: { chave: string; evento: string; qtd: number; total: number; sem_conta: number }[];
  cidades: { cidade: string; atletas: number; compradores: number }[];
};
type Pessoa = { id: string; nome: string; email: string | null; whatsapp: string | null; cidade: string | null; origem?: string | null;
  numero?: number | null; data?: string | null; vencimento?: string | null; valor?: number | null; evento?: string | null; detalhe?: string };

const brl = (c?: number | null) => ((c ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '');
const PRODUTO: Record<string, string> = { registro_anual: 'Registro anual', registro_mensal: 'Registro mensal', ppv: 'PPV', aplicacao: 'Taxa de aplicação' };
const nomeProduto = (p: string) => PRODUTO[p] ?? (p.startsWith('outros_') ? `Antigo: ${p.slice(7)}` : p);
const FUNIL = [
  ['conta', 'Conta criada'], ['cadastro', 'Cadastro completo'], ['pago', 'Registro ativo'],
  ['apto', 'Apto'], ['aplicou', 'Aplicou'], ['convocado', 'Convocado'],
] as const;
const ACOES: { chave: string; titulo: string; dica: string }[] = [
  { chave: 'veteranos', titulo: 'Veteranos que ainda não entraram', dica: 'Atletas históricos sem conta' },
  { chave: 'parou_pagamento', titulo: 'Pararam no pagamento', dica: 'Cadastro completo, nenhum registro' },
  { chave: 'uma_meta', titulo: 'Falta uma meta', dica: 'Registro ativo, uma meta pendente' },
  { chave: 'vencendo', titulo: 'Registros vencendo em 30 dias', dica: 'Sem renovação feita' },
  { chave: 'sem_resposta', titulo: 'Aplicações perto do prazo', dica: 'Em análise, resposta em até 7 dias' },
  { chave: 'nao_confirmaram', titulo: 'Convocados sem confirmar', dica: 'Presença ainda não confirmada' },
];
const TITULO_LISTA: Record<string, string> = {
  ...Object.fromEntries(ACOES.map(a => [a.chave, a.titulo])),
  ...Object.fromEntries(FUNIL.map(([k, t]) => [`funil_${k}`, `Funil: ${t}`])),
  fundadores: 'Classe Fundadora', origem: 'Contas pela origem', origem_compras: 'Compras pela origem', origem_fechou: 'Compras fechadas pela origem', cidade: 'Contas da cidade',
  receita: 'Pagamentos', ppv: 'Compras de PPV', aplicacoes: 'Aplicações da categoria',
};
const COLS: Coluna[] = [
  { chave: 'nome', titulo: 'Nome' }, { chave: 'email', titulo: 'E-mail' }, { chave: 'whatsapp', titulo: 'WhatsApp' },
  { chave: 'cidade', titulo: 'Cidade' }, { chave: 'numero', titulo: 'Registro nº' }, { chave: 'detalhe', titulo: 'Situação' },
  { chave: 'evento', titulo: 'Evento' }, { chave: 'origem', titulo: 'Origem' }, { chave: 'valor', titulo: 'Valor', tipo: 'brl' },
  { chave: 'data', titulo: 'Data', tipo: 'data' },
];
const POR_PAGINA = 25;
const wa = (tel: string, msg: string) => `https://wa.me/${tel.replace(/\D/g, '').replace(/^(?!55)(\d{10,11})$/, '55$1')}?text=${encodeURIComponent(msg)}`;

const Numero = ({ rotulo, valor, sub, onClick }: { rotulo: string; valor: string | number; sub?: string; onClick: () => void }) => (
  <button onClick={onClick} className="surface-elevated rounded-sm p-4 text-left min-h-[44px] hover:border-gold transition-colors border border-border">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">{rotulo}</p>
    <p className="text-3xl text-gold font-display mt-1">{valor}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </button>
);

const Bloco = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section className="space-y-3"><h2 className="eyebrow">{titulo}</h2>{children}</section>
);

const Linhas = ({ itens }: { itens: { k: string; rotulo: string; valor: string; onClick: () => void }[] }) =>
  !itens.length ? <p className="surface-elevated p-4 text-sm text-muted-foreground">Ainda sem dados.</p> : (
    <ul className="surface-elevated rounded-sm divide-y divide-border">
      {itens.map(i => (
        <li key={i.k}><button onClick={i.onClick} className="w-full flex justify-between gap-3 px-4 min-h-[44px] items-center text-sm text-left hover:text-gold">
          <span>{i.rotulo}</span><span className="text-gold tabular-nums">{i.valor}</span></button></li>
      ))}
    </ul>
  );

/** Painel do promotor: números que abrem listas com ação. Só admin. */
const AdminPromotor = () => {
  const [params, setParams] = useSearchParams();
  const vista = params.get('pv') ?? 'painel';
  const lista = params.get('lista');
  const param = params.get('lp');
  const set = (kv: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(kv).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: false });
  };
  const abrir = (l: string, p?: string | null) => set({ pv: 'painel', lista: l, lp: p ?? null, q: null, pag: null });

  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [contagens, setContagens] = useState<Record<string, number>>({});
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [erro, setErro] = useState(false);
  const env = getStripeEnvironment();

  const carregar = useCallback(async () => {
    setErro(false);
    const [r, c, m] = await Promise.all([
      supabase.rpc('promotor_resumo', { _env: env }),
      supabase.rpc('promotor_contagens'),
      supabase.from('mensagens_whatsapp').select('chave,texto'),
    ]);
    if (r.error || c.error) { setErro(true); return; }
    setResumo(r.data as unknown as Resumo);
    setContagens(c.data as unknown as Record<string, number>);
    setMsgs(Object.fromEntries((m.data ?? []).map(x => [x.chave, x.texto])));
  }, [env]);
  useEffect(() => { carregar(); }, [carregar]);

  const abas = (
    <div className="flex flex-wrap gap-2" role="tablist">
      {[['painel', 'Painel'], ['mensagens', 'Mensagens'], ['links', 'Links com origem']].map(([k, t]) => (
        <button key={k} role="tab" aria-selected={vista === k} onClick={() => set({ pv: k, lista: null, lp: null })}
          className={`text-sm px-4 min-h-[44px] border rounded-sm ${vista === k ? 'border-gold text-gold' : 'border-border text-muted-foreground'}`}>{t}</button>
      ))}
    </div>
  );

  if (erro) return <div role="alert" className="surface-elevated p-6">Não foi possível carregar o painel. <button onClick={carregar} className="text-gold ml-2 min-h-[44px]">Tentar de novo</button></div>;
  if (vista === 'mensagens') return <div className="space-y-6">{abas}<Mensagens msgs={msgs} onSalvo={carregar} /></div>;
  if (vista === 'links') return <div className="space-y-6">{abas}<Links /></div>;
  if (lista) return <div className="space-y-6">{abas}<Lista lista={lista} param={param} env={env} msg={msgs[lista] ?? msgs.geral ?? ''} onVoltar={() => set({ lista: null, lp: null, q: null, pag: null })} /></div>;
  if (!resumo) return <div className="space-y-6">{abas}<div className="grid grid-cols-2 md:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 surface-elevated animate-pulse" />)}</div></div>;

  const f = resumo.funil;
  const dias = resumo.fundador_ate ? Math.ceil((new Date(resumo.fundador_ate).getTime() - Date.now()) / 864e5) : null;
  const meses = [...new Set(resumo.receita.map(r => r.mes))];
  const porProduto = Object.entries(resumo.receita.reduce<Record<string, number>>((a, r) => ({ ...a, [r.produto]: (a[r.produto] ?? 0) + Number(r.total) }), {}));
  const eventosApl = [...new Map(resumo.aplicacoes_categoria.map(a => [a.evento_id, a.evento])).entries()];

  return (
    <div className="space-y-8">
      {abas}
      <Bloco titulo="O que fazer hoje">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACOES.map(a => <Numero key={a.chave} rotulo={a.titulo} valor={contagens[a.chave] ?? 0} sub={a.dica} onClick={() => abrir(a.chave)} />)}
        </div>
      </Bloco>

      <Bloco titulo="Funil do Registro Legends">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {FUNIL.map(([k, t], i) => {
            const ant = i ? f[FUNIL[i - 1][0]] : null;
            return <Numero key={k} rotulo={t} valor={f[k]} sub={ant ? `${Math.round((f[k] / ant) * 100)}% da etapa anterior` : undefined} onClick={() => abrir(`funil_${k}`)} />;
          })}
        </div>
      </Bloco>

      <div className="grid md:grid-cols-2 gap-8">
        <Bloco titulo="Classe Fundadora">
          <Numero rotulo="Fundadores" valor={resumo.fundadores}
            sub={dias == null ? 'Sem data de encerramento definida' : dias > 0 ? `${dias} dia(s) até o fim da janela` : 'Janela encerrada'}
            onClick={() => abrir('fundadores')} />
        </Bloco>
        <Bloco titulo="Receita por produto">
          <Linhas itens={porProduto.map(([p, t]) => ({ k: p, rotulo: nomeProduto(p), valor: brl(t), onClick: () => abrir('receita', `${p}|`) }))} />
        </Bloco>
      </div>

      <Bloco titulo="Receita por mês">
        <Linhas itens={meses.map(m => {
          const t = resumo.receita.filter(r => r.mes === m).reduce((a, r) => a + Number(r.total), 0);
          const [a, mm] = m.split('-');
          return { k: m, rotulo: `${mm}/${a}`, valor: brl(t), onClick: () => abrir('receita', `|${m}`) };
        })} />
      </Bloco>

      <div className="grid md:grid-cols-2 gap-8">
        <Bloco titulo="Origem das contas">
          <Linhas itens={resumo.origem.filter(o => o.contas).map(o => ({ k: o.origem, rotulo: o.origem, valor: String(o.contas), onClick: () => abrir('origem', o.origem) }))} />
        </Bloco>
        <Bloco titulo="Origem das compras">
          <Linhas itens={resumo.origem.filter(o => o.compras).map(o => ({ k: o.origem, rotulo: o.origem, valor: String(o.compras), onClick: () => abrir('origem_compras', o.origem) }))} />
        </Bloco>
        <Bloco titulo="Origem que fechou a compra">
          <Linhas itens={resumo.origem.filter(o => o.fechou).map(o => ({ k: o.origem, rotulo: o.origem, valor: String(o.fechou), onClick: () => abrir('origem_fechou', o.origem) }))} />
        </Bloco>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Bloco titulo="Compras de PPV por evento">
          <Linhas itens={resumo.ppv_evento.map(p => ({ k: p.chave, rotulo: `${p.evento}${p.sem_conta ? ` (${p.sem_conta} sem conta)` : ''}`, valor: `${p.qtd} / ${brl(p.total)}`, onClick: () => abrir('ppv', p.chave) }))} />
        </Bloco>
        <Bloco titulo="Atletas e compradores por cidade">
          <Linhas itens={resumo.cidades.map(c => ({ k: c.cidade, rotulo: c.cidade, valor: `${c.atletas} atleta(s), ${c.compradores} comprador(es)`, onClick: () => abrir('cidade', c.cidade) }))} />
        </Bloco>
      </div>

      <Bloco titulo="Aplicações por categoria">
        {!eventosApl.length ? <p className="surface-elevated p-4 text-sm text-muted-foreground">Ainda sem aplicações.</p> : eventosApl.map(([id, nome]) => (
          <div key={id} className="space-y-2"><p className="text-sm text-foreground">{nome}</p>
            <Linhas itens={resumo.aplicacoes_categoria.filter(a => a.evento_id === id).map(a => ({
              k: `${id}${a.categoria_id}`, rotulo: a.categoria, valor: String(a.qtd), onClick: () => abrir('aplicacoes', `${id}|${a.categoria_id ?? ''}`) }))} /></div>
        ))}
      </Bloco>
      {env === 'sandbox' && <p className="text-xs text-muted-foreground">Valores do ambiente de teste de pagamentos.</p>}
    </div>
  );
};

const Lista = ({ lista, param, env, msg, onVoltar }: { lista: string; param: string | null; env: string; msg: string; onVoltar: () => void }) => {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const pag = Number(params.get('pag') ?? '1');
  const setQ = (k: string, v: string) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); if (k === 'q') p.delete('pag'); setParams(p, { replace: true }); };
  const [linhas, setLinhas] = useState<Pessoa[] | null>(null);
  const [erro, setErro] = useState(false);
  const [ficha, setFicha] = useState<Pessoa | null>(null);
  const [exp, setExp] = useState(false);
  const [aceites, setAceites] = useState<{ slug: string; idioma: string; versao: number; contexto: string; aceito_em: string }[] | null>(null);
  useEffect(() => {
    setAceites(null);
    if (!ficha?.email) return;
    (async () => {
      const { data: c } = await supabase.from('contas').select('id').ilike('email', ficha.email!).maybeSingle();
      if (!c) { setAceites([]); return; }
      const { data } = await supabase.from('aceites').select('slug,idioma,versao,contexto,aceito_em').eq('conta_id', c.id).order('aceito_em', { ascending: false }).limit(30);
      setAceites(data ?? []);
    })();
  }, [ficha]);

  const carregar = useCallback(async () => {
    setErro(false); setLinhas(null);
    const { data, error } = await supabase.rpc('promotor_lista', { _lista: lista, _param: param ?? undefined, _env: env });
    if (error) { setErro(true); return; }
    setLinhas(data as unknown as Pessoa[]);
  }, [lista, param, env]);
  useEffect(() => { carregar(); }, [carregar]);

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (linhas ?? []).filter(l => !t || [l.nome, l.email, l.whatsapp, l.cidade, l.detalhe].some(x => x?.toLowerCase().includes(t)));
  }, [linhas, q]);
  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pagina = filtradas.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);
  const titulo = `${TITULO_LISTA[lista] ?? 'Lista'}${param && !['receita', 'aplicacoes', 'ppv'].includes(lista) ? `: ${param}` : ''}`;
  const texto = (p: Pessoa) => preencher(msg, { nome: p.nome?.split(' ')[0], numero: p.numero, evento: p.evento, vencimento: dt(p.vencimento) });
  const nomeArq = `${lista}-${new Date().toISOString().slice(0, 10)}`;
  const exportar = async (tipo: 'csv' | 'xlsx') => {
    setExp(true);
    try { tipo === 'csv' ? exportarCSV(filtradas, COLS, nomeArq) : await exportarXLSX(filtradas, COLS, nomeArq); }
    catch { toast.error('Não foi possível exportar.'); }
    setExp(false);
  };

  return (
    <div className="space-y-4">
      <button onClick={onVoltar} className="text-sm text-gold flex items-center gap-2 min-h-[44px]"><ArrowLeft size={14} /> Voltar ao painel</button>
      <div className="flex flex-wrap justify-between gap-3 items-end">
        <div><p className="eyebrow">Promotor</p><h2 className="text-2xl text-foreground">{titulo}</h2>
          {linhas && <p className="text-sm text-muted-foreground">{filtradas.length} pessoa(s)</p>}</div>
        <div className="flex gap-2">
          <button disabled={exp} onClick={() => exportar('xlsx')} className="btn-outline-gold text-sm min-h-[44px] flex items-center gap-2"><Download size={14} /> Excel</button>
          <button disabled={exp} onClick={() => exportar('csv')} className="btn-outline-gold text-sm min-h-[44px] flex items-center gap-2"><Download size={14} /> CSV</button>
        </div>
      </div>
      <label className="relative block"><span className="sr-only">Buscar</span>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={e => setQ('q', e.target.value)} placeholder="Buscar por nome, e-mail, cidade" className="form-field text-base pl-9" /></label>

      {erro ? <div role="alert" className="surface-elevated p-6">Não foi possível carregar. <button onClick={carregar} className="text-gold ml-2 min-h-[44px]">Tentar de novo</button></div>
        : !linhas ? <div className="h-40 surface-elevated animate-pulse" aria-label="Carregando" />
        : !filtradas.length ? <p className="surface-elevated p-6 text-muted-foreground">Ninguém nesta lista.</p> : (
          <ul className="surface-elevated rounded-sm divide-y divide-border">
            {pagina.map(p => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button onClick={() => setFicha(p)} className="flex-1 min-w-[200px] text-left min-h-[44px]">
                  <p className="font-medium">{p.nome}{p.numero ? <span className="text-gold ml-2 text-sm">nº {p.numero}</span> : null}</p>
                  <p className="text-xs text-muted-foreground">{[p.detalhe, p.cidade, p.valor != null ? brl(p.valor) : null, dt(p.data)].filter(Boolean).join(' / ')}</p>
                </button>
                {p.whatsapp ? <a href={wa(p.whatsapp, texto(p))} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm min-h-[44px] flex items-center gap-2"><MessageCircle size={14} /> WhatsApp</a>
                  : <span className="text-xs text-muted-foreground">Sem WhatsApp</span>}
              </li>
            ))}
          </ul>
        )}
      {paginas > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button disabled={pag <= 1} onClick={() => setQ('pag', String(pag - 1))} className="btn-outline-gold text-sm min-h-[44px]">Anterior</button>
          <span className="text-sm text-muted-foreground">Página {pag} de {paginas}</span>
          <button disabled={pag >= paginas} onClick={() => setQ('pag', String(pag + 1))} className="btn-outline-gold text-sm min-h-[44px]">Próxima</button>
        </div>
      )}

      <Sheet open={!!ficha} onOpenChange={o => !o && setFicha(null)}>
        <SheetContent className="bg-background border-border overflow-y-auto">
          {ficha && <>
            <SheetHeader><SheetTitle className="text-gold">{ficha.nome}</SheetTitle></SheetHeader>
            <dl className="mt-6 space-y-3 text-sm">
              {COLS.filter(c => ficha[c.chave as keyof Pessoa] != null && ficha[c.chave as keyof Pessoa] !== '').map(c => (
                <div key={c.chave}><dt className="text-xs uppercase tracking-widest text-muted-foreground">{c.titulo}</dt>
                  <dd>{c.tipo === 'brl' ? brl(ficha.valor) : c.tipo === 'data' ? dt(ficha.data) : String(ficha[c.chave as keyof Pessoa])}</dd></div>
              ))}
            </dl>
            <div className="mt-6 space-y-2">
              <p className="form-label">Mensagem</p>
              <p className="text-sm surface-elevated p-3 whitespace-pre-wrap">{texto(ficha)}</p>
              {ficha.whatsapp && <a href={wa(ficha.whatsapp, texto(ficha))} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm min-h-[44px] flex items-center justify-center gap-2"><MessageCircle size={14} /> Abrir WhatsApp</a>}
              <div><p className="eyebrow mb-2">Termos aceitos</p>
                {!aceites ? <div className="h-10 surface-elevated animate-pulse" aria-label="Carregando" /> : !aceites.length ? <p className="text-sm text-muted-foreground">Nenhum aceite registrado.</p> : (
                  <ul className="text-sm space-y-1">{aceites.map((a, i) => <li key={i}>{a.slug}, versão {a.versao} ({a.idioma.toUpperCase()}), {dt(a.aceito_em)}</li>)}</ul>)}</div>
              {ficha.email && <button onClick={() => { navigator.clipboard.writeText(ficha.email!); toast.success('E-mail copiado.'); }} className="btn-outline-gold text-sm min-h-[44px] w-full flex items-center justify-center gap-2"><Copy size={14} /> Copiar e-mail</button>}
            </div>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const CHAVES_MSG = [...ACOES.map(a => [a.chave, a.titulo] as const), ['geral', 'Demais listas'] as const];

const Mensagens = ({ msgs, onSalvo }: { msgs: Record<string, string>; onSalvo: () => void }) => {
  const [v, setV] = useState(msgs);
  const [busy, setBusy] = useState<string | null>(null);
  const salvar = async (k: string) => {
    setBusy(k);
    const { error } = await supabase.from('mensagens_whatsapp').upsert({ chave: k, texto: v[k] ?? '', atualizado_em: new Date().toISOString() });
    setBusy(null);
    if (error) { toast.error('Não foi possível salvar.'); return; }
    toast.success('Mensagem salva.'); onSalvo();
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Variáveis: {'{nome}'}, {'{numero}'}, {'{evento}'}, {'{vencimento}'}. Cada lista usa sua mensagem ao abrir o WhatsApp.</p>
      {CHAVES_MSG.map(([k, t]) => (
        <div key={k} className="surface-elevated p-4 space-y-2">
          <label htmlFor={`m-${k}`} className="form-label">{t}</label>
          <textarea id={`m-${k}`} rows={3} className="form-field text-base" value={v[k] ?? ''} onChange={e => setV({ ...v, [k]: e.target.value })} />
          <button disabled={busy === k} onClick={() => salvar(k)} className="btn-gold text-sm min-h-[44px] flex items-center gap-2">{busy === k && <Loader2 size={14} className="animate-spin" />} Salvar</button>
        </div>
      ))}
    </div>
  );
};

const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const Links = () => {
  type L = { id: string; slug: string; canal: string | null; campanha: string | null; atleta_id: string | null; destino: string; criado_em: string };
  const [links, setLinks] = useState<L[] | null>(null);
  const [atletas, setAtletas] = useState<{ id: string; nome: string }[]>([]);
  const [contagem, setContagem] = useState<Record<string, { contas: number; compras: number; fechou: number }>>({});
  const [form, setForm] = useState({ canal: '', campanha: '', atleta_id: '', destino: '/' });
  const [busy, setBusy] = useState(false);
  const carregar = useCallback(async () => {
    const [l, a, r] = await Promise.all([
      supabase.from('links_origem').select('*').order('criado_em', { ascending: false }),
      supabase.from('atletas').select('id,nome').order('nome'),
      supabase.rpc('promotor_resumo', { _env: getStripeEnvironment() }),
    ]);
    setLinks((l.data ?? []) as L[]); setAtletas(a.data ?? []);
    setContagem(Object.fromEntries(((r.data as unknown as Resumo | null)?.origem ?? []).map(o => [o.origem, { contas: o.contas, compras: o.compras, fechou: o.fechou ?? 0 }])));
  }, []);
  useEffect(() => { carregar(); }, [carregar]);
  const atletaNome = atletas.find(a => a.id === form.atleta_id)?.nome ?? '';
  const slug = slugify([form.canal, form.campanha, atletaNome].filter(Boolean).join(' '));
  const url = (l: Pick<L, 'slug' | 'destino'>) => `${window.location.origin}${l.destino}?origem=${l.slug}`;
  const criar = async () => {
    if (!slug) { toast.error('Informe canal, campanha ou atleta.'); return; }
    setBusy(true);
    const { error } = await supabase.from('links_origem').insert({ slug, canal: form.canal || null, campanha: form.campanha || null, atleta_id: form.atleta_id || null, destino: form.destino });
    setBusy(false);
    if (error) { toast.error(error.code === '23505' ? 'Esse link já existe.' : 'Não foi possível criar.'); return; }
    navigator.clipboard?.writeText(url({ slug, destino: form.destino })); toast.success('Link criado e copiado.');
    setForm({ canal: '', campanha: '', atleta_id: '', destino: '/' }); carregar();
  };
  return (
    <div className="space-y-6">
      <div className="surface-elevated p-5 grid md:grid-cols-4 gap-4">
        <div><label htmlFor="lc" className="form-label">Canal</label><input id="lc" className="form-field text-base" placeholder="instagram" value={form.canal} onChange={e => setForm({ ...form, canal: e.target.value })} /></div>
        <div><label htmlFor="lcp" className="form-label">Campanha</label><input id="lcp" className="form-field text-base" placeholder="fundadores" value={form.campanha} onChange={e => setForm({ ...form, campanha: e.target.value })} /></div>
        <div><label htmlFor="la" className="form-label">Atleta</label>
          <select id="la" className="form-field text-base" value={form.atleta_id} onChange={e => setForm({ ...form, atleta_id: e.target.value })}>
            <option value="">Nenhum</option>{atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}</select></div>
        <div><label htmlFor="ld" className="form-label">Página</label>
          <select id="ld" className="form-field text-base" value={form.destino} onChange={e => setForm({ ...form, destino: e.target.value })}>
            <option value="/">Home</option><option value="/ppv">PPV</option><option value="/atletas">Atletas</option></select></div>
        <p className="md:col-span-3 text-sm text-muted-foreground break-all self-center">{slug ? url({ slug, destino: form.destino }) : 'Preencha ao menos um campo.'}</p>
        <button disabled={busy || !slug} onClick={criar} className="btn-gold text-sm min-h-[44px] flex items-center justify-center gap-2">{busy && <Loader2 size={14} className="animate-spin" />} Criar e copiar</button>
      </div>
      {!links ? <div className="h-32 surface-elevated animate-pulse" aria-label="Carregando" /> : !links.length ? <p className="surface-elevated p-6 text-muted-foreground">Nenhum link criado.</p> : (
        <ul className="surface-elevated rounded-sm divide-y divide-border">
          {links.map(l => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-[200px]"><p className="font-medium">{l.slug}</p><p className="text-xs text-muted-foreground break-all">{url(l)}</p></div>
              <span className="text-sm text-gold">Trouxe: {contagem[l.slug]?.contas ?? 0} conta(s), {contagem[l.slug]?.compras ?? 0} compra(s). Fechou: {contagem[l.slug]?.fechou ?? 0} compra(s)</span>
              <button onClick={() => { navigator.clipboard.writeText(url(l)); toast.success('Link copiado.'); }} className="btn-outline-gold text-sm min-h-[44px] flex items-center gap-2"><Copy size={14} /> Copiar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminPromotor;
