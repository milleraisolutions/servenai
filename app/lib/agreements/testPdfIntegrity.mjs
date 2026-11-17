
import { createHash } from "node:crypto";

import {
  verifySignedAgreementPdfIntegrity,
} from "./reconcileSignedAgreementStorage.js";

const pdfPath =
  "00000000-0000-4000-8000-000000000001/" +
  "00000000-0000-4000-8000-000000000002/" +
  "00000000-0000-4000-8000-000000000003.pdf";

const originalPdf = Buffer.from(
  "%PDF-1.4\nSynthetic SerVen agreement test\n%%EOF"
);

const corruptedPdf = Buffer.from(
  "%PDF-1.4\nModified SerVen agreement test\n%%EOF"
);

const expectedHash = createHash("sha256")
  .update(originalPdf)
  .digest("hex");

let downloadedBytes = originalPdf;

const mockSupabase = {
  storage: {
    from(bucketName) {
      if (bucketName !== "serven-signed-agreements") {
        throw new Error("Unexpected Storage bucket.");
      }

      return {
        async download(requestedPath) {
          if (requestedPath !== pdfPath) {
            throw new Error("Unexpected PDF path.");
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

// TEST 1: Matching PDF hash.
const validResult =
  await verifySignedAgreementPdfIntegrity(
    mockSupabase,
    pdfPath,
    expectedHash
  );

if (
  validResult.status !== "integrity_verified" ||
  validResult.integrityVerified !== true ||
  validResult.investigationRequired !== false
) {
  throw new Error("TEST FAILED: Valid PDF integrity.");
}

console.log("VALID PDF INTEGRITY TEST PASSED");

// TEST 2: Corrupted PDF hash.
downloadedBytes = corruptedPdf;

const corruptedResult =
  await verifySignedAgreementPdfIntegrity(
    mockSupabase,
    pdfPath,
    expectedHash
  );

if (
  corruptedResult.status !== "hash_mismatch" ||
  corruptedResult.integrityVerified !== false ||
  corruptedResult.investigationRequired !== true
) {
  throw new Error("TEST FAILED: Corrupted PDF detection.");
}

console.log("CORRUPTED PDF DETECTION TEST PASSED");

// TEST 3: Invalid recorded hash.
const invalidResult =
  await verifySignedAgreementPdfIntegrity(
    mockSupabase,
    pdfPath,
    "invalid-hash"
  );

if (
  invalidResult.status !== "invalid_recorded_hash" ||
  invalidResult.integrityVerified !== false ||
  invalidResult.investigationRequired !== true
) {
  throw new Error("TEST FAILED: Invalid recorded hash.");
}

console.log("INVALID RECORDED HASH TEST PASSED");

console.log("ALL PDF INTEGRITY TESTS PASSED");

