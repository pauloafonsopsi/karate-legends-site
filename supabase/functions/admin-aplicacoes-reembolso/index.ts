import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Evento cancelado devolve a taxa de todas as aplicações pagas. Só admin, só evento cancelado.
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

    const { eventoId, environment } = (await req.json()) ?? {};
    if (environment !== 'sandbox' && environment !== 'live') return json({ error: 'ambiente inválido' }, 400);
    const { data: ev } = await db.from('eventos').select('status').eq('id', eventoId).maybeSingle();
    if (ev?.status !== 'cancelado') return json({ error: 'O evento precisa estar cancelado.' }, 400);

    const stripe = createStripeClient(environment as StripeEnv);
    const { data: aps } = await db.from('aplicacoes').select('id,stripe_ref,valor_centavos')
      .eq('evento_id', eventoId).in('status', ['em_analise', 'convocado', 'nao_convocado']);
    let ok = 0; const falhas: string[] = [];
    for (const a of aps ?? []) {
      try {
        if (a.valor_centavos && a.stripe_ref?.startsWith('pi_')) await stripe.refunds.create({ payment_intent: a.stripe_ref });
        await db.from('aplicacoes').update({ status: 'reembolsada' }).eq('id', a.id);
        ok++;
      } catch (e) {
        console.error('reembolso', a.id, e);
        falhas.push(a.id);
      }
    }
    return json({ reembolsadas: ok, falhas: falhas.length });
  } catch (e) {
    console.error(e);
    return json({ error: 'Erro inesperado' }, 500);
  }
});
