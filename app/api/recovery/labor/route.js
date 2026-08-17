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
      "You are not authorized to run recovery verification."
    );

    forbiddenError.status = 403;
    throw forbiddenError;
  }

  return user;
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
// DATE COLLECTION HELPERS
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
// RECOVERY PERIODS
// ========================================
function getRecoveryPeriods(
  periodStart,
  periodEnd
) {
  const measurementStart =
    parseDateOnly(periodStart);

  const measurementEnd =
    parseDateOnly(periodEnd);

  if (!measurementStart || !measurementEnd) {
    const error = new Error(
      "Recovery period contains an invalid date."
    );

    error.status = 400;
    throw error;
  }

  if (measurementEnd < measurementStart) {
    const error = new Error(
      "Recovery period end cannot be before the start."
    );

    error.status = 400;
    throw error;
  }

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  const measurementDayCount =
    Math.floor(
      (measurementEnd.getTime() -
        measurementStart.getTime()) /
        millisecondsPerDay
    ) + 1;

  const baselineEnd =
    addDays(measurementStart, -1);

  const baselineStart =
    addDays(
      baselineEnd,
      -(measurementDayCount - 1)
    );

  return {
    baselineStart:
      formatDateOnly(baselineStart),

    baselineEnd:
      formatDateOnly(baselineEnd),

    measurementStart:
      formatDateOnly(measurementStart),

    measurementEnd:
      formatDateOnly(measurementEnd),

    measurementDayCount,
  };
}

