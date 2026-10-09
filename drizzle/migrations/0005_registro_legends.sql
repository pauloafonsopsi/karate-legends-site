
-- Configuração do registro (linha única)
CREATE TABLE public.config_registro (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  idade_minima integer NOT NULL DEFAULT 18,
  estilos text[] NOT NULL DEFAULT ARRAY['Shotokan','Shito-Ryu'],
  fundador_ate timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.config_registro TO anon, authenticated;
GRANT UPDATE ON public.config_registro TO authenticated;
GRANT ALL ON public.config_registro TO service_role;
ALTER TABLE public.config_registro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config visivel" ON public.config_registro FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin edita config" ON public.config_registro FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.config_registro(id) VALUES (true);

-- Metas
CREATE TABLE public.metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  exige_arquivo boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.metas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.metas TO authenticated;
GRANT ALL ON public.metas TO service_role;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Metas visiveis" ON public.metas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin gere metas" ON public.metas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.metas(nome, descricao, exige_arquivo, ordem) VALUES
 ('Faixa marrom ou preta','Graduação mínima para aplicar.',false,1),
 ('Certificado de graduação','Foto ou PDF do certificado.',true,2),
 ('Highlight de kumite e Bassai Dai','Link do YouTube (pode ser não listado).',false,3),
 ('Redes sociais públicas','Link do seu perfil público.',false,4);

-- Contas
CREATE TABLE public.contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  nome text,
  whatsapp text,
  nascimento date,
  estilo text,
  graduacao text,
  dojo text,
  cidade text,
  pais text,
  atleta_id uuid REFERENCES public.atletas(id) ON DELETE SET NULL,
  fundador boolean NOT NULL DEFAULT false,
  fundador_preco_centavos integer,
  origem text,
  indicacao text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.contas TO authenticated;
GRANT ALL ON public.contas TO service_role;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dono ve conta" ON public.contas FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'));
CREATE POLICY "Dono edita conta" ON public.contas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Protege campos sensíveis contra edição pelo dono
CREATE OR REPLACE FUNCTION public.proteger_conta()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    NEW.user_id := OLD.user_id; NEW.email := OLD.email; NEW.atleta_id := OLD.atleta_id;
    NEW.fundador := OLD.fundador; NEW.fundador_preco_centavos := OLD.fundador_preco_centavos;
    NEW.origem := OLD.origem; NEW.indicacao := OLD.indicacao;
  END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END $$;
CREATE TRIGGER contas_proteger BEFORE UPDATE ON public.contas FOR EACH ROW EXECUTE FUNCTION public.proteger_conta();

-- Registros (pagos ou cortesia)
CREATE TABLE public.registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  fundador boolean NOT NULL DEFAULT false,
  preco_centavos integer,
  price_id text,
  stripe_ref text UNIQUE,
  inicio timestamptz NOT NULL DEFAULT now(),
  vencimento timestamptz,
  status text NOT NULL DEFAULT 'ativo',
  origem text,
  environment text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.registros TO authenticated;
GRANT ALL ON public.registros TO service_role;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dono ou admin ve registros" ON public.registros FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = conta_id AND c.user_id = auth.uid()));
CREATE TRIGGER registros_status BEFORE INSERT OR UPDATE ON public.registros FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_status();

-- Metas por atleta
CREATE TABLE public.metas_atleta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas(id) ON DELETE CASCADE,
  meta_id uuid NOT NULL REFERENCES public.metas(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'enviada',
  link text,
  arquivo_path text,
  verificado_por uuid,
  verificado_em timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conta_id, meta_id)
);
GRANT SELECT, INSERT, UPDATE ON public.metas_atleta TO authenticated;
GRANT ALL ON public.metas_atleta TO service_role;
ALTER TABLE public.metas_atleta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver metas do atleta" ON public.metas_atleta FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor')
    OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = conta_id AND c.user_id = auth.uid()));
