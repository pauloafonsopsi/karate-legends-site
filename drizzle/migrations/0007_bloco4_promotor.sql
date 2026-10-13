CREATE TABLE public.mensagens_whatsapp (
  chave text PRIMARY KEY,
  texto text NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens_whatsapp TO authenticated;
GRANT ALL ON public.mensagens_whatsapp TO service_role;
ALTER TABLE public.mensagens_whatsapp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin gerencia mensagens" ON public.mensagens_whatsapp FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.links_origem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
  canal text,
  campanha text,
  atleta_id uuid REFERENCES public.atletas(id) ON DELETE SET NULL,
  destino text NOT NULL DEFAULT '/',
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.links_origem TO authenticated;
GRANT ALL ON public.links_origem TO service_role;
ALTER TABLE public.links_origem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin gerencia links" ON public.links_origem FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Pagamentos unificados (uso interno das funções do promotor)
CREATE OR REPLACE FUNCTION public._promotor_pagamentos(_env text)
RETURNS TABLE(id text, produto text, valor integer, data timestamptz, email text, user_id uuid, conta_id uuid, origem text, price_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT r.id::text, 'registro_' || r.tipo, r.preco_centavos, r.inicio, c.email, c.user_id, c.id, coalesce(r.origem, c.origem), r.price_id
    FROM registros r JOIN contas c ON c.id = r.conta_id
   WHERE r.tipo IN ('anual','mensal') AND r.stripe_ref IS NOT NULL AND (r.environment IS NULL OR r.environment = _env)
  UNION ALL
  SELECT a.id::text, 'aplicacao', a.valor_centavos, a.pago_em, c.email, c.user_id, c.id, coalesce(a.origem, c.origem), 'aplicacao_evento'
    FROM aplicacoes a JOIN contas c ON c.id = a.conta_id
   WHERE a.pago_em IS NOT NULL AND coalesce(a.valor_centavos,0) > 0
  UNION ALL
  SELECT s.id::text, CASE WHEN s.tipo = 'ppv' THEN 'ppv' ELSE 'outros_' || s.tipo END, s.valor_centavos, s.criado_em, s.email, s.user_id,
         (SELECT c.id FROM contas c WHERE c.user_id = s.user_id OR (s.user_id IS NULL AND lower(c.email) = lower(s.email)) LIMIT 1), s.origem, s.price_id
    FROM assinaturas s
   WHERE s.environment = _env AND s.tipo NOT IN ('registro','aplicacao') AND s.status IN ('pago','active','trialing','past_due','canceled')
$$;
REVOKE EXECUTE ON FUNCTION public._promotor_pagamentos(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._promotor_contas()
RETURNS TABLE(conta_id uuid, nome text, email text, whatsapp text, cidade text, origem text, criado_em timestamptz,
  completo boolean, pago boolean, apto boolean, aplicou boolean, convocado boolean, fundador boolean, numero integer, pendentes integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH tm AS (SELECT count(*)::int n FROM metas WHERE ativo),
  base AS (
    SELECT c.*, public.registro_ativo(c.id) AS ativo,
      (SELECT count(*)::int FROM metas_atleta ma JOIN metas m ON m.id = ma.meta_id WHERE ma.conta_id = c.id AND m.ativo AND ma.status = 'verificada') AS ok
    FROM contas c)
  SELECT b.id, b.nome, b.email, b.whatsapp, b.cidade, b.origem, b.criado_em,
    (b.nome IS NOT NULL AND b.whatsapp IS NOT NULL AND b.nascimento IS NOT NULL AND b.estilo IS NOT NULL AND b.graduacao IS NOT NULL),
    b.ativo,
    b.ativo AND tm.n > 0 AND b.ok >= tm.n,
    EXISTS (SELECT 1 FROM aplicacoes a WHERE a.conta_id = b.id AND a.status <> 'aguardando_pagamento'),
    EXISTS (SELECT 1 FROM aplicacoes a WHERE a.conta_id = b.id AND a.status = 'convocado'),
    b.fundador,
    (SELECT at.registro_legends FROM atletas at WHERE at.id = b.atleta_id),
    greatest(tm.n - b.ok, 0)
  FROM base b, tm
$$;
REVOKE EXECUTE ON FUNCTION public._promotor_contas() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.promotor_resumo(_env text DEFAULT 'sandbox')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
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
        SELECT o origem, sum(ct)::int contas, sum(cp)::int compras FROM (
          SELECT coalesce(origem,'direto') o, 1 ct, 0 cp FROM c
          UNION ALL SELECT coalesce(origem,'direto'), 0, 1 FROM p) z GROUP BY o) x), '[]'),
    'aplicacoes_categoria', coalesce((SELECT jsonb_agg(x ORDER BY x.data DESC NULLS LAST, x.categoria) FROM (
        SELECT e.id evento_id, e.nome evento, e.data_evento data, a.categoria_id, coalesce(k.nome,'Sem categoria') categoria, count(*) qtd
          FROM aplicacoes a JOIN eventos e ON e.id = a.evento_id LEFT JOIN categorias k ON k.id = a.categoria_id
         WHERE a.status <> 'aguardando_pagamento' GROUP BY 1,2,3,4,5) x), '[]'),
    'ppv_evento', coalesce((SELECT jsonb_agg(x ORDER BY x.qtd DESC) FROM (
        SELECT coalesce(p.price_id,'sem_plano') chave, coalesce((SELECT string_agg(e.nome, ', ') FROM eventos e WHERE e.ppv_plano_chave = p.price_id), 'PPV avulso') evento,
               count(*) qtd, sum(coalesce(valor,0))::bigint total, count(*) FILTER (WHERE p.conta_id IS NULL) sem_conta
          FROM p WHERE produto = 'ppv' GROUP BY 1,2) x), '[]'),
    'cidades', coalesce((SELECT jsonb_agg(x ORDER BY x.atletas + x.compradores DESC) FROM (
        SELECT coalesce(nullif(trim(cidade),''),'Sem cidade') cidade, count(*) FILTER (WHERE pago)::int atletas,
               count(*) FILTER (WHERE EXISTS (SELECT 1 FROM p WHERE p.conta_id = c.conta_id AND p.produto = 'ppv'))::int compradores
          FROM c GROUP BY 1) x WHERE x.atletas + x.compradores > 0), '[]')
  ) INTO r;
  RETURN r;