// ========================================
// LABOR RECOVERY VERIFICATION
// ========================================
export async function POST(req) {
  try {
    await getAuthenticatedOwner(req);

    const body = await req.json();

    const {
      actionId,
      userId,
      locationId,
      periodStart,
      periodEnd,
    } = body || {};

    // ========================================
    // REQUEST VALIDATION
    // ========================================

    if (!actionId) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message: "Missing actionId.",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message: "Missing userId.",
        },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message: "Missing locationId.",
        },
        { status: 400 }
      );
    }

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "Missing recovery period.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // VERIFY THE ACTION ITSELF
    //
    // Do not trust actionId/userId/locationId
    // from the request without checking the
    // actual ai_applied_actions row.
    // ========================================

    const {
      data: actionRow,
      error: actionError,
    } = await supabaseAdmin
      .from("ai_applied_actions")
      .select(
        `
        id,
        user_id,
        action_name,
        status,
        applied_at,
        created_at,
        recovery_category,
        location_id,
        location_name,
        verification_status
        `
      )
      .eq("id", actionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (actionError) {
      throw actionError;
    }

    if (!actionRow) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "The requested AI action was not found for this client.",
        },
        { status: 404 }
      );
    }

    const actionCategory = String(
      actionRow.recovery_category || ""
    )
      .trim()
      .toLowerCase();

    if (actionCategory !== "labor") {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "This recovery endpoint can only evaluate labor actions.",
        },
        { status: 400 }
      );
    }

    if (
      !actionRow.location_id ||
      String(actionRow.location_id) !==
        String(locationId)
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "The AI action does not belong to the requested location.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // BUILD BASELINE + MEASUREMENT PERIODS
    // ========================================

    const recoveryPeriods =
      getRecoveryPeriods(
        periodStart,
        periodEnd
      );

    const {
      baselineStart,
      baselineEnd,
      measurementStart,
      measurementEnd,
      measurementDayCount,
    } = recoveryPeriods;

    // ========================================
    // ACTION DATE SAFETY
    //
    // Measurement must not begin before the
    // action existed/applied.
    // ========================================

    const actionTimestamp =
      actionRow.applied_at ||
      actionRow.created_at ||
      null;

    const actionDate =
      actionTimestamp
        ? String(actionTimestamp).split("T")[0]
        : null;

    if (
      actionDate &&
      measurementStart < actionDate
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "The measurement period cannot begin before the AI action was applied.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // MEASUREMENT LABOR
    // ========================================

    const {
      data: laborRows,
      error: laborError,
    } = await supabaseAdmin
      .from("employee_shifts")
      .select(
        `
        id,
        user_id,
        shift_date,
        hours_worked,
        hourly_rate,
        labor_cost,
        revenue_during_shift,
        location_id,
        location_name
        `
      )
      .eq("user_id", userId)
      .eq("location_id", locationId)
      .gte(
        "shift_date",
        measurementStart
      )
      .lte(
        "shift_date",
        measurementEnd
      );

    if (laborError) {
      throw laborError;
    }

    if (!laborRows?.length) {
      return NextResponse.json({
        success: true,
        status: "insufficient_data",
        category: "labor",

        message:
          "No canonical employee shift data is available for this location and period.",

        calculatedRecovery: 0,
        verifiedRecovery: 0,
      });
    }

    // ========================================
    // MEASUREMENT POS SALES
    // ========================================

    const {
      data: salesRows,
      error: salesError,
    } = await supabaseAdmin
      .from("sales")
      .select(
        `
        id,
        user_id,
        sale_date,
        date,
        revenue,
        orders_count,
        location_id,
        location_name
        `
      )
      .eq("user_id", userId)
      .eq(
        "location_id",
        String(locationId)
      )
      .or(
        `and(sale_date.gte.${measurementStart},sale_date.lte.${measurementEnd}),and(date.gte.${measurementStart},date.lte.${measurementEnd})`
      );

    if (salesError) {
      throw salesError;
    }

    if (!salesRows?.length) {
      return NextResponse.json({
        success: true,
        status: "insufficient_data",
        category: "labor",

        message:
          "Canonical labor data exists, but matching POS sales data is unavailable for this location and period.",

        calculatedRecovery: 0,
        verifiedRecovery: 0,
      });
    }

    // ========================================
    // BASELINE LABOR
    // ========================================

    const {
      data: baselineLaborRows,
      error: baselineLaborError,
    } = await supabaseAdmin
      .from("employee_shifts")
      .select(
        `
        id,
        user_id,
        shift_date,
        hours_worked,
        hourly_rate,
        labor_cost,
        revenue_during_shift,
        location_id,
        location_name
        `
      )
      .eq("user_id", userId)
      .eq("location_id", locationId)
      .gte(
        "shift_date",
        baselineStart
      )
      .lte(
        "shift_date",
        baselineEnd
      );

    if (baselineLaborError) {
      throw baselineLaborError;
    }

    // ========================================
    // BASELINE POS SALES
    // ========================================

    const {
      data: baselineSalesRows,
      error: baselineSalesError,
    } = await supabaseAdmin
      .from("sales")
      .select(
        `
        id,
        user_id,
        sale_date,
        date,
        revenue,
        orders_count,
        location_id,
        location_name
        `
      )
      .eq("user_id", userId)
      .eq(
        "location_id",
        String(locationId)
      )
      .or(
        `and(sale_date.gte.${baselineStart},sale_date.lte.${baselineEnd}),and(date.gte.${baselineStart},date.lte.${baselineEnd})`
      );

    if (baselineSalesError) {
      throw baselineSalesError;
    }

    // ========================================
    // BASELINE PRESENCE CHECK
    // ========================================

    if (
      !baselineLaborRows?.length ||
      !baselineSalesRows?.length
    ) {
      return NextResponse.json({
        success: true,
        status: "insufficient_data",
        category: "labor",

        message:
          "Measurement data exists, but there is not enough matching baseline labor and POS data to calculate recovery safely.",

        calculatedRecovery: 0,
        verifiedRecovery: 0,
      });
    }

    // ========================================
    // DATE COVERAGE
    // ========================================

    const baselineLaborDates =
      getUniqueDates(
        baselineLaborRows,
        getLaborDate
      );

    const baselineSalesDates =
      getUniqueDates(
        baselineSalesRows,
        getSalesDate
      );

    const measurementLaborDates =
      getUniqueDates(
        laborRows,
        getLaborDate
      );

    const measurementSalesDates =
      getUniqueDates(
        salesRows,
        getSalesDate
      );

    const baselineOverlapDays =
      getOverlapCount(
        baselineLaborDates,
        baselineSalesDates
      );

    const measurementOverlapDays =
      getOverlapCount(
        measurementLaborDates,
        measurementSalesDates
      );

    const minimumCoverageRatio = 0.7;

    const baselineCoverageRatio =
      measurementDayCount > 0
        ? baselineOverlapDays /
          measurementDayCount
        : 0;

    const measurementCoverageRatio =
      measurementDayCount > 0
        ? measurementOverlapDays /
          measurementDayCount
        : 0;

    if (
      baselineCoverageRatio <
        minimumCoverageRatio ||
      measurementCoverageRatio <
        minimumCoverageRatio
    ) {
      return NextResponse.json({
        success: true,
        status: "insufficient_data",
        category: "labor",

        message:
          "Labor and POS evidence does not cover enough matching operating days to calculate recovery safely.",

        evidence: {
          laborSource:
            "employee_shifts",

          salesSource:
            "sales",

          userId,
          locationId,

          baselineStart,
          baselineEnd,

          measurementStart,
          measurementEnd,

          measurementDayCount,

          baselineLaborDayCount:
            baselineLaborDates.length,

          baselineSalesDayCount:
            baselineSalesDates.length,

          baselineOverlapDays,

          baselineCoveragePercent:
            roundPercent(
              baselineCoverageRatio * 100
            ),

          measurementLaborDayCount:
            measurementLaborDates.length,

          measurementSalesDayCount:
            measurementSalesDates.length,

          measurementOverlapDays,

          measurementCoveragePercent:
            roundPercent(
              measurementCoverageRatio * 100
            ),

          minimumRequiredCoveragePercent:
            minimumCoverageRatio * 100,
        },

        calculatedRecovery: 0,
        verifiedRecovery: 0,
      });
    }

    // ========================================
    // FINANCIAL TOTALS
    // ========================================

    const baselineLaborCost =
      baselineLaborRows.reduce(
        (sum, row) =>
          sum +
          toSafeNumber(
            row.labor_cost
          ),
        0
      );

    const measurementLaborCost =
      laborRows.reduce(
        (sum, row) =>
          sum +
          toSafeNumber(
            row.labor_cost
          ),
        0
      );

    const baselineSales =
      baselineSalesRows.reduce(
        (sum, row) =>
          sum +
          toSafeNumber(
            row.revenue
          ),
        0
      );

    const measurementSales =
      salesRows.reduce(
        (sum, row) =>
          sum +
          toSafeNumber(
            row.revenue
          ),
        0
      );

    // ========================================
    // FINANCIAL SAFETY
    // ========================================

    if (baselineSales <= 0) {
      return NextResponse.json({
        success: true,
        status: "insufficient_data",
        category: "labor",

        message:
          "Baseline POS revenue is zero or unavailable, so labor recovery cannot be calculated safely.",

        calculatedRecovery: 0,
        verifiedRecovery: 0,
      });
    }

    // ========================================
    // NORMALIZED LABOR RECOVERY
    // ========================================

    const baselineLaborRatio =
      baselineLaborCost /
      baselineSales;

    const expectedMeasurementLaborCost =
      measurementSales *
      baselineLaborRatio;

    const rawCalculatedRecovery =
      expectedMeasurementLaborCost -
      measurementLaborCost;

    const calculatedRecovery =
      roundMoney(
        Math.max(
          0,
          rawCalculatedRecovery
        )
      );

    // ========================================
    // BUILD AUDITABLE EVIDENCE
    // ========================================

    const baselineMetrics = {
      laborCost:
        roundMoney(
          baselineLaborCost
        ),

      sales:
        roundMoney(
          baselineSales
        ),

      laborPercent:
        roundPercent(
          baselineLaborRatio * 100
        ),

      laborRowCount:
        baselineLaborRows.length,

      salesRowCount:
        baselineSalesRows.length,

      laborDayCount:
        baselineLaborDates.length,

      salesDayCount:
        baselineSalesDates.length,

      overlapDays:
        baselineOverlapDays,

      coveragePercent:
        roundPercent(
          baselineCoverageRatio * 100
        ),
    };

    const measuredMetrics = {
      laborCost:
        roundMoney(
          measurementLaborCost
        ),

      sales:
        roundMoney(
          measurementSales
        ),

      expectedLaborCost:
        roundMoney(
          expectedMeasurementLaborCost
        ),

      actualLaborPercent:
        measurementSales > 0
          ? roundPercent(
              (
                measurementLaborCost /
                measurementSales
              ) * 100
            )
          : null,

      laborRowCount:
        laborRows.length,

      salesRowCount:
        salesRows.length,

      laborDayCount:
        measurementLaborDates.length,

      salesDayCount:
        measurementSalesDates.length,

      overlapDays:
        measurementOverlapDays,

      coveragePercent:
        roundPercent(
          measurementCoverageRatio * 100
        ),

      rawCalculatedRecovery:
        roundMoney(
          rawCalculatedRecovery
        ),
    };

    const evidenceSources = [
      {
        source:
          "employee_shifts",
        period:
          "baseline",
        startDate:
          baselineStart,
        endDate:
          baselineEnd,
        rowCount:
          baselineLaborRows.length,
      },
      {
        source:
          "sales",
        period:
          "baseline",
        startDate:
          baselineStart,
        endDate:
          baselineEnd,
        rowCount:
          baselineSalesRows.length,
      },
      {
        source:
          "employee_shifts",
        period:
          "measurement",
        startDate:
          measurementStart,
        endDate:
          measurementEnd,
        rowCount:
          laborRows.length,
      },
      {
        source:
          "sales",
        period:
          "measurement",
        startDate:
          measurementStart,
        endDate:
          measurementEnd,
        rowCount:
          salesRows.length,
      },
    ];

    // ========================================
    // SAVE / UPDATE VERIFICATION RECORD
    //
    // IMPORTANT:
    // This remains "measuring".
    //
    // verified_recovery stays NULL.
    //
    // No monthly ledger update.
    // No performance fee.
    // No Stripe.
    // ========================================

    const {
      data: existingVerification,
      error: existingVerificationError,
    } = await supabaseAdmin
      .from("ai_action_verifications")
      .select(
        `
        id,
        verification_status,
        verified_recovery,
        verified_at
        `
      )
      .eq("action_id", actionId)
      .eq("user_id", userId)
      .eq("location_id", locationId)
      .eq(
        "measurement_start",
        measurementStart
      )
      .eq(
        "measurement_end",
        measurementEnd
      )
      .maybeSingle();

    if (existingVerificationError) {
      throw existingVerificationError;
    }

    // Never overwrite a financially verified record
    // with a new measuring calculation.
    if (
      existingVerification?.verification_status ===
        "verified"
    ) {
      return NextResponse.json({
        success: true,
        status: "already_verified",
        category: "labor",

        verificationId:
          existingVerification.id,

        calculatedRecovery,

        verifiedRecovery:
          toSafeNumber(
            existingVerification
              .verified_recovery
          ),

        message:
          "This labor recovery period has already been verified. The verified financial record was not modified.",
      });
    }

    const verificationPayload = {
      action_id:
        actionId,

      user_id:
        userId,

      location_id:
        locationId,

      location_name:
        actionRow.location_name ||
        null,

      recovery_category:
        "labor",

      verification_status:
        "measuring",

      baseline_start:
        baselineStart,

      baseline_end:
        baselineEnd,

      measurement_start:
        measurementStart,

      measurement_end:
        measurementEnd,

      baseline_metrics:
        baselineMetrics,

      measured_metrics:
        measuredMetrics,

      evidence_sources:
        evidenceSources,

      calculated_recovery:
        calculatedRecovery,

      // DO NOT VERIFY HERE.
      verified_recovery:
        null,

      verified_at:
        null,

      updated_at:
        new Date().toISOString(),
    };

    let verificationRecord = null;

    if (existingVerification?.id) {
      const {
        data: updatedVerification,
        error: updateVerificationError,
      } = await supabaseAdmin
        .from("ai_action_verifications")
        .update(
          verificationPayload
        )
        .eq(
          "id",
          existingVerification.id
        )
        .select()
        .single();

      if (updateVerificationError) {
        throw updateVerificationError;
      }

      verificationRecord =
        updatedVerification;
    } else {
      const {
        data: insertedVerification,
        error: insertVerificationError,
      } = await supabaseAdmin
        .from("ai_action_verifications")
        .insert(
          verificationPayload
        )
        .select()
        .single();

      if (insertVerificationError) {
        throw insertVerificationError;
      }

      verificationRecord =
        insertedVerification;
    }

    // ========================================
    // UPDATE ACTION MEASUREMENT STATUS
    //
    // Still NOT financially verified.
    // ========================================

    const {
      error: actionStatusError,
    } = await supabaseAdmin
      .from("ai_applied_actions")
      .update({
        verification_status:
          "measuring",

        // Explicitly keep financial verification
        // empty until the later verification step.
        verified_recovery:
          null,

        verified_at:
          null,
      })
      .eq("id", actionId)
      .eq("user_id", userId);

    if (actionStatusError) {
      throw actionStatusError;
    }

    // ========================================
    // CALCULATED + SAVED
    //
    // NOT VERIFIED.
    // NOT BILLABLE.
    // ========================================

    return NextResponse.json({
      success: true,
      status: "measuring",
      category: "labor",

      actionId,

      verificationId:
        verificationRecord?.id ||
        null,

      evidence: {
        laborSource:
          "employee_shifts",

        salesSource:
          "sales",

        userId,
        locationId,

        baselineStart,
        baselineEnd,

        measurementStart,
        measurementEnd,

        measurementDayCount,

        baselineLaborRowCount:
          baselineLaborRows.length,

        baselineSalesRowCount:
          baselineSalesRows.length,

        measurementLaborRowCount:
          laborRows.length,

        measurementSalesRowCount:
          salesRows.length,

        baselineOverlapDays,

        baselineCoveragePercent:
          roundPercent(
            baselineCoverageRatio * 100
          ),

        measurementOverlapDays,

        measurementCoveragePercent:
          roundPercent(
            measurementCoverageRatio * 100
          ),

        minimumRequiredCoveragePercent:
          minimumCoverageRatio * 100,

        baselineLaborCost:
          roundMoney(
            baselineLaborCost
          ),

        baselineSales:
          roundMoney(
            baselineSales
          ),

        baselineLaborPercent:
          roundPercent(
            baselineLaborRatio * 100
          ),

        measurementLaborCost:
          roundMoney(
            measurementLaborCost
          ),

        measurementSales:
          roundMoney(
            measurementSales
          ),

        expectedMeasurementLaborCost:
          roundMoney(
            expectedMeasurementLaborCost
          ),
      },

      calculatedRecovery,

      verifiedRecovery: 0,

      billable: false,

      message:
        calculatedRecovery > 0
          ? "Labor recovery was calculated and saved as measuring. Financial verification is still required before it can become billable."
          : "Labor evidence was measured and saved, but no positive normalized labor recovery was detected.",
    });
  } catch (error) {
    console.error(
      "LABOR RECOVERY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        status: "error",

        message:
          error?.message ||
          "Unable to evaluate labor recovery.",
      },
      {
        status: Number(
          error?.status || 500
        ),
      }
    );
  }
}