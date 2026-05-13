"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
const OWNER_EMAIL = "milleraisolutions21@gmail.com";

export default function AdminPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [aiActions, setAiActions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [billingFilter, setBillingFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
const [customPlanLeads, setCustomPlanLeads] = useState([]);
const [apolloLeads, setApolloLeads] = useState([]);

const isOwner =
  String(currentUser?.email || "").toLowerCase() === OWNER_EMAIL;
  useEffect(() => {
    checkAdminAccess();
  }, []);
useEffect(() => {
  const fetchCustomPlanLeads = async () => {
    if (!isOwner) return;

    try {
      const { data, error } = await supabase
        .from("custom_plan_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch custom plan leads:", error);
        return;
      }

      setCustomPlanLeads(data || []);
    } catch (err) {
      console.error("Lead fetch error:", err);
    }
  };

  fetchCustomPlanLeads();
}, [isOwner]);
  const checkAdminAccess = async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      router.push("/login");
      return;
    }

    if (String(user.email || "").toLowerCase() !== OWNER_EMAIL) {
      router.push("/dashboard");
      return;
    }

    setCurrentUser(user);
    await fetchCustomers();
  };

 const fetchCustomers = async () => {
  setLoading(true);
  setErrorMessage("");

  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (usersError) {
    console.error("ADMIN FETCH ERROR:", usersError);
    setErrorMessage(usersError.message || "Could not load customers.");
    setCustomers([]);
    setLoading(false);
    return;
  }

  const { data: salesData } = await supabase
    .from("sales")
    .select("user_id, revenue, created_at");

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: marketingUsageData } = await supabase
    .from("marketing_usage")
    .select("*")
    .eq("billing_month", currentMonth);

  const { data: campaignData } = await supabase
    .from("marketing_campaigns")
    .select("user_id, estimated_cost, expected_revenue, active, created_at");

  const { data: alertData } = await supabase
    .from("client_alerts")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: aiActionData, error: aiActionError } = await supabase
    .from("ai_applied_actions")
    .select("*")
    .order("created_at", { ascending: false });

  if (aiActionError) {
    console.warn("AI actions table not loaded:", aiActionError.message);
  }

  const { data: leadsData, error: leadsError } = await supabase
  .from("leads")
  .select("*")
  .order("created_at", { ascending: false });

if (leadsError) {
  console.error("LEADS FETCH ERROR:", leadsError);

  setApolloLeads([]);
} else {
  console.log("LEADS DATA:", leadsData);

  setApolloLeads(leadsData || []);
}
  setAlerts(alertData || []);
  setAiActions(aiActionData || []);

  const customersWithMetrics = (usersData || []).map((customer) => {
    const customerSales = (salesData || []).filter(
      (sale) => sale.user_id === customer.id
    );

    const customerAlerts = (alertData || []).filter(
      (alert) => alert.user_id === customer.id
    );

    const customerAiActions = (aiActionData || []).filter(
      (action) => action.user_id === customer.id
    );

    const customerUsage = (marketingUsageData || []).filter(
      (usage) => usage.user_id === customer.id
    );

    const customerCampaigns = (campaignData || []).filter(
      (campaign) => campaign.user_id === customer.id
    );

    const emailUsageThisMonth = customerUsage
      .filter((usage) => usage.usage_type === "email")
      .reduce((sum, usage) => sum + Number(usage.quantity || 0), 0);

    const smsUsageThisMonth = customerUsage
      .filter((usage) => usage.usage_type === "sms")
      .reduce((sum, usage) => sum + Number(usage.quantity || 0), 0);

    const emailLimit = Number(customer.monthly_email_limit || 0) || 5000;
    const smsLimit = Number(customer.monthly_sms_limit || 0) || 500;

    const emailUsagePercent =
      emailLimit > 0 ? Math.round((emailUsageThisMonth / emailLimit) * 100) : 0;

    const smsUsagePercent =
      smsLimit > 0 ? Math.round((smsUsageThisMonth / smsLimit) * 100) : 0;

    const nearingOverage = emailUsagePercent >= 80 || smsUsagePercent >= 80;
    const overLimit = emailUsagePercent >= 100 || smsUsagePercent >= 100;

    const estimatedCampaignSpend = customerCampaigns.reduce(
      (sum, campaign) => sum + Number(campaign.estimated_cost || 0),
      0
    );

    const activeCampaigns = customerCampaigns.filter(
      (campaign) => campaign.active === true
    ).length;

    const expectedCampaignRevenue = customerCampaigns.reduce(
      (sum, campaign) => sum + Number(campaign.expected_revenue || 0),
      0
    );

    const campaignCount = customerCampaigns.length;

    const totalRevenue = customerSales.reduce(
      (sum, sale) => sum + Number(sale.revenue || 0),
      0
    );

    const aiProfitGenerated = customerAiActions.reduce(
      (sum, action) => sum + Number(action.impact_value || 0),
      0
    );

    const openAlerts = customerAlerts.filter(
      (alert) => String(alert.status || "open").toLowerCase() !== "closed"
    ).length;

    const lastUpload = customerSales.length
      ? customerSales
          .map((sale) => sale.created_at)
          .filter(Boolean)
          .sort()
          .reverse()[0]
      : null;

    const billingStatus = String(
      customer.subscription_status ||
        customer.billing_status ||
        customer.stripe_status ||
        "unknown"
    ).toLowerCase();

    const healthScore = calculateHealthScore({
      openAlerts,
      totalRevenue,
      lastUpload,
      billingStatus,
    });

    return {
      ...customer,
      totalRevenue,
      aiProfitGenerated,
      aiActionsCount: customerAiActions.length,
      openAlerts,
      lastUpload,
      healthScore,
      billingStatus,

      emailUsageThisMonth,
      smsUsageThisMonth,
      emailLimit,
      smsLimit,
      emailUsagePercent,
      smsUsagePercent,
      nearingOverage,
      overLimit,

      estimatedCampaignSpend,
      activeCampaigns,
      expectedCampaignRevenue,
      campaignCount,
    };
  });

  setCustomers(customersWithMetrics);
  setLoading(false);
};

  const calculateHealthScore = ({
    openAlerts,
    totalRevenue,
    lastUpload,
    billingStatus,
  }) => {
    let score = 100;

    if (openAlerts >= 5) score -= 35;
    else if (openAlerts >= 3) score -= 25;
    else if (openAlerts >= 1) score -= 12;

    if (!totalRevenue) score -= 20;
    if (!lastUpload) score -= 20;

    if (["past_due", "unpaid", "canceled", "cancelled"].includes(billingStatus)) {
      score -= 20;
    }

    return Math.max(score, 0);
  };

  const updateCustomerStatus = async (userId, newStatus) => {
    const { error } = await supabase
      .from("users")
      .update({ customer_status: newStatus })
      .eq("id", userId);

    if (error) {
      console.error("Status update failed:", error);
      setErrorMessage(error.message);
      return;
    }

    fetchCustomers();
  };

  const updatePlan = async (userId, newPlan) => {
    const { error } = await supabase
      .from("users")
      .update({ plan: newPlan })
      .eq("id", userId);

    if (error) {
      console.error("Plan update failed:", error);
      setErrorMessage(error.message);
      return;
    }

    fetchCustomers();
  };

  const updateNotes = async (userId, newNotes) => {
    const { error } = await supabase
      .from("users")
      .update({ notes: newNotes })
      .eq("id", userId);

    if (error) {
      console.error("Notes update failed:", error);
      setErrorMessage(error.message);
      return;
    }

    fetchCustomers();
  };

  const markContacted = async (userId) => {
    const { error } = await supabase
      .from("users")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      console.error("Contact update failed:", error);
      setErrorMessage(error.message);
      return;
    }

    fetchCustomers();
  };
