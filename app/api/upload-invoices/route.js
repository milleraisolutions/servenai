import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function normalizeDate(dateStr) {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  let [month, day, year] = parts;
  if (year.length === 2) year = `20${year}`;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseInvoiceText(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const supplierName =
    lines.find((line) => !line.match(/\$|\d{1,2}\/\d{1,2}\/\d{2,4}/)) ||
    "Unknown Supplier";

  const dateMatch = text.match(/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/);
  const invoiceDate = dateMatch ? normalizeDate(dateMatch[1]) : null;

  const items = [];

  for (const line of lines) {
    const match = line.match(
      /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\w+)?\s+\$?(\d+(?:\.\d{1,2})?)\s+\$?(\d+(?:\.\d{1,2})?)$/
    );

    if (match) {
      items.push({
        item_name: match[1].trim(),
        quantity: Number(match[2]),
        unit: match[3] || null,
        unit_price: Number(match[4]),
        total_price: Number(match[5]),
      });
    }
  }

  return {
    supplierName,
    invoiceDate,
    items,
  };
}

export async function POST(req) {
  const createdUploadRows = [];
  const createdInvoiceRows = [];
  const createdLineItems = [];

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

    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files?.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = [];

    for (const file of files) {
      let uploadRow = null;
      let invoiceRow = null;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const parsedPdf = await parser.getText();
      
      console.log("PDF TEXT LENGTH:", parsedPdf?.text?.length);
console.log("PDF TEXT SAMPLE:", parsedPdf?.text?.slice(0, 500));
      await parser.destroy();

      const text = parsedPdf.text || "";
      const parsedInvoice = parseInvoiceText(text);

      const { data: createdUploadRow, error: uploadError } = await supabase
        .from("uploads")
        .insert([
          {
            user_id: user.id,
            file_name: file.name || "Invoice Upload",
            source_name: "invoice_upload",
            row_count: parsedInvoice.items?.length || 0,
            upload_type: "invoices",
            status: "completed",
            archived: false,
          },
        ])
        .select()
        .single();

      if (uploadError) throw uploadError;

      uploadRow = createdUploadRow;
      createdUploadRows.push(uploadRow);

      const filePath = `${user.id}/invoices/${Date.now()}-${file.name}`;

      const { error: storageError } = await supabase.storage
        .from("invoice-pdfs")
        .upload(filePath, buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from("invoice-pdfs")
        .getPublicUrl(filePath);

      const { data: createdInvoiceRow, error: invoiceError } = await supabase
        .from("invoice_uploads")
        .insert({
          user_id: user.id,
          upload_id: uploadRow.id,
          supplier_name: parsedInvoice.supplierName,
          invoice_date: parsedInvoice.invoiceDate || null,
          file_name: file.name,
          file_url: publicUrlData.publicUrl,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      invoiceRow = createdInvoiceRow;
      createdInvoiceRows.push(invoiceRow);

      const lineItemsToInsert = [];

      for (const item of parsedInvoice.items) {
        const { data: previousItem } = await supabase
          .from("invoice_line_items")
          .select("unit_price, created_at")
          .eq("user_id", user.id)
          .eq("item_name", item.item_name)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

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

        createdLineItems.push(...(insertedLineItems || []));
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

    return NextResponse.json(
      { error: error.message || "Failed to process invoices" },
      { status: 500 }
    );
  }
}