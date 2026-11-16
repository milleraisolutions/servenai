
import { jsPDF } from "jspdf";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

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
  // Embed the Caveat handwriting font for typed signatures.
  const signatureFontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "Caveat-Regular.ttf"
  );

  const signatureFontBase64 = readFileSync(
    signatureFontPath
  ).toString("base64");

  pdf.addFileToVFS(
    "Caveat-Regular.ttf",
    signatureFontBase64
  );

  pdf.addFont(
    "Caveat-Regular.ttf",
    "Caveat",
    "normal"
  );
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
    // Display the typed electronic signature in handwriting.
    ensureSpace(35);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Electronic Signature", MARGIN, y);

    y += 15;

    pdf.setFont("Caveat", "normal");
    pdf.setFontSize(32);
    pdf.setTextColor(30, 41, 59);

    const signatureLines = pdf.splitTextToSize(
      signatureEvidence.signature_value,
      TEXT_WIDTH
    );

    for (const line of signatureLines) {
      ensureSpace(15);
      pdf.text(line, MARGIN + 4, y);
      y += 14;
    }

    pdf.setDrawColor(148, 163, 184);
    pdf.line(MARGIN, y + 2, 110, y + 2);

    y += 12;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Electronically signed using SerVen", MARGIN, y);

    pdf.setTextColor(15, 23, 42);
    y += 10;
   } else if (
    signatureEvidence.signature_method === "drawn_signature"
  ) {
    const signatureData = signatureEvidence.signature_value;

    if (
      typeof signatureData !== "string" ||
      signatureData.length > 20000 ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(
        signatureData
      )
    ) {
      throw new Error("Invalid drawn signature format.");
    }

    const encodedImage = signatureData.split(",")[1];
    const imageBytes = Buffer.from(encodedImage, "base64");

    if (
      imageBytes.length < 24 ||
      imageBytes.length > 15000 ||
      imageBytes.toString("base64") !== encodedImage ||
      imageBytes.subarray(0, 8).toString("hex") !==
        "89504e470d0a1a0a"
    ) {
      throw new Error("Invalid drawn signature PNG.");
    }

    const imageWidth = imageBytes.readUInt32BE(16);
    const imageHeight = imageBytes.readUInt32BE(20);

    if (
      imageWidth < 1 ||
      imageHeight < 1 ||
      imageWidth > 1000 ||
      imageHeight > 1000 ||
      imageWidth * imageHeight > 1000000
    ) {
      throw new Error("Invalid drawn signature dimensions.");
    }

    let imageProperties;

    try {
      imageProperties = pdf.getImageProperties(signatureData);

      if (
        imageProperties.fileType !== "PNG" ||
        imageProperties.width !== imageWidth ||
        imageProperties.height !== imageHeight
      ) {
        throw new Error("Invalid PNG properties.");
      }
        } catch (error) {
      console.error("DRAWN SIGNATURE PNG ERROR:", error);

      throw new Error(
        "Drawn signature image could not be decoded."
      );
    }

    const displayWidth = 90;
    const displayHeight = Math.min(
      35,
      (imageHeight / imageWidth) * displayWidth
    );

    ensureSpace(displayHeight + 25);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Electronic Signature", MARGIN, y);

    y += 8;

    try {
      pdf.addImage(
        signatureData,
        "PNG",
        MARGIN,
        y,
        displayWidth,
        displayHeight
      );
    } catch {
      throw new Error("Drawn signature could not be embedded.");
    }

    y += displayHeight + 5;

    pdf.setDrawColor(148, 163, 184);
    pdf.line(MARGIN, y, 110, y);

    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Electronically signed using SerVen", MARGIN, y);

    pdf.setTextColor(15, 23, 42);
    y += 10;
  } else {
    throw new Error("Unsupported electronic signature method.");
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
