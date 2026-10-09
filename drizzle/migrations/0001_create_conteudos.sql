CREATE TABLE public.conteudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL,
  idioma text NOT NULL,
  valor text NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid,
  UNIQUE (chave, idioma)
);
GRANT SELECT ON public.conteudos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conteudos TO authenticated;
GRANT ALL ON public.conteudos TO service_role;
ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conteudos publicos para leitura" ON public.conteudos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins inserem conteudos" ON public.conteudos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins atualizam conteudos" ON public.conteudos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins apagam conteudos" ON public.conteudos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));