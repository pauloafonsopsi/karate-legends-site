import { useEffect, useState } from 'react';
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
      {preencher(texto, vars).split(/\n\s*\n/).map((b, i) => b.startsWith('## ')
        ? <h2 key={i} className="text-2xl text-gold pt-4">{b.slice(3).trim()}</h2>
        : <p key={i} className="whitespace-pre-line">{b.trim()}</p>)}
    </div>
  );
};

const DocumentoLegal = ({ slug }: { slug: string }) => {
  const [doc, setDoc] = useState<Tables<'documentos_legais'> | null>(null);
  const [empresa, setEmpresa] = useState<Empresa>({});
  const [erro, setErro] = useState(false);
  useEffect(() => {
    setDoc(null); setErro(false);
    Promise.all([
      supabase.from('documentos_legais').select('*').eq('slug', slug).maybeSingle(),
      supabase.from('dados_empresa').select('*').maybeSingle(),
    ]).then(([d, e]) => {
      if (d.error || !d.data) { setErro(true); return; }
      setDoc(d.data); setEmpresa(e.data ?? {});
      document.title = `${d.data.titulo} | Karate Legends`;
    });
  }, [slug]);

  return (
    <div className="pt-32 pb-20">
      <article className="max-w-3xl mx-auto px-6">
        {erro ? <p role="alert" className="surface-elevated p-6">Não foi possível carregar este documento. Tente novamente em instantes.</p>
          : !doc ? <div className="space-y-4" aria-label="Carregando"><div className="h-16 w-2/3 surface-elevated animate-pulse" /><div className="h-64 surface-elevated animate-pulse" /></div>
          : <>
            <header className="mb-12">
              <h1 className="text-5xl md:text-7xl mb-6">{doc.titulo}</h1>
              <p className="text-muted-foreground text-sm uppercase tracking-widest">Versão {doc.versao}, atualizada em {new Date(doc.atualizado_em).toLocaleDateString('pt-BR')}</p>
            </header>
            <Corpo texto={doc.corpo} empresa={empresa} />
          </>}
      </article>
    </div>
  );
};

export default DocumentoLegal;
