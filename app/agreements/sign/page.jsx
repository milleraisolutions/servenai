"use client";

import { useEffect, useState } from "react";

export default function AgreementSigningPage() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    // Read the signing token from the URL.
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    // Remove the token from the browser address bar.
    // Keep it out of React state, logs, and browser storage.
    window.history.replaceState(
      window.history.state,
      "",
      "/agreements/sign"
    );

    if (!token || !/^[0-9a-f]{64}$/.test(token)) {
      setStatus("unavailable");
      return;
    }

    // Verify the signing link through SerVen's backend.
// Electronic signing remains disabled.
const verifyAgreement = async () => {
  try {
    const response = await fetch(
      "/api/agreements/sign/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ token }),
      }
    );

    if (!response.ok) {
      setStatus("unavailable");
      return;
    }

    // Agreement display will be enabled only after
    // signer-access protections are completed.
    setStatus("unavailable");
  } catch {
    setStatus("unavailable");
  }
};

verifyAgreement();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "60px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 15px 45px rgba(15,23,42,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "34px",
            fontWeight: "900",
            color: "#4f46e5",
          }}
        >
          SerVen
        </h1>

        <h2
          style={{
            fontSize: "25px",
            color: "#0f172a",
            marginTop: "24px",
          }}
        >
          Agreement Review & Electronic Signature
        </h2>

        <p
          style={{
            color: "#64748b",
            lineHeight: 1.8,
            marginTop: "18px",
          }}
        >
          This secure page will allow authorized restaurant
          representatives to review their complete SerVen
          agreement before electronically signing.
        </p>
{status === "checking" && (
  <div
    role="status"
    style={{
      marginTop: "28px",
      padding: "20px",
      borderRadius: "12px",
      background: "#eef2ff",
      color: "#3730a3",
      fontWeight: "600",
    }}
  >
    Verifying your SerVen agreement signing link...
  </div>
)}
       {status === "unavailable" && (
  <div
    role="alert"
    style={{
      marginTop: "28px",
      padding: "22px",
      borderRadius: "12px",
      background: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#991b1b",
    }}
  >
    <div
      style={{
        fontSize: "17px",
        fontWeight: "800",
        marginBottom: "10px",
      }}
    >
      Agreement Signing Unavailable
    </div>

    <p
      style={{
        fontSize: "14px",
        lineHeight: 1.7,
        margin: 0,
      }}
    >
      We could not open this agreement for signing.
      The signing link may be invalid, expired,
      or not yet available.
    </p>

    <p
      style={{
        fontSize: "14px",
        lineHeight: 1.7,
        marginTop: "12px",
        marginBottom: 0,
      }}
    >
      Please contact the SerVen team to request
      assistance with your agreement.
    </p>
  </div>
)}
      </div>
    </main>
  );
}