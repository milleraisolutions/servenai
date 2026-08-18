import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ========================================
// AUTHORIZATION
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
      "You are not authorized to verify recovery."
    );

    forbiddenError.status = 403;
    throw forbiddenError;
  }

  return user;
}

// ========================================
// SAFE NUMBER HELPERS
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
      (toSafeNumber(value) + Number.EPSILON) *
        100
    ) / 100
  );
}

function roundPercent(value) {
  return (
    Math.round(
      (toSafeNumber(value) + Number.EPSILON) *
        10000
    ) / 10000
  );
}

// ========================================
// DATE HELPERS
// ========================================
function parseDateOnly(value) {
  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateOnly(date) {
  return date.toISOString().split("T")[0];
}

function addDays(date, numberOfDays) {
  const nextDate = new Date(date);

  nextDate.setUTCDate(
    nextDate.getUTCDate() + numberOfDays
  );

  return nextDate;
}

function getMonthStart(value) {
  const date = parseDateOnly(value);

  if (!date) {
    return null;
  }

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      1
    )
  );
}

function getMonthEnd(value) {
  const date = parseDateOnly(value);

  if (!date) {
    return null;
  }

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      0
    )
  );
}

function getPreviousMonthPeriod(
  monthStart
) {
  const baselineEnd =
    addDays(monthStart, -1);

  const baselineStart =
    new Date(
      Date.UTC(
        baselineEnd.getUTCFullYear(),
        baselineEnd.getUTCMonth(),
        1
      )
    );

  return {
    baselineStart:
      formatDateOnly(baselineStart),

    baselineEnd:
      formatDateOnly(baselineEnd),
  };
}

// ========================================
// EVIDENCE DATE HELPERS
// ========================================
function getLaborDate(row) {
  return row?.shift_date || null;
}

function getSalesDate(row) {
  return (
    row?.sale_date ||
    row?.date ||
    null
  );
}

function getUniqueDates(rows, getter) {
  return [
    ...new Set(
      (rows || [])
        .map((row) => getter(row))
        .filter(Boolean)
    ),
  ];
}

function getOverlapCount(
  firstDates,
  secondDates
) {
  const secondSet =
    new Set(secondDates || []);

  return (firstDates || []).filter(
    (date) => secondSet.has(date)
  ).length;
}

