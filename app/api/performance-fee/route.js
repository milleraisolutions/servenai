import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing"
  );
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing"
  );
}

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is missing"
  );
}

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
// AUTHENTICATE SERVEN OWNER
// ========================================

async function getAuthenticatedOwner(req) {
  const authorization =
    req.headers.get("authorization") || "";

  const accessToken =
    authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

  if (!accessToken) {
    const error = new Error(
      "Missing authentication token."
    );

    error.status = 401;
    throw error;
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(
    accessToken
  );

  if (error || !user?.id) {
    const authError = new Error(
      "Your login session is invalid or expired."
    );

    authError.status = 401;
    throw authError;
  }

  const SERVEN_OWNER_USER_ID =
    "908d0bc7-6792-425b-abdb-476cd4612a71";

  if (
    user.id !== SERVEN_OWNER_USER_ID
  ) {
    const forbiddenError = new Error(
      "You are not authorized to create performance fee requests."
    );

    forbiddenError.status = 403;
    throw forbiddenError;
  }

  return user;
}

// ========================================
// HELPERS
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

function getBillingPeriodLabel(
  billingYear,
  billingMonth
) {
  const year =
    Number(billingYear);

  const month =
    Number(billingMonth);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      1
    )
  );

  return date.toLocaleString(
    "en-US",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  );
}

// ========================================
// POST
// ========================================

