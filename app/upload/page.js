"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { supabase } from "../lib/supabaseClient";

/* ===============================
   DETECT COLUMN
=============================== */
const detectColumn = (row, possibleNames) => {
  const keys = Object.keys(row || {});

  for (let name of possibleNames) {
    const found = keys.find(
      (k) => k.toLowerCase().trim() === name.toLowerCase()
    );

    if (found) return found;
  }

  return "";
};

const makeLocationId = (name) =>
  String(name || "Main Location")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "main";

export default function UploadPage() {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [uploadType, setUploadType] = useState("menu");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedLocationName, setSelectedLocationName] =
    useState("Main Location");

  const selectedLocationId = makeLocationId(selectedLocationName);

  /* ===============================
     STEP 1: PARSE + PREVIEW
  =============================== */
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setMessage("No file selected");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data || [];

        if (!data.length) {
          setMessage("Empty file");
          return;
        }

        const sample = data[0];
        const cols = Object.keys(sample || {});

        setRows(data);
        setHeaders(cols);

        setMapping({
          name: detectColumn(sample, [
            "name",
            "item",
            "product",
            "item name",
            "menu item",
          ]),
          category: detectColumn(sample, [
            "category",
            "type",
            "item category",
          ]),
          quantity: detectColumn(sample, [
            "quantity",
            "qty",
            "units",
            "quantity sold",
            "sold",
          ]),
          revenue: detectColumn(sample, [
            "revenue",
            "sales",
            "total",
            "amount",
            "net sales",
            "gross sales",
          ]),
          date: detectColumn(sample, [
            "date",
            "sale_date",
            "time",
            "created at",
          ]),
          price: detectColumn(sample, [
            "price",
            "menu price",
            "selling price",
          ]),
          cost: detectColumn(sample, [
            "ingredient_cost",
            "cost",
            "item cost",
            "food cost",
          ]),
          labor: detectColumn(sample, [
            "labor",
            "labor cost",
            "labor_cost",
          ]),
        });

        setMessage("Preview loaded. Confirm mapping, then upload.");
      },
      error: (error) => {
        console.error("CSV parse failed:", error);
        setMessage("Failed to parse CSV file");
      },
    });
  };

  /* ===============================
     STEP 2: CONFIRM + UPLOAD
  =============================== */
  const handleUpload = async () => {
    try {
      setUploading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        setMessage("You must be logged in");
        setUploading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("plan, customer_status, status, subscription_status, email")
        .eq("id", user.id)
        .maybeSingle();

      const plan = String(profile?.plan || "").toLowerCase();
      const status = String(
        profile?.customer_status ||
          profile?.status ||
          profile?.subscription_status ||
          ""
      ).toLowerCase();

      const allowedPlans = ["starter", "growth", "pro"];
      const allowedStatuses = ["active", "paid", "trialing"];

      const hasUploadAccess =
        allowedPlans.includes(plan) && allowedStatuses.includes(status);

      if (!hasUploadAccess) {
        router.push("/pricing");
        setUploading(false);
        return;
      }

      if (!rows.length) {
        setMessage("No rows to upload");
        setUploading(false);
        return;
      }

      const uploadLabel =
        uploadType === "menu" ? "Menu Upload" : "Sales Upload";

      const { data: uploadedFileRow, error: uploadInsertError } =
        await supabase
          .from("uploads")
          .insert([
            {
              user_id: user.id,
              file_name: uploadLabel,
              source_name: selectedLocationName || "Main Location",
              row_count: Number(rows.length || 0),
              upload_type: uploadType === "menu" ? "menu_items" : "pos",
              status: "completed",
              location_id: selectedLocationId || "main",
              location_name: selectedLocationName || "Main Location",
            },
          ])
          .select()
          .single();

      if (uploadInsertError) {
        console.error("Upload record failed:", uploadInsertError);
        setMessage("Failed to create upload record");
        setUploading(false);
        return;
      }

      if (uploadType === "menu") {
        if (!mapping?.name) {
          setMessage("Please map the menu item name column");
          setUploading(false);
          return;
        }

        const formattedRows = rows.map((row) => ({
          user_id: user.id,
          upload_id: uploadedFileRow?.id || null,

          location_id: selectedLocationId || "main",
          location_name: selectedLocationName || "Main Location",

          name: row[mapping.name] || "Unknown Item",
          category: mapping.category
            ? row[mapping.category] || "Uncategorized"
            : "Uncategorized",

          price: Number(row[mapping.price] || 0),
          ingredient_cost: Number(row[mapping.cost] || 0),
          weekly_sales: Number(row[mapping.quantity] || 0),

          is_active: true,
        }));

        const { error } = await supabase
          .from("menu_items")
          .insert(formattedRows);

        if (error) {
          console.error("Menu upload failed:", error);
          setMessage(`Menu upload failed: ${error.message}`);
          setUploading(false);
          return;
        }
      }

      if (uploadType === "sales") {
        if (!mapping?.name || !mapping?.revenue) {
          setMessage("Please map at least item name and revenue columns");
          setUploading(false);
          return;
        }

        const formattedRows = rows.map((row) => ({
          user_id: user.id,
          upload_id: uploadedFileRow?.id || null,

          location_id: selectedLocationId || "main",
          location_name: selectedLocationName || "Main Location",

          name: row[mapping.name] || "Unknown Sale",
          category: mapping.category
            ? row[mapping.category] || "Uncategorized"
            : "Uncategorized",

          quantity: Number(row[mapping.quantity] || 1),
          revenue: Number(row[mapping.revenue] || 0),
          sale_date: mapping.date ? row[mapping.date] || null : null,
          labor: mapping.labor ? Number(row[mapping.labor] || 0) : 0,
        }));

        const { error } = await supabase
          .from("sales")
          .insert(formattedRows);

        if (error) {
          console.error("Sales upload failed:", error);
          setMessage(`Sales upload failed: ${error.message}`);
          setUploading(false);
          return;
        }
      }

      setMessage(
        `Upload complete: ${rows.length} rows saved for ${
          selectedLocationName || "Main Location"
        }.`
      );

      setRows([]);
      setHeaders([]);
      setMapping({});
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage("Upload failed");
    }

    setUploading(false);
  };

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <h1>Upload CSV</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 800 }}>
          Upload Type
        </label>

        <select
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            width: "100%",
          }}
        >
          <option value="menu">Menu Items</option>
          <option value="sales">POS Sales</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 800 }}>
          Restaurant Location
        </label>

        <input
          type="text"
          value={selectedLocationName}
          onChange={(e) => setSelectedLocationName(e.target.value)}
          placeholder="Main Location"
          style={{
            padding: "10px",
            width: "100%",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
          }}
        />

        <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
          Location ID: {selectedLocationId}
        </div>
      </div>

      <input type="file" accept=".csv" onChange={handleFileUpload} />

      {message && (
        <p style={{ marginTop: 16, fontWeight: 800 }}>
          {message}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Preview</h3>

          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="5">
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {headers.map((h, j) => (
                      <td key={j}>{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: 20 }}>Map Columns</h3>

          {Object.keys(mapping).map((field) => (
            <div key={field} style={{ marginBottom: 10 }}>
              <label style={{ fontWeight: 700 }}>{field} → </label>

              <select
                value={mapping[field]}
                onChange={(e) =>
                  setMapping((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                  }))
                }
              >
                <option value="">-- Select Column --</option>

                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              background: uploading ? "#94a3b8" : "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: uploading ? "default" : "pointer",
              fontWeight: 800,
            }}
          >
            {uploading ? "Uploading..." : "Confirm & Upload"}
          </button>
        </>
      )}
    </div>
  );
}