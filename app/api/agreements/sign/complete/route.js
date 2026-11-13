import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENABLE_AGREEMENT_SIGNING = false;
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
const SESSION_COOKIE =
  "serven_agreement_signing_session";

const SESSION_PATTERN = /^[0-9a-f]{64}$/;
const MAX_SIGNATURE_REQUEST_BYTES = 25000;
const ALLOWED_SIGNATURE_METHODS = [
  "typed_name",
  "drawn_signature",
];
const securityHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function respond(error, status) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status,
      headers: securityHeaders,
    }
  );
}

export async function POST(request) {
  try {
    // Never trust an Origin supplied in the request body.
    const origin = request.headers.get("origin");

    const configuredOrigin = process.env.AGREEMENT_SIGNING_ORIGIN;

if (!configuredOrigin) {
  return respond(
    "Signing origin is not configured.",
    503
  );
}

const expectedOrigin = configuredOrigin.replace(/\/$/, "");

    if (!origin || origin !== expectedOrigin) {
      return respond("Request origin not allowed.", 403);
    }

    const fetchSite = request.headers.get(
      "sec-fetch-site"
    );

    if (
      fetchSite &&
      fetchSite !== "same-origin" &&
      fetchSite !== "none"
    ) {
      return respond("Cross-site request blocked.", 403);
    }
// Require JSON requests.
const contentType =
  request.headers.get("content-type") || "";

if (
  !contentType.toLowerCase().startsWith("application/json")
) {
  return respond("Invalid request format.", 415);
}

// Limit the actual request-body size.
const declaredLength = request.headers.get("content-length");

if (
  declaredLength !== null &&
  (!/^\d+$/.test(declaredLength) ||
    Number(declaredLength) > MAX_SIGNATURE_REQUEST_BYTES)
) {
  return respond("Signature request is too large.", 413);
}

const reader = request.body?.getReader();

if (!reader) {
  return respond("Invalid signature request.", 400);
}

const chunks = [];
let totalBytes = 0;

try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;

    if (totalBytes > MAX_SIGNATURE_REQUEST_BYTES) {
      await reader.cancel().catch(() => {});
      return respond("Signature request is too large.", 413);
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
  return respond("Invalid signature request.", 400);
}

if (
  !body ||
  typeof body !== "object" ||
  Array.isArray(body) ||
  typeof body.signerName !== "string" ||
  !body.signerName.trim() ||
  body.signerName.length > 200 ||
  !ALLOWED_SIGNATURE_METHODS.includes(body.signatureMethod) ||
  typeof body.signatureValue !== "string" ||
  !body.signatureValue.trim() ||
  body.signatureValue.length > 20000 ||
  typeof body.consentText !== "string" ||
  !body.consentText.trim() ||
  body.consentText.length > 2000 ||
  body.consentAccepted !== true
) {
  return respond("Invalid signature information.", 400);
}
    // Read the protected cookie, not a session token
    // supplied in the JSON body.
    const sessionToken = request.cookies.get(
      SESSION_COOKIE
    )?.value;

    if (
      !sessionToken ||
      !SESSION_PATTERN.test(sessionToken)
    ) {
      return respond(
        "Verified signing session required.",
        401
      );
    }

    const sessionTokenHash = createHash("sha256")
      .update(sessionToken, "utf8")
      .digest("hex");

    // The hash will be used for server-side session
    // lookup and atomic signature finalization.
    // Never send this hash to the browser.
    const { data: signingSession, error: sessionError } =
  await supabaseAdmin
    .from("client_agreement_signing_sessions")
    .select(
      "id, agreement_id, expires_at, used_at, revoked_at"
    )
    .eq("session_token_hash", sessionTokenHash)
    .maybeSingle();

if (sessionError) {
  return respond(
    "Unable to validate signing session.",
    500
  );
}

if (
  !signingSession ||
  signingSession.used_at !== null ||
  signingSession.revoked_at !== null ||
  !signingSession.expires_at ||
  new Date(signingSession.expires_at).getTime() <=
    Date.now()
) {
  return respond(
    "Signing session is invalid or expired.",
    401
  );
}
// Load the agreement associated with the verified session.
const { data: agreement, error: agreementError } =
  await supabaseAdmin
    .from("client_agreements")
    .select(
      "id, agreement_status, delivery_status, signing_token_expires_at, signing_token_used_at, sent_document_hash, agreement_content"
    )
    .eq("id", signingSession.agreement_id)
    .maybeSingle();

if (agreementError) {
  return respond(
    "Unable to validate agreement.",
    500
  );
}

// Confirm the agreement is still eligible for signing.
if (
  !agreement ||
  !["sent", "viewed"].includes(agreement.agreement_status) ||
  agreement.delivery_status !== "accepted" ||
  agreement.signing_token_used_at !== null ||
  !agreement.signing_token_expires_at ||
  new Date(agreement.signing_token_expires_at).getTime() <=
    Date.now() ||
  !agreement.sent_document_hash
) {
  return respond(
    "Agreement is no longer available for signing.",
    403
  );
}

// Confirm the agreement has not changed since delivery.
const currentDocumentHash = createHash("sha256")
  .update(agreement.agreement_content || "", "utf8")
  .digest("hex");

if (currentDocumentHash !== agreement.sent_document_hash) {
  return respond(
    "Agreement document integrity check failed.",
    403
  );
}
    // SECURITY: Electronic signing remains disabled
// until all signing, PDF, and legal checks pass.
if (!ENABLE_AGREEMENT_SIGNING) {
  return respond(
    "Electronic signing is not enabled yet.",
    501
  );
}

// Only use the trusted forwarding header on Vercel.
// Never trust an IP address supplied in the JSON body.
const forwardedFor = request.headers.get(
  "x-vercel-forwarded-for"
);

if (
  !forwardedFor ||
  forwardedFor.includes(",") ||
  forwardedFor.length > 64
) {
  return respond(
    "Unable to verify signing request.",
    403
  );
}

const signerIp = forwardedFor.trim();
const signerUserAgent = (
  request.headers.get("user-agent") || ""
).slice(0, 1000);

// Finalize signature, session consumption,
// agreement status and audit event atomically.
const { data: finalized, error: finalizationError } =
  await supabaseAdmin.rpc(
    "finalize_client_agreement_signature",
    {
      p_agreement_id: agreement.id,
      p_session_token_hash: sessionTokenHash,
      p_signer_name: body.signerName.trim(),
      p_signature_method: body.signatureMethod,
      p_signature_value: body.signatureValue,
      p_consent_text: body.consentText,
      p_ip_address: signerIp,
      p_user_agent: signerUserAgent,
    }
  );

if (finalizationError) {
  console.error(
    "Agreement signature finalization failed:",
    finalizationError.code
  );

  return respond(
    "Unable to complete electronic signature.",
    500
  );
}

if (finalized !== true) {
  return respond(
    "Signing session is no longer valid.",
    409
  );
}

// Clear the consumed signing-session cookie.
const response = NextResponse.json(
  {
    success: true,
    signed: true,
  },
  {
    status: 200,
    headers: securityHeaders,
  }
);

response.cookies.set(
  SESSION_COOKIE,
  "",
  {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/agreements/sign",
    maxAge: 0,
  }
);

return response;
  } catch {
    return respond(
      "Unable to process signature request.",
      500
    );
  }
}
