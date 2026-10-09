CREATE TABLE public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  edicao integer,
  formato text NOT NULL DEFAULT 'grand_prix' CHECK (formato IN ('grand_prix','lutas_casadas')),
  data_evento timestamptz,
  local text,
  cidade text,
  pais text,
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','realizado','cancelado')),
  descricao text,
  imagem_url text,
  link_gravacao text,
  gravacao_publica boolean NOT NULL DEFAULT false,
  publicado boolean NOT NULL DEFAULT false,
  ppv_plano_chave text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.atletas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_legends integer UNIQUE,
  nome text NOT NULL,
  apelido text,
  dojo text,
  estilo text,
  graduacao text,
  cidade text,
  pais text,
  foto_url text,
  historico boolean NOT NULL DEFAULT true,
  publicado boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.lutas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  atleta_a_id uuid REFERENCES public.atletas(id) ON DELETE RESTRICT,
  atleta_b_id uuid REFERENCES public.atletas(id) ON DELETE RESTRICT,
  vencedor_id uuid REFERENCES public.atletas(id) ON DELETE RESTRICT,
  resultado text,
  metodo text,
  fase text,
  status text NOT NULL DEFAULT 'anunciada' CHECK (status IN ('anunciada','realizada','cancelada')),
  vale_cinturao boolean NOT NULL DEFAULT false,
  link_gravacao text,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lutas_evento_idx ON public.lutas(evento_id);
CREATE TABLE public.cinturoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  atleta_id uuid NOT NULL REFERENCES public.atletas(id) ON DELETE RESTRICT,
  luta_id uuid REFERENCES public.lutas(id) ON DELETE SET NULL,
  desde date,
  vigente boolean NOT NULL DEFAULT true,
  publicado boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cinturoes_um_vigente ON public.cinturoes(categoria_id) WHERE vigente;
CREATE TABLE public.rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  atleta_id uuid NOT NULL REFERENCES public.atletas(id) ON DELETE CASCADE,
  posicao integer NOT NULL CHECK (posicao BETWEEN 1 AND 5),
  publicado boolean NOT NULL DEFAULT false,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (categoria_id, posicao),
  UNIQUE (categoria_id, atleta_id)
);
CREATE TABLE public.status_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela text NOT NULL,
  registro_id uuid NOT NULL,
  status_anterior text,
  status_novo text,
  alterado_por uuid,
  alterado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX status_historico_reg_idx ON public.status_historico(tabela, registro_id);

GRANT SELECT ON public.eventos, public.categorias, public.atletas, public.lutas, public.cinturoes, public.rankings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos, public.categorias, public.atletas, public.lutas, public.cinturoes, public.rankings TO authenticated;
GRANT SELECT ON public.status_historico TO authenticated;
GRANT ALL ON public.eventos, public.categorias, public.atletas, public.lutas, public.cinturoes, public.rankings, public.status_historico TO service_role;

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinturoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eventos publicados visiveis" ON public.eventos FOR SELECT TO anon, authenticated USING (publicado OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Categorias visiveis" ON public.categorias FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Atletas publicados visiveis" ON public.atletas FOR SELECT TO anon, authenticated USING (publicado OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Lutas de eventos publicados visiveis" ON public.lutas FOR SELECT TO anon, authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.eventos e WHERE e.id = evento_id AND e.publicado));
CREATE POLICY "Cinturoes publicados visiveis" ON public.cinturoes FOR SELECT TO anon, authenticated USING (publicado OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Ranking publicado visivel" ON public.rankings FOR SELECT TO anon, authenticated USING (publicado OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins veem historico" ON public.status_historico FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins gerem eventos" ON public.eventos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins gerem categorias" ON public.categorias FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins gerem atletas" ON public.atletas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins gerem lutas" ON public.lutas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins gerem cinturoes" ON public.cinturoes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins gerem rankings" ON public.rankings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.registrar_mudanca_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.status_historico(tabela, registro_id, status_anterior, status_novo, alterado_por)
    VALUES (TG_TABLE_NAME, NEW.id, CASE WHEN TG_OP = 'UPDATE' THEN OLD.status END, NEW.status, auth.uid());
  END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END $$;
CREATE TRIGGER eventos_status BEFORE INSERT OR UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_status();
CREATE TRIGGER lutas_status BEFORE INSERT OR UPDATE ON public.lutas FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_status();

-- Reserva números de Registro Legends para atletas históricos sem número:
-- campeões (venceram luta com cinturão) primeiro, depois pela ordem da primeira edição disputada.
CREATE OR REPLACE FUNCTION public.reservar_registros_legends()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prox integer; n integer := 0; r record;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'sem permissao'; END IF;
  SELECT COALESCE(MAX(registro_legends),0) INTO prox FROM public.atletas;
  FOR r IN
    SELECT a.id,
      EXISTS (SELECT 1 FROM public.lutas l WHERE l.vencedor_id = a.id AND l.vale_cinturao AND l.status='realizada') AS campeao,
      (SELECT MIN(COALESCE(e.data_evento, 'infinity'::timestamptz)) FROM public.lutas l JOIN public.eventos e ON e.id=l.evento_id
        WHERE (l.atleta_a_id=a.id OR l.atleta_b_id=a.id) AND l.status='realizada') AS primeira
    FROM public.atletas a
    WHERE a.historico AND a.registro_legends IS NULL
    ORDER BY campeao DESC, primeira ASC NULLS LAST, a.nome
  LOOP
    prox := prox + 1; n := n + 1;
    UPDATE public.atletas SET registro_legends = prox WHERE id = r.id;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.reservar_registros_legends() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reservar_registros_legends() TO authenticated;