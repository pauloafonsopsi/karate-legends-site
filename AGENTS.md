# Karate Legends: architecture rules

- Operational data (site texts, plans, events, settings, legal texts) lives in the database and is edited in the admin panel; why: the owner runs the site without code changes.
- Site texts: bundled i18n JSON files are the defaults; rows in `conteudos` (chave, idioma) override them at runtime; why: the site never shows blank text if the database fails.
- Charged prices come only from the payment provider via edge functions; the browser never sends an amount; why: prevents tampering.
- Payment status is written only by the payments webhook; why: single source of truth.
- Admin permission is checked with `has_role` in RLS and on the server, roles live in `user_roles`; why: prevents privilege escalation.
- Every table has RLS; public reads only for data displayed on the public site; why: the repository and API are public.
- Admin panel modules live in `src/components/admin/` and are mounted as tabs in `src/pages/Admin.tsx`; why: keeps the 800-line page from growing.
- Never editable from the panel: webhook, access rules, role checks, keys and integrations.
