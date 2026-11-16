import {
  inspectSignedAgreementStorageObject,
  checkSignedAgreementPdfExists,
  listSignedAgreementStorageFolder,
  discoverSignedAgreementPdfs,
    reconcileDiscoveredSignedAgreementPdfs,
      verifyCompletedSignedAgreementPdfs,
} from "./reconcileSignedAgreementStorage.js";

const pdfPath =
  "00000000-0000-4000-8000-000000000001/" +
  "00000000-0000-4000-8000-000000000002/" +
  "00000000-0000-4000-8000-000000000003.pdf";

const mockState = {
  storageExists: true,
  storageServiceError: false,
  databaseReferences: [],
  completedArchiveRecords: [],
  databasePageError: false,
};

const mockSupabase = {
  from: (tableName) => {
    if (tableName !== "client_agreement_signature_evidence") {
      throw new Error("Unexpected database table.");
    }

   return {
  select: () => ({
    eq: (column, value) => {
      if (
        column === "signed_pdf_path" &&
        value === pdfPath
      ) {
        return {
          limit: async () => ({
            data: mockState.databaseReferences,
            error: null,
          }),
        };
      }

      if (
        column === "pdf_archive_status" &&
        value === "completed"
      ) {
        return {
          order: (orderColumn, options) => {
            if (
              orderColumn !== "id" ||
              options.ascending !== true
            ) {
              throw new Error(
                "Unexpected completed archive ordering."
              );
            }

            return {
            range: async (start, end) => {
  if (mockState.databasePageError && start >= 100) {
    return {
      data: null,
      error: {
        message: "Synthetic database pagination failure",
      },
    };
  }

  return {
    data: mockState.completedArchiveRecords.slice(
      start,
      end + 1
    ),
    error: null,
  };
},
            };
          },
        };
      }

      throw new Error("Unexpected database filter.");
    },
  }),
};
  },

  storage: {
    from: (bucketName) => {
      if (bucketName !== "serven-signed-agreements") {
        throw new Error("Unexpected Storage bucket.");
      }

      return {
  list: async (folderPath, options) => {
  if (options.limit !== 100 || options.offset !== 0) {
    throw new Error("Unexpected listing options.");
  }

  const agreementId =
    "00000000-0000-4000-8000-000000000001";

  const evidenceId =
    "00000000-0000-4000-8000-000000000002";

  const pdfName =
    "00000000-0000-4000-8000-000000000003.pdf";

  let entries;

  if (folderPath === "") {
    entries = [
      { name: agreementId, id: null, metadata: null },
    ];
  } else if (folderPath === agreementId) {
    entries = [
      { name: evidenceId, id: null, metadata: null },
    ];
  } else if (folderPath === `${agreementId}/${evidenceId}`) {
    entries = [
      { name: pdfName, id: "synthetic-file-id", metadata: {} },
    ];
  } else {
    throw new Error("Unexpected Storage folder.");
  }

  return {
    data: entries,
    error: null,
  };
},

  info: async (path) => {
    if (path !== pdfPath) {
      throw new Error("Unexpected PDF path.");
    }
if (mockState.storageServiceError) {
  return {
    data: null,
    error: {
      status: 503,
      message: "Synthetic Storage service unavailable",
    },
  };
}
    if (!mockState.storageExists) {
      return {
        data: null,
        error: { status: 404 },
      };
    }

    return {
      data: {
        name: path.split("/").pop(),
      },
      error: null,
    };
  },
};
    },
  },
};

console.log("SYNTHETIC RECONCILIATION TEST READY");
const inspection = await inspectSignedAgreementStorageObject(
  mockSupabase,
  pdfPath
);

const storageCheck = await checkSignedAgreementPdfExists(
  mockSupabase,
  pdfPath
);

if (inspection.status !== "unreferenced") {
  throw new Error("TEST FAILED: PDF should be unreferenced.");
}