const updateLeadStatus = async (leadId, newStatus) => {
  const { error } = await supabase
    .from("leads")
    .update({
      status: newStatus,
      last_contacted_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) {
    console.error("Lead status update failed:", error);
    alert("Could not update lead");
    return;
  }

  setApolloLeads((prev) =>
    prev.map((lead) =>
      lead.id === leadId
        ? {
            ...lead,
            status: newStatus,
            last_contacted_at: new Date().toISOString(),
          }
        : lead
    )
  );
};
  const closeAlert = async (alertId) => {
    const { error } = await supabase
      .from("client_alerts")
      .update({ status: "closed" })
      .eq("id", alertId);

    if (error) {
      console.error("Close alert failed:", error);
      setErrorMessage(error.message);
      return;
    }

    fetchCustomers();
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        String(customer.restaurant_name || "").toLowerCase().includes(search) ||
        String(customer.email || "").toLowerCase().includes(search) ||
        String(customer.business_type || "").toLowerCase().includes(search);

      const customerPlan = String(customer.plan || "starter").toLowerCase();
      const customerStatus = String(
        customer.customer_status || "lead"
      ).toLowerCase();

      const customerBilling = String(
        customer.billingStatus || "unknown"
      ).toLowerCase();

      const matchesPlan =
        planFilter === "all" ? true : customerPlan === planFilter;

      const matchesStatus =
        statusFilter === "all" ? true : customerStatus === statusFilter;

      const matchesBilling =
        billingFilter === "all" ? true : customerBilling === billingFilter;

      return matchesSearch && matchesPlan && matchesStatus && matchesBilling;
    });
  }, [customers, searchTerm, planFilter, statusFilter, billingFilter]);

  const stats = useMemo(() => {
    const starter = customers.filter(
      (c) => String(c.plan || "starter").toLowerCase() === "starter"
    ).length;

    const growth = customers.filter(
      (c) => String(c.plan || "").toLowerCase() === "growth"
    ).length;

    const pro = customers.filter(
      (c) => String(c.plan || "").toLowerCase() === "pro"
    ).length;

    const leads = customers.filter(
      (c) => String(c.customer_status || "lead").toLowerCase() === "lead"
    ).length;

    const active = customers.filter(
      (c) => String(c.customer_status || "").toLowerCase() === "active"
    ).length;

    const openAlerts = customers.reduce(
      (sum, customer) => sum + Number(customer.openAlerts || 0),
      0
    );

    const totalClientRevenue = customers.reduce(
      (sum, customer) => sum + Number(customer.totalRevenue || 0),
      0
    );

    const totalAIProfitGenerated = customers.reduce(
      (sum, customer) => sum + Number(customer.aiProfitGenerated || 0),
      0
    );

    const activeBilling = customers.filter((c) =>
      ["active", "trialing", "paid"].includes(String(c.billingStatus || ""))
    ).length;

    const pastDueBilling = customers.filter((c) =>
      ["past_due", "unpaid"].includes(String(c.billingStatus || ""))
    ).length;

    const totalMRR = starter * 149 + growth * 299 + pro * 499;
const totalUploads = customers.reduce(
  (sum, customer) => sum + Number(customer.upload_count || 0),
  0
);

const clientsMissingUploads = customers.filter(
  (customer) => !customer.lastUpload
).length;

const avgHealthScore =
  customers.length > 0
    ? Math.round(
        customers.reduce(
          (sum, customer) => sum + Number(customer.healthScore || 0),
          0
        ) / customers.length
      )
    : 0;

const atRiskClients = customers.filter(
  (customer) =>
    Number(customer.healthScore || 0) <= 55 ||
    ["past_due", "unpaid"].includes(
      String(customer.billingStatus || "").toLowerCase()
    )
).length;

const pendingActivations = customers.filter(
  (customer) =>
    String(customer.subscription_status || "").toLowerCase() === "pending"
).length;

const revenueThisMonth = customers.reduce(
  (sum, customer) => sum + Number(customer.totalRevenue || 0),
  0
);
    return {
  total: customers.length,
  starter,
  growth,
  pro,
  leads,
  active,
  openAlerts,
  totalMRR,
  totalClientRevenue,
  totalAIProfitGenerated,
  activeBilling,
  pastDueBilling,
  totalAiActions: aiActions.length,

  // NEW OWNER ANALYTICS
  totalUploads,
  clientsMissingUploads,
  avgHealthScore,
  atRiskClients,
  pendingActivations,
  revenueThisMonth,
};
  }, [customers, aiActions]);

  const selectedAlerts = selectedCustomer
    ? alerts.filter((alert) => alert.user_id === selectedCustomer.id)
    : [];

  const selectedAiActions = selectedCustomer
    ? aiActions.filter((action) => action.user_id === selectedCustomer.id)
    : [];
