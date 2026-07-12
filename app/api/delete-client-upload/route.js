import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase server environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function safeDeleteByUploadId(uploadId) {
  const deleteSteps = [
    ["sales", "upload_id"],
    ["menu_items", "upload_id"],
    ["ingredients", "upload_id"],
    ["inventory_items", "upload_id"],
    ["beverage_items", "upload_id"],
    ["beverage_usage", "upload_id"],
    ["batch_prep_data", "upload_id"],
    ["recipe_ingredients", "upload_id"],
    ["recipes", "upload_id"],
    ["employee_shifts", "upload_id"],
    ["restaurant_customers", "upload_id"],
    ["customers", "upload_id"],
    ["client_data_uploads", "upload_id"],
    ["locations", "upload_id"],
  ];

  for (const [table, column] of deleteSteps) {
    const { error } = await supabase.from(table).delete().eq(column, uploadId);

    if (error) {
      console.warn(`DELETE API ${table} skipped/failed:`, error);
    }
  }
}

async function deleteInvoiceData(uploadId) {
  const {
    data: invoiceRows,
    error: invoiceLookupError,
  } = await supabase
    .from("invoice_uploads")
    .select("id")
    .eq("upload_id", uploadId);

  if (invoiceLookupError) {
    throw invoiceLookupError;
  }

  const invoiceIds = (invoiceRows || [])
    .map((row) => row.id)
    .filter(Boolean);

  const { error: lineByUploadError } =
    await supabase
      .from("invoice_line_items")
      .delete()
      .eq("upload_id", uploadId);

  if (lineByUploadError) {
    throw lineByUploadError;
  }

  if (invoiceIds.length > 0) {
    const { error: lineByInvoiceError } =
      await supabase
        .from("invoice_line_items")
        .delete()
        .in("invoice_id", invoiceIds);

    if (lineByInvoiceError) {
      throw lineByInvoiceError;
    }
  }

  const { error: invoiceDeleteError } =
    await supabase
      .from("invoice_uploads")
      .delete()
      .eq("upload_id", uploadId);

  if (invoiceDeleteError) {
    throw invoiceDeleteError;
  }
}

async function deleteLaborByFileName(fileName) {
  if (!fileName) return null;

  const cleanFileName = String(fileName).trim();

  if (!cleanFileName) return null;

  console.log("DELETE API labor by file_name:", cleanFileName);

  const { data: laborRows, error: laborLookupError } = await supabase
    .from("labor_uploads")
    .select("id, file_name")
    .ilike("file_name", cleanFileName);

  if (laborLookupError) throw laborLookupError;

  if (!laborRows?.length) {
    console.log("DELETE API no labor rows matched file_name:", cleanFileName);
    return null;
  }

  const { error: laborDeleteError } = await supabase
    .from("labor_uploads")
    .delete()
    .ilike("file_name", cleanFileName);

  if (laborDeleteError) throw laborDeleteError;

  return {
    fileName: cleanFileName,
    deletedCount: laborRows.length,
    ids: laborRows.map((row) => row.id),
  };
}

async function deleteLaborUpload(id) {
  const rawId = String(id || "");

  if (!rawId) return null;

  if (rawId.startsWith("labor-file-")) {
    return null;
  }

  const laborId = rawId.startsWith("labor-")
    ? rawId.slice("labor-".length)
    : rawId;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(laborId)) {
    console.log("DELETE API skipping labor lookup, not a UUID:", {
      rawId,
      laborId,
    });
    return null;
  }

  const { data: laborRow, error: laborLookupError } = await supabase
    .from("labor_uploads")
    .select("id")
    .eq("id", laborId)
    .maybeSingle();

  if (laborLookupError) throw laborLookupError;

  if (!laborRow?.id) return null;

  const { error: laborDeleteError } = await supabase
    .from("labor_uploads")
    .delete()
    .eq("id", laborId);

  if (laborDeleteError) throw laborDeleteError;

  return laborId;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const rawId = body?.id || body?.uploadId;
    const laborFileName = body?.laborFileName || null;

    if (!rawId) {
      return NextResponse.json(
        { error: "Upload id is required." },
        { status: 400 }
      );
    }

    const id = String(rawId);

    console.log("DELETE CLIENT UPLOAD API START:", {
      id,
      laborFileName,
    });

    // ✅ 1. Labor file group delete by filename.
    if (laborFileName) {
      const deletedLaborFile = await deleteLaborByFileName(laborFileName);

      if (deletedLaborFile) {
        return NextResponse.json({
          success: true,
          deletedFrom: "labor_uploads",
          deletedUploadId: id,
          deletedFileName: deletedLaborFile.fileName,
          deletedCount: deletedLaborFile.deletedCount,
          deletedLaborIds: deletedLaborFile.ids,
        });
      }
    }

    // ✅ 2. Labor single UUID delete.
    const deletedLaborId = await deleteLaborUpload(id);

    if (deletedLaborId) {
      return NextResponse.json({
        success: true,
        deletedFrom: "labor_uploads",
        deletedUploadId: deletedLaborId,
      });
    }

    // ✅ 3. Normal uploads table rows.
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          error: "No matching upload was found to delete.",
          searchedId: id,
        },
        { status: 404 }
      );
    }

    const { data: uploadRow, error: uploadLookupError } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (uploadLookupError) throw uploadLookupError;

    if (uploadRow?.id) {
      if (uploadRow.upload_type === "invoices") {
        await deleteInvoiceData(uploadRow.id);
      }

      await safeDeleteByUploadId(uploadRow.id);

      const { error: uploadDeleteError } = await supabase
        .from("uploads")
        .delete()
        .eq("id", uploadRow.id);

      if (uploadDeleteError) throw uploadDeleteError;

      return NextResponse.json({
        success: true,
        deletedFrom: "uploads",
        deletedUploadId: uploadRow.id,
      });
    }

    // ✅ 4. Fallback for old client_data_uploads-only rows.
    const { data: clientRow, error: clientLookupError } = await supabase
      .from("client_data_uploads")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (clientLookupError) throw clientLookupError;

    if (clientRow?.id) {
      const { error: clientDataDeleteError } = await supabase
        .from("client_data_uploads")
        .delete()
        .eq("id", id);

      if (clientDataDeleteError) throw clientDataDeleteError;

      return NextResponse.json({
        success: true,
        deletedFrom: "client_data_uploads",
        deletedUploadId: id,
      });
    }

    return NextResponse.json(
      {
        error: "No matching upload was found to delete.",
        searchedId: id,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Delete route failed:", error);

    return NextResponse.json(
      {
        error: error?.message || "Something went wrong.",
      },
      { status: 500 }
    );
  }
}