if (inspection.referenceCount !== 0) {
  throw new Error("TEST FAILED: Unexpected database reference.");
}

if (storageCheck.exists !== true) {
  throw new Error("TEST FAILED: PDF should exist in Storage.");
}

if (inspection.safeToDelete !== false) {
  throw new Error("TEST FAILED: PDF was incorrectly marked safe to delete.");
}

console.log("UNREFERENCED PDF DETECTION PASSED");
console.log("DATABASE REFERENCES:", inspection.referenceCount);
console.log("STORAGE EXISTS:", storageCheck.exists);
console.log("RECONCILIATION STATUS:", inspection.status);
console.log("SAFE TO DELETE:", inspection.safeToDelete);
// TEST 2: Completed PDF archive reference.

mockState.databaseReferences = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    agreement_id: "00000000-0000-4000-8000-000000000001",
    pdf_archive_status: "completed",
    signed_pdf_path: pdfPath,
    signed_pdf_hash: "a".repeat(64),
    pdf_archive_claim_id: null,
    pdf_archive_lease_expires_at: null,
  },
];

const completedInspection =
  await inspectSignedAgreementStorageObject(
    mockSupabase,
    pdfPath
  );

const completedStorageCheck =
  await checkSignedAgreementPdfExists(
    mockSupabase,
    pdfPath
  );

if (completedInspection.status !== "completed_reference") {
  throw new Error(
    "TEST FAILED: Completed archive was not recognized."
  );
}

if (completedInspection.referenceCount !== 1) {
  throw new Error(
    "TEST FAILED: Expected exactly one database reference."
  );
}

if (completedStorageCheck.exists !== true) {
  throw new Error(
    "TEST FAILED: Completed PDF is missing from mock Storage."
  );
}

if (completedInspection.safeToDelete !== false) {
  throw new Error(
    "TEST FAILED: Completed PDF was marked safe to delete."
  );
}

console.log("COMPLETED PDF REFERENCE TEST PASSED");
console.log("DATABASE REFERENCES:", completedInspection.referenceCount);
console.log("STORAGE EXISTS:", completedStorageCheck.exists);
console.log("RECONCILIATION STATUS:", completedInspection.status);
console.log("SAFE TO DELETE:", completedInspection.safeToDelete);
// TEST 3: Completed database reference, missing Storage PDF.

mockState.storageExists = false;

const missingInspection =
  await inspectSignedAgreementStorageObject(
    mockSupabase,
    pdfPath
  );

const missingStorageCheck =
  await checkSignedAgreementPdfExists(
    mockSupabase,
    pdfPath
  );

if (missingInspection.status !== "completed_reference") {
  throw new Error(
    "TEST FAILED: Completed database reference was not recognized."
  );
}

if (missingStorageCheck.exists !== false) {
  throw new Error(
    "TEST FAILED: Missing Storage PDF was not detected."
  );
}

if (missingInspection.safeToDelete !== false) {
  throw new Error(
    "TEST FAILED: Missing PDF was incorrectly marked safe to delete."
  );
}

console.log("MISSING ARCHIVED PDF TEST PASSED");
console.log("DATABASE STATUS:", missingInspection.status);
console.log("STORAGE EXISTS:", missingStorageCheck.exists);
console.log("INVESTIGATION REQUIRED: YES");
// TEST 4: Incomplete archive with an existing Storage PDF.

mockState.storageExists = true;

mockState.databaseReferences = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    agreement_id: "00000000-0000-4000-8000-000000000001",
    pdf_archive_status: "failed",
    signed_pdf_path: pdfPath,
    signed_pdf_hash: null,
    pdf_archive_claim_id: null,
    pdf_archive_lease_expires_at: null,
  },
];

const incompleteInspection =
  await inspectSignedAgreementStorageObject(
    mockSupabase,
    pdfPath
  );

const incompleteStorageCheck =
  await checkSignedAgreementPdfExists(
    mockSupabase,
    pdfPath
  );

