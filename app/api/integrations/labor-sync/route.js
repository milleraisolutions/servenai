import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // ========================================
    // AUTHENTICATE REQUEST
    // ========================================

    const authHeader =
      request.headers.get("authorization") || "";

    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user: authenticatedUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !authenticatedUser?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired authentication.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      connectionId,
      shifts,
    } = body || {};

    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing connectionId.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(shifts) || shifts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No labor shifts were provided.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // LOAD CONNECTION
    // ========================================

    const {
      data: connection,
      error: connectionError,
    } = await supabaseAdmin
      .from("restaurant_connections")
      .select(`
        id,
        user_id,
        location_id,
        provider,
        status,
        external_account_id,
        external_location_id
      `)
      .eq("id", connectionId)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        {
          success: false,
          error:
            connectionError?.message ||
            "Restaurant connection was not found.",
        },
        { status: 404 }
      );
    }
// ========================================
// SERVEN TEAM AUTHORIZATION
// ========================================

const isConnectionOwner =
  String(connection.user_id) ===
  String(authenticatedUser.id);

let authorizedForSync = isConnectionOwner;

if (!isConnectionOwner) {
  // Load the signed-in team member's Serven profile.
  const {
    data: teamProfile,
    error: teamProfileError,
  } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", authenticatedUser.id)
    .maybeSingle();

  if (teamProfileError) {
    console.error(
      "LABOR SYNC TEAM PROFILE ERROR:",
      teamProfileError
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Your Serven team permissions could not be verified.",
      },
      { status: 403 }
    );
  }

  if (!teamProfile) {
    return NextResponse.json(
      {
        success: false,
        error:
          "No Serven team profile was found for this user.",
      },
      { status: 403 }
    );
  }

  const teamOwnerId = String(
    teamProfile.owner_user_id || ""
  ).trim();

  const teamRole = String(
    teamProfile.role || ""
  )
    .trim()
    .toLowerCase();

  // Team member must belong to the restaurant account
  // that owns this connection.
  const belongsToConnectionOwner =
    teamOwnerId &&
    teamOwnerId === String(connection.user_id);

const accountWideSyncRoles = [
  "restaurant_owner",
  "owner",
  "executive",
  "corporate_admin",
  "coo",
];

  const locationSyncRoles = [
    "gm",
    "general_manager",
    "store_manager",
    "assistant_manager",
    "kitchen_manager",
  ];

  if (
    belongsToConnectionOwner &&
    accountWideSyncRoles.includes(teamRole)
  ) {
    authorizedForSync = true;
  }
// ========================================
// REGIONAL DIRECTOR LOCATION AUTHORIZATION
// ========================================

if (
  belongsToConnectionOwner &&
  teamRole === "regional_director"
) {
  // Regional Directors must operate against a
  // specific restaurant connection/location.
  // They cannot sync an unrestricted All Locations connection.
  if (!connection.location_id) {
    authorizedForSync = false;
  } else {
    const {
      data: regionalAssignment,
      error: regionalAssignmentError,
    } = await supabaseAdmin
      .from("user_location_assignments")
      .select("id, user_id, owner_user_id, location_id, role")
      .eq("user_id", authenticatedUser.id)
      .eq("owner_user_id", connection.user_id)
      .eq("location_id", connection.location_id)
      .maybeSingle();

    console.log(
      "LABOR SYNC REGIONAL ASSIGNMENT:",
      regionalAssignment
    );

    console.log(
      "LABOR SYNC REGIONAL ASSIGNMENT ERROR:",
      regionalAssignmentError
    );

    if (regionalAssignmentError) {
      authorizedForSync = false;
    } else {
      authorizedForSync =
        Boolean(regionalAssignment?.id);
    }
  }
}
  // ========================================
  // LOCATION-RESTRICTED MANAGEMENT ROLES
  // ========================================

  if (
    belongsToConnectionOwner &&
    locationSyncRoles.includes(teamRole)
  ) {
    const assignedLocationName = String(
      teamProfile.location_name || ""
    )
      .trim()
      .toLowerCase();

    // Global/company-wide connection:
    // location managers should not be allowed to sync
    // every location in the company.
    if (!connection.location_id) {
      authorizedForSync = false;
    } else {
      const {
        data: connectionLocation,
        error: connectionLocationError,
      } = await supabaseAdmin
        .from("locations")
        .select("id, location_name")
        .eq("id", connection.location_id)
        .eq("user_id", connection.user_id)
        .maybeSingle();

      if (connectionLocationError) {
        console.error(
          "LABOR SYNC LOCATION AUTH ERROR:",
          connectionLocationError
        );

        authorizedForSync = false;
      } else {
        const connectionLocationName = String(
          connectionLocation?.location_name || ""
        )
          .trim()
          .toLowerCase();

        authorizedForSync =
          Boolean(assignedLocationName) &&
          Boolean(connectionLocationName) &&
          assignedLocationName ===
            connectionLocationName;
      }
    }
  }

  console.log("LABOR SYNC AUTHORIZATION:", {
    authenticatedUserId: authenticatedUser.id,
    connectionOwnerId: connection.user_id,
    teamOwnerId,
    teamRole,
    authorizedForSync,
  });
}

