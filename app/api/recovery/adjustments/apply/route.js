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
      "You are not authorized to apply recovery adjustments."
    );

    forbiddenError.status = 403;
    throw forbiddenError;
  }

  return user;
}

function roundMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return (
    Math.round(
      (number + Number.EPSILON) * 100
    ) / 100
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
      adjustmentId,
      targetLedgerId,
    } = body || {};

    if (!adjustmentId) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "Missing adjustmentId.",
        },
        { status: 400 }
      );
    }

    if (!targetLedgerId) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "Missing targetLedgerId.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // PRE-CHECK ADJUSTMENT
    // ========================================

    const {
      data: adjustment,
      error: adjustmentError,
    } = await supabaseAdmin
      .from(
        "recovery_period_adjustments"
      )
      .select(
        `
        id,
        user_id,
        location_id,
        location_name,
        original_ledger_id,
        original_billing_year,
        original_billing_month,
        recovery_category,
        adjustment_amount,
        status,
        applied_to_ledger_id,
        applied_at
        `
      )
      .eq("id", adjustmentId)
      .maybeSingle();

    if (adjustmentError) {
      throw adjustmentError;
    }

    if (!adjustment) {
      return NextResponse.json(
        {
          success: false,
          status:
            "adjustment_not_found",
          message:
            "Recovery adjustment was not found.",
        },
        { status: 404 }
      );
    }

    // ========================================
    // IDEMPOTENT RETURN
    // ========================================

    if (
      adjustment.status === "applied"
    ) {
      if (
        String(
          adjustment.applied_to_ledger_id ||
            ""
        ) !==
        String(targetLedgerId)
      ) {
        return NextResponse.json(
          {
            success: false,
            status:
              "already_applied_elsewhere",
            message:
              "This recovery adjustment has already been applied to another billing period.",
          },
          { status: 409 }
        );
      }
    } else if (
      adjustment.status !== "pending"
    ) {
      return NextResponse.json(
        {
          success: false,
          status:
            "invalid_adjustment_status",
          message:
            "Only pending recovery adjustments can be applied.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // PRE-CHECK TARGET LEDGER
    // ========================================

    const {
      data: targetLedger,
      error: ledgerError,
    } = await supabaseAdmin
      .from("monthly_recovery_ledger")
      .select(
        `
        id,
        user_id,
        location_id,
        location_name,
        billing_year,
        billing_month,
        period_start,
        period_end,
        total_verified_recovery,
        prior_period_adjustment_recovery,
        billable_recovery_total,
        status,
        locked_at
        `
      )
      .eq("id", targetLedgerId)
      .maybeSingle();

    if (ledgerError) {
      throw ledgerError;
    }

    if (!targetLedger) {
      return NextResponse.json(
        {
          success: false,
          status:
            "target_ledger_not_found",
          message:
            "Target monthly recovery ledger was not found.",
        },
        { status: 404 }
      );
    }

    if (
      targetLedger.status !== "open" ||
      targetLedger.locked_at
    ) {
      return NextResponse.json(
        {
          success: false,
          status:
            "target_ledger_locked",
          message:
            "The target recovery ledger must still be open.",
        },
        { status: 409 }
      );
    }

    // ========================================
    // CLIENT + LOCATION PRE-CHECK
    // ========================================

    if (
      String(adjustment.user_id) !==
      String(targetLedger.user_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "user_mismatch",
          message:
            "The adjustment and target ledger belong to different clients.",
        },
        { status: 400 }
      );
    }

    if (
      String(adjustment.location_id) !==
      String(targetLedger.location_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          status:
            "location_mismatch",
          message:
            "The adjustment and target ledger belong to different locations.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // TARGET PERIOD MUST BE LATER
    // ========================================

    const originalYear =
      Number(
        adjustment.original_billing_year
      );

    const originalMonth =
      Number(
        adjustment.original_billing_month
      );

    const targetYear =
      Number(
        targetLedger.billing_year
      );

    const targetMonth =
      Number(
        targetLedger.billing_month
      );

    const targetIsLater =
      targetYear > originalYear ||
      (
        targetYear === originalYear &&
        targetMonth > originalMonth
      );

    if (!targetIsLater) {
      return NextResponse.json(
        {
          success: false,
          status:
            "invalid_target_period",
          message:
            "A prior-period adjustment must be applied to a later billing period.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // ATOMIC DATABASE OPERATION
    // ========================================

    const {
      data: applyRows,
      error: applyError,
    } = await supabaseAdmin.rpc(
      "apply_recovery_adjustment_atomic",
      {
        p_adjustment_id:
          adjustmentId,

        p_target_ledger_id:
          targetLedgerId,
      }
    );

    if (applyError) {
      throw applyError;
    }

    const result =
      Array.isArray(applyRows)
        ? applyRows[0]
        : applyRows;

    if (!result) {
      throw new Error(
        "The adjustment apply operation returned no result."
      );
    }

    // ========================================
    // FINAL RESPONSE
    // ========================================

    return NextResponse.json({
      success: true,

      status:
        result.adjustment_status,

      adjustmentId:
        result.adjustment_id,

      targetLedgerId:
        result.target_ledger_id,

      adjustmentAmount:
        roundMoney(
          result.adjustment_amount
        ),

      currentPeriodVerifiedRecovery:
        roundMoney(
          result.total_verified_recovery
        ),

      priorPeriodAdjustmentRecovery:
        roundMoney(
          result
            .prior_period_adjustment_recovery
        ),

      billableRecoveryTotal:
        roundMoney(
          result.billable_recovery_total
        ),

      performanceFeeCreated: false,

      paymentCreated: false,

      message:
        result.adjustment_status ===
        "already_applied"
          ? "This prior-period adjustment was already applied to this billing period. No duplicate recovery was added."
          : "Prior-period recovery adjustment was safely applied to the open billing period.",
    });
  } catch (error) {
    console.error(
      "APPLY RECOVERY ADJUSTMENT ERROR:",
      error
    );

    const message =
      error?.message ||
      "Unable to apply the recovery adjustment.";

    let status = Number(
      error?.status || 500
    );

    /*
      Database validation failures from the atomic
      RPC are business-rule conflicts rather than
      unexpected server failures.
    */
    if (
      status === 500 &&
      (
        message.includes(
          "already been applied"
        ) ||
        message.includes(
          "must be open"
        ) ||
        message.includes(
          "different clients"
        ) ||
        message.includes(
          "different locations"
        ) ||
        message.includes(
          "later billing period"
        ) ||
        message.includes(
          "must be pending"
        ) ||
        message.includes(
          "positive verified recovery"
        )
      )
    ) {
      status = 409;
    }

    return NextResponse.json(
      {
        success: false,
        status: "error",
        message,
      },
      { status }
    );
  }
}