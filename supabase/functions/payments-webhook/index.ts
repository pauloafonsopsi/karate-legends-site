import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

const iso = (seconds?: number | null) => (seconds ? new Date(seconds * 1000).toISOString() : null);

function priceIdOf(item: any) {
  return item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id || null;
}

async function markMember(email: string | null, status: string) {
  if (!email) return;
  await getSupabase().from("membros").update({ status }).eq("email", email);
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const email = subscription.metadata?.email ?? null;
  const item = subscription.items?.data?.[0];
  const priceId = priceIdOf(item);
  if (subscription.metadata?.tipo === "registro") await registrarMensal(subscription, env);
  await getSupabase().from("assinaturas").upsert(
    {
      email: email ?? "desconhecido",
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      price_id: priceId,
      product_id: typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id ?? null,
      status: subscription.status,
      tipo: priceId === "newsletter_mensal" ? "newsletter" : priceId === "registro_mensal" ? "registro" : "membro",
      user_id: subscription.metadata?.userId ?? null,
      origem: subscription.metadata?.origem ?? null,
      valor_centavos: item?.price?.unit_amount ?? null,
      moeda: item?.price?.currency ?? null,
      periodo_inicio: iso(item?.current_period_start ?? subscription.current_period_start),
      periodo_fim: iso(item?.current_period_end ?? subscription.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      environment: env,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (priceId === "membro_mensal") {
    const active = ["active", "trialing", "past_due"].includes(subscription.status);
    await markMember(email, active ? "ativo" : "cancelado");
  }
}

async function contaDe(userId?: string | null) {
  if (!userId) return null;
  const { data } = await getSupabase().from("contas").select("*").eq("user_id", userId).maybeSingle();
  return data as any;
}

// Registro anual pago de uma vez: soma 12 meses ao vencimento vigente.
async function registrarAnual(session: any, env: StripeEnv) {
  const conta = await contaDe(session.metadata?.userId);
  if (!conta) return;
  const db = getSupabase();
  const { data: atual } = await db.from("registros").select("vencimento").eq("conta_id", conta.id)
    .eq("status", "ativo").order("vencimento", { ascending: false }).limit(1).maybeSingle();
  const base = atual?.vencimento && new Date(atual.vencimento) > new Date() ? new Date(atual.vencimento) : new Date();
  base.setFullYear(base.getFullYear() + 1);
  const fundador = session.metadata?.fundador === "true";
  await db.from("registros").upsert({
    conta_id: conta.id, tipo: "anual", fundador, preco_centavos: session.amount_total ?? null,
    price_id: session.metadata?.price_id, stripe_ref: session.id, vencimento: base.toISOString(),
    status: "ativo", origem: session.metadata?.origem ?? null, environment: env,
  }, { onConflict: "stripe_ref" });
  if (fundador && !conta.fundador_preco_centavos) {
    await db.from("contas").update({ fundador: true, fundador_preco_centavos: session.amount_total ?? null }).eq("id", conta.id);
  }
  await db.rpc("atribuir_numero", { _conta_id: conta.id });
}

async function registrarMensal(subscription: any, env: StripeEnv) {
  const conta = await contaDe(subscription.metadata?.userId);
  if (!conta) return;
  const item = subscription.items?.data?.[0];
  const ativo = ["active", "trialing", "past_due"].includes(subscription.status);
  await getSupabase().from("registros").upsert({
    conta_id: conta.id, tipo: "mensal", fundador: false, preco_centavos: item?.price?.unit_amount ?? null,
    price_id: priceIdOf(item), stripe_ref: subscription.id,
    vencimento: iso(item?.current_period_end ?? subscription.current_period_end),
    status: ativo ? "ativo" : "encerrado", origem: subscription.metadata?.origem ?? null, environment: env,
  }, { onConflict: "stripe_ref" });
  if (ativo) await getSupabase().rpc("atribuir_numero", { _conta_id: conta.id });
}

// Taxa de aplicação paga: a aplicação entra em análise.
async function registrarAplicacao(session: any) {
  const id = session.metadata?.aplicacaoId;
  if (!id) return;
  await getSupabase().from("aplicacoes").update({
    status: "em_analise", pago_em: new Date().toISOString(), valor_centavos: session.amount_total ?? null,
    stripe_ref: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
  }).eq("id", id).eq("status", "aguardando_pagamento");
}

async function recordOneTime(session: any, env: StripeEnv) {
  if (session.metadata?.tipo === "registro") await registrarAnual(session, env);
  if (session.metadata?.tipo === "aplicacao") await registrarAplicacao(session);
  const email = session.customer_details?.email ?? session.metadata?.email ?? "desconhecido";
  await getSupabase().from("assinaturas").upsert({
    email,
    stripe_subscription_id: `ppv_${session.id}`,
    stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
    price_id: session.metadata?.price_id ?? null,
    status: "pago",
    tipo: ["registro", "aplicacao"].includes(session.metadata?.tipo) ? session.metadata.tipo : "ppv",
    user_id: session.metadata?.userId ?? null,
    origem: session.metadata?.origem ?? null,
    valor_centavos: session.amount_total ?? null,
    moeda: session.currency ?? null,
    environment: env,
  }, { onConflict: "stripe_subscription_id" });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await getSupabase()
        .from("assinaturas")
        .update({ status: "canceled", atualizado_em: new Date().toISOString() })
        .eq("stripe_subscription_id", subscription.id)
        .eq("environment", env);
      await getSupabase().from("registros").update({ status: "encerrado" }).eq("stripe_ref", subscription.id);
      await markMember(subscription.metadata?.email ?? null, "cancelado");
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "unpaid" && session.mode === "payment") {
        await recordOneTime(session, env);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await recordOneTime(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook received with invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