const activateCustomLead = async (leadEmail, planName) => {
  const cleanEmail = String(leadEmail || "").trim().toLowerCase();

  if (!cleanEmail) {
    setErrorMessage("This lead does not have an email attached.");
    return;
  }

  const { error } = await supabase
    .from("users")
    .update({
      plan: planName,
      customer_status: "active",
    })
    .eq("email", cleanEmail);

  if (error) {
    console.error("Lead activation failed:", error);
    setErrorMessage(error.message || "Could not activate this lead.");
    return;
  }

  setErrorMessage("");
  await fetchCustomers();
};
const updateClientAccess = async (userId, planName, statusName = "active") => {
  const cleanPlan = String(planName || "").trim().toLowerCase();
  const cleanStatus = String(statusName || "active").trim().toLowerCase();

  const { error } = await supabase
    .from("users")
    .update({
      plan: cleanPlan,
      customer_status: cleanStatus,
    })
    .eq("id", userId);

  if (error) {
    console.error("Client access update failed:", error);
    setErrorMessage(error.message || "Could not update client access.");
    return;
  }

  setErrorMessage("");
  await fetchCustomers();
};
const sendClientEmail = async (
  customer,
  type = "intro",
  selectedPlan = "starter"
) => {
  try {
    console.log("SEND CLIENT EMAIL CUSTOMER:", customer);
    console.log("EMAIL TYPE:", type);
    console.log("SELECTED PLAN:", selectedPlan);

    if (!customer?.email) {
      alert("Missing customer email");
      return;
    }

    let monthlyPrice = null;
let agreementUrl = null;

if (type === "agreement") {
  agreementUrl = window.prompt(
    "Paste the client-specific Google Agreement link"
  );

  if (!agreementUrl) {
    alert("Agreement link is required");
    return;
  }
}
    if (type === "activation" || type === "upgrade") {
      const enteredPrice = window.prompt(
        `Enter custom monthly price for ${selectedPlan.toUpperCase()} plan`
      );

      if (enteredPrice === null) {
        return;
      }

      const cleanedPrice = String(enteredPrice)
        .replace("$", "")
        .replace(",", "")
        .trim();

      monthlyPrice = Number(cleanedPrice);

      if (!monthlyPrice || monthlyPrice <= 0) {
        alert("Enter a valid monthly price, like 399");
        return;
      }
    }

    const userId =
      customer.user_id ||
      customer.userId ||
      customer.auth_user_id ||
      customer.authUserId ||
      customer.id ||
      customer.email;

    const payload = {
  to: customer.email,
  restaurantName:
    customer.restaurant_name ||
    customer.restaurantName ||
    customer.business_name ||
    customer.name ||
    "Restaurant",
  type,
  plan: selectedPlan,
  monthlyPrice,
  userId,
  leadId: customer.id || customer.lead_id || "",
  agreementUrl,
};

    console.log("SEND CLIENT EMAIL PAYLOAD:", payload);

    const res = await fetch("/api/send-client-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    console.log("SEND CLIENT EMAIL RESPONSE:", {
      ok: res.ok,
      status: res.status,
      data,
    });

    if (!res.ok) {
      console.error("EMAIL SEND FAILED:", data);
      alert(data?.error || `Email failed with status ${res.status}`);
      return;
    }

    alert(
      `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } email sent successfully`
    );
  } catch (error) {
    console.error("SEND CLIENT EMAIL ERROR:", error);
    alert(error?.message || "Failed to send email");
  }
};





  const resetMonthlyUsage = async () => {
  const confirmed = window.confirm(
    "Reset monthly email/SMS usage for all clients?"
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("users")
    .update({
      emails_sent_this_month: 0,
      sms_sent_this_month: 0,
      email_usage_percent: 0,
      sms_usage_percent: 0,
    })
    .neq("id", "");

  if (error) {
    console.error("Reset monthly usage error:", error);
    alert("Failed to reset usage.");
    return;
  }

  alert("Monthly usage reset.");
  fetchCustomers();
};

const upgradeSuggestionStyle = {
  marginBottom: "12px",
  padding: "10px 14px",
  borderRadius: "12px",
  background: "rgba(245,158,11,0.12)",
  border: "1px solid rgba(245,158,11,0.22)",
  color: "#fbbf24",
  fontWeight: "800",
  fontSize: "13px",
};

const handleLeadUpload = async (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

const fileExtension = file.name.split(".").pop()?.toLowerCase();

const processLeadRows = async (rows) => {
  try {
    const rawLeads = rows.map((row) => ({
      business_name: row["Company"] || row["Restaurant Name"] || "",
      owner_name: row["First Name"] || row["Name"] || "",
      email: row["Email"] || "",
      phone: row["Phone"] || "",
      website: row["Website"] || "",
      city: row["City"] || "",
      state: row["State"] || "",
      employee_count: row["Employees"] || "",
      source: "apollo",
      status: "new",
    }));

    const cleanedLeads = rawLeads.filter(
      (lead) =>
        lead.email &&
        String(lead.email).includes("@") &&
        String(lead.email).includes(".")
    );

    if (!cleanedLeads.length) {
      alert("No valid leads with emails found in this file.");
      return;
    }

    const { error } = await supabase.from("leads").insert(cleanedLeads);

    if (error) {
      console.error(error);
      alert("Lead upload failed");
      return;
    }

    setApolloLeads((prev) => [...cleanedLeads, ...prev]);

    alert(
      `Imported ${cleanedLeads.length} leads. Skipped ${
        rawLeads.length - cleanedLeads.length
      } without valid emails.`
    );
  } catch (err) {
    console.error(err);
    alert("File parsing failed");
  }
};

if (fileExtension === "csv") {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      await processLeadRows(results.data);
    },
  });

  return;
}

if (fileExtension === "xlsx" || fileExtension === "xls") {
  const reader = new FileReader();

  reader.onload = async (e) => {
    const data = e.target.result;
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    await processLeadRows(rows);
  };

  reader.readAsArrayBuffer(file);
  return;
}

