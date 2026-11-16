import { createHash } from "node:crypto";
import { archiveSignedAgreementPdf } from "./archiveSignedAgreementPdf.js";

const agreementContent = JSON.stringify({
  schema_version: 1,
  agreement_type: "subscription",
  business_name: "Sample Test Restaurant",
  signer_name: "Test Signer",
  signer_email: "test@example.com",
  monthly_price: 299,
  contract_length_months: 12,
  recovery_fee_percent: 15,
  services: "Restaurant analytics and AI profit intelligence",
  cancellation_policy: "Sample cancellation terms for testing only.",
  additional_terms: "This is not a real agreement.",
});

const documentHash = createHash("sha256")
  .update(agreementContent, "utf8")
  .digest("hex");

const agreement = {
  id: "00000000-0000-4000-8000-000000000001",
  agreement_status: "signed",
  agreement_content: agreementContent,
  sent_document_hash: documentHash,
};

const signatureEvidence = {
  id: "00000000-0000-4000-8000-000000000002",
  agreement_id: agreement.id,
  signer_name: "Test Signer",
  signer_email: "test@example.com",
  signature_method: "typed_name",
  signature_value: "Test Signer",
  consent_text: "I agree to sign electronically.",
  signed_at: "2026-11-12T12:00:00.000Z",
  document_hash: documentHash,
};

console.log("SYNTHETIC ARCHIVE TEST DATA READY");
console.log("AGREEMENT:", agreement.id);
console.log("EVIDENCE:", signatureEvidence.id);
const mockState = {
  claimCount: 0,
  completionCount: 0,
  uploadedPdf: null,
  uploadedPath: null,
  completedPath: null,
  completedHash: null,
};

const mockClaimId = "00000000-0000-4000-8000-000000000003";

