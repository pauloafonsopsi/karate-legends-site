const K = 'kl_origem';
const KI = 'kl_indicacao';

/** Grava a origem da primeira visita (?origem=instagram, ?ref=nome). A primeira vale. */
export function capturarOrigem() {
  try {
    const p = new URLSearchParams(window.location.search);
    const o = p.get('origem') || p.get('utm_source');
    const r = p.get('ref') || p.get('indicacao');
    if (o && !localStorage.getItem(K)) localStorage.setItem(K, o.slice(0, 80));
    if (r && !localStorage.getItem(KI)) localStorage.setItem(KI, r.slice(0, 80));
  } catch { /* sem armazenamento */ }
}

export const lerOrigem = () => {
  try { return { origem: localStorage.getItem(K) ?? 'direto', indicacao: localStorage.getItem(KI) }; }
  catch { return { origem: 'direto', indicacao: null }; }
};
