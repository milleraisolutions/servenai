import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, createHmac } from "node:crypto";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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

// Generate a secure fingerprint of the signing token.
function hashSigningToken(token) {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

// Generate a protected fingerprint of the verification code.
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
async function checkCodeAttemptRateLimit(token, request) {
  const secret = process.env.AGREEMENT_OTP_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Agreement OTP secret is not configured.");
  }

  const forwardedFor = request.headers.get(
    "x-vercel-forwarded-for"
  );

  if (
    !forwardedFor ||
    forwardedFor.includes(",") ||
    forwardedFor.length > 64
  ) {
    throw new Error("Trusted client IP unavailable.");
  }

  const makeKey = (value) =>
    createHmac("sha256", secret)
      .update(value, "utf8")
      .digest("hex");

  const ipKey = makeKey(
    `agreement-code-attempt-ip:${forwardedFor.trim()}`
  );

  const tokenKey = makeKey(
    `agreement-code-attempt-token:${token}`
  );

  // Both limits must be checked independently.
  const { data: ipAllowed, error: ipError } =
    await supabaseAdmin.rpc(
      "check_agreement_code_attempt_rate_limit",
      { p_request_key_hash: ipKey }
    );

  if (ipError) {
    throw new Error("IP rate limit check failed.");
  }

  const { data: tokenAllowed, error: tokenError } =
    await supabaseAdmin.rpc(
      "check_agreement_code_attempt_rate_limit",
      { p_request_key_hash: tokenKey }
    );

  if (tokenError) {
    throw new Error("Token rate limit check failed.");
  }

  return Boolean(ipAllowed && tokenAllowed);
}
async function findEligibleSigningAgreement(token) {
  const tokenHash = hashSigningToken(token);

  const { data: agreement, error } = await supabaseAdmin
    .from("client_agreements")
    .select("*")
    .eq("signing_token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error("Agreement lookup failed.");
  }

  if (!agreement) {
    return null;
  }

  if (
    !["sent", "viewed"].includes(agreement.agreement_status) ||
    agreement.delivery_status !== "accepted" ||
    agreement.signing_token_used_at !== null ||
    !agreement.signing_token_expires_at ||
    new Date(agreement.signing_token_expires_at).getTime() <=
      Date.now() ||
    !agreement.sent_document_hash ||
    !agreement.signer_email
  ) {
    return null;
  }

  const currentDocumentHash = createHash("sha256")
    .update(agreement.agreement_content || "", "utf8")
    .digest("hex");

  if (currentDocumentHash !== agreement.sent_document_hash) {
    return null;
  }

  return agreement;
}
const SIGNING_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
const VERIFICATION_CODE_PATTERN = /^\d{6}$/;
const MAX_REQUEST_BYTES = 2048;

const securityHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function respond(error, status) {
  return NextResponse.json(
    { success: false, error },
    { status, headers: securityHeaders }
  );
}

export async function POST(request) {
  try {
    const contentType =
      request.headers.get("content-type") || "";

    if (
      !contentType
        .toLowerCase()
        .startsWith("application/json")
    ) {
      return respond("Invalid request format.", 415);
    }

    const declaredLength =
      request.headers.get("content-length");

    if (
      declaredLength !== null &&
      (!/^\d+$/.test(declaredLength) ||
        Number(declaredLength) > MAX_REQUEST_BYTES)
    ) {
      return respond("Verification request is too large.", 413);
    }

    const reader = request.body?.getReader();

    if (!reader) {
      return respond("Invalid verification request.", 400);
    }

    const chunks = [];
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        totalBytes += value.byteLength;

        if (totalBytes > MAX_REQUEST_BYTES) {
          await reader.cancel().catch(() => {});
          return respond("Verification request is too large.", 413);
        }

        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    let body;

    try {
      body = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(combined)
      );
    } catch {
      return respond("Invalid verification request.", 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !SIGNING_TOKEN_PATTERN.test(body.token || "") ||
      !VERIFICATION_CODE_PATTERN.test(body.code || "")
    ) {
      return respond("Invalid verification request.", 400);
    }

   // Apply rate limits before agreement lookup.
const allowed = await checkCodeAttemptRateLimit(
  body.token,
  request
);

if (!allowed) {
  return respond(
    "Too many verification attempts. Please try again later.",
    429
  );
}

// Validate the signing token only after rate limiting.
const agreement = await findEligibleSigningAgreement(
  body.token
);

if (!agreement) {
  return respond(
    "Agreement verification is not available.",
    501
  );
}

// Verification remains disabled until rate limiting,
// atomic code redemption, and signing sessions are ready.
return respond(
  "Agreement code verification is not enabled yet.",
  501
);
  } catch {
    return respond("Unable to process verification request.", 500);
  }
}