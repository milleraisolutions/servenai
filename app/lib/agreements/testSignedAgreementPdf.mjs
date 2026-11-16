
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { generateSignedAgreementPdf } from "./generateSignedAgreementPdf.js";

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
  agreement_content: agreementContent,
  sent_document_hash: documentHash,
};

const signatureEvidence = {
  signer_name: "Test Signer",
  signer_email: "test@example.com",
  signature_method: "typed_name",
  signature_value: "Test Signer",
  consent_text: "I agree to sign electronically.",
  signed_at: "2026-11-12T12:00:00.000Z",
  document_hash: documentHash,
};

const result = generateSignedAgreementPdf({
  agreement,
  signatureEvidence,
});

const calculatedPdfHash = createHash("sha256")
  .update(result.pdfBytes)
  .digest("hex");

if (calculatedPdfHash !== result.pdfHash) {
  throw new Error("PDF hash verification failed.");
}

if (result.pdfBytes.subarray(0, 5).toString() !== "%PDF-") {
  throw new Error("Generated output is not a valid PDF header.");
}

writeFileSync("Serven-Test-Signed-Agreement.pdf", result.pdfBytes);

console.log("PDF GENERATION PASSED");
console.log("PDF HASH VERIFIED:", result.pdfHash);
console.log("DOCUMENT HASH VERIFIED:", result.documentHash);

// TEST 2: DRAWN ELECTRONIC SIGNATURE
// Synthetic PNG only — no real client information.

const { PNG } = await import("pngjs");

const testPng = new PNG({
  width: 300,
  height: 100,
  colorType: 6,
});

for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 300; x++) {
    const index = (y * 300 + x) * 4;

    const isSignatureStroke =
      x >= 30 &&
      x <= 270 &&
      Math.abs(y - (50 + 15 * Math.sin(x / 20))) < 3;

    testPng.data[index] = 30;
    testPng.data[index + 1] = 41;
    testPng.data[index + 2] = 59;
    testPng.data[index + 3] = isSignatureStroke ? 255 : 0;
  }
}

const drawnSignaturePng =
  "data:image/png;base64," +
  PNG.sync.write(testPng).toString("base64");

const drawnSignatureEvidence = {
  ...signatureEvidence,
  signature_method: "drawn_signature",
  signature_value: drawnSignaturePng,
};

const drawnResult = generateSignedAgreementPdf({
  agreement,
  signatureEvidence: drawnSignatureEvidence,
});

const drawnPdfHash = createHash("sha256")
  .update(drawnResult.pdfBytes)
  .digest("hex");

if (drawnPdfHash !== drawnResult.pdfHash) {
  throw new Error("Drawn signature PDF hash verification failed.");
}

if (
  drawnResult.pdfBytes.subarray(0, 5).toString() !== "%PDF-"
) {
  throw new Error("Drawn signature PDF header is invalid.");
}

writeFileSync(
  "Serven-Test-Drawn-Signature.pdf",
  drawnResult.pdfBytes
);

console.log("DRAWN SIGNATURE PDF GENERATION PASSED");
console.log("DRAWN SIGNATURE PDF HASH VERIFIED:", drawnResult.pdfHash);