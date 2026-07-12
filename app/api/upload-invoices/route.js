import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ======================================================
   HELPERS
====================================================== */

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

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return normalized;
}

function safeNumber(value) {
  if (value == null) return 0;

  const rawValue = String(value).trim();

  const isNegative =
    rawValue.startsWith("(") &&
    rawValue.endsWith(")");

  const cleaned = rawValue
    .replace(/[$,\s]/g, "")
    .replace(/[()]/g, "")
    .trim();

  const number = Number(cleaned);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return isNegative ? number * -1 : number;
}

function withTimeout(promise, milliseconds, message) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, milliseconds);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/* ======================================================
   INVOICE TEXT PARSER
====================================================== */

function parseInvoiceText(text) {
  const rawText = String(text || "");

  const lines = rawText
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

  console.log(
    "INVOICE PARSER LINE COUNT:",
    lines.length
  );

  const supplierName =
    lines.find((line) => {
      const lowerLine = line.toLowerCase();

      return (
        line.length > 2 &&
        line.length < 150 &&
        !line.includes("$") &&
        !/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(
          line
        ) &&
        !lowerLine.includes("invoice date") &&
        !lowerLine.includes("invoice number") &&
        !lowerLine.includes("customer") &&
        !lowerLine.includes("description") &&
        !lowerLine.includes("subtotal") &&
        !lowerLine.includes("tax") &&
        !lowerLine.includes("total")
      );
    }) || "Unknown Supplier";

  const dateMatch = rawText.match(
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/
  );

  const invoiceDate = dateMatch
    ? normalizeDate(dateMatch[1])
    : null;

  const items = [];

  for (const line of lines) {
    const tokens = line
      .split(" ")
      .map((token) => token.trim())
      .filter(Boolean);

    /*
      Expected ending:

      Item Name | Quantity | Unit | Unit Price | Total

      Example:
      Ribeye Steak 10 lb $12.50 $125.00
    */
    if (tokens.length < 5) {
      continue;
    }

    const totalString = tokens.pop();
    const unitPriceString = tokens.pop();
    const unit = tokens.pop();
    const quantityString = tokens.pop();

    const quantity = safeNumber(quantityString);
    const unitPrice = safeNumber(unitPriceString);
    const totalPrice = safeNumber(totalString);

    const validUnit =
      typeof unit === "string" &&
      /^[a-zA-Z][a-zA-Z0-9._/-]{0,14}$/.test(unit);

    if (
      quantity <= 0 ||
      unitPrice < 0 ||
      totalPrice < 0 ||
      !validUnit
    ) {
      continue;
    }

    const itemName = tokens.join(" ").trim();
    const lowerItemName = itemName.toLowerCase();

    if (
      !itemName ||
      lowerItemName.includes("description") ||
      lowerItemName.includes("subtotal") ||
      lowerItemName.includes("grand total") ||
      lowerItemName === "total" ||
      lowerItemName.includes("amount due") ||
      lowerItemName.includes("balance") ||
      lowerItemName.includes("invoice")
    ) {
      continue;
    }

    items.push({
      item_name: itemName,
      quantity,
      unit,
      unit_price: unitPrice,
      total_price: totalPrice,
    });
  }

  console.log(
    "FINAL PARSED INVOICE ITEMS:",
    items
  );

  return {
    supplierName:
      String(supplierName || "Unknown Supplier").slice(
        0,
        255
      ),
    invoiceDate,
    items,
  };
}

/* ======================================================
   SUPABASE
====================================================== */

function createSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server configuration."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function getBearerToken(req) {
  const authHeader =
    req.headers.get("authorization") || "";

  if (
    !authHeader
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return null;
  }

  return authHeader.slice(7).trim() || null;
}

async function safelyRemoveStorageFile(
  supabase,
  filePath
) {
  if (!filePath) return;

  const { error } = await supabase.storage
    .from("invoice-pdfs")
    .remove([filePath]);

  if (error) {
    console.error(
      "Failed to remove invoice storage file:",
      error
    );
  }
}

async function safelyDeleteUploadRow(
  supabase,
  uploadId
) {
  if (!uploadId) return;

  const { error } = await supabase
    .from("uploads")
    .delete()
    .eq("id", uploadId);

  if (error) {
    console.error(
      "Failed to remove uploads row:",
      error
    );
  }
}