if (!authorizedForSync) {
  return NextResponse.json(
    {
      success: false,
      error:
        "You do not have permission to sync labor data for this restaurant connection.",
    },
    { status: 403 }
  );
}
    const ownerId = connection.user_id;

    // ========================================
    // BUILD EMPLOYEE DIRECTORY
    // ========================================

    const employeeNames = [
      ...new Set(
        shifts
          .map((shift) =>
            String(
              shift.employee_name ||
                shift.employee ||
                ""
            ).trim()
          )
          .filter(Boolean)
      ),
    ];

    const {
      data: existingEmployees,
      error: employeeLoadError,
    } = await supabaseAdmin
      .from("employees")
      .select("id, employee_name")
      .eq("user_id", ownerId);

    if (employeeLoadError) {
      throw employeeLoadError;
    }

    const employeeLookup = new Map(
      (existingEmployees || []).map((employee) => [
        String(employee.employee_name || "")
          .trim()
          .toLowerCase(),
        employee.id,
      ])
    );

    const missingEmployees = employeeNames
      .filter(
        (name) =>
          !employeeLookup.has(
            name.toLowerCase()
          )
      )
      .map((name) => {
        const matchingShift = shifts.find(
          (shift) =>
            String(
              shift.employee_name ||
                shift.employee ||
                ""
            )
              .trim()
              .toLowerCase() ===
            name.toLowerCase()
        );

        return {
          user_id: ownerId,
          employee_name: name,
          role:
            matchingShift?.role ||
            matchingShift?.position ||
            null,
          department: "Labor",
          hourly_rate: Number(
            matchingShift?.hourly_rate ||
              matchingShift?.rate ||
              0
          ),
          status: "active",
        };
      });

    if (missingEmployees.length > 0) {
      const {
        data: insertedEmployees,
        error: employeeInsertError,
      } = await supabaseAdmin
        .from("employees")
        .insert(missingEmployees)
        .select("id, employee_name");

      if (employeeInsertError) {
        throw employeeInsertError;
      }

      (insertedEmployees || []).forEach(
        (employee) => {
          employeeLookup.set(
            String(employee.employee_name || "")
              .trim()
              .toLowerCase(),
            employee.id
          );
        }
      );
    }

    // ========================================
    // NORMALIZE PROVIDER SHIFTS
    // ========================================

    const rowsToInsert = shifts.map((shift) => {
      const employeeName = String(
        shift.employee_name ||
          shift.employee ||
          "Unknown Employee"
      ).trim();

      return {
        user_id: ownerId,

        employee_id:
          employeeLookup.get(
            employeeName.toLowerCase()
          ) || null,

        upload_id: null,

        file_name: null,

        employee_name: employeeName,

        role:
          shift.role ||
          shift.position ||
          null,

        shift_date:
          shift.shift_date ||
          shift.work_date ||
          shift.date ||
          null,

        shift_start:
          shift.shift_start ||
          shift.clock_in ||
          null,

        shift_end:
          shift.shift_end ||
          shift.clock_out ||
          null,

        hours_worked: Number(
          shift.hours_worked ||
            shift.hours ||
            0
        ),

        hourly_rate: Number(
          shift.hourly_rate ||
            shift.rate ||
            0
        ),

        labor_cost: Number(
          shift.labor_cost ||
            0
        ),

        revenue_during_shift: Number(
          shift.revenue_during_shift ||
            shift.sales_generated ||
            0
        ),

        location_name:
          shift.location_name ||
          shift.location ||
          null,

        connection_id: connection.id,
      };
    });

    // ========================================
    // INSERT CANONICAL SHIFTS
    // ========================================

    const {
      data: insertedShifts,
      error: shiftInsertError,
    } = await supabaseAdmin
      .from("employee_shifts")
      .insert(rowsToInsert)
      .select();

    if (shiftInsertError) {
      throw shiftInsertError;
    }

    // ========================================
    // MARK CONNECTION SUCCESSFUL
    // ========================================

    const now = new Date().toISOString();

    const {
      error: connectionUpdateError,
    } = await supabaseAdmin
      .from("restaurant_connections")
      .update({
        last_sync_at: now,
        last_sync_status: "success",
        last_sync_error: null,
        updated_at: now,
      })
      .eq("id", connection.id);

    if (connectionUpdateError) {
      throw connectionUpdateError;
    }

    return NextResponse.json({
      success: true,
      provider: connection.provider,
      connectionId: connection.id,
      insertedShiftCount:
        insertedShifts?.length || 0,
      shifts: insertedShifts || [],
    });
  } catch (error) {
    console.error(
      "LABOR INTEGRATION SYNC ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Labor integration sync failed.",
      },
      { status: 500 }
    );
  }
}