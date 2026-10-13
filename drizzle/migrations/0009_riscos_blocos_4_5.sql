-- Cobranças recorrentes (uma linha por fatura paga), escritas só pelo webhook.
CREATE TABLE public.cobrancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_ref text NOT NULL UNIQUE,
  assinatura_ref text,
  conta_id uuid REFERENCES public.contas(id),
  tipo text NOT NULL,
  valor_centavos integer,
  pago_em timestamptz NOT NULL DEFAULT now(),
  environment text NOT NULL,
  origem text,
  origem_ultima text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cobrancas TO authenticated;
GRANT ALL ON public.cobrancas TO service_role;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin lê cobranças" ON public.cobrancas FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX cobrancas_assinatura_idx ON public.cobrancas(assinatura_ref);

-- Evento do PPV e última origem antes da compra.
ALTER TABLE public.assinaturas ADD COLUMN evento_id uuid REFERENCES public.eventos(id), ADD COLUMN origem_ultima text;

-- Traduções dos textos legais (português continua em documentos_legais).
CREATE TABLE public.documentos_legais_traducoes (
  slug text NOT NULL REFERENCES public.documentos_legais(slug),
  idioma text NOT NULL CHECK (idioma IN ('en','es')),
  titulo text NOT NULL,
  corpo text NOT NULL,
  versao integer NOT NULL DEFAULT 1,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid,
  PRIMARY KEY (slug, idioma)
);
GRANT SELECT ON public.documentos_legais_traducoes TO anon, authenticated;
GRANT INSERT, UPDATE ON public.documentos_legais_traducoes TO authenticated;
GRANT ALL ON public.documentos_legais_traducoes TO service_role;
ALTER TABLE public.documentos_legais_traducoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública das traduções" ON public.documentos_legais_traducoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin cria traduções" ON public.documentos_legais_traducoes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin edita traduções" ON public.documentos_legais_traducoes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER versionar_traducao BEFORE UPDATE ON public.documentos_legais_traducoes FOR EACH ROW EXECUTE FUNCTION public.versionar_documento();

-- Aceites com versão e idioma.
CREATE TABLE public.aceites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas(id),
  slug text NOT NULL,
  idioma text NOT NULL,
  versao integer NOT NULL,
  contexto text NOT NULL,
  aceito_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aceites TO authenticated;
GRANT ALL ON public.aceites TO service_role;
ALTER TABLE public.aceites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dono ou admin lê aceites" ON public.aceites FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = conta_id AND c.user_id = auth.uid()));
CREATE INDEX aceites_conta_idx ON public.aceites(conta_id);

