import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Signing tokens are 32 random bytes encoded as hex.
const SIGNING_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
// Convert a private signing token into a SHA-256 hash.
// Only the hash is used for database lookup.
function hashSigningToken(token) {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}
const securityHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(req) {
  try {
    // Signing verification will be implemented here.
    // Never log or return raw signing tokens.
const body = await req.json();

const signingToken = String(body?.token || "").trim();

if (!SIGNING_TOKEN_PATTERN.test(signingToken)) {
  return NextResponse.json(
    {
      success: false,
      error: "Invalid agreement signing link.",
    },
    {
      status: 400,
      headers: securityHeaders,
    }
  );
}

const signingTokenHash = hashSigningToken(signingToken);

// Look up the agreement using only the hashed token.
const { data: agreement, error: lookupError } =
  await supabaseAdmin
    .from("client_agreements")
   .select(`
  id,
  agreement_status,
  delivery_status,
  signing_token_expires_at,
  signing_token_used_at,
  sent_document_hash,
  agreement_content
`)
    .eq("signing_token_hash", signingTokenHash)
    .maybeSingle();

if (lookupError) {
  console.error(
    "AGREEMENT SIGNING LOOKUP FAILED:",
    lookupError.code
  );

  return NextResponse.json(
    {
      success: false,
      error: "Agreement verification is temporarily unavailable.",
    },
    {
      status: 500,
      headers: securityHeaders,
    }
  );
}

if (!agreement) {
  return NextResponse.json(
    {
      success: false,
      error: "Invalid or unavailable agreement signing link.",
    },
    {
      status: 404,
      headers: securityHeaders,
    }
  );
}
// Verify that the agreement was accepted for delivery.
const validDelivery =
  agreement.delivery_status === "accepted";

// Only sent or viewed agreements are eligible.
const validStatus =
  ["sent", "viewed"].includes(
    agreement.agreement_status
  );

// Verify that the signing link has not expired.
const expirationTime = Date.parse(
  agreement.signing_token_expires_at || ""
);

const validExpiration =
  Number.isFinite(expirationTime) &&
  expirationTime > Date.now();

// Signing tokens can only be used once.
const tokenUnused =
  agreement.signing_token_used_at == null;

// Verify that the agreement has a stored document hash.
const validDocumentHash =
  /^[0-9a-f]{64}$/.test(
    agreement.sent_document_hash || ""
  );

if (
  !validDelivery ||
  !validStatus ||
  !validExpiration ||
  !tokenUnused ||
  !validDocumentHash
) {
  return NextResponse.json(
    {
      success: false,
      error:
        "This agreement signing link is expired, used, or unavailable.",
    },
    {
      status: 403,
      headers: securityHeaders,
    }
  );
}

// Verify the saved agreement has not changed
// since its document fingerprint was recorded.
const currentDocumentHash = createHash("sha256")
  .update(agreement.agreement_content || "", "utf8")
  .digest("hex");

if (currentDocumentHash !== agreement.sent_document_hash) {
  console.error(
    "AGREEMENT DOCUMENT INTEGRITY CHECK FAILED:",
    agreement.id
  );

  return NextResponse.json(
    {
      success: false,
      error: "Agreement document verification failed.",
    },
    {
      status: 409,
      headers: securityHeaders,
    }
  );
}
// Prepare the verified agreement content for display.
// Do not return it until signer access controls are complete.
let verifiedAgreementContent;

try {
  verifiedAgreementContent = JSON.parse(
    agreement.agreement_content
  );
} catch {
  return NextResponse.json(
    {
      success: false,
      error: "Agreement document format is invalid.",
    },
    {
      status: 409,
      headers: securityHeaders,
    }
  );
}

if (
  !verifiedAgreementContent ||
  typeof verifiedAgreementContent !== "object" ||
  Array.isArray(verifiedAgreementContent)
) {
  return NextResponse.json(
    {
      success: false,
      error: "Agreement document is unavailable.",
    },
    {
      status: 409,
      headers: securityHeaders,
    }
  );
}
    return NextResponse.json(
      {
        success: false,
        error: "Agreement signing verification is not enabled yet.",
      },
      {
        status: 501,
        headers: securityHeaders,
      }
    );
  } catch (error) {
    console.error("AGREEMENT VERIFICATION ERROR");

    return NextResponse.json(
      {
        success: false,
        error: "Agreement verification failed.",
      },
      {
        status: 500,
        headers: securityHeaders,
      }
    );
    // Prepare agreement details for the signing page.
// These details will only be returned after
// all signer-access protections are completed.
const signingAgreementDetails = {
  agreement_id: agreement.id,
  agreement_type:
    verifiedAgreementContent.agreement_type,
  business_name:
    verifiedAgreementContent.business_name,
  signer_name:
    verifiedAgreementContent.signer_name,
  monthly_price:
    verifiedAgreementContent.monthly_price,
  contract_length_months:
    verifiedAgreementContent.contract_length_months,
  recovery_fee_percent:
    verifiedAgreementContent.recovery_fee_percent,
  services:
    verifiedAgreementContent.services,
  cancellation_policy:
    verifiedAgreementContent.cancellation_policy,
  additional_terms:
    verifiedAgreementContent.additional_terms,
  document_hash: currentDocumentHash,
};
  }
}