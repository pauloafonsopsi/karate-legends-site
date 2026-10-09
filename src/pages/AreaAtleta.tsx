import { useCallback, useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Check, Crown, Loader2, LogOut, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useConta, type Conta } from '@/hooks/useConta';
import { StripeEmbeddedCheckout } from '@/components/StripeEmbeddedCheckout';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';
import { formatPreco } from '@/lib/planos';
import { comprimirImagem } from '@/lib/imageCompress';
import type { Tables } from '@/integrations/supabase/types';

type Meta = Tables<'metas'>;
type MetaAtleta = Tables<'metas_atleta'>;
type Cfg = Tables<'config_registro'>;
type Registro = Tables<'registros'>;

const ETAPAS = [
  ['registrado', 'Registrado'], ['apto', 'Apto'], ['convocado', 'Convocado'], ['lutou', 'Lutou'],
  ['ranqueado', 'Ranqueado'], ['desafiante', 'Desafiante'], ['campeao', 'Campeão'],
] as const;

const idade = (n: string) => {
  const d = new Date(n), h = new Date();
  let a = h.getFullYear() - d.getFullYear();
  if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) a--;
  return a;
};
const dataBR = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '');

/** Cadastro básico que falta antes de ver critérios e pagamento. */
const Completar = ({ conta, estilos, onOk }: { conta: Conta; estilos: string[]; onOk: () => void }) => {
  const [f, setF] = useState({
    nome: conta.nome ?? '', whatsapp: conta.whatsapp ?? '', nascimento: conta.nascimento ?? '',
    estilo: conta.estilo ?? '', graduacao: conta.graduacao ?? '', dojo: conta.dojo ?? '', cidade: conta.cidade ?? '', pais: conta.pais ?? 'Brasil',
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from('contas').update({ ...f, nascimento: f.nascimento || null }).eq('id', conta.id);
    setBusy(false);
    if (error) { toast.error('Não foi possível salvar.'); return; }
    onOk();
  };
  const campo = (k: keyof typeof f, label: string, type = 'text', req = true) => (
    <div><label className="form-label" htmlFor={k}>{label}</label>
      <input id={k} type={type} required={req} className="form-field text-base" value={f[k]} onChange={set(k)} /></div>
  );
  return (
    <form onSubmit={salvar} className="surface-elevated rounded-sm p-6 md:p-8 grid md:grid-cols-2 gap-4">
      <h2 className="md:col-span-2 font-display text-3xl uppercase">Complete seu cadastro</h2>
      {campo('nome', 'Nome completo')}
      {campo('whatsapp', 'WhatsApp', 'tel')}
      {campo('nascimento', 'Data de nascimento', 'date')}
      <div><label className="form-label" htmlFor="estilo">Estilo</label>
        <select id="estilo" required className="form-field text-base" value={f.estilo} onChange={set('estilo')}>
          <option value="">Escolha</option>
          {[...estilos, 'Outro'].map(s => <option key={s}>{s}</option>)}
        </select></div>
      {campo('graduacao', 'Graduação (faixa)')}
      {campo('dojo', 'Dojo ou associação', 'text', false)}
      {campo('cidade', 'Cidade', 'text', false)}
      {campo('pais', 'País', 'text', false)}
      <button disabled={busy} className="md:col-span-2 btn-gold min-h-[44px] flex items-center justify-center gap-2">{busy && <Loader2 size={16} className="animate-spin" />} Salvar e continuar</button>
    </form>
  );
};

const AreaAtleta = () => {
  const { session, conta, loading, erro, recarregar } = useConta();
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [minhas, setMinhas] = useState<MetaAtleta[]>([]);
  const [ativo, setAtivo] = useState<boolean | null>(null);
  const [caminho, setCaminho] = useState<string>('sem_registro');
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [numero, setNumero] = useState<number | null>(null);
  const [lutas, setLutas] = useState<Tables<'lutas'>[]>([]);
  const [precos, setPrecos] = useState<Record<string, number | null>>({});
  const [checkout, setCheckout] = useState<string | null>(null);
  const [editar, setEditar] = useState(false);

  const carregar = useCallback(async () => {
    if (!conta) return;
    const [c, m, ma, at, cam, rg, pl] = await Promise.all([
      supabase.from('config_registro').select('*').maybeSingle(),
      supabase.from('metas').select('*').eq('ativo', true).order('ordem'),
      supabase.from('metas_atleta').select('*').eq('conta_id', conta.id),
      supabase.rpc('registro_ativo', { _conta_id: conta.id }),
      supabase.rpc('caminho_da_lenda', { _conta_id: conta.id }),
      supabase.from('registros').select('*').eq('conta_id', conta.id).order('vencimento', { ascending: false }),
      supabase.from('planos').select('chave,preco_centavos').in('chave', ['registro_anual', 'registro_mensal']),
    ]);
    setCfg(c.data); setMetas(m.data ?? []); setMinhas(ma.data ?? []); setAtivo(!!at.data);
    setCaminho((cam.data as string) ?? 'sem_registro'); setRegistros(rg.data ?? []);
    setPrecos(Object.fromEntries((pl.data ?? []).map(p => [p.chave, p.preco_centavos])));
    if (conta.atleta_id) {
      const [a, l] = await Promise.all([
        supabase.from('atletas').select('registro_legends').eq('id', conta.atleta_id).maybeSingle(),
        supabase.from('lutas').select('*').or(`atleta_a_id.eq.${conta.atleta_id},atleta_b_id.eq.${conta.atleta_id}`),
      ]);
      setNumero(a.data?.registro_legends ?? null); setLutas(l.data ?? []);
    }
  }, [conta]);
  useEffect(() => { carregar(); }, [carregar]);

  if (loading) return <div className="pt-32 max-w-4xl mx-auto px-6"><div className="h-64 surface-elevated animate-pulse rounded-sm" aria-label="Carregando" /></div>;
  if (!session) return <Navigate to="/entrar?volta=/atleta" replace />;
  if (erro || !conta) return (
    <div className="pt-32 max-w-xl mx-auto px-6"><div role="alert" className="surface-elevated p-6">
      <p className="mb-4">{erro?.includes('confirm') ? 'Confirme seu e-mail pelo link que enviamos e entre de novo.' : 'Não foi possível abrir sua conta.'}</p>
      <button onClick={recarregar} className="btn-outline-gold min-h-[44px]">Tentar de novo</button></div></div>
  );

  const incompleto = !conta.nome || !conta.nascimento || !conta.estilo || !conta.whatsapp;
  const estilos = cfg?.estilos ?? [];
  const barreiras = cfg && !incompleto ? [
    { ok: idade(conta.nascimento!) >= cfg.idade_minima, t: `Idade mínima de ${cfg.idade_minima} anos` },
    { ok: !estilos.length || estilos.includes(conta.estilo!), t: `Estilo: ${estilos.join(' ou ')}` },
  ] : [];
  const passa = barreiras.every(b => b.ok);
  const janelaFundadora = cfg ? (!cfg.fundador_ate || new Date(cfg.fundador_ate) > new Date()) : true;
  const statusMeta = (id: string) => minhas.find(x => x.meta_id === id)?.status ?? 'pendente';
  const vigente = registros.find(r => r.status === 'ativo');
  const sair = async () => { await supabase.auth.signOut(); };

  const Metas = () => (
    <ul className="space-y-3">
      {metas.map(m => <MetaItem key={m.id} meta={m} contaId={conta.id} userId={session.user.id} atual={minhas.find(x => x.meta_id === m.id)} onSalvo={carregar} status={statusMeta(m.id)} />)}
    </ul>
  );

  return (
    <div className="pt-32 pb-20">
      <PaymentTestModeBanner />
      <div className="max-w-4xl mx-auto px-6 space-y-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2"><Link to="/atletas" className="min-h-[44px]">Atletas</Link> / Área do atleta</p>
            <h1 className="text-5xl md:text-7xl">{conta.nome || 'Sua conta'}</h1>
          </div>
          <div className="flex gap-2">
            {!incompleto && <button onClick={() => setEditar(v => !v)} className="btn-outline-gold text-sm min-h-[44px]">{editar ? 'Fechar' : 'Editar dados'}</button>}
            <button onClick={sair} className="btn-outline-gold text-sm min-h-[44px] flex items-center gap-2"><LogOut size={14} /> Sair</button>
          </div>
        </header>

        {(incompleto || editar) && <Completar conta={conta} estilos={estilos} onOk={() => { setEditar(false); recarregar(); }} />}

        {!incompleto && ativo === false && (
          <section className="space-y-6" aria-labelledby="crit">
            <h2 id="crit" className="font-display text-4xl uppercase">Critérios do Registro Legends</h2>
            <div className="surface-elevated rounded-sm p-6">
              <p className="eyebrow mb-3">Para se registrar</p>
              <ul className="space-y-2">{barreiras.map(b => (
                <li key={b.t} className="flex gap-3 text-sm"><span className={b.ok ? 'text-gold' : 'text-destructive'}>{b.ok ? 'Atende' : 'Não atende'}</span>{b.t}</li>
              ))}</ul>
            </div>
            <div className="surface-elevated rounded-sm p-6">
              <p className="eyebrow mb-3">Para aplicar a um evento (pode completar depois)</p>
              <ul className="space-y-2">{metas.map(m => (
                <li key={m.id} className="flex gap-3 text-sm"><span className="text-muted-foreground w-24 shrink-0">{statusMeta(m.id) === 'verificada' ? 'Verificada' : 'Pendente'}</span>{m.nome}</li>
              ))}</ul>
            </div>
            {!passa ? (
              <p role="alert" className="surface-elevated p-6">Neste momento o Registro Legends é exclusivo para quem atende os critérios acima.</p>
            ) : checkout ? (
              <div className="surface-elevated rounded-sm p-4"><StripeEmbeddedCheckout priceId={checkout} customerEmail={conta.email}
                returnUrl={`${window.location.origin}/atleta?pagamento=ok`} /></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <PlanoCard titulo={janelaFundadora ? 'Classe Fundadora' : 'Registro anual'} preco={formatPreco(conta.fundador && conta.fundador_preco_centavos ? conta.fundador_preco_centavos : precos.registro_anual ?? null)} periodo="por ano, pago de uma vez"
                  nota={janelaFundadora ? `Número, selo permanente e renovação pelo mesmo preço${cfg?.fundador_ate ? `. Até ${dataBR(cfg.fundador_ate)}` : ''}.` : undefined} onClick={() => setCheckout('registro_anual')} destaque />
                {!janelaFundadora && <PlanoCard titulo="Registro mensal" preco={formatPreco(precos.registro_mensal ?? null)} periodo="por mês, no cartão" onClick={() => setCheckout('registro_mensal')} />}
              </div>
            )}
          </section>
        )}

        {!incompleto && ativo && (
          <>
            <section className="grid md:grid-cols-3 gap-4">
              <div className="surface-elevated rounded-sm p-6">
                <p className="eyebrow mb-2">Registro Legends</p>
                <p className="font-display text-6xl text-gold">{numero ? `#${String(numero).padStart(3, '0')}` : 'Em reserva'}</p>
                {conta.fundador && <p className="mt-2 flex items-center gap-2 text-sm"><Crown size={14} className="text-gold" /> Classe Fundadora</p>}
              </div>
              <div className="surface-elevated rounded-sm p-6 md:col-span-2">
                <p className="eyebrow mb-2">Validade</p>
                <p>{vigente?.vencimento ? `Ativo até ${dataBR(vigente.vencimento)}` : 'Ativo enquanto for campeão'}</p>
                {vigente?.tipo === 'anual' && conta.fundador && <button onClick={() => setCheckout('registro_anual')} className="btn-outline-gold text-sm mt-4 min-h-[44px]">Renovar pelo preço de fundador</button>}
              </div>
            </section>
            {checkout && <div className="surface-elevated rounded-sm p-4"><StripeEmbeddedCheckout priceId={checkout} customerEmail={conta.email} returnUrl={`${window.location.origin}/atleta?pagamento=ok`} /></div>}

            <section aria-labelledby="cam">
              <h2 id="cam" className="font-display text-4xl uppercase mb-4">Caminho da Lenda</h2>
              <ol className="grid grid-cols-2 md:grid-cols-7 gap-2">
                {ETAPAS.map(([k, l], i) => {
                  const idx = ETAPAS.findIndex(e => e[0] === caminho);
                  const feito = i <= idx;
                  return <li key={k} className={`surface-elevated rounded-sm p-3 text-center text-sm ${feito ? 'border-gold text-gold' : 'text-muted-foreground'}`}>{feito && <Check size={14} className="inline mr-1" />}{l}</li>;
                })}
              </ol>
            </section>

            <section aria-labelledby="mt">
              <h2 id="mt" className="font-display text-4xl uppercase mb-2">Metas</h2>
              <p className="text-sm text-muted-foreground mb-4">Com todas verificadas você pode aplicar aos eventos.</p>
              <Metas />
            </section>

            <section aria-labelledby="lt">
              <h2 id="lt" className="font-display text-4xl uppercase mb-4">Suas lutas</h2>
              {!lutas.length ? <p className="text-muted-foreground">Nenhuma luta registrada ainda.</p> : (
                <ul className="space-y-2">{lutas.map(l => (
                  <li key={l.id} className="surface-elevated p-4 text-sm flex justify-between"><span>{l.fase || 'Luta'}</span>
                    <span className="text-muted-foreground">{l.status === 'realizada' ? (l.vencedor_id === conta.atleta_id ? 'Vitória' : 'Derrota') : 'Próxima'}</span></li>
                ))}</ul>
              )}
            </section>
          </>
        )}

        {!incompleto && ativo === false && registros.length > 0 && (
          <p className="text-sm text-muted-foreground">Seu registro venceu em {dataBR(registros[0].vencimento)}. Seu histórico continua guardado.</p>
        )}
      </div>
    </div>
  );
};

const PlanoCard = ({ titulo, preco, periodo, nota, onClick, destaque }: { titulo: string; preco: string; periodo: string; nota?: string; onClick: () => void; destaque?: boolean }) => (
  <div className={`surface-elevated rounded-sm p-6 ${destaque ? 'border-gold' : ''}`}>
    <p className="eyebrow mb-2">{titulo}</p>
    <p className="font-display text-5xl">{preco}</p>
    <p className="text-sm text-muted-foreground mb-3">{periodo}</p>
    {nota && <p className="text-sm mb-4">{nota}</p>}
    <button onClick={onClick} className="btn-gold w-full min-h-[44px]">Realizar pagamento</button>
  </div>
);

const MetaItem = ({ meta, contaId, userId, atual, status, onSalvo }: { meta: Meta; contaId: string; userId: string; atual?: MetaAtleta; status: string; onSalvo: () => void }) => {
  const [link, setLink] = useState(atual?.link ?? '');
  const [busy, setBusy] = useState(false);
  const enviar = async (file?: File) => {
    setBusy(true);
    let arquivo_path = atual?.arquivo_path ?? null;
    if (file) {
      if (file.size > 15 * 1024 * 1024) { toast.error('Arquivo acima de 15 MB.'); setBusy(false); return; }
      const f = file.type.startsWith('image/') ? await comprimirImagem(file) : file;
      const ext = f.name.split('.').pop() || 'webp';
      arquivo_path = `contas/${userId}/${meta.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('atletas-docs').upload(arquivo_path, f);
      if (error) { toast.error('Falha no envio do arquivo.'); setBusy(false); return; }
    }
    const { error } = await supabase.from('metas_atleta').upsert({ conta_id: contaId, meta_id: meta.id, link: link || null, arquivo_path, status: 'enviada' }, { onConflict: 'conta_id,meta_id' });
    setBusy(false);
    if (error) { toast.error('Não foi possível enviar.'); return; }
    toast.success('Enviado para verificação.'); onSalvo();
  };
  const rotulo = { pendente: 'Pendente', enviada: 'Enviada', verificada: 'Verificada' }[status] ?? status;
  return (
    <li className="surface-elevated rounded-sm p-4 space-y-3">
      <div className="flex justify-between gap-3"><div><p className="font-medium">{meta.nome}</p>{meta.descricao && <p className="text-sm text-muted-foreground">{meta.descricao}</p>}</div>
        <span className={`text-xs uppercase tracking-widest ${status === 'verificada' ? 'text-gold' : 'text-muted-foreground'}`}>{rotulo}</span></div>
      {status !== 'verificada' && (
        <div className="flex flex-col md:flex-row gap-2">
          {meta.exige_arquivo ? (
            <label className="btn-outline-gold text-sm min-h-[44px] flex items-center gap-2 cursor-pointer">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Enviar arquivo
              <input type="file" accept="image/*,application/pdf" className="sr-only" disabled={busy} onChange={e => e.target.files?.[0] && enviar(e.target.files[0])} />
            </label>
          ) : (
            <>
              <input aria-label={`Link para ${meta.nome}`} placeholder="Cole o link aqui" className="form-field text-base flex-1" value={link} onChange={e => setLink(e.target.value)} />
              <button disabled={busy || !link} onClick={() => enviar()} className="btn-gold text-sm min-h-[44px]">Enviar</button>
            </>
          )}
        </div>
      )}
    </li>
  );
};

export default AreaAtleta;