END $$;
GRANT EXECUTE ON FUNCTION public.promotor_resumo(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.promotor_lista(_lista text, _param text DEFAULT NULL, _env text DEFAULT 'sandbox')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
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
      'detalhe', p.produto || CASE WHEN p.conta_id IS NULL THEN ', sem conta' ELSE '' END) ORDER BY p.data DESC), '[]') INTO r
    FROM public._promotor_pagamentos(_env) p LEFT JOIN contas c ON c.id = p.conta_id
    WHERE CASE _lista
      WHEN 'ppv' THEN p.produto = 'ppv' AND (_param IS NULL OR coalesce(p.price_id,'sem_plano') = _param)
      ELSE (_param IS NULL OR _param = '' OR
            ((split_part(_param,'|',1) = '' OR p.produto = split_part(_param,'|',1)) AND
             (split_part(_param,'|',2) = '' OR to_char(p.data AT TIME ZONE 'America/Sao_Paulo','YYYY-MM') = split_part(_param,'|',2)))) END;
  ELSIF _lista = 'origem_compras' THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'nome', coalesce(c.nome, p.email), 'email', p.email, 'whatsapp', c.whatsapp, 'cidade', c.cidade,
      'origem', coalesce(p.origem,'direto'), 'valor', p.valor, 'data', p.data, 'detalhe', p.produto) ORDER BY p.data DESC), '[]') INTO r
    FROM public._promotor_pagamentos(_env) p LEFT JOIN contas c ON c.id = p.conta_id WHERE coalesce(p.origem,'direto') = _param;
  ELSE
    RAISE EXCEPTION 'lista desconhecida';
  END IF;
  RETURN r;
END $$;
GRANT EXECUTE ON FUNCTION public.promotor_lista(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.promotor_contagens()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'sem permissao'; END IF;
  RETURN jsonb_build_object(
    'veteranos', jsonb_array_length(public.promotor_lista('veteranos')),
    'parou_pagamento', jsonb_array_length(public.promotor_lista('parou_pagamento')),
    'uma_meta', jsonb_array_length(public.promotor_lista('uma_meta')),
    'vencendo', jsonb_array_length(public.promotor_lista('vencendo')),
    'sem_resposta', jsonb_array_length(public.promotor_lista('sem_resposta')),
    'nao_confirmaram', jsonb_array_length(public.promotor_lista('nao_confirmaram')));
END $$;
GRANT EXECUTE ON FUNCTION public.promotor_contagens() TO authenticated;