// ========================================
// LABOR VERIFICATION
// ========================================
export async function POST(req) {
  try {
    await getAuthenticatedOwner(req);

    const body = await req.json();

    const {
      verificationId,
    } = body || {};

    if (!verificationId) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "Missing verificationId.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // LOAD MEASURING VERIFICATION
    // ========================================

    const {
      data: verification,
      error: verificationError,
    } = await supabaseAdmin
      .from("ai_action_verifications")
      .select("*")
      .eq("id", verificationId)
      .maybeSingle();

    if (verificationError) {
      throw verificationError;
    }

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          status: "not_found",
          message:
            "Recovery verification record was not found.",
        },
        { status: 404 }
      );
    }

    const verificationCategory =
      String(
        verification.recovery_category ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      verificationCategory !== "labor"
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "This endpoint can only verify labor recovery.",
        },
        { status: 400 }
      );
    }

    if (
      verification.verification_status ===
      "verified"
    ) {
      return NextResponse.json({
        success: true,
        status: "already_verified",

        verificationId:
          verification.id,

        verifiedRecovery:
          roundMoney(
            verification.verified_recovery
          ),

        billable: true,

        message:
          "This labor recovery record has already been verified.",
      });
    }

    if (
      verification.verification_status !==
      "measuring"
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_status",
          message:
            "Only measuring recovery records can be financially verified.",
        },
        { status: 400 }
      );
    }

    const userId =
      verification.user_id;

    const locationId =
      verification.location_id;

    const actionId =
      verification.action_id;

    if (
      !userId ||
      !locationId ||
      !actionId
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_verification",
          message:
            "The recovery record is missing its client, location, or AI action.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // RELOAD AI ACTION
    //
    // Never trust only the verification row.
    // ========================================

    const {
      data: action,
      error: actionError,
    } = await supabaseAdmin
      .from("ai_applied_actions")
      .select(
        `
        id,
        user_id,
        recovery_category,
        location_id,
        location_name,
        verification_status,
        status,
        applied_at,
        created_at
        `
      )
      .eq("id", actionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (actionError) {
      throw actionError;
    }

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_action",
          message:
            "The AI action connected to this recovery record no longer exists.",
        },
        { status: 404 }
      );
    }

    if (
      String(
        action.recovery_category || ""
      )
        .trim()
        .toLowerCase() !== "labor"
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_action",
          message:
            "The connected AI action is not a labor recovery action.",
        },
        { status: 400 }
      );
    }

    if (
      !action.location_id ||
      String(action.location_id) !==
        String(locationId)
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "location_mismatch",
          message:
            "The AI action and recovery verification do not belong to the same location.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // CALCULATED RECOVERY SAFETY
    // ========================================

    const calculatedRecovery =
      toSafeNumber(
        verification.calculated_recovery
      );

    if (calculatedRecovery <= 0) {
      return NextResponse.json({
        success: true,
        status: "no_recovery",

        verificationId:
          verification.id,

        calculatedRecovery: 0,
        verifiedRecovery: 0,

        billable: false,

        message:
          "This measurement does not contain positive calculated labor recovery.",
      });
    }

    // ========================================
    // EVIDENCE SAFETY
    // ========================================

    const baselineMetrics =
      verification.baseline_metrics ||
      {};

    const measuredMetrics =
      verification.measured_metrics ||
      {};

    const minimumCoveragePercent = 70;

    const baselineCoverage =
      toSafeNumber(
        baselineMetrics.coveragePercent
      );

    const measurementCoverage =
      toSafeNumber(
        measuredMetrics.coveragePercent
      );

    if (
      baselineCoverage <
        minimumCoveragePercent ||
      measurementCoverage <
        minimumCoveragePercent
    ) {
      return NextResponse.json({
        success: false,
        status: "insufficient_data",

        verificationId:
          verification.id,

        calculatedRecovery,
        verifiedRecovery: 0,

        billable: false,

        message:
          "The stored evidence no longer satisfies the minimum labor and POS coverage requirement.",
      });
    }

    // ========================================
    // MEASUREMENT PERIOD SAFETY
    // ========================================

    const measurementStart =
      verification.measurement_start;

    const measurementEnd =
      verification.measurement_end;

    if (
      !measurementStart ||
      !measurementEnd
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_period",
          message:
            "The verification record is missing its measurement period.",
        },
        { status: 400 }
      );
    }

    const measurementEndDate =
      parseDateOnly(measurementEnd);

    if (!measurementEndDate) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_period",
          message:
            "The measurement period contains an invalid end date.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // REQUIRE COMPLETED MEASUREMENT PERIOD
    //
    // Do not financially verify future data.
    // ========================================

    const today = new Date();

    const todayUtc = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate()
      )
    );

    if (
      measurementEndDate > todayUtc
    ) {
      return NextResponse.json({
        success: false,
        status: "measurement_in_progress",

        verificationId:
          verification.id,

        calculatedRecovery,
        verifiedRecovery: 0,

        billable: false,

        message:
          "The measurement period has not finished yet, so this recovery cannot be financially verified.",
      });
    }

    // ========================================
    // DETERMINE BILLING MONTH
    //
    // The verification belongs to the calendar
    // month containing measurement_start.
    // ========================================

    const monthStartDate =
      getMonthStart(
        measurementStart
      );

    const monthEndDate =
      getMonthEnd(
        measurementStart
      );

    if (
      !monthStartDate ||
      !monthEndDate
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_period",
          message:
            "Unable to determine the recovery billing month.",
        },
        { status: 400 }
      );
    }

    const billingYear =
      monthStartDate.getUTCFullYear();

    const billingMonth =
      monthStartDate.getUTCMonth() + 1;

    const monthStart =
      formatDateOnly(
        monthStartDate
      );

    // ========================================
    // DO NOT VERIFY A MONTH BEFORE IT ENDS
    //
    // This prevents a partial calendar month
    // from becoming financially final.
    // ========================================

    if (monthEndDate > todayUtc) {
      return NextResponse.json({
        success: false,
        status: "month_in_progress",

        verificationId:
          verification.id,

        billingYear,
        billingMonth,

        calculatedRecovery,
        verifiedRecovery: 0,

        billable: false,

        message:
          "This calendar month is still open. Labor recovery can continue measuring, but it cannot be financially verified until the month closes.",
      });
    }

    const monthEnd =
      formatDateOnly(
        monthEndDate
      );

    // ========================================
    // PREVIOUS CALENDAR MONTH BASELINE
    //
    // The monthly cap is calculated once at the
    // LOCATION level, independent of individual
    // AI action estimates.
    // ========================================

    const {
      baselineStart:
        capBaselineStart,
      baselineEnd:
        capBaselineEnd,
    } = getPreviousMonthPeriod(
      monthStartDate
    );

    // ========================================
    // LOAD MONTHLY MEASUREMENT LABOR
    // ========================================

    const {
      data: monthLaborRows,
      error: monthLaborError,
    } = await supabaseAdmin
      .from("employee_shifts")
      .select(
        `
        id,
        shift_date,
        labor_cost,
        location_id
        `
      )
      .eq("user_id", userId)
      .eq("location_id", locationId)
      .gte("shift_date", monthStart)
      .lte("shift_date", monthEnd);

    if (monthLaborError) {
      throw monthLaborError;
    }

    // ========================================
    // LOAD MONTHLY MEASUREMENT SALES
    // ========================================

    const {
      data: monthSalesRows,
      error: monthSalesError,
    } = await supabaseAdmin
      .from("sales")
      .select(
        `
        id,
        sale_date,
        date,
        revenue,
        location_id
        `
      )
      .eq("user_id", userId)
      .eq(
        "location_id",
        String(locationId)
      )
      .or(
        `and(sale_date.gte.${monthStart},sale_date.lte.${monthEnd}),and(date.gte.${monthStart},date.lte.${monthEnd})`
      );

    if (monthSalesError) {
      throw monthSalesError;
    }

    // ========================================
    // LOAD PREVIOUS MONTH LABOR
    // ========================================

    const {
      data: capBaselineLaborRows,
      error: capBaselineLaborError,
    } = await supabaseAdmin
      .from("employee_shifts")
      .select(
        `
        id,
        shift_date,
        labor_cost,
        location_id
        `
      )
      .eq("user_id", userId)
      .eq("location_id", locationId)
      .gte(
        "shift_date",
        capBaselineStart
      )
      .lte(
        "shift_date",
        capBaselineEnd
      );

    if (capBaselineLaborError) {
      throw capBaselineLaborError;
    }

    // ========================================
    // LOAD PREVIOUS MONTH SALES
    // ========================================

    const {
      data: capBaselineSalesRows,
      error: capBaselineSalesError,
    } = await supabaseAdmin
      .from("sales")
      .select(
        `
        id,
        sale_date,
        date,
        revenue,
        location_id
        `
      )
      .eq("user_id", userId)
      .eq(
        "location_id",
        String(locationId)
      )
      .or(
        `and(sale_date.gte.${capBaselineStart},sale_date.lte.${capBaselineEnd}),and(date.gte.${capBaselineStart},date.lte.${capBaselineEnd})`
      );

    if (capBaselineSalesError) {
      throw capBaselineSalesError;
    }

    // ========================================
    // MONTHLY CAP DATA PRESENCE
    // ========================================

    if (
      !monthLaborRows?.length ||
      !monthSalesRows?.length ||
      !capBaselineLaborRows?.length ||
      !capBaselineSalesRows?.length
    ) {
      return NextResponse.json({
        success: false,
        status: "insufficient_monthly_data",

        verificationId:
          verification.id,

        billingYear,
        billingMonth,

        calculatedRecovery,
        verifiedRecovery: 0,

        billable: false,

        message:
          "There is not enough canonical labor and POS data to establish the location's monthly labor recovery cap.",
      });
    }

    // ========================================
    // MONTHLY CAP COVERAGE
    // ========================================

    const monthLaborDates =
      getUniqueDates(
        monthLaborRows,
        getLaborDate
      );

    const monthSalesDates =
      getUniqueDates(
        monthSalesRows,
        getSalesDate
      );

    const capBaselineLaborDates =
      getUniqueDates(
        capBaselineLaborRows,
        getLaborDate
      );

    const capBaselineSalesDates =
      getUniqueDates(
        capBaselineSalesRows,
        getSalesDate
      );

    const monthOverlapDays =
      getOverlapCount(
        monthLaborDates,
        monthSalesDates
      );

    const capBaselineOverlapDays =
      getOverlapCount(
        capBaselineLaborDates,
        capBaselineSalesDates
      );

    const monthDayCount =
      monthEndDate.getUTCDate();

    const capBaselineEndDate =
      parseDateOnly(
        capBaselineEnd
      );

    const baselineMonthDayCount =
      capBaselineEndDate
        ? capBaselineEndDate.getUTCDate()
        : 0;

    const monthCoverageRatio =
      monthDayCount > 0
        ? monthOverlapDays /
          monthDayCount
        : 0;

    const capBaselineCoverageRatio =
      baselineMonthDayCount > 0
        ? capBaselineOverlapDays /
          baselineMonthDayCount
        : 0;

    const minimumCoverageRatio = 0.7;

    if (
      monthCoverageRatio <
        minimumCoverageRatio ||
      capBaselineCoverageRatio <
        minimumCoverageRatio
    ) {
      return NextResponse.json({
        success: false,
        status: "insufficient_monthly_coverage",

        verificationId:
          verification.id,

        billingYear,
        billingMonth,

        calculatedRecovery,
        verifiedRecovery: 0,

        billable: false,

        evidence: {
          monthOverlapDays,

          monthCoveragePercent:
            roundPercent(
              monthCoverageRatio * 100
            ),

          baselineOverlapDays:
            capBaselineOverlapDays,

          baselineCoveragePercent:
            roundPercent(
              capBaselineCoverageRatio *
                100
            ),

          minimumRequiredCoveragePercent:
            minimumCoverageRatio * 100,
        },

        message:
          "The location does not have enough matching monthly labor and POS evidence to establish a safe recovery cap.",
      });
    }

    // ========================================
    // MONTHLY LOCATION TOTALS
    // ========================================

    const monthlyLaborCost =
      monthLaborRows.reduce(
        (sum, row) =>
          sum +
          toSafeNumber(
            row.labor_cost
          ),
        0
      );

    const monthlySales =
      monthSalesRows.reduce(
        (sum, row) =>
          sum +
          toSafeNumber(
            row.revenue
          ),
        0
      );

    const baselineMonthlyLaborCost =
      capBaselineLaborRows.reduce(
        (sum, row) =>
          sum +
          toSafeNumber(
            row.labor_cost
          ),
        0
      );

    const baselineMonthlySales =
      capBaselineSalesRows.reduce(
        (sum, row) =>
          sum +
          toSafeNumber(
            row.revenue
          ),
        0
      );

    if (
      baselineMonthlySales <= 0 ||
      monthlySales <= 0
    ) {
      return NextResponse.json({
        success: false,
        status: "invalid_monthly_financials",

        verificationId:
          verification.id,

        calculatedRecovery,
        verifiedRecovery: 0,

        billable: false,

        message:
          "Monthly POS revenue is insufficient to calculate a normalized labor recovery cap.",
      });
    }

    // ========================================
    // LOCATION/MONTH LABOR CAP
    //
    // Previous month labor ratio
    //        ↓
    // Current month sales
    //        ↓
    // Expected current labor cost
    //        ↓
    // Actual current labor cost
    //        ↓
    // Maximum labor recovery Serven may claim
    // ========================================

    const baselineMonthlyLaborRatio =
      baselineMonthlyLaborCost /
      baselineMonthlySales;

    const expectedMonthlyLaborCost =
      monthlySales *
      baselineMonthlyLaborRatio;

    const rawMonthlyLaborCap =
      expectedMonthlyLaborCost -
      monthlyLaborCost;

    const monthlyLaborCap =
      roundMoney(
        Math.max(
          0,
          rawMonthlyLaborCap
        )
      );

    if (monthlyLaborCap <= 0) {
      return NextResponse.json({
        success: true,
        status: "no_monthly_recovery",

        verificationId:
          verification.id,

        billingYear,
        billingMonth,

        calculatedRecovery,

        monthlyLaborCap: 0,

        verifiedRecovery: 0,

        billable: false,

        message:
          "The location did not produce positive normalized labor recovery for this calendar month.",
      });
    }

    // ========================================
    // ATOMIC FINANCIAL VERIFICATION
    //
    // Supabase now:
    //
    // 1. locks client/location/month
    // 2. checks already verified labor recovery
    // 3. applies the remaining monthly cap
    // 4. verifies only the allowed amount
    //
    // This protects against duplicate/concurrent
    // recovery claims.
    // ========================================

    const {
      data: atomicResult,
      error: atomicError,
    } = await supabaseAdmin.rpc(
      "verify_labor_recovery_atomic",
      {
        p_verification_id:
          verification.id,

        p_user_id:
          userId,

        p_location_id:
          locationId,

        p_billing_year:
          billingYear,

        p_billing_month:
          billingMonth,

        p_monthly_labor_cap:
          monthlyLaborCap,
      }
    );

    if (atomicError) {
      throw atomicError;
    }

    const result =
      Array.isArray(atomicResult)
        ? atomicResult[0]
        : atomicResult;

    if (!result) {
      throw new Error(
        "Labor verification did not return a result."
      );
    }

    const approvedRecovery =
      roundMoney(
        result.approved_recovery
      );

    const previousVerifiedRecovery =
      roundMoney(
        result.previous_verified_recovery
      );

    const remainingCapBeforeApproval =
      roundMoney(
        result.remaining_cap
      );

    const resultStatus =
      result.verification_status ||
      "unknown";

    // ========================================
    // UPDATE AI ACTION
    //
    // Only mark the action financially verified
    // if Supabase actually approved recovery.
    // ========================================

    if (
      resultStatus === "verified" &&
      approvedRecovery > 0
    ) {
      const {
        error: actionUpdateError,
      } = await supabaseAdmin
        .from("ai_applied_actions")
        .update({
          verification_status:
            "verified",

          verified_recovery:
            approvedRecovery,

          verified_at:
            new Date().toISOString(),
        })
        .eq("id", actionId)
        .eq("user_id", userId);

      if (actionUpdateError) {
        throw actionUpdateError;
      }
    }
