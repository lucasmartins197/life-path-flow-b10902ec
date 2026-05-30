import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { coupon_id } = await req.json();
    if (!coupon_id || typeof coupon_id !== "string") {
      return new Response(JSON.stringify({ valid: false, error: "Missing coupon_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    const res = await fetch(`https://api.stripe.com/v1/coupons/${encodeURIComponent(coupon_id)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await res.json();
    if (!res.ok || data?.error) {
      return new Response(JSON.stringify({ valid: false, error: data?.error?.message || "Cupom inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (data.valid === false) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom expirado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({
      valid: true,
      coupon: {
        id: data.id,
        percent_off: data.percent_off,
        amount_off: data.amount_off,
        currency: data.currency,
        name: data.name,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ valid: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
