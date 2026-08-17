import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ========================================
// OWNER AUTHORIZATION
// ========================================

async function getAuthenticatedOwner(req) {
  const authorization =
    req.headers.get("authorization") || "";

  const accessToken = authorization.startsWith("Bearer ")
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
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user?.id) {
    const authError = new Error(
      "Your login session is invalid or expired."
    );

    authError.status = 401;
    throw authError;
  }

  const SERVEN_OWNER_USER_ID =
    "908d0bc7-6792-425b-abdb-476cd4612a71";

  if (user.id !== SERVEN_OWNER_USER_ID) {
    const forbiddenError = new Error(
      "You are not authorized to create recovery adjustments."
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
      (toSafeNumber(value) +
        Number.EPSILON) *
        100
    ) / 100
  );
}

function normalizeCategory(value) {
  const category = String(value || "")
    .trim()
    .toLowerCase();

  const allowedCategories = [
    "labor",
    "menu_pricing",
    "inventory_waste",
    "vendor_purchasing",
  ];

  return allowedCategories.includes(category)
    ? category
    : null;
}

// ========================================
// POST
// ========================================

export async function POST(req) {
  try {
    await getAuthenticatedOwner(req);

    const body = await req.json();

    const {
      sourceVerificationId,
      originalLedgerId,
      reason,
    } = body || {};

    // ========================================
    // REQUEST VALIDATION
    // ========================================

    if (!sourceVerificationId) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "Missing sourceVerificationId.",
        },
        { status: 400 }
      );
    }

    if (!originalLedgerId) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "Missing originalLedgerId.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // LOAD ORIGINAL LOCKED LEDGER
    // ========================================

    const {
      data: originalLedger,
      error: ledgerError,
    } = await supabaseAdmin
      .from("monthly_recovery_ledger")
      .select("*")
      .eq("id", originalLedgerId)
      .maybeSingle();

    if (ledgerError) {
      throw ledgerError;
    }

    if (!originalLedger) {
      return NextResponse.json(
        {
          success: false,
          status: "ledger_not_found",
          message:
            "The original monthly recovery ledger was not found.",
        },
        { status: 404 }
      );
    }

    // ========================================
    // LEDGER MUST BE FINANCIALLY LOCKED
    // ========================================

    if (
      originalLedger.status !== "locked" ||
      !originalLedger.locked_at
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "ledger_not_locked",
          message:
            "Prior-period adjustments can only be created for a financially locked recovery ledger.",
        },
        { status: 400 }
      );
    }

    if (
      !originalLedger.user_id ||
      !originalLedger.location_id
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_ledger",
          message:
            "The locked ledger is missing its client or location.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // LOAD SOURCE VERIFICATION
    //
    // The browser NEVER supplies the adjustment
    // dollar amount.
    // ========================================

    const {
      data: verification,
      error: verificationError,
    } = await supabaseAdmin
      .from("ai_action_verifications")
      .select(
        `
        id,
        action_id,
        user_id,
        location_id,
        location_name,
        recovery_category,
        verification_status,
        verified_recovery,
        verified_at,
        measurement_start,
        measurement_end
        `
      )
      .eq("id", sourceVerificationId)
      .maybeSingle();

    if (verificationError) {
      throw verificationError;
    }

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          status: "verification_not_found",
          message:
            "The source recovery verification was not found.",
        },
        { status: 404 }
      );
    }

    // ========================================
    // SOURCE MUST ALREADY BE VERIFIED
    // ========================================

    if (
      verification.verification_status !==
      "verified"
    ) {
      return NextResponse.json(
        {
          success: false,
          status:
            "verification_not_verified",
          message:
            "Only financially verified recovery can become a prior-period adjustment.",
        },
        { status: 400 }
      );
    }

    const adjustmentAmount =
      roundMoney(
        verification.verified_recovery
      );

    if (adjustmentAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          status: "no_recovery",
          message:
            "The source verification does not contain positive verified recovery.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // CLIENT + LOCATION MUST MATCH
    // ========================================

    if (
      String(verification.user_id) !==
      String(originalLedger.user_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "user_mismatch",
          message:
            "The source verification and original ledger belong to different clients.",
        },
        { status: 400 }
      );
    }

    if (
      !verification.location_id ||
      String(verification.location_id) !==
      String(originalLedger.location_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "location_mismatch",
          message:
            "The source verification and original ledger belong to different locations.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // CATEGORY SAFETY
    // ========================================

    const recoveryCategory =
      normalizeCategory(
        verification.recovery_category
      );

    if (!recoveryCategory) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_category",
          message:
            "The source verification does not have a supported recovery category.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // PERIOD SAFETY
    //
    // This is critical:
    //
    // A prior-period adjustment must represent
    // recovery belonging to the ORIGINAL locked
    // period.
    //
    // We do not let September recovery get
    // attached to August just because someone
    // passes August's ledger ID.
    // ========================================

    if (
      !verification.measurement_start ||
      !verification.measurement_end
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_verification_period",
          message:
            "The source verification does not contain a valid measurement period.",
        },
        { status: 400 }
      );
    }

    const verificationStart =
      String(
        verification.measurement_start
      );

    const verificationEnd =
      String(
        verification.measurement_end
      );

    const ledgerStart =
      String(
        originalLedger.period_start
      );

    const ledgerEnd =
      String(
        originalLedger.period_end
      );

    if (
      verificationStart < ledgerStart ||
      verificationStart > ledgerEnd
    ) {
      return NextResponse.json(
        {
          success: false,
          status:
            "verification_period_mismatch",
          message:
            "The source verification does not begin inside the original locked billing period.",
        },
        { status: 400 }
      );
    }

    if (
      verificationEnd < ledgerStart ||
      verificationEnd > ledgerEnd
    ) {
      return NextResponse.json(
        {
          success: false,
          status:
            "verification_period_mismatch",
          message:
            "The source verification does not end inside the original locked billing period.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // CHECK EXISTING ADJUSTMENT
    //
    // The unique index also protects this at
    // the database level.
    // ========================================

    const {
      data: existingAdjustment,
      error: existingError,
    } = await supabaseAdmin
      .from(
        "recovery_period_adjustments"
      )
      .select("*")
      .eq(
        "source_verification_id",
        sourceVerificationId
      )
      .eq(
        "original_ledger_id",
        originalLedgerId
      )
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingAdjustment) {
      return NextResponse.json({
        success: true,

        status:
          "already_exists",

        adjustmentId:
          existingAdjustment.id,

        originalLedgerId:
          existingAdjustment
            .original_ledger_id,

        userId:
          existingAdjustment.user_id,

        locationId:
          existingAdjustment.location_id,

        locationName:
          existingAdjustment.location_name,

        recoveryCategory:
          existingAdjustment
            .recovery_category,

        adjustmentAmount:
          roundMoney(
            existingAdjustment
              .adjustment_amount
          ),

        adjustmentStatus:
          existingAdjustment.status,

        appliedToLedgerId:
          existingAdjustment
            .applied_to_ledger_id,

        appliedAt:
          existingAdjustment.applied_at,

        message:
          "This verified recovery has already been recorded as a prior-period adjustment.",
      });
    }

    // ========================================
    // CREATE PENDING ADJUSTMENT
    //
    // IMPORTANT:
    //
    // We do NOT change:
    // - original locked ledger
    // - performance fee
    // - invoice
    // - Stripe
    //
    // The adjustment remains pending until a
    // later billing cycle explicitly absorbs it.
    // ========================================

    const now =
      new Date().toISOString();

    const adjustmentReason =
      String(reason || "").trim() ||
      `Late verified ${recoveryCategory} recovery for ${originalLedger.billing_year}-${String(
        originalLedger.billing_month
      ).padStart(2, "0")}.`;

    const {
      data: adjustment,
      error: insertError,
    } = await supabaseAdmin
      .from(
        "recovery_period_adjustments"
      )
      .insert({
        user_id:
          originalLedger.user_id,

        location_id:
          originalLedger.location_id,

        location_name:
          originalLedger.location_name ||
          verification.location_name ||
          null,

        original_ledger_id:
          originalLedger.id,

        original_billing_year:
          Number(
            originalLedger.billing_year
          ),

        original_billing_month:
          Number(
            originalLedger.billing_month
          ),

        recovery_category:
          recoveryCategory,

        adjustment_amount:
          adjustmentAmount,

        reason:
          adjustmentReason,

        source_verification_id:
          verification.id,

        status:
          "pending",

        applied_to_ledger_id:
          null,

        applied_at:
          null,

        updated_at:
          now,
      })
      .select("*")
      .single();

    if (insertError) {
      /*
        Duplicate protection.

        If two requests attempt the exact same
        adjustment simultaneously, PostgreSQL's
        unique index wins.
      */
      if (
        insertError.code === "23505"
      ) {
        const {
          data: duplicateAdjustment,
          error: duplicateError,
        } = await supabaseAdmin
          .from(
            "recovery_period_adjustments"
          )
          .select("*")
          .eq(
            "source_verification_id",
            sourceVerificationId
          )
          .eq(
            "original_ledger_id",
            originalLedgerId
          )
          .maybeSingle();

        if (duplicateError) {
          throw duplicateError;
        }

        if (duplicateAdjustment) {
          return NextResponse.json({
            success: true,

            status:
              "already_exists",

            adjustmentId:
              duplicateAdjustment.id,

            adjustmentAmount:
              roundMoney(
                duplicateAdjustment
                  .adjustment_amount
              ),

            adjustmentStatus:
              duplicateAdjustment.status,

            message:
              "This prior-period adjustment already exists.",
          });
        }
      }

      throw insertError;
    }

    // ========================================
    // FINAL RESPONSE
    // ========================================

    return NextResponse.json({
      success: true,

      status: "created",

      adjustmentId:
        adjustment.id,

      sourceVerificationId:
        verification.id,

      originalLedgerId:
        originalLedger.id,

      userId:
        adjustment.user_id,

      locationId:
        adjustment.location_id,

      locationName:
        adjustment.location_name,

      originalBillingYear:
        adjustment
          .original_billing_year,

      originalBillingMonth:
        adjustment
          .original_billing_month,

      recoveryCategory:
        adjustment.recovery_category,

      adjustmentAmount:
        roundMoney(
          adjustment.adjustment_amount
        ),

      adjustmentStatus:
        adjustment.status,

      appliedToLedgerId: null,

      originalLedgerStillLocked:
        true,

      performanceFeeCreated:
        false,

      paymentCreated:
        false,

      message:
        "Late verified recovery was recorded as a pending prior-period adjustment. The original locked ledger was not changed.",
    });
  } catch (error) {
    console.error(
      "RECOVERY ADJUSTMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        status: "error",

        message:
          error?.message ||
          "Unable to create the recovery adjustment.",
      },
      {
        status: Number(
          error?.status || 500
        ),
      }
    );
  }
}