import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { recoverPendingSignedAgreementPdfArchives } from "../../../lib/agreements/archiveSignedAgreementPdf.js";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const securityHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const provided = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);

  return (
    provided.length === expected.length &&
    timingSafeEqual(provided, expected)
  );
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401, headers: securityHeaders }
    );
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Recovery is not configured." },
        { status: 503, headers: securityHeaders }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const result = await recoverPendingSignedAgreementPdfArchives(
      supabaseAdmin,
      10
    );

    return NextResponse.json(
      {
        success: true,
        processed: result.processed,
        archived: result.archived,
        failed: result.failed,
      },
      { status: 200, headers: securityHeaders }
    );
  } catch {
    console.error("Scheduled agreement PDF recovery failed.");

    return NextResponse.json(
      {
        success: false,
        error: "Agreement PDF recovery failed.",
      },
      { status: 500, headers: securityHeaders }
    );
  }
}