alert("Unsupported file type. Please upload CSV, XLSX, or XLS.");

  event.target.value = "";
};





  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingCard}>
          <div style={eyebrow}>SERVEN ADMIN</div>
          <h2 style={loadingTitle}>Loading owner command center...</h2>
        </div>
      </div>
    );
  }

 return (
  <div style={pageStyle}>
  
    <div style={topBar}>
      <div>
        <div style={eyebrow}>SERVEN OWNER PORTAL</div>
        <h1 style={titleStyle}>Admin Command Center</h1>
        <p style={subText}>Logged in as {currentUser?.email}</p>
      </div>

      <button onClick={fetchCustomers} style={refreshButton}>
        Refresh Data
      </button>
      <button onClick={resetMonthlyUsage} style={refreshButton}>
  Reset Monthly Usage
</button>
    </div>
{/* ================================ */}
{/* OWNER EMAIL CENTER */}
{/* ================================ */}
<div
  style={{
    marginBottom: "28px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "radial-gradient(circle at top right, rgba(14,165,233,0.16), transparent 32%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
    border: "1px solid rgba(14,165,233,0.22)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.26)",
  }}
>
  <div style={{ color: "#7dd3fc", fontSize: "12px", fontWeight: "900" }}>
    OWNER EMAIL CENTER
  </div>

  <h2 style={{ color: "white", margin: "6px 0 8px", fontSize: "24px" }}>
    Send client emails
  </h2>

  <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "14px" }}>
    Pick a client and send intro, agreement, activation, or upgrade emails
    through SerVen.
  </p>

  <select
    value={selectedCustomer?.id || ""}
    onChange={(e) => {
      const found = customers.find((c) => c.id === e.target.value);
      setSelectedCustomer(found || null);
    }}
    style={selectStyle}
  >
    <option value="">Select client</option>
    {customers.map((customer) => (
      <option key={customer.id} value={customer.id}>
        {customer.restaurant_name || customer.email} — {customer.email}
      </option>
    ))}
  </select>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: "10px",
      marginTop: "14px",
    }}
  >
    <button
      disabled={!selectedCustomer}
      onClick={() => sendClientEmail(selectedCustomer, "intro")}
      style={{
        ...smallActionButton,
        opacity: selectedCustomer ? 1 : 0.45,
        background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
      }}
    >
      Intro Email
    </button>

    <button
      disabled={!selectedCustomer}
      onClick={() => sendClientEmail(selectedCustomer, "agreement", "growth")}
      style={{
        ...smallActionButton,
        opacity: selectedCustomer ? 1 : 0.45,
        background: "linear-gradient(135deg, #f59e0b, #d97706)",
      }}
    >
      Agreement Email
    </button>

    <button
      disabled={!selectedCustomer}
      onClick={() => sendClientEmail(selectedCustomer, "activation", "growth")}
      style={{
        ...smallActionButton,
        opacity: selectedCustomer ? 1 : 0.45,
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
      }}
    >
      Activation Email
    </button>

    <button
      disabled={!selectedCustomer}
      onClick={() => sendClientEmail(selectedCustomer, "upgrade", "pro")}
      style={{
        ...smallActionButton,
        opacity: selectedCustomer ? 1 : 0.45,
        background: "linear-gradient(135deg, #a855f7, #7c3aed)",
      }}
    >
      Upgrade Email
    </button>
  </div>
</div>

{errorMessage && <div style={errorBox}>{errorMessage}</div>}
<div style={eyebrow}>PLATFORM SNAPSHOT</div>

<h2 style={{ color: "white", fontSize: "24px", fontWeight: "900", marginBottom: "16px" }}>
  Owner Analytics
</h2>
<div style={statsGrid}>
  <StatCard
  label="Campaign Spend"
  value={`$${customers
    .reduce((sum, customer) => sum + Number(customer.estimatedCampaignSpend || 0), 0)
    .toLocaleString()}`}
/>

<StatCard
  label="Active Campaigns"
  value={customers.reduce(
    (sum, customer) => sum + Number(customer.activeCampaigns || 0),
    0
  )}
/>
  <StatCard label="Total Accounts" value={stats.total} />
  <StatCard label="New Leads" value={stats.leads} />
  <StatCard label="Active Clients" value={stats.active} />
  <StatCard label="Open Alerts" value={stats.openAlerts} />

  <StatCard
    label="Estimated MRR"
    value={`$${stats.totalMRR.toLocaleString()}`}
  />

  <StatCard
    label="Client Revenue"
    value={`$${stats.totalClientRevenue.toLocaleString()}`}
  />

  <StatCard
    label="AI Profit Generated"
    value={`$${stats.totalAIProfitGenerated.toLocaleString()}`}
  />

  <StatCard label="AI Actions Applied" value={stats.totalAiActions} />

  <StatCard label="Active Billing" value={stats.activeBilling} />

  <StatCard label="Past Due" value={stats.pastDueBilling} />

  <StatCard
    label="Avg Client Health"
    value={`${stats.avgHealthScore || 0}%`}
  />

  <StatCard label="At-Risk Clients" value={stats.atRiskClients || 0} />
<StatCard
  label="Overage Risk"
  value={
    customers.filter(
      (customer) =>
        Number(customer.emailUsagePercent || 0) >= 80 ||
        Number(customer.smsUsagePercent || 0) >= 80
    ).length
  }
/>
  <StatCard
    label="Pending Activations"
    value={stats.pendingActivations || 0}
  />

  <StatCard
    label="Missing Uploads"
    value={stats.clientsMissingUploads || 0}
  />

  <StatCard
    label="Revenue This Month"
    value={`$${Number(stats.revenueThisMonth || 0).toLocaleString()}`}
  />

  <StatCard label="Starter" value={stats.starter} />
  <StatCard label="Growth" value={stats.growth} />
  <StatCard label="Pro" value={stats.pro} />
</div>
{/* ================================ */}
{/* IMPORT APOLLO LEADS */}
{/* ================================ */}
<div
  style={{
    marginBottom: "28px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 32%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
    border: "1px solid rgba(59,130,246,0.22)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div style={{ color: "#93c5fd", fontSize: "12px", fontWeight: "900" }}>
    IMPORT APOLLO LEADS
  </div>

  <h2 style={{ color: "white", margin: "6px 0 8px", fontSize: "24px" }}>
    Upload prospect CSV
  </h2>

  <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "14px" }}>
    Export restaurant owners from Apollo, then upload the CSV here to save them
    into your SerVen leads table.
  </p>

  <input
    type="file"
    accept=".csv"
    onChange={handleLeadUpload}
    style={{
      width: "100%",
      padding: "14px",
      borderRadius: "14px",
      background: "rgba(15,23,42,0.9)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "white",
    }}
  />
</div>
<div
  style={{
    marginBottom: "28px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
    border: "1px solid rgba(59,130,246,0.22)",
  }}