if (incompleteInspection.status !== "incomplete_reference") {
  throw new Error(
    "TEST FAILED: Incomplete archive was not recognized."
  );
}

if (incompleteInspection.referenceCount !== 1) {
  throw new Error(
    "TEST FAILED: Expected one incomplete database reference."
  );
}

if (incompleteStorageCheck.exists !== true) {
  throw new Error(
    "TEST FAILED: Existing PDF was not detected."
  );
}

if (incompleteInspection.safeToDelete !== false) {
  throw new Error(
    "TEST FAILED: Incomplete PDF was marked safe to delete."
  );
}

console.log("INCOMPLETE ARCHIVE REFERENCE TEST PASSED");
console.log("DATABASE STATUS:", incompleteInspection.status);
console.log("STORAGE EXISTS:", incompleteStorageCheck.exists);
console.log("SAFE TO DELETE:", incompleteInspection.safeToDelete);

// TEST 5: Discover an agreement folder in Storage.

const folderListing = await listSignedAgreementStorageFolder(
  mockSupabase,
  "",
  100,
  0
);

if (folderListing.count !== 1) {
  throw new Error(
    "TEST FAILED: Expected exactly one Storage folder."
  );
}

if (
  folderListing.entries[0]?.name !==
  "00000000-0000-4000-8000-000000000001"
) {
  throw new Error(
    "TEST FAILED: Agreement folder was not discovered."
  );
}

if (folderListing.entries[0]?.id !== null) {
  throw new Error(
    "TEST FAILED: Expected a folder, not a file."
  );
}

console.log("STORAGE FOLDER DISCOVERY TEST PASSED");
console.log("FOLDERS FOUND:", folderListing.count);
console.log("FOLDER NAME:", folderListing.entries[0].name);
// TEST 6: Discover a PDF inside nested Storage folders.

const discovery = await discoverSignedAgreementPdfs(
  mockSupabase
);

if (discovery.pdfCount !== 1) {
  throw new Error(
    "TEST FAILED: Expected exactly one discovered PDF."
  );
}

if (discovery.pdfPaths[0] !== pdfPath) {
  throw new Error(
    "TEST FAILED: Discovered PDF path does not match."
  );
}

if (discovery.foldersInspected !== 3) {
  throw new Error(
    "TEST FAILED: Expected three inspected folders."
  );
}

if (discovery.safeToDelete !== false) {
  throw new Error(
    "TEST FAILED: PDF was incorrectly marked safe to delete."
  );
}

console.log("NESTED PDF DISCOVERY TEST PASSED");
console.log("PDF FILES FOUND:", discovery.pdfCount);
console.log("FOLDERS INSPECTED:", discovery.foldersInspected);
console.log("DISCOVERED PDF:", discovery.pdfPaths[0]);
console.log("SAFE TO DELETE:", discovery.safeToDelete);
// TEST 7: Reconcile a discovered PDF with a completed database record.

mockState.databaseReferences = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    agreement_id: "00000000-0000-4000-8000-000000000001",
    pdf_archive_status: "completed",
    signed_pdf_path: pdfPath,
    signed_pdf_hash: "a".repeat(64),
    pdf_archive_claim_id: null,
    pdf_archive_lease_expires_at: null,
  },
];

const reconciliation =
  await reconcileDiscoveredSignedAgreementPdfs(mockSupabase);

if (
  reconciliation.totalPdfs !== 1 ||
  reconciliation.completedReferences !== 1 ||
  reconciliation.incompleteReferences !== 0 ||
  reconciliation.unreferencedPdfs !== 0 ||
  reconciliation.multipleReferences !== 0 ||
  reconciliation.results[0]?.pdfPath !== pdfPath ||
  reconciliation.results[0]?.status !== "completed_reference" ||
  reconciliation.safeToDelete !== false
) {
  throw new Error(
    "TEST FAILED: Completed PDF reconciliation incorrect."
  );
}

