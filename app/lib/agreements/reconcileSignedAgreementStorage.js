const SIGNED_AGREEMENTS_BUCKET = "serven-signed-agreements";

/**
 * Read-only inspection of a signed agreement PDF.
 *
 * This function never uploads, modifies, or deletes
 * any Storage object or database record.
 */
export async function inspectSignedAgreementStorageObject(
  supabaseAdmin,
  pdfPath
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is required.");
  }

  if (
    typeof pdfPath !== "string" ||
    !pdfPath.trim() ||
    pdfPath.startsWith("/") ||
    pdfPath.includes("..") ||
    pdfPath.length > 1000
  ) {
    throw new Error("Invalid signed agreement PDF path.");
  }

  // Find database evidence referencing this exact PDF path.
  const { data, error } = await supabaseAdmin
    .from("client_agreement_signature_evidence")
    .select(
      "id, agreement_id, pdf_archive_status, signed_pdf_path, signed_pdf_hash, pdf_archive_claim_id, pdf_archive_lease_expires_at"
    )
    .eq("signed_pdf_path", pdfPath)
    .limit(2);

  if (error) {
    throw new Error("Unable to inspect signed PDF database references.");
  }

  const references = data || [];

  return {
    bucket: SIGNED_AGREEMENTS_BUCKET,
    pdfPath,
    referenceCount: references.length,
    status:
      references.length === 0
        ? "unreferenced"
        : references.length > 1
          ? "multiple_references"
          : references[0].pdf_archive_status === "completed"
            ? "completed_reference"
            : "incomplete_reference",
    references,
    safeToDelete: false,
  };
}
/**
 * Read-only verification that a specific signed PDF
 * exists in private Supabase Storage.
 *
 * Does not modify or delete any file.
 */
export async function checkSignedAgreementPdfExists(
  supabaseAdmin,
  pdfPath
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is required.");
  }

  if (
    typeof pdfPath !== "string" ||
    !pdfPath.trim() ||
    !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/i.test(pdfPath) ||
    pdfPath.length > 1000
  ) {
    throw new Error("Invalid signed agreement PDF path.");
  }

  const { data, error } = await supabaseAdmin.storage
    .from("serven-signed-agreements")
    .info(pdfPath);

  if (error) {
    // A missing object is different from a permissions
    // or network error. Never treat every error as missing.
    const status = Number(error.status || error.statusCode);

    if (status === 404) {
      return {
        pdfPath,
        exists: false,
      };
    }

    throw new Error(
      "Unable to verify signed agreement PDF Storage existence."
    );
  }

  return {
    pdfPath,
    exists: Boolean(data),
  };
}
/**
 * Read-only listing of one directory in the
 * private signed agreements Storage bucket.
 *
 * This function does not modify or delete files.
 */
export async function listSignedAgreementStorageFolder(
  supabaseAdmin,
  folderPath = "",
  limit = 100,
  offset = 0
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is required.");
  }

  if (
    typeof folderPath !== "string" ||
    folderPath.startsWith("/") ||
    folderPath.includes("..") ||
    folderPath.length > 1000
  ) {
    throw new Error("Invalid Storage folder path.");
  }

  const safeLimit = Math.min(
    Math.max(Math.trunc(Number(limit) || 100), 1),
    100
  );

  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid Storage listing offset.");
  }

  const { data, error } = await supabaseAdmin.storage
    .from(SIGNED_AGREEMENTS_BUCKET)
    .list(folderPath, {
      limit: safeLimit,
      offset,
      sortBy: {
        column: "name",
        order: "asc",
      },
    });

  if (error) {
    throw new Error(
      "Unable to list signed agreement Storage folder."
    );
  }

  return {
    folderPath,
    entries: data || [],
    count: (data || []).length,
    hasMore: (data || []).length === safeLimit,
  };
}
/**
 * Discover signed PDFs in the private Storage bucket.
 *
 * Read-only. Never modifies or deletes Storage objects.
 * Fails closed if a folder cannot be fully inspected.
 */
export async function discoverSignedAgreementPdfs(
  supabaseAdmin,
  maxFolders = 1000
) {
  if (
    !Number.isInteger(maxFolders) ||
    maxFolders < 1 ||
    maxFolders > 1000
  ) {
    throw new Error("Invalid Storage discovery folder limit.");
  }

  const pendingFolders = [""];
  const visitedFolders = new Set();
  const pdfPaths = [];

  while (pendingFolders.length > 0) {
    if (visitedFolders.size >= maxFolders) {
      throw new Error("Storage discovery folder limit exceeded.");
    }

    const folderPath = pendingFolders.shift();

    if (visitedFolders.has(folderPath)) {
      continue;
    }

    visitedFolders.add(folderPath);

    let offset = 0;

    while (true) {
      const listing = await listSignedAgreementStorageFolder(
        supabaseAdmin,
        folderPath,
        100,
        offset
      );

      for (const entry of listing.entries) {
        const name = entry?.name;

        if (
          typeof name !== "string" ||
          !name ||
          name === "." ||
          name === ".." ||
          name.includes("/")
        ) {
          throw new Error("Invalid Storage listing entry.");
        }

        const fullPath = folderPath
          ? `${folderPath}/${name}`
          : name;

        if (entry.id == null) {
          pendingFolders.push(fullPath);
        } else if (fullPath.toLowerCase().endsWith(".pdf")) {
          pdfPaths.push(fullPath);
        }
      }

      if (!listing.hasMore) {
        break;
      }

      offset += listing.count;
    }
  }

  return {
    pdfPaths,
    pdfCount: pdfPaths.length,
    foldersInspected: visitedFolders.size,
    safeToDelete: false,
  };
}
/**
 * Reconcile discovered signed PDFs against database records.
 *
 * Read-only. Does not delete or modify any files or records.
 */
