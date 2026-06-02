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

  if (loading) return <div style={{ padding: 40 }}>Loading invite...</div>;

  if (!invite) {
    return <div style={{ padding: 40 }}>Invite not found or expired.</div>;
  }
const handleAcceptInvite = async () => {
  if (!password.trim()) {
    alert("Create a password first.");
    return;
  }

  setCreating(true);

  const { data, error } = await supabase.auth.signUp({
    email: invite.email,
    password,
  });

  if (error) {
    console.error("Signup error:", error);
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

  const { error: userInsertError } = await supabase.from("users").insert([
    {
      id: newUserId,
      email: invite.email,
      role: invite.role,
      owner_user_id: invite.owner_user_id,
      location_name: invite.location_name,
      plan: "team",
    },
  ]);

  if (userInsertError) {
    console.error("Team user insert failed:", userInsertError);
    alert(userInsertError.message);
    setCreating(false);
    return;
  }

  await supabase
    .from("team_invites")
    .update({ status: "accepted", accepted_user_id: newUserId })
    .eq("id", invite.id);

  alert("Account created. You can now log in.");

  window.location.href = "/login";
};







  return (
    <div style={{ padding: 40 }}>
      <h1>Accept Your Serven Invite</h1>

      <p>
        You were invited as <strong>{invite.role}</strong>
        {invite.location_name ? ` for ${invite.location_name}` : ""}.
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
  onClick={handleCreateTeamInvite}
  style={{
    marginTop: "22px",
    width: "100%",
    padding: "16px 20px",
    borderRadius: "16px",
    border: "2px solid rgba(129,140,248,0.6)",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "white",
    fontSize: "15px",
    fontWeight: "900",
    cursor: "pointer",
    display: "block",
    position: "relative",
    zIndex: 20,
  }}
>
  Send Invite
</button>

    </div>
  );
}