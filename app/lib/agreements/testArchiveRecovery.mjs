import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Load local environment variables for testing.
const envText = readFileSync(".env.local", "utf8");

for (const line of envText.split(/\r?\n/)) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) continue;

  const separator = trimmed.indexOf("=");
  if (separator === -1) continue;

  const key = trimmed.slice(0, separator).trim();
  const value = trimmed
    .slice(separator + 1)
    .trim()
    .replace(/^["']|["']$/g, "");

  if (
    key === "NEXT_PUBLIC_SUPABASE_URL" ||
    key === "SUPABASE_SERVICE_ROLE_KEY"
  ) {
    process.env[key] ??= value;
  }
}

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

const { data, error } = await supabaseAdmin.rpc(
  "list_pending_client_agreement_pdf_archives",
  {
    p_limit: 10,
  }
);

if (error) {
  console.error("RECOVERY QUERY FAILED:", error.code);
  process.exitCode = 1;
} else {
  console.log("RECOVERY QUERY PASSED");
  console.log("PENDING ARCHIVE COUNT:", data?.length ?? 0);
}
if (
  process.env.SERVEN_ALLOW_EMPTY_ARCHIVE_TEST === "true" &&
  !error &&
  (data?.length ?? 0) === 0
) {
  const { recoverPendingSignedAgreementPdfArchives } =
    await import("./archiveSignedAgreementPdf.js");

  const result =
    await recoverPendingSignedAgreementPdfArchives(
      supabaseAdmin,
      10
    );

  console.log("RECOVERY WORKER TEST PASSED");
  console.log("PROCESSED:", result.processed);
  console.log("ARCHIVED:", result.archived);
  console.log("FAILED:", result.failed);
} else {
  console.log(
    "RECOVERY WORKER SKIPPED: Queue is not empty or query failed."
  );
}