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
    let user_id, email, price_id, mode, success_path, cancel_path;
    try {
      const body = await req.json();
      user_id = body.user_id;
      email = body.email;
      price_id = body.price_id;
      mode = body.mode;
      success_path = body.success_path;
      cancel_path = body.cancel_path;
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

    // Resolve named price aliases to actual Stripe price IDs from secrets
    const PRICE_ALIASES: Record<string, string | undefined> = {
      legal_consult: Deno.env.get("STRIPE_LEGAL_CONSULT_PRICE"),
      legal_full: Deno.env.get("STRIPE_LEGAL_FULL_PRICE"),
      therapy: Deno.env.get("STRIPE_THERAPY_PRICE"),
      subscription: Deno.env.get("STRIPE_PRICE_ID"),
    };
    const resolvedPrice = PRICE_ALIASES[price_id ?? ""] ?? price_id ?? Deno.env.get("STRIPE_PRICE_ID")!;
    const checkoutMode = mode === "payment" ? "payment" : (price_id && price_id !== "subscription" ? "payment" : "subscription");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: checkoutMode,
      payment_method_types: ["card"],
      line_items: [{ price: resolvedPrice, quantity: 1 }],
      success_url: `https://life-path-flow.lovable.app${success_path || "/app/assinatura"}?success=true`,
      cancel_url: `https://life-path-flow.lovable.app${cancel_path || "/app/assinatura"}?canceled=true`,
    });
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