CREATE POLICY "Dono envia meta" ON public.metas_atleta FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.contas c WHERE c.id = conta_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'));
CREATE POLICY "Atualizar meta" ON public.metas_atleta FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor')
    OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = conta_id AND c.user_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor')
    OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = conta_id AND c.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.proteger_meta()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor')) THEN
    -- o atleta só envia; verificar é da equipe
    NEW.status := 'enviada'; NEW.verificado_por := NULL; NEW.verificado_em := NULL;
  ELSIF NEW.status = 'verificada' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'verificada') THEN
    NEW.verificado_por := auth.uid(); NEW.verificado_em := now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER metas_atleta_proteger BEFORE INSERT OR UPDATE ON public.metas_atleta FOR EACH ROW EXECUTE FUNCTION public.proteger_meta();
CREATE TRIGGER metas_atleta_status BEFORE INSERT OR UPDATE ON public.metas_atleta FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_status();

-- Cortesias por e-mail
CREATE TABLE public.cortesias_email (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  atleta_id uuid REFERENCES public.atletas(id) ON DELETE SET NULL,
  observacao text,
  usado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cortesias_email TO authenticated;
GRANT ALL ON public.cortesias_email TO service_role;
ALTER TABLE public.cortesias_email ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin gere cortesias" ON public.cortesias_email FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Origem em compras
ALTER TABLE public.assinaturas ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.assinaturas ADD COLUMN IF NOT EXISTS origem text;

-- Número de registro para conta nova (sem atleta histórico)
CREATE OR REPLACE FUNCTION public.atribuir_numero(_conta_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record; aid uuid; n integer;
BEGIN
  SELECT * INTO c FROM public.contas WHERE id = _conta_id FOR UPDATE;
  IF c IS NULL THEN RETURN NULL; END IF;
  aid := c.atleta_id;
  IF aid IS NULL THEN
    INSERT INTO public.atletas(nome, dojo, estilo, graduacao, cidade, pais, historico, publicado)
    VALUES (COALESCE(c.nome, c.email), c.dojo, c.estilo, c.graduacao, c.cidade, c.pais, false, false)
    RETURNING id INTO aid;
    UPDATE public.contas SET atleta_id = aid WHERE id = _conta_id;
  END IF;
  SELECT registro_legends INTO n FROM public.atletas WHERE id = aid;
  IF n IS NULL THEN
    LOCK TABLE public.atletas IN SHARE ROW EXCLUSIVE MODE;
    SELECT COALESCE(MAX(registro_legends),0)+1 INTO n FROM public.atletas;
    UPDATE public.atletas SET registro_legends = n WHERE id = aid;
  END IF;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.atribuir_numero(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.atribuir_numero(uuid) TO service_role;

-- Registro ativo: pago/cortesia vigente ou campeão com cinturão
CREATE OR REPLACE FUNCTION public.registro_ativo(_conta_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.registros r WHERE r.conta_id = _conta_id AND r.status = 'ativo'
                   AND (r.vencimento IS NULL OR r.vencimento > now()))
      OR EXISTS (SELECT 1 FROM public.contas c JOIN public.cinturoes b ON b.atleta_id = c.atleta_id
                   WHERE c.id = _conta_id AND b.vigente);
$$;

-- Primeira entrada: cria a conta e aplica cortesias
CREATE OR REPLACE FUNCTION public.minha_conta_iniciar(_origem text DEFAULT NULL, _indicacao text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); em text; cid uuid; cort record; insc record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'sem sessao'; END IF;
  SELECT id INTO cid FROM public.contas WHERE user_id = uid;
  IF cid IS NOT NULL THEN RETURN cid; END IF;
  SELECT lower(email) INTO em FROM auth.users WHERE id = uid AND (email_confirmed_at IS NOT NULL OR confirmed_at IS NOT NULL);
  IF em IS NULL THEN RAISE EXCEPTION 'email nao confirmado'; END IF;
  INSERT INTO public.contas(user_id, email, origem, indicacao)
  VALUES (uid, em, left(_origem, 80), left(_indicacao, 80)) RETURNING id INTO cid;

  SELECT * INTO cort FROM public.cortesias_email WHERE lower(email) = em AND usado_em IS NULL;
  IF cort IS NOT NULL THEN
    UPDATE public.contas SET atleta_id = cort.atleta_id, fundador = true WHERE id = cid;
    INSERT INTO public.registros(conta_id, tipo, fundador, vencimento, origem)
    VALUES (cid, 'cortesia_historico', true, now() + interval '1 year', 'cortesia');
    UPDATE public.cortesias_email SET usado_em = now() WHERE id = cort.id;
  END IF;

  SELECT * INTO insc FROM public.inscricoes_atletas WHERE lower(email) = em AND pagamento_confirmado
    ORDER BY (status = 'aprovado') DESC, criado_em DESC LIMIT 1;
  IF insc IS NOT NULL THEN
    UPDATE public.contas SET fundador = true,
      nome = COALESCE(nome, insc.nome), whatsapp = COALESCE(whatsapp, insc.whatsapp),
      estilo = COALESCE(estilo, insc.estilo), graduacao = COALESCE(graduacao, insc.graduacao),
      dojo = COALESCE(dojo, insc.associacao), cidade = COALESCE(cidade, insc.cidade), pais = COALESCE(pais, insc.pais)
    WHERE id = cid;
    IF cort IS NULL THEN
      INSERT INTO public.registros(conta_id, tipo, fundador, vencimento, origem)
      VALUES (cid, 'cortesia_inscricao', true, now() + interval '1 year', 'cortesia');
    END IF;
    IF insc.status = 'aprovado' THEN
      INSERT INTO public.metas_atleta(conta_id, meta_id, status, verificado_em)
      SELECT cid, m.id, 'verificada', now() FROM public.metas m WHERE m.ativo
      ON CONFLICT (conta_id, meta_id) DO NOTHING;
    END IF;
  END IF;

  IF cort IS NOT NULL OR insc IS NOT NULL THEN PERFORM public.atribuir_numero(cid); END IF;
  RETURN cid;
END $$;
GRANT EXECUTE ON FUNCTION public.minha_conta_iniciar(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registro_ativo(uuid) TO authenticated;

-- Caminho da Lenda
CREATE OR REPLACE FUNCTION public.caminho_da_lenda(_conta_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c record; total int; ok int;
BEGIN
  SELECT * INTO c FROM public.contas WHERE id = _conta_id;
  IF c IS NULL OR NOT (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor')) THEN RETURN NULL; END IF;
  IF c.atleta_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.cinturoes WHERE atleta_id = c.atleta_id AND vigente) THEN RETURN 'campeao'; END IF;
    IF EXISTS (SELECT 1 FROM public.lutas WHERE vale_cinturao AND status <> 'realizada' AND (atleta_a_id = c.atleta_id OR atleta_b_id = c.atleta_id)) THEN RETURN 'desafiante'; END IF;
    IF EXISTS (SELECT 1 FROM public.rankings WHERE atleta_id = c.atleta_id AND publicado) THEN RETURN 'ranqueado'; END IF;
    IF EXISTS (SELECT 1 FROM public.lutas WHERE status = 'realizada' AND (atleta_a_id = c.atleta_id OR atleta_b_id = c.atleta_id)) THEN RETURN 'lutou'; END IF;
  END IF;
  SELECT count(*) INTO total FROM public.metas WHERE ativo;
  SELECT count(*) INTO ok FROM public.metas_atleta ma JOIN public.metas m ON m.id = ma.meta_id WHERE ma.conta_id = _conta_id AND m.ativo AND ma.status = 'verificada';
  IF public.registro_ativo(_conta_id) AND total > 0 AND ok >= total THEN RETURN 'apto'; END IF;
  IF public.registro_ativo(_conta_id) THEN RETURN 'registrado'; END IF;
  RETURN 'sem_registro';
END $$;
GRANT EXECUTE ON FUNCTION public.caminho_da_lenda(uuid) TO authenticated;

-- Atleta vê o próprio perfil histórico e número mesmo não publicado
CREATE POLICY "Dono ve proprio atleta" ON public.atletas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contas c WHERE c.atleta_id = atletas.id AND c.user_id = auth.uid()));

-- Arquivos das metas: contas/<user_id>/...
CREATE POLICY "Dono envia arquivo de meta" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'atletas-docs' AND (storage.foldername(name))[1] = 'contas' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "Dono e equipe leem arquivo de meta" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'atletas-docs' AND (storage.foldername(name))[1] = 'contas'
    AND ((storage.foldername(name))[2] = auth.uid()::text OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor')));
