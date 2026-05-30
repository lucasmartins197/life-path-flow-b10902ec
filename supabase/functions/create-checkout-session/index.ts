import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    let user_id, email, price_id, mode, success_path, cancel_path, coupon_id;
    try {
      const body = await req.json();
      user_id = body.user_id;
      email = body.email;
      price_id = body.price_id;
      mode = body.mode;
      success_path = body.success_path;
      cancel_path = body.cancel_path;
      coupon_id = body.coupon_id;
    } catch(e) {
      user_id = null;
      email = null;
    }

    if (!user_id || !email) {
      return new Response(JSON.stringify({ error: "Missing user_id or email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aliases nomeados para conveniência (frontend pode mandar "therapy", "legal_consult"...)
    const PRICE_ALIASES: Record<string, string | undefined> = {
      legal_consult: Deno.env.get("STRIPE_LEGAL_CONSULT_PRICE"),
      legal_full: Deno.env.get("STRIPE_LEGAL_FULL_PRICE"),
      therapy: Deno.env.get("STRIPE_THERAPY_PRICE"),
      subscription: Deno.env.get("STRIPE_PRICE_ID"),
    };
    // Se vier price_id no body e for um ID real do Stripe (price_...), usar direto.
    // Se for um alias conhecido, resolver via secret. Caso contrário, fallback STRIPE_PRICE_ID.
    let resolvedPrice: string | undefined;
    if (price_id && typeof price_id === "string" && price_id.startsWith("price_")) {
      resolvedPrice = price_id;
    } else if (price_id && PRICE_ALIASES[price_id]) {
      resolvedPrice = PRICE_ALIASES[price_id];
    } else {
      resolvedPrice = Deno.env.get("STRIPE_PRICE_ID");
    }
    if (!resolvedPrice) {
      return new Response(JSON.stringify({ error: "No price_id resolved" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const checkoutMode = mode === "payment" ? "payment" : (price_id && price_id !== "subscription" ? "payment" : "subscription");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
    const sessionParams: any = {
      customer_email: email,
      mode: checkoutMode,
      payment_method_types: ["card"],
      line_items: [{ price: resolvedPrice, quantity: 1 }],
      success_url: `https://life-path-flow.lovable.app${success_path || "/app/assinatura"}?success=true`,
      cancel_url: `https://life-path-flow.lovable.app${cancel_path || "/app/assinatura"}?canceled=true`,
      client_reference_id: user_id,
      metadata: { user_id, price_id: resolvedPrice },
    };
    if (coupon_id) {
      sessionParams.discounts = [{ coupon: coupon_id }];
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
