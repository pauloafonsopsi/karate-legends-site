# Karate Legends: architecture rules

- Operational data (site texts, plans, events, settings, legal texts) lives in the database and is edited in the admin panel; why: the owner runs the site without code changes.
- Site texts: bundled i18n JSON files are the defaults; rows in `conteudos` (chave, idioma) override them at runtime; why: the site never shows blank text if the database fails.
- Charged prices come only from the payment provider via edge functions; the browser never sends an amount; why: prevents tampering.
- Payment status is written only by the payments webhook; why: single source of truth.
- Admin permission is checked with `has_role` in RLS and on the server, roles live in `user_roles`; why: prevents privilege escalation.
- Every table has RLS; public reads only for data displayed on the public site; why: the repository and API are public.
- Admin panel modules live in `src/components/admin/` and are mounted as tabs in `src/pages/Admin.tsx`; why: keeps the 800-line page from growing.
- Never editable from the panel: webhook, access rules, role checks, keys and integrations.
- The public site has two doors, PPV (viewers) and Atletas (fighters); Membro and Newsletter plans are kept inactive, never deleted; why: new direction keeps old data and subscriptions intact.
- Events, categories, athletes, fights, belts and rankings live in `eventos`, `categorias`, `atletas`, `lutas`, `cinturoes`, `rankings`; the same `lutas` structure serves past editions and the upcoming card; why: one source for history, card and Home numbers.
- Home numbers and the countdown are derived from registered events, never typed in code; why: they stay true as editions are added.
- Status changes on events and fights are logged in `status_historico` by trigger; accounts and purchases must record their origin from day one; why: data not recorded when it happens cannot be recovered for reports.
- Legends Registry numbers are reserved only by the `reservar_registros_legends` database function (champions first, then by edition order); why: numbering is a rule, not panel data.
- Work proceeds in the five blocks of the current master plan; a block starts only after the owner writes "aprovado"; why: owner-controlled scope.
