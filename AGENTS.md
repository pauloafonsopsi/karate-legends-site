# Karate Legends: architecture rules

Subdirectories may have their own `AGENTS.md`; read it before changing files there.

- Operational data (texts, plans, events, settings, legal texts) lives in the database, edited in the admin panel; why: owner runs the site without code.
- Site texts: bundled i18n JSON are defaults; `conteudos` rows override at runtime; why: never blank if the database fails.
- Charged amounts come only from edge functions/payment provider, never the browser; payment status is written only by the payments webhook; why: tamper-proof single source.
- Admin permission uses `has_role` in RLS and on the server, roles in `user_roles`; every table has RLS, public reads only for public-site data; why: repo and API are public.
- Never editable from the panel: webhook, access rules, role checks, keys, integrations.
- Public site has two doors, PPV and Atletas; Membro and Newsletter plans stay inactive, never deleted; why: keeps old data intact.
- History and card live in `eventos`, `categorias`, `atletas`, `lutas`, `cinturoes`, `rankings` (one `lutas` structure for past and upcoming); Home numbers and countdown derive from them; why: one source of truth.
- Event/fight status changes logged in `status_historico` by trigger; accounts and purchases record origin from day one; why: unrecorded data cannot be recovered.
- Registry numbers only via `reservar_registros_legends` and `atribuir_numero`; why: numbering is a rule.
- Work proceeds in owner-approved blocks; a block starts only after the owner writes "aprovado".
- One account (`contas`, created only by `minha_conta_iniciar`, which also applies courtesies and links e-mail-matched old purchases) serves PPV buyers and athletes; every checkout needs a signed-in account; why: one identity.
- Registry status via `registro_ativo`, Legend Path via `caminho_da_lenda`; registry rows written only by webhook or DB functions; barriers and founder window read from `config_registro` and re-checked in `create-checkout`; why: rules stay server-side.
- Only staff verify goals (trigger on `metas_atleta`); consultants never read payments; why: least privilege.
- Applications: `aplicacoes` per account/event, configured in `janelas_aplicacao`, created only via `aplicar_evento`, confirmed via `confirmar_presenca`; fee read by `create-checkout`, refunds only via `admin-aplicacoes-reembolso`; staff notes in `aplicacoes_notas`; why: rules server-side.
- Promoter numbers/lists only from admin-checked `promotor_*` functions (`_promotor_*` not client-executable); WhatsApp texts in `mensagens_whatsapp`, origin links in `links_origem`; why: browser never aggregates payments.
- Monthly registry revenue: one `cobrancas` row per paid invoice, webhook only; PPV purchases store server-chosen `evento_id` and `origem_ultima` in `assinaturas`; why: real monthly revenue, correct event, first and closing origin.
- Legal texts: PT in `documentos_legais`, EN/ES in `documentos_legais_traducoes`, both versioned by trigger, company identity in `dados_empresa`; accepted versions recorded in `aceites` only by `create-checkout` or `registrar_aceite`; why: lawyer edits in panel and acceptance is provable.
