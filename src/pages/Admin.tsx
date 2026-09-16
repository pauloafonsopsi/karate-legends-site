import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';
import {
  Loader2, Download, LogOut, ExternalLink, Save, Search, Copy, FileText,
  Users, Clock, CheckCircle2, XCircle, DollarSign, Bell, LayoutDashboard, UserSquare2, Trash2, Inbox,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import prestigeLogo from '@/assets/karate-legends-prestige-lockup.png';

type Inscricao = {
  id: string;
  criado_em: string;
  nome: string;
  email: string;
  whatsapp: string;
  estilo: string;
  graduacao: string;
  associacao: string | null;
  cidade: string | null;
  pais: string | null;
  link_video: string | null;
  link_certificado: string | null;
  link_documento: string | null;
  link_documento_verso: string | null;
  redes_sociais: string | null;
  dono_dojo: boolean;
  sensei_nome: string | null;
  sensei_telefone: string | null;
  aceite_termos: boolean;
  aceite_privacidade: boolean;
  status: string;
  pagamento_confirmado: boolean;
  observacoes: string | null;
  respondido_em: string | null;
};

type Waitlist = {
  id: string;
  criado_em: string;
  nome: string;
  email: string;
  whatsapp: string;
};

const STATUS_OPTIONS = ['pendente', 'pago', 'aprovado', 'rejeitado'] as const;

const statusColor: Record<string, string> = {
  pendente: 'bg-secondary text-muted-foreground border-border',
  pago: 'bg-gold/10 text-gold border-gold/35',
  aprovado: 'bg-foreground/10 text-foreground border-foreground/25',
  rejeitado: 'bg-destructive/15 text-destructive-foreground border-destructive/35',
};

type Membro = {
  id: string;
  criado_em: string;
  nome: string;
  email: string;
  whatsapp: string;
  cidade: string | null;
  pais: string | null;
  plano: string;
  status: string;
  observacoes: string | null;
};

type Assinatura = {
  id: string;
  email: string | null;
  price_id: string | null;
  status: string;
  tipo: string | null;
  valor_centavos: number | null;
  moeda: string | null;
  periodo_fim: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
  criado_em: string;
};

const PLANO_LABEL: Record<string, string> = {
  membro_mensal: 'Membro R$ 19,90/mês',
  ppv_evento_unico: 'PPV R$ 59,90/evento',
  newsletter_mensal: 'Newsletter R$ 29,90/mês',
};

type TabKey = 'overview' | 'atletas' | 'membros' | 'pagamentos' | 'ppv';

const Admin = () => {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAdminAuth();
  const [tab, setTab] = useState<TabKey>('overview');
  const [atletas, setAtletas] = useState<Inscricao[]>([]);
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterPago, setFilterPago] = useState<'todos' | 'sim' | 'nao'>('todos');
  const [editing, setEditing] = useState<Inscricao | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ type: 'atleta' | 'ppv' | 'membro'; id: string; name: string } | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!session) navigate('/admin/login');
      else if (!isAdmin) {
        // logged in but not admin
      }
    }
  }, [loading, session, isAdmin, navigate]);

  const load = async () => {
    setFetching(true);
    const [a, w, m, s] = await Promise.all([
      supabase.from('inscricoes_atletas').select('*').order('criado_em', { ascending: false }),
      supabase.from('lista_espera_ppv').select('*').order('criado_em', { ascending: false }),
      supabase.from('membros').select('*').order('criado_em', { ascending: false }),
      supabase.from('assinaturas').select('*').order('criado_em', { ascending: false }),
    ]);
    if (a.data) setAtletas(a.data as Inscricao[]);
    if (w.data) setWaitlist(w.data as Waitlist[]);
    if (m.data) setMembros(m.data as Membro[]);
    if (s.data) setAssinaturas(s.data as Assinatura[]);
    setFetching(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const filtered = useMemo(() => {
    return atletas.filter(a => {
      if (filterStatus !== 'todos' && a.status !== filterStatus) return false;
      if (filterPago === 'sim' && !a.pagamento_confirmado) return false;
      if (filterPago === 'nao' && a.pagamento_confirmado) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          a.nome.toLowerCase().includes(s) ||
          a.email.toLowerCase().includes(s) ||
          (a.cidade ?? '').toLowerCase().includes(s) ||
          (a.pais ?? '').toLowerCase().includes(s) ||
          (a.estilo ?? '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [atletas, search, filterStatus, filterPago]);

  const stats = useMemo(() => {
    const byStatus = (s: string) => atletas.filter(a => a.status === s).length;
    const last7 = atletas.filter(a => {
      const d = new Date(a.criado_em).getTime();
      return Date.now() - d < 7 * 86400000;
    }).length;
    return {
      total: atletas.length,
      pendentes: byStatus('pendente'),
      pagos: atletas.filter(a => a.pagamento_confirmado).length,
      aprovados: byStatus('aprovado'),
      rejeitados: byStatus('rejeitado'),
      ppv: waitlist.length,
      last7,
    };
  }, [atletas, waitlist]);

  const exportCSV = (rows: Record<string, unknown>[], filename: string) => {
    if (!rows.length) { toast.info('Nada para exportar'); return; }
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };
    const csv = [headers.join(';'), ...rows.map(r => headers.map(h => escape(r[h])).join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportado ${rows.length} registro(s)`);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from('inscricoes_atletas').update({
      status: editing.status,
      pagamento_confirmado: editing.pagamento_confirmado,
      observacoes: editing.observacoes,
      respondido_em: editing.status === 'aprovado' || editing.status === 'rejeitado'
        ? (editing.respondido_em || new Date().toISOString())
        : editing.respondido_em,
    }).eq('id', editing.id);
    if (!error) {
      setEditing(null);
      load();
      toast.success('Alterações salvas');
    } else {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const table = pendingDelete.type === 'atleta'
      ? 'inscricoes_atletas'
      : pendingDelete.type === 'membro' ? 'membros' : 'lista_espera_ppv';
    const { error } = await supabase.from(table).delete().eq('id', pendingDelete.id);
    if (error) { toast.error(error.message); return; }
    toast.success(pendingDelete.type === 'atleta' ? 'Inscrição excluída' : 'Removido da lista');
    setPendingDelete(null);
    setEditing(null);
    load();
  };

  const togglePaid = async (a: Inscricao) => {
    const next = !a.pagamento_confirmado;
    const { error } = await supabase.from('inscricoes_atletas')
      .update({ pagamento_confirmado: next, status: next && a.status === 'pendente' ? 'pago' : a.status })
      .eq('id', a.id);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? 'Pagamento confirmado' : 'Pagamento desmarcado');
    load();
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (loading) return <div className="pt-32 text-center"><Loader2 className="animate-spin inline" /></div>;
  if (!session) return null;
  if (!isAdmin) {
    return (
      <div className="pt-32 pb-20 max-w-2xl mx-auto px-6 text-center">
        <h1 className="text-3xl text-gold mb-4">Acesso negado</h1>
        <p className="text-white/70 mb-6">Sua conta ({session.user.email}) não tem permissão de administrador. Solicite ao administrador principal que conceda o papel <code className="text-gold">admin</code> ao seu usuário.</p>
        <button onClick={logout} className="btn-outline-gold">Sair</button>
      </div>
    );
  }

  const TABS: { key: TabKey; label: string; icon: typeof Users; count?: number }[] = [
    { key: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { key: 'atletas', label: 'Atletas', icon: UserSquare2, count: atletas.length },
    { key: 'membros', label: 'Membros', icon: Users, count: membros.length },
    { key: 'pagamentos', label: 'Pagamentos', icon: DollarSign, count: assinaturas.length },
    { key: 'ppv', label: 'Lista PPV', icon: Bell, count: waitlist.length },
  ];

  return (
    <div className="pt-28 pb-20 px-4 md:px-8 max-w-[1480px] mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-5">
          <img src={prestigeLogo} alt="Karate Legends" className="hidden sm:block w-36 h-auto" />
          <div className="sm:border-l sm:border-border sm:pl-5">
          <p className="eyebrow mb-1">Centro de controle</p>
          <h1 className="text-3xl md:text-4xl text-foreground">Painel Admin</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">{session.user.email}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-outline-gold flex items-center gap-2 text-sm">
          <LogOut size={14} /> Sair
        </button>
      </div>

      <div className="flex gap-1 mb-8 border-b border-white/10 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap ${active ? 'text-gold border-b-2 border-gold' : 'text-white/50 hover:text-white border-b-2 border-transparent'}`}>
              <Icon size={14} /> {t.label}
              {typeof t.count === 'number' && (
                <span className={`text-xs px-2 py-0.5 ${active ? 'bg-gold/20 text-gold' : 'bg-white/5 text-white/50'}`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Users} label="Total" value={stats.total} accent="text-gold" />
            <StatCard icon={Clock} label="Pendentes" value={stats.pendentes} accent="text-muted-foreground" />
            <StatCard icon={DollarSign} label="Pagos" value={stats.pagos} accent="text-gold" />
            <StatCard icon={CheckCircle2} label="Aprovados" value={stats.aprovados} accent="text-foreground" />
            <StatCard icon={XCircle} label="Rejeitados" value={stats.rejeitados} accent="text-muted-foreground" />
            <StatCard icon={Bell} label="Lista PPV" value={stats.ppv} accent="text-foreground" />
          </div>

          <div className="surface-elevated rounded-sm p-5 md:p-7">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg text-gold uppercase tracking-widest">Inscrições recentes</h2>
                <p className="text-xs text-white/40 mt-1">{stats.last7} novos atletas nos últimos 7 dias</p>
              </div>
              <button onClick={() => setTab('atletas')} className="text-xs uppercase tracking-widest text-gold hover:underline">Ver todos →</button>
            </div>
            {fetching ? <TableSkeleton rows={5} /> : (
              <div className="divide-y divide-white/5">
                {atletas.slice(0, 6).map(a => (
                  <button key={a.id} onClick={() => setEditing(a)}
                    className="w-full flex items-center justify-between py-3 text-left hover:bg-white/[0.02] px-2 -mx-2 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{a.nome}</p>
                      <p className="text-xs text-white/40 truncate">{a.estilo} · {a.graduacao} · {a.cidade || '—'}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2 py-1 text-[10px] border ${statusColor[a.status] || ''}`}>{a.status}</span>
                      <span className="text-xs text-white/40 hidden md:inline">{new Date(a.criado_em).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </button>
                ))}
                {!atletas.length && <EmptyState label="Nenhuma inscrição ainda" />}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'atletas' && (
        <>
          <div className="space-y-3 mb-5">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail, cidade, país ou estilo"
                  className="w-full bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm focus:border-gold/50 focus-visible:outline-none" />
              </div>
              <button onClick={() => exportCSV(filtered as unknown as Record<string, unknown>[], 'atletas.csv')}
                className="btn-outline-gold text-sm flex items-center gap-2">
                <Download size={14} /> CSV
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs uppercase tracking-widest text-white/40 mr-1">Status:</span>
              <Chip active={filterStatus === 'todos'} onClick={() => setFilterStatus('todos')}>Todos</Chip>
              {STATUS_OPTIONS.map(s => (
                <Chip key={s} active={filterStatus === s} onClick={() => setFilterStatus(s)} colorClass={statusColor[s]}>
                  {s}
                </Chip>
              ))}
              <span className="text-xs uppercase tracking-widest text-white/40 ml-3 mr-1">Pago:</span>
              <Chip active={filterPago === 'todos'} onClick={() => setFilterPago('todos')}>Todos</Chip>
              <Chip active={filterPago === 'sim'} onClick={() => setFilterPago('sim')}>Sim</Chip>
              <Chip active={filterPago === 'nao'} onClick={() => setFilterPago('nao')}>Não</Chip>
              <span className="text-xs text-white/40 ml-auto">{filtered.length} de {atletas.length}</span>
            </div>
          </div>

          {fetching ? <TableSkeleton rows={6} /> : (
            <>
            <div className="hidden md:block overflow-x-auto border border-border rounded-sm">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-widest text-white/50">
                  <tr>
                    <th className="text-left p-3">Data</th>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">E-mail</th>
                    <th className="text-left p-3">WhatsApp</th>
                    <th className="text-left p-3">Estilo</th>
                    <th className="text-left p-3">Graduação</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Pago</th>
                    <th className="text-left p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 text-white/60 text-xs">{new Date(a.criado_em).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-medium text-white">{a.nome}</td>
                      <td className="p-3 text-white/70">{a.email}</td>
                      <td className="p-3 text-white/70">{a.whatsapp}</td>
                      <td className="p-3 text-white/70">{a.estilo}</td>
                      <td className="p-3 text-white/70">{a.graduacao}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs border ${statusColor[a.status] || ''}`}>{a.status}</span>
                      </td>
                      <td className="p-3">
                        <button onClick={() => togglePaid(a)}
                           className={`text-xs px-2 py-1 border transition-colors ${a.pagamento_confirmado ? 'border-gold/40 text-gold bg-gold/10' : 'border-border text-muted-foreground hover:border-gold/40 hover:text-gold'}`}>
                          {a.pagamento_confirmado ? '✓ Pago' : 'Marcar'}
                        </button>
                      </td>
                      <td className="p-3">
                        <button onClick={() => setEditing(a)} className="text-gold hover:underline text-xs">Ver / Editar</button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={9}><EmptyState label="Nenhuma inscrição encontrada com esses filtros" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {filtered.map(a => <button key={a.id} onClick={() => setEditing(a)} className="w-full surface-elevated rounded-sm p-4 text-left">
                <div className="flex justify-between gap-3 mb-3"><div><p className="font-bold text-foreground">{a.nome}</p><p className="text-xs text-muted-foreground mt-1">{a.estilo} · {a.graduacao}</p></div><span className={`self-start px-2 py-1 text-[10px] border ${statusColor[a.status] || ''}`}>{a.status}</span></div>
                <div className="flex justify-between text-xs text-muted-foreground"><span>{a.cidade || '—'}, {a.pais || '—'}</span><span>{new Date(a.criado_em).toLocaleDateString('pt-BR')}</span></div>
              </button>)}
              {!filtered.length && <EmptyState label="Nenhuma inscrição encontrada com esses filtros" />}
            </div>
            </>
          )}
        </>
      )}

      {tab === 'ppv' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-white/50">{waitlist.length} interessados na lista de espera</p>
            <button onClick={() => exportCSV(waitlist as unknown as Record<string, unknown>[], 'lista_ppv.csv')}
              className="btn-outline-gold text-sm flex items-center gap-2">
              <Download size={14} /> CSV
            </button>
          </div>
          {fetching ? <TableSkeleton rows={5} /> : (
          <div className="overflow-x-auto border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-white/50">
                <tr>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">E-mail</th>
                  <th className="text-left p-3">WhatsApp</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map(w => (
                  <tr key={w.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 text-white/60 text-xs">{new Date(w.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 text-white">{w.nome}</td>
                    <td className="p-3 text-white/70">{w.email}</td>
                    <td className="p-3 text-white/70">{w.whatsapp}</td>
                    <td className="p-3">
                       <button onClick={() => setPendingDelete({ type: 'ppv', id: w.id, name: w.nome })} className="text-destructive/80 hover:text-destructive" title="Remover">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!waitlist.length && <tr><td colSpan={5}><EmptyState label="Lista de espera vazia" /></td></tr>}
              </tbody>
            </table>
          </div>
          )}
        </>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-black-card border-l border-white/10 text-white overflow-y-auto">
          {editing && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl text-gold">{editing.nome}</SheetTitle>
                <p className="text-xs text-white/40 uppercase tracking-widest">
                  Inscrito em {new Date(editing.criado_em).toLocaleString('pt-BR')}
                </p>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <Section title="Contato">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <FieldCopy label="E-mail" value={editing.email} onCopy={copy} />
                    <FieldCopy label="WhatsApp" value={editing.whatsapp} onCopy={copy} />
                  </div>
                </Section>

                <Section title="Identificação">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Field label="Estilo" value={editing.estilo} />
                    <Field label="Graduação" value={editing.graduacao} />
                    <Field label="Cidade" value={editing.cidade ?? ''} />
                    <Field label="País" value={editing.pais ?? ''} />
                    <Field label="Associação" value={editing.associacao ?? ''} />
                    <Field label="Redes" value={editing.redes_sociais ?? ''} />
                  </div>
                </Section>

                <Section title="Dojo">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Field label="Dono do Dojo" value={editing.dono_dojo ? 'Sim' : 'Não'} />
                    {!editing.dono_dojo && (
                      <>
                        <Field label="Sensei" value={editing.sensei_nome ?? ''} />
                        <Field label="Tel. Sensei" value={editing.sensei_telefone ?? ''} />
                      </>
                    )}
                  </div>
                </Section>

                <Section title="Mídias enviadas">
                  <div className="space-y-3">
                    {editing.link_video && <LinkRow label="Vídeo" url={editing.link_video} />}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <StoragePreview label="Certificado" path={editing.link_certificado} />
                      <StoragePreview label="Doc · Frente" path={editing.link_documento} />
                      <StoragePreview label="Doc · Verso" path={editing.link_documento_verso} />
                    </div>
                    {!editing.link_video && !editing.link_certificado && !editing.link_documento && !editing.link_documento_verso && (
                      <p className="text-xs text-white/40">Nenhum arquivo enviado.</p>
                    )}
                  </div>
                </Section>

                <Section title="Aceites">
                  <div className="flex gap-4 text-sm">
                    <span className={editing.aceite_termos ? 'text-green-300' : 'text-red-300'}>
                      {editing.aceite_termos ? '✓' : '✗'} Termos
                    </span>
                    <span className={editing.aceite_privacidade ? 'text-green-300' : 'text-red-300'}>
                      {editing.aceite_privacidade ? '✓' : '✗'} Privacidade
                    </span>
                  </div>
                </Section>

                <Section title="Gestão">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Status</label>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map(s => (
                          <button key={s} onClick={() => setEditing({ ...editing, status: s })}
                            className={`px-3 py-1.5 text-xs border transition-colors ${editing.status === s ? statusColor[s] : 'border-white/10 text-white/50 hover:border-white/30'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={editing.pagamento_confirmado}
                        onChange={e => setEditing({ ...editing, pagamento_confirmado: e.target.checked })}
                        className="w-4 h-4 accent-gold" />
                      Pagamento confirmado
                    </label>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Observações internas</label>
                      <textarea value={editing.observacoes ?? ''} rows={4}
                        onChange={e => setEditing({ ...editing, observacoes: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-gold/50 focus-visible:outline-none" />
                    </div>
                    {editing.respondido_em && (
                      <p className="text-xs text-white/40">Respondido em {new Date(editing.respondido_em).toLocaleString('pt-BR')}</p>
                    )}
                  </div>
                </Section>

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                   <button onClick={() => setPendingDelete({ type: 'atleta', id: editing.id, name: editing.nome })} className="text-destructive text-xs hover:underline flex items-center gap-1">
                    <Trash2 size={12} /> Excluir inscrição
                  </button>
                  <button onClick={saveEdit} className="btn-gold flex items-center gap-2 text-sm">
                    <Save size={14} /> Salvar alterações
                  </button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-sm">
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Esta ação removerá permanentemente o registro de {pendingDelete?.name}. Não será possível desfazer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir registro</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
    <p className="text-white/90 break-words">{value || '—'}</p>
  </div>
);

const FieldCopy = ({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string, l: string) => void }) => (
  <div className="group">
    <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
    <div className="flex items-center gap-2">
      <p className="text-white/90 break-all flex-1">{value || '—'}</p>
      {value && (
        <button onClick={() => onCopy(value, label)} className="text-white/30 hover:text-gold opacity-0 group-hover:opacity-100 transition-opacity" title="Copiar">
          <Copy size={12} />
        </button>
      )}
    </div>
  </div>
);

const LinkRow = ({ label, url }: { label: string; url: string }) => (
  <a href={url} target="_blank" rel="noopener noreferrer"
    className="flex items-center gap-2 text-sm text-gold hover:underline break-all border border-white/10 hover:border-gold/30 p-2 transition-colors">
    <ExternalLink size={14} className="flex-shrink-0" />
    <span className="font-semibold">{label}:</span>
    <span className="text-white/70">{url}</span>
  </a>
);

const StoragePreview = ({ label, path }: { label: string; path: string | null }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isPdf = !!path && path.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    setUrl(null);
    if (!path || isPdf) return;
    let cancelled = false;
    setLoading(true);
    supabase.storage.from('atletas-docs').createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled) { setUrl(data?.signedUrl ?? null); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [path, isPdf]);

  const open = async () => {
    if (!path) return;
    const { data } = await supabase.storage.from('atletas-docs').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  if (!path) {
    return (
      <div className="border border-white/5 bg-white/[0.02] aspect-[4/3] flex flex-col items-center justify-center text-xs text-white/30 gap-1">
        <span className="uppercase tracking-widest">{label}</span>
        <span>—</span>
      </div>
    );
  }
  return (
    <button onClick={open} type="button"
      className="group relative border border-white/10 hover:border-gold/40 bg-black/40 aspect-[4/3] overflow-hidden text-left transition-colors">
      {isPdf ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
          <FileText size={28} className="text-gold" />
          <span className="text-xs">PDF</span>
        </div>
      ) : loading || !url ? (
        <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-white/40" /></div>
      ) : (
        <img src={url} alt={label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-white/80">{label}</span>
        <ExternalLink size={12} className="text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
};

const StatCard = ({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: number; accent: string }) => (
  <div className="surface-elevated rounded-sm p-4 hover:border-gold/30 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <Icon size={16} className={accent} />
      <span className="text-[10px] uppercase tracking-widest text-white/40">{label}</span>
    </div>
    <p className={`text-3xl font-light ${accent}`}>{value}</p>
  </div>
);

const Chip = ({ children, active, onClick, colorClass }: { children: React.ReactNode; active: boolean; onClick: () => void; colorClass?: string }) => (
  <button onClick={onClick}
    className={`px-3 py-1 text-xs border transition-colors ${active ? (colorClass || 'border-gold/50 text-gold bg-gold/10') : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'}`}>
    {children}
  </button>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-xs uppercase tracking-widest text-gold/80 mb-3 pb-2 border-b border-white/5">{title}</h3>
    {children}
  </div>
);

const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="border border-white/10 divide-y divide-white/5">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-3 flex gap-3 animate-pulse">
        <div className="h-4 w-20 bg-white/5" />
        <div className="h-4 flex-1 bg-white/5" />
        <div className="h-4 w-16 bg-white/5" />
      </div>
    ))}
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="p-12 text-center text-white/40 flex flex-col items-center gap-3">
    <Inbox size={32} className="text-white/20" />
    <p className="text-sm">{label}</p>
  </div>
);

export default Admin;