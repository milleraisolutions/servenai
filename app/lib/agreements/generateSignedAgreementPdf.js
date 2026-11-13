
import { jsPDF } from "jspdf";
import { createHash } from "node:crypto";

const DOCUMENT_WIDTH = 210;
const MARGIN = 18;
const TEXT_WIDTH = DOCUMENT_WIDTH - MARGIN * 2;
const PAGE_BOTTOM = 275;

export function generateSignedAgreementPdf({
  agreement,
  signatureEvidence,
}) {
  if (!agreement?.id || !signatureEvidence) {
    throw new Error("Agreement and signature evidence are required.");
  }

  const originalContent = agreement.agreement_content;

  if (typeof originalContent !== "string") {
    throw new Error("Original agreement content is missing.");
  }

  const documentHash = createHash("sha256")
    .update(originalContent, "utf8")
    .digest("hex");

  if (
    documentHash !== agreement.sent_document_hash ||
    documentHash !== signatureEvidence.document_hash
  ) {
    throw new Error("Agreement document integrity verification failed.");
  }

  const terms = JSON.parse(originalContent);

  if (!terms || terms.schema_version !== 1) {
    throw new Error("Unsupported agreement document version.");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = 22;

  function ensureSpace(height = 12) {
    if (y + height > PAGE_BOTTOM) {
      pdf.addPage();
      y = 22;
    }
  }

  function addText(label, value) {
    const text = String(value ?? "Not specified");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    ensureSpace(8);
    pdf.text(label, MARGIN, y);
    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    const lines = pdf.splitTextToSize(text, TEXT_WIDTH);

    for (const line of lines) {
      ensureSpace(6);
      pdf.text(line, MARGIN, y);
      y += 5.5;
    }

    y += 5;
  }

    // SERVEN CONTRACT HEADER
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, 210, 43, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(23);
  pdf.setTextColor(255, 255, 255);
  pdf.text("SerVen", MARGIN, 19);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(196, 181, 253);
  pdf.text("INTELLIGENCE SERVED DAILY", MARGIN, 27);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text("CLIENT SERVICE AGREEMENT", MARGIN, 36);

  pdf.setTextColor(15, 23, 42);

  y = 55;
  addText("Agreement ID", agreement.id);
  addText("Agreement Type", terms.agreement_type);
  addText("Restaurant", terms.business_name);
  addText("Authorized Signer", terms.signer_name);
  addText("Signer Email", terms.signer_email);

  if (terms.agreement_type === "subscription") {
    addText("Monthly Subscription Price", `$${terms.monthly_price}`);
    addText("Contract Length", `${terms.contract_length_months} months`);
  }

  addText(
    "Verified Profit Recovery Fee",
    `${terms.recovery_fee_percent}%`
  );

  addText(
    "Services Included",
    typeof terms.services === "string"
      ? terms.services
      : JSON.stringify(terms.services ?? null)
  );

  addText("Cancellation Policy", terms.cancellation_policy);
  addText("Additional Terms", terms.additional_terms);

    // Keep the complete signature evidence section
  // together on a dedicated page.
  pdf.addPage();
  y = 22;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("Electronic Signature Evidence", MARGIN, y);
  y += 12;

  addText("Signer Name", signatureEvidence.signer_name);
  addText("Signer Email", signatureEvidence.signer_email);
  addText("Signature Method", signatureEvidence.signature_method);

  if (signatureEvidence.signature_method === "typed_name") {
    addText("Electronic Signature", signatureEvidence.signature_value);
  } else {
    addText(
      "Drawn Signature",
      "Drawn signature evidence retained separately."
    );
  }

  addText("Consent Statement", signatureEvidence.consent_text);
  addText("Signed At (UTC)", signatureEvidence.signed_at);
  addText("Agreement SHA-256", documentHash);

  const pdfBytes = Buffer.from(pdf.output("arraybuffer"));

  const pdfHash = createHash("sha256")
    .update(pdfBytes)
    .digest("hex");

  return {
    pdfBytes,
    pdfHash,
    documentHash,
  };
}