export async function POST(req) {
  try {
    await getAuthenticatedOwner(req);

    const body = await req.json();

    const {
      ledgerId,
    } = body || {};

    // ========================================
    // REQUEST VALIDATION
    //
    // The browser supplies ONLY the ledger ID.
    //
    // It does NOT supply:
    // - recovery dollars
    // - fee amount
    // - client ID
    // - location
    // - billing period
    // ========================================

    if (!ledgerId) {
      return Response.json(
        {
          success: false,
          status: "invalid_request",
          error: "Missing ledgerId",
        },
        { status: 400 }
      );
    }

    // ========================================
    // LOAD LOCKED LEDGER
    // ========================================

    const {
      data: ledger,
      error: ledgerError,
    } = await supabaseAdmin
      .from(
        "monthly_recovery_ledger"
      )
      .select("*")
      .eq("id", ledgerId)
      .maybeSingle();

    if (ledgerError) {
      throw ledgerError;
    }

    if (!ledger) {
      return Response.json(
        {
          success: false,
          status: "ledger_not_found",
          error:
            "Monthly recovery ledger was not found.",
        },
        { status: 404 }
      );
    }

    // ========================================
    // FINANCIAL LOCK SAFETY
    // ========================================

    if (
      ledger.status !== "locked" ||
      !ledger.locked_at
    ) {
      return Response.json(
        {
          success: false,
          status:
            "ledger_not_locked",
          error:
            "Performance fee checkout can only be created from a financially locked recovery ledger.",
        },
        { status: 409 }
      );
    }

    if (
      !ledger.user_id ||
      !ledger.location_id
    ) {
      return Response.json(
        {
          success: false,
          status:
            "invalid_ledger",
          error:
            "The locked ledger is missing its client or location.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // READ FROZEN FINANCIAL VALUES
    //
    // We do NOT recalculate the recovery amount
    // from browser input.
    // ========================================

    const currentPeriodRecovery =
      roundMoney(
        ledger.total_verified_recovery
      );

    const priorPeriodAdjustments =
      roundMoney(
        ledger
          .prior_period_adjustment_recovery
      );

    const billableRecoveryTotal =
      roundMoney(
        ledger.billable_recovery_total
      );

    const feePercentage =
      toSafeNumber(
        ledger
          .performance_fee_percentage
      );

    const feeAmount =
      roundMoney(
        ledger.performance_fee_amount
      );

    // ========================================
    // FROZEN VALUE VALIDATION
    // ========================================

    if (
      currentPeriodRecovery < 0 ||
      priorPeriodAdjustments < 0 ||
      billableRecoveryTotal <= 0 ||
      feeAmount <= 0
    ) {
      return Response.json(
        {
          success: false,
          status:
            "nothing_to_bill",
          error:
            "This locked ledger does not contain a positive billable performance fee.",
        },
        { status: 400 }
      );
    }

    if (feePercentage !== 15) {
      return Response.json(
        {
          success: false,
          status:
            "invalid_fee_percentage",
          error:
            "The locked ledger does not contain the expected 15% performance fee.",
        },
        { status: 409 }
      );
    }

    // ========================================
    // INTERNAL CONSISTENCY CHECK
    //
    // This is validation only.
    //
    // Stripe still uses the frozen ledger's
    // performance_fee_amount.
    // ========================================

    const expectedBillableRecovery =
      roundMoney(
        currentPeriodRecovery +
          priorPeriodAdjustments
      );

    if (
      Math.abs(
        expectedBillableRecovery -
          billableRecoveryTotal
      ) > 0.01
    ) {
      return Response.json(
        {
          success: false,
          status:
            "ledger_total_mismatch",
          error:
            "The locked ledger's billable recovery total does not match its recovery components.",
        },
        { status: 409 }
      );
    }

    const expectedFeeAmount =
      roundMoney(
        billableRecoveryTotal * 0.15
      );

    if (
      Math.abs(
        expectedFeeAmount -
          feeAmount
      ) > 0.01
    ) {
      return Response.json(
        {
          success: false,
          status:
            "ledger_fee_mismatch",
          error:
            "The locked ledger's performance fee does not match its frozen billable recovery total.",
        },
        { status: 409 }
      );
    }

    const amountInCents =
      Math.round(
        feeAmount * 100
      );

    if (amountInCents <= 0) {
      return Response.json(
        {
          success: false,
          status:
            "invalid_fee_amount",
          error:
            "The frozen performance fee is invalid.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // BILLING PERIOD
    // ========================================

    const billingPeriod =
      getBillingPeriodLabel(
        ledger.billing_year,
        ledger.billing_month
      );

    if (!billingPeriod) {
      return Response.json(
        {
          success: false,
          status:
            "invalid_billing_period",
          error:
            "The locked ledger contains an invalid billing period.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // LOAD CLIENT EMAIL
    //
    // Email is derived server-side from users.
    // ========================================

    const {
      data: client,
      error: clientError,
    } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq(
        "id",
        ledger.user_id
      )
      .maybeSingle();

    if (clientError) {
      throw clientError;
    }

    if (
      !client?.id ||
      !client?.email
    ) {
      return Response.json(
        {
          success: false,
          status:
            "client_email_missing",
          error:
            "The client account does not have a billing email.",
        },
        { status: 400 }
      );
    }

    const clientEmail =
      String(client.email)
        .trim();

    const locationName =
      ledger.location_name ||
      "Restaurant Location";

    const restaurantName =
      locationName;

    // ========================================
    // CHECK FOR EXISTING INVOICE
    //
    // One locked ledger =
    // maximum one standard performance fee
    // invoice.
    // ========================================

    const {
      data: existingInvoice,
      error: existingInvoiceError,
    } = await supabaseAdmin
      .from(
        "performance_fee_invoices"
      )
      .select("*")
      .eq(
        "monthly_recovery_ledger_id",
        ledger.id
      )
      .maybeSingle();

    if (existingInvoiceError) {
      throw existingInvoiceError;
    }

    // ========================================
    // ALREADY PAID
    // ========================================

    if (
      existingInvoice?.status ===
        "paid"
    ) {
      return Response.json({
        success: true,
        status: "already_paid",

        invoiceId:
          existingInvoice.id,

        ledgerId:
          ledger.id,

        userId:
          ledger.user_id,

        locationId:
          ledger.location_id,

        locationName,

        billingPeriod,

        currentPeriodRecovery,

        priorPeriodAdjustments,

        billableRecoveryTotal,

        feePercentage,

        feeAmount,

        paidAt:
          existingInvoice.paid_at,

        checkoutUrl: null,

        message:
          "This performance fee has already been paid.",
      });
    }

    // ========================================
    // EXISTING READY CHECKOUT
    //
    // Reuse it instead of creating another
    // Stripe session.
    // ========================================

    if (
      existingInvoice?.stripe_checkout_url &&
      existingInvoice
        ?.stripe_checkout_session_id &&
      (
        existingInvoice.status ===
          "ready" ||
        existingInvoice.status ===
          "sent"
      )
    ) {
      return Response.json({
        success: true,

        status:
          "already_ready",

        invoiceId:
          existingInvoice.id,

        ledgerId:
          ledger.id,

        userId:
          ledger.user_id,

        locationId:
          ledger.location_id,

        locationName,

        billingPeriod,

        currentPeriodRecovery,

        priorPeriodAdjustments,

        billableRecoveryTotal,

        feePercentage,

        feeAmount,

        checkoutUrl:
          existingInvoice
            .stripe_checkout_url,

        message:
          "A payment request already exists for this locked recovery ledger.",
      });
    }

    // ========================================
    // CREATE OR REUSE DRAFT INVOICE
    // ========================================

    let invoiceRecord =
      existingInvoice || null;

    if (!invoiceRecord) {
      const {
        data: createdInvoice,
        error: invoiceError,
      } = await supabaseAdmin
        .from(
          "performance_fee_invoices"
        )
        .insert({
          user_id:
            ledger.user_id,

          client_email:
            clientEmail,

          restaurant_name:
            restaurantName,

          billing_period:
            billingPeriod,

          monthly_recovery_ledger_id:
            ledger.id,

          location_id:
            ledger.location_id,

          location_name:
            locationName,

          verified_recovery:
            billableRecoveryTotal,

          fee_percentage:
            feePercentage,

          fee_amount:
            feeAmount,

          status: "draft",
        })
        .select("*")
        .single();

      if (invoiceError) {
        /*
          Database-level duplicate protection.

          If two requests race, the unique ledger
          index prevents a second invoice.
        */
        if (
          invoiceError.code === "23505"
        ) {
          const {
            data: duplicateInvoice,
            error: duplicateError,
          } = await supabaseAdmin
            .from(
              "performance_fee_invoices"
            )
            .select("*")
            .eq(
              "monthly_recovery_ledger_id",
              ledger.id
            )
            .maybeSingle();

          if (duplicateError) {
            throw duplicateError;
          }

          if (!duplicateInvoice) {
            throw invoiceError;
          }

          invoiceRecord =
            duplicateInvoice;
        } else {
          throw invoiceError;
        }
      } else {
        invoiceRecord =
          createdInvoice;
      }
    }

    if (!invoiceRecord?.id) {
      throw new Error(
        "Unable to establish a performance fee invoice record."
      );
    }

    // ========================================
    // EXISTING SESSION RECHECK
    //
    // This handles a concurrent request that
    // created the invoice/session first.
    // ========================================

    if (
      invoiceRecord
        .stripe_checkout_url &&
      invoiceRecord
        .stripe_checkout_session_id
    ) {
      return Response.json({
        success: true,

        status:
          invoiceRecord.status ||
          "ready",

        invoiceId:
          invoiceRecord.id,

        ledgerId:
          ledger.id,

        userId:
          ledger.user_id,

        locationId:
          ledger.location_id,

        locationName,

        billingPeriod,

        currentPeriodRecovery,

        priorPeriodAdjustments,

        billableRecoveryTotal,

        feePercentage,

        feeAmount,

        checkoutUrl:
          invoiceRecord
            .stripe_checkout_url,

        message:
          "A payment request already exists for this locked recovery ledger.",
      });
    }

    // ========================================
    // CREATE ONE-TIME STRIPE CHECKOUT
    //
    // Stripe uses the FROZEN fee amount from
    // the locked ledger.
    // ========================================

    const session =
      await stripe.checkout.sessions.create(
        {
          mode: "payment",

          payment_method_types: [
            "card",
          ],

          customer_email:
            clientEmail,

          client_reference_id:
            String(
              ledger.user_id
            ),

          line_items: [
            {
              price_data: {
                currency: "usd",

                product_data: {
                  name:
                    "SerVen Performance Fee",

                  description:
                    `15% performance fee on $${billableRecoveryTotal.toFixed(
                      2
                    )} of verified profit recovery for ${locationName} — ${billingPeriod}`,
                },

                unit_amount:
                  amountInCents,
              },

              quantity: 1,
            },
          ],

          success_url:
            `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?performance_fee=paid`,

          cancel_url:
            `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?performance_fee=cancelled`,

          metadata: {
            paymentType:
              "performance_fee",

            performanceFeeInvoiceId:
              String(
                invoiceRecord.id
              ),

            monthlyRecoveryLedgerId:
              String(
                ledger.id
              ),

            userId:
              String(
                ledger.user_id
              ),

            locationId:
              String(
                ledger.location_id
              ),

            locationName:
              String(
                locationName
              ),

            billingPeriod:
              String(
                billingPeriod
              ),

            currentPeriodRecovery:
              String(
                currentPeriodRecovery
              ),

            priorPeriodAdjustments:
              String(
                priorPeriodAdjustments
              ),

            billableRecoveryTotal:
              String(
                billableRecoveryTotal
              ),

            feePercentage:
              String(
                feePercentage
              ),

            feeAmount:
              String(
                feeAmount
              ),
          },
        },
        {
          idempotencyKey:
            `performance-fee-${invoiceRecord.id}`,
        }
      );

    if (
      !session?.id ||
      !session?.url
    ) {
      throw new Error(
        "Stripe did not return a valid Checkout session."
      );
    }

    // ========================================
    // SAVE STRIPE SESSION
    // ========================================

    const {
      data: readyInvoice,
      error: updateError,
    } = await supabaseAdmin
      .from(
        "performance_fee_invoices"
      )
      .update({
        client_email:
          clientEmail,

        restaurant_name:
          restaurantName,

        billing_period:
          billingPeriod,

        monthly_recovery_ledger_id:
          ledger.id,

        location_id:
          ledger.location_id,

        location_name:
          locationName,

        verified_recovery:
          billableRecoveryTotal,

        fee_percentage:
          feePercentage,

        fee_amount:
          feeAmount,

        stripe_checkout_session_id:
          session.id,

        stripe_checkout_url:
          session.url,

        status: "ready",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        invoiceRecord.id
      )
      .eq(
        "monthly_recovery_ledger_id",
        ledger.id
      )
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    // ========================================
    // FINAL RESPONSE
    // ========================================

    console.log(
      "PERFORMANCE FEE CHECKOUT CREATED:",
      {
        invoiceId:
          readyInvoice.id,

        ledgerId:
          ledger.id,

        userId:
          ledger.user_id,

        locationId:
          ledger.location_id,

        billingPeriod,

        billableRecoveryTotal,

        feeAmount,

        stripeSessionId:
          session.id,
      }
    );

    return Response.json({
      success: true,

      status: "ready",

      invoiceId:
        readyInvoice.id,

      ledgerId:
        ledger.id,

      userId:
        ledger.user_id,

      locationId:
        ledger.location_id,

      locationName,

      billingPeriod,

      periodStart:
        ledger.period_start,

      periodEnd:
        ledger.period_end,

      currentPeriodRecovery,

      priorPeriodAdjustments,

      billableRecoveryTotal,

      feePercentage,

      feeAmount,

      checkoutUrl:
        session.url,

      message:
        "Performance fee payment request was created from the locked recovery ledger.",
    });
  } catch (error) {
    console.error(
      "PERFORMANCE FEE API ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        status: "error",

        error:
          error?.message ||
          "Failed to create performance fee checkout",
      },
      {
        status: Number(
          error?.status || 500
        ),
      }
    );
  }
}