>
  <div style={eyebrow}>APOLLO SALES PIPELINE</div>

  <h2
    style={{
      color: "white",
      fontSize: "26px",
      fontWeight: "900",
      marginBottom: "18px",
    }}
  >
    Prospect Pipeline
  </h2>

  {!apolloLeads.length ? (
    <div style={{ color: "#94a3b8" }}>
      No Apollo leads uploaded yet.
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        gap: "16px",
      }}
    >
      {apolloLeads.map((lead) => (
        <div
          key={lead.id}
          style={{
            padding: "18px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.14)",
          }}
        >
          <div
            style={{
              color: "white",
              fontWeight: "900",
              fontSize: "18px",
            }}
          >
            {lead.business_name || "Restaurant"}
          </div>

          <div
            style={{
              color: "#94a3b8",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            {lead.email}
          </div>

          <div
            style={{
              marginTop: "12px",
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.7,
            }}
          >
            <div>Owner: {lead.owner_name || "Unknown"}</div>
            <div>Phone: {lead.phone || "Unknown"}</div>
            <div>City: {lead.city || "Unknown"}</div>
          </div>

          <div
            style={{
              marginTop: "14px",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(59,130,246,0.14)",
              display: "inline-flex",
              color: "#93c5fd",
              fontSize: "11px",
              fontWeight: "900",
              textTransform: "uppercase",
            }}
          >
            {lead.status || "new"}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            <button
              onClick={() =>
                updateLeadStatus(lead.id, "contacted")
              }
              style={smallActionButton}
            >
              Contacted
            </button>

            <button
              onClick={() =>
                updateLeadStatus(lead.id, "follow_up")
              }
              style={smallActionButton}
            >
              Follow Up
            </button>

            <button
              onClick={() =>
                updateLeadStatus(lead.id, "interested")
              }
              style={smallActionButton}
            >
              Interested
            </button>

            <button
              onClick={() =>
                updateLeadStatus(lead.id, "demo_scheduled")
              }
              style={smallActionButton}
            >
              Demo
            </button>

            <button
              onClick={() =>
                updateLeadStatus(lead.id, "closed_won")
              }
              style={{
                ...smallActionButton,
                background:
                  "linear-gradient(135deg,#22c55e,#16a34a)",
              }}
            >
              Closed Won
            </button>

            <button
              onClick={() =>
                updateLeadStatus(lead.id, "closed_lost")
              }
              style={{
                ...smallActionButton,
                background:
                  "linear-gradient(135deg,#ef4444,#dc2626)",
              }}
            >
              Closed Lost
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
{/* ================================ */}
{/* OVERAGE RISK CLIENTS */}
{/* ================================ */}
<div
  style={{
    marginBottom: "28px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(15,23,42,0.96))",
    border: "1px solid rgba(245,158,11,0.22)",
  }}
>
  <div style={eyebrow}>USAGE MONITORING</div>

  <h2 style={{ color: "white", fontSize: "24px", fontWeight: "900" }}>
    Overage Risk Clients
  </h2>

  {customers.filter(
    (customer) =>
      Number(customer.emailUsagePercent || 0) >= 80 ||
      Number(customer.smsUsagePercent || 0) >= 80
  ).length === 0 ? (
    <p style={{ color: "#94a3b8" }}>No clients are near usage limits.</p>
  ) : (
    <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
      {customers
        .filter(
          (customer) =>
            Number(customer.emailUsagePercent || 0) >= 80 ||
            Number(customer.smsUsagePercent || 0) >= 80
        )
        .map((customer) => (
          <div
            key={customer.id}
            style={{
              padding: "14px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(245,158,11,0.16)",
            }}
          >
            <div style={{ color: "white", fontWeight: "900" }}>
              {customer.restaurant_name || "Restaurant"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
              {customer.email}
            </div>

            <div style={{ color: "#fbbf24", fontWeight: "900", marginTop: "8px" }}>
              Email: {customer.emailUsagePercent || 0}% · SMS:{" "}
              {customer.smsUsagePercent || 0}%
            </div>
          </div>
        ))}
    </div>
  )}
</div>

{/* ================================ */}
{/* AT RISK CLIENTS */}
{/* ================================ */}
<div
  style={{
    marginBottom: "28px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(127,29,29,0.22), rgba(15,23,42,0.96))",
    border: "1px solid rgba(239,68,68,0.22)",
    boxShadow: "0 24px 60px rgba(2,6,23,0.24)",
  }}
>
  <div style={eyebrow}>CLIENT RETENTION</div>

  <h2
    style={{
      color: "white",
      fontSize: "28px",
      fontWeight: "900",
      marginTop: "6px",
      marginBottom: "18px",
    }}
  >
    At-Risk Clients
  </h2>

  {customers.filter((customer) => customer.healthScore <= 55).length === 0 ? (
    <div
      style={{
        color: "#94a3b8",
        fontSize: "14px",
      }}
    >
      No high-risk clients detected.
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gap: "14px",
      }}
    >
      {customers
        .filter((customer) => customer.healthScore <= 55)
        .slice(0, 6)
        .map((customer) => (
          <div
            key={customer.id}
            style={{
              padding: "18px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(239,68,68,0.14)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color: "white",
                    fontWeight: "800",
                    fontSize: "18px",
                  }}
                >
                  {customer.restaurant_name || "Restaurant"}
                </div>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    marginTop: "4px",
                  }}
                >
                  {customer.email}
                </div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "rgba(239,68,68,0.14)",
                  color: "#fca5a5",
                  fontWeight: "900",
                  fontSize: "14px",
                }}
              >
                {customer.healthScore}% Health
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              <div style={miniTagStyle}>
                {customer.openAlerts || 0} Alerts
              </div>

              <div style={miniTagStyle}>
                {customer.billingStatus || "unknown"} Billing
              </div>

              <div style={miniTagStyle}>
                Plan: {customer.plan || "starter"}
              </div>
            </div>
          </div>
        ))}
    </div>
  )}
</div>
{/* ================================ */}
{/* MISSING UPLOADS */}
{/* ================================ */}
<div
  style={{
    marginBottom: "28px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(15,23,42,0.96))",
    border: "1px solid rgba(245,158,11,0.22)",
  }}
