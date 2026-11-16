import { createHash, randomUUID } from "node:crypto";
import { generateSignedAgreementPdf } from "./generateSignedAgreementPdf.js";

const SIGNED_AGREEMENTS_BUCKET =
  "serven-signed-agreements";

const MAX_SIGNED_PDF_BYTES = 10 * 1024 * 1024;

function calculateSha256(bytes) {
  return createHash("sha256")
    .update(bytes)
    .digest("hex");
}
export async function claimSignedAgreementPdfArchive(
  supabaseAdmin,
  evidenceId
) {
  if (!supabaseAdmin || !evidenceId) {
    throw new Error(
      "Missing Supabase client or signature evidence ID."
    );
  }

  const { data: claimId, error } =
    await supabaseAdmin.rpc(
      "claim_client_agreement_pdf_archive",
      {
        p_evidence_id: evidenceId,
      }
    );

  if (error) {
    console.error(
      "Signed agreement PDF archive claim failed:",
      error.code
    );

    throw new Error(
      "Unable to claim signed agreement for PDF archival."
    );
  }

  // Null means the agreement is already archived
  // or another active process holds the claim.
  return claimId || null;
}
export async function completeSignedAgreementPdfArchive(
  supabaseAdmin,
  evidenceId,
  claimId,
  pdfPath,
  pdfHash
) {
  if (
    !supabaseAdmin ||
    !evidenceId ||
    !claimId ||
    typeof pdfPath !== "string" ||
    !pdfPath.trim() ||
    !/^[a-f0-9]{64}$/.test(pdfHash)
  ) {
    throw new Error(
      "Invalid signed agreement PDF archive completion details."
    );
  }

  const { data: completed, error } =
    await supabaseAdmin.rpc(
      "complete_client_agreement_pdf_archive",
      {
        p_evidence_id: evidenceId,
        p_claim_id: claimId,
        p_pdf_path: pdfPath,
        p_pdf_hash: pdfHash,
      }
    );

  if (error) {
    console.error(
      "Signed agreement PDF archive completion failed:",
      error.code
    );

    throw new Error(
      "Unable to record signed agreement PDF archive."
    );
  }

  return completed === true;
}
export async function failSignedAgreementPdfArchive(
  supabaseAdmin,
  evidenceId,
  claimId,
  failureReason
) {
  if (!supabaseAdmin || !evidenceId || !claimId) {
    throw new Error(
      "Missing required PDF archival failure details."
    );
  }

  const safeReason = String(
    failureReason || "PDF archival failed."
  ).slice(0, 500);

  const { data: failed, error } =
    await supabaseAdmin.rpc(
      "fail_client_agreement_pdf_archive",
      {
        p_evidence_id: evidenceId,
        p_claim_id: claimId,
        p_error: safeReason,
      }
    );

  if (error) {
    console.error(
      "Signed agreement PDF archive failure recording failed:",
      error.code
    );

    throw new Error(
      "Unable to record PDF archival failure."
    );
  }

  return failed === true;
}
export function validateSignedAgreementPdf(
  pdfBytes,
  expectedPdfHash
) {
  if (
    !Buffer.isBuffer(pdfBytes) ||
    pdfBytes.length < 100 ||
    pdfBytes.length > MAX_SIGNED_PDF_BYTES
  ) {
    throw new Error(
      "Signed agreement PDF has an invalid size or format."
    );
  }

  if (
    pdfBytes.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new Error(
      "Signed agreement PDF header is invalid."
    );
  }

  if (!/^[a-f0-9]{64}$/.test(expectedPdfHash)) {
    throw new Error(
      "Signed agreement PDF hash is invalid."
    );
  }

  const actualPdfHash = calculateSha256(pdfBytes);

  if (actualPdfHash !== expectedPdfHash) {
    throw new Error(
      "Signed agreement PDF integrity verification failed."
    );
  }

  return true;
}
export async function uploadSignedAgreementPdf(
  supabaseAdmin,
  pdfPath,
  pdfBytes,
  expectedPdfHash
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is required.");
  }

  if (
    typeof pdfPath !== "string" ||
    !pdfPath.trim() ||
    pdfPath.startsWith("/") ||
    pdfPath.includes("..") ||
    pdfPath.length > 1000
  ) {
    throw new Error("Invalid signed agreement PDF path.");
  }

  // Verify the PDF before uploading.
  validateSignedAgreementPdf(
    pdfBytes,
    expectedPdfHash
  );

  const { error: uploadError } = await supabaseAdmin.storage
    .from(SIGNED_AGREEMENTS_BUCKET)
    .upload(pdfPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: false,
      cacheControl: "0",
    });

  if (uploadError) {
    console.error(
      "Signed agreement PDF Storage upload failed:",
      uploadError.statusCode || "unknown"
    );

    throw new Error(
      "Unable to upload signed agreement PDF."
    );
  }

  // Download the stored object to verify its actual bytes.
  const { data: storedFile, error: downloadError } =
    await supabaseAdmin.storage
      .from(SIGNED_AGREEMENTS_BUCKET)
      .download(pdfPath);

  if (downloadError || !storedFile) {
    throw new Error(
      "Unable to verify uploaded signed agreement PDF."
    );
  }

  const storedBytes = Buffer.from(
    await storedFile.arrayBuffer()
  );

  validateSignedAgreementPdf(
    storedBytes,
    expectedPdfHash
  );

  return {
    pdfPath,
    pdfHash: expectedPdfHash,
    verified: true,
  };
}
export function createSignedAgreementPdfPath(
  agreementId,
  evidenceId
) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (
    !uuidPattern.test(agreementId || "") ||
    !uuidPattern.test(evidenceId || "")
  ) {
    throw new Error(
      "Invalid agreement or signature evidence ID."
    );
  }

  const archiveId = randomUUID();

  return (
    `${agreementId}/${evidenceId}/` +
    `${archiveId}.pdf`
  );
}
export async function loadSignedAgreementForArchive(
  supabaseAdmin,
  evidenceId
) {
  if (!supabaseAdmin || !evidenceId) {
    throw new Error(
      "Missing database client or signature evidence ID."
    );
  }

  const { data: evidence, error: evidenceError } =
    await supabaseAdmin
      .from("client_agreement_signature_evidence")
      .select("*")
      .eq("id", evidenceId)
      .single();

  if (evidenceError || !evidence) {
    throw new Error(
      "Unable to retrieve signature evidence."
    );
  }

  const { data: agreement, error: agreementError } =
    await supabaseAdmin
      .from("client_agreements")
      .select("*")
      .eq("id", evidence.agreement_id)
      .eq("agreement_status", "signed")
      .single();

  if (agreementError || !agreement) {
    throw new Error(
      "Unable to retrieve signed agreement."
    );
  }

  if (
    agreement.sent_document_hash !==
    evidence.document_hash
  ) {
    throw new Error(
      "Signed agreement document hash mismatch."
    );
  }

  return {
    agreement,
    signatureEvidence: evidence,
  };
}
export async function archiveSignedAgreementPdf(
  supabaseAdmin,
  evidenceId
) {
  const claimId = await claimSignedAgreementPdfArchive(
    supabaseAdmin,
    evidenceId
  );

  // Already archived or currently being processed.
  if (!claimId) {
    return {
      archived: false,
      reason: "not_claimed",
    };
  }

  let uploadedPath = null;

  try {
    const { agreement, signatureEvidence } =
      await loadSignedAgreementForArchive(
        supabaseAdmin,
        evidenceId
      );

    const { pdfBytes, pdfHash, documentHash } =
      generateSignedAgreementPdf({
        agreement,
        signatureEvidence,
      });

    if (documentHash !== signatureEvidence.document_hash) {
      throw new Error("Agreement document integrity mismatch.");
    }

    validateSignedAgreementPdf(pdfBytes, pdfHash);

    const pdfPath = createSignedAgreementPdfPath(
      agreement.id,
      evidenceId
    );

    // Track the intended Storage path before uploading.
// The upload may succeed even if subsequent verification fails.
uploadedPath = pdfPath;

const upload = await uploadSignedAgreementPdf(
  supabaseAdmin,
  pdfPath,
  pdfBytes,
  pdfHash
);

    uploadedPath = pdfPath;

    if (!upload.verified) {
      throw new Error("PDF Storage verification failed.");
    }

    const completed = await completeSignedAgreementPdfArchive(
      supabaseAdmin,
      evidenceId,
      claimId,
      pdfPath,
      pdfHash
    );

    if (!completed) {
      throw new Error(
        "PDF archive completion was not accepted."
      );
    }

    return {
      archived: true,
      pdfPath,
      pdfHash,
    };
  } catch (error) {
    console.error(
      "Signed agreement PDF archival failed:",
      error?.message || "unknown"
    );

    // Never delete a possibly uploaded PDF automatically:
    // a concurrent recovery process may need investigation.
    if (uploadedPath) {
      console.error(
        "PDF archival requires Storage reconciliation."
      );
    }

    try {
      const failureRecorded =
        await failSignedAgreementPdfArchive(
          supabaseAdmin,
          evidenceId,
          claimId,
          "PDF archival failed; retry required."
        );

      if (!failureRecorded) {
        console.error(
          "PDF archive failure could not be recorded."
        );
      }
    } catch {
      console.error(
        "PDF archive failure recording encountered an error."
      );
    }

    throw new Error(
      "Signed agreement PDF could not be archived."
    );
  }
}
export async function listPendingSignedAgreementPdfArchives(
  supabaseAdmin,
  limit = 20
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is required.");
  }

  const safeLimit = Math.min(
    Math.max(Math.trunc(Number(limit) || 20), 1),
    100
  );

  const { data, error } = await supabaseAdmin.rpc(
    "list_pending_client_agreement_pdf_archives",
    {
      p_limit: safeLimit,
    }
  );

  if (error) {
    console.error(
      "Unable to list pending PDF archives:",
      error.code
    );

    throw new Error(
      "Unable to retrieve pending signed agreement PDF archives."
    );
  }

  return data || [];
}
export async function recoverPendingSignedAgreementPdfArchives(
  supabaseAdmin,
  limit = 10
) {
  const pendingArchives =
    await listPendingSignedAgreementPdfArchives(
      supabaseAdmin,
      limit
    );

  const results = [];

  for (const pending of pendingArchives) {
    try {
      const result = await archiveSignedAgreementPdf(
        supabaseAdmin,
        pending.evidence_id
      );

      results.push({
        evidenceId: pending.evidence_id,
        archived: result.archived === true,
        reason: result.reason || null,
      });
    } catch {
      results.push({
        evidenceId: pending.evidence_id,
        archived: false,
        reason: "archive_failed",
      });
    }
  }

  return {
    processed: results.length,
    archived: results.filter(
      (result) => result.archived
    ).length,
    failed: results.filter(
      (result) => result.reason === "archive_failed"
    ).length,
    results,
  };
}