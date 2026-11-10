import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { randomBytes, createHash } from "node:crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SERVEN_OWNER_USER_ID =
  "908d0bc7-6792-425b-abdb-476cd4612a71";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// SerVen agreement email configuration.
// Email delivery remains disabled until the
// secure signing workflow is completed.

const resend = new Resend(process.env.RESEND_API_KEY);

const AGREEMENT_FROM_EMAIL =
  process.env.AGREEMENT_FROM_EMAIL ||
  "SerVen Agreements <agreements@servenai.com>";

const SERVEN_PUBLIC_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://servenai.com";
  // Escape dynamic values before inserting them into email HTML.
function escapeAgreementHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]
  );
}

// Build the agreement invitation email.
// This function only creates HTML; it does not send anything.
function buildAgreementEmail({
  businessName,
  signerName,
  agreementType,
  signingUrl,
}) {
  const safeBusinessName = escapeAgreementHtml(businessName);
  const safeSignerName = escapeAgreementHtml(signerName);
  const safeSigningUrl = escapeAgreementHtml(signingUrl);

  const agreementLabel =
    agreementType === "pilot"
      ? "30-Day Pilot Agreement"
      : "SerVen Subscription Agreement";

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;color:#111827;">
      <h1 style="color:#4f46e5;">SerVen</h1>

      <h2>Agreement Ready for Review</h2>

      <p>Hello ${safeSignerName},</p>

      <p>
        SerVen has prepared a
        <strong>${agreementLabel}</strong>
        for <strong>${safeBusinessName}</strong>.
      </p>

      <p>
        Please review the complete agreement before
        deciding whether to electronically sign.
      </p>

      <div style="margin:30px 0;">
        <a
          href="${safeSigningUrl}"
          style="background:#4f46e5;color:#ffffff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold;"
        >
          Review & Sign Agreement
        </a>
      </div>

      <p style="font-size:13px;color:#64748b;">
        This is a private signing link intended for you.
        Do not forward it.
      </p>

      <p style="font-size:13px;color:#64748b;">
        The signing link expires seven days after issuance.
      </p>

      <p>
        Thank you,<br />
        <strong>SerVen Agreements Team</strong>
      </p>
    </div>
  `;
}
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
          error: "Invalid authentication session.",
        },
        { status: 401 }
      );
    }

    if (user.id !== SERVEN_OWNER_USER_ID) {
      return NextResponse.json(
        {
          success: false,
          error: "Administrator access required.",
        },
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
    } = await supabaseUser.rpc(
      "is_serven_platform_admin"
    );

    if (adminError || isPlatformAdmin !== true) {
      return NextResponse.json(
        {
          success: false,
          error: "Administrator authorization denied.",
        },
        { status: 403 }
      );
    }
// 1. Read the agreement selected for delivery.
const body = await req.json();

const agreementId = String(
  body?.agreement_id || ""
).trim();

if (!UUID_PATTERN.test(agreementId)) {
  return NextResponse.json(
    {
      success: false,
      error: "A valid agreement ID is required.",
    },
    { status: 400 }
  );
}

// 2. Retrieve the saved agreement from Supabase.
const { data: agreement, error: agreementError } =
  await supabaseAdmin
    .from("client_agreements")
    .select(`
      id,
      client_user_id,
      agreement_type,
      agreement_status,
      client_business_name,
      signer_name,
      signer_email,
      monthly_price,
      contract_length_months,
      recovery_fee_percent,
      agreement_version,
      agreement_content
    `)
    .eq("id", agreementId)
    .maybeSingle();

if (agreementError) {
  console.error(
    "AGREEMENT SEND LOOKUP ERROR:",
    agreementError
  );

  return NextResponse.json(
    {
      success: false,
      error: "Could not retrieve agreement.",
    },
    { status: 500 }
  );
}

if (!agreement) {
  return NextResponse.json(
    {
      success: false,
      error: "Agreement not found.",
    },
    { status: 404 }
  );
}

// 3. Only saved drafts can begin delivery.
if (agreement.agreement_status !== "draft") {
  return NextResponse.json(
    {
      success: false,
      error: "Only draft agreements can be sent.",
    },
    { status: 409 }
  );
}
// 4. Validate agreement details before delivery.
const signerEmail = String(
  agreement.signer_email || ""
).trim().toLowerCase();

const signerName = String(
  agreement.signer_name || ""
).trim();

const businessName = String(
  agreement.client_business_name || ""
).trim();

const agreementType = agreement.agreement_type;

const monthlyPrice = Number(agreement.monthly_price);
const contractMonths = Number(
  agreement.contract_length_months
);

const recoveryPercent = Number(
  agreement.recovery_fee_percent
);

let agreementContent;

try {
  agreementContent = JSON.parse(
    agreement.agreement_content || "{}"
  );
} catch {
  return NextResponse.json(
    {
      success: false,
      error: "Agreement document content is invalid.",
    },
    { status: 400 }
  );
}

const validEmail =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail);

const validSubscription =
  agreementType !== "subscription" ||
  (
    Number.isFinite(monthlyPrice) &&
    monthlyPrice >= 0 &&
    [6, 12].includes(contractMonths)
  );

if (
  !UUID_PATTERN.test(agreement.client_user_id || "") ||
  !["pilot", "subscription"].includes(agreementType) ||
  !businessName ||
  !signerName ||
  !validEmail ||
  !validSubscription ||
  !Number.isFinite(recoveryPercent) ||
  recoveryPercent < 0 ||
  recoveryPercent > 100 ||
  !agreementContent ||
  Array.isArray(agreementContent) ||
  typeof agreementContent !== "object" ||
  !String(agreementContent.services || "").trim() ||
  !String(agreementContent.cancellation_policy || "").trim()
) {
  return NextResponse.json(
    {
      success: false,
      error: "Agreement is incomplete and cannot be sent.",
    },
    { status: 400 }
  );
}
// Verify the saved document matches the agreement record.
const documentMatchesRecord =
  agreementContent.agreement_type === agreementType &&
  agreementContent.business_name === businessName &&
  agreementContent.signer_name === signerName &&
  agreementContent.signer_email === signerEmail &&
  Number(agreementContent.recovery_fee_percent) ===
    recoveryPercent &&
  (
    agreementType !== "subscription" ||
    (
      Number(agreementContent.monthly_price) === monthlyPrice &&
      Number(agreementContent.contract_length_months) ===
        contractMonths
    )
  );

if (!documentMatchesRecord) {
  return NextResponse.json(
    {
      success: false,
      error:
        "Agreement document does not match saved contract details.",
    },
    { status: 409 }
  );
}
// 5. Prepare a cryptographically secure signing token.
// The raw token will eventually appear only in the
// private signing link sent to the intended recipient.
const signingToken = randomBytes(32).toString("hex");

const signingTokenHash = createHash("sha256")
  .update(signingToken)
  .digest("hex");

// 6. Fingerprint the exact saved agreement content.
// This is temporary preparation; no database write yet.
const documentHash = createHash("sha256")
  .update(agreement.agreement_content, "utf8")
  .digest("hex");

// 7. Prepare a seven-day signing-link expiration.
const signingTokenExpiresAt = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000
).toISOString();
// 8. Construct the private agreement signing URL.
// Never log or return this URL through the admin API.
const signingUrl = new URL(
  "/agreements/sign",
  SERVEN_PUBLIC_URL
);

signingUrl.searchParams.set("token", signingToken);

const privateSigningUrl = signingUrl.toString();
// Signing links are sensitive credentials.
// Never print the token or full signing URL to logs.
// The future signing page must use no-store caching
// and a restrictive Referrer-Policy.
// Prepare the invitation email without sending it.
const agreementEmailHtml = buildAgreementEmail({
  businessName,
  signerName,
  agreementType,
  signingUrl: privateSigningUrl,
});
// Do not log, return, or expose the raw signing token.
// 8. Prepare agreement delivery in Supabase.
//
// SAFETY: This block remains disabled until the
// email delivery and recovery workflow is complete.
if (false) {
  const { data: deliveryPrepared, error: preparationError } =
    await supabaseAdmin.rpc(
      "prepare_client_agreement_delivery",
      {
        p_agreement_id: agreementId,
        p_token_hash: signingTokenHash,
        p_token_expires_at: signingTokenExpiresAt,
        p_document_hash: documentHash,
      }
    );

  if (preparationError) {
    console.error(
      "AGREEMENT DELIVERY PREPARATION ERROR:",
      preparationError
    );

    return NextResponse.json(
      {
        success: false,
        error: "Could not prepare agreement delivery.",
      },
      { status: 500 }
    );
  }

  if (deliveryPrepared !== true) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Agreement is already being sent or is no longer available.",
      },
      { status: 409 }
    );
  }
}
    return NextResponse.json(
      {
        success: false,
        error: "Agreement delivery is not enabled yet.",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("AGREEMENT SEND API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Agreement delivery request failed.",
      },
      { status: 500 }
    );
  }
}