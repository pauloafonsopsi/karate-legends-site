ALTER TABLE public.contas ADD COLUMN IF NOT EXISTS doc_frente_path text, ADD COLUMN IF NOT EXISTS doc_verso_path text;

CREATE TABLE public.janelas_aplicacao (
  evento_id uuid PRIMARY KEY REFERENCES public.eventos(id) ON DELETE CASCADE,
  ativo boolean NOT NULL DEFAULT false,
  abre_em timestamptz,
  fecha_em timestamptz,
  resposta_ate timestamptz,
  vagas integer,
  taxa_centavos integer NOT NULL DEFAULT 1990 CHECK (taxa_centavos >= 0),
  categorias uuid[] NOT NULL DEFAULT '{}',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.janelas_aplicacao TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.janelas_aplicacao TO authenticated;
GRANT ALL ON public.janelas_aplicacao TO service_role;
ALTER TABLE public.janelas_aplicacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "janelas leitura publica" ON public.janelas_aplicacao FOR SELECT USING (ativo OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "janelas admin escreve" ON public.janelas_aplicacao FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.aplicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas(id),
  evento_id uuid NOT NULL REFERENCES public.eventos(id),
  categoria_id uuid REFERENCES public.categorias(id),
  highlight_link text,
  autoriza_divulgacao boolean NOT NULL DEFAULT false,
  aceite_termos boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'aguardando_pagamento'
    CHECK (status IN ('aguardando_pagamento','em_analise','convocado','nao_convocado','reembolsada')),
  presenca_confirmada boolean NOT NULL DEFAULT false,
  valor_centavos integer,
  stripe_ref text,
  pago_em timestamptz,
  respondido_em timestamptz,
  origem text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conta_id, evento_id)
);
GRANT SELECT, UPDATE ON public.aplicacoes TO authenticated;
GRANT ALL ON public.aplicacoes TO service_role;
ALTER TABLE public.aplicacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aplicacoes dono e equipe leem" ON public.aplicacoes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.contas c WHERE c.id = conta_id AND c.user_id = auth.uid())
  OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'));
CREATE POLICY "aplicacoes equipe decide" ON public.aplicacoes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'));

