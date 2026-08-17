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
    const forbiddenError = new Error(
      "You are not authorized to synchronize recovery ledgers."
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
      (
        toSafeNumber(value) +
        Number.EPSILON
      ) * 100
    ) / 100
  );
}

// ========================================
// DATE HELPERS
// ========================================

function getMonthPeriod(
  billingYear,
  billingMonth
) {
  const year = Number(billingYear);
  const month = Number(billingMonth);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const periodStartDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1
      )
    );

  const periodEndDate =
    new Date(
      Date.UTC(
        year,
        month,
        0
      )
    );

  return {
    periodStart:
      periodStartDate
        .toISOString()
        .split("T")[0],

    periodEnd:
      periodEndDate
        .toISOString()
        .split("T")[0],
  };
}

// ========================================
// POST
// ========================================

export async function POST(req) {
  try {
    await getAuthenticatedOwner(req);

    const body = await req.json();

    const {
      userId,
      locationId,
      billingYear,
      billingMonth,
    } = body || {};

    // ========================================
    // REQUEST VALIDATION
    // ========================================

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "Missing userId.",
        },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "Missing locationId.",
        },
        { status: 400 }
      );
    }

    const year =
      Number(billingYear);

    const month =
      Number(billingMonth);

    const period =
      getMonthPeriod(
        year,
        month
      );

    if (!period) {
      return NextResponse.json(
        {
          success: false,
          status: "invalid_request",
          message:
            "billingYear and billingMonth must identify a valid calendar month.",
        },
        { status: 400 }
      );
    }

    const {
      periodStart,
      periodEnd,
    } = period;

    // ========================================
    // VERIFY LOCATION EXISTS
    // ========================================

    const {
      data: location,
      error: locationError,
    } = await supabaseAdmin
      .from("locations")
      .select(
        `
        id,
        user_id,
        location_name
        `
      )
      .eq("id", locationId)
      .maybeSingle();

    if (locationError) {
      throw locationError;
    }

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          status: "location_not_found",
          message:
            "The requested location does not exist.",
        },
        { status: 404 }
      );
    }

    if (
      location.user_id &&
      String(location.user_id) !==
        String(userId)
    ) {
      return NextResponse.json(
        {
          success: false,
          status:
            "location_user_mismatch",

          message:
            "The location does not belong to the requested client.",
        },
        { status: 400 }
      );
    }

    const locationName =
      location.location_name || null;

    // ========================================
    // LOAD VERIFIED LABOR RECOVERY
    //
    // ONLY:
    // verification_status = verified
    // recovery_category = labor
    // exact user
    // exact location
    // exact calendar month
    //
    // calculated_recovery is NOT billable.
    // impact_value is NOT billable.
    // ========================================

    const {
      data: verifiedLaborRows,
      error: verifiedLaborError,
    } = await supabaseAdmin
      .from(
        "ai_action_verifications"
      )
      .select(
        `
        id,
        action_id,
        verified_recovery,
        verified_at,
        measurement_start,
        measurement_end,
        verification_status,
        recovery_category
        `
      )
      .eq("user_id", userId)
      .eq(
        "location_id",
        locationId
      )
      .eq(
        "recovery_category",
        "labor"
      )
      .eq(
        "verification_status",
        "verified"
      )
      .gte(
        "measurement_start",
        periodStart
      )
      .lte(
        "measurement_start",
        periodEnd
      );

    if (verifiedLaborError) {
      throw verifiedLaborError;
    }

    // ========================================
    // SUM ONLY VERIFIED DOLLARS
    // ========================================

    const laborRecovery =
      roundMoney(
        (
          verifiedLaborRows || []
        ).reduce(
          (sum, row) => {
            const value =
              toSafeNumber(
                row.verified_recovery
              );

            if (value <= 0) {
              return sum;
            }

            return sum + value;
          },
          0
        )
      );

    // ========================================
    // LOAD EXISTING LEDGER
    // ========================================

    const {
      data: existingLedger,
      error: ledgerLoadError,
    } = await supabaseAdmin
      .from(
        "monthly_recovery_ledger"
      )
      .select("*")
      .eq("user_id", userId)
      .eq(
        "location_id",
        locationId
      )
      .eq(
        "billing_year",
        year
      )
      .eq(
        "billing_month",
        month
      )
      .maybeSingle();

    if (ledgerLoadError) {
      throw ledgerLoadError;
    }

    // ========================================
    // LOCK PROTECTION
    //
    // Once a month is locked, synchronization
    // may NEVER rewrite its financial values.
    // ========================================

    if (
      existingLedger?.status ===
        "locked" ||
      existingLedger?.locked_at
    ) {
      return NextResponse.json({
        success: false,
        status: "ledger_locked",

        ledgerId:
          existingLedger.id,

        userId,
        locationId,
        locationName,

        billingYear: year,
        billingMonth: month,

        periodStart,
        periodEnd,

        laborRecovery:
          roundMoney(
            existingLedger
              .labor_recovery
          ),

        totalVerifiedRecovery:
          roundMoney(
            existingLedger
              .total_verified_recovery
          ),

        priorPeriodAdjustmentRecovery:
          roundMoney(
            existingLedger
              .prior_period_adjustment_recovery
          ),

        billableRecoveryTotal:
          roundMoney(
            existingLedger
              .billable_recovery_total
          ),

        message:
          "This monthly recovery ledger is locked and cannot be recalculated.",
      });
    }

    // ========================================
    // PRESERVE OTHER RECOVERY CATEGORIES
    //
    // Labor sync must never overwrite:
    //
    // menu pricing
    // inventory/waste
    // vendor/purchasing
    // ========================================

    const menuPricingRecovery =
      roundMoney(
        existingLedger
          ?.menu_pricing_recovery ||
          0
      );

    const inventoryWasteRecovery =
      roundMoney(
        existingLedger
          ?.inventory_waste_recovery ||
          0
      );

    const vendorPurchasingRecovery =
      roundMoney(
        existingLedger
          ?.vendor_purchasing_recovery ||
          0
      );

    // ========================================
    // CURRENT-PERIOD VERIFIED RECOVERY
    // ========================================

    const totalVerifiedRecovery =
      roundMoney(
        laborRecovery +
          menuPricingRecovery +
          inventoryWasteRecovery +
          vendorPurchasingRecovery
      );

    // ========================================
    // PRESERVE PRIOR-PERIOD ADJUSTMENTS
    //
    // These adjustments were already applied
    // through the atomic adjustment workflow.
    //
    // A normal recovery sync must NEVER erase
    // them.
    // ========================================

    const priorPeriodAdjustmentRecovery =
      roundMoney(
        existingLedger
          ?.prior_period_adjustment_recovery ||
          0
      );

    // ========================================
    // BILLABLE RECOVERY BASIS
    //
    // Operational recovery for THIS month
    // remains separate from recovery belonging
    // to older locked months.
    //
    // Billable basis =
    // current-period verified recovery
    // +
    // prior-period adjustments
    // ========================================

    const billableRecoveryTotal =
      roundMoney(
        totalVerifiedRecovery +
          priorPeriodAdjustmentRecovery
      );

    const now =
      new Date().toISOString();

    // ========================================
    // UPDATE EXISTING OPEN LEDGER
    // ========================================

    if (existingLedger) {
      const {
        data: updatedLedger,
        error: updateError,
      } = await supabaseAdmin
        .from(
          "monthly_recovery_ledger"
        )
        .update({
          location_name:
            locationName,

          period_start:
            periodStart,

          period_end:
            periodEnd,

          labor_recovery:
            laborRecovery,

          total_verified_recovery:
            totalVerifiedRecovery,

          /*
            IMPORTANT:

            Preserve the already-applied
            adjustment amount and recalculate
            the billable basis whenever current
            operational recovery changes.
          */
          prior_period_adjustment_recovery:
            priorPeriodAdjustmentRecovery,

          billable_recovery_total:
            billableRecoveryTotal,

          updated_at: now,
        })
        .eq(
          "id",
          existingLedger.id
        )
        .eq(
          "status",
          "open"
        )
        .is(
          "locked_at",
          null
        )
        .select("*")
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      /*
        If no row came back, another process may
        have locked the ledger between our read
        and update.

        Never retry by force.
      */
      if (!updatedLedger) {
        return NextResponse.json(
          {
            success: false,
            status:
              "ledger_changed",

            message:
              "The ledger changed while synchronization was running. No financial values were overwritten.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        status: "synced",

        ledgerId:
          updatedLedger.id,

        userId,
        locationId,
        locationName,

        billingYear: year,
        billingMonth: month,

        periodStart,
        periodEnd,

        recovery: {
          labor:
            roundMoney(
              updatedLedger
                .labor_recovery
            ),

          menuPricing:
            roundMoney(
              updatedLedger
                .menu_pricing_recovery
            ),

          inventoryWaste:
            roundMoney(
              updatedLedger
                .inventory_waste_recovery
            ),

          vendorPurchasing:
            roundMoney(
              updatedLedger
                .vendor_purchasing_recovery
            ),

          total:
            roundMoney(
              updatedLedger
                .total_verified_recovery
            ),

          priorPeriodAdjustments:
            roundMoney(
              updatedLedger
                .prior_period_adjustment_recovery
            ),

          billableTotal:
            roundMoney(
              updatedLedger
                .billable_recovery_total
            ),
        },

        verifiedLaborRecords:
          verifiedLaborRows?.length ||
          0,

        ledgerStatus:
          updatedLedger.status,

        billable: false,

        message:
          "Verified labor recovery was synchronized while preserving prior-period adjustments.",
      });
    }

    // ========================================
    // CREATE NEW OPEN LEDGER
    //
    // A new month begins with no prior-period
    // adjustments unless one is explicitly
    // applied later through the adjustment
    // workflow.
    // ========================================

    const {
      data: createdLedger,
      error: insertError,
    } = await supabaseAdmin
      .from(
        "monthly_recovery_ledger"
      )
      .insert({
        user_id: userId,

        location_id:
          locationId,

        location_name:
          locationName,

        billing_year:
          year,

        billing_month:
          month,

        period_start:
          periodStart,

        period_end:
          periodEnd,

        labor_recovery:
          laborRecovery,

        menu_pricing_recovery: 0,

        inventory_waste_recovery: 0,

        vendor_purchasing_recovery: 0,

        total_verified_recovery:
          laborRecovery,

        // No adjustments exist yet.
        prior_period_adjustment_recovery:
          0,

        // Initially the billable basis equals
        // current-period verified recovery.
        billable_recovery_total:
          laborRecovery,

        performance_fee_percentage:
          15,

        /*
          IMPORTANT:

          We are deliberately NOT calculating
          the performance fee yet.

          The fee stays zero until the month is
          financially locked.
        */
        performance_fee_amount: 0,

        status: "open",

        locked_at: null,

        updated_at: now,
      })
      .select("*")
      .single();

    if (insertError) {
      /*
        The unique database index prevents two
        ledgers for the same
        client/location/month.

        If another request created the row first,
        do not blindly overwrite it.
      */
      if (
        insertError.code === "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            status:
              "ledger_conflict",

            message:
              "A ledger for this client, location, and month was created by another request. Run synchronization again rather than overwriting it.",
          },
          { status: 409 }
        );
      }

      throw insertError;
    }

    return NextResponse.json({
      success: true,
      status: "created",

      ledgerId:
        createdLedger.id,

      userId,
      locationId,
      locationName,

      billingYear: year,
      billingMonth: month,

      periodStart,
      periodEnd,

      recovery: {
        labor:
          roundMoney(
            createdLedger
              .labor_recovery
          ),

        menuPricing: 0,
        inventoryWaste: 0,
        vendorPurchasing: 0,

        total:
          roundMoney(
            createdLedger
              .total_verified_recovery
          ),

        priorPeriodAdjustments:
          roundMoney(
            createdLedger
              .prior_period_adjustment_recovery
          ),

        billableTotal:
          roundMoney(
            createdLedger
              .billable_recovery_total
          ),
      },

      verifiedLaborRecords:
        verifiedLaborRows?.length ||
        0,

      ledgerStatus: "open",

      billable: false,

      message:
        "The monthly recovery ledger was created with verified labor recovery.",
    });
  } catch (error) {
    console.error(
      "RECOVERY LEDGER SYNC ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        status: "error",

        message:
          error?.message ||
          "Unable to synchronize the monthly recovery ledger.",
      },
      {
        status: Number(
          error?.status || 500
        ),
      }
    );
  }
}