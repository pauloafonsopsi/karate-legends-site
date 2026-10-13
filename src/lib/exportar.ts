import { toast } from 'sonner';

export type Coluna = { chave: string; titulo: string; tipo?: 'brl' | 'data' | 'texto' };

const valor = (v: unknown, tipo?: Coluna['tipo']) => {
  if (v == null) return '';
  if (tipo === 'brl') return Number(v) / 100;
  if (tipo === 'data') return new Date(String(v));
  return String(v);
};

/** CSV com BOM UTF-8 e ponto e vírgula (abre certo no Excel brasileiro). */
export function exportarCSV(linhas: Record<string, unknown>[], cols: Coluna[], nome: string) {
  if (!linhas.length) { toast.info('Nada para exportar'); return; }
  const esc = (s: string) => (/[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const fmt = (v: unknown, t?: Coluna['tipo']) => {
    const x = valor(v, t);
    if (x instanceof Date) return x.toLocaleDateString('pt-BR');
    if (typeof x === 'number') return x.toFixed(2).replace('.', ',');
    return x;
  };
  const txt = '\uFEFF' + [cols.map(c => esc(c.titulo)).join(';'), ...linhas.map(l => cols.map(c => esc(fmt(l[c.chave], c.tipo))).join(';'))].join('\r\n');
  baixar(new Blob([txt], { type: 'text/csv;charset=utf-8' }), `${nome}.csv`);
}

/** Excel com cabeçalho em negrito, colunas ajustadas e valores em R$. */
export async function exportarXLSX(linhas: Record<string, unknown>[], cols: Coluna[], nome: string) {
  if (!linhas.length) { toast.info('Nada para exportar'); return; }
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Lista');
  ws.columns = cols.map(c => ({
    header: c.titulo, key: c.chave,
    width: Math.min(50, Math.max(c.titulo.length, ...linhas.map(l => String(l[c.chave] ?? '').length)) + 2),
    style: c.tipo === 'brl' ? { numFmt: '"R$" #,##0.00' } : c.tipo === 'data' ? { numFmt: 'dd/mm/yyyy' } : {},
  }));
  linhas.forEach(l => ws.addRow(Object.fromEntries(cols.map(c => [c.chave, valor(l[c.chave], c.tipo)]))));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  const buf = await wb.xlsx.writeBuffer();
  baixar(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nome}.xlsx`);
}

function baixar(b: Blob, nome: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Troca {variavel} pelo valor; variável sem valor vira vazio. */
export const preencher = (t: string, v: Record<string, string | number | null | undefined>) =>
  t.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : String(v[k])));