CREATE TABLE public.aplicacoes_notas (
  aplicacao_id uuid PRIMARY KEY REFERENCES public.aplicacoes(id) ON DELETE CASCADE,
  nota text NOT NULL DEFAULT '',
  atualizado_por uuid,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.aplicacoes_notas TO authenticated;
GRANT ALL ON public.aplicacoes_notas TO service_role;
ALTER TABLE public.aplicacoes_notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notas so equipe" ON public.aplicacoes_notas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'));

-- A equipe só decide (em análise, convocado, não convocado). Todo o resto muda por função ou webhook.
CREATE OR REPLACE FUNCTION public.proteger_aplicacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND coalesce(current_setting('app.aplicacao_rpc', true),'') <> '1' THEN
    IF NEW.status NOT IN ('em_analise','convocado','nao_convocado') OR OLD.status NOT IN ('em_analise','convocado','nao_convocado') THEN
      RAISE EXCEPTION 'status nao permitido';
    END IF;
    NEW.conta_id := OLD.conta_id; NEW.evento_id := OLD.evento_id; NEW.categoria_id := OLD.categoria_id;
    NEW.highlight_link := OLD.highlight_link; NEW.autoriza_divulgacao := OLD.autoriza_divulgacao;
    NEW.aceite_termos := OLD.aceite_termos; NEW.presenca_confirmada := OLD.presenca_confirmada;
    NEW.valor_centavos := OLD.valor_centavos; NEW.stripe_ref := OLD.stripe_ref; NEW.pago_em := OLD.pago_em;
    NEW.origem := OLD.origem; NEW.criado_em := OLD.criado_em;
    IF NEW.status <> 'convocado' THEN NEW.presenca_confirmada := false; END IF;
  END IF;
  IF NEW.status IN ('convocado','nao_convocado') AND OLD.status IS DISTINCT FROM NEW.status THEN NEW.respondido_em := now(); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER aplicacoes_proteger BEFORE UPDATE ON public.aplicacoes FOR EACH ROW EXECUTE FUNCTION public.proteger_aplicacao();
CREATE TRIGGER aplicacoes_status BEFORE INSERT OR UPDATE ON public.aplicacoes FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_status();

-- Atleta aplica: registro ativo, metas verificadas, janela aberta, categoria aberta, documento enviado.
CREATE OR REPLACE FUNCTION public.aplicar_evento(_evento_id uuid, _categoria_id uuid, _highlight text, _autoriza boolean, _aceite boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c record; j record; total int; ok int; aid uuid; atual record;
BEGIN
  SELECT * INTO c FROM public.contas WHERE user_id = auth.uid();
  IF c IS NULL THEN RAISE EXCEPTION 'Conta não encontrada.'; END IF;
  IF NOT public.registro_ativo(c.id) THEN RAISE EXCEPTION 'Seu Registro Legends precisa estar ativo.'; END IF;
  SELECT count(*) INTO total FROM public.metas WHERE ativo;
  SELECT count(*) INTO ok FROM public.metas_atleta ma JOIN public.metas m ON m.id = ma.meta_id
    WHERE ma.conta_id = c.id AND m.ativo AND ma.status = 'verificada';
  IF ok < total THEN RAISE EXCEPTION 'Todas as metas precisam estar verificadas.'; END IF;
  SELECT * INTO j FROM public.janelas_aplicacao WHERE evento_id = _evento_id;
  IF j IS NULL OR NOT j.ativo OR (j.abre_em IS NOT NULL AND j.abre_em > now()) OR (j.fecha_em IS NOT NULL AND j.fecha_em < now()) THEN
    RAISE EXCEPTION 'As aplicações deste evento não estão abertas.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.eventos WHERE id = _evento_id AND status = 'agendado') THEN RAISE EXCEPTION 'Evento indisponível.'; END IF;
  IF _categoria_id IS NULL OR NOT (_categoria_id = ANY (j.categorias)) THEN RAISE EXCEPTION 'Categoria não aberta neste evento.'; END IF;
  IF NOT coalesce(_aceite,false) THEN RAISE EXCEPTION 'Aceite os termos para aplicar.'; END IF;
  IF c.doc_frente_path IS NULL OR c.doc_verso_path IS NULL THEN RAISE EXCEPTION 'Envie o documento de identidade (frente e verso).'; END IF;
  IF _highlight IS NULL OR _highlight !~* '^https?://' THEN RAISE EXCEPTION 'Informe o link do highlight.'; END IF;
  PERFORM set_config('app.aplicacao_rpc','1',true);
  SELECT * INTO atual FROM public.aplicacoes WHERE conta_id = c.id AND evento_id = _evento_id;
  IF atual IS NOT NULL THEN
    IF atual.status <> 'aguardando_pagamento' THEN RAISE EXCEPTION 'Você já aplicou para este evento.'; END IF;
    UPDATE public.aplicacoes SET categoria_id = _categoria_id, highlight_link = left(_highlight,500),
      autoriza_divulgacao = coalesce(_autoriza,false), aceite_termos = true WHERE id = atual.id;
    aid := atual.id;
  ELSE
    INSERT INTO public.aplicacoes(conta_id, evento_id, categoria_id, highlight_link, autoriza_divulgacao, aceite_termos, origem)
    VALUES (c.id, _evento_id, _categoria_id, left(_highlight,500), coalesce(_autoriza,false), true, c.origem) RETURNING id INTO aid;
  END IF;
  IF j.taxa_centavos = 0 THEN
    UPDATE public.aplicacoes SET status = 'em_analise', valor_centavos = 0, pago_em = now() WHERE id = aid;
  END IF;
  RETURN aid;
END $$;

CREATE OR REPLACE FUNCTION public.confirmar_presenca(_aplicacao_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM set_config('app.aplicacao_rpc','1',true);
  UPDATE public.aplicacoes a SET presenca_confirmada = true
   FROM public.contas c WHERE a.id = _aplicacao_id AND c.id = a.conta_id AND c.user_id = auth.uid() AND a.status = 'convocado';
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.aplicar_evento(uuid,uuid,text,boolean,boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.aplicar_evento(uuid,uuid,text,boolean,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.confirmar_presenca(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_presenca(uuid) TO authenticated;

-- Caminho da Lenda ganha a etapa convocado.
CREATE OR REPLACE FUNCTION public.caminho_da_lenda(_conta_id uuid)
 RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
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
  IF EXISTS (SELECT 1 FROM public.aplicacoes WHERE conta_id = _conta_id AND status = 'convocado') THEN RETURN 'convocado'; END IF;
  SELECT count(*) INTO total FROM public.metas WHERE ativo;
  SELECT count(*) INTO ok FROM public.metas_atleta ma JOIN public.metas m ON m.id = ma.meta_id WHERE ma.conta_id = _conta_id AND m.ativo AND ma.status = 'verificada';
  IF public.registro_ativo(_conta_id) AND total > 0 AND ok >= total THEN RETURN 'apto'; END IF;
  IF public.registro_ativo(_conta_id) THEN RETURN 'registrado'; END IF;
  RETURN 'sem_registro';
END $function$;

-- Risco: o formulário antigo deixava qualquer pessoa enviar arquivo ao armazenamento privado.
DROP POLICY IF EXISTS "Public can upload to atletas-docs" ON storage.objects;