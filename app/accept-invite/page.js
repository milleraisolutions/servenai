"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
const formatRoleLabel = (role) => {
  switch (role) {
    case "owner":
      return "Owner";

    case "corporate_admin":
      return "Corporate Admin";

    case "regional_director":
      return "Regional Director";

    case "gm":
      return "General Manager";

    case "kitchen_manager":
      return "Kitchen Manager";

    case "finance":
      return "Finance";

    default:
      return role;
  }
};
export default function AcceptInvitePage() {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
const [password, setPassword] = useState("");
const [accountMode, setAccountMode] = useState("signup");
const [creating, setCreating] = useState(false);
  useEffect(() => {
    loadInvite();
  }, []);

  
const loadInvite = async () => {
  setLoading(true);

  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setInvite(null);
      return;
    }

    const response = await fetch("/api/team-invite-lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ token }),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      console.error(
        "Invite load error:",
        result?.error || "Unable to load invitation."
      );
      setInvite(null);
      return;
    }

    setInvite(result.invite);
  } catch (error) {
    console.error("Invite load error:", error);
    setInvite(null);
  } finally {
    setLoading(false);
  }
};

const handleAcceptInvite = async () => {
  if (!password.trim()) {
    alert("Create a password first.");
    return;
  }

  setCreating(true);

// First, check whether the invited employee already
// has an authenticated Supabase session.
const {
  data: { user: currentUser },
} = await supabase.auth.getUser();

if (currentUser) {
  const currentEmail = String(currentUser.email || "")
    .trim()
    .toLowerCase();

  const invitedEmail = String(invite.email || "")
    .trim()
    .toLowerCase();

  if (currentEmail !== invitedEmail) {
    alert("Please sign in with the email address on this invitation.");
    setCreating(false);
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    alert("Your session has expired. Please sign in again.");
    setCreating(false);
    return;
  }

  const acceptResponse = await fetch("/api/accept-team-invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      inviteId: invite.id,
    }),
  });

  const acceptResult = await acceptResponse.json();

  if (!acceptResponse.ok || !acceptResult.success) {
    alert(acceptResult.error || "Invite acceptance failed.");
    setCreating(false);
    return;
  }

  alert("Invitation accepted. Welcome to Serven.");
  window.location.href = "/dashboard";
  return;
}
// Try signing in an existing employee before creating
// a new account.
if (accountMode === "login") {
const {
  data: existingLogin,
  error: existingLoginError,
} = await supabase.auth.signInWithPassword({
  email: invite.email,
  password,
});

if (!existingLoginError && existingLogin?.session?.access_token) {
  const acceptResponse = await fetch("/api/accept-team-invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${existingLogin.session.access_token}`,
    },
    body: JSON.stringify({
      inviteId: invite.id,
    }),
  });

  const acceptResult = await acceptResponse.json();

  if (!acceptResponse.ok || !acceptResult.success) {
    alert(acceptResult.error || "Invite acceptance failed.");
    setCreating(false);
    return;
  }

    alert("Invitation accepted. Welcome to Serven.");
  window.location.href = "/dashboard";
  return;
}

alert(
  existingLoginError?.message ||
    "Unable to sign in. Please check your password."
);
setCreating(false);
return;
}

// New Employee mode continues to account creation.
// Existing Account mode never attempts signup.
const { data, error } = await supabase.auth.signUp({
    email: invite.email,
    password,
  });

 if (error) {
  console.error("Signup error:", error);
if (
  error.message.toLowerCase().includes("already registered")
) {
  alert(
    "An account already exists for this email. Please sign in with the correct password, then reopen your invitation link."
  );

  setCreating(false);
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
const newAccessToken = data?.session?.access_token;

if (!newAccessToken) {
  alert(
    "Account created. Please verify your email and sign in before accepting the invitation."
  );
  setCreating(false);
  return;
}
  const acceptResponse = await fetch("/api/accept-team-invite", {
  method: "POST",
  headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${newAccessToken}`,
},
  body: JSON.stringify({
  inviteId: invite.id,
}),
});

const acceptResult = await acceptResponse.json();

if (!acceptResult.success) {
  alert(acceptResult.error || "Invite acceptance failed.");
  setCreating(false);
  return;
}

alert("Invitation accepted. Welcome to Serven.");

window.location.href = "/dashboard";
};
  if (loading) return <div style={{ padding: 40 }}>Loading invite...</div>;

  if (!invite) {
    return <div style={{ padding: 40 }}>Invite not found or expired.</div>;
  }








  return (
    <div style={{ padding: 40 }}>
      <h1>Accept Your Serven Invite</h1>

      <p>
        You were invited as <strong>{formatRoleLabel(invite.role)}</strong>
        {invite.location_name ? ` for ${invite.location_name}` : ""}.
      </p>
<p style={{ color: "#64748b", marginTop: "10px" }}>
  Invited email: <strong>{invite.email}</strong>
</p>
<div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    maxWidth: "360px",
  }}
>
  <button
    type="button"
    onClick={() => setAccountMode("signup")}
    disabled={creating}
    style={{
      flex: 1,
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid #818cf8",
      background: accountMode === "signup" ? "#4f46e5" : "#1e293b",
      color: "white",
      cursor: "pointer",
    }}
  >
    New Employee
  </button>

  <button
    type="button"
    onClick={() => setAccountMode("login")}
    disabled={creating}
    style={{
      flex: 1,
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid #818cf8",
      background: accountMode === "login" ? "#4f46e5" : "#1e293b",
      color: "white",
      cursor: "pointer",
    }}
  >
    Existing Account
  </button>
</div>
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
  {creating ? "Processing Invitation..." : "Continue with Invitation"}
</button>

<p
  style={{
    marginTop: "16px",
    color: "#64748b",
    fontSize: "14px",
    maxWidth: "360px",
    lineHeight: 1.6,
  }}
>
  Already have a Serven account? Enter your existing password above.
  We'll try signing you in before creating a new account.
</p>

<p
  style={{
    marginTop: "10px",
    color: "#64748b",
    fontSize: "14px",
    maxWidth: "360px",
    lineHeight: 1.6,
  }}
>
  Just verified your email? Return to this invitation link and enter
  your password to complete your invitation.
</p>

    </div>
  );
}