console.log("PDF DATABASE RECONCILIATION TEST PASSED");
console.log("TOTAL PDFS:", reconciliation.totalPdfs);
console.log(
  "COMPLETED REFERENCES:",
  reconciliation.completedReferences
);
console.log(
  "UNREFERENCED PDFS:",
  reconciliation.unreferencedPdfs
);
console.log("SAFE TO DELETE:", reconciliation.safeToDelete);
// TEST 8: Detect an unreferenced PDF in Storage.

mockState.databaseReferences = [];

const unreferencedReconciliation =
  await reconcileDiscoveredSignedAgreementPdfs(
    mockSupabase
  );

if (
  unreferencedReconciliation.totalPdfs !== 1 ||
  unreferencedReconciliation.completedReferences !== 0 ||
  unreferencedReconciliation.unreferencedPdfs !== 1 ||
  unreferencedReconciliation.results[0]?.status !==
    "unreferenced" ||
  unreferencedReconciliation.results[0]?.referenceCount !== 0 ||
  unreferencedReconciliation.results[0]?.safeToDelete !== false ||
  unreferencedReconciliation.safeToDelete !== false
) {
  throw new Error(
    "TEST FAILED: Unreferenced PDF reconciliation incorrect."
  );
}

console.log("UNREFERENCED PDF RECONCILIATION TEST PASSED");
console.log(
  "TOTAL PDFS:",
  unreferencedReconciliation.totalPdfs
);
console.log(
  "UNREFERENCED PDFS:",
  unreferencedReconciliation.unreferencedPdfs
);
console.log(
  "RECONCILIATION STATUS:",
  unreferencedReconciliation.results[0].status
);
console.log(
  "SAFE TO DELETE:",
  unreferencedReconciliation.safeToDelete
);
// TEST 9: Detect multiple database references to one PDF.

mockState.databaseReferences = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    agreement_id: "00000000-0000-4000-8000-000000000001",
    pdf_archive_status: "completed",
    signed_pdf_path: pdfPath,
    signed_pdf_hash: "a".repeat(64),
    pdf_archive_claim_id: null,
    pdf_archive_lease_expires_at: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    agreement_id: "00000000-0000-4000-8000-000000000001",
    pdf_archive_status: "completed",
    signed_pdf_path: pdfPath,
    signed_pdf_hash: "b".repeat(64),
    pdf_archive_claim_id: null,
    pdf_archive_lease_expires_at: null,
  },
];

const duplicateReconciliation =
  await reconcileDiscoveredSignedAgreementPdfs(
    mockSupabase
  );

if (
  duplicateReconciliation.totalPdfs !== 1 ||
  duplicateReconciliation.multipleReferences !== 1 ||
  duplicateReconciliation.completedReferences !== 0 ||
  duplicateReconciliation.results[0]?.status !==
    "multiple_references" ||
  duplicateReconciliation.results[0]?.referenceCount !== 2 ||
  duplicateReconciliation.results[0]?.safeToDelete !== false ||
  duplicateReconciliation.safeToDelete !== false
) {
  throw new Error(
    "TEST FAILED: Multiple PDF references not detected."
  );
}

console.log("MULTIPLE PDF REFERENCES TEST PASSED");
console.log(
  "TOTAL PDFS:",
  duplicateReconciliation.totalPdfs
);
console.log(
  "MULTIPLE REFERENCES:",
  duplicateReconciliation.multipleReferences
);
console.log(
  "DATABASE REFERENCE COUNT:",
  duplicateReconciliation.results[0].referenceCount
);
console.log(
  "RECONCILIATION STATUS:",
  duplicateReconciliation.results[0].status
);
console.log(
  "SAFE TO DELETE:",
  duplicateReconciliation.safeToDelete
);
// TEST 10: Detect a completed archive with a missing Storage PDF.

mockState.storageExists = false;

