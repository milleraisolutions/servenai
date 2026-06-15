import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function normalizeDate(dateStr) {
  if (!dateStr) return null;

  const cleaned = String(dateStr).trim();
  const parts = cleaned.split(/[\/\-]/);

  if (parts.length !== 3) return null;

  let [month, day, year] = parts;

  if (year.length === 2) year = `20${year}`;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function safeNumber(value) {
  if (value == null) return 0;

  const cleaned = String(value).replace(/[$,]/g, "").trim();
  const num = Number(cleaned);

  return Number.isFinite(num) ? num : 0;
}

function parseInvoiceText(text) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const supplierName =
    lines.find(
      (line) =>
        !line.match(/\$|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/) &&
        line.length > 2
    ) || "Unknown Supplier";

  const dateMatch = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
  const invoiceDate = dateMatch ? normalizeDate(dateMatch[1]) : null;

  const items = [];

  for (const line of lines) {
    const match = line.match(
      /^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+\$?([\d,]+(?:\.\d{1,2})?)\s+\$?([\d,]+(?:\.\d{1,2})?)$/
    );

    if (!match) continue;

    const itemName = match[1].trim();

    if (
      itemName.length < 2 ||
      /subtotal|total|tax|balance|amount due|invoice/i.test(itemName)
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
    supplierName,
    invoiceDate,
    items,
  };
}

async function rollbackCreatedData(supabase, created) {
  try {
    if (created.lineItemIds.length) {
      await supabase
        .from("invoice_line_items")
        .delete()
        .in("id", created.lineItemIds);
    }

    if (created.invoiceIds.length) {
      await supabase
        .from("invoice_uploads")
        .delete()
        .in("id", created.invoiceIds);
    }

    if (created.uploadIds.length) {
      await supabase.from("uploads").delete().in("id", created.uploadIds);
    }

    for (const path of created.storagePaths) {
      await supabase.storage.from("invoice-pdfs").remove([path]);
    }
  } catch (rollbackError) {
    console.error("Invoice rollback failed:", rollbackError);
  }
}

export async function POST(req) {
  const created = {
    uploadIds: [],
    invoiceIds: [],
    lineItemIds: [],
    storagePaths: [],
  };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Missing Supabase config" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files?.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;

    const createdUploadRows = [];
    const createdInvoiceRows = [];
    const createdLineItems = [];
    const alerts = [];

    for (const file of files) {
      if (!file || file.type !== "application/pdf") {
        throw new Error(`${file?.name || "Uploaded file"} must be a PDF`);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (!buffer.length) {
        throw new Error(`${file.name} is empty`);
      }

      const parsedPdf = await pdfParse(buffer);
      const text = parsedPdf?.text || "";

      console.log("PDF FILE:", file.name);
      console.log("PDF TEXT LENGTH:", text.length);
      console.log("PDF TEXT SAMPLE:", text.slice(0, 500));

      const parsedInvoice = parseInvoiceText(text);

      const { data: uploadRow, error: uploadError } = await supabase
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

      if (uploadError) throw uploadError;

      created.uploadIds.push(uploadRow.id);
      createdUploadRows.push(uploadRow);

      const safeFileName = String(file.name || "invoice.pdf").replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const filePath = `${user.id}/invoices/${Date.now()}-${safeFileName}`;

      const { error: storageError } = await supabase.storage
        .from("invoice-pdfs")
        .upload(filePath, buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (storageError) throw storageError;

      created.storagePaths.push(filePath);

    const { data: signedUrlData } = await supabase.storage
  .from("invoice-pdfs")
  .createSignedUrl(filePath, 60 * 60 * 24 * 7);

      const { data: invoiceRow, error: invoiceError } = await supabase
        .from("invoice_uploads")
        .insert({
          user_id: user.id,
          upload_id: uploadRow.id,
          supplier_name: parsedInvoice.supplierName,
          invoice_date: parsedInvoice.invoiceDate,
          file_name: file.name,
         file_url: signedUrlData?.signedUrl || null,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      created.invoiceIds.push(invoiceRow.id);
      createdInvoiceRows.push(invoiceRow);

      const lineItemsToInsert = [];

      for (const item of parsedInvoice.items) {
        const { data: previousItem, error: previousError } = await supabase
          .from("invoice_line_items")
          .select("unit_price, created_at")
          .eq("user_id", user.id)
          .ilike("item_name", item.item_name)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (previousError) throw previousError;

        const previousPrice = previousItem?.unit_price ?? null;

        const priceChange =
          previousPrice != null ? item.unit_price - previousPrice : null;

        const priceChangePercent =
          previousPrice && previousPrice > 0
            ? ((item.unit_price - previousPrice) / previousPrice) * 100
            : null;

        const flaggedIncrease =
          priceChangePercent != null && priceChangePercent >= 5;

        lineItemsToInsert.push({
          invoice_id: invoiceRow.id,
          upload_id: uploadRow.id,
          user_id: user.id,
          file_name: file.name,
          supplier_name: parsedInvoice.supplierName,
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

      if (lineItemsToInsert.length > 0) {
        const { data: insertedLineItems, error: lineError } = await supabase
          .from("invoice_line_items")
          .insert(lineItemsToInsert)
          .select();

        if (lineError) throw lineError;

        created.lineItemIds.push(...insertedLineItems.map((item) => item.id));
        createdLineItems.push(...insertedLineItems);
      }
    }

    return NextResponse.json({
      success: true,
      uploadedCount: createdInvoiceRows.length,
      uploads: createdUploadRows,
      uploadRow: createdUploadRows[0] || null,
      invoiceUploads: createdInvoiceRows,
      invoiceItems: createdLineItems,
      alerts,
    });
  } catch (error) {
    console.error("Invoice upload error:", error);

    await rollbackCreatedData(
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      created
    );

    return NextResponse.json(
      {
        error: error.message || "Failed to process invoices",
      },
      { status: 500 }
    );
  }
}