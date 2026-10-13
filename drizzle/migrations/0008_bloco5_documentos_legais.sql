CREATE TABLE public.documentos_legais (
  slug text PRIMARY KEY,
  titulo text NOT NULL,
  corpo text NOT NULL DEFAULT '',
  versao integer NOT NULL DEFAULT 1,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid
);
GRANT SELECT ON public.documentos_legais TO anon;
GRANT SELECT, INSERT, UPDATE ON public.documentos_legais TO authenticated;
GRANT ALL ON public.documentos_legais TO service_role;
ALTER TABLE public.documentos_legais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura publica documentos" ON public.documentos_legais FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin escreve documentos" ON public.documentos_legais FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin altera documentos" ON public.documentos_legais FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.versionar_documento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.corpo IS DISTINCT FROM OLD.corpo OR NEW.titulo IS DISTINCT FROM OLD.titulo THEN
    NEW.versao := OLD.versao + 1; NEW.atualizado_em := now(); NEW.atualizado_por := auth.uid();
  ELSE NEW.versao := OLD.versao; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER documentos_legais_versao BEFORE UPDATE ON public.documentos_legais FOR EACH ROW EXECUTE FUNCTION public.versionar_documento();

CREATE TABLE public.dados_empresa (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  razao_social text, cnpj text, endereco text, email_contato text, foro text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dados_empresa TO anon;
GRANT SELECT, INSERT, UPDATE ON public.dados_empresa TO authenticated;
GRANT ALL ON public.dados_empresa TO service_role;
ALTER TABLE public.dados_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura publica empresa" ON public.dados_empresa FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin escreve empresa" ON public.dados_empresa FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin altera empresa" ON public.dados_empresa FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));