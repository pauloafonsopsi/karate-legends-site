import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

async function createCheckoutSession(options: {
  priceId: string;
  customerEmail?: string;
  returnUrl: string;
  environment: StripeEnv;
}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.priceId)) throw new Error("Invalid priceId");
  const stripe = createStripeClient(options.environment);

  const prices = await stripe.prices.list({ lookup_keys: [options.priceId] });
  if (!prices.data.length) throw new Error("Price not found");
  const stripePrice = prices.data[0];
  const isRecurring = stripePrice.type === "recurring";

  let customerId: string | undefined;
  if (options.customerEmail) {
    const existing = await stripe.customers.list({ email: options.customerEmail, limit: 1 });
    customerId = existing.data.length
      ? existing.data[0].id
      : (await stripe.customers.create({ email: options.customerEmail })).id;
  }

  let productDescription: string | undefined;
  if (!isRecurring) {
    const productId = typeof stripePrice.product === "string"
      ? stripePrice.product
      : stripePrice.product.id;
    const product = await stripe.products.retrieve(productId);
    productDescription = product.name;
  }

  const metadata = {
    ...(options.customerEmail && { email: options.customerEmail }),
    price_id: options.priceId,
  };

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: 1 }],
    mode: isRecurring ? "subscription" : "payment",
    ui_mode: "embedded_page",
    return_url: options.returnUrl,
    // Stripe Tax não é suportado para contas no Brasil — preços são finais (imposto incluso).
    ...(customerId && { customer: customerId }),
    ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
    metadata,
    ...(isRecurring && { subscription_data: { metadata } }),
  });

  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = await req.json();
    const { priceId, customerEmail, returnUrl, environment } = body ?? {};
    if (typeof priceId !== 'string' || typeof returnUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'priceId and returnUrl are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (environment !== 'sandbox' && environment !== 'live') {
      return new Response(JSON.stringify({ error: 'invalid environment' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const clientSecret = await createCheckoutSession({
      priceId,
      customerEmail: typeof customerEmail === 'string' ? customerEmail : undefined,
      returnUrl,
      environment,
    });
    return new Response(JSON.stringify({ clientSecret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('create-checkout error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
