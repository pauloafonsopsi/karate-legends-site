import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2, Download, LogOut, ExternalLink, Save, X, Search } from 'lucide-react';

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
  pendente: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  pago: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  aprovado: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejeitado: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const Admin = () => {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAdminAuth();
  const [tab, setTab] = useState<'atletas' | 'ppv'>('atletas');
  const [atletas, setAtletas] = useState<Inscricao[]>([]);
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [editing, setEditing] = useState<Inscricao | null>(null);

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
    const [a, w] = await Promise.all([
      supabase.from('inscricoes_atletas').select('*').order('criado_em', { ascending: false }),
      supabase.from('lista_espera_ppv').select('*').order('criado_em', { ascending: false }),
    ]);
    if (a.data) setAtletas(a.data as Inscricao[]);
    if (w.data) setWaitlist(w.data as Waitlist[]);
    setFetching(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const filtered = useMemo(() => {
    return atletas.filter(a => {
      if (filterStatus !== 'todos' && a.status !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        return a.nome.toLowerCase().includes(s) || a.email.toLowerCase().includes(s);
      }
      return true;
    });
  }, [atletas, search, filterStatus]);

  const exportCSV = (rows: Record<string, unknown>[], filename: string) => {
    if (!rows.length) return;
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
    } else {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const deleteRow = async (id: string) => {
    if (!confirm('Excluir esta inscrição?')) return;
    await supabase.from('inscricoes_atletas').delete().eq('id', id);
    load();
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

  return (
    <div className="pt-28 pb-20 px-4 md:px-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl text-gold">Painel Admin</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">{session.user.email}</p>
        </div>
        <button onClick={logout} className="btn-outline-gold flex items-center gap-2 text-sm">
          <LogOut size={14} /> Sair
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-white/10">
        {(['atletas', 'ppv'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm uppercase tracking-widest transition-colors ${tab === t ? 'text-gold border-b-2 border-gold' : 'text-white/50 hover:text-white'}`}>
            {t === 'atletas' ? `Atletas (${atletas.length})` : `Lista PPV (${waitlist.length})`}
          </button>
        ))}
      </div>

      {tab === 'atletas' && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail"
                className="w-full bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-white/5 border border-white/10 px-3 py-2 text-sm">
              <option value="todos" className="bg-black-card">Todos os status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-black-card">{s}</option>)}
            </select>
            <button onClick={() => exportCSV(filtered as unknown as Record<string, unknown>[], 'atletas.csv')}
              className="btn-outline-gold text-sm flex items-center gap-2">
              <Download size={14} /> Exportar CSV
            </button>
          </div>

          {fetching ? <Loader2 className="animate-spin" /> : (
            <div className="overflow-x-auto border border-white/10">
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
                    <tr key={a.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="p-3 text-white/60 text-xs">{new Date(a.criado_em).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3">{a.nome}</td>
                      <td className="p-3 text-white/70">{a.email}</td>
                      <td className="p-3 text-white/70">{a.whatsapp}</td>
                      <td className="p-3 text-white/70">{a.estilo}</td>
                      <td className="p-3 text-white/70">{a.graduacao}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs border ${statusColor[a.status] || ''}`}>{a.status}</span>
                      </td>
                      <td className="p-3">{a.pagamento_confirmado ? '✓' : '—'}</td>
                      <td className="p-3">
                        <button onClick={() => setEditing(a)} className="text-gold hover:underline text-xs">Ver / Editar</button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={9} className="p-8 text-center text-white/40">Nenhuma inscrição encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'ppv' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => exportCSV(waitlist as unknown as Record<string, unknown>[], 'lista_ppv.csv')}
              className="btn-outline-gold text-sm flex items-center gap-2">
              <Download size={14} /> Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-white/50">
                <tr>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">E-mail</th>
                  <th className="text-left p-3">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map(w => (
                  <tr key={w.id} className="border-t border-white/5">
                    <td className="p-3 text-white/60 text-xs">{new Date(w.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">{w.nome}</td>
                    <td className="p-3 text-white/70">{w.email}</td>
                    <td className="p-3 text-white/70">{w.whatsapp}</td>
                  </tr>
                ))}
                {!waitlist.length && <tr><td colSpan={4} className="p-8 text-center text-white/40">Vazio.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de detalhes/edição */}
      {editing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="bg-black-card border border-white/10 max-w-2xl w-full p-6 my-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl text-gold">{editing.nome}</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest mt-1">
                  Inscrito em {new Date(editing.criado_em).toLocaleString('pt-BR')}
                </p>
              </div>
              <button onClick={() => setEditing(null)} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-6">
              <Field label="E-mail" value={editing.email} />
              <Field label="WhatsApp" value={editing.whatsapp} />
              <Field label="Estilo" value={editing.estilo} />
              <Field label="Graduação" value={editing.graduacao} />
              <Field label="Cidade / País" value={`${editing.cidade ?? ''} / ${editing.pais ?? ''}`} />
              <Field label="Redes" value={editing.redes_sociais ?? ''} />
              <Field label="Associação" value={editing.associacao ?? ''} />
              <Field label="Dono do Dojo" value={editing.dono_dojo ? 'Sim' : 'Não'} />
              {!editing.dono_dojo && (
                <>
                  <Field label="Sensei" value={editing.sensei_nome ?? ''} />
                  <Field label="Tel. Sensei" value={editing.sensei_telefone ?? ''} />
                </>
              )}
              <Field label="Aceite Termos" value={editing.aceite_termos ? 'Sim' : 'Não'} />
              <Field label="Aceite Privacidade" value={editing.aceite_privacidade ? 'Sim' : 'Não'} />
            </div>

            <div className="space-y-2 mb-6">
              {editing.link_video && <LinkRow label="Vídeo" url={editing.link_video} />}
              {editing.link_certificado && <LinkRow label="Certificado" url={editing.link_certificado} />}
              {editing.link_documento && <LinkRow label="Documento" url={editing.link_documento} />}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Status</label>
                  <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-black-card">{s}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 mt-6 text-sm">
                  <input type="checkbox" checked={editing.pagamento_confirmado}
                    onChange={e => setEditing({ ...editing, pagamento_confirmado: e.target.checked })}
                    className="w-4 h-4 accent-gold" />
                  Pagamento confirmado
                </label>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Observações</label>
                <textarea value={editing.observacoes ?? ''} rows={3}
                  onChange={e => setEditing({ ...editing, observacoes: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-between">
                <button onClick={() => deleteRow(editing.id)} className="text-red-400 text-xs hover:underline">Excluir</button>
                <button onClick={saveEdit} className="btn-gold flex items-center gap-2 text-sm">
                  <Save size={14} /> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
    <p className="text-white/90 break-words">{value || '—'}</p>
  </div>
);

const LinkRow = ({ label, url }: { label: string; url: string }) => (
  <a href={url} target="_blank" rel="noopener noreferrer"
    className="flex items-center gap-2 text-sm text-gold hover:underline break-all">
    <ExternalLink size={14} className="flex-shrink-0" />
    <span className="font-semibold">{label}:</span>
    <span className="text-white/70">{url}</span>
  </a>
);

export default Admin;