>
  <div style={eyebrow}>DATA ACTIVITY</div>

  <h2 style={{ color: "white", fontSize: "24px", fontWeight: "900" }}>
    Clients Missing Uploads
  </h2>

  {customers.filter((customer) => !customer.lastUpload).length === 0 ? (
    <p style={{ color: "#94a3b8" }}>All clients have uploaded data.</p>
  ) : (
    <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
      {customers
        .filter((customer) => !customer.lastUpload)
        .slice(0, 8)
        .map((customer) => (
          <div
            key={customer.id}
            style={{
              padding: "14px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(245,158,11,0.16)",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ color: "white", fontWeight: "800" }}>
                {customer.restaurant_name || "Restaurant"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {customer.email}
              </div>
            </div>

            <div style={{ color: "#fbbf24", fontWeight: "900" }}>
              No upload detected
            </div>
          </div>
        ))}
    </div>
  )}
</div>
{/* ================================ */}
{/* RECENT CLIENT ACTIVITY */}
{/* ================================ */}
<div
  style={{
    marginBottom: "28px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(15,23,42,0.96))",
    border: "1px solid rgba(59,130,246,0.22)",
  }}
>
  <div style={eyebrow}>CLIENT ACTIVITY</div>

  <h2 style={{ color: "white", fontSize: "24px", fontWeight: "900" }}>
    Recent Client Activity
  </h2>

  <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
    {[...customers]
      .filter((customer) => customer.lastUpload)
      .sort((a, b) => new Date(b.lastUpload) - new Date(a.lastUpload))
      .slice(0, 8)
      .map((customer) => (
        <div
          key={customer.id}
          style={{
            padding: "14px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(59,130,246,0.16)",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "800" }}>
              {customer.restaurant_name || "Restaurant"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              {customer.email}
            </div>
          </div>

          <div style={{ color: "#93c5fd", fontWeight: "900" }}>
            Last upload:{" "}
            {customer.lastUpload
              ? new Date(customer.lastUpload).toLocaleDateString()
              : "Never"}
          </div>
        </div>
      ))}
  </div>
</div>
    <div style={controlBar}>
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
        <option value="trial">Trial</option>
        <option value="active">Active</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select
        value={billingFilter}
        onChange={(e) => setBillingFilter(e.target.value)}
        style={selectStyle}
      >
        <option value="all">All Billing</option>
        <option value="active">Active</option>
        <option value="trialing">Trialing</option>
        <option value="past_due">Past Due</option>
        <option value="unpaid">Unpaid</option>
        <option value="canceled">Canceled</option>
        <option value="unknown">Unknown</option>
      </select>
    </div>

    {/* ================================ */}
    {/* OWNER CUSTOM PLAN LEADS PANEL */}
    {/* ================================ */}

    <div
      style={{
        marginBottom: "28px",
        padding: "24px",
        borderRadius: "24px",
        background:
          "radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 28%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))",
        border: "1px solid rgba(59,130,246,0.22)",
        boxShadow: "0 24px 60px rgba(2,6,23,0.28)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={eyebrow}>SALES PIPELINE</div>
          <h2
            style={{
              color: "white",
              fontSize: "28px",
              fontWeight: "900",
              margin: 0,
            }}
          >
            Custom Plan Leads
          </h2>
        </div>

        <div
          style={{
            padding: "10px 14px",
            borderRadius: "14px",
            background: "rgba(59,130,246,0.14)",
            border: "1px solid rgba(59,130,246,0.24)",
            color: "#93c5fd",
            fontWeight: "800",
            fontSize: "13px",
          }}
        >
          {customPlanLeads?.length || 0} Leads
        </div>
      </div>

      {!customPlanLeads?.length ? (
        <div
          style={{
            padding: "28px",
            borderRadius: "18px",
            textAlign: "center",
            background: "rgba(15,23,42,0.65)",
            border: "1px dashed rgba(148,163,184,0.22)",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "white",
              marginBottom: "8px",
            }}
          >
            No custom leads yet
          </div>

          <div style={{ color: "#94a3b8", fontSize: "14px" }}>
            Leads from the pricing calculator will appear here automatically.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
            gap: "18px",
          }}
        >
          {customPlanLeads.map((lead) => {
            const recommendedPlan = String(
              lead.recommended_plan || "starter"
            ).toLowerCase();

            return (
              <div
                key={lead.id}
                style={{
                  padding: "22px",
                  borderRadius: "20px",
                  background:
                    "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.82))",
                  border: "1px solid rgba(148,163,184,0.16)",
                }}
              >
                <div style={{ marginBottom: "18px" }}>
                  <div
                    style={{
                      color: "white",
                      fontWeight: "900",
                      fontSize: "20px",
                      marginBottom: "4px",
                    }}
                  >
                    {lead.restaurant_name || "Restaurant Lead"}
                  </div>

                  <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                    {lead.email || "No email"}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "18px",
                  }}
                >
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                      Monthly Revenue
                    </div>
                    <div
                      style={{
                        color: "white",
                        fontSize: "20px",
                        fontWeight: "900",
                      }}
                    >
                      ${Number(lead.monthly_revenue || 0).toLocaleString()}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                      Estimated ROI
                    </div>
                    <div
                      style={{
                        color: "#22c55e",
                        fontSize: "20px",
                        fontWeight: "900",
                      }}
                    >
                      ${Number(lead.estimated_roi || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginBottom: "18px",
                    color: "#cbd5e1",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Recommended</span>
                    <strong style={{ color: "white", textTransform: "capitalize" }}>
                      {recommendedPlan}
                    </strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Locations</span>
                    <strong style={{ color: "white" }}>{lead.locations || 1}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Employees</span>
                    <strong style={{ color: "white" }}>{lead.staff_count || 0}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Submitted</span>
                    <strong style={{ color: "white" }}>
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString()
                        : "Recently"}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(148,163,184,0.12)",
                  }}
                >
                  <button
                    onClick={() => activateCustomLead(lead.email, "starter")}
                    style={smallActionButton}
                  >
                    Starter
                  </button>

                  <button
                    onClick={() => activateCustomLead(lead.email, "growth")}
                    style={smallActionButton}
                  >
                    Growth
                  </button>

                  <button
                    onClick={() => activateCustomLead(lead.email, "pro")}
                    style={{
                      ...smallActionButton,
                      background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                    }}
                  >
                    Pro
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    
    {/* ================================ */}
{/* CUSTOMER MANAGEMENT CARDS */}
{/* ================================ */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
    marginTop: "22px",
  }}
>
  {filteredCustomers.map((customer) => (
    <div
      key={customer.id}
      style={{
        padding: "20px",
        borderRadius: "22px",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
      }}
    >
  {customer.overLimit && (
  <div
  style={{
    marginBottom: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(239,68,68,0.24)",
    color: "#fca5a5",
    fontWeight: "900",
    fontSize: "13px",
    lineHeight: 1.5,
  }}
>
  🚨 Usage limit exceeded — upgrade or reduce campaign activity
</div>
)}
{Number(customer.emailUsagePercent || 0) >= 80 && (
  <div style={upgradeSuggestionStyle}>
    Recommended upgrade: Growth Plan
  </div>
)}
{Number(customer.emailUsagePercent || 0) >= 95 && (
  <div style={upgradeSuggestionStyle}>
    High usage detected — Pro Plan recommended
  </div>
)}
      <div style={{ marginBottom: "16px" }}>

        <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>
          {customer.restaurant_name || "Unnamed Restaurant"}
        </div>

        <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
          {customer.email}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div style={adminMiniBox}>
          <div style={adminMiniLabel}>Plan</div>
          <div style={adminMiniValue}>{customer.plan || "starter"}</div>
        </div>

        <div style={adminMiniBox}>
          <div style={adminMiniLabel}>Status</div>
          <div style={adminMiniValue}>{customer.customer_status || "lead"}</div>
        </div>

        <div style={adminMiniBox}>
          <div style={adminMiniLabel}>Revenue</div>
          <div style={adminMiniValue}>
            ${Number(customer.totalRevenue || 0).toLocaleString()}
          </div>
        </div>

        <div style={adminMiniBox}>
          <div style={adminMiniLabel}>Health</div>
          <div style={adminMiniValue}>{customer.healthScore}%</div>
        </div>

        <div style={adminMiniBox}>
  <div style={adminMiniLabel}>Email Usage</div>

  <div style={adminMiniValue}>
    {Number(customer.emails_sent_this_month || 0).toLocaleString()} /{" "}
    {customer.plan === "pro"
      ? "25,000"
      : customer.plan === "growth"
      ? "5,000"
      : "500"}
  </div>
</div>

        <div style={adminMiniBox}>
  <div style={adminMiniLabel}>SMS Usage</div>

  <div style={adminMiniValue}>
    {Number(customer.sms_sent_this_month || 0).toLocaleString()} /{" "}
    {customer.plan === "pro"
      ? "10,000"
      : customer.plan === "growth"
      ? "2,500"
      : "250"}
  </div>
</div>

       <div style={adminMiniBox}>
  <div style={adminMiniLabel}>Email Limit</div>

  <div style={adminMiniValue}>
    {customer.emailUsagePercent || 0}%
  </div>

  <div
    style={{
      marginTop: "8px",
      height: "8px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.06)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${customer.emailUsagePercent || 0}%`,
        height: "100%",
        background:
          Number(customer.emailUsagePercent || 0) >= 80
            ? "#f59e0b"
            : "#22c55e",
        borderRadius: "999px",
      }}
    />
  </div>
</div>

      <div style={adminMiniBox}>
  <div style={adminMiniLabel}>SMS Limit</div>

  <div style={adminMiniValue}>
    {customer.smsUsagePercent || 0}%
  </div>

  <div
    style={{
      marginTop: "8px",
      height: "8px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.06)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${customer.smsUsagePercent || 0}%`,
        height: "100%",
        background:
          Number(customer.smsUsagePercent || 0) >= 80
            ? "#f59e0b"
            : "#22c55e",
        borderRadius: "999px",
      }}
    />
  </div>
</div>

<div style={adminMiniBox}>
  <div style={adminMiniLabel}>Campaign Spend</div>

  <div style={adminMiniValue}>
    ${Number(customer.estimatedCampaignSpend || 0).toLocaleString()}
  </div>
</div>

<div style={adminMiniBox}>
  <div style={adminMiniLabel}>Active Campaigns</div>

  <div style={adminMiniValue}>
    {Number(customer.activeCampaigns || 0)}
  </div>
</div>

<div
  style={{
    gridColumn: "1 / -1",
    padding: "12px 14px",
    borderRadius: "14px",
    background:
      customer.overLimit
        ? "rgba(239,68,68,0.12)"
        : customer.nearingOverage
        ? "rgba(245,158,11,0.12)"
        : Number(customer.activeCampaigns || 0) > 0
        ? "rgba(34,197,94,0.10)"
        : "rgba(148,163,184,0.08)",
    border:
      customer.overLimit
        ? "1px solid rgba(239,68,68,0.22)"
        : customer.nearingOverage
        ? "1px solid rgba(245,158,11,0.22)"
        : Number(customer.activeCampaigns || 0) > 0
        ? "1px solid rgba(34,197,94,0.18)"
        : "1px solid rgba(148,163,184,0.14)",
    color:
      customer.overLimit
        ? "#fca5a5"
        : customer.nearingOverage
        ? "#fbbf24"
        : Number(customer.activeCampaigns || 0) > 0
        ? "#86efac"
        : "#cbd5e1",
    fontSize: "13px",
    fontWeight: "900",
  }}
>
  {customer.overLimit
    ? "🚨 Marketing blocked — usage limit reached"
    : customer.nearingOverage
    ? "⚠️ Marketing usage near plan limit"
    : Number(customer.activeCampaigns || 0) > 0
    ? "🟢 Marketing active"
    : "⚪ No active marketing campaigns"}
</div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "8px",
        }}
      >
        <button
          onClick={() => updateClientAccess(customer.id, "starter", "active")}
          style={smallActionButton}
        >
          Activate Starter
        </button>

        <button
          onClick={() => updateClientAccess(customer.id, "growth", "active")}
          style={smallActionButton}
        >
          Activate Growth
        </button>

        <button
          onClick={() => updateClientAccess(customer.id, "pro", "active")}
          style={{
            ...smallActionButton,
            background: "linear-gradient(135deg, #7c3aed, #9333ea)",
          }}
        >
          Activate Pro
        </button>

        <button
          onClick={() => updateClientAccess(customer.id, "none", "paused")}
          style={{
            ...smallActionButton,
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
          }}
        >
          Pause Access
        </button>
      </div>
    </div>
  ))}
</div>

  </div>
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

/* ================= STYLES ================= */

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(124,58,237,0.22), transparent 30%), #020617",
  padding: "40px",
  fontFamily: "Inter, system-ui, sans-serif",
  color: "white",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "28px",
};

