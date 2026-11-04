
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const authorization =
      req.headers.get("authorization") || "";

    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user?.id) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
  .from("users")
  .select(
    "id, role, account_type, owner_user_id, business_id, assigned_location_id, location_name, location_access"
  )
  .eq("id", user.id)
  .single();

if (profileError || !profile) {
  return NextResponse.json(
    { success: false, error: "Restaurant account profile not found." },
    { status: 403 }
  );
}

const role = String(profile.role || "").trim().toLowerCase();
const accountType = String(profile.account_type || "")
  .trim()
  .toLowerCase();

if (accountType !== "restaurant") {
  return NextResponse.json(
    { success: false, error: "Restaurant Co-Pilot access is not authorized." },
    { status: 403 }
  );
}

if (profile.owner_user_id) {
  return NextResponse.json(
    {
      success: false,
      error: "Team member Co-Pilot permissions are not enabled yet.",
    },
    { status: 403 }
  );
}

if (!["owner", "executive"].includes(role)) {
  return NextResponse.json(
    {
      success: false,
      error: "Restaurant ownership could not be verified.",
    },
    { status: 403 }
  );
}

const { data: laborRows, error: laborError } = await supabase
  .from("employee_shifts")
  .select(
    "shift_date, hours_worked, hourly_rate, labor_cost, location_name"
  )
  .eq("user_id", user.id)
  .order("shift_date", { ascending: false })
  .limit(1000);

if (laborError) {
  console.error("SERVEN COPILOT LABOR ERROR:", laborError);

  return NextResponse.json(
    {
      success: false,
      error: "Unable to retrieve restaurant labor records.",
    },
    { status: 500 }
  );
}

const rows = laborRows || [];

const totalLaborCost = rows.reduce(
  (sum, row) => sum + Number(row.labor_cost || 0),
  0
);

const totalLaborHours = rows.reduce(
  (sum, row) => sum + Number(row.hours_worked || 0),
  0
);

return NextResponse.json({
  success: true,
  data: {
    labor: {
      recordCount: rows.length,
      totalLaborCost,
      totalLaborHours,
      latestShiftDate: rows[0]?.shift_date || null,
      source: "employee_shifts",
      isHistorical: true,
    },
  },
});
  } catch (error) {
    console.error("SERVEN COPILOT API ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Co-Pilot request failed." },
      { status: 500 }
    );
  }
}

