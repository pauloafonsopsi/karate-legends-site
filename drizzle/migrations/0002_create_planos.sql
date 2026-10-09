CREATE TABLE public.planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  icone text NOT NULL DEFAULT 'crown',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  destaque boolean NOT NULL DEFAULT false,
  titulo jsonb NOT NULL DEFAULT '{}'::jsonb,
  periodo jsonb NOT NULL DEFAULT '{}'::jsonb,
  beneficios jsonb NOT NULL DEFAULT '{}'::jsonb,
  preco_centavos integer,
  moeda text NOT NULL DEFAULT 'brl',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.planos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos TO authenticated;
GRANT ALL ON public.planos TO service_role;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Planos publicos para leitura" ON public.planos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins inserem planos" ON public.planos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins atualizam planos" ON public.planos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins apagam planos" ON public.planos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));