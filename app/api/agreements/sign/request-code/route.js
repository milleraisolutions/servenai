import { NextResponse } from "next/server";
import { randomInt, createHmac, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Server-side agreement verification email configuration.
const resend = new Resend(process.env.RESEND_API_KEY);

const AGREEMENT_VERIFICATION_FROM_EMAIL =
  process.env.AGREEMENT_FROM_EMAIL ||
  "SerVen Agreements <agreements@servenai.com>";
// Server-only Supabase connection.
// Never expose the service role key to the browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Signing tokens must be 64 lowercase hexadecimal characters.
const SIGNING_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

// Create a secure fingerprint of a signing token.
function hashSigningToken(token) {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}
// Check the database-backed verification request limit.
// Uses a protected fingerprint instead of storing raw tokens.
async function checkVerificationRequestRateLimit(token) {
  if (
    typeof token !== "string" ||
    !SIGNING_TOKEN_PATTERN.test(token)
  ) {
    return false;
  }

  const secret = process.env.AGREEMENT_OTP_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "Agreement verification secret is not configured."
    );
  }

  const requestKeyHash = createHmac("sha256", secret)
    .update(`agreement-verification-request:${token}`, "utf8")
    .digest("hex");

  const { data, error } = await supabaseAdmin.rpc(
    "check_agreement_verification_rate_limit",
    {
      p_request_key_hash: requestKeyHash,
    }
  );

  if (error) {
    throw new Error(
      "Agreement verification rate-limit check failed."
    );
  }

  return data === true;
}
// Create a protected identifier for IP-based rate limiting.
// Only trust the IP header supplied by our hosting platform.
function getVerificationIpRateLimitKey(request) {
  const secret = process.env.AGREEMENT_OTP_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "Agreement verification secret is not configured."
    );
  }

  const ip = request.headers.get("x-vercel-forwarded-for");

  // Fail closed when a trusted IP cannot be established.
  if (
    !ip ||
    ip.includes(",") ||
    ip.length > 64
  ) {
    return null;
  }

  return createHmac("sha256", secret)
    .update(`agreement-verification-ip:${ip.trim()}`, "utf8")
    .digest("hex");
}
// Look up an agreement using a valid, unexpired signing token.
async function findEligibleSigningAgreement(token) {
  if (
    typeof token !== "string" ||
    !SIGNING_TOKEN_PATTERN.test(token)
  ) {
    return null;
  }

  const tokenHash = hashSigningToken(token);

  const { data: agreement, error } = await supabaseAdmin
    .from("client_agreements")
    .select(
      "id, agreement_status, delivery_status, signing_token_expires_at, signing_token_used_at, sent_document_hash, agreement_content, signer_email"
    )
    .eq("signing_token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error("Agreement lookup failed.");
  }

  if (!agreement) {
    return null;
  }

  const expiresAt = new Date(
    agreement.signing_token_expires_at
  ).getTime();

  const isEligible =
    ["sent", "viewed"].includes(agreement.agreement_status) &&
    agreement.delivery_status === "accepted" &&
    agreement.signing_token_used_at === null &&
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now() &&
    /^[0-9a-f]{64}$/.test(agreement.sent_document_hash || "") &&
    typeof agreement.agreement_content === "string" &&
    hashSigningToken(agreement.agreement_content) ===
      agreement.sent_document_hash &&
    typeof agreement.signer_email === "string" &&
    agreement.signer_email.trim().length > 0;

  return isEligible ? agreement : null;
}
// Generate a secure six-digit email verification code.
function generateVerificationCode() {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

// Store only a protected fingerprint of the code.
function hashVerificationCode(code, agreementId) {
  const secret = process.env.AGREEMENT_OTP_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "Agreement verification secret is not configured."
    );
  }

  return createHmac("sha256", secret)
    .update(`${agreementId}:${code}`, "utf8")
    .digest("hex");
}
// Agreement email verification security limits.
const VERIFICATION_CODE_LIFETIME_MINUTES = 10;
const MAX_VERIFICATION_ATTEMPTS = 5;
const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;
// Calculate when a new verification code expires.
function getVerificationCodeExpiration() {
  return new Date(
    Date.now() +
      VERIFICATION_CODE_LIFETIME_MINUTES * 60 * 1000
  ).toISOString();
}
// Prepare the email containing the signer's one-time code.
// Never include signing tokens in the email body.
function buildVerificationCodeEmail(code) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;">
      <h2 style="color:#312e81;">SerVen Agreement Verification</h2>

      <p>Use the following six-digit code to verify your email address before signing your SerVen agreement.</p>

      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px;background:#f1f5f9;text-align:center;border-radius:12px;">
        ${code}
      </div>

      <p>This code expires in 10 minutes.</p>

      <p>If you did not request this code, you can ignore this email.</p>

      <p style="color:#64748b;font-size:12px;">
        SerVen — Intelligence served daily.
      </p>
    </div>
  `;
}
// Send a one-time agreement verification code.
// This helper must only be called after the signing
// token and agreement have been validated.
async function sendVerificationCodeEmail(
  signerEmail,
  code
) {
  if (
    typeof signerEmail !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail)
  ) {
    throw new Error("Invalid agreement signer email.");
  }

  if (
    typeof code !== "string" ||
    !/^\d{6}$/.test(code)
  ) {
    throw new Error("Invalid verification code.");
  }

  const { data, error } = await resend.emails.send({
    from: AGREEMENT_VERIFICATION_FROM_EMAIL,
    to: [signerEmail.trim()],
    subject: "Your SerVen Agreement Verification Code",
    html: buildVerificationCodeEmail(code),
  });

  if (error || !data?.id) {
    throw new Error(
      "Agreement verification email was not accepted."
    );
  }

  // Acceptance by Resend does not guarantee
  // delivery to the recipient's inbox.
  return {
    accepted: true,
    emailId: data.id,
  };
}
// Coordinate verification-code issuance and email delivery.
// Only call this after validating the signing token.
async function processVerificationCodeRequest(agreement) {
  if (
    !agreement?.id ||
    !agreement?.signer_email
  ) {
    throw new Error("Invalid signing agreement.");
  }

  // Validate agreement eligibility before issuing a code.
  // The database RPC independently rechecks eligibility.
  const eligibleAgreement =
    await findEligibleSigningAgreementByIdGuard(agreement);

  if (!eligibleAgreement) {
    return {
      success: false,
      reason: "ineligible",
    };
  }

  // Issue and store the protected code atomically.
  const issued = await issueVerificationCode(agreement.id);

  if (!issued) {
    return {
      success: false,
      reason: "unavailable",
    };
  }

  try {
    const delivery = await sendVerificationCodeEmail(
      agreement.signer_email,
      issued.code
    );

    return {
      success: true,
      emailAccepted: delivery.accepted,
    };
  } catch (error) {
    // Invalidate the code if Resend rejects the request.
    // Do not log the code or email address.
    const invalidated = await invalidateVerificationCode(
      agreement.id,
      issued.code
    );

    if (!invalidated) {
      console.error(
        "Verification email failed and code invalidation was unsuccessful."
      );
    }

    return {
      success: false,
      reason: "delivery_failed",
    };
  }
}
// Issue a verification code through the protected
// Supabase database function.
async function issueVerificationCode(agreementId) {
  const code = generateVerificationCode();

  const codeHash = hashVerificationCode(
    code,
    agreementId
  );

  const expiresAt = getVerificationCodeExpiration();

  const { data, error } = await supabaseAdmin.rpc(
    "issue_agreement_verification_code",
    {
      p_agreement_id: agreementId,
      p_code_hash: codeHash,
      p_expires_at: expiresAt,
    }
  );

  if (error) {
    throw new Error(
      "Unable to issue agreement verification code."
    );
  }

  if (data !== true) {
    return null;
  }

  // The plaintext code must never be logged,
  // stored in the database, or returned to the browser.
  // It will only be passed to the secure email sender.
  return {
    code,
    expiresAt,
  };
}
// Invalidate a specific verification code if email
// delivery fails or the request cannot be completed.
async function invalidateVerificationCode(
  agreementId,
  code
) {
  const codeHash = hashVerificationCode(
    code,
    agreementId
  );

  const { data, error } = await supabaseAdmin.rpc(
    "invalidate_agreement_verification_code",
    {
      p_agreement_id: agreementId,
      p_code_hash: codeHash,
    }
  );

  if (error) {
    console.error(
      "Agreement verification code invalidation failed."
    );

    return false;
  }

  return data === true;
}

// Check whether an agreement recently requested a code.
async function isVerificationCodeOnCooldown(agreementId) {
  const { data, error } = await supabaseAdmin
    .from("client_agreement_verification_codes")
    .select("created_at")
    .eq("agreement_id", agreementId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error("Verification cooldown lookup failed.");
  }

  const latestRequest = data?.[0];

  if (!latestRequest) {
    return false;
  }

  const requestedAt = new Date(
    latestRequest.created_at
  ).getTime();

  if (!Number.isFinite(requestedAt)) {
    // Fail closed if the stored timestamp is invalid.
    return true;
  }

  return (
    Date.now() - requestedAt <
    VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000
  );
}
const securityHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request) {
    // Temporary diagnostic: never log the actual IP address.
console.log("AGREEMENT IP HEADER CHECK:", {
  vercelHeaderPresent:
    Boolean(request.headers.get("x-vercel-forwarded-for")),
  forwardedHeaderPresent:
    Boolean(request.headers.get("x-forwarded-for")),
});
  // Verification requests remain disabled.
  // This step only validates the request format.

  try {
    const contentType =
      request.headers.get("content-type") || "";

    if (
      !contentType
        .toLowerCase()
        .startsWith("application/json")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format.",
        },
        {
          status: 415,
          headers: securityHeaders,
        }
      );
    }

    // Limit the request body before parsing JSON.
const MAX_REQUEST_BYTES = 2048;

const declaredLength = request.headers.get("content-length");

if (
  declaredLength !== null &&
  (!/^\d+$/.test(declaredLength) ||
    Number(declaredLength) > MAX_REQUEST_BYTES)
) {
  return NextResponse.json(
    {
      success: false,
      error: "Verification request is too large.",
    },
    {
      status: 413,
      headers: securityHeaders,
    }
  );
}

const reader = request.body?.getReader();
let body = null;

if (reader) {
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel().catch(() => {});

        return NextResponse.json(
          {
            success: false,
            error: "Verification request is too large.",
          },
          {
            status: 413,
            headers: securityHeaders,
          }
        );
      }

      chunks.push(value);
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    body = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(combined)
    );
  } catch {
    body = null;
  } finally {
    reader.releaseLock();
  }
}

    const token = body?.token;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof token !== "string" ||
      !SIGNING_TOKEN_PATTERN.test(token)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification request.",
        },
        {
          status: 400,
          headers: securityHeaders,
        }
      );
    }

  // Authenticate the signing token against Supabase.
// Never return agreement details or signer information.
// Authenticate the signing token without revealing
// whether a matching agreement exists.
// Enforce the database-backed request limit before
// looking up the signing agreement.
const requestAllowed =
  await checkVerificationRequestRateLimit(token);

if (!requestAllowed) {
  return NextResponse.json(
    {
      success: false,
      error: "Signer email verification is not enabled yet.",
    },
    {
      status: 501,
      headers: securityHeaders,
    }
  );
}
const agreement = await findEligibleSigningAgreement(token);

// Do not expose agreement eligibility to the browser.
// The endpoint remains disabled during development.
if (!agreement) {
  return NextResponse.json(
    {
      success: false,
      error: "Signer email verification is not enabled yet.",
    },
    {
      status: 501,
      headers: securityHeaders,
    }
  );
}

// The agreement passed signing-token eligibility checks.
// Email verification remains disabled until rate limiting,
// secure code verification, and delivery safeguards are ready.
return NextResponse.json(
  {
    success: false,
    error: "Signer email verification is not enabled yet.",
  },
  {
    status: 501,
    headers: securityHeaders,
  }
);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to process verification request.",
      },
      {
        status: 500,
        headers: securityHeaders,
      }
    );
  }
}