const eyebrow = {
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "0.14em",
  color: "#a78bfa",
  marginBottom: "8px",
};

const titleStyle = {
  fontSize: "34px",
  fontWeight: "900",
  margin: 0,
};

const subText = {
  color: "#94a3b8",
  fontSize: "13px",
  marginTop: "8px",
};

const refreshButton = {
  padding: "12px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
  color: "white",
  fontWeight: "800",
  cursor: "pointer",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "14px",
  marginBottom: "22px",
};

const statCard = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(15,23,42,0.82)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
};

const statLabel = {
  color: "#94a3b8",
  fontSize: "12px",
  marginBottom: "8px",
};

const statValue = {
  fontSize: "26px",
  fontWeight: "900",
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

const layoutGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 380px",
  gap: "20px",
  alignItems: "start",
};

const tableCard = {
  borderRadius: "20px",
  overflowX: "auto",
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns:
    "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 3fr",
  gap: "14px",
  padding: "16px",
  background: "rgba(255,255,255,0.06)",
  color: "#c4b5fd",
  fontSize: "12px",
  fontWeight: "900",
  textTransform: "uppercase",
  minWidth: "1700px",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns:
    "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 3fr",
  gap: "14px",
  alignItems: "center",
  padding: "16px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  cursor: "pointer",
  minWidth: "1700px",
};

