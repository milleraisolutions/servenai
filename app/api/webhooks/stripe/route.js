import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY,
  {
    apiVersion: "2023-10-16",
  }
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ========================================
// MONEY HELPERS
// ========================================

function toSafeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function roundMoney(value) {
  return (
    Math.round(
      (
        toSafeNumber(value) +
        Number.EPSILON
      ) * 100
    ) / 100
  );
}

// ========================================
// PERFORMANCE FEE PAYMENT HANDLER
// ========================================

async function handlePerformanceFeePayment(
  session
) {
  const metadata =
    session.metadata || {};

  const performanceFeeInvoiceId =
    metadata.performanceFeeInvoiceId;

  const performanceFeeUserId =
    metadata.userId;

  const monthlyRecoveryLedgerId =
    metadata.monthlyRecoveryLedgerId;

  const metadataLocationId =
    metadata.locationId;

  // ========================================
  // REQUIRED METADATA
  // ========================================

  if (
    !performanceFeeInvoiceId ||
    !performanceFeeUserId ||
    !monthlyRecoveryLedgerId
  ) {
    console.error(
      "❌ Missing performance fee metadata:",
      {
        performanceFeeInvoiceId,
        performanceFeeUserId,
        monthlyRecoveryLedgerId,
      }
    );

    return new Response(
      "Missing performance fee metadata",
      { status: 400 }
    );
  }

  // ========================================
  // PAYMENT STATUS SAFETY
  //
  // Checkout completion alone is not enough.
  // Financial state must explicitly be paid.
  // ========================================

  if (
    session.payment_status !== "paid"
  ) {
    console.warn(
      "⚠️ PERFORMANCE FEE CHECKOUT NOT PAID:",
      {
        sessionId: session.id,
        paymentStatus:
          session.payment_status,
        invoiceId:
          performanceFeeInvoiceId,
        ledgerId:
          monthlyRecoveryLedgerId,
      }
    );

    /*
      Return 200 because the webhook itself was
      received correctly.

      We deliberately do NOT mark the invoice
      paid.
    */
    return new Response(
      "Performance fee checkout not paid",
      { status: 200 }
    );
  }

  // ========================================
  // LOAD PERFORMANCE FEE INVOICE
  // ========================================

  const {
    data: invoice,
    error: invoiceError,
  } = await supabaseAdmin
    .from(
      "performance_fee_invoices"
    )
    .select("*")
    .eq(
      "id",
      performanceFeeInvoiceId
    )
    .maybeSingle();

  if (invoiceError) {
    console.error(
      "❌ Performance fee invoice lookup failed:",
      invoiceError
    );

    return new Response(
      "Performance fee invoice lookup failed",
      { status: 500 }
    );
  }

  if (!invoice) {
    console.error(
      "❌ Performance fee invoice not found:",
      performanceFeeInvoiceId
    );

    return new Response(
      "Performance fee invoice not found",
      { status: 404 }
    );
  }

  // ========================================
  // EXACT CLIENT MATCH
  // ========================================

  if (
    String(invoice.user_id) !==
    String(performanceFeeUserId)
  ) {
    console.error(
      "❌ Performance fee user mismatch:",
      {
        invoiceUserId:
          invoice.user_id,

        metadataUserId:
          performanceFeeUserId,
      }
    );

    return new Response(
      "Performance fee user mismatch",
      { status: 409 }
    );
  }

  // ========================================
  // EXACT LEDGER MATCH
  // ========================================

  if (
    String(
      invoice
        .monthly_recovery_ledger_id ||
        ""
    ) !==
    String(
      monthlyRecoveryLedgerId
    )
  ) {
    console.error(
      "❌ Performance fee ledger mismatch:",
      {
        invoiceLedgerId:
          invoice
            .monthly_recovery_ledger_id,

        metadataLedgerId:
          monthlyRecoveryLedgerId,
      }
    );

    return new Response(
      "Performance fee ledger mismatch",
      { status: 409 }
    );
  }

  // ========================================
  // LOCATION MATCH
  // ========================================

  if (
    metadataLocationId &&
    String(
      invoice.location_id || ""
    ) !==
      String(metadataLocationId)
  ) {
    console.error(
      "❌ Performance fee location mismatch:",
      {
        invoiceLocationId:
          invoice.location_id,

        metadataLocationId,
      }
    );

    return new Response(
      "Performance fee location mismatch",
      { status: 409 }
    );
  }

  // ========================================
  // STRIPE SESSION MATCH
  //
  // The webhook must belong to the Checkout
  // session saved on this invoice.
  // ========================================

  if (
    invoice
      .stripe_checkout_session_id &&
    String(
      invoice
        .stripe_checkout_session_id
    ) !== String(session.id)
  ) {
    console.error(
      "❌ Stripe session mismatch:",
      {
        storedSessionId:
          invoice
            .stripe_checkout_session_id,

        webhookSessionId:
          session.id,
      }
    );

    return new Response(
      "Stripe session mismatch",
      { status: 409 }
    );
  }

  // ========================================
  // LOAD LOCKED RECOVERY LEDGER
  // ========================================

  const {
    data: ledger,
    error: ledgerError,
  } = await supabaseAdmin
    .from(
      "monthly_recovery_ledger"
    )
    .select("*")
    .eq(
      "id",
      monthlyRecoveryLedgerId
    )
    .maybeSingle();

  if (ledgerError) {
    console.error(
      "❌ Recovery ledger lookup failed:",
      ledgerError
    );

    return new Response(
      "Recovery ledger lookup failed",
      { status: 500 }
    );
  }

  if (!ledger) {
    console.error(
      "❌ Recovery ledger not found:",
      monthlyRecoveryLedgerId
    );

    return new Response(
      "Recovery ledger not found",
      { status: 404 }
    );
  }

  // ========================================
  // LEDGER MUST STILL BE LOCKED
  // ========================================

  if (
    ledger.status !== "locked" ||
    !ledger.locked_at
  ) {
    console.error(
      "❌ Performance fee ledger is not locked:",
      {
        ledgerId:
          ledger.id,

        status:
          ledger.status,

        lockedAt:
          ledger.locked_at,
      }
    );

    return new Response(
      "Recovery ledger is not financially locked",
      { status: 409 }
    );
  }

  // ========================================
  // LEDGER OWNERSHIP MATCH
  // ========================================

  if (
    String(ledger.user_id) !==
      String(invoice.user_id) ||
    String(ledger.location_id) !==
      String(invoice.location_id)
  ) {
    console.error(
      "❌ Invoice and ledger ownership mismatch:",
      {
        invoiceUserId:
          invoice.user_id,

        ledgerUserId:
          ledger.user_id,

        invoiceLocationId:
          invoice.location_id,

        ledgerLocationId:
          ledger.location_id,
      }
    );

    return new Response(
      "Invoice and ledger ownership mismatch",
      { status: 409 }
    );
  }

  // ========================================
  // FROZEN FINANCIAL MATCH
  //
  // Invoice amount must still match the
  // financially locked ledger.
  // ========================================

  const ledgerFeeAmount =
    roundMoney(
      ledger.performance_fee_amount
    );

  const invoiceFeeAmount =
    roundMoney(
      invoice.fee_amount
    );

  if (
    ledgerFeeAmount <= 0 ||
    invoiceFeeAmount <= 0 ||
    Math.abs(
      ledgerFeeAmount -
        invoiceFeeAmount
    ) > 0.01
  ) {
    console.error(
      "❌ Performance fee amount mismatch:",
      {
        ledgerFeeAmount,
        invoiceFeeAmount,
      }
    );

    return new Response(
      "Performance fee amount mismatch",
      { status: 409 }
    );
  }

  // ========================================
  // STRIPE CHARGED AMOUNT MATCH
  //
  // Stripe amount_total is in cents.
  // ========================================

  const expectedAmountInCents =
    Math.round(
      invoiceFeeAmount * 100
    );

  const stripeAmountInCents =
    Number(
      session.amount_total
    );

  if (
    !Number.isFinite(
      stripeAmountInCents
    ) ||
    stripeAmountInCents !==
      expectedAmountInCents
  ) {
    console.error(
      "❌ Stripe charged amount mismatch:",
      {
        expectedAmountInCents,
        stripeAmountInCents,
      }
    );

    return new Response(
      "Stripe charged amount mismatch",
      { status: 409 }
    );
  }

  // ========================================
  // CURRENCY SAFETY
  // ========================================

  if (
    String(
      session.currency || ""
    ).toLowerCase() !== "usd"
  ) {
    console.error(
      "❌ Unexpected performance fee currency:",
      session.currency
    );

    return new Response(
      "Unexpected performance fee currency",
      { status: 409 }
    );
  }

  // ========================================
  // IDEMPOTENT ALREADY-PAID HANDLING
  //
  // Stripe may deliver a webhook more than
  // once. Never rewrite the original paid_at.
  // ========================================

  if (
    invoice.status === "paid" &&
    invoice.paid_at
  ) {
    console.log(
      "✅ PERFORMANCE FEE ALREADY PAID:",
      {
        invoiceId:
          invoice.id,

        ledgerId:
          ledger.id,

        paidAt:
          invoice.paid_at,
      }
    );

    return new Response(
      "OK",
      { status: 200 }
    );
  }

  // ========================================
  // PAYMENT INTENT
  // ========================================

  const paymentIntentId =
    typeof session.payment_intent ===
    "string"
      ? session.payment_intent
      : session.payment_intent?.id ||
        null;

  const paidAt =
    new Date().toISOString();

  // ========================================
  // MARK EXACT INVOICE PAID
  //
  // Protect with:
  // - invoice ID
  // - user ID
  // - ledger ID
  // - Stripe Checkout session ID
  // ========================================

  const {
    data: paidInvoice,
    error:
      performanceFeeUpdateError,
  } = await supabaseAdmin
    .from(
      "performance_fee_invoices"
    )
    .update({
      status: "paid",

      stripe_payment_intent_id:
        paymentIntentId,

      paid_at:
        paidAt,

      updated_at:
        paidAt,
    })
    .eq(
      "id",
      invoice.id
    )
    .eq(
      "user_id",
      invoice.user_id
    )
    .eq(
      "monthly_recovery_ledger_id",
      ledger.id
    )
    .eq(
      "stripe_checkout_session_id",
      session.id
    )
    .select("*")
    .maybeSingle();

  if (
    performanceFeeUpdateError
  ) {
    console.error(
      "❌ Performance fee payment update failed:",
      performanceFeeUpdateError
    );

    return new Response(
      "Performance fee update failed",
      { status: 500 }
    );
  }

  if (!paidInvoice) {
    console.error(
      "❌ Performance fee invoice changed before payment update:",
      {
        invoiceId:
          invoice.id,

        ledgerId:
          ledger.id,

        stripeSessionId:
          session.id,
      }
    );

    return new Response(
      "Performance fee invoice changed before payment update",
      { status: 409 }
    );
  }

  console.log(
    "✅ PERFORMANCE FEE PAID:",
    {
      performanceFeeInvoiceId:
        paidInvoice.id,

      ledgerId:
        ledger.id,

      userId:
        paidInvoice.user_id,

      locationId:
        paidInvoice.location_id,

      paymentIntentId,

      feeAmount:
        paidInvoice.fee_amount,

      paidAt:
        paidInvoice.paid_at,
    }
  );

  return new Response(
    "OK",
    { status: 200 }
  );
}

