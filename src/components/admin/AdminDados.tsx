import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Download, Search, MessageCircle, RefreshCw, Inbox } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

type Membro = { id: string; criado_em: string; nome: string; email: string; whatsapp: string; cidade: string | null; pais: string | null; plano: string; status: string; observacoes: string | null };
type Assinatura = { id: string; email: string; tipo: string; status: string; valor_centavos: number | null; periodo_fim: string | null; criado_em: string; cancel_at_period_end: boolean };
type Espera = { id: string; criado_em: string; nome: string; email: string; whatsapp: string };

type Linha = { id: string; nome: string; email: string; whatsapp: string; detalhe: string; valor: number | null; data: string; status: string; extra: Record<string, unknown> };
type Segmento = 'ativos' | 'cobranca' | 'ppv' | 'pendentes' | 'espera';

const SEGMENTOS: { key: Segmento; label: string; mensagem: string }[] = [
  { key: 'ativos', label: 'Membros ativos', mensagem: 'Olá {nome}, obrigado por ser membro Karate Legends!' },
  { key: 'cobranca', label: 'Cobrança', mensagem: 'Olá {nome}, notamos um problema no pagamento da sua assinatura Karate Legends. Podemos ajudar?' },
  { key: 'ppv', label: 'Compradores PPV', mensagem: 'Olá {nome}, obrigado pela compra do PPV Karate Legends!' },
  { key: 'pendentes', label: 'Cadastro sem pagamento', mensagem: 'Olá {nome}, vimos que você iniciou seu cadastro de membro Karate Legends. Quer ajuda para concluir?' },
  { key: 'espera', label: 'Lista de espera', mensagem: 'Olá {nome}, temos novidades sobre o próximo evento Karate Legends!' },
];

const ATIVOS = ['active', 'trialing'];
const PROBLEMA = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'canceled'];
const POR_PAGINA = 25;