const customerName = {
  fontWeight: "800",
  color: "white",
};

const customerEmail = {
  color: "#94a3b8",
  fontSize: "12px",
  marginTop: "4px",
};

const mutedText = {
  color: "#cbd5e1",
  fontSize: "13px",
};

const aiProfitText = {
  color: "#6ee7b7",
  fontSize: "13px",
  fontWeight: "900",
};

const tinyText = {
  color: "#64748b",
  fontSize: "11px",
  marginTop: "5px",
};

const miniSelect = {
  padding: "7px",
  borderRadius: "8px",
  background: "#020617",
  color: "white",
  border: "1px solid rgba(255,255,255,0.1)",
  width: "100%",
};

const notesInput = {
  padding: "7px",
  borderRadius: "8px",
  background: "#020617",
  color: "white",
  border: "1px solid rgba(255,255,255,0.1)",
  width: "100%",
  marginBottom: "8px",
};

const smallButton = {
  padding: "7px 9px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(124,58,237,0.18)",
  color: "#ddd6fe",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "800",
};

const healthBadge = (score) => ({
  display: "inline-flex",
  padding: "7px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "900",
  background:
    score >= 80
      ? "rgba(34,197,94,0.16)"
      : score >= 60
      ? "rgba(234,179,8,0.16)"
      : "rgba(239,68,68,0.16)",
  color: score >= 80 ? "#4ade80" : score >= 60 ? "#fde047" : "#f87171",
});

const billingBadge = (status = "unknown") => {
  const normalized = String(status || "unknown").toLowerCase();

  const good = ["active", "trialing", "paid"].includes(normalized);
  const bad = ["past_due", "unpaid", "canceled", "cancelled"].includes(
    normalized
  );

  return {
    display: "inline-flex",
    padding: "6px 9px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "900",
    textTransform: "uppercase",
    background: good
      ? "rgba(34,197,94,0.16)"
      : bad
      ? "rgba(239,68,68,0.16)"
      : "rgba(148,163,184,0.14)",
    color: good ? "#4ade80" : bad ? "#f87171" : "#cbd5e1",
  };
};

const alertText = {
  color: "#f87171",
  fontSize: "13px",
  fontWeight: "800",
};

const sidePanel = {
  position: "sticky",
  top: "24px",
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(255,255,255,0.1)",
  maxHeight: "calc(100vh - 48px)",
  overflowY: "auto",
};

const sideTitle = {
  margin: "0 0 14px",
  fontSize: "20px",
};

const sideText = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: 1.6,
};

const detailBlock = {
  marginBottom: "14px",
};

const detailLabel = {
  color: "#64748b",
  fontSize: "11px",
  textTransform: "uppercase",
  fontWeight: "900",
};

const detailValue = {
  color: "white",
  fontSize: "14px",
  marginTop: "4px",
  wordBreak: "break-word",
};

const sectionDivider = {
  height: "1px",
  background: "rgba(255,255,255,0.1)",
  margin: "18px 0",
};

const miniHeading = {
  margin: "0 0 12px",
};

const alertCard = {
  padding: "12px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "12px",
};

const aiActionCard = {
  padding: "12px",
  borderRadius: "14px",
  background:
    "radial-gradient(circle at top right, rgba(16,185,129,0.12), transparent 34%), rgba(255,255,255,0.04)",
  border: "1px solid rgba(16,185,129,0.16)",
  marginBottom: "12px",
};

const aiBadge = {
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: "900",
  background: "rgba(34,197,94,0.16)",
  color: "#4ade80",
};

const alertTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
};

const severityBadge = (severity) => ({
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: "900",
  background:
    severity === "high"
      ? "rgba(239,68,68,0.18)"
      : severity === "low"
      ? "rgba(34,197,94,0.16)"
      : "rgba(234,179,8,0.16)",
  color:
    severity === "high"
      ? "#f87171"
      : severity === "low"
      ? "#4ade80"
      : "#fde047",
});

const loadingCard = {
  padding: "28px",
  borderRadius: "20px",
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const loadingTitle = {
  margin: 0,
};

const errorBox = {
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.28)",
  color: "#fecaca",
  marginBottom: "18px",
};

const emptyState = {
  padding: "30px",
  color: "#94a3b8",
  textAlign: "center",
};
const leadsPanel = {
  marginBottom: "28px",
  padding: "20px",
  borderRadius: "20px",
  background:
    "radial-gradient(circle at top right, rgba(109,61,245,0.25), transparent 40%), rgba(15,23,42,0.9)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const leadCard = {
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "12px",
};

const leadTopRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
};

const leadGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "10px",
  marginTop: "12px",
  marginBottom: "12px",
  color: "#94a3b8",
  fontSize: "12px",
};

const leadStatusBadge = (status = "new") => ({
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: "900",
  textTransform: "uppercase",
  background:
    status === "contacted"
      ? "rgba(34,197,94,0.16)"
      : "rgba(234,179,8,0.16)",
  color: status === "contacted" ? "#4ade80" : "#fde047",
});
const smallActionButton = {
  padding: "10px 12px",
  borderRadius: "12px",
  border: "none",
  cursor: "pointer",
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  color: "white",
  fontWeight: "800",
  fontSize: "12px",
};
const adminMiniBox = {
  padding: "12px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(148,163,184,0.12)",
};

const adminMiniLabel = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "800",
  marginBottom: "5px",
};

const adminMiniValue = {
  color: "white",
  fontSize: "14px",
  fontWeight: "900",
  textTransform: "capitalize",
};
