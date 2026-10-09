import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { type StripeEnv, createStripeClient } from '../_shared/stripe.ts';

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Changes a plan price: creates a new Stripe price, moves the lookup key to it, archives the old one.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const auth = req.headers.get('Authorization') ?? '';
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Não autenticado' }, 401);
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) return json({ error: 'Sem permissão' }, 403);

    const { chave, centavos, environment } = await req.json();
    if (typeof chave !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(chave)) return json({ error: 'Plano inválido' }, 400);
    if (!Number.isInteger(centavos) || centavos < 100 || centavos > 10000000) return json({ error: 'Valor inválido' }, 400);
    if (environment !== 'sandbox' && environment !== 'live') return json({ error: 'Ambiente inválido' }, 400);

    const stripe = createStripeClient(environment as StripeEnv);
    const prices = await stripe.prices.list({ lookup_keys: [chave], expand: ['data.product'] });
    const old = prices.data[0];
    if (!old) return json({ error: 'Preço não encontrado no Stripe' }, 404);
    const productId = typeof old.product === 'string' ? old.product : old.product.id;
    if (old.unit_amount !== centavos) {
      await stripe.prices.create({
        product: productId,
        currency: old.currency,
        unit_amount: centavos,
        ...(old.recurring && { recurring: { interval: old.recurring.interval, interval_count: old.recurring.interval_count } }),
        lookup_key: chave,
        transfer_lookup_key: true,
      });
      await stripe.prices.update(old.id, { active: false });
    }
    await admin.from('planos').update({ preco_centavos: centavos, moeda: old.currency, atualizado_em: new Date().toISOString() }).eq('chave', chave);
    return json({ ok: true, centavos });
  } catch (e) {
    console.error('admin-plano-preco', e);
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado' }, 500);
  }
});
