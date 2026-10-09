import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import MetasVerificar from '@/components/registro/MetasVerificar';
import type { Tables } from '@/integrations/supabase/types';

type Sub = 'contas' | 'metas' | 'verificar' | 'cortesias' | 'regras' | 'equipe';
type ContaLinha = Tables<'contas'> & { registros: Tables<'registros'>[] };

const dataBR = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '');

const Regras = () => {
  const [c, setC] = useState<Tables<'config_registro'> | null>(null);
  const [estilos, setEstilos] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.from('config_registro').select('*').maybeSingle().then(({ data }) => { setC(data); setEstilos(data?.estilos.join(', ') ?? ''); }); }, []);
  if (!c) return <div className="h-40 surface-elevated animate-pulse" />;
  const salvar = async () => {
    setBusy(true);
    const { error } = await supabase.from('config_registro').update({
      idade_minima: c.idade_minima, fundador_ate: c.fundador_ate,
      estilos: estilos.split(',').map(s => s.trim()).filter(Boolean), atualizado_em: new Date().toISOString(),
    }).eq('id', true);
    setBusy(false);
    error ? toast.error('Não foi possível salvar.') : toast.success('Regras salvas.');
  };
  return (
    <div className="surface-elevated p-6 grid md:grid-cols-3 gap-4 max-w-3xl">
      <div><label className="form-label" htmlFor="idm">Idade mínima</label>
        <input id="idm" type="number" min={0} className="form-field text-base" value={c.idade_minima} onChange={e => setC({ ...c, idade_minima: Number(e.target.value) })} /></div>
      <div className="md:col-span-2"><label className="form-label" htmlFor="est">Estilos aceitos (separados por vírgula)</label>
        <input id="est" className="form-field text-base" value={estilos} onChange={e => setEstilos(e.target.value)} /></div>
      <div className="md:col-span-3"><label className="form-label" htmlFor="fa">Fim da Classe Fundadora (vazio = ainda sem data, só anual)</label>
        <input id="fa" type="date" className="form-field text-base" value={c.fundador_ate?.slice(0, 10) ?? ''}
          onChange={e => setC({ ...c, fundador_ate: e.target.value ? new Date(e.target.value + 'T23:59:59-03:00').toISOString() : null })} /></div>
      <button disabled={busy} onClick={salvar} className="btn-gold min-h-[44px] md:col-span-3 flex items-center justify-center gap-2">{busy && <Loader2 size={14} className="animate-spin" />} Salvar regras</button>
      <p className="text-xs text-muted-foreground md:col-span-3">Preços do registro anual e mensal: aba Planos.</p>
    </div>
  );
};