mockState.completedArchiveRecords = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    agreement_id: "00000000-0000-4000-8000-000000000001",
    signed_pdf_path: pdfPath,
    signed_pdf_hash: "a".repeat(64),
    pdf_archive_status: "completed",
  },
];

const missingPdfVerification =
  await verifyCompletedSignedAgreementPdfs(
    mockSupabase
  );

if (
  missingPdfVerification.totalCompletedRecords !== 1 ||
  missingPdfVerification.storageVerified !== 0 ||
  missingPdfVerification.missingStoragePdfs !== 1 ||
  missingPdfVerification.missingPdfPaths !== 0 ||
  missingPdfVerification.verificationErrors !== 0 ||
  missingPdfVerification.results[0]?.status !==
    "missing_storage_pdf" ||
  missingPdfVerification.results[0]?.investigationRequired !== true ||
  missingPdfVerification.safeToDelete !== false
) {
  throw new Error(
    "TEST FAILED: Missing archived PDF was not detected."
  );
}

console.log("MISSING COMPLETED ARCHIVE PDF TEST PASSED");
console.log(
  "COMPLETED RECORDS:",
  missingPdfVerification.totalCompletedRecords
);
console.log(
  "MISSING STORAGE PDFS:",
  missingPdfVerification.missingStoragePdfs
);
console.log(
  "RECONCILIATION STATUS:",
  missingPdfVerification.results[0].status
);
console.log(
  "INVESTIGATION REQUIRED:",
  missingPdfVerification.results[0].investigationRequired
);
console.log(
  "SAFE TO DELETE:",
  missingPdfVerification.safeToDelete
);
// TEST 11: Verify a completed archive with an existing Storage PDF.

mockState.storageExists = true;

const existingPdfVerification =
  await verifyCompletedSignedAgreementPdfs(
    mockSupabase
  );

if (
  existingPdfVerification.totalCompletedRecords !== 1 ||
  existingPdfVerification.storageVerified !== 1 ||
  existingPdfVerification.missingStoragePdfs !== 0 ||
  existingPdfVerification.missingPdfPaths !== 0 ||
  existingPdfVerification.verificationErrors !== 0 ||
  existingPdfVerification.results[0]?.status !==
    "storage_verified" ||
  existingPdfVerification.results[0]?.investigationRequired !== false ||
  existingPdfVerification.safeToDelete !== false
) {
  throw new Error(
    "TEST FAILED: Existing archived PDF verification incorrect."
  );
}

console.log("EXISTING COMPLETED ARCHIVE PDF TEST PASSED");
console.log(
  "COMPLETED RECORDS:",
  existingPdfVerification.totalCompletedRecords
);
console.log(
  "STORAGE VERIFIED:",
  existingPdfVerification.storageVerified
);
console.log(
  "MISSING STORAGE PDFS:",
  existingPdfVerification.missingStoragePdfs
);
console.log(
  "RECONCILIATION STATUS:",
  existingPdfVerification.results[0].status
);
console.log(
  "INVESTIGATION REQUIRED:",
  existingPdfVerification.results[0].investigationRequired
);
console.log(
  "SAFE TO DELETE:",
  existingPdfVerification.safeToDelete
);
// TEST 12: Detect a completed archive with no PDF path.

mockState.completedArchiveRecords = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    agreement_id: "00000000-0000-4000-8000-000000000001",
    signed_pdf_path: null,
    signed_pdf_hash: "a".repeat(64),
    pdf_archive_status: "completed",
  },
];

const missingPathVerification =
  await verifyCompletedSignedAgreementPdfs(
    mockSupabase
  );

if (
  missingPathVerification.totalCompletedRecords !== 1 ||
  missingPathVerification.storageVerified !== 0 ||
  missingPathVerification.missingStoragePdfs !== 0 ||
  missingPathVerification.missingPdfPaths !== 1 ||
  missingPathVerification.verificationErrors !== 0 ||
  missingPathVerification.results[0]?.status !==
    "missing_pdf_path" ||
  missingPathVerification.results[0]?.investigationRequired !== true ||
  missingPathVerification.safeToDelete !== false
) {
  throw new Error(
    "TEST FAILED: Missing PDF path was not detected."
  );
}