// ========================================
// STRIPE WEBHOOK
// ========================================

export async function POST(req) {
  const body =
    await req.text();

  const sig =
    req.headers.get(
      "stripe-signature"
    );

  let event;

  // ========================================
  // SIGNATURE VERIFICATION
  // ========================================

  try {
    event =
      stripe.webhooks.constructEvent(
        body,
        sig,
        process.env
          .STRIPE_WEBHOOK_SECRET
      );
  } catch (err) {
    console.error(
      "❌ Webhook signature failed:",
      err.message
    );

    return new Response(
      "Webhook Error",
      { status: 400 }
    );
  }

  try {
    // ========================================
    // CHECKOUT COMPLETED
    // ========================================

    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const session =
        event.data.object;

      const paymentType =
        session.metadata
          ?.paymentType;

      // ========================================
      // PERFORMANCE FEE
      //
      // Completely separate from recurring
      // subscription billing.
      // ========================================

      if (
        paymentType ===
        "performance_fee"
      ) {
        return await handlePerformanceFeePayment(
          session
        );
      }

      // ========================================
      // RECURRING SUBSCRIPTION CHECKOUT
      //
      // Existing subscription behavior preserved.
      // ========================================

      const plan =
        session.metadata?.plan;

      const userId =
        session.metadata?.userId;

      const customerId =
        session.customer || null;

      const subscriptionId =
        session.subscription || null;

      if (!plan || !userId) {
        console.error(
          "❌ Missing metadata:",
          {
            plan,
            userId,
          }
        );

        return new Response(
          "Missing metadata",
          { status: 400 }
        );
      }

      let currentPeriodEnd =
        null;

      let subscriptionStatus =
        "active";

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(
            subscriptionId
          );

        subscriptionStatus =
          subscription.status ||
          "active";

        if (
          subscription
            .current_period_end
        ) {
          currentPeriodEnd =
            new Date(
              subscription
                .current_period_end *
                1000
            ).toISOString();
        }
      }

      const {
        error,
      } = await supabaseAdmin
        .from("users")
        .update({
          plan,

          subscription_status:
            subscriptionStatus,

          stripe_customer_id:
            customerId,

          stripe_subscription_id:
            subscriptionId,

          current_period_end:
            currentPeriodEnd,

          customer_status:
            "active",
        })
        .eq(
          "id",
          userId
        );

      if (error) {
        console.error(
          "❌ Supabase update failed:",
          error
        );

        return new Response(
          "Supabase update failed",
          { status: 500 }
        );
      }

      console.log(
        "✅ USER BILLING UPDATED:",
        {
          userId,
          plan,
          subscriptionStatus,
          customerId,
          subscriptionId,
        }
      );
    }

    // ========================================
    // SUBSCRIPTION STATUS CHANGES
    // ========================================

    if (
      event.type ===
        "customer.subscription.updated" ||
      event.type ===
        "customer.subscription.deleted"
    ) {
      const subscription =
        event.data.object;

      const customerId =
        subscription.customer;

      const subscriptionId =
        subscription.id;

      const subscriptionStatus =
        subscription.status;

      const currentPeriodEnd =
        subscription
          .current_period_end
          ? new Date(
              subscription
                .current_period_end *
                1000
            ).toISOString()
          : null;

      const updates = {
        subscription_status:
          subscriptionStatus,

        stripe_subscription_id:
          subscriptionId,

        current_period_end:
          currentPeriodEnd,
      };

      if (
        event.type ===
          "customer.subscription.deleted" ||
        [
          "canceled",
          "unpaid",
        ].includes(
          subscriptionStatus
        )
      ) {
        updates.plan = "none";

        updates.customer_status =
          "cancelled";
      }

      const {
        error,
      } = await supabaseAdmin
        .from("users")
        .update(updates)
        .eq(
          "stripe_customer_id",
          customerId
        );

      if (error) {
        console.error(
          "❌ Subscription sync failed:",
          error
        );

        return new Response(
          "Subscription sync failed",
          { status: 500 }
        );
      }

      console.log(
        "✅ SUBSCRIPTION STATUS UPDATED:",
        {
          customerId,
          subscriptionId,
          subscriptionStatus,
        }
      );
    }

    return new Response(
      "OK",
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "❌ Webhook handler failed:",
      error
    );

    return new Response(
      "Webhook handler failed",
      { status: 500 }
    );
  }
}