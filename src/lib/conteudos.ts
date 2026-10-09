import i18n from './i18n';
import { supabase } from '@/integrations/supabase/client';

export const LANGS = ['pt', 'en', 'es'] as const;
export type Lang = typeof LANGS[number];

export function flatten(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') out[key] = v;
      else Object.assign(out, flatten(v, key));
    }
  }
  return out;
}

function nest(flat: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split('.');
    let cur = out as Record<string, unknown>;
    parts.slice(0, -1).forEach(p => { cur = (cur[p] ??= {}) as Record<string, unknown>; });
    cur[parts[parts.length - 1]] = v;
  }
  return out;
}

/** Applies panel-edited texts over the bundled defaults; on failure the defaults stay. */
export async function reloadConteudos() {
  try {
    const { data, error } = await supabase.from('conteudos').select('chave, idioma, valor');
    if (error || !data) return;
    for (const l of LANGS) {
      const flat: Record<string, string> = {};
      data.filter(r => r.idioma === l).forEach(r => { flat[r.chave] = r.valor; });
      if (Object.keys(flat).length) i18n.addResourceBundle(l, 'translation', nest(flat), true, true);
    }
    i18n.emit('languageChanged', i18n.language);
    await i18n.changeLanguage(i18n.language);
  } catch { /* defaults remain */ }
}
