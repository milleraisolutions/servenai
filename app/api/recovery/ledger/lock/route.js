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
    const forbiddenError =
      new Error(
        "You are not authorized to lock recovery ledgers."
      );

    forbiddenError.status = 403;
    throw forbiddenError;
  }

  return user;
}

// ========================================
// NUMBER HELPERS
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

// ========================================
// DATE HELPERS
// ========================================

function parseDateOnly(value) {
  if (!value) {
    return null;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date;
}

function addDays(
  date,
  numberOfDays
) {
  const nextDate =
    new Date(date);

  nextDate.setUTCDate(
    nextDate.getUTCDate() +
      numberOfDays
  );

  return nextDate;
}

function getUtcToday() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
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
    // We lock by ledger ID instead of trusting
    // client/location/month fields from browser.
    // ========================================

    if (!ledgerId) {
      return NextResponse.json(
        {
          success: false,
          status:
            "invalid_request",

          message:
            "Missing ledgerId.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // LOAD LEDGER
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
      return NextResponse.json(
        {
          success: false,
          status: "not_found",

          message:
            "Monthly recovery ledger was not found.",
        },
        { status: 404 }
      );
    }

    // ========================================
    // LOCATION SAFETY
    //
    // Billable recovery must always belong to
    // a specific location.
    // ========================================

    if (!ledger.location_id) {
      return NextResponse.json(
        {
          success: false,
          status:
            "missing_location",

          message:
            "This ledger does not have a valid location and cannot be financially locked.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // ALREADY LOCKED
    //
    // Never recalculate a locked month's
    // financial values.
    // ========================================

    if (
      ledger.status === "locked" ||
      ledger.locked_at
    ) {
      return NextResponse.json({
        success: true,

        status:
          "already_locked",

        ledgerId: ledger.id,

        userId:
          ledger.user_id,

        locationId:
          ledger.location_id,

        locationName:
          ledger.location_name,

        billingYear:
          ledger.billing_year,

        billingMonth:
          ledger.billing_month,

        periodStart:
          ledger.period_start,

        periodEnd:
          ledger.period_end,

        recovery: {
          labor:
            roundMoney(
              ledger
                .labor_recovery
            ),

          menuPricing:
            roundMoney(
              ledger
                .menu_pricing_recovery
            ),

          inventoryWaste:
            roundMoney(
              ledger
                .inventory_waste_recovery
            ),

          vendorPurchasing:
            roundMoney(
              ledger
                .vendor_purchasing_recovery
            ),

          total:
            roundMoney(
              ledger
                .total_verified_recovery
            ),

          priorPeriodAdjustments:
            roundMoney(
              ledger
                .prior_period_adjustment_recovery
            ),

          billableTotal:
            roundMoney(
              ledger
                .billable_recovery_total
            ),
        },

        performanceFeePercentage:
          toSafeNumber(
            ledger
              .performance_fee_percentage
          ),

        performanceFeeAmount:
          roundMoney(
            ledger
              .performance_fee_amount
          ),

        lockedAt:
          ledger.locked_at,

        billable:
          roundMoney(
            ledger
              .performance_fee_amount
          ) > 0,

        paymentCreated: false,

        message:
          "This monthly recovery ledger is already locked.",
      });
    }

    // ========================================
    // STATUS SAFETY
    // ========================================

    if (
      ledger.status !== "open"
    ) {
      return NextResponse.json(
        {
          success: false,

          status:
            "invalid_ledger_status",

          message:
            `Ledger status "${ledger.status}" cannot be financially locked.`,
        },
        { status: 400 }
      );
    }

    // ========================================
    // PERIOD SAFETY
    // ========================================

    const periodStartDate =
      parseDateOnly(
        ledger.period_start
      );

    const periodEndDate =
      parseDateOnly(
        ledger.period_end
      );

    if (
      !periodStartDate ||
      !periodEndDate
    ) {
      return NextResponse.json(
        {
          success: false,
          status:
            "invalid_period",

          message:
            "The ledger contains an invalid recovery period.",
        },
        { status: 400 }
      );
    }

    if (
      periodStartDate >
      periodEndDate
    ) {
      return NextResponse.json(
        {
          success: false,
          status:
            "invalid_period",

          message:
            "The ledger period start occurs after its period end.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // CALENDAR MONTH SAFETY
    //
    // Confirm the stored period actually matches
    // billing_year + billing_month.
    // ========================================

    const billingYear =
      Number(
        ledger.billing_year
      );

    const billingMonth =
      Number(
        ledger.billing_month
      );

    if (
      !Number.isInteger(
        billingYear
      ) ||
      !Number.isInteger(
        billingMonth
      ) ||
      billingMonth < 1 ||
      billingMonth > 12
    ) {
      return NextResponse.json(
        {
          success: false,
          status:
            "invalid_billing_period",

          message:
            "The ledger billing year or month is invalid.",
        },
        { status: 400 }
      );
    }

    const expectedStart =
      new Date(
        Date.UTC(
          billingYear,
          billingMonth - 1,
          1
        )
      );

    const expectedEnd =
      new Date(
        Date.UTC(
          billingYear,
          billingMonth,
          0
        )
      );

    const expectedStartString =
      expectedStart
        .toISOString()
        .split("T")[0];

    const expectedEndString =
      expectedEnd
        .toISOString()
        .split("T")[0];

    if (
      ledger.period_start !==
        expectedStartString ||
      ledger.period_end !==
        expectedEndString
    ) {
      return NextResponse.json(
        {
          success: false,

          status:
            "period_mismatch",

          message:
            "The ledger period does not match its stored calendar billing month.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // MONTH-END SETTLEMENT BUFFER
    //
    // Do not lock at the first instant UTC
    // changes months.
    //
    // August 31 period end
    // September 1 = settlement day
    // September 2 = earliest lock date
    // ========================================

    const earliestLockDate =
      addDays(
        periodEndDate,
        2
      );

    const utcToday =
      getUtcToday();

    if (
      utcToday <
      earliestLockDate
    ) {
      return NextResponse.json({
        success: false,

        status:
          "month_not_ready_to_lock",

        ledgerId:
          ledger.id,

        billingYear,
        billingMonth,

        periodStart:
          ledger.period_start,

        periodEnd:
          ledger.period_end,

        earliestLockDate:
          earliestLockDate
            .toISOString()
            .split("T")[0],

        billable: false,

        message:
          "This recovery month has not completed its month-end settlement buffer and cannot be financially locked yet.",
      });
    }

    // ========================================
    // CATEGORY VALUE SAFETY
    //
    // Negative recovery must never reduce or
    // manipulate another category's recovery.
    // ========================================

    const rawLaborRecovery =
      toSafeNumber(
        ledger.labor_recovery
      );

    const rawMenuRecovery =
      toSafeNumber(
        ledger
          .menu_pricing_recovery
      );

    const rawInventoryRecovery =
      toSafeNumber(
        ledger
          .inventory_waste_recovery
      );

    const rawVendorRecovery =
      toSafeNumber(
        ledger
          .vendor_purchasing_recovery
      );

    const rawPriorPeriodAdjustments =
      toSafeNumber(
        ledger
          .prior_period_adjustment_recovery
      );

    if (
      rawLaborRecovery < 0 ||
      rawMenuRecovery < 0 ||
      rawInventoryRecovery < 0 ||
      rawVendorRecovery < 0 ||
      rawPriorPeriodAdjustments < 0
    ) {
      return NextResponse.json(
        {
          success: false,

          status:
            "invalid_recovery_values",

          message:
            "The ledger contains a negative recovery or adjustment value and cannot be locked.",
        },
        { status: 400 }
      );
    }

    const laborRecovery =
      roundMoney(
        rawLaborRecovery
      );

    const menuPricingRecovery =
      roundMoney(
        rawMenuRecovery
      );

    const inventoryWasteRecovery =
      roundMoney(
        rawInventoryRecovery
      );

    const vendorPurchasingRecovery =
      roundMoney(
        rawVendorRecovery
      );

    const priorPeriodAdjustmentRecovery =
      roundMoney(
        rawPriorPeriodAdjustments
      );

    // ========================================
    // RECOMPUTE CURRENT-PERIOD RECOVERY
    //
    // This remains operational recovery generated
    // during THIS billing month only.
    // ========================================

    const totalVerifiedRecovery =
      roundMoney(
        laborRecovery +
          menuPricingRecovery +
          inventoryWasteRecovery +
          vendorPurchasingRecovery
      );

    // ========================================
    // BILLABLE RECOVERY
    //
    // Current-period operational recovery stays
    // separate from prior-period adjustments.
    //
    // Billable basis =
    // current-period verified recovery
    // +
    // prior-period adjustment recovery
    // ========================================

    const billableRecoveryTotal =
      roundMoney(
        totalVerifiedRecovery +
          priorPeriodAdjustmentRecovery
      );

    // ========================================
    // PERFORMANCE FEE
    //
    // Contractual fee = 15%
    //
    // Fee is now calculated from the BILLABLE
    // recovery basis rather than current-month
    // operational recovery alone.
    //
    // It does NOT:
    // - create an invoice
    // - create Stripe Checkout
    // - charge a card
    // - mark anything paid
    // ========================================

    const feePercentage = 15;

    const performanceFeeAmount =
      roundMoney(
        billableRecoveryTotal *
          (feePercentage / 100)
      );

    const now =
      new Date().toISOString();

    // ========================================
    // OPTIMISTIC CONCURRENCY PROTECTION
    //
    // We require:
    //
    // status = open
    // locked_at = null
    // updated_at = exact value we loaded
    //
    // If ledger sync OR adjustment application
    // changes the row while this request is
    // calculating, the lock fails safely.
    // ========================================

    let lockQuery =
      supabaseAdmin
        .from(
          "monthly_recovery_ledger"
        )
        .update({
          labor_recovery:
            laborRecovery,

          menu_pricing_recovery:
            menuPricingRecovery,

          inventory_waste_recovery:
            inventoryWasteRecovery,

          vendor_purchasing_recovery:
            vendorPurchasingRecovery,

          total_verified_recovery:
            totalVerifiedRecovery,

          prior_period_adjustment_recovery:
            priorPeriodAdjustmentRecovery,

          billable_recovery_total:
            billableRecoveryTotal,

          performance_fee_percentage:
            feePercentage,

          performance_fee_amount:
            performanceFeeAmount,

          status: "locked",

          locked_at: now,

          updated_at: now,
        })
        .eq(
          "id",
          ledger.id
        )
        .eq(
          "user_id",
          ledger.user_id
        )
        .eq(
          "location_id",
          ledger.location_id
        )
        .eq(
          "billing_year",
          billingYear
        )
        .eq(
          "billing_month",
          billingMonth
        )
        .eq(
          "status",
          "open"
        )
        .is(
          "locked_at",
          null
        );

    /*
      updated_at protects against:
      - recovery ledger sync
      - adjustment application
      - another lock attempt

      happening after our original ledger read.
    */
    if (ledger.updated_at) {
      lockQuery =
        lockQuery.eq(
          "updated_at",
          ledger.updated_at
        );
    }

    const {
      data: lockedLedger,
      error: lockError,
    } = await lockQuery
      .select("*")
      .maybeSingle();

    if (lockError) {
      throw lockError;
    }

    // ========================================
    // CONCURRENT CHANGE DETECTED
    // ========================================

    if (!lockedLedger) {
      return NextResponse.json(
        {
          success: false,

          status:
            "ledger_changed",

          ledgerId:
            ledger.id,

          billable: false,

          message:
            "The ledger changed while the lock operation was running. It was not financially frozen. Synchronize and review it again before locking.",
        },
        { status: 409 }
      );
    }

    // ========================================
    // FINAL RESPONSE
    // ========================================

    return NextResponse.json({
      success: true,

      status: "locked",

      ledgerId:
        lockedLedger.id,

      userId:
        lockedLedger.user_id,

      locationId:
        lockedLedger.location_id,

      locationName:
        lockedLedger.location_name,

      billingYear:
        lockedLedger.billing_year,

      billingMonth:
        lockedLedger.billing_month,

      periodStart:
        lockedLedger.period_start,

      periodEnd:
        lockedLedger.period_end,

      recovery: {
        labor:
          roundMoney(
            lockedLedger
              .labor_recovery
          ),

        menuPricing:
          roundMoney(
            lockedLedger
              .menu_pricing_recovery
          ),

        inventoryWaste:
          roundMoney(
            lockedLedger
              .inventory_waste_recovery
          ),

        vendorPurchasing:
          roundMoney(
            lockedLedger
              .vendor_purchasing_recovery
          ),

        total:
          roundMoney(
            lockedLedger
              .total_verified_recovery
          ),

        priorPeriodAdjustments:
          roundMoney(
            lockedLedger
              .prior_period_adjustment_recovery
          ),

        billableTotal:
          roundMoney(
            lockedLedger
              .billable_recovery_total
          ),
      },

      performanceFeePercentage:
        toSafeNumber(
          lockedLedger
            .performance_fee_percentage
        ),

      performanceFeeAmount:
        roundMoney(
          lockedLedger
            .performance_fee_amount
        ),

      lockedAt:
        lockedLedger.locked_at,

      billable:
        roundMoney(
          lockedLedger
            .performance_fee_amount
        ) > 0,

      paymentCreated: false,

      message:
        performanceFeeAmount > 0
          ? "The monthly verified recovery, prior-period adjustments, billable recovery total, and performance fee have been financially frozen. No payment request has been created."
          : "The monthly recovery ledger was locked with no performance fee due.",
    });
  } catch (error) {
    console.error(
      "RECOVERY LEDGER LOCK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        status: "error",

        message:
          error?.message ||
          "Unable to lock the monthly recovery ledger.",
      },
      {
        status: Number(
          error?.status || 500
        ),
      }
    );
  }
}