const brl = (c: number | null) => c == null ? '' : (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '';
const wa = (tel: string, msg: string) => `https://wa.me/${tel.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;

export function baixarCSV(linhas: Record<string, unknown>[], nome: string) {
  if (!linhas.length) { toast.info('Nada para exportar'); return; }
  const cab = Object.keys(linhas[0]);
  const esc = (v: unknown) => { const s = v == null ? '' : String(v).replace(/"/g, '""'); return /[";\n]/.test(s) ? `"${s}"` : s; };
  const csv = '\uFEFF' + [cab.join(';'), ...linhas.map(l => cab.map(c => esc(l[c])).join(';'))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `${nome}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export default function AdminDados() {
  const [params, setParams] = useSearchParams();
  const seg = (params.get('seg') as Segmento) || 'ativos';
  const busca = params.get('q') ?? '';
  const pagina = Number(params.get('p') ?? '1');
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); if (k !== 'p') n.delete('p'); setParams(n, { replace: true }); };

  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  const [membros, setMembros] = useState<Membro[]>([]);
  const [assin, setAssin] = useState<Assinatura[]>([]);
  const [espera, setEspera] = useState<Espera[]>([]);
  const [ficha, setFicha] = useState<Linha | null>(null);

  const carregar = async () => {
    setEstado('carregando');
    const [m, s, e] = await Promise.all([
      supabase.from('membros').select('*').order('criado_em', { ascending: false }),
      supabase.from('assinaturas').select('*').order('criado_em', { ascending: false }),
      supabase.from('lista_espera_ppv').select('*').order('criado_em', { ascending: false }),
    ]);
    if (m.error || s.error || e.error) { setEstado('erro'); return; }
    setMembros(m.data as Membro[]); setAssin(s.data as Assinatura[]); setEspera(e.data as Espera[]);
    setEstado('ok');
  };
  useEffect(() => { carregar(); }, []);

  const porEmail = useMemo(() => new Map(membros.map(m => [m.email.toLowerCase(), m])), [membros]);
  const deAssin = (a: Assinatura): Linha => {
    const m = porEmail.get(a.email.toLowerCase());
    return { id: a.id, nome: m?.nome ?? '', email: a.email, whatsapp: m?.whatsapp ?? '', detalhe: a.tipo, valor: a.valor_centavos, data: a.periodo_fim ?? a.criado_em, status: a.status, extra: { cidade: m?.cidade, pais: m?.pais, renovacao: data(a.periodo_fim), cancela_no_fim: a.cancel_at_period_end ? 'Sim' : 'Não' } };
  };

  const linhas: Record<Segmento, Linha[]> = useMemo(() => {
    const recorrentes = assin.filter(a => a.tipo !== 'ppv');
    const pagantes = new Set(assin.filter(a => ATIVOS.includes(a.status) || a.tipo === 'ppv').map(a => a.email.toLowerCase()));
    return {
      ativos: recorrentes.filter(a => ATIVOS.includes(a.status)).map(deAssin),
      cobranca: recorrentes.filter(a => PROBLEMA.includes(a.status)).map(deAssin),
      ppv: assin.filter(a => a.tipo === 'ppv').map(deAssin),
      pendentes: membros.filter(m => !pagantes.has(m.email.toLowerCase())).map(m => ({ id: m.id, nome: m.nome, email: m.email, whatsapp: m.whatsapp, detalhe: m.plano, valor: null, data: m.criado_em, status: m.status, extra: { cidade: m.cidade, pais: m.pais, observacoes: m.observacoes } })),
      espera: espera.map(e => ({ id: e.id, nome: e.nome, email: e.email, whatsapp: e.whatsapp, detalhe: 'PPV', valor: null, data: e.criado_em, status: 'aguardando', extra: {} })),
    };
  }, [assin, membros, espera, porEmail]);

  const kpis = useMemo(() => ({
    ativos: linhas.ativos.length,
    mrr: linhas.ativos.reduce((s, l) => s + (l.valor ?? 0), 0),
    ppv: linhas.ppv.length,
    cobranca: linhas.cobranca.length,
    espera: linhas.espera.length,
  }), [linhas]);

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase();
    return linhas[seg].filter(l => !q || [l.nome, l.email, l.whatsapp, String(l.extra.cidade ?? '')].some(v => v.toLowerCase().includes(q)));
  }, [linhas, seg, busca]);
  const totalPag = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const visiveis = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const segAtual = SEGMENTOS.find(s => s.key === seg)!;

  const exportar = () => baixarCSV(filtradas.map(l => ({
    Nome: l.nome, 'E-mail': l.email, WhatsApp: l.whatsapp, Plano: l.detalhe,
    Valor: l.valor == null ? '' : (l.valor / 100).toFixed(2).replace('.', ','), Data: data(l.data), Status: l.status,
    Cidade: l.extra.cidade ?? '', 'País': l.extra.pais ?? '',
  })), segAtual.label.toLowerCase().replace(/\s+/g, '-'));

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[['Membros ativos', kpis.ativos], ['Receita mensal', brl(kpis.mrr)], ['PPV vendidos', kpis.ppv], ['Em cobrança', kpis.cobranca], ['Lista de espera', kpis.espera]].map(([l, v]) => (
          <div key={l as string} className="surface-elevated border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{l}</p>
            <p className="text-2xl text-foreground mt-1">{estado === 'carregando' ? <span className="inline-block h-7 w-16 bg-secondary animate-pulse" /> : v}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto mb-4">
        {SEGMENTOS.map(s => (
          <button key={s.key} onClick={() => setParam('seg', s.key)}
            className={`min-h-[44px] px-4 border text-sm whitespace-nowrap ${seg === s.key ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted-foreground'}`}>
            {s.label} ({linhas[s.key].length})
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <label className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={busca} onChange={e => setParam('q', e.target.value)} placeholder="Buscar por nome, e-mail, WhatsApp ou cidade"
            className="form-field w-full pl-9 min-h-[44px] text-base" />
        </label>
        <button onClick={exportar} className="btn-outline-gold min-h-[44px] flex items-center justify-center gap-2 text-sm">
          <Download size={14} /> Baixar CSV
        </button>
      </div>

      {estado === 'carregando' && <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-secondary/60 animate-pulse" />)}</div>}

      {estado === 'erro' && (
        <div className="border border-destructive/40 p-8 text-center">
          <p className="mb-4">Não foi possível carregar os dados.</p>
          <button onClick={carregar} className="btn-outline-gold min-h-[44px] inline-flex items-center gap-2"><RefreshCw size={14} /> Tentar de novo</button>
        </div>
      )}

      {estado === 'ok' && filtradas.length === 0 && (
        <div className="border border-border p-10 text-center text-muted-foreground">
          <Inbox className="mx-auto mb-3" />
          {busca ? 'Nenhum resultado para essa busca.' : 'Ninguém neste grupo por enquanto.'}
        </div>
      )}

      {estado === 'ok' && filtradas.length > 0 && (
        <>
          <div className="border border-border divide-y divide-border">
            {visiveis.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-secondary/40">
                <button onClick={() => setFicha(l)} className="flex-1 text-left min-h-[44px] grid md:grid-cols-5 gap-1 md:gap-3 items-center">
                  <span className="text-foreground">{l.nome || l.email}</span>
                  <span className="text-sm text-muted-foreground truncate">{l.email}</span>
                  <span className="text-sm text-muted-foreground">{l.detalhe}</span>
                  <span className="text-sm">{brl(l.valor)}</span>
                  <span className="text-sm text-muted-foreground">{data(l.data)} · {l.status}</span>
                </button>
                {l.whatsapp && (
                  <a href={wa(l.whatsapp, segAtual.mensagem.replace('{nome}', l.nome.split(' ')[0] || ''))} target="_blank" rel="noreferrer"
                    aria-label={`WhatsApp de ${l.nome}`} className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-gold/40 text-gold">
                    <MessageCircle size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
          {totalPag > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <button disabled={pagina <= 1} onClick={() => setParam('p', String(pagina - 1))} className="btn-outline-gold min-h-[44px] disabled:opacity-40">Anterior</button>
              <span>Página {pagina} de {totalPag}</span>
              <button disabled={pagina >= totalPag} onClick={() => setParam('p', String(pagina + 1))} className="btn-outline-gold min-h-[44px] disabled:opacity-40">Próxima</button>
            </div>
          )}
        </>
      )}

      <Sheet open={!!ficha} onOpenChange={o => !o && setFicha(null)}>
        <SheetContent className="overflow-y-auto">
          {ficha && (
            <>
              <SheetHeader><SheetTitle>{ficha.nome || ficha.email}</SheetTitle></SheetHeader>
              <dl className="mt-6 space-y-3 text-sm">
                {Object.entries({ 'E-mail': ficha.email, WhatsApp: ficha.whatsapp, Plano: ficha.detalhe, Valor: brl(ficha.valor), Data: data(ficha.data), Status: ficha.status, ...ficha.extra })
                  .filter(([, v]) => v != null && v !== '')
                  .map(([k, v]) => (
                    <div key={k}><dt className="text-xs uppercase tracking-widest text-muted-foreground">{k.replace(/_/g, ' ')}</dt><dd className="text-foreground">{String(v)}</dd></div>
                  ))}
              </dl>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
