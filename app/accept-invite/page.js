"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AcceptInvitePage() {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
const [password, setPassword] = useState("");
const [creating, setCreating] = useState(false);
  useEffect(() => {
    loadInvite();
  }, []);

  const loadInvite = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("team_invites")
      .select("*")
      .eq("invite_token", token)
      .eq("status", "pending")
      .maybeSingle();

    if (error) {
      console.error("Invite load error:", error);
    }

    setInvite(data || null);
    setLoading(false);
  };
const handleAcceptInvite = async () => {
  if (!password.trim()) {
    alert("Create a password first.");
    return;
  }

  setCreating(true);
await supabase.auth.signOut();
  const { data, error } = await supabase.auth.signUp({
    email: invite.email,
    password,
  });

 if (error) {
  console.error("Signup error:", error);

  if (error.message.toLowerCase().includes("already registered")) {
    alert("This email already has a Serven account. Please log in instead.");
    setCreating(false);
    window.location.href = "/login";
    return;
  }

  alert(error.message);
  setCreating(false);
  return;
}

  const newUserId = data?.user?.id;

  if (!newUserId) {
    alert("Account created. Please check your email to confirm.");
    setCreating(false);
    return;
  }

  const acceptResponse = await fetch("/api/accept-team-invite", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    inviteId: invite.id,
    userId: newUserId,
  }),
});

const acceptResult = await acceptResponse.json();

if (!acceptResult.success) {
  alert(acceptResult.error || "Invite acceptance failed.");
  setCreating(false);
  return;
}

  alert("Account created. You can now log in.");

  window.location.href = "/login";
};
  if (loading) return <div style={{ padding: 40 }}>Loading invite...</div>;

  if (!invite) {
    return <div style={{ padding: 40 }}>Invite not found or expired.</div>;
  }








  return (
    <div style={{ padding: 40 }}>
      <h1>Accept Your Serven Invite</h1>

      <p>
        You were invited as <strong>{invite.role}</strong>
        {invite.location_name ? ` for ${invite.location_name}` : ""}.
      </p>
<p style={{ color: "#64748b", marginTop: "10px" }}>
  Invited email: <strong>{invite.email}</strong>
</p>
      <input
  type="password"
  placeholder="Create password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  style={{
    display: "block",
    marginTop: "18px",
    padding: "14px",
    width: "100%",
    maxWidth: "360px",
  }}
/>

<button
  type="button"
  onClick={handleAcceptInvite}
  disabled={creating}
  style={{
    marginTop: "22px",
    width: "100%",
    maxWidth: "360px",
    padding: "16px 20px",
    borderRadius: "16px",
    border: "2px solid rgba(129,140,248,0.6)",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "white",
    fontSize: "15px",
    fontWeight: "900",
    cursor: creating ? "not-allowed" : "pointer",
    display: "block",
    position: "relative",
    zIndex: 20,
  }}
>
  {creating ? "Creating Account..." : "Create Account"}
</button>

    </div>
  );
}