export async function reconcileDiscoveredSignedAgreementPdfs(
  supabaseAdmin
) {
  const discovery = await discoverSignedAgreementPdfs(
    supabaseAdmin
  );

  const results = [];

  for (const pdfPath of discovery.pdfPaths) {
    const inspection =
      await inspectSignedAgreementStorageObject(
        supabaseAdmin,
        pdfPath
      );

    results.push({
      pdfPath,
      status: inspection.status,
      referenceCount: inspection.referenceCount,
      references: inspection.references,
      safeToDelete: false,
    });
  }

  return {
    totalPdfs: results.length,
    foldersInspected: discovery.foldersInspected,

    completedReferences: results.filter(
      (item) => item.status === "completed_reference"
    ).length,

    incompleteReferences: results.filter(
      (item) => item.status === "incomplete_reference"
    ).length,

    unreferencedPdfs: results.filter(
      (item) => item.status === "unreferenced"
    ).length,

    multipleReferences: results.filter(
      (item) => item.status === "multiple_references"
    ).length,

    results,
    safeToDelete: false,
  };
}
/**
 * Verify completed database PDF archives against Storage.
 *
 * Read-only. Never modifies agreements or deletes PDFs.
 */
export async function verifySignedAgreementPdfIntegrity(
  supabaseAdmin,
  pdfPath,
  expectedHash
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is required.");
  }

  const validPdfPath =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i.test(
      pdfPath
    );

  if (!validPdfPath) {
    throw new Error("Invalid signed agreement PDF path.");
  }

  if (
    typeof expectedHash !== "string" ||
    !/^[0-9a-f]{64}$/i.test(expectedHash)
  ) {
    return {
      pdfPath,
      status: "invalid_recorded_hash",
      integrityVerified: false,
      investigationRequired: true,
    };
  }

  const { data, error } = await supabaseAdmin.storage
    .from("serven-signed-agreements")
    .download(pdfPath);

  if (error || !data) {
    return {
      pdfPath,
      status: "download_error",
      integrityVerified: false,
      investigationRequired: true,
    };
  }

  const { createHash } = await import("node:crypto");

  const pdfBytes = Buffer.from(
    await data.arrayBuffer()
  );

  const actualHash = createHash("sha256")
    .update(pdfBytes)
    .digest("hex");

  const hashesMatch =
    actualHash.toLowerCase() === expectedHash.toLowerCase();

  return {
    pdfPath,
    status: hashesMatch
      ? "integrity_verified"
      : "hash_mismatch",
    integrityVerified: hashesMatch,
    investigationRequired: !hashesMatch,
  };
}
export async function verifyCompletedSignedAgreementPdfs(
  supabaseAdmin
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is required.");
  }

  const pageSize = 100;
  const results = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("client_agreement_signature_evidence")
      .select("id, agreement_id, signed_pdf_path, signed_pdf_hash, pdf_archive_status")
      .eq("pdf_archive_status", "completed")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(
        "Unable to load completed signed PDF archive records."
      );
    }

    const records = data || [];

    for (const record of records) {
      if (!record.signed_pdf_path) {
        results.push({
          evidenceId: record.id,
          agreementId: record.agreement_id,
          pdfPath: null,
          status: "missing_pdf_path",
          investigationRequired: true,
        });

        continue;
      }

      try {
        const storageCheck =
          await checkSignedAgreementPdfExists(
            supabaseAdmin,
            record.signed_pdf_path
          );

        results.push({
          evidenceId: record.id,
          agreementId: record.agreement_id,
          pdfPath: record.signed_pdf_path,
          status: storageCheck.exists
            ? "storage_verified"
            : "missing_storage_pdf",
          investigationRequired: !storageCheck.exists,
        });
      } catch {
        results.push({
          evidenceId: record.id,
          agreementId: record.agreement_id,
          pdfPath: record.signed_pdf_path,
          status: "verification_error",
          investigationRequired: true,
        });
      }
    }

    if (records.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return {
    totalCompletedRecords: results.length,
    storageVerified: results.filter(
      (item) => item.status === "storage_verified"
    ).length,
    missingStoragePdfs: results.filter(
      (item) => item.status === "missing_storage_pdf"
    ).length,
    missingPdfPaths: results.filter(
      (item) => item.status === "missing_pdf_path"
    ).length,
    verificationErrors: results.filter(
      (item) => item.status === "verification_error"
    ).length,
    results,
    safeToDelete: false,
  };
}