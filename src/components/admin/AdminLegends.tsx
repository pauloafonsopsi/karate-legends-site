import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2, Hash } from 'lucide-react';
import { fetchLegends, FORMATO, STATUS_EVENTO, STATUS_LUTA, dataBR, type LegendsData } from '@/lib/legends';

type Sub = 'eventos' | 'atletas' | 'categorias' | 'cinturoes';
type Row = Record<string, unknown> & { id?: string };
type Field = { k: string; l: string; type?: 'text' | 'number' | 'bool' | 'datetime' | 'select' | 'textarea'; opts?: Record<string, string> };

const toLocal = (v: unknown) => (v ? new Date(String(v)).toISOString().slice(0, 16) : '');

/** Generic form for one row; saves through RLS (admin only). */
function Editor({ table, row, fields, onDone }: { table: string; row: Row; fields: Field[]; onDone: () => void }) {
  const [r, setR] = useState<Row>(row);
  const [busy, setBusy] = useState(false);
  useEffect(() => setR(row), [row]);
  const save = async () => {
    setBusy(true);
    const { id, ...rest } = r;
    const clean = Object.fromEntries(Object.entries(rest).filter(([k]) => k === 'evento_id' || fields.some(f => f.k === k)).map(([k, v]) => [k, v === '' ? null : v]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = supabase.from(table as any);
    const { error } = id ? await q.update(clean).eq('id', id) : await q.insert(clean);
    setBusy(false);
    if (error) { toast.error('Não foi possível salvar: ' + error.message); return; }
    toast.success('Salvo.'); onDone();
  };
  const del = async () => {
    if (!r.id || !window.confirm('Excluir este registro?')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table as any).delete().eq('id', r.id);
    if (error) { toast.error('Não foi possível excluir. Verifique se está ligado a lutas.'); return; }
    toast.success('Excluído.'); onDone();
  };
  return (
    <div className="surface-elevated rounded-sm p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.k} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
            {f.type === 'bool' ? (
              <label className="flex items-center gap-2 min-h-[44px] text-sm">
                <input type="checkbox" className="w-5 h-5 accent-gold" checked={!!r[f.k]} onChange={e => setR({ ...r, [f.k]: e.target.checked })} /> {f.l}
              </label>
            ) : (
              <>
                <label className="form-label" htmlFor={`${table}-${f.k}`}>{f.l}</label>
                {f.type === 'select' ? (
                  <select id={`${table}-${f.k}`} className="form-field text-base" value={String(r[f.k] ?? '')} onChange={e => setR({ ...r, [f.k]: e.target.value })}>
                    <option value="">Selecione</option>
                    {Object.entries(f.opts ?? {}).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea id={`${table}-${f.k}`} rows={3} className="form-field text-base" value={String(r[f.k] ?? '')} onChange={e => setR({ ...r, [f.k]: e.target.value })} />
                ) : f.type === 'datetime' ? (
                  <input id={`${table}-${f.k}`} type="datetime-local" className="form-field text-base" value={toLocal(r[f.k])}
                    onChange={e => setR({ ...r, [f.k]: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
                ) : (
                  <input id={`${table}-${f.k}`} type={f.type === 'number' ? 'number' : 'text'} className="form-field text-base" value={String(r[f.k] ?? '')}
                    onChange={e => setR({ ...r, [f.k]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value })} />
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={save} disabled={busy} className="btn-gold flex items-center gap-2 min-h-[44px]">{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar</button>
        <button onClick={onDone} className="btn-outline-gold min-h-[44px]">Cancelar</button>
        {r.id && <button onClick={del} className="ml-auto text-sm text-destructive flex items-center gap-1 min-h-[44px]"><Trash2 size={14} /> Excluir</button>}
      </div>
    </div>
  );
}

const AdminLegends = () => {
  const [sub, setSub] = useState<Sub>('eventos');
  const [d, setD] = useState<LegendsData | null>(null);
  const [err, setErr] = useState(false);
  const [edit, setEdit] = useState<{ table: string; row: Row } | null>(null);
  const [evSel, setEvSel] = useState<string | null>(null);

  const load = useCallback(() => { setErr(false); fetchLegends().then(setD).catch(() => setErr(true)); }, []);
  useEffect(load, [load]);
  const done = () => { setEdit(null); load(); };

  if (err) return <div role="alert" className="surface-elevated p-6"><p className="mb-4">Não foi possível carregar.</p><button onClick={load} className="btn-outline-gold">Tentar de novo</button></div>;
  if (!d) return <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-16 surface-elevated animate-pulse rounded-sm" />)}</div>;

  const atl = Object.fromEntries(d.atletas.map(a => [a.id, `${a.registro_legends ? `#${a.registro_legends} ` : ''}${a.nome}`]));
  const cat = Object.fromEntries(d.categorias.map(c => [c.id, c.nome]));
  const nomeA = (id: string | null) => (id ? atl[id] : '') ?? '';

  const F_EVENTO: Field[] = [
    { k: 'nome', l: 'Nome' }, { k: 'slug', l: 'Endereço curto (ex.: gp-2024)' }, { k: 'edicao', l: 'Número da edição', type: 'number' },
    { k: 'formato', l: 'Formato', type: 'select', opts: FORMATO }, { k: 'status', l: 'Situação', type: 'select', opts: STATUS_EVENTO },
    { k: 'data_evento', l: 'Data e hora', type: 'datetime' }, { k: 'local', l: 'Local' }, { k: 'cidade', l: 'Cidade' }, { k: 'pais', l: 'País' },
    { k: 'link_gravacao', l: 'Link da gravação completa' }, { k: 'imagem_url', l: 'Link da imagem' },
    { k: 'descricao', l: 'Descrição', type: 'textarea' },
    { k: 'gravacao_publica', l: 'Gravação pública no acervo', type: 'bool' }, { k: 'publicado', l: 'Visível no site', type: 'bool' },
  ];
  const F_LUTA: Field[] = [
    { k: 'categoria_id', l: 'Categoria', type: 'select', opts: cat }, { k: 'fase', l: 'Fase (ex.: Final, Semifinal)' },
    { k: 'atleta_a_id', l: 'Atleta 1', type: 'select', opts: atl }, { k: 'atleta_b_id', l: 'Atleta 2', type: 'select', opts: atl },
    { k: 'status', l: 'Situação', type: 'select', opts: STATUS_LUTA }, { k: 'vencedor_id', l: 'Vencedor', type: 'select', opts: atl },
    { k: 'resultado', l: 'Resultado (ex.: 8 x 3)' }, { k: 'metodo', l: 'Método (ex.: pontos, decisão)' },
    { k: 'link_gravacao', l: 'Link da gravação da luta' }, { k: 'ordem', l: 'Ordem no card', type: 'number' },
    { k: 'vale_cinturao', l: 'Valia cinturão', type: 'bool' },
  ];
  const F_ATLETA: Field[] = [
    { k: 'nome', l: 'Nome' }, { k: 'apelido', l: 'Apelido' }, { k: 'registro_legends', l: 'Registro Legends', type: 'number' },
    { k: 'dojo', l: 'Dojo ou associação' }, { k: 'estilo', l: 'Estilo' }, { k: 'graduacao', l: 'Graduação' },
    { k: 'cidade', l: 'Cidade' }, { k: 'pais', l: 'País' }, { k: 'foto_url', l: 'Link da foto' },
    { k: 'historico', l: 'Atleta histórico (sem conta)', type: 'bool' }, { k: 'publicado', l: 'Visível no site', type: 'bool' },
  ];
  const F_CAT: Field[] = [{ k: 'nome', l: 'Nome' }, { k: 'ordem', l: 'Ordem', type: 'number' }, { k: 'descricao', l: 'Descrição', type: 'textarea' }, { k: 'ativo', l: 'Ativa', type: 'bool' }];
  const F_CINT: Field[] = [
    { k: 'categoria_id', l: 'Categoria', type: 'select', opts: cat }, { k: 'atleta_id', l: 'Campeão', type: 'select', opts: atl },
    { k: 'desde', l: 'Desde (AAAA-MM-DD)' }, { k: 'vigente', l: 'Vigente', type: 'bool' }, { k: 'publicado', l: 'Publicado no site', type: 'bool' },
  ];
  const F_RANK: Field[] = [
    { k: 'categoria_id', l: 'Categoria', type: 'select', opts: cat }, { k: 'atleta_id', l: 'Atleta', type: 'select', opts: atl },
    { k: 'posicao', l: 'Posição (1 a 5)', type: 'number' }, { k: 'publicado', l: 'Publicado no site', type: 'bool' },
  ];

  const reservar = async () => {
    const { data, error } = await supabase.rpc('reservar_registros_legends');
    if (error) { toast.error('Não foi possível reservar.'); return; }
    toast.success(`${data ?? 0} números reservados.`); load();
  };

  const novo = (table: string, row: Row = {}) => setEdit({ table, row });
  const SUBS: [Sub, string][] = [['eventos', 'Eventos e lutas'], ['atletas', 'Atletas'], ['categorias', 'Categorias'], ['cinturoes', 'Cinturões e ranking']];
  const ev = d.eventos.find(e => e.id === evSel);

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2" aria-label="Seções">
        {SUBS.map(([k, l]) => (
          <button key={k} onClick={() => { setSub(k); setEdit(null); setEvSel(null); }}
            className={`px-4 min-h-[44px] text-xs uppercase tracking-widest border rounded-sm ${sub === k ? 'border-gold text-gold' : 'border-border text-muted-foreground'}`}>{l}</button>
        ))}
      </nav>

      {edit && <Editor table={edit.table} row={edit.row} onDone={done}
        fields={{ eventos: F_EVENTO, lutas: F_LUTA, atletas: F_ATLETA, categorias: F_CAT, cinturoes: F_CINT, rankings: F_RANK }[edit.table]!} />}

      {sub === 'eventos' && !ev && (
        <section className="space-y-3">
          <div className="flex justify-between items-center"><p className="text-sm text-muted-foreground">{d.eventos.length} eventos</p>
            <button onClick={() => novo('eventos', { formato: 'grand_prix', status: 'agendado', publicado: false })} className="btn-gold flex items-center gap-2 min-h-[44px]"><Plus size={16} /> Novo evento</button></div>
          {d.eventos.length === 0 && <p className="text-muted-foreground surface-elevated p-6">Nenhum evento cadastrado.</p>}
          {d.eventos.map(e => (
            <div key={e.id} className="surface-elevated rounded-sm p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="font-display text-xl uppercase">{e.nome}</p>
                <p className="text-xs text-muted-foreground">{FORMATO[e.formato]}  |  {STATUS_EVENTO[e.status]}  |  {dataBR(e.data_evento)}  |  {d.lutas.filter(l => l.evento_id === e.id).length} lutas{e.publicado ? '' : '  |  oculto'}</p>
              </div>
              <button onClick={() => setEvSel(e.id)} className="btn-outline-gold min-h-[44px]">Card</button>
              <button onClick={() => novo('eventos', e)} className="btn-outline-gold min-h-[44px]">Editar</button>
            </div>
          ))}
        </section>
      )}

      {sub === 'eventos' && ev && (
        <section className="space-y-3">
          <button onClick={() => setEvSel(null)} className="text-sm text-gold min-h-[44px]">Voltar aos eventos</button>
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h2 className="font-display text-3xl uppercase">{ev.nome}</h2>
            <button onClick={() => novo('lutas', { evento_id: ev.id, status: ev.status === 'realizado' ? 'realizada' : 'anunciada', ordem: d.lutas.filter(l => l.evento_id === ev.id).length + 1 })}
              className="btn-gold flex items-center gap-2 min-h-[44px]"><Plus size={16} /> Nova luta</button>
          </div>
          {d.atletas.length === 0 && <p className="text-sm text-muted-foreground">Cadastre atletas antes de montar o card.</p>}
          {d.lutas.filter(l => l.evento_id === ev.id).map(l => (
            <button key={l.id} onClick={() => setEdit({ table: 'lutas', row: { ...l, evento_id: ev.id } })} className="w-full text-left surface-elevated rounded-sm p-4 min-h-[44px]">
              <p className="text-xs text-muted-foreground">{l.ordem}. {cat[l.categoria_id ?? ''] ?? 'Sem categoria'}  |  {STATUS_LUTA[l.status]}{l.vale_cinturao ? '  |  cinturão' : ''}</p>
              <p className="font-medium">{nomeA(l.atleta_a_id) || 'A definir'} vs {nomeA(l.atleta_b_id) || 'A definir'}{l.vencedor_id ? `  |  vencedor: ${nomeA(l.vencedor_id)}` : ''}</p>
            </button>
          ))}
        </section>
      )}

      {sub === 'atletas' && (
        <section className="space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-3"><p className="text-sm text-muted-foreground">{d.atletas.length} atletas</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={reservar} className="btn-outline-gold flex items-center gap-2 min-h-[44px]" title="Campeões primeiro, depois pela ordem das edições"><Hash size={16} /> Reservar números</button>
              <button onClick={() => novo('atletas', { historico: true, publicado: true })} className="btn-gold flex items-center gap-2 min-h-[44px]"><Plus size={16} /> Novo atleta</button>
            </div></div>
          {d.atletas.length === 0 && <p className="text-muted-foreground surface-elevated p-6">Nenhum atleta cadastrado.</p>}
          {[...d.atletas].sort((a, b) => (a.registro_legends ?? 1e9) - (b.registro_legends ?? 1e9)).map(a => (
            <button key={a.id} onClick={() => novo('atletas', a)} className="w-full text-left surface-elevated rounded-sm p-4 flex gap-4 min-h-[44px]">
              <span className="font-display text-gold w-12">{a.registro_legends ? `#${a.registro_legends}` : 'sem nº'}</span>
              <span className="flex-1">{a.nome}<span className="block text-xs text-muted-foreground">{[a.estilo, a.dojo, a.cidade].filter(Boolean).join('  |  ')}</span></span>
            </button>
          ))}
        </section>
      )}

      {sub === 'categorias' && (
        <section className="space-y-3">
          <div className="flex justify-end"><button onClick={() => novo('categorias', { ativo: true, ordem: d.categorias.length + 1 })} className="btn-gold flex items-center gap-2 min-h-[44px]"><Plus size={16} /> Nova categoria</button></div>
          {d.categorias.length === 0 && <p className="text-muted-foreground surface-elevated p-6">Nenhuma categoria cadastrada.</p>}
          {d.categorias.map(c => <button key={c.id} onClick={() => novo('categorias', c)} className="w-full text-left surface-elevated rounded-sm p-4 min-h-[44px]">{c.ordem}. {c.nome}{c.ativo ? '' : ' (inativa)'}</button>)}
        </section>
      )}

      {sub === 'cinturoes' && (
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center"><h3 className="eyebrow">Cinturões vigentes</h3>
              <button onClick={() => novo('cinturoes', { vigente: true, publicado: false })} className="btn-gold flex items-center gap-2 min-h-[44px]"><Plus size={16} /> Cinturão</button></div>
            {d.cinturoes.map(c => <button key={c.id} onClick={() => novo('cinturoes', c)} className="w-full text-left surface-elevated rounded-sm p-4 min-h-[44px]">{cat[c.categoria_id]}: {nomeA(c.atleta_id)}{c.publicado ? '' : ' (não publicado)'}</button>)}
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center"><h3 className="eyebrow">Ranking top 5</h3>
              <button onClick={() => novo('rankings', { publicado: false })} className="btn-gold flex items-center gap-2 min-h-[44px]"><Plus size={16} /> Posição</button></div>
            {d.rankings.map(r => <button key={r.id} onClick={() => novo('rankings', r)} className="w-full text-left surface-elevated rounded-sm p-4 min-h-[44px]">{cat[r.categoria_id]}  |  {r.posicao}º {nomeA(r.atleta_id)}{r.publicado ? '' : ' (não publicado)'}</button>)}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminLegends;
