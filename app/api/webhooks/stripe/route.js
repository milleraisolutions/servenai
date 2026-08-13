import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature failed:", err.message);
    return new Response("Webhook Error", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
    // ========================================================
    // PERFORMANCE FEE PAYMENT
    // Separate from recurring subscription billing
    // ========================================================
    const paymentType = session.metadata?.paymentType;

    if (paymentType === "performance_fee") {
      const performanceFeeInvoiceId =
        session.metadata?.performanceFeeInvoiceId;

      const performanceFeeUserId =
        session.metadata?.userId;

      if (!performanceFeeInvoiceId || !performanceFeeUserId) {
        console.error("❌ Missing performance fee metadata:", {
          performanceFeeInvoiceId,
          performanceFeeUserId,
        });

        return new Response(
          "Missing performance fee metadata",
          { status: 400 }
        );
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

      const { error: performanceFeeError } =
        await supabaseAdmin
          .from("performance_fee_invoices")
          .update({
            status: "paid",
            stripe_payment_intent_id: paymentIntentId,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", performanceFeeInvoiceId)
          .eq("user_id", performanceFeeUserId);

      if (performanceFeeError) {
        console.error(
          "❌ Performance fee payment update failed:",
          performanceFeeError
        );

        return new Response(
          "Performance fee update failed",
          { status: 500 }
        );
      }

      console.log("✅ PERFORMANCE FEE PAID:", {
        performanceFeeInvoiceId,
        userId: performanceFeeUserId,
        paymentIntentId,
      });

      return new Response("OK", { status: 200 });
    }

    const plan = session.metadata?.plan;
      
      const userId = session.metadata?.userId;
      const customerId = session.customer || null;
      const subscriptionId = session.subscription || null;

      if (!plan || !userId) {
        console.error("❌ Missing metadata:", { plan, userId });
        return new Response("Missing metadata", { status: 400 });
      }

      let currentPeriodEnd = null;
      let subscriptionStatus = "active";

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        subscriptionStatus = subscription.status || "active";

        if (subscription.current_period_end) {
          currentPeriodEnd = new Date(
            subscription.current_period_end * 1000
          ).toISOString();
        }
      }

      const { error } = await supabaseAdmin
        .from("users")
        .update({
          plan,
          subscription_status: subscriptionStatus,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          current_period_end: currentPeriodEnd,
          customer_status: "active",
        })
        .eq("id", userId);

      if (error) {
        console.error("❌ Supabase update failed:", error);
        return new Response("Supabase update failed", { status: 500 });
      }

      console.log("✅ USER BILLING UPDATED:", {
        userId,
        plan,
        subscriptionStatus,
        customerId,
        subscriptionId,
      });
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;

      const customerId = subscription.customer;
      const subscriptionId = subscription.id;
      const subscriptionStatus = subscription.status;
      const currentPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      const updates = {
        subscription_status: subscriptionStatus,
        stripe_subscription_id: subscriptionId,
        current_period_end: currentPeriodEnd,
      };

      if (
        event.type === "customer.subscription.deleted" ||
        ["canceled", "unpaid"].includes(subscriptionStatus)
      ) {
        updates.plan = "none";
        updates.customer_status = "cancelled";
      }

      const { error } = await supabaseAdmin
        .from("users")
        .update(updates)
        .eq("stripe_customer_id", customerId);

      if (error) {
        console.error("❌ Subscription sync failed:", error);
        return new Response("Subscription sync failed", { status: 500 });
      }

      console.log("✅ SUBSCRIPTION STATUS UPDATED:", {
        customerId,
        subscriptionId,
        subscriptionStatus,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook handler failed:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }
}