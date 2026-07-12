import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeDate(dateStr) {
  if (!dateStr) return null;

  const cleaned = String(dateStr).trim();
  const parts = cleaned.split(/[\/\-]/);

  if (parts.length !== 3) return null;

  let [month, day, year] = parts;

  month = String(month || "").padStart(2, "0");
  day = String(day || "").padStart(2, "0");

  if (String(year || "").length === 2) {
    year = `20${year}`;
  }

  const normalized = `${year}-${month}-${day}`;
  const parsedDate = new Date(`${normalized}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) return null;

  return normalized;
}

function safeNumber(value) {
  if (value == null) return 0;

  const cleaned = String(value)
    .replace(/[$,\s]/g, "")
    .replace(/[()]/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}

function parseInvoiceText(text) {
  const rawText = String(text || "");

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const supplierName =
    lines.find(
      (line) =>
        line.length > 2 &&
        line.length < 120 &&
        !/\$/.test(line) &&
        !/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(line) &&
        !/invoice|subtotal|total|tax|balance|amount due/i.test(line)
    ) ||
    lines[0] ||
    "Unknown Supplier";

  const dateMatch = rawText.match(
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/
  );

  const invoiceDate = dateMatch ? normalizeDate(dateMatch[1]) : null;

  const items = [];

  for (const line of lines) {
    const match = line.match(
      /^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+\$?([\d,]+(?:\.\d{1,2})?)\s+\$?([\d,]+(?:\.\d{1,2})?)$/
    );

    if (!match) continue;

    const itemName = String(match[1] || "").trim();

    if (
      itemName.length < 2 ||
      /subtotal|grand total|total|tax|balance|amount due|invoice/i.test(
        itemName
      )
    ) {
      continue;
    }

    items.push({
      item_name: itemName,
      quantity: safeNumber(match[2]),
      unit: match[3] || null,
      unit_price: safeNumber(match[4]),
      total_price: safeNumber(match[5]),
    });
  }

  return {
    supplierName: String(supplierName).slice(0, 255),
    invoiceDate,
    items,
  };
}

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server configuration.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getBearerToken(req) {
  const authHeader = req.headers.get("authorization") || "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim() || null;
}

async function safelyRemoveStorageFile(supabase, filePath) {
  if (!filePath) return;

  const { error } = await supabase.storage
    .from("invoice-pdfs")
    .remove([filePath]);

  if (error) {
    console.error("Failed to remove invoice storage file:", error);
  }
}

async function safelyDeleteUploadRow(supabase, uploadId) {
  if (!uploadId) return;

  const { error } = await supabase
    .from("uploads")
    .delete()
    .eq("id", uploadId);

  if (error) {
    console.error("Failed to remove uploads row:", error);
  }
}

async function insertInvoiceLineItems({
  supabase,
  user,
  file,
  parsedInvoice,
  invoiceRow,
  uploadRow,
}) {
  if (!parsedInvoice.items.length) {
    return {
      insertedItems: [],
      alerts: [],
      warning: null,
    };
  }

  try {
    const rows = [];
    const alerts = [];

    for (const item of parsedInvoice.items) {
      let previousPrice = null;

      const { data: previousItem, error: previousError } = await supabase
        .from("invoice_line_items")
        .select("unit_price, created_at")
        .eq("user_id", user.id)
        .ilike("item_name", item.item_name)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (previousError) {
        console.error(
          `Previous-price lookup failed for ${item.item_name}:`,
          previousError
        );
      } else {
        previousPrice = previousItem?.unit_price ?? null;
      }

      const priceChange =
        previousPrice != null
          ? Number(item.unit_price || 0) - Number(previousPrice || 0)
          : null;

      const priceChangePercent =
        previousPrice != null && Number(previousPrice) > 0
          ? (priceChange / Number(previousPrice)) * 100
          : null;

      const flaggedIncrease =
        priceChangePercent != null && priceChangePercent >= 5;

      rows.push({
        invoice_id: invoiceRow.id,
        upload_id: uploadRow?.id || null,
        user_id: user.id,
        file_name: file.name || "Invoice Upload",
        supplier_name:
          parsedInvoice.supplierName || "Unknown Supplier",
        item_name: item.item_name,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        previous_unit_price: previousPrice,
        price_change: priceChange,
        price_change_percent: priceChangePercent,
        flagged_increase: flaggedIncrease,
      });

      if (flaggedIncrease) {
        alerts.push({
          item: item.item_name,
          supplier: parsedInvoice.supplierName,
          oldPrice: previousPrice,
          newPrice: item.unit_price,
          percentChange: priceChangePercent,
        });
      }
    }

    const { data: insertedItems, error: lineItemError } =
      await supabase
        .from("invoice_line_items")
        .insert(rows)
        .select();

    if (lineItemError) {
      console.error(
        "Invoice parent saved, but invoice line items failed:",
        lineItemError
      );

      return {
        insertedItems: [],
        alerts,
        warning: `Invoice saved, but line items failed: ${lineItemError.message}`,
      };
    }

    return {
      insertedItems: insertedItems || [],
      alerts,
      warning: null,
    };
  } catch (error) {
    console.error(
      "Invoice parent saved, but line-item processing crashed:",
      error
    );

    return {
      insertedItems: [],
      alerts: [],
      warning: `Invoice saved, but line-item processing failed: ${
        error?.message || "Unknown line-item error"
      }`,
    };
  }
}

export async function POST(req) {
  console.log("INVOICE ROUTE VERSION: JULY-11-FULL-FIX");

  let supabase;

  try {
    supabase = createSupabaseAdmin();
  } catch (configError) {
    console.error("Invoice route configuration error:", configError);

    return NextResponse.json(
      {
        success: false,
        error: configError.message,
      },
      { status: 500 }
    );
  }

  try {
    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing auth token.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user?.id) {
      console.error("Invoice auth failed:", userError);

      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
          details: userError?.message || null,
        },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const files = formData
      .getAll("files")
      .filter(
        (file) =>
          file && typeof file.arrayBuffer === "function"
      );

    if (!files.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No invoice files were received.",
        },
        { status: 400 }
      );
    }

    let pdfParse = null;

    try {
      const pdfParseModule = await import("pdf-parse");
      pdfParse = pdfParseModule.default || pdfParseModule;
    } catch (pdfImportError) {
      console.error(
        "pdf-parse could not be loaded. Parent invoices will still save:",
        pdfImportError
      );
    }

    const createdUploadRows = [];
    const createdInvoiceRows = [];
    const createdLineItems = [];
    const alerts = [];
    const warnings = [];
    const failures = [];

    for (const file of files) {
      let uploadRow = null;
      let filePath = null;
      let invoiceWasSaved = false;

      try {
        const isPdf =
          file.type === "application/pdf" ||
          String(file.name || "")
            .toLowerCase()
            .endsWith(".pdf");

        if (!isPdf) {
          throw new Error(
            `${file.name || "Uploaded file"} must be a PDF.`
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!buffer.length) {
          throw new Error(
            `${file.name || "Uploaded file"} is empty.`
          );
        }

        let text = "";

        if (pdfParse) {
          try {
            const parsedPdf = await pdfParse(buffer);
            text = parsedPdf?.text || "";
          } catch (pdfError) {
            console.error(
              `PDF parsing failed for ${file.name}; saving parent invoice anyway:`,
              pdfError
            );

            warnings.push({
              fileName: file.name,
              message:
                "The invoice was saved, but PDF text could not be extracted.",
            });
          }
        }

        console.log("PDF FILE:", file.name);
        console.log("PDF TEXT LENGTH:", text.length);
        console.log("PDF TEXT SAMPLE:", text.slice(0, 500));

        const parsedInvoice = parseInvoiceText(text);

        const { data: newUploadRow, error: uploadError } =
          await supabase
            .from("uploads")
            .insert({
              user_id: user.id,
              file_name: file.name || "Invoice Upload",
              source_name: "invoice_upload",
              row_count: parsedInvoice.items.length,
              upload_type: "invoices",
              status: "completed",
              archived: false,
            })
            .select()
            .single();

        if (uploadError) {
          throw new Error(
            `uploads insert failed: ${uploadError.message}`
          );
        }

        uploadRow = newUploadRow;
        createdUploadRows.push(uploadRow);

        const safeFileName = String(
          file.name || "invoice.pdf"
        ).replace(/[^a-zA-Z0-9._-]/g, "_");

        filePath = `${
          user.id
        }/invoices/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

        const { error: storageError } =
          await supabase.storage
            .from("invoice-pdfs")
            .upload(filePath, buffer, {
              contentType: "application/pdf",
              upsert: false,
            });

        if (storageError) {
          throw new Error(
            `Invoice storage upload failed: ${storageError.message}`
          );
        }

        const {
          data: signedUrlData,
          error: signedUrlError,
        } = await supabase.storage
          .from("invoice-pdfs")
          .createSignedUrl(
            filePath,
            60 * 60 * 24 * 7
          );

        if (signedUrlError) {
          console.error(
            "Signed URL creation failed:",
            signedUrlError
          );
        }

        const invoicePayload = {
          user_id: user.id,
          supplier_name:
            parsedInvoice.supplierName ||
            "Unknown Supplier",
          invoice_date:
            parsedInvoice.invoiceDate || null,
          file_name:
            file.name || "Invoice Upload",
          file_url:
            signedUrlData?.signedUrl || filePath,
        };

        console.log(
          "INSERTING INVOICE_UPLOADS ROW:",
          invoicePayload
        );

        const {
          data: invoiceRow,
          error: invoiceError,
        } = await supabase
          .from("invoice_uploads")
          .insert(invoicePayload)
          .select()
          .single();

        console.log(
          "INVOICE_UPLOADS INSERT DATA:",
          invoiceRow
        );

        console.log(
          "INVOICE_UPLOADS INSERT ERROR:",
          invoiceError
        );

        if (invoiceError) {
          throw new Error(
            `invoice_uploads insert failed: ${invoiceError.message}`
          );
        }

        invoiceWasSaved = true;
        createdInvoiceRows.push(invoiceRow);

        const lineItemResult =
          await insertInvoiceLineItems({
            supabase,
            user,
            file,
            parsedInvoice,
            invoiceRow,
            uploadRow,
          });

        createdLineItems.push(
          ...lineItemResult.insertedItems
        );

        alerts.push(...lineItemResult.alerts);

        if (lineItemResult.warning) {
          warnings.push({
            fileName: file.name,
            message: lineItemResult.warning,
          });
        }
      } catch (fileError) {
        console.error(
          `Invoice processing failed for ${file?.name}:`,
          {
            message: fileError?.message,
            details: fileError?.details,
            hint: fileError?.hint,
            code: fileError?.code,
            stack: fileError?.stack,
          }
        );

        failures.push({
          fileName: file?.name || "Unknown file",
          error:
            fileError?.message ||
            "Invoice processing failed.",
        });

        if (!invoiceWasSaved) {
          await safelyRemoveStorageFile(
            supabase,
            filePath
          );

          await safelyDeleteUploadRow(
            supabase,
            uploadRow?.id
          );
        }
      }
    }

    const uploadedCount =
      createdInvoiceRows.length;

    const success = uploadedCount > 0;

    return NextResponse.json(
      {
        success,
        uploadedCount,
        failedCount: failures.length,
        uploads: createdUploadRows,
        uploadRow:
          createdUploadRows[0] || null,
        invoiceUploads:
          createdInvoiceRows,
        invoiceItems:
          createdLineItems,
        alerts,
        warnings,
        failures,
        message: success
          ? `${uploadedCount} invoice${
              uploadedCount === 1 ? "" : "s"
            } saved successfully.`
          : "No invoices were saved.",
      },
      {
        status: success ? 200 : 500,
      }
    );
  } catch (error) {
    console.error(
      "INVOICE UPLOAD ROUTE FAILED:",
      {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack,
      }
    );

    return NextResponse.json(
      {
        success: false,
        uploadedCount: 0,
        error:
          error?.message ||
          "Failed to process invoices.",
      },
      { status: 500 }
    );
  }
}