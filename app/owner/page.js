"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useRouter } from "next/navigation";

const OWNER_EMAIL = "antoinemiller@servenai.com";

export default function OwnerPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [customLeads, setCustomLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOwnerPortal();
  }, []);

  const loadOwnerPortal = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    if (String(user.email || "").toLowerCase() !== OWNER_EMAIL) {
      router.push("/dashboard");
      return;
    }

    setCurrentUser(user);

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Users fetch error:", usersError);
      setMessage(usersError.message);
      setClients([]);
    } else {
      setClients(usersData || []);
    }

    const { data: leadsData, error: leadsError } = await supabase
      .from("custom_plan_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (leadsError) {
      console.warn("Custom leads table not available:", leadsError.message);
      setCustomLeads([]);
    } else {
      setCustomLeads(leadsData || []);
    }

    setLoading(false);
  };

  const updateClientAccess = async (clientId, plan, status = "active") => {
    const { error } = await supabase
      .from("users")
      .update({
        plan,
        customer_status: status,
      })
      .eq("id", clientId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Client updated to ${plan} / ${status}.`);
    await loadOwnerPortal();
  };

  const activateLeadByEmail = async (email, plan) => {
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("This lead does not have an email.");
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({
        plan,
        customer_status: "active",
      })
      .eq("email", cleanEmail);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Lead activated as ${plan}.`);
    await loadOwnerPortal();
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        String(client.restaurant_name || "").toLowerCase().includes(search) ||
        String(client.email || "").toLowerCase().includes(search) ||
        String(client.business_type || "").toLowerCase().includes(search);

      const plan = String(client.plan || "none").toLowerCase();
      const status = String(client.customer_status || "lead").toLowerCase();

      const matchesPlan = planFilter === "all" || plan === planFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [clients, searchTerm, planFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = clients.filter(
      (c) => String(c.customer_status || "").toLowerCase() === "active"
    ).length;

    const leads = clients.filter(
      (c) => String(c.customer_status || "lead").toLowerCase() === "lead"
    ).length;

    const starter = clients.filter(
      (c) => String(c.plan || "").toLowerCase() === "starter"
    ).length;

    const growth = clients.filter(
      (c) => String(c.plan || "").toLowerCase() === "growth"
    ).length;

    const pro = clients.filter(
      (c) => String(c.plan || "").toLowerCase() === "pro"
    ).length;

    const estimatedMRR = starter * 149 + growth * 299 + pro * 499;

    return {
      total: clients.length,
      active,
      leads,
      customLeads: customLeads.length,
      starter,
      growth,
      pro,
      estimatedMRR,
    };
  }, [clients, customLeads]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCard}>
          <div style={eyebrow}>SERVEN OWNER PORTAL</div>
          <h2 style={{ margin: 0 }}>Loading command center...</h2>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={topBar}>
        <div>
          <div style={eyebrow}>SERVEN OWNER PORTAL</div>
          <h1 style={titleStyle}>Owner Command Center</h1>
          <p style={subText}>Logged in as {currentUser?.email}</p>
        </div>

        <button onClick={loadOwnerPortal} style={refreshButton}>
          Refresh Data
        </button>
      </div>

      {message && <div style={messageBox}>{message}</div>}

      <section style={statsGrid}>
        <StatCard label="Total Accounts" value={stats.total} />
        <StatCard label="Custom Leads" value={stats.customLeads} />
        <StatCard label="Active Clients" value={stats.active} />
        <StatCard label="New Leads" value={stats.leads} />
        <StatCard
          label="Estimated MRR"
          value={`$${stats.estimatedMRR.toLocaleString()}`}
        />
      </section>

      <section style={statsGridSmall}>
        <StatCard label="Starter" value={stats.starter} />
        <StatCard label="Growth" value={stats.growth} />
        <StatCard label="Pro" value={stats.pro} />
      </section>

      <section style={leadPanel}>
        <div style={panelHeader}>
          <div>
            <div style={eyebrow}>SALES PIPELINE</div>
            <h2 style={sectionTitle}>Custom Plan Leads</h2>
            <p style={subText}>
              Leads from your pricing calculator and demo requests should show
              here.
            </p>
          </div>

          <div style={countBadge}>{customLeads.length} Leads</div>
        </div>

        {!customLeads.length ? (
          <div style={emptyState}>
            No custom plan leads yet. Once someone fills out your pricing/demo
            form, they should appear here.
          </div>
        ) : (
          <div style={cardGrid}>
            {customLeads.map((lead) => {
              const recommendedPlan = String(
                lead.recommended_plan || "starter"
              ).toLowerCase();

              return (
                <div key={lead.id} style={leadCard}>
                  <h3 style={cardTitle}>
                    {lead.restaurant_name || "Restaurant Lead"}
                  </h3>

                  <p style={mutedText}>{lead.email || "No email saved"}</p>

                  <div style={miniGrid}>
                    <MiniBox
                      label="Revenue"
                      value={`$${Number(
                        lead.monthly_revenue || 0
                      ).toLocaleString()}`}
                    />
                    <MiniBox
                      label="ROI"
                      value={`$${Number(
                        lead.estimated_roi || 0
                      ).toLocaleString()}`}
                    />
                    <MiniBox label="Recommended" value={recommendedPlan} />
                    <MiniBox label="Locations" value={lead.locations || 1} />
                  </div>

                  <div style={noteBox}>
                    <strong>Next step:</strong> Schedule demo, confirm numbers,
                    then activate their plan below.
                  </div>

                  <div style={buttonGrid}>
                    <button
                      onClick={() => activateLeadByEmail(lead.email, "starter")}
                      style={smallButton}
                    >
                      Starter
                    </button>
                    <button
                      onClick={() => activateLeadByEmail(lead.email, "growth")}
                      style={smallButton}
                    >
                      Growth
                    </button>
                    <button
                      onClick={() => activateLeadByEmail(lead.email, "pro")}
                      style={smallButtonPurple}
                    >
                      Pro
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={controlBar}>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search restaurant, email, or business type..."
          style={searchInput}
        />

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All Plans</option>
          <option value="none">None</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="pro">Pro</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All Statuses</option>
          <option value="lead">Lead</option>
          <option value="contacted">Contacted</option>
          <option value="demo_done">Demo Done</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </section>

      <section style={clientPanel}>
        <div style={panelHeader}>
          <div>
            <div style={eyebrow}>CLIENT ACCESS</div>
            <h2 style={sectionTitle}>Clients & Accounts</h2>
            <p style={subText}>
              Use this section to activate plans after a client signs or after a
              demo.
            </p>
          </div>

          <div style={countBadge}>{filteredClients.length} Showing</div>
        </div>

        {!filteredClients.length ? (
          <div style={emptyState}>No clients match your filters.</div>
        ) : (
          <div style={cardGrid}>
            {filteredClients.map((client) => (
              <div key={client.id} style={clientCard}>
                <div style={clientTop}>
                  <div>
                    <h3 style={cardTitle}>
                      {client.restaurant_name || "Unnamed Restaurant"}
                    </h3>
                    <p style={mutedText}>{client.email || "No email"}</p>
                  </div>

                  <div style={statusBadge(client.customer_status)}>
                    {client.customer_status || "lead"}
                  </div>
                </div>

                <div style={miniGrid}>
                  <MiniBox label="Plan" value={client.plan || "none"} />
                  <MiniBox
                    label="Business"
                    value={client.business_type || "Restaurant"}
                  />
                  <MiniBox
                    label="Created"
                    value={
                      client.created_at
                        ? new Date(client.created_at).toLocaleDateString()
                        : "N/A"
                    }
                  />
                  <MiniBox
                    label="Client ID"
                    value={String(client.id || "").slice(0, 8)}
                  />
                </div>

                <div style={buttonGrid}>
                  <button
                    onClick={() =>
                      updateClientAccess(client.id, "starter", "active")
                    }
                    style={smallButton}
                  >
                    Starter
                  </button>

                  <button
                    onClick={() =>
                      updateClientAccess(client.id, "growth", "active")
                    }
                    style={smallButton}
                  >
                    Growth
                  </button>

                  <button
                    onClick={() =>
                      updateClientAccess(client.id, "pro", "active")
                    }
                    style={smallButtonPurple}
                  >
                    Pro
                  </button>

                  <button
                    onClick={() =>
                      updateClientAccess(client.id, "none", "paused")
                    }
                    style={smallButtonRed}
                  >
                    Pause
                  </button>
                </div>

                <button
                  onClick={() => {
                    window.location.href = `/dashboard?client=${client.id}`;
                  }}
                  style={viewButton}
                >
                  View Client Dashboard →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={statCard}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

function MiniBox({ label, value }) {
  return (
    <div style={miniBox}>
      <div style={miniLabel}>{label}</div>
      <div style={miniValue}>{value}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const pageStyle = {
  minHeight: "100vh",
  padding: "40px",
  background:
    "radial-gradient(circle at top left, rgba(124,58,237,0.22), transparent 30%), radial-gradient(circle at top right, rgba(14,165,233,0.12), transparent 28%), #020617",
  color: "white",
  fontFamily: "Inter, system-ui, sans-serif",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "26px",
  flexWrap: "wrap",
};

const eyebrow = {
  color: "#a78bfa",
  fontSize: "12px",
  fontWeight: "900",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

const titleStyle = {
  fontSize: "36px",
  fontWeight: "950",
  margin: 0,
};

const subText = {
  color: "#94a3b8",
  fontSize: "13px",
  marginTop: "8px",
  lineHeight: 1.6,
};

const refreshButton = {
  padding: "12px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};

const messageBox = {
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(59,130,246,0.14)",
  border: "1px solid rgba(59,130,246,0.28)",
  color: "#bfdbfe",
  marginBottom: "18px",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const statsGridSmall = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginBottom: "24px",
};

const statCard = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(15,23,42,0.86)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
};

const statLabel = {
  color: "#94a3b8",
  fontSize: "12px",
  marginBottom: "8px",
};

const statValue = {
  fontSize: "28px",
  fontWeight: "950",
};

const leadPanel = {
  marginBottom: "24px",
  padding: "24px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 28%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))",
  border: "1px solid rgba(59,130,246,0.22)",
  boxShadow: "0 24px 60px rgba(2,6,23,0.28)",
};

const clientPanel = {
  marginBottom: "24px",
  padding: "24px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
  border: "1px solid rgba(255,255,255,0.1)",
};

const panelHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const sectionTitle = {
  color: "white",
  fontSize: "28px",
  fontWeight: "950",
  margin: 0,
};

const countBadge = {
  padding: "10px 14px",
  borderRadius: "14px",
  background: "rgba(59,130,246,0.14)",
  border: "1px solid rgba(59,130,246,0.24)",
  color: "#93c5fd",
  fontWeight: "900",
  fontSize: "13px",
};

const emptyState = {
  padding: "28px",
  borderRadius: "18px",
  textAlign: "center",
  background: "rgba(15,23,42,0.65)",
  border: "1px dashed rgba(148,163,184,0.22)",
  color: "#94a3b8",
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "18px",
};

const leadCard = {
  padding: "22px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.82))",
  border: "1px solid rgba(148,163,184,0.16)",
};

const clientCard = {
  padding: "22px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.88))",
  border: "1px solid rgba(148,163,184,0.16)",
  boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
};

const clientTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "16px",
};

const cardTitle = {
  color: "white",
  fontWeight: "950",
  fontSize: "20px",
  margin: 0,
};

const mutedText = {
  color: "#94a3b8",
  fontSize: "13px",
  marginTop: "6px",
};

const miniGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  marginTop: "16px",
};

const miniBox = {
  padding: "13px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(148,163,184,0.1)",
};

const miniLabel = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "800",
  marginBottom: "5px",
};

const miniValue = {
  color: "white",
  fontSize: "14px",
  fontWeight: "900",
  textTransform: "capitalize",
  wordBreak: "break-word",
};

const noteBox = {
  marginTop: "16px",
  padding: "12px",
  borderRadius: "14px",
  background: "rgba(234,179,8,0.1)",
  border: "1px solid rgba(234,179,8,0.18)",
  color: "#fde68a",
  fontSize: "12px",
  lineHeight: 1.5,
};

const buttonGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
  gap: "8px",
  marginTop: "16px",
};

const smallButton = {
  padding: "10px 12px",
  borderRadius: "12px",
  border: "none",
  cursor: "pointer",
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  color: "white",
  fontWeight: "900",
  fontSize: "12px",
};

const smallButtonPurple = {
  ...smallButton,
  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
};

const smallButtonRed = {
  ...smallButton,
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
};

const viewButton = {
  marginTop: "12px",
  width: "100%",
  padding: "11px 13px",
  borderRadius: "13px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#ddd6fe",
  fontWeight: "900",
  cursor: "pointer",
};

const controlBar = {
  display: "flex",
  gap: "12px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const searchInput = {
  flex: 1,
  minWidth: "260px",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15,23,42,0.9)",
  color: "white",
  outline: "none",
};

const selectStyle = {
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15,23,42,0.9)",
  color: "white",
  outline: "none",
};

const loadingCard = {
  padding: "28px",
  borderRadius: "20px",
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const statusBadge = (status = "lead") => {
  const clean = String(status || "lead").toLowerCase();

  const active = clean === "active";
  const paused = clean === "paused";
  const demo = clean === "demo_done";

  return {
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "950",
    textTransform: "uppercase",
    background: active
      ? "rgba(34,197,94,0.16)"
      : paused
      ? "rgba(239,68,68,0.16)"
      : demo
      ? "rgba(59,130,246,0.16)"
      : "rgba(234,179,8,0.16)",
    color: active
      ? "#4ade80"
      : paused
      ? "#f87171"
      : demo
      ? "#93c5fd"
      : "#fde047",
  };
};