CREATE OR REPLACE FUNCTION public.registrar_aceite(_slugs text[], _idioma text, _contexto text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid; s text; v int; lg text := CASE WHEN _idioma IN ('en','es') THEN _idioma ELSE 'pt' END; n int := 0;
BEGIN
  SELECT id INTO cid FROM public.contas WHERE user_id = auth.uid();
  IF cid IS NULL THEN RAISE EXCEPTION 'Conta não encontrada.'; END IF;
  FOREACH s IN ARRAY coalesce(_slugs, '{}') LOOP
    v := NULL;
    IF lg <> 'pt' THEN SELECT versao INTO v FROM public.documentos_legais_traducoes WHERE slug = s AND idioma = lg; END IF;
    IF v IS NULL THEN SELECT versao INTO v FROM public.documentos_legais WHERE slug = s; END IF;
    IF v IS NULL THEN CONTINUE; END IF;
    INSERT INTO public.aceites(conta_id, slug, idioma, versao, contexto)
    VALUES (cid, s, CASE WHEN lg <> 'pt' AND EXISTS (SELECT 1 FROM public.documentos_legais_traducoes WHERE slug = s AND idioma = lg) THEN lg ELSE 'pt' END, v, left(coalesce(_contexto,'geral'), 80));
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.registrar_aceite(text[], text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.registrar_aceite(text[], text, text) TO authenticated;

-- Liga compras antigas sem conta pelo e-mail confirmado, a cada entrada.
CREATE OR REPLACE FUNCTION public.minha_conta_iniciar(_origem text DEFAULT NULL::text, _indicacao text DEFAULT NULL::text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); em text; cid uuid; cort record; insc record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'sem sessao'; END IF;
  SELECT lower(email) INTO em FROM auth.users WHERE id = uid AND (email_confirmed_at IS NOT NULL OR confirmed_at IS NOT NULL);
  IF em IS NOT NULL THEN
    UPDATE public.assinaturas SET user_id = uid WHERE user_id IS NULL AND lower(email) = em;
  END IF;
  SELECT id INTO cid FROM public.contas WHERE user_id = uid;
  IF cid IS NOT NULL THEN RETURN cid; END IF;
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
END $function$;

-- Pagamentos: mensal por cobrança, PPV com evento e última origem.
DROP FUNCTION public._promotor_pagamentos(text);
CREATE FUNCTION public._promotor_pagamentos(_env text)
 RETURNS TABLE(id text, produto text, valor integer, data timestamp with time zone, email text, user_id uuid, conta_id uuid, origem text, price_id text, evento_id uuid, origem_ultima text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT r.id::text, 'registro_' || r.tipo, r.preco_centavos, r.inicio, c.email, c.user_id, c.id, coalesce(r.origem, c.origem), r.price_id, NULL::uuid,
         (SELECT s.origem_ultima FROM assinaturas s WHERE s.stripe_subscription_id IN (r.stripe_ref, 'ppv_' || r.stripe_ref) LIMIT 1)
    FROM registros r JOIN contas c ON c.id = r.conta_id
   WHERE r.stripe_ref IS NOT NULL AND (r.environment IS NULL OR r.environment = _env)
     AND (r.tipo = 'anual' OR (r.tipo = 'mensal' AND NOT EXISTS (SELECT 1 FROM cobrancas k WHERE k.assinatura_ref = r.stripe_ref)))
  UNION ALL
  SELECT k.id::text, k.tipo, k.valor_centavos, k.pago_em, c.email, c.user_id, c.id, coalesce(k.origem, c.origem), 'registro_mensal', NULL::uuid, k.origem_ultima
    FROM cobrancas k LEFT JOIN contas c ON c.id = k.conta_id
   WHERE k.environment = _env
  UNION ALL
  SELECT a.id::text, 'aplicacao', a.valor_centavos, a.pago_em, c.email, c.user_id, c.id, coalesce(a.origem, c.origem), 'aplicacao_evento', a.evento_id,
         (SELECT s.origem_ultima FROM assinaturas s WHERE s.tipo = 'aplicacao' AND s.user_id = c.user_id AND s.criado_em >= a.criado_em ORDER BY s.criado_em LIMIT 1)
    FROM aplicacoes a JOIN contas c ON c.id = a.conta_id
   WHERE a.pago_em IS NOT NULL AND coalesce(a.valor_centavos,0) > 0
  UNION ALL
  SELECT s.id::text, CASE WHEN s.tipo = 'ppv' THEN 'ppv' ELSE 'outros_' || s.tipo END, s.valor_centavos, s.criado_em, s.email, s.user_id,
         (SELECT c.id FROM contas c WHERE c.user_id = s.user_id OR (s.user_id IS NULL AND lower(c.email) = lower(s.email)) LIMIT 1), s.origem, s.price_id, s.evento_id, s.origem_ultima
    FROM assinaturas s
   WHERE s.environment = _env AND s.tipo NOT IN ('registro','aplicacao') AND s.status IN ('pago','active','trialing','past_due','canceled')
$function$;
REVOKE EXECUTE ON FUNCTION public._promotor_pagamentos(text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.promotor_resumo(_env text DEFAULT 'sandbox'::text)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'sem permissao'; END IF;
  WITH c AS (SELECT * FROM public._promotor_contas()),
       p AS (SELECT * FROM public._promotor_pagamentos(_env))
  SELECT jsonb_build_object(
    'funil', (SELECT jsonb_build_object('conta', count(*), 'cadastro', count(*) FILTER (WHERE completo), 'pago', count(*) FILTER (WHERE pago),
               'apto', count(*) FILTER (WHERE apto), 'aplicou', count(*) FILTER (WHERE aplicou), 'convocado', count(*) FILTER (WHERE convocado)) FROM c),
    'fundadores', (SELECT count(*) FROM c WHERE fundador),
    'fundador_ate', (SELECT fundador_ate FROM config_registro LIMIT 1),
    'receita', coalesce((SELECT jsonb_agg(x ORDER BY x.mes DESC, x.produto) FROM (
        SELECT produto, to_char(data AT TIME ZONE 'America/Sao_Paulo','YYYY-MM') mes, sum(coalesce(valor,0))::bigint total, count(*) qtd FROM p GROUP BY 1,2) x), '[]'),
    'origem', coalesce((SELECT jsonb_agg(x ORDER BY x.contas DESC) FROM (
        SELECT o origem, sum(ct)::int contas, sum(cp)::int compras, sum(cf)::int fechou FROM (
          SELECT coalesce(origem,'direto') o, 1 ct, 0 cp, 0 cf FROM c
          UNION ALL SELECT coalesce(origem,'direto'), 0, 1, 0 FROM p
          UNION ALL SELECT origem_ultima, 0, 0, 1 FROM p WHERE origem_ultima IS NOT NULL) z GROUP BY o) x), '[]'),
    'aplicacoes_categoria', coalesce((SELECT jsonb_agg(x ORDER BY x.data DESC NULLS LAST, x.categoria) FROM (
        SELECT e.id evento_id, e.nome evento, e.data_evento data, a.categoria_id, coalesce(k.nome,'Sem categoria') categoria, count(*) qtd
          FROM aplicacoes a JOIN eventos e ON e.id = a.evento_id LEFT JOIN categorias k ON k.id = a.categoria_id
         WHERE a.status <> 'aguardando_pagamento' GROUP BY 1,2,3,4,5) x), '[]'),
    'ppv_evento', coalesce((SELECT jsonb_agg(x ORDER BY x.qtd DESC) FROM (
        SELECT coalesce(p.evento_id::text, p.price_id, 'sem_plano') chave,
               coalesce((SELECT e.nome FROM eventos e WHERE e.id = p.evento_id),
                        (SELECT string_agg(e.nome, ', ') FROM eventos e WHERE p.evento_id IS NULL AND e.ppv_plano_chave = p.price_id), 'PPV avulso') evento,
               count(*) qtd, sum(coalesce(valor,0))::bigint total, count(*) FILTER (WHERE p.conta_id IS NULL) sem_conta
          FROM p WHERE produto = 'ppv' GROUP BY 1,2) x), '[]'),
    'cidades', coalesce((SELECT jsonb_agg(x ORDER BY x.atletas + x.compradores DESC) FROM (
        SELECT coalesce(nullif(trim(cidade),''),'Sem cidade') cidade, count(*) FILTER (WHERE pago)::int atletas,
               count(*) FILTER (WHERE EXISTS (SELECT 1 FROM p WHERE p.conta_id = c.conta_id AND p.produto = 'ppv'))::int compradores
          FROM c GROUP BY 1) x WHERE x.atletas + x.compradores > 0), '[]')
  ) INTO r;
  RETURN r;
END $function$;

CREATE OR REPLACE FUNCTION public.promotor_lista(_lista text, _param text DEFAULT NULL::text, _env text DEFAULT 'sandbox'::text)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'sem permissao'; END IF;
  IF _lista LIKE 'funil_%' OR _lista IN ('fundadores','origem','cidade','parou_pagamento','uma_meta') THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', conta_id, 'nome', coalesce(nome,email), 'email', email, 'whatsapp', whatsapp, 'cidade', cidade,
      'origem', coalesce(origem,'direto'), 'numero', numero, 'data', criado_em,
      'detalhe', CASE WHEN apto THEN 'Apto' WHEN pago THEN 'Registro ativo, ' || pendentes || ' meta(s) pendente(s)' WHEN completo THEN 'Cadastro completo, sem registro' ELSE 'Cadastro incompleto' END)
      ORDER BY criado_em DESC), '[]') INTO r
    FROM public._promotor_contas() c
    WHERE CASE _lista
      WHEN 'funil_conta' THEN true WHEN 'funil_cadastro' THEN completo WHEN 'funil_pago' THEN pago
      WHEN 'funil_apto' THEN apto WHEN 'funil_aplicou' THEN aplicou WHEN 'funil_convocado' THEN convocado
      WHEN 'fundadores' THEN fundador
      WHEN 'origem' THEN coalesce(origem,'direto') = _param
      WHEN 'cidade' THEN coalesce(nullif(trim(cidade),''),'Sem cidade') = _param
      WHEN 'parou_pagamento' THEN completo AND NOT pago AND NOT EXISTS (SELECT 1 FROM registros x WHERE x.conta_id = c.conta_id)
      WHEN 'uma_meta' THEN pago AND pendentes = 1
      ELSE false END;
  ELSIF _lista = 'veteranos' THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'nome', a.nome, 'email', ce.email, 'whatsapp', NULL, 'cidade', a.cidade,
      'numero', a.registro_legends, 'data', a.criado_em, 'detalhe', coalesce(a.dojo, 'Atleta histórico')) ORDER BY a.registro_legends NULLS LAST, a.nome), '[]') INTO r
    FROM atletas a LEFT JOIN cortesias_email ce ON ce.atleta_id = a.id
    WHERE a.historico AND NOT EXISTS (SELECT 1 FROM contas c WHERE c.atleta_id = a.id);
  ELSIF _lista = 'vencendo' THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', rg.id, 'nome', coalesce(c.nome,c.email), 'email', c.email, 'whatsapp', c.whatsapp, 'cidade', c.cidade,
      'origem', c.origem, 'vencimento', rg.vencimento, 'data', rg.vencimento, 'numero', (SELECT registro_legends FROM atletas WHERE id = c.atleta_id),
      'detalhe', 'Registro ' || rg.tipo || CASE WHEN rg.fundador THEN ', Classe Fundadora' ELSE '' END) ORDER BY rg.vencimento), '[]') INTO r
    FROM registros rg JOIN contas c ON c.id = rg.conta_id
    WHERE rg.status = 'ativo' AND rg.tipo <> 'mensal' AND rg.vencimento BETWEEN now() AND now() + interval '30 days'
      AND NOT EXISTS (SELECT 1 FROM registros r2 WHERE r2.conta_id = rg.conta_id AND r2.status = 'ativo' AND r2.vencimento > now() + interval '30 days');
  ELSIF _lista IN ('sem_resposta','nao_confirmaram','aplicacoes') THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'nome', coalesce(c.nome,c.email), 'email', c.email, 'whatsapp', c.whatsapp, 'cidade', c.cidade,
      'origem', a.origem, 'evento', e.nome, 'data', coalesce(j.resposta_ate, a.criado_em), 'vencimento', j.resposta_ate,
      'detalhe', coalesce(k.nome,'Sem categoria') || ', ' || e.nome) ORDER BY j.resposta_ate NULLS LAST, a.criado_em), '[]') INTO r
    FROM aplicacoes a JOIN contas c ON c.id = a.conta_id JOIN eventos e ON e.id = a.evento_id
      LEFT JOIN janelas_aplicacao j ON j.evento_id = a.evento_id LEFT JOIN categorias k ON k.id = a.categoria_id
    WHERE CASE _lista
      WHEN 'sem_resposta' THEN a.status = 'em_analise' AND j.resposta_ate IS NOT NULL AND j.resposta_ate < now() + interval '7 days'
      WHEN 'nao_confirmaram' THEN a.status = 'convocado' AND NOT a.presenca_confirmada AND e.status = 'agendado'
      ELSE a.status <> 'aguardando_pagamento' AND a.evento_id::text = split_part(_param,'|',1)
           AND coalesce(a.categoria_id::text,'') = split_part(_param,'|',2) END;
  ELSIF _lista IN ('receita','ppv') THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'nome', coalesce(c.nome, p.email), 'email', p.email, 'whatsapp', c.whatsapp, 'cidade', c.cidade,
      'origem', coalesce(p.origem,'direto'), 'valor', p.valor, 'data', p.data,
      'evento', (SELECT e.nome FROM eventos e WHERE e.id = p.evento_id),
      'detalhe', p.produto || CASE WHEN p.conta_id IS NULL THEN ', sem conta' ELSE '' END) ORDER BY p.data DESC), '[]') INTO r
    FROM public._promotor_pagamentos(_env) p LEFT JOIN contas c ON c.id = p.conta_id
    WHERE CASE _lista
      WHEN 'ppv' THEN p.produto = 'ppv' AND (_param IS NULL OR coalesce(p.evento_id::text, p.price_id,'sem_plano') = _param)
      ELSE (_param IS NULL OR _param = '' OR
            ((split_part(_param,'|',1) = '' OR p.produto = split_part(_param,'|',1)) AND
             (split_part(_param,'|',2) = '' OR to_char(p.data AT TIME ZONE 'America/Sao_Paulo','YYYY-MM') = split_part(_param,'|',2)))) END;
  ELSIF _lista IN ('origem_compras','origem_fechou') THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'nome', coalesce(c.nome, p.email), 'email', p.email, 'whatsapp', c.whatsapp, 'cidade', c.cidade,
      'origem', coalesce(p.origem,'direto'), 'valor', p.valor, 'data', p.data,
      'detalhe', p.produto || CASE WHEN p.origem_ultima IS NOT NULL THEN ', fechou por ' || p.origem_ultima ELSE '' END) ORDER BY p.data DESC), '[]') INTO r
    FROM public._promotor_pagamentos(_env) p LEFT JOIN contas c ON c.id = p.conta_id
    WHERE CASE WHEN _lista = 'origem_compras' THEN coalesce(p.origem,'direto') = _param ELSE p.origem_ultima = _param END;
  ELSE
    RAISE EXCEPTION 'lista desconhecida';
  END IF;
  RETURN r;
END $function$;