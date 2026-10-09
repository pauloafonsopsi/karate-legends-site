import { supabase } from '@/integrations/supabase/client';
import type { Lang } from './conteudos';

export type Plano = {
  id: string; chave: string; icone: string; ordem: number; ativo: boolean; destaque: boolean;
  titulo: Partial<Record<Lang, string>>; periodo: Partial<Record<Lang, string>>;
  beneficios: Partial<Record<Lang, string[]>>; preco_centavos: number | null; moeda: string;
};

export const formatPreco = (c: number | null, moeda = 'brl') =>
  c == null ? '' : (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: moeda.toUpperCase() });

/** Picks the text for the language, falling back to Portuguese. */
export const txt = <T,>(m: Partial<Record<Lang, T>>, l: string): T | undefined =>
  m[(l.slice(0, 2) as Lang)] ?? m.pt;

export async function fetchPlanos(somenteAtivos = true): Promise<Plano[]> {
  let q = supabase.from('planos').select('*').order('ordem');
  if (somenteAtivos) q = q.eq('ativo', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Plano[];
}