console.log("MISSING COMPLETED ARCHIVE PATH TEST PASSED");
console.log(
  "COMPLETED RECORDS:",
  missingPathVerification.totalCompletedRecords
);
console.log(
  "MISSING PDF PATHS:",
  missingPathVerification.missingPdfPaths
);
console.log(
  "RECONCILIATION STATUS:",
  missingPathVerification.results[0].status
);
console.log(
  "INVESTIGATION REQUIRED:",
  missingPathVerification.results[0].investigationRequired
);
console.log(
  "SAFE TO DELETE:",
  missingPathVerification.safeToDelete
);
// TEST 13: Detect an unexpected Storage verification error.

mockState.completedArchiveRecords = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    agreement_id: "00000000-0000-4000-8000-000000000001",
    signed_pdf_path: "invalid-pdf-path",
    signed_pdf_hash: "a".repeat(64),
    pdf_archive_status: "completed",
  },
];

const errorVerification =
  await verifyCompletedSignedAgreementPdfs(
    mockSupabase
  );

if (
  errorVerification.totalCompletedRecords !== 1 ||
  errorVerification.storageVerified !== 0 ||
  errorVerification.missingStoragePdfs !== 0 ||
  errorVerification.verificationErrors !== 1 ||
  errorVerification.results[0]?.status !==
    "verification_error" ||
  errorVerification.results[0]?.investigationRequired !== true ||
  errorVerification.safeToDelete !== false
) {
  throw new Error(
    "TEST FAILED: Storage verification error not handled safely."
  );
}

console.log("STORAGE VERIFICATION ERROR TEST PASSED");
console.log(
  "COMPLETED RECORDS:",
  errorVerification.totalCompletedRecords
);
console.log(
  "VERIFICATION ERRORS:",
  errorVerification.verificationErrors
);
console.log(
  "RECONCILIATION STATUS:",
  errorVerification.results[0].status
);
console.log(
  "INVESTIGATION REQUIRED:",
  errorVerification.results[0].investigationRequired
);
console.log(
  "SAFE TO DELETE:",
  errorVerification.safeToDelete
);
// TEST 14: Detect a Storage service failure.

mockState.storageServiceError = true;

mockState.completedArchiveRecords = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    agreement_id: "00000000-0000-4000-8000-000000000001",
    signed_pdf_path: pdfPath,
    signed_pdf_hash: "a".repeat(64),
    pdf_archive_status: "completed",
  },
];

const serviceErrorVerification =
  await verifyCompletedSignedAgreementPdfs(mockSupabase);

if (
  serviceErrorVerification.totalCompletedRecords !== 1 ||
  serviceErrorVerification.storageVerified !== 0 ||
  serviceErrorVerification.missingStoragePdfs !== 0 ||
  serviceErrorVerification.verificationErrors !== 1 ||
  serviceErrorVerification.results[0]?.status !==
    "verification_error" ||
  serviceErrorVerification.results[0]?.investigationRequired !== true ||
  serviceErrorVerification.safeToDelete !== false
) {
  throw new Error(
    "TEST FAILED: Storage service failure was not handled safely."
  );
}

mockState.storageServiceError = false;

console.log("STORAGE SERVICE FAILURE TEST PASSED");
console.log(
  "VERIFICATION ERRORS:",
  serviceErrorVerification.verificationErrors
);
console.log(
  "MISSING STORAGE PDFS:",
  serviceErrorVerification.missingStoragePdfs
);
console.log(
  "RECONCILIATION STATUS:",
  serviceErrorVerification.results[0].status
);
console.log(
  "INVESTIGATION REQUIRED:",
  serviceErrorVerification.results[0].investigationRequired
);
console.log(
  "SAFE TO DELETE:",
  serviceErrorVerification.safeToDelete
);
// TEST 15: Verify pagination across more than 100 records.