// ========================================
// SYNCHRONIZE MONTHLY RECOVERY LEDGER
//
// Only run after Supabase has financially
// verified a positive amount.
//
// The ledger sync route remains the single
// source of truth for:
// - monthly recovery totals
// - prior-period adjustments
// - locked-ledger protection
// - category preservation
// ========================================

let ledgerSyncResult = null;

if (
  resultStatus === "verified" &&
  approvedRecovery > 0
) {
  const authorization =
    req.headers.get("authorization") || "";

  const ledgerSyncUrl = new URL(
    "/api/recovery/ledger/sync",
    req.url
  );

  const ledgerSyncResponse = await fetch(
    ledgerSyncUrl,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },

      body: JSON.stringify({
        userId,
        locationId,
        billingYear,
        billingMonth,
      }),

      cache: "no-store",
    }
  );

  ledgerSyncResult =
    await ledgerSyncResponse.json();

  if (
    !ledgerSyncResponse.ok ||
    !ledgerSyncResult?.success
  ) {
    console.error(
      "LABOR VERIFICATION LEDGER SYNC FAILED:",
      ledgerSyncResult
    );

    throw new Error(
      ledgerSyncResult?.message ||
        "Labor recovery was verified, but the monthly recovery ledger could not be synchronized."
    );
  }
}
  // ========================================