const mockSupabase = {
  rpc: async (functionName, params) => {
    if (functionName === "claim_client_agreement_pdf_archive") {
      if (params.p_evidence_id !== signatureEvidence.id) {
        throw new Error("Unexpected evidence ID");
      }

      mockState.claimCount++;

      return {
        data: mockClaimId,
        error: null,
      };
    }

    if (functionName === "complete_client_agreement_pdf_archive") {
      if (
        params.p_evidence_id !== signatureEvidence.id ||
        params.p_claim_id !== mockClaimId
      ) {
        throw new Error("Invalid archive completion claim");
      }
if (process.env.SERVEN_TEST_COMPLETION_FAILURE === "true") {
  return {
    data: false,
    error: null,
  };
}
      mockState.completionCount++;
      mockState.completedPath = params.p_pdf_path;
      mockState.completedHash = params.p_pdf_hash;

      return {
        data: true,
        error: null,
      };
    }

   if (functionName === "fail_client_agreement_pdf_archive") {
  if (
    params.p_evidence_id !== signatureEvidence.id ||
    params.p_claim_id !== mockClaimId
  ) {
    throw new Error("Invalid archive failure claim");
  }

  mockState.failureCount = (mockState.failureCount || 0) + 1;
  mockState.failureReason = params.p_error;

  return {
    data: true,
    error: null,
  };
}

    throw new Error(`Unexpected RPC: ${functionName}`);
  },

  from: (tableName) => {
    if (tableName === "client_agreement_signature_evidence") {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: signatureEvidence,
              error: null,
            }),
          }),
        }),
      };
    }

    if (tableName === "client_agreements") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => ({
                data: agreement,
                error: null,
              }),
            }),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${tableName}`);
  },

  storage: {
    from: (bucketName) => {
      if (bucketName !== "serven-signed-agreements") {
        throw new Error("Unexpected Storage bucket");
      }

      return {
        upload: async (path, bytes) => {
  if (process.env.SERVEN_TEST_UPLOAD_FAILURE === "true") {
    return {
      error: new Error("Simulated Storage upload failure"),
    };
  }

  mockState.uploadedPath = path;
  mockState.uploadedPdf = Buffer.from(bytes);

  return { error: null };
},

        download: async (path) => {
  if (path !== mockState.uploadedPath) {
    throw new Error("Downloaded PDF path does not match upload");
  }

  const downloadedBytes = Buffer.from(mockState.uploadedPdf);

  if (process.env.SERVEN_TEST_CORRUPT_PDF === "true") {
    downloadedBytes[100] ^= 0xff;
  }

  return {
    data: new Blob([downloadedBytes], {
      type: "application/pdf",
    }),
    error: null,
  };
},
      };
    },
  },
};
if (process.env.SERVEN_TEST_UPLOAD_FAILURE === "true") {
  let caughtError = null;

  try {
    await archiveSignedAgreementPdf(
      mockSupabase,
      signatureEvidence.id
    );
  } catch (error) {
    caughtError = error;
  }

  if (!caughtError) {
    throw new Error("TEST FAILED: Upload failure was accepted.");
  }

  if (mockState.claimCount !== 1) {
    throw new Error("TEST FAILED: Incorrect archive claim count.");
  }

  if (mockState.completionCount !== 0) {
    throw new Error("TEST FAILED: Failed upload was marked completed.");
  }

  if (mockState.failureCount !== 1) {
    throw new Error("TEST FAILED: Upload failure was not recorded.");
  }

  if (
    mockState.failureReason !==
    "PDF archival failed; retry required."
  ) {
    throw new Error("TEST FAILED: Incorrect failure reason.");
  }

  if (mockState.uploadedPdf !== null) {
    throw new Error("TEST FAILED: Upload unexpectedly succeeded.");
  }

  console.log("INTERRUPTED UPLOAD CORRECTLY REJECTED");
  console.log("CLAIMS:", mockState.claimCount);
  console.log("COMPLETIONS:", mockState.completionCount);
  console.log("FAILURE RECORDS:", mockState.failureCount);
  console.log("FAILURE REASON:", mockState.failureReason);

  process.exit(0);
}
if (process.env.SERVEN_TEST_COMPLETION_FAILURE === "true") {
  let caughtError = null;

  try {
    await archiveSignedAgreementPdf(
      mockSupabase,
      signatureEvidence.id
    );
  } catch (error) {
    caughtError = error;
  }

  if (!caughtError) {
    throw new Error("TEST FAILED: Completion failure was accepted.");
  }

  if (mockState.claimCount !== 1) {
    throw new Error("TEST FAILED: Incorrect claim count.");
  }

  if (mockState.completionCount !== 0) {
    throw new Error("TEST FAILED: Archive incorrectly completed.");
  }

  if (mockState.failureCount !== 1) {
    throw new Error("TEST FAILED: Failure was not recorded.");
  }

  if (!mockState.uploadedPdf || !mockState.uploadedPath) {
    throw new Error("TEST FAILED: PDF was not uploaded.");
  }

  console.log("ARCHIVE COMPLETION FAILURE CORRECTLY HANDLED");
  console.log("CLAIMS:", mockState.claimCount);
  console.log("COMPLETIONS:", mockState.completionCount);
  console.log("FAILURE RECORDS:", mockState.failureCount);
  console.log("UPLOADED PDF EXISTS IN MOCK STORAGE: YES");
  console.log("STORAGE RECONCILIATION REQUIRED: YES");

  process.exit(0);
}
let result;

if (process.env.SERVEN_TEST_CORRUPT_PDF === "true") {
  try {
    await archiveSignedAgreementPdf(
      mockSupabase,
      signatureEvidence.id
    );

    throw new Error("TEST FAILED: Corrupted PDF was accepted.");
  } catch (error) {
    if (error.message.includes("TEST FAILED")) {
      throw error;
    }

    if (mockState.completionCount !== 0) {
      throw new Error(
        "TEST FAILED: Corrupted PDF was marked completed."
      );
    }
if (mockState.failureCount !== 1) {
  throw new Error(
    "TEST FAILED: Archive failure was not recorded exactly once."
  );
}

if (
  mockState.failureReason !==
  "PDF archival failed; retry required."
) {
  throw new Error(
    "TEST FAILED: Archive failure reason was incorrect."
  );
}
    if (mockState.claimCount !== 1) {
      throw new Error("TEST FAILED: Archive claim count incorrect.");
    }

   console.log("CORRUPTED PDF CORRECTLY REJECTED");
console.log("CLAIMS:", mockState.claimCount);
console.log("COMPLETIONS:", mockState.completionCount);
console.log("FAILURE RECORDS:", mockState.failureCount);
console.log("FAILURE REASON:", mockState.failureReason);
console.log("FAILURE:", error.message);

    process.exit(0);
  }
}

result = await archiveSignedAgreementPdf(
  mockSupabase,
  signatureEvidence.id
);

if (result.archived !== true) {
  throw new Error("PDF archival did not complete.");
}

if (mockState.claimCount !== 1) {
  throw new Error("Expected exactly one archive claim.");
}

if (mockState.completionCount !== 1) {
  throw new Error("Expected exactly one archive completion.");
}

if (!mockState.uploadedPdf) {
  throw new Error("No PDF was uploaded.");
}

if (
  mockState.uploadedPdf.subarray(0, 5).toString() !== "%PDF-"
) {
  throw new Error("Uploaded file is not a PDF.");
}

const uploadedHash = createHash("sha256")
  .update(mockState.uploadedPdf)
  .digest("hex");

if (
  uploadedHash !== result.pdfHash ||
  uploadedHash !== mockState.completedHash
) {
  throw new Error("Archived PDF hash mismatch.");
}

if (
  result.pdfPath !== mockState.uploadedPath ||
  result.pdfPath !== mockState.completedPath
) {
  throw new Error("Archived PDF path mismatch.");
}

console.log("FULL MOCK ARCHIVAL TEST PASSED");
console.log("CLAIMS:", mockState.claimCount);
console.log("COMPLETIONS:", mockState.completionCount);
console.log("PDF HASH VERIFIED:", uploadedHash);
console.log("ARCHIVE PATH VERIFIED:", result.pdfPath);