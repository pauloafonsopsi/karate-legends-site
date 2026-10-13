import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { preencher } from '@/lib/exportar';
import type { Tables } from '@/integrations/supabase/types';

type Empresa = Partial<Tables<'dados_empresa'>>;

/** Corpo simples: linhas "## " viram títulos, blocos separados por linha em branco viram parágrafos. */
export const Corpo = ({ texto, empresa }: { texto: string; empresa: Empresa }) => {
  const vars = Object.fromEntries(['razao_social', 'cnpj', 'endereco', 'email_contato', 'foro']
    .map(k => [k, (empresa[k as keyof Empresa] as string | null) || '[a preencher]']));
  return (
    <div className="space-y-5 text-foreground/80 leading-relaxed">
      {preencher(texto, vars).split(/\n\s*\n/).flatMap((b, i) => {
        const [primeira, ...resto] = b.trim().split('\n');
        if (!primeira.startsWith('## ')) return [<p key={i} className="whitespace-pre-line">{b.trim()}</p>];
        return [<h2 key={`${i}h`} className="text-2xl text-gold pt-4">{primeira.slice(3).trim()}</h2>,
          ...(resto.length ? [<p key={i} className="whitespace-pre-line">{resto.join('\n').trim()}</p>] : [])];
      })}
    </div>
  );
};

const DocumentoLegal = ({ slug }: { slug: string }) => {
  const [doc, setDoc] = useState<Tables<'documentos_legais'> | null>(null);
  const [empresa, setEmpresa] = useState<Empresa>({});
  const [erro, setErro] = useState(false);
  const [semTraducao, setSemTraducao] = useState(false);
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'pt').slice(0, 2);
  useEffect(() => {
    setDoc(null); setErro(false); setSemTraducao(false);
    Promise.all([
      supabase.from('documentos_legais').select('*').eq('slug', slug).maybeSingle(),
      supabase.from('dados_empresa').select('*').maybeSingle(),
      ['en', 'es'].includes(lang) ? supabase.from('documentos_legais_traducoes').select('*').eq('slug', slug).eq('idioma', lang).maybeSingle() : Promise.resolve({ data: null }),
    ]).then(([d, e, t]) => {
      if (d.error || !d.data) { setErro(true); return; }
      const tr = t.data as Tables<'documentos_legais_traducoes'> | null;
      setDoc(tr ? { ...d.data, titulo: tr.titulo, corpo: tr.corpo, versao: tr.versao, atualizado_em: tr.atualizado_em } : d.data);
      setSemTraducao(['en', 'es'].includes(lang) && !tr);
      setEmpresa(e.data ?? {});
      document.title = `${tr?.titulo ?? d.data.titulo} | Karate Legends`;
    });
  }, [slug, lang]);
  const AVISO: Record<string, string> = { en: 'This document is only available in Portuguese for now.', es: 'Este documento por ahora solo está disponible en portugués.' };
  const VERSAO: Record<string, [string, string, string]> = { pt: ['Versão', 'atualizada em', 'pt-BR'], en: ['Version', 'updated on', 'en-US'], es: ['Versión', 'actualizada el', 'es-ES'] };
  const [vLabel, vData, vLoc] = VERSAO[lang] ?? VERSAO.pt;

  return (
    <div className="pt-32 pb-20">
      <article className="max-w-3xl mx-auto px-6">
        {erro ? <p role="alert" className="surface-elevated p-6">Não foi possível carregar este documento. Tente novamente em instantes.</p>
          : !doc ? <div className="space-y-4" aria-label="Carregando"><div className="h-16 w-2/3 surface-elevated animate-pulse" /><div className="h-64 surface-elevated animate-pulse" /></div>
          : <>
            <header className="mb-12">
              <h1 className="text-5xl md:text-7xl mb-6">{doc.titulo}</h1>
              <p className="text-muted-foreground text-sm uppercase tracking-widest">{vLabel} {doc.versao}, {vData} {new Date(doc.atualizado_em).toLocaleDateString(vLoc)}</p>
              {semTraducao && <p role="note" className="surface-elevated p-4 mt-6 text-sm">{AVISO[lang]}</p>}
            </header>
            <Corpo texto={doc.corpo} empresa={empresa} />
          </>}
      </article>
    </div>
  );
};

export default DocumentoLegal;
