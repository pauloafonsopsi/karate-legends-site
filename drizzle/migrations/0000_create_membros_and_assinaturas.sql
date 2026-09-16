CREATE TABLE public.membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  nome text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  cidade text,
  pais text,
  plano text NOT NULL DEFAULT 'membro_mensal',
  aceite_termos boolean NOT NULL DEFAULT false,
  aceite_privacidade boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pendente',
  observacoes text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.membros TO authenticated;
GRANT INSERT ON public.membros TO anon;
GRANT ALL ON public.membros TO service_role;

ALTER TABLE public.membros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode se cadastrar como membro"
  ON public.membros FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins podem ver membros"
  ON public.membros FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem atualizar membros"
  ON public.membros FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem deletar membros"
  ON public.membros FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  price_id text,
  product_id text,
  status text NOT NULL DEFAULT 'active',
  tipo text NOT NULL DEFAULT 'assinatura',
  valor_centavos integer,
  moeda text,
  periodo_inicio timestamptz,
  periodo_fim timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assinaturas_email ON public.assinaturas(email);

GRANT SELECT, UPDATE, DELETE ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver assinaturas"
  ON public.assinaturas FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem atualizar assinaturas"
  ON public.assinaturas FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem deletar assinaturas"
  ON public.assinaturas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
