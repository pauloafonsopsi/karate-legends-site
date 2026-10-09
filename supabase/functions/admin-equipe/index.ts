import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Admin convida, lista e remove consultores técnicos.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return json({ error: 'sem sessão' }, 401);
    const { data: u } = await db.auth.getUser(token);
    if (!u.user) return json({ error: 'sem sessão' }, 401);
    const { data: isAdmin } = await db.rpc('has_role', { _user_id: u.user.id, _role: 'admin' });
    if (!isAdmin) return json({ error: 'sem permissão' }, 403);

    const { acao, email, user_id, redirectTo } = (await req.json()) ?? {};
    if (acao === 'listar') {
      const { data: roles } = await db.from('user_roles').select('user_id, criado_em').eq('role', 'consultor');
      const lista = [];
      for (const r of roles ?? []) {
        const { data } = await db.auth.admin.getUserById(r.user_id);
        lista.push({ user_id: r.user_id, email: data.user?.email ?? '', desde: r.criado_em });
      }
      return json({ lista });
    }
    if (acao === 'convidar') {
      if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return json({ error: 'e-mail inválido' }, 400);
      const alvo = email.trim().toLowerCase();
      let uid: string | undefined;
      const { data: inv, error } = await db.auth.admin.inviteUserByEmail(alvo, {
        redirectTo: typeof redirectTo === 'string' ? redirectTo : undefined,
      });
      if (inv?.user) uid = inv.user.id;
      if (!uid) {
        // já tem conta: procura pelo e-mail
        const { data: page } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
        uid = page.users.find((x) => x.email?.toLowerCase() === alvo)?.id;
        if (!uid) return json({ error: error?.message ?? 'não foi possível convidar' }, 400);
      }
      await db.from('user_roles').upsert({ user_id: uid, role: 'consultor' }, { onConflict: 'user_id,role' });
      return json({ ok: true });
    }
    if (acao === 'remover') {
      if (typeof user_id !== 'string') return json({ error: 'user_id' }, 400);
      await db.from('user_roles').delete().eq('user_id', user_id).eq('role', 'consultor');
      return json({ ok: true });
    }
    return json({ error: 'ação inválida' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : 'erro' }, 500);
  }
});
