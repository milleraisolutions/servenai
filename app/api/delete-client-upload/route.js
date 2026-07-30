import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase server environment variables."
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/*
  ==========================================
  AUTHENTICATE REQUEST
  ==========================================
*/
async function getAuthenticatedUser(req) {
  const authorization =
    req.headers.get("authorization") || "";

  const accessToken = authorization.startsWith(
    "Bearer "
  )
    ? authorization.slice(7).trim()
    : "";

  if (!accessToken) {
    throw new Error(
      "Missing authentication token."
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user?.id) {
    throw new Error(
      "Your login session is invalid or expired."
    );
  }

  return user;
}

/*
  ==========================================
  NORMAL CHILD TABLE DELETE
  ==========================================
*/
async function safeDeleteByUploadId(uploadId, ownerId) {
  const deleteSteps = [
    ["sales", "upload_id"],
    ["menu_items", "upload_id"],
    ["ingredients", "upload_id"],
    ["inventory_items", "upload_id"],
    ["beverage_items", "upload_id"],
    ["beverage_usage", "upload_id"],
    ["batch_prep_data", "upload_id"],
    
    ["employee_shifts", "upload_id"],
    ["restaurant_customers", "upload_id"],
    ["customers", "upload_id"],
    ["client_data_uploads", "upload_id"],
    ["locations", "upload_id"],
  ];

  const results = [];

  console.log("DELETE API START:", {
    uploadId,
    ownerId,
  });

  for (const [table, column] of deleteSteps) {
    console.log(`DELETE API STARTING ${table}:`, {
      table,
      column,
      uploadId,
      ownerId,
    });

    let query = supabase
      .from(table)
      .delete()
      .eq(column, uploadId);

    if (ownerId) {
      query = query.eq("user_id", ownerId);
    }

    let { data, error } = await query.select("*");

    console.log(`DELETE API ${table} RESULT:`, {
      uploadId,
      ownerId,
      deletedRows: data,
      deletedCount: data?.length || 0,
      error,
    });

    /*
      Retry without user_id only when Supabase says
      the table does not contain a user_id column.
    */
    if (
      error &&
      String(error.message || "")
        .toLowerCase()
        .includes("user_id")
    ) {
      console.warn(
        `DELETE API ${table}: retrying without user_id`
      );

      const fallbackResult = await supabase
        .from(table)
        .delete()
        .eq(column, uploadId)
        .select("*");

      data = fallbackResult.data;
      error = fallbackResult.error;

      console.log(`DELETE API ${table} FALLBACK RESULT:`, {
        uploadId,
        deletedRows: data,
        deletedCount: data?.length || 0,
        error,
      });
    }

   if (error) {
  const errorMessage = String(error?.message || "").toLowerCase();

  const isMissingSchemaProblem =
    errorMessage.includes("does not exist") ||
    errorMessage.includes("could not find") ||
    errorMessage.includes("schema cache") ||
    errorMessage.includes("column");

  console.error(`DELETE API ${table} FAILED:`, {
    table,
    uploadId,
    ownerId,
    error,
    ignored: isMissingSchemaProblem,
  });

  if (isMissingSchemaProblem) {
    results.push({
      table,
      success: false,
      skipped: true,
      deletedCount: 0,
      error: error.message,
    });

    continue;
  }

  throw new Error(
    `${table} delete failed: ${error.message}`
  );
}

    results.push({
      table,
      success: true,
      deletedCount: data?.length || 0,
    });

    console.log(`DELETE API ${table} COMPLETE:`, {
      deletedCount: data?.length || 0,
    });
  }

  console.log("DELETE API ALL CHILD TABLES COMPLETE:", results);

  return results;
}

/*
  ==========================================
  RECIPE DELETE
  ==========================================
*/
async function deleteRecipeData(uploadId, ownerId) {
  console.log("DELETE API RECIPE START:", {
    uploadId,
    ownerId,
  });

  // Find every recipe belonging to this upload.
  const {
    data: recipeRows,
    error: recipeLookupError,
  } = await supabase
    .from("recipes")
    .select("id")
    .eq("upload_id", uploadId)
    .eq("user_id", ownerId);

  if (recipeLookupError) {
    throw new Error(
      `Recipe lookup failed: ${recipeLookupError.message}`
    );
  }
let deletedUsageRules = [];

  /*
    Delete anything connected through recipe_id first.
    This prevents foreign-key errors when recipes are deleted.
  */
 const {
  data: usageRuleRows,
  error: usageRulesError,
} = await supabase
  .from("recipe_usage_rules")
  .delete()
  .eq("upload_id", uploadId)
  .select("id");

if (usageRulesError) {
  throw new Error(
    `Recipe usage rules delete failed: ${usageRulesError.message}`
  );
}

deletedUsageRules = usageRuleRows || [];

  /*
    Also delete recipe ingredients connected directly by upload_id.
    This covers both structures currently used by your app.
  */
  const {
    data: deletedIngredientsByUpload,
    error: ingredientsByUploadError,
  } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("upload_id", uploadId)
    .select("id");

  if (ingredientsByUploadError) {
    const message = String(
      ingredientsByUploadError.message || ""
    ).toLowerCase();

    // Only ignore this if recipe_ingredients has no upload_id column.
    if (
      !message.includes("upload_id") &&
      !message.includes("column") &&
      !message.includes("schema cache")
    ) {
      throw new Error(
        `Recipe ingredients upload delete failed: ${ingredientsByUploadError.message}`
      );
    }

    console.warn(
      "recipe_ingredients upload_id delete skipped:",
      ingredientsByUploadError.message
    );
  }

  const {
    data: deletedRecipes,
    error: recipesDeleteError,
  } = await supabase
    .from("recipes")
    .delete()
    .eq("upload_id", uploadId)
    .eq("user_id", ownerId)
    .select("id");

  if (recipesDeleteError) {
    throw new Error(
      `Recipes delete failed: ${recipesDeleteError.message}`
    );
  }

console.log("DELETE API RECIPE COMPLETE:", {
  deletedUsageRules: deletedUsageRules.length,
  deletedIngredients:
    deletedIngredientsByUpload?.length || 0,
  deletedRecipes:
    deletedRecipes?.length || 0,
});

return {
  deletedUsageRules:
    deletedUsageRules.length,

  deletedIngredients:
    deletedIngredientsByUpload?.length || 0,

  deletedRecipes:
    deletedRecipes?.length || 0,
};
}
/*
  ==========================================
  INVOICE DELETE
  ==========================================
*/
async function deleteInvoiceData(
  uploadId,
  ownerId
) {
  const {
    data: invoiceRows,
    error: invoiceLookupError,
  } = await supabase
    .from("invoice_uploads")
    .select("id, upload_id, file_name, user_id")
    .eq("upload_id", uploadId)
    .eq("user_id", ownerId);

  if (invoiceLookupError) {
    throw invoiceLookupError;
  }

  const invoiceIds = (invoiceRows || [])
    .map((row) => row.id)
    .filter(Boolean);

  const {
    data: deletedLinesByUpload,
    error: lineByUploadError,
  } = await supabase
    .from("invoice_line_items")
    .delete()
    .eq("upload_id", uploadId)
    .eq("user_id", ownerId)
    .select("id");

  if (lineByUploadError) {
    throw lineByUploadError;
  }

  let deletedLinesByInvoice = [];

  if (invoiceIds.length > 0) {
    const {
      data,
      error: lineByInvoiceError,
    } = await supabase
      .from("invoice_line_items")
      .delete()
      .in("invoice_id", invoiceIds)
      .eq("user_id", ownerId)
      .select("id");

    if (lineByInvoiceError) {
      throw lineByInvoiceError;
    }

    deletedLinesByInvoice = data || [];
  }

  const {
    data: deletedInvoiceUploads,
    error: invoiceDeleteError,
  } = await supabase
    .from("invoice_uploads")
    .delete()
    .eq("upload_id", uploadId)
    .eq("user_id", ownerId)
    .select("id");

  if (invoiceDeleteError) {
    throw invoiceDeleteError;
  }

  return {
    deletedInvoiceUploads:
      deletedInvoiceUploads?.length || 0,
    deletedLineItems:
      (deletedLinesByUpload?.length || 0) +
      (deletedLinesByInvoice?.length || 0),
  };
}

/*
  ==========================================
  LABOR DELETE BY FILE
  ==========================================
*/
async function deleteLaborByFileName({
  fileName,
  ownerId,
}) {
  const cleanFileName = String(
    fileName || ""
  ).trim();

  if (!cleanFileName || !ownerId) {
    return {
      matched: false,
      deletedCount: 0,
      ids: [],
      fileName: cleanFileName,
    };
  }

  console.log(
    "DELETE API LABOR FILE LOOKUP:",
    {
      ownerId,
      fileName: cleanFileName,
    }
  );

  const {
    data: matchingRows,
    error: lookupError,
  } = await supabase
    .from("labor_uploads")
    .select("id, user_id, file_name")
    .eq("user_id", ownerId)
    .ilike("file_name", cleanFileName);

  if (lookupError) {
    throw lookupError;
  }

  if (!matchingRows?.length) {
    console.log(
      "DELETE API NO LABOR FILE MATCH:",
      cleanFileName
    );

    return {
      matched: false,
      deletedCount: 0,
      ids: [],
      fileName: cleanFileName,
    };
  }

  const laborIds = matchingRows
    .map((row) => row.id)
    .filter(Boolean);

  const {
    data: deletedRows,
    error: laborDeleteError,
  } = await supabase
    .from("labor_uploads")
    .delete()
    .eq("user_id", ownerId)
    .in("id", laborIds)
    .select("id, file_name");

  if (laborDeleteError) {
    throw laborDeleteError;
  }

  console.log(
    "DELETE API LABOR ROWS DELETED:",
    deletedRows
  );

  return {
    matched: true,
    deletedCount: deletedRows?.length || 0,
    ids: (deletedRows || []).map(
      (row) => row.id
    ),
    fileName: cleanFileName,
  };
}

/*
  ==========================================
  LABOR DELETE BY LABOR ROW ID
  ==========================================
*/
async function deleteLaborById({
  laborId,
  ownerId,
}) {
  if (
    !laborId ||
    !ownerId ||
    !UUID_REGEX.test(String(laborId))
  ) {
    return null;
  }

  const {
    data: deletedRows,
    error,
  } = await supabase
    .from("labor_uploads")
    .delete()
    .eq("id", laborId)
    .eq("user_id", ownerId)
    .select("id, file_name");

  if (error) {
    throw error;
  }

  if (!deletedRows?.length) {
    return null;
  }

  return {
    deletedCount: deletedRows.length,
    ids: deletedRows.map((row) => row.id),
    fileName:
      deletedRows[0]?.file_name || null,
  };
}

/*
  ==========================================
  MAIN DELETE ROUTE
  ==========================================
*/
export async function POST(req) {
  try {
    const authenticatedUser =
      await getAuthenticatedUser(req);

    const body = await req.json();

    const rawId =
      body?.uploadId ||
      body?.id ||
      null;

    const requestedFileName = String(
      body?.fileName ||
        body?.laborFileName ||
        ""
    ).trim();

    const requestedUploadType = String(
      body?.uploadType || ""
    )
      .trim()
      .toLowerCase();

    if (!rawId) {
      return NextResponse.json(
        {
          success: false,
          error: "Upload id is required.",
        },
        { status: 400 }
      );
    }

    const id = String(rawId).trim();

    const ownerId =
      body?.dataOwnerId ||
      authenticatedUser.id;

    console.log(
      "DELETE CLIENT UPLOAD API START:",
      {
        id,
        ownerId,
        requestedFileName,
        requestedUploadType,
      }
    );

    /*
      ========================================
      SYNTHETIC LABOR FILE ID
      ========================================
    */
    if (id.startsWith("labor-file-")) {
      let laborFileName = requestedFileName;

      if (!laborFileName) {
        const laborFileKey = id.replace(
          "labor-file-",
          ""
        );

        laborFileName =
          laborFileKey.split("-2026-")[0] ||
          laborFileKey;
      }

      const laborResult =
        await deleteLaborByFileName({
          fileName: laborFileName,
          ownerId,
        });

      if (!laborResult.deletedCount) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No matching labor rows were found for that file.",
            searchedFileName: laborFileName,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        deletedFrom: "labor_uploads",
        deletedUploadId: id,
        deletedFileName:
          laborResult.fileName,
        deletedCount:
          laborResult.deletedCount,
        deletedLaborIds:
          laborResult.ids,
      });
    }

    /*
      ========================================
      SYNTHETIC LABOR ROW ID
      ========================================
    */
    if (
      id.startsWith("labor-") &&
      !id.startsWith("labor-file-")
    ) {
      const laborId = id.replace(
        "labor-",
        ""
      );

      const laborResult =
        await deleteLaborById({
          laborId,
          ownerId,
        });

      if (!laborResult) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No matching labor upload was found.",
            searchedLaborId: laborId,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        deletedFrom: "labor_uploads",
        deletedUploadId: laborId,
        deletedCount:
          laborResult.deletedCount,
        deletedLaborIds:
          laborResult.ids,
      });
    }

    /*
      ========================================
      NORMAL UPLOAD UUID LOOKUP
      ========================================
    */
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No matching upload was found to delete.",
          searchedId: id,
        },
        { status: 404 }
      );
    }

    const {
      data: uploadRow,
      error: uploadLookupError,
    } = await supabase
      .from("uploads")
      .select(
        "id, user_id, upload_type, source_name, file_name, created_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (uploadLookupError) {
      throw uploadLookupError;
    }

    /*
      Do not allow a normal user to delete another
      user's upload.
    */
    if (
      uploadRow?.user_id &&
      uploadRow.user_id !== ownerId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to delete this upload.",
        },
        { status: 403 }
      );
    }

    if (uploadRow?.id) {
      const uploadType = String(
        uploadRow.upload_type ||
          uploadRow.source_name ||
          requestedUploadType ||
          ""
      )
        .trim()
        .toLowerCase();

      const resolvedFileName = String(
        uploadRow.file_name ||
          requestedFileName ||
          ""
      ).trim();

      const isLaborUpload = [
        "labor",
        "labor_upload",
        "labor_uploads",
      ].includes(uploadType);

      const isInvoiceUpload = [
        "invoice",
        "invoices",
        "invoice_upload",
        "invoice_uploads",
      ].includes(uploadType);
const isRecipeUpload = [
  "recipe",
  "recipes",
  "recipe_upload",
  "recipe_uploads",
].includes(uploadType);
      let laborResult = null;
let invoiceResult = null;
let recipeResult = null;

      /*
        Delete labor_uploads rows BEFORE deleting
        the uploads tracking record.
      */
      if (isLaborUpload) {
        console.log(
          "DELETE API NORMAL LABOR UPLOAD:",
          {
            uploadId: uploadRow.id,
            fileName: resolvedFileName,
            ownerId,
          }
        );

        if (!resolvedFileName) {
          throw new Error(
            "The labor upload does not contain a file name."
          );
        }

        laborResult =
          await deleteLaborByFileName({
            fileName: resolvedFileName,
            ownerId,
          });

        if (!laborResult.deletedCount) {
          throw new Error(
            `No labor rows matched the file "${resolvedFileName}".`
          );
        }
      }

    if (isInvoiceUpload) {
  invoiceResult =
    await deleteInvoiceData(
      uploadRow.id,
      ownerId
    );
}

      const childDeleteResults =
        await safeDeleteByUploadId(
          uploadRow.id,
          ownerId
        );

      const {
        data: deletedUploadRows,
        error: uploadDeleteError,
      } = await supabase
        .from("uploads")
        .delete()
        .eq("id", uploadRow.id)
        .eq("user_id", ownerId)
        .select("id");

      if (uploadDeleteError) {
        throw uploadDeleteError;
      }

      if (!deletedUploadRows?.length) {
        throw new Error(
          "The upload tracking row was not permanently deleted."
        );
      }

      console.log(
        "PERMANENTLY DELETED UPLOAD ROW:",
        deletedUploadRows
      );

      return NextResponse.json({
        success: true,
      deletedFrom: isLaborUpload
  ? "labor_uploads_and_uploads"
  : isInvoiceUpload
    ? "invoice_tables_and_uploads"
    : isRecipeUpload
      ? "recipe_tables_and_uploads"
      : "uploads",
        deletedUploadId: uploadRow.id,
        deletedFileName:
          resolvedFileName || null,
        deletedLaborCount:
          laborResult?.deletedCount || 0,
        deletedLaborIds:
          laborResult?.ids || [],
        deletedInvoiceData:
          invoiceResult,
        childDeleteResults,
        deletedRecipeData:
  recipeResult,
      });
    }

    /*
      ========================================
      FALLBACK: OLD LABOR ROW BY UUID
      ========================================
    */
    const fallbackLaborResult =
      await deleteLaborById({
        laborId: id,
        ownerId,
      });

    if (fallbackLaborResult) {
      return NextResponse.json({
        success: true,
        deletedFrom: "labor_uploads",
        deletedUploadId: id,
        deletedCount:
          fallbackLaborResult.deletedCount,
        deletedLaborIds:
          fallbackLaborResult.ids,
      });
    }

    /*
      ========================================
      FALLBACK: OLD CLIENT DATA ROW
      ========================================
    */
    const {
      data: clientRow,
      error: clientLookupError,
    } = await supabase
      .from("client_data_uploads")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (clientLookupError) {
      throw clientLookupError;
    }

    if (clientRow?.id) {
      if (
        clientRow.user_id &&
        clientRow.user_id !== ownerId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You do not have permission to delete this upload.",
          },
          { status: 403 }
        );
      }

      const {
        data: deletedClientRows,
        error: clientDataDeleteError,
      } = await supabase
        .from("client_data_uploads")
        .delete()
        .eq("id", id)
        .eq("user_id", ownerId)
        .select("id");

      if (clientDataDeleteError) {
        throw clientDataDeleteError;
      }

      if (!deletedClientRows?.length) {
        throw new Error(
          "The client upload was not permanently deleted."
        );
      }

      return NextResponse.json({
        success: true,
        deletedFrom:
          "client_data_uploads",
        deletedUploadId: id,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "No matching upload was found to delete.",
        searchedId: id,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error(
      "DELETE CLIENT UPLOAD ROUTE FAILED:",
      error
    );

    const status =
      String(error?.message || "")
        .toLowerCase()
        .includes("authentication") ||
      String(error?.message || "")
        .toLowerCase()
        .includes("session")
        ? 401
        : 500;

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Something went wrong.",
      },
      { status }
    );
  }
}