mockState.storageServiceError = false;
mockState.storageExists = true;

mockState.completedArchiveRecords = Array.from(
  { length: 105 },
  (_, index) => ({
    id: `synthetic-evidence-${index + 1}`,
    agreement_id: "00000000-0000-4000-8000-000000000001",
    signed_pdf_path: pdfPath,
    signed_pdf_hash: "a".repeat(64),
    pdf_archive_status: "completed",
  })
);

const paginationVerification =
  await verifyCompletedSignedAgreementPdfs(
    mockSupabase
  );

if (
  paginationVerification.totalCompletedRecords !== 105 ||
  paginationVerification.storageVerified !== 105 ||
  paginationVerification.missingStoragePdfs !== 0 ||
  paginationVerification.verificationErrors !== 0 ||
  paginationVerification.results.length !== 105 ||
  paginationVerification.safeToDelete !== false
) {
  throw new Error(
    "TEST FAILED: Database pagination verification incorrect."
  );
}

console.log("DATABASE PAGINATION TEST PASSED");
console.log(
  "COMPLETED RECORDS:",
  paginationVerification.totalCompletedRecords
);
console.log(
  "STORAGE VERIFIED:",
  paginationVerification.storageVerified
);
console.log(
  "MISSING STORAGE PDFS:",
  paginationVerification.missingStoragePdfs
);
console.log(
  "SAFE TO DELETE:",
  paginationVerification.safeToDelete
);
// TEST 16: Database pagination must fail safely.

mockState.databasePageError = true;

let paginationErrorDetected = false;

try {
  await verifyCompletedSignedAgreementPdfs(
    mockSupabase
  );
} catch (error) {
  if (
    error.message ===
    "Unable to load completed signed PDF archive records."
  ) {
    paginationErrorDetected = true;
  } else {
    throw error;
  }
} finally {
  mockState.databasePageError = false;
}

if (!paginationErrorDetected) {
  throw new Error(
    "TEST FAILED: Database pagination error was not detected."
  );
}

console.log("DATABASE PAGINATION FAILURE TEST PASSED");
console.log("SECOND PAGE FAILURE DETECTED:", true);
console.log("INCOMPLETE VERIFICATION REJECTED:", true);
// TEST 17: Verify Storage listing pagination.

const paginatedAgreementId =
  "00000000-0000-4000-8000-000000000001";

const paginatedEvidenceId =
  "00000000-0000-4000-8000-000000000002";

const paginatedFolder =
  `${paginatedAgreementId}/${paginatedEvidenceId}`;

const syntheticPdfNames = Array.from(
  { length: 105 },
  (_, index) =>
    `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}.pdf`
);

const storagePaginationCalls = [];

const paginatedStorageMock = {
  storage: {
    from: (bucketName) => {
      if (bucketName !== "serven-signed-agreements") {
        throw new Error("Unexpected Storage bucket.");
      }

      return {
        list: async (folderPath, options) => {
          storagePaginationCalls.push({
            folderPath,
            offset: options.offset,
          });

          if (folderPath === "") {
            return {
              data: [
                {
                  name: paginatedAgreementId,
                  id: null,
                },
              ],
              error: null,
            };
          }

          if (folderPath === paginatedAgreementId) {
            return {
              data: [
                {
                  name: paginatedEvidenceId,
                  id: null,
                },
              ],
              error: null,
            };
          }

          if (folderPath === paginatedFolder) {
            if (
  mockState.storagePageError &&
  options.offset >= 100
) {
  return {
    data: null,
    error: {
      status: 503,
      message: "Synthetic Storage pagination failure",
    },
  };
}
            return {
              data: syntheticPdfNames
                .slice(
                  options.offset,
                  options.offset + options.limit
                )
                .map((name) => ({
                  name,
                  id: `synthetic-${name}`,
                })),
              error: null,
            };
          }

          throw new Error("Unexpected Storage folder.");
        },
      };
    },
  },
};

