import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Evento = Tables<'eventos'>;
export type Categoria = Tables<'categorias'>;
export type Atleta = Tables<'atletas'>;
export type Luta = Tables<'lutas'>;
export type Cinturao = Tables<'cinturoes'>;
export type Ranking = Tables<'rankings'>;

export const FORMATO: Record<string, string> = { grand_prix: 'Grand Prix', lutas_casadas: 'Lutas casadas' };
export const STATUS_EVENTO: Record<string, string> = { agendado: 'Agendado', realizado: 'Realizado', cancelado: 'Cancelado' };
export const STATUS_LUTA: Record<string, string> = { anunciada: 'Anunciada', realizada: 'Realizada', cancelada: 'Cancelada' };

export const dataBR = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Data a definir';

/** Everything the public pages need, in one round trip per table. RLS returns only published rows. */
export async function fetchLegends() {
  const [ev, cat, at, lu, ci, ra] = await Promise.all([
    supabase.from('eventos').select('*').order('data_evento', { ascending: true, nullsFirst: false }),
    supabase.from('categorias').select('*').order('ordem'),
    supabase.from('atletas').select('*').order('nome'),
    supabase.from('lutas').select('*').order('ordem'),
    supabase.from('cinturoes').select('*').eq('vigente', true),
    supabase.from('rankings').select('*').order('posicao'),
  ]);
  const err = ev.error || cat.error || at.error || lu.error || ci.error || ra.error;
  if (err) throw err;
  return {
    eventos: ev.data ?? [], categorias: cat.data ?? [], atletas: at.data ?? [],
    lutas: lu.data ?? [], cinturoes: ci.data ?? [], rankings: ra.data ?? [],
  };
}
export type LegendsData = Awaited<ReturnType<typeof fetchLegends>>;

/** Next scheduled event (future date first, otherwise the first scheduled without date). */
export const proximoEvento = (eventos: Evento[]) => {
  const ag = eventos.filter(e => e.status === 'agendado');
  const now = Date.now();
  return ag.find(e => e.data_evento && new Date(e.data_evento).getTime() > now) ?? ag.find(e => !e.data_evento) ?? null;
};

export const realizados = (eventos: Evento[]) =>
  eventos.filter(e => e.status === 'realizado').sort((a, b) => (b.data_evento ?? '').localeCompare(a.data_evento ?? ''));

/** Home numbers derived from registered data. */
export const numerosHome = (d: LegendsData) => {
  const feitos = d.eventos.filter(e => e.status === 'realizado');
  const ids = new Set(feitos.map(e => e.id));
  const lutas = d.lutas.filter(l => ids.has(l.evento_id) && l.status === 'realizada');
  const paises = new Set(d.atletas.map(a => a.pais?.trim().toLowerCase()).filter(Boolean));
  return { edicoes: feitos.length, lutas: lutas.length, paises: paises.size, cinturoes: d.cinturoes.length };
};
