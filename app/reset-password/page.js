"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Checking reset link...");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const setupResetSession = async () => {
      try {
        const code = searchParams.get("code");

        if (!code) {
          setMessage("Missing reset code. Please request a new reset link.");
          setReady(false);
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage(
            "Reset link expired or invalid. Please request another reset email."
          );
          setReady(false);
          return;
        }

        setMessage("");
        setReady(true);
      } catch (err) {
        console.error("Reset setup error:", err);
        setMessage("Failed to initialize password reset.");
        setReady(false);
      }
    };

    setupResetSession();
  }, [searchParams]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!ready) {
      setMessage("Reset link is not ready. Please request a new reset link.");
      return;
    }

    if (!password || !confirmPassword) {
      setMessage("Please fill out both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    await supabase.auth.signOut();

    setLoading(false);
    setMessage("Password updated successfully. Redirecting to login...");

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
        fontFamily: "sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "400px",
          maxWidth: "100%",
          padding: "30px",
          borderRadius: "16px",
          background: "white",
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            height: "4px",
            width: "100%",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #6D3DF5, #9333ea)",
            marginBottom: "20px",
          }}
        />

        <h2 style={{ marginBottom: "5px" }}>Set New Password</h2>

        <p
          style={{
            color: "#6b7280",
            fontSize: "13px",
            marginBottom: "20px",
          }}
        >
          Enter your new password below.
        </p>

        <form onSubmit={handleUpdatePassword}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            disabled={!ready || loading}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            disabled={!ready || loading}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={!ready || loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: !ready || loading ? "#9ca3af" : "#6D3DF5",
              color: "white",
              fontWeight: "600",
              cursor: !ready || loading ? "not-allowed" : "pointer",
              boxShadow: "0 10px 20px rgba(109,61,245,0.25)",
            }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "15px",
              fontSize: "12px",
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}