/* ======================================================
   PDF-PARSE COMPATIBILITY
====================================================== */

async function loadPdfParser() {
  try {
    const pdfParseModule = await import("pdf-parse");

    const PDFParseClass =
      pdfParseModule?.PDFParse ||
      pdfParseModule?.default?.PDFParse ||
      null;

    const legacyPdfParse =
      typeof pdfParseModule?.default === "function"
        ? pdfParseModule.default
        : null;

    console.log("PDF PARSER MODE:", {
      classApi: Boolean(PDFParseClass),
      legacyApi: Boolean(legacyPdfParse),
      exports: Object.keys(pdfParseModule || {}),
    });

    return {
      PDFParseClass,
      legacyPdfParse,
    };
  } catch (error) {
    console.error(
      "PDF PARSE IMPORT FAILED:",
      error
    );

    return {
      PDFParseClass: null,
      legacyPdfParse: null,
    };
  }
}

async function extractPdfText({
  buffer,
  fileName,
  PDFParseClass,
  legacyPdfParse,
}) {
  let parser = null;

  try {
    if (PDFParseClass) {
      console.log(
        "USING PDF-PARSE CLASS API:",
        fileName
      );

      parser = new PDFParseClass({
        data: new Uint8Array(buffer),
      });

      const parsedPdf = await withTimeout(
        parser.getText(),
        20000,
        `PDF parsing timed out for ${fileName}.`
      );

      return (
        parsedPdf?.text ||
        parsedPdf?.pages
          ?.map((page) => page?.text || "")
          .join("\n") ||
        ""
      );
    }

    if (legacyPdfParse) {
      console.log(
        "USING PDF-PARSE LEGACY API:",
        fileName
      );

      const parsedPdf = await withTimeout(
        legacyPdfParse(buffer),
        20000,
        `PDF parsing timed out for ${fileName}.`
      );

      return parsedPdf?.text || "";
    }

    throw new Error(
      "No compatible pdf-parse API was found."
    );
  } finally {
    if (
      parser &&
      typeof parser.destroy === "function"
    ) {
      try {
        await parser.destroy();
      } catch (destroyError) {
        console.warn(
          "PDF parser cleanup failed:",
          destroyError
        );
      }
    }
  }
}

/* ======================================================
   LINE ITEM INSERT
====================================================== */

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
    const itemNames = parsedInvoice.items
      .map((item) =>
        String(item.item_name || "").trim()
      )
      .filter(Boolean);

    let historicalItems = [];

    if (itemNames.length) {
      const {
        data: historyData,
        error: historyError,
      } = await supabase
        .from("invoice_line_items")
        .select(
          "item_name, unit_price, created_at"
        )
        .eq("user_id", user.id)
        .in("item_name", itemNames)
        .order("created_at", {
          ascending: false,
        });

      if (historyError) {
        console.warn(
          "Invoice price history lookup failed:",
          historyError
        );
      } else {
        historicalItems = historyData || [];
      }
    }

    /*
      Because history is ordered newest first,
      keep only the first row for each item.
    */
    const latestPriceByItem = new Map();

    for (const historicalItem of historicalItems) {
      const key = String(
        historicalItem.item_name || ""
      )
        .trim()
        .toLowerCase();

      if (
        key &&
        !latestPriceByItem.has(key)
      ) {
        latestPriceByItem.set(
          key,
          historicalItem
        );
      }
    }

    const rowsToInsert = [];
    const alerts = [];

    for (const item of parsedInvoice.items) {
      const normalizedItemName = String(
        item.item_name || ""
      )
        .trim()
        .toLowerCase();

      const previousItem =
        latestPriceByItem.get(
          normalizedItemName
        ) || null;

      const previousPrice =
        previousItem?.unit_price != null
          ? Number(previousItem.unit_price)
          : null;

      const currentPrice = Number(
        item.unit_price || 0
      );

      const priceChange =
        previousPrice != null
          ? currentPrice - previousPrice
          : null;

      const priceChangePercent =
        previousPrice != null &&
        previousPrice > 0
          ? (priceChange / previousPrice) * 100
          : null;

      const flaggedIncrease =
        priceChangePercent != null &&
        priceChangePercent >= 5;

      rowsToInsert.push({
        invoice_id: invoiceRow.id,
        upload_id: uploadRow.id,
        user_id: user.id,
        file_name:
          file.name || "Invoice Upload",
        supplier_name:
          parsedInvoice.supplierName ||
          "Unknown Supplier",
        item_name: item.item_name,
        unit: item.unit || null,
        quantity: Number(
          item.quantity || 0
        ),
        unit_price: currentPrice,
        total_price: Number(
          item.total_price || 0
        ),
        previous_unit_price:
          previousPrice,
        price_change: priceChange,
        price_change_percent:
          priceChangePercent,
        flagged_increase:
          flaggedIncrease,
      });

      if (flaggedIncrease) {
        alerts.push({
          item: item.item_name,
          supplier:
            parsedInvoice.supplierName,
          oldPrice: previousPrice,
          newPrice: currentPrice,
          percentChange:
            priceChangePercent,
        });
      }
    }

    const {
      data: insertedItems,
      error: lineItemError,
    } = await supabase
      .from("invoice_line_items")
      .insert(rowsToInsert)
      .select();

    if (lineItemError) {
      console.error(
        "Invoice parent saved, but line items failed:",
        lineItemError
      );

      return {
        insertedItems: [],
        alerts,
        warning:
          `Invoice saved, but line items failed: ` +
          lineItemError.message,
      };
    }

    return {
      insertedItems: insertedItems || [],
      alerts,
      warning: null,
    };
  } catch (error) {
    console.error(
      "Invoice line-item processing crashed:",
      error
    );

    return {
      insertedItems: [],
      alerts: [],
      warning:
        `Invoice saved, but line-item processing failed: ` +
        `${error?.message || "Unknown error"}`,
    };
  }
}