const storagePaginationDiscovery =
  await discoverSignedAgreementPdfs(
    paginatedStorageMock
  );

if (
  storagePaginationDiscovery.pdfCount !== 105 ||
  storagePaginationDiscovery.foldersInspected !== 3 ||
  storagePaginationDiscovery.safeToDelete !== false
) {
  throw new Error(
    "TEST FAILED: Storage pagination discovery incorrect."
  );
}

const secondStoragePageRequested =
  storagePaginationCalls.some(
    (call) =>
      call.folderPath === paginatedFolder &&
      call.offset === 100
  );

if (!secondStoragePageRequested) {
  throw new Error(
    "TEST FAILED: Second Storage page was not requested."
  );
}

console.log("STORAGE PAGINATION TEST PASSED");
console.log(
  "PDF FILES FOUND:",
  storagePaginationDiscovery.pdfCount
);
console.log(
  "FOLDERS INSPECTED:",
  storagePaginationDiscovery.foldersInspected
);
console.log(
  "SECOND PAGE REQUESTED:",
  secondStoragePageRequested
);
console.log(
  "SAFE TO DELETE:",
  storagePaginationDiscovery.safeToDelete
);
// TEST 18: Storage pagination failure must stop discovery.

mockState.storagePageError = true;

let storagePaginationErrorDetected = false;

try {
  await discoverSignedAgreementPdfs(
    paginatedStorageMock
  );
} catch (error) {
  if (
    error.message ===
    "Unable to list signed agreement Storage folder."
  ) {
    storagePaginationErrorDetected = true;
  } else {
    throw error;
  }
} finally {
  mockState.storagePageError = false;
}

if (!storagePaginationErrorDetected) {
  throw new Error(
    "TEST FAILED: Storage pagination failure was not detected."
  );
}

console.log("STORAGE PAGINATION FAILURE TEST PASSED");
console.log("SECOND PAGE FAILURE DETECTED:", true);
console.log("INCOMPLETE DISCOVERY REJECTED:", true);
// TEST 19: Storage discovery must respect folder safety limits.

let folderLimitErrorDetected = false;

try {
  await discoverSignedAgreementPdfs(
    mockSupabase,
    2
  );
} catch (error) {
  if (
    error.message ===
    "Storage discovery folder limit exceeded."
  ) {
    folderLimitErrorDetected = true;
  } else {
    throw error;
  }
}

if (!folderLimitErrorDetected) {
  throw new Error(
    "TEST FAILED: Storage folder safety limit was not enforced."
  );
}

console.log("STORAGE FOLDER SAFETY LIMIT TEST PASSED");
console.log("MAXIMUM ALLOWED FOLDERS:", 2);
console.log("EXCESSIVE DISCOVERY BLOCKED:", true);
// TEST 20: Reject invalid Storage discovery folder limits.

const invalidFolderLimits = [
  0,
  -1,
  1001,
  1.5,
  "100",
  null,
];

for (const invalidLimit of invalidFolderLimits) {
  let rejected = false;

  try {
    await discoverSignedAgreementPdfs(
      mockSupabase,
      invalidLimit
    );
  } catch (error) {
    if (
      error.message ===
      "Invalid Storage discovery folder limit."
    ) {
      rejected = true;
    } else {
      throw error;
    }
  }

  if (!rejected) {
    throw new Error(
      `TEST FAILED: Invalid folder limit accepted: ${invalidLimit}`
    );
  }
}

console.log("INVALID STORAGE FOLDER LIMIT TEST PASSED");
console.log(
  "INVALID LIMITS REJECTED:",
  invalidFolderLimits.length
);
console.log("UNSAFE DISCOVERY PREVENTED:", true);