// FINAL RESPONSE
//
// Verified recovery has now been
// synchronized to the monthly ledger.
//
// Still NO:
// - 15% fee calculation
// - payment request
// - Stripe
//
// Those remain downstream of ledger lock.
// ========================================

    return NextResponse.json({
      success: true,

      status:
        resultStatus,

      category: "labor",

      actionId,

      verificationId:
        verification.id,

      userId,
      locationId,

     billingYear,
billingMonth,

ledgerSync: ledgerSyncResult,

period: {
        monthStart,
        monthEnd,

        baselineStart:
          capBaselineStart,

        baselineEnd:
          capBaselineEnd,
      },

      monthlyEvidence: {
        laborSource:
          "employee_shifts",

        salesSource:
          "sales",

        baselineLaborCost:
          roundMoney(
            baselineMonthlyLaborCost
          ),

        baselineSales:
          roundMoney(
            baselineMonthlySales
          ),

        baselineLaborPercent:
          roundPercent(
            baselineMonthlyLaborRatio *
              100
          ),

        measurementLaborCost:
          roundMoney(
            monthlyLaborCost
          ),

        measurementSales:
          roundMoney(
            monthlySales
          ),

        expectedMeasurementLaborCost:
          roundMoney(
            expectedMonthlyLaborCost
          ),

        baselineCoveragePercent:
          roundPercent(
            capBaselineCoverageRatio *
              100
          ),

        measurementCoveragePercent:
          roundPercent(
            monthCoverageRatio * 100
          ),
      },

      calculatedRecovery,

      monthlyLaborCap,

      previousVerifiedRecovery,

      remainingCapBeforeApproval,

      verifiedRecovery:
        approvedRecovery,

      billable:
        resultStatus === "verified" &&
        approvedRecovery > 0,

      message:
        resultStatus === "verified"
          ? "Labor recovery passed financial verification and was limited by the location's actual monthly normalized labor improvement."
          : resultStatus ===
              "already_verified"
            ? "This labor recovery was already financially verified."
            : resultStatus ===
                "cap_exhausted"
              ? "The location's verified labor recovery has already reached its monthly recovery cap."
              : "Labor recovery was not promoted to verified status.",
    });
  } catch (error) {
    console.error(
      "LABOR VERIFY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        status: "error",

        message:
          error?.message ||
          "Unable to verify labor recovery.",
      },
      {
        status: Number(
          error?.status || 500
        ),
      }
    );
  }
}