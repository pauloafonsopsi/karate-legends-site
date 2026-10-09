import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  if (options.userId) {
    const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

const idade = (nasc: string) => {
  const d = new Date(nasc), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { priceId, customerEmail, returnUrl, environment, origem } = (await req.json()) ?? {};
    if (typeof priceId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(priceId) || typeof returnUrl !== 'string') {
      return json({ error: 'priceId and returnUrl are required' }, 400);
    }
    if (environment !== 'sandbox' && environment !== 'live') return json({ error: 'invalid environment' }, 400);
    const env: StripeEnv = environment;

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    let user: { id: string; email?: string } | null = null;
    if (token) {
      const { data } = await admin.auth.getUser(token);
      user = data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null;
    }

    const isRegistro = priceId.startsWith('registro_');
    let fundador = false;
    let precoTravado: number | null = null;
    let contaOrigem: string | null = typeof origem === 'string' ? origem.slice(0, 80) : null;

    if (isRegistro) {
      if (!user) return json({ error: 'Entre na sua conta para continuar.' }, 401);
      const { data: conta } = await admin.from('contas').select('*').eq('user_id', user.id).maybeSingle();
      if (!conta) return json({ error: 'Conta não encontrada.' }, 400);
      const { data: cfg } = await admin.from('config_registro').select('*').maybeSingle();
      if (!conta.nascimento || !conta.estilo) return json({ error: 'Complete seu cadastro.' }, 400);
      if (idade(conta.nascimento) < (cfg?.idade_minima ?? 18)) return json({ error: 'Idade mínima não atingida.' }, 400);
      if (cfg?.estilos?.length && !cfg.estilos.includes(conta.estilo)) return json({ error: 'Estilo não aceito.' }, 400);
      const { data: ativo } = await admin.rpc('registro_ativo', { _conta_id: conta.id });
      const janelaFundadora = cfg?.fundador_ate ? new Date(cfg.fundador_ate) > new Date() : true;
      if (janelaFundadora && priceId !== 'registro_anual') return json({ error: 'Na Classe Fundadora só existe o registro anual.' }, 400);
      if (ativo && priceId === 'registro_mensal') return json({ error: 'Seu registro já está ativo.' }, 400);
      fundador = janelaFundadora || conta.fundador;
      if (conta.fundador && conta.fundador_preco_centavos && priceId === 'registro_anual') precoTravado = conta.fundador_preco_centavos;
      contaOrigem = conta.origem ?? contaOrigem;
    }

    const stripe = createStripeClient(env);
    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";
    const productId = typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;

    const email = user?.email ?? (typeof customerEmail === 'string' ? customerEmail : undefined);
    const customerId = (email || user) ? await resolveOrCreateCustomer(stripe, { email, userId: user?.id }) : undefined;

    let productDescription: string | undefined;
    if (!isRecurring) productDescription = (await stripe.products.retrieve(productId)).name;

    const metadata: Record<string, string> = {
      price_id: priceId,
      ...(email && { email }),
      ...(user && { userId: user.id }),
      ...(contaOrigem && { origem: contaOrigem }),
      ...(isRegistro && { tipo: 'registro', fundador: String(fundador) }),
    };

    // Fundador renova pelo preço que pagou: valor vem do banco, nunca do navegador.
    const lineItem = precoTravado
      ? { price_data: { currency: stripePrice.currency, product: productId, unit_amount: precoTravado }, quantity: 1 }
      : { price: stripePrice.id, quantity: 1 };

    const session = await stripe.checkout.sessions.create({
      line_items: [lineItem],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(customerId && { customer: customerId }),
      ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
      metadata,
      ...(isRecurring && { subscription_data: { metadata } }),
    });
    return json({ clientSecret: session.client_secret });
  } catch (e) {
    console.error('create-checkout error:', e);
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
