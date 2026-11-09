import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SERVEN_OWNER_USER_ID =
  "908d0bc7-6792-425b-abdb-476cd4612a71";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req) {
  try {
    // 1. Verify authenticated session.
    const authorization = req.headers.get("authorization") || "";

    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user?.id) {
      return NextResponse.json(
        { success: false, error: "Invalid session." },
        { status: 401 }
      );
    }

    // 2. Founder-only authorization.
    if (user.id !== SERVEN_OWNER_USER_ID) {
      return NextResponse.json(
        { success: false, error: "Administrator access required." },
        { status: 403 }
      );
    }

    const supabaseUser = createClient(
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
      data: isPlatformAdmin,
      error: adminError,
    } = await supabaseUser.rpc("is_serven_platform_admin");

    if (adminError || isPlatformAdmin !== true) {
      return NextResponse.json(
        { success: false, error: "Administrator authorization denied." },
        { status: 403 }
      );
    }

    // 3. Read agreement information.
    const body = await req.json();

    const clientUserId = String(body?.client_user_id || "").trim();
    const agreementType = String(body?.agreement_type || "").trim();

    const businessName = String(
      body?.client_business_name || ""
    ).trim();

    const signerName = String(body?.signer_name || "").trim();
    const signerEmail = String(body?.signer_email || "")
      .trim()
      .toLowerCase();

    const monthlyPrice = Number(body?.monthly_price);
    const contractMonths = Number(body?.contract_length_months);
    const recoveryPercent = Number(body?.recovery_fee_percent);

    const services = String(body?.services || "").trim();
    const cancellationPolicy = String(
      body?.cancellation_policy || ""
    ).trim();
    const additionalTerms = String(
      body?.additional_terms || ""
    ).trim();

    // 4. Validate required fields.
    if (
      !UUID_PATTERN.test(clientUserId) ||
      !["pilot", "subscription"].includes(agreementType) ||
      !businessName ||
      !signerName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail) ||
      !services ||
      !cancellationPolicy ||
      !Number.isFinite(recoveryPercent) ||
      recoveryPercent < 0 ||
      recoveryPercent > 100 ||
      (agreementType === "subscription" &&
        (
          body?.monthly_price === "" ||
          body?.monthly_price == null ||
          !Number.isFinite(monthlyPrice) ||
          monthlyPrice < 0 ||
          !Number.isInteger(contractMonths) ||
          contractMonths !== 12
        ))
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or incomplete agreement details." },
        { status: 400 }
      );
    }

    if (
      [businessName, signerName, signerEmail].some(
        (value) => value.length > 255
      ) ||
      [services, cancellationPolicy, additionalTerms].some(
        (value) => value.length > 20000
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Agreement content exceeds allowed limits." },
        { status: 400 }
      );
    }

    // 5. Verify the restaurant account exists.
    const { data: client, error: clientError } =
      await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", clientUserId)
        .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: "Restaurant account not found." },
        { status: 404 }
      );
    }

    // 6. Preserve the draft terms as a structured snapshot.
    const agreementContent = JSON.stringify({
      schema_version: 1,
      agreement_type: agreementType,
      business_name: businessName,
      signer_name: signerName,
      signer_email: signerEmail,
      monthly_price:
        agreementType === "subscription" ? monthlyPrice : null,
      contract_length_months:
        agreementType === "subscription" ? contractMonths : null,
      recovery_fee_percent: recoveryPercent,
      services,
      cancellation_policy: cancellationPolicy,
      additional_terms: additionalTerms,
    });

    // 7. Create a new draft only.
    const { data: agreement, error: saveError } =
      await supabaseAdmin
        .from("client_agreements")
        .insert({
          client_user_id: clientUserId,
          agreement_type: agreementType,
          agreement_status: "draft",
          client_business_name: businessName,
          signer_name: signerName,
          signer_email: signerEmail,
          monthly_price:
            agreementType === "subscription" ? monthlyPrice : null,
          contract_length_months:
            agreementType === "subscription" ? contractMonths : null,
          recovery_fee_percent: recoveryPercent,
          agreement_version: 1,
          agreement_content: agreementContent,
        })
        .select("id, agreement_status, created_at")
        .single();

    if (saveError) {
      console.error("AGREEMENT SAVE ERROR:", saveError);
      return NextResponse.json(
        { success: false, error: "Could not save agreement." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agreement,
    });
  } catch (error) {
    console.error("AGREEMENT API ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Agreement request failed." },
      { status: 500 }
    );
  }
}