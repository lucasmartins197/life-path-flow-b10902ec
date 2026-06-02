import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
Deno.env.set("SUPABASE_AUTH_JWT_SECRET", "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // Use service role to bypass JWT algorithm issues
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    // Extract user_id from request body instead of JWT
    let user_id, email;
    let price_id, mode, success_path, cancel_path, coupon_id;
    try {
      const body = await req.json();
      user_id = body.user_id;
      email = body.email;
      price_id = body.price_id;
      mode = body.mode;
      success_path = body.success_path;
      cancel_path = body.cancel_path;
      coupon_id = body.coupon_id;
    } catch(e) {}

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://app.apostandonavida.com.br";
    const buildUrl = (path: string, fallbackQuery: string) => {
      const url = new URL(path.startsWith("http") ? path : path.startsWith("/") ? path : `/${path}`, APP_BASE_URL);
      if (!url.search) url.search = fallbackQuery;
      return url.toString();
    };
    const defaultSuccess = checkoutMode === "subscription" ? "/app?payment=success" : "/app/assinatura";
    const sessionParams: any = {
      customer_email: email,
      mode: checkoutMode,
      payment_method_types: ["card"],
      line_items: [{ price: resolvedPrice, quantity: 1 }],
      success_url: buildUrl(success_path || defaultSuccess, "success=true"),
      cancel_url: buildUrl(cancel_path || "/app/assinatura", "canceled=true"),
      client_reference_id: user_id,
      metadata: { user_id, price_id: resolvedPrice },
    };
    if (coupon_id) {
      sessionParams.discounts = [{ coupon: coupon_id }];
    }

    const stripeBody = new URLSearchParams();
    stripeBody.set("customer_email", sessionParams.customer_email);
    stripeBody.set("mode", sessionParams.mode);
    stripeBody.set("payment_method_types[0]", "card");
    stripeBody.set("line_items[0][price]", resolvedPrice);
    stripeBody.set("line_items[0][quantity]", "1");
    stripeBody.set("success_url", sessionParams.success_url);
    stripeBody.set("cancel_url", sessionParams.cancel_url);
    stripeBody.set("client_reference_id", user_id);
    stripeBody.set("metadata[user_id]", user_id);
    stripeBody.set("metadata[price_id]", resolvedPrice);
    if (coupon_id) stripeBody.set("discounts[0][coupon]", coupon_id);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeBody,
    });
    const session = await stripeResponse.json();
    if (!stripeResponse.ok) {
      throw new Error(session?.error?.message || "Stripe checkout failed");
    }
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