const Metas = () => {
  const [lista, setLista] = useState<Tables<'metas'>[] | null>(null);
  const load = () => supabase.from('metas').select('*').order('ordem').then(({ data }) => setLista(data ?? []));
  useEffect(() => { load(); }, []);
  const salvar = async (m: Tables<'metas'>) => {
    const { error } = await supabase.from('metas').update({ nome: m.nome, descricao: m.descricao, exige_arquivo: m.exige_arquivo, ativo: m.ativo, ordem: m.ordem }).eq('id', m.id);
    error ? toast.error('Não foi possível salvar.') : toast.success('Meta salva.');
  };
  const nova = async () => { await supabase.from('metas').insert({ nome: 'Nova meta', ordem: (lista?.length ?? 0) + 1 }); load(); };
  if (!lista) return <div className="h-40 surface-elevated animate-pulse" />;
  const upd = (i: number, p: Partial<Tables<'metas'>>) => setLista(lista.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-3">
      {lista.map((m, i) => (
        <div key={m.id} className="surface-elevated p-4 grid md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-2"><label className="form-label">Nome</label><input className="form-field text-base" value={m.nome} onChange={e => upd(i, { nome: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="form-label">Descrição</label><input className="form-field text-base" value={m.descricao ?? ''} onChange={e => upd(i, { descricao: e.target.value })} /></div>
          <div className="flex flex-col gap-1 text-sm">
            <label className="flex gap-2 items-center min-h-[22px]"><input type="checkbox" checked={m.exige_arquivo} onChange={e => upd(i, { exige_arquivo: e.target.checked })} /> Exige arquivo</label>
            <label className="flex gap-2 items-center min-h-[22px]"><input type="checkbox" checked={m.ativo} onChange={e => upd(i, { ativo: e.target.checked })} /> Ativa</label>
          </div>
          <button onClick={() => salvar(m)} className="btn-outline-gold text-sm min-h-[44px]">Salvar</button>
        </div>
      ))}
      <button onClick={nova} className="btn-gold text-sm min-h-[44px]">Adicionar meta</button>
    </div>
  );
};

const Cortesias = () => {
  const [lista, setLista] = useState<(Tables<'cortesias_email'> & { atletas: { nome: string } | null })[] | null>(null);
  const [atletas, setAtletas] = useState<{ id: string; nome: string }[]>([]);
  const [email, setEmail] = useState('');
  const [atleta, setAtleta] = useState('');
  const load = () => supabase.from('cortesias_email').select('*, atletas(nome)').order('criado_em', { ascending: false }).then(({ data }) => setLista((data ?? []) as never));
  useEffect(() => { load(); supabase.from('atletas').select('id,nome').eq('historico', true).order('nome').then(({ data }) => setAtletas(data ?? [])); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('cortesias_email').insert({ email: email.trim().toLowerCase(), atleta_id: atleta || null });
    if (error) { toast.error(error.code === '23505' ? 'E-mail já cadastrado.' : 'Não foi possível salvar.'); return; }
    setEmail(''); setAtleta(''); load();
  };
  const del = async (id: string) => { await supabase.from('cortesias_email').delete().eq('id', id); load(); };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Quem entrar com este e-mail ganha o ano fundador e fica ligado ao atleta histórico. Campeões com cinturão vigente e quem pagou nas inscrições antigas recebem cortesia automaticamente.</p>
      <form onSubmit={add} className="surface-elevated p-4 grid md:grid-cols-3 gap-3 items-end">
        <div><label className="form-label" htmlFor="ce">E-mail</label><input id="ce" type="email" required className="form-field text-base" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><label className="form-label" htmlFor="ca">Atleta histórico</label>
          <select id="ca" className="form-field text-base" value={atleta} onChange={e => setAtleta(e.target.value)}>
            <option value="">Nenhum</option>{atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select></div>
        <button className="btn-gold min-h-[44px]">Adicionar cortesia</button>
      </form>
      {!lista ? <div className="h-24 surface-elevated animate-pulse" /> : !lista.length ? <p className="text-muted-foreground">Nenhuma cortesia cadastrada.</p> : (
        <ul className="space-y-2">{lista.map(c => (
          <li key={c.id} className="surface-elevated p-3 flex justify-between items-center text-sm gap-3">
            <span>{c.email}{c.atletas && ` | ${c.atletas.nome}`}</span>
            <span className="flex items-center gap-3">{c.usado_em ? `Usada em ${dataBR(c.usado_em)}` : 'Aguardando entrada'}
              <button onClick={() => del(c.id)} aria-label="Remover" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-destructive"><Trash2 size={14} /></button></span>
          </li>
        ))}</ul>
      )}
    </div>
  );
};

const Contas = () => {
  const [lista, setLista] = useState<ContaLinha[] | null>(null);
  const [atletas, setAtletas] = useState<{ id: string; nome: string }[]>([]);
  const [pg, setPg] = useState(0);
  const load = () => supabase.from('contas').select('*, registros(*)').order('criado_em', { ascending: false }).range(pg * 50, pg * 50 + 49)
    .then(({ data }) => setLista((data ?? []) as never));
  useEffect(() => { load(); }, [pg]);
  useEffect(() => { supabase.from('atletas').select('id,nome').order('nome').then(({ data }) => setAtletas(data ?? [])); }, []);
  const vincular = async (id: string, atleta_id: string) => {
    const { error } = await supabase.from('contas').update({ atleta_id: atleta_id || null }).eq('id', id);
    error ? toast.error('Não foi possível vincular.') : toast.success('Vínculo salvo.'); load();
  };
  if (!lista) return <div className="h-40 surface-elevated animate-pulse" />;
  if (!lista.length) return <p className="text-muted-foreground surface-elevated p-6">Nenhuma conta criada ainda.</p>;
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground"><tr>
            <th className="text-left p-3">Conta</th><th className="text-left p-3">Origem</th><th className="text-left p-3">Registro</th><th className="text-left p-3">Atleta histórico</th></tr></thead>
          <tbody>{lista.map(c => {
            const r = c.registros.filter(x => x.status === 'ativo').sort((a, b) => (b.vencimento ?? '').localeCompare(a.vencimento ?? ''))[0];
            return (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3"><p>{c.nome || 'Sem nome'}</p><p className="text-xs text-muted-foreground">{c.email}</p></td>
                <td className="p-3 text-xs">{c.origem ?? 'direto'}{c.indicacao && ` | ${c.indicacao}`}</td>
                <td className="p-3 text-xs">{r ? `${r.tipo}${c.fundador ? ' | fundador' : ''} até ${dataBR(r.vencimento) || 'cinturão'}` : 'Sem registro'}</td>
                <td className="p-3"><select aria-label="Vincular atleta" className="form-field text-base" value={c.atleta_id ?? ''} onChange={e => vincular(c.id, e.target.value)}>
                  <option value="">Nenhum</option>{atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}</select></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button disabled={pg === 0} onClick={() => setPg(pg - 1)} className="btn-outline-gold text-sm min-h-[44px]">Anterior</button>
        <button disabled={lista.length < 50} onClick={() => setPg(pg + 1)} className="btn-outline-gold text-sm min-h-[44px]">Próxima</button>
      </div>
    </div>
  );
};

const Equipe = () => {
  const [lista, setLista] = useState<{ user_id: string; email: string }[] | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const chamar = (body: object) => supabase.functions.invoke('admin-equipe', { body });
  const load = async () => { const { data } = await chamar({ acao: 'listar' }); setLista(data?.lista ?? []); };
  useEffect(() => { load(); }, []);
  const convidar = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { data, error } = await chamar({ acao: 'convidar', email, redirectTo: window.location.origin + '/consultor' });
    setBusy(false);
    if (error || data?.error) { toast.error('Não foi possível convidar.'); return; }
    toast.success('Convite enviado.'); setEmail(''); load();
  };
  const remover = async (user_id: string) => { await chamar({ acao: 'remover', user_id }); load(); };
  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-muted-foreground">O consultor técnico verifica metas em /consultor e não vê valores nem pagamentos.</p>
      <form onSubmit={convidar} className="surface-elevated p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1"><label className="form-label" htmlFor="ceq">E-mail do consultor</label>
          <input id="ceq" type="email" required className="form-field text-base" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <button disabled={busy} className="btn-gold min-h-[44px] flex items-center gap-2">{busy && <Loader2 size={14} className="animate-spin" />} Convidar</button>
      </form>
      {!lista ? <div className="h-20 surface-elevated animate-pulse" /> : !lista.length ? <p className="text-muted-foreground">Nenhum consultor ainda.</p> : (
        <ul className="space-y-2">{lista.map(c => (
          <li key={c.user_id} className="surface-elevated p-3 flex justify-between items-center text-sm">{c.email}
            <button onClick={() => remover(c.user_id)} className="text-destructive min-h-[44px]">Remover acesso</button></li>
        ))}</ul>
      )}
    </div>
  );
};

const SUBS: [Sub, string][] = [['contas', 'Contas'], ['verificar', 'Metas a verificar'], ['metas', 'Lista de metas'], ['cortesias', 'Cortesias'], ['regras', 'Barreiras e Classe Fundadora'], ['equipe', 'Equipe']];

const AdminRegistro = () => {
  const [sub, setSub] = useState<Sub>(() => (new URLSearchParams(location.search).get('sub') as Sub) || 'contas');
  const trocar = (s: Sub) => { setSub(s); const u = new URL(location.href); u.searchParams.set('sub', s); history.replaceState(null, '', u); };
  return (
    <div>
      <nav className="flex flex-wrap gap-2 mb-6" aria-label="Registro Legends">
        {SUBS.map(([k, l]) => <button key={k} onClick={() => trocar(k)} className={`text-sm min-h-[44px] px-4 border rounded-sm ${sub === k ? 'border-gold text-gold' : 'border-border text-muted-foreground'}`}>{l}</button>)}
      </nav>
      {sub === 'contas' && <Contas />}
      {sub === 'verificar' && <MetasVerificar />}
      {sub === 'metas' && <Metas />}
      {sub === 'cortesias' && <Cortesias />}
      {sub === 'regras' && <Regras />}
      {sub === 'equipe' && <Equipe />}
    </div>
  );
};
export default AdminRegistro;
