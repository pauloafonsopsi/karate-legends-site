import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { lerOrigem } from "@/lib/origem";

interface StripeEmbeddedCheckoutProps {
  priceId: string;
  customerEmail?: string;
  returnUrl?: string;
  aplicacaoId?: string;
}

export function StripeEmbeddedCheckout({ priceId, returnUrl, aplicacaoId }: StripeEmbeddedCheckoutProps) {
  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        aplicacaoId,
        returnUrl: returnUrl ?? `${window.location.origin}/checkout/retorno?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
        origem: lerOrigem().origem,
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Failed to create checkout session");
    }
    return data.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
