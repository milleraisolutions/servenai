import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      userId,
      clientEmail,
      restaurantName,
      billingPeriod,
      verifiedRecovery,
    } = body;

    // ========================================================
    // VALIDATION
    // ========================================================
    if (!userId) {
      return Response.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    if (!clientEmail) {
      return Response.json(
        { error: "Missing clientEmail" },
        { status: 400 }
      );
    }

    const recoveryAmount = Number(verifiedRecovery);

    if (
      !Number.isFinite(recoveryAmount) ||
      recoveryAmount <= 0
    ) {
      return Response.json(
        { error: "Verified recovery must be greater than 0" },
        { status: 400 }
      );
    }

    // ========================================================
    // SERVER-SIDE PERFORMANCE FEE CALCULATION
    // Never trust the browser to send the fee amount.
    // ========================================================
    const feePercentage = 15;

    const feeAmount =
      Math.round(recoveryAmount * 0.15 * 100) / 100;

    const amountInCents = Math.round(feeAmount * 100);

    if (amountInCents <= 0) {
      return Response.json(
        { error: "Calculated performance fee is invalid" },
        { status: 400 }
      );
    }

    // ========================================================
    // CREATE DRAFT DATABASE RECORD FIRST
    // ========================================================
    const { data: invoiceRecord, error: invoiceError } =
      await supabaseAdmin
        .from("performance_fee_invoices")
        .insert({
          user_id: userId,
          client_email: clientEmail,
          restaurant_name:
            restaurantName || "Restaurant",
          billing_period: billingPeriod || null,
          verified_recovery: recoveryAmount,
          fee_percentage: feePercentage,
          fee_amount: feeAmount,
          status: "draft",
        })
        .select()
        .single();

    if (invoiceError) {
      console.error(
        "PERFORMANCE FEE DATABASE ERROR:",
        invoiceError
      );

      return Response.json(
        {
          error:
            invoiceError.message ||
            "Failed to create performance fee record",
        },
        { status: 500 }
      );
    }

    // ========================================================
    // CREATE ONE-TIME STRIPE CHECKOUT
    // ========================================================
    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        payment_method_types: ["card"],

        customer_email: clientEmail,

        client_reference_id: userId,

        line_items: [
          {
            price_data: {
              currency: "usd",

              product_data: {
                name: "SerVen Performance Fee",

                description: billingPeriod
                  ? `15% performance fee on verified profit recovery for ${billingPeriod}`
                  : "15% performance fee on verified profit recovery",
              },

              unit_amount: amountInCents,
            },

            quantity: 1,
          },
        ],

        success_url:
          `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?performance_fee=paid`,

        cancel_url:
          `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?performance_fee=cancelled`,

        metadata: {
          paymentType: "performance_fee",
          performanceFeeInvoiceId:
            invoiceRecord.id,
          userId,
          billingPeriod:
            billingPeriod || "",
          verifiedRecovery:
            String(recoveryAmount),
          feePercentage:
            String(feePercentage),
          feeAmount:
            String(feeAmount),
        },
      });

    // ========================================================
    // SAVE STRIPE SESSION
    // ========================================================
    const { error: updateError } =
      await supabaseAdmin
        .from("performance_fee_invoices")
        .update({
          stripe_checkout_session_id:
            session.id,
          stripe_checkout_url:
            session.url,
          status: "ready",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", invoiceRecord.id);

    if (updateError) {
      console.error(
        "PERFORMANCE FEE SESSION SAVE ERROR:",
        updateError
      );

      return Response.json(
        {
          error:
            updateError.message ||
            "Stripe checkout created but failed to save",
        },
        { status: 500 }
      );
    }

    console.log(
      "PERFORMANCE FEE CHECKOUT CREATED:",
      {
        invoiceId: invoiceRecord.id,
        userId,
        verifiedRecovery:
          recoveryAmount,
        feeAmount,
        stripeSessionId:
          session.id,
      }
    );

    return Response.json({
      success: true,
      invoiceId:
        invoiceRecord.id,
      verifiedRecovery:
        recoveryAmount,
      feePercentage,
      feeAmount,
      checkoutUrl:
        session.url,
    });
  } catch (error) {
    console.error(
      "PERFORMANCE FEE API ERROR:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Failed to create performance fee checkout",
      },
      { status: 500 }
    );
  }
}