/* ======================================================
   API ROUTE
====================================================== */

export async function POST(req) {
  console.log(
    "INVOICE ROUTE VERSION: FINAL-PARSER-FIX"
  );

  let supabase;

  try {
    supabase = createSupabaseAdmin();
  } catch (configError) {
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
      console.error(
        "Invoice authentication failed:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
          details:
            userError?.message || null,
        },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const files = formData
      .getAll("files")
      .filter(
        (file) =>
          file &&
          typeof file.arrayBuffer ===
            "function"
      );

    if (!files.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No invoice files were received.",
        },
        { status: 400 }
      );
    }

    const {
      PDFParseClass,
      legacyPdfParse,
    } = await loadPdfParser();

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
        const fileName =
          file.name || "invoice.pdf";

        const isPdf =
          file.type === "application/pdf" ||
          fileName
            .toLowerCase()
            .endsWith(".pdf");

        if (!isPdf) {
          throw new Error(
            `${fileName} must be a PDF.`
          );
        }

        const bytes =
          await file.arrayBuffer();

        const buffer =
          Buffer.from(bytes);

        if (!buffer.length) {
          throw new Error(
            `${fileName} is empty.`
          );
        }

        let text = "";

        try {
          text = await extractPdfText({
            buffer,
            fileName,
            PDFParseClass,
            legacyPdfParse,
          });
        } catch (pdfError) {
          console.error(
            `PDF parsing failed for ${fileName}:`,
            {
              message:
                pdfError?.message,
              stack:
                pdfError?.stack,
            }
          );

          warnings.push({
            fileName,
            message:
              pdfError?.message ||
              "The invoice saved, but PDF text extraction failed.",
          });

          text = "";
        }

        console.log(
          "PDF FILE:",
          fileName
        );

        console.log(
          "PDF TEXT LENGTH:",
          text.length
        );

        console.log(
          "PDF TEXT SAMPLE:",
          text.slice(0, 1500)
        );

        const parsedInvoice =
          parseInvoiceText(text);
if (!text.trim()) {
  throw new Error(
    `No PDF text was extracted from ${fileName}. The invoice was not saved.`
  );
}

if (!parsedInvoice.items.length) {
  throw new Error(
    `PDF text was extracted from ${fileName}, but no invoice line items were recognized.`
  );
}
        console.log(
          "PARSED INVOICE:",
          parsedInvoice
        );

        console.log(
          "PARSED ITEM COUNT:",
          parsedInvoice.items.length
        );

        /*
          Create the Recent Imports row.
        */
        const {
          data: newUploadRow,
          error: uploadError,
        } = await supabase
          .from("uploads")
          .insert({
            user_id: user.id,
            file_name: fileName,
            source_name:
              "invoice_upload",
            row_count:
              parsedInvoice.items.length,
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
        createdUploadRows.push(
          uploadRow
        );

        /*
          Save the original PDF.
        */
        const safeFileName =
          fileName.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

        filePath =
          `${user.id}/invoices/` +
          `${Date.now()}-` +
          `${crypto.randomUUID()}-` +
          `${safeFileName}`;

        const {
          error: storageError,
        } = await supabase.storage
          .from("invoice-pdfs")
          .upload(filePath, buffer, {
            contentType:
              "application/pdf",
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
          console.warn(
            "Signed invoice URL creation failed:",
            signedUrlError
          );
        }

        /*
          The upload_id relationship is required
          for reliable deletion and data cleanup.
        */
        const invoicePayload = {
          user_id: user.id,
          upload_id: uploadRow.id,
          supplier_name:
            parsedInvoice.supplierName ||
            "Unknown Supplier",
          invoice_date:
            parsedInvoice.invoiceDate ||
            null,
          file_name: fileName,
          file_url:
            signedUrlData?.signedUrl ||
            filePath,
        };

        console.log(
          "INSERTING INVOICE_UPLOADS:",
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

        if (invoiceError) {
          throw new Error(
            `invoice_uploads insert failed: ${invoiceError.message}`
          );
        }

        invoiceWasSaved = true;

        createdInvoiceRows.push(
          invoiceRow
        );

        /*
          Save the individual invoice rows.
        */
        const lineItemResult =
          await insertInvoiceLineItems({
            supabase,
            user,
            file,
            parsedInvoice,
            invoiceRow,
            uploadRow,
          });

        const finalRowCount =
          lineItemResult.insertedItems
            .length ||
          parsedInvoice.items.length ||
          0;

        /*
          Confirm the actual row count was saved
          to the uploads table.
        */
        const {
          data: updatedUploadRows,
          error: rowCountUpdateError,
        } = await supabase
          .from("uploads")
          .update({
            row_count: finalRowCount,
          })
          .eq("id", uploadRow.id)
          .select("id, row_count");

        if (rowCountUpdateError) {
          console.error(
            "Invoice row-count update failed:",
            rowCountUpdateError
          );

          warnings.push({
            fileName,
            message:
              `Invoice saved, but the Recent Imports row count failed: ` +
              rowCountUpdateError.message,
          });
        } else {
          uploadRow.row_count =
            updatedUploadRows?.[0]
              ?.row_count ??
            finalRowCount;
        }

        console.log(
          "FINAL SAVED INVOICE ROW COUNT:",
          uploadRow.row_count
        );

        createdLineItems.push(
          ...lineItemResult.insertedItems
        );

        alerts.push(
          ...lineItemResult.alerts
        );

        if (
          lineItemResult.warning
        ) {
          warnings.push({
            fileName,
            message:
              lineItemResult.warning,
          });
        }
      } catch (fileError) {
        console.error(
          `Invoice processing failed for ${file?.name}:`,
          {
            message:
              fileError?.message,
            details:
              fileError?.details,
            hint:
              fileError?.hint,
            code:
              fileError?.code,
            stack:
              fileError?.stack,
          }
        );

        failures.push({
          fileName:
            file?.name ||
            "Unknown file",
          error:
            fileError?.message ||
            "Invoice processing failed.",
        });

        /*
          If the invoice parent was never saved,
          clean up the orphan upload and PDF.
        */
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

    const success =
      uploadedCount > 0;

    return NextResponse.json(
      {
        success,
        uploadedCount,
        failedCount:
          failures.length,
        uploads:
          createdUploadRows,
        uploadRow:
          createdUploadRows[0] ||
          null,
        invoiceUploads:
          createdInvoiceRows,
        invoiceItems:
          createdLineItems,
        alerts,
        warnings,
        failures,
        message: success
          ? `${uploadedCount} invoice${
              uploadedCount === 1
                ? ""
                : "s"
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