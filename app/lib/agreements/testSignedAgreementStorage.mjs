import { readFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { uploadSignedAgreementPdf } from "./archiveSignedAgreementPdf.js";

// Load only the environment variables needed for this test.
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

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error("Missing Supabase test credentials.");
}

// Require explicit permission before creating a Storage object.
if (process.env.SERVEN_ALLOW_STORAGE_TEST !== "true") {
  console.log("STORAGE TEST SKIPPED: Explicit opt-in required.");
  process.exit(0);
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

// Synthetic PDF generated during our earlier PDF tests.
const pdfBytes = readFileSync(
  "Serven-Test-Signed-Agreement.pdf"
);

const pdfHash = createHash("sha256")
  .update(pdfBytes)
  .digest("hex");

const pdfPath = `_tests/${randomUUID()}.pdf`;

let uploaded = false;

try {
  const result = await uploadSignedAgreementPdf(
    supabaseAdmin,
    pdfPath,
    pdfBytes,
    pdfHash
  );

  uploaded = true;

  if (!result.verified || result.pdfHash !== pdfHash) {
    throw new Error("Storage verification result mismatch.");
  }

  console.log("STORAGE UPLOAD AND HASH VERIFICATION PASSED");
} finally {
  // Remove only this test's uniquely generated object.
  // Attempt cleanup even if upload verification failed.
  const { error: removeError } = await supabaseAdmin.storage
    .from("serven-signed-agreements")
    .remove([pdfPath]);

  if (removeError) {
    console.error(
      "TEST STORAGE CLEANUP FAILED:",
      removeError.message
    );
    process.exitCode = 1;
  } else {
    const { data: remaining, error: listError } =
      await supabaseAdmin.storage
        .from("serven-signed-agreements")
        .list("_tests", {
          search: pdfPath.split("/").pop(),
        });

    if (listError || (remaining || []).some(
      (item) => item.name === pdfPath.split("/").pop()
    )) {
      console.error("TEST STORAGE CLEANUP NOT VERIFIED");
      process.exitCode = 1;
    } else {
      console.log("TEST STORAGE CLEANUP VERIFIED");
    }
  }
}