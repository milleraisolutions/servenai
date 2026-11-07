import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const authorization =
      req.headers.get("authorization") || "";

    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
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
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired session.",
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("users")
        .select(
          "id, role, account_type, owner_user_id, business_id, customer_status"
        )
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurant profile not found.",
        },
        { status: 403 }
      );
    }

    const role = String(profile.role || "")
      .trim()
      .toLowerCase();

    const accountType = String(
      profile.account_type || ""
    )
      .trim()
      .toLowerCase();

    if (
      accountType !== "restaurant" ||
      profile.owner_user_id ||
      !["owner", "executive"].includes(role)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurant owner authorization required.",
        },
        { status: 403 }
      );
    }

    if (!profile.business_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Business identity is missing.",
        },
        { status: 403 }
      );
    }

    const { data: business, error: businessError } =
      await supabaseAdmin
        .from("businesses")
        .select("id, owner_user_id, status")
        .eq("id", profile.business_id)
        .eq("owner_user_id", user.id)
        .single();

    if (
      businessError ||
      !business ||
      business.status !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Business ownership verification failed.",
        },
        { status: 403 }
      );
    }

    const { data: agreements, error: agreementError } =
      await supabaseAdmin
        .from("serven_recovery_agreements")
        .select(
          "id, agreement_status, signed_at, signed_by_user_id, contract_start_date, contract_end_date"
        )
        .eq("business_id", business.id)
        .eq("owner_user_id", user.id);

    if (agreementError) {
      console.error(
        "Recovery agreement lookup error:",
        agreementError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify recovery agreement.",
        },
        { status: 500 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const validAgreement = (agreements || []).find(
      (agreement) =>
        agreement.agreement_status === "active" &&
        Boolean(agreement.signed_at) &&
        agreement.signed_by_user_id === user.id &&
        agreement.contract_start_date &&
        agreement.contract_end_date &&
        agreement.contract_start_date <= today &&
        agreement.contract_end_date >= today
    );

    if (!validAgreement) {
      return NextResponse.json(
        {
          success: false,
          authorized: false,
          error:
            "An active, signed recovery agreement is required.",
        },
        { status: 403 }
      );
    }

    // Recommendation-specific verification will be
    // implemented after the agreement gate is tested.
    // Do not authorize any recommendation yet.

    return NextResponse.json(
      {
        success: false,
        authorized: false,
        error:
          "Recommendation authorization is not enabled yet.",
      },
      { status: 403 }
    );
  } catch (error) {
    console.error(
      "Recovery authorization API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Recovery authorization request failed.",
      },
      { status: 500 }
    );
  }
}
