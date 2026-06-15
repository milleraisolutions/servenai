import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase server environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req) {
  try {
    const body = await req.json();
    const id = body?.id || body?.uploadId;

    if (!id) {
      return NextResponse.json(
        { error: "Upload id is required." },
        { status: 400 }
      );
    }

    console.log("DELETE CLIENT UPLOAD API START:", id);

    // First check uploads table
    const { data: uploadRow, error: uploadLookupError } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (uploadLookupError) throw uploadLookupError;

    console.log("DELETE API uploadRow:", uploadRow);

    // ✅ If this is a normal uploads-table import
    if (uploadRow?.id) {
      if (uploadRow.upload_type === "invoices") {
        const { data: invoiceUploads, error: invoiceLookupError } =
          await supabase
            .from("invoice_uploads")
            .select("id, upload_id, file_name, user_id")
            .eq("upload_id", uploadRow.id);

        if (invoiceLookupError) throw invoiceLookupError;

        const invoiceIds = (invoiceUploads || []).map((row) => row.id);

        console.log("DELETE API invoiceUploads:", invoiceUploads);
        console.log("DELETE API invoiceIds:", invoiceIds);

        const { error: lineByUploadError } = await supabase
          .from("invoice_line_items")
          .delete()
          .eq("upload_id", uploadRow.id);

        if (lineByUploadError) throw lineByUploadError;

        if (invoiceIds.length > 0) {
          const { error: lineByInvoiceError } = await supabase
            .from("invoice_line_items")
            .delete()
            .in("invoice_id", invoiceIds);

          if (lineByInvoiceError) throw lineByInvoiceError;
        }

        const { error: invoiceUploadsDeleteError } = await supabase
          .from("invoice_uploads")
          .delete()
          .eq("upload_id", uploadRow.id);

        if (invoiceUploadsDeleteError) throw invoiceUploadsDeleteError;
      }

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
        const { error } = await supabase
          .from(table)
          .delete()
          .eq(column, uploadRow.id);

        if (error) {
          console.warn(`DELETE API ${table} skipped/failed:`, error);
        }
      }

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

    // ✅ Fallback for old client_data_uploads-only rows
    const { error: clientDataDeleteError } = await supabase
      .from("client_data_uploads")
      .delete()
      .eq("id", id);

    if (clientDataDeleteError) {
      console.error("Delete client_data_uploads failed:", clientDataDeleteError);

      return NextResponse.json(
        {
          error: clientDataDeleteError.message || "Failed to delete upload.",
          details: clientDataDeleteError.details || null,
          hint: clientDataDeleteError.hint || null,
          code: clientDataDeleteError.code || null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedFrom: "client_data_uploads",
      deletedUploadId: id,
    });
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