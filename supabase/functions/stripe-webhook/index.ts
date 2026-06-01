import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";

serve(async (req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // If STRIPE_WEBHOOK_SECRET is set, verify signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const userId = (session.metadata?.user_id as string) || (session.client_reference_id as string) || null;
      const priceId = (session.metadata?.price_id as string) || null;

      if (session.mode === "subscription") {
        let subscriptionEnd: string | null = null;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
        }
        const updatePayload = {
          subscription_status: "active",
          stripe_customer_id: customerId,
          subscription_end: subscriptionEnd,
        };
        // Prefer matching by user_id (reliable on first checkout), fallback to customer_id
        if (userId) {
          await supabase.from("profiles").update(updatePayload).eq("user_id", userId);
        } else {
          await supabase.from("profiles").update(updatePayload).eq("stripe_customer_id", customerId);
        }
      } else if (session.mode === "payment" && userId) {
        // Map known price IDs to payment_type
        const THERAPY_PRICE = "price_1Ta1mr0oEfdN4xGLFJVZsmDT";
        const LEGAL_PRICE = "price_1Ta1p00oEfdN4xGLiElxDceu";
        let payment_type = "other";
        if (priceId === THERAPY_PRICE) payment_type = "therapy";
        else if (priceId === LEGAL_PRICE) payment_type = "legal";

        const amount = (session.amount_total ?? 0) / 100;
        await supabase.from("payments").insert({
          user_id: userId,
          payment_type,
          amount,
          status: "completed",
          stripe_payment_id: session.id,
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await supabase
        .from("profiles")
        .update({
          subscription_status: "inactive",
          subscription_end: null,
        })
        .eq("stripe_customer_id", customerId);
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status === "active" ? "active" : "inactive";

      await supabase
        .from("profiles")
        .update({
          subscription_status: status,
          subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_customer_id", customerId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
