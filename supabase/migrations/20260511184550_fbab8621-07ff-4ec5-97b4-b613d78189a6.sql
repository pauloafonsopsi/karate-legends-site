
-- Add columns to inscricoes_atletas
ALTER TABLE public.inscricoes_atletas
  ADD COLUMN IF NOT EXISTS dono_dojo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sensei_nome text,
  ADD COLUMN IF NOT EXISTS sensei_telefone text,
  ADD COLUMN IF NOT EXISTS aceite_termos boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceite_privacidade boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS pagamento_confirmado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS respondido_em timestamptz;

-- Roles enum + user_roles table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Admins podem ver papéis" ON public.user_roles;
CREATE POLICY "Admins podem ver papéis"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuário vê próprio papel" ON public.user_roles;
CREATE POLICY "Usuário vê próprio papel"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin policies on inscricoes_atletas
DROP POLICY IF EXISTS "Admins podem ver inscrições" ON public.inscricoes_atletas;
CREATE POLICY "Admins podem ver inscrições"
ON public.inscricoes_atletas FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem atualizar inscrições" ON public.inscricoes_atletas;
CREATE POLICY "Admins podem atualizar inscrições"
ON public.inscricoes_atletas FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem deletar inscrições" ON public.inscricoes_atletas;
CREATE POLICY "Admins podem deletar inscrições"
ON public.inscricoes_atletas FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies on lista_espera_ppv
DROP POLICY IF EXISTS "Admins podem ver lista de espera" ON public.lista_espera_ppv;
CREATE POLICY "Admins podem ver lista de espera"
ON public.lista_espera_ppv FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem deletar lista de espera" ON public.lista_espera_ppv;
CREATE POLICY "Admins podem deletar lista de espera"
ON public.lista_espera_ppv FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
