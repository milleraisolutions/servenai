"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import OwnerLeadsPanel from "../dashboard/components/OwnerLeadsPanel";
const OWNER_EMAILS = [
  "antoinemiller@servenai.com",
  "milleraisolutions21@gmail.com",
  "millerantoine2137@gmail.com",
];

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
  const [adminView, setAdminView] = useState("executive");
  // New State for your real Supabase demo_leads table
  const [demoLeads, setDemoLeads] = useState([]);

  const isOwner = OWNER_EMAILS.includes(
    String(currentUser?.email || "").toLowerCase()
  );

  // Initial access check
  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Fetch Custom Plan Requests if Authorized Owner
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

    if (!OWNER_EMAILS.includes(String(user?.email || "").toLowerCase())) {
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
.or("hidden_from_admin.is.null,hidden_from_admin.eq.false")
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
      setApolloLeads(leadsData || []);
    }

    // FETCH FROM YOUR SUPABASE DEMO_LEADS TABLE
    const { data: demoLeadsData, error: demoLeadsError } = await supabase
      .from("demo_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (demoLeadsError) {
      console.error("DEMO LEADS FETCH ERROR:", demoLeadsError);
      setDemoLeads([]);
    } else {
      setDemoLeads(demoLeadsData || []);
    }

    setAlerts(alertData || []);
    setAiActions(aiActionData || []);

    const customersWithMetrics = (usersData || []).map((customer) => {
      const customerSales = (salesData || []).filter((sale) => sale.user_id === customer.id);
      const customerAlerts = (alertData || []).filter((alert) => alert.user_id === customer.id);
      const customerAiActions = (aiActionData || []).filter((action) => action.user_id === customer.id);
      const customerUsage = (marketingUsageData || []).filter((usage) => usage.user_id === customer.id);
      const customerCampaigns = (campaignData || []).filter((campaign) => campaign.user_id === customer.id);

      const emailUsageThisMonth = customerUsage
        .filter((usage) => usage.usage_type === "email")
        .reduce((sum, usage) => sum + Number(usage.quantity || 0), 0);

      const smsUsageThisMonth = customerUsage
        .filter((usage) => usage.usage_type === "sms")
        .reduce((sum, usage) => sum + Number(usage.quantity || 0), 0);

      const emailLimit = Number(customer.monthly_email_limit || 0) || 5000;
      const smsLimit = Number(customer.monthly_sms_limit || 0) || 500;

      const emailUsagePercent = emailLimit > 0 ? Math.round((emailUsageThisMonth / emailLimit) * 100) : 0;
      const smsUsagePercent = smsLimit > 0 ? Math.round((smsUsageThisMonth / smsLimit) * 100) : 0;

      const nearingOverage = emailUsagePercent >= 80 || smsUsagePercent >= 80;
      const overLimit = emailUsagePercent >= 100 || smsUsagePercent >= 100;

      const estimatedCampaignSpend = customerCampaigns.reduce((sum, campaign) => sum + Number(campaign.estimated_cost || 0), 0);
      const activeCampaigns = customerCampaigns.filter((campaign) => campaign.active === true).length;
      const expectedCampaignRevenue = customerCampaigns.reduce((sum, campaign) => sum + Number(campaign.expected_revenue || 0), 0);
      const campaignCount = customerCampaigns.length;
      const totalRevenue = customerSales.reduce((sum, sale) => sum + Number(sale.revenue || 0), 0);
      const aiProfitGenerated = customerAiActions.reduce((sum, action) => sum + Number(action.impact_value || 0), 0);
      const openAlerts = customerAlerts.filter((alert) => String(alert.status || "open").toLowerCase() !== "closed").length;

      const lastUpload = customerSales.length
        ? customerSales
            .map((sale) => sale.created_at)
            .filter(Boolean)
            .sort()
            .reverse()[0]
        : null;

      const billingStatus = String(
        customer.subscription_status || customer.billing_status || customer.stripe_status || "unknown"
      ).toLowerCase();

      const healthScore = calculateHealthScore({ openAlerts, totalRevenue, lastUpload, billingStatus });

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

  const calculateHealthScore = ({ openAlerts, totalRevenue, lastUpload, billingStatus }) => {
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
          ? { ...lead, status: newStatus, last_contacted_at: new Date().toISOString() }
          : lead
      )
    );
  };

  // Delete function for Apollo Leads pipeline cards
  const deleteLead = async (leadId) => {
    const confirmed = window.confirm("Are you sure you want to delete this lead permanently?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadId);

    if (error) {
      console.error("Lead deletion failed:", error);
      alert("Could not delete lead");
      return;
    }

    setApolloLeads((prev) => prev.filter((lead) => lead.id !== leadId));
  };

  // Delete function for Inbound Website Demos
  const deleteDemoLead = async (demoId) => {
    const confirmed = window.confirm("Permanently delete this website demo request?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("demo_leads")
      .delete()
      .eq("id", demoId);

    if (error) {
      console.error("Demo deletion failed:", error);
      alert("Could not delete demo request");
      return;
    }

    setDemoLeads((prev) => prev.filter((demo) => demo.id !== demoId));
  };
const deleteCustomer = async (customerId) => {
  const confirmed = window.confirm(
    "Remove this client from the admin view?"
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("users")
    .update({ hidden_from_admin: true })
    .eq("id", customerId);

  if (error) {
    console.error("Client hide failed:", error);
    alert("Could not remove client from admin view.");
    return;
  }

  setCustomers((prev) =>
    prev.filter((customer) => customer.id !== customerId)
  );
};
  const sendClientEmail = async (customer, type = "intro", selectedPlan = "starter") => {
    try {
      if (!customer?.email) {
        alert("Missing customer email");
        return;
      }

      let monthlyPrice = null;
      let agreementUrl = null;

      if (type === "agreement") {
        agreementUrl = window.prompt("Paste the client-specific Google Agreement link");
        if (!agreementUrl) {
          alert("Agreement link is required");
          return;
        }
      }

      if (type === "activation" || type === "upgrade") {
        const enteredPrice = window.prompt(`Enter custom monthly price for ${selectedPlan.toUpperCase()} plan`);
        if (enteredPrice === null) return;

        const cleanedPrice = String(enteredPrice).replace("$", "").replace(",", "").trim();
        monthlyPrice = Number(cleanedPrice);

        if (!monthlyPrice || monthlyPrice <= 0) {
          alert("Enter a valid monthly price, like 399");
          return;
        }
      }

      const userId = customer.id || customer.email;

      const payload = {
        to: customer.email,
        restaurantName: customer.restaurant_name || "Restaurant",
        type,
        plan: selectedPlan,
        monthlyPrice,
        userId,
        leadId: customer.id || "",
        agreementUrl,
      };

      const res = await fetch("/api/send-client-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || `Email failed with status ${res.status}`);
        return;
      }

      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} email sent successfully`);
    } catch (error) {
      console.error("SEND CLIENT EMAIL ERROR:", error);
      alert(error?.message || "Failed to send email");
    }
  };

  const resetMonthlyUsage = async () => {
    const confirmed = window.confirm("Reset monthly email/SMS usage for all clients?");
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
          (lead) => lead.email && String(lead.email).includes("@") && String(lead.email).includes(".")
        );

        if (!cleanedLeads.length) {
          alert("No valid leads with emails found in this file.");
          return;
        }

        const { error } = await supabase.from("leads").insert(cleanedLeads);
        if (error) {
          alert("Lead upload failed");
          return;
        }

        setApolloLeads((prev) => [...cleanedLeads, ...prev]);
        alert(`Imported ${cleanedLeads.length} leads.`);
      } catch (err) {
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
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        await processLeadRows(rows);
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    alert("Unsupported file type.");
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        String(customer.restaurant_name || "").toLowerCase().includes(search) ||
        String(customer.email || "").toLowerCase().includes(search) ||
        String(customer.business_type || "").toLowerCase().includes(search);

      const customerPlan = String(customer.plan || "starter").toLowerCase();
      const customerStatus = String(customer.customer_status || "lead").toLowerCase();
      const customerBilling = String(customer.billingStatus || "unknown").toLowerCase();

      const matchesPlan = planFilter === "all" ? true : customerPlan === planFilter;
      const matchesStatus = statusFilter === "all" ? true : customerStatus === statusFilter;
      const matchesBilling = billingFilter === "all" ? true : customerBilling === billingFilter;

      return matchesSearch && matchesPlan && matchesStatus && matchesBilling;
    });
  }, [customers, searchTerm, planFilter, statusFilter, billingFilter]);

  const stats = useMemo(() => {
    const starter = customers.filter((c) => String(c.plan || "starter").toLowerCase() === "starter").length;
    const growth = customers.filter((c) => String(c.plan || "").toLowerCase() === "growth").length;
    const pro = customers.filter((c) => String(c.plan || "").toLowerCase() === "pro").length;
    const leads = customers.filter((c) => String(c.customer_status || "lead").toLowerCase() === "lead").length;
    const active = customers.filter((c) => String(c.customer_status || "").toLowerCase() === "active").length;
    const openAlerts = customers.reduce((sum, c) => sum + Number(c.openAlerts || 0), 0);
    const totalClientRevenue = customers.reduce((sum, c) => sum + Number(c.totalRevenue || 0), 0);
    const totalAIProfitGenerated = customers.reduce((sum, c) => sum + Number(c.aiProfitGenerated || 0), 0);
    const activeBilling = customers.filter((c) => ["active", "trialing", "paid"].includes(String(c.billingStatus || ""))).length;
    const pastDueBilling = customers.filter((c) => ["past_due", "unpaid"].includes(String(c.billingStatus || ""))).length;
    const totalMRR = starter * 149 + growth * 299 + pro * 499;

    const avgHealthScore = customers.length > 0 
      ? Math.round(customers.reduce((sum, c) => sum + Number(c.healthScore || 0), 0) / customers.length) 
      : 0;

    const atRiskClients = customers.filter((c) => 
      Number(c.healthScore || 0) <= 55 || ["past_due", "unpaid"].includes(String(c.billingStatus || "").toLowerCase())
    ).length;

    return {
      total: customers.length, starter, growth, pro, leads, active, openAlerts,
      totalMRR, totalClientRevenue, totalAIProfitGenerated, activeBilling, pastDueBilling,
      totalAiActions: aiActions.length, avgHealthScore, atRiskClients
    };
  }, [customers, aiActions]);

  const overageRiskClients = useMemo(() => {
    return customers.filter((c) => Number(c.emailUsagePercent || 0) >= 80 || Number(c.smsUsagePercent || 0) >= 80);
  }, [customers]);

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
    <div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  <button
    onClick={fetchCustomers}
    style={refreshButton}
  >
    Refresh Data
  </button>

  <button
    onClick={resetMonthlyUsage}
    style={refreshButton}
  >
    Reset Monthly Usage
  </button>

  <button
    onClick={async () => {
      await supabase.auth.signOut();
      router.push("/login");
    }}
    style={{
      ...refreshButton,
      background: "linear-gradient(135deg,#ef4444,#dc2626)",
      color: "#fff",
    }}
  >
    Log Out
  </button>
</div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={statCardStyle}>
      <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "white", fontSize: "24px", fontWeight: "900", marginTop: "4px" }}>{value}</div>
    </div>
  );
}

/* ================= STYLES ================= */
const pageStyle = { minHeight: "100vh", backgroundColor: "#0f172a", padding: "40px", fontFamily: "sans-serif" };
const loadingCard = { padding: "40px", background: "#1e293b", borderRadius: "16px", textAlign: "center", width: "400px", margin: "100px auto" };
const loadingTitle = { color: "white", fontSize: "18px", marginTop: "10px" };
const topBar = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid #334155", paddingBottom: "20px" };
const eyebrow = { color: "#6366f1", fontSize: "11px", fontWeight: "800", letterSpacing: "1.5px" };
const titleStyle = { color: "white", fontSize: "32px", fontWeight: "900", margin: "4px 0" };
const subText = { color: "#94a3b8", fontSize: "14px" };
const refreshButton = { padding: "10px 18px", background: "#1e293b", color: "white", border: "1px solid #334155", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px" };
const selectStyle = { width: "100%", padding: "12px", borderRadius: "12px", background: "#0f172a", border: "1px solid #334155", color: "white", outline: "none" };
const inputStyle = { padding: "12px", borderRadius: "12px", background: "#0f172a", border: "1px solid #334155", color: "white", outline: "none" };
const labelStyle = { display: "block", color: "#94a3b8", fontSize: "11px", marginBottom: "4px", textTransform: "uppercase", fontWeight: "bold" };
const gridActionWrapper = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginTop: "14px" };
const smallActionButton = { padding: "10px", borderRadius: "10px", border: "none", color: "white", fontWeight: "bold", fontSize: "12px", cursor: "pointer", background: "#334155" };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" };
const statCardStyle = { padding: "20px", background: "#1e293b", borderRadius: "16px", border: "1px solid #334155" };
const errorBox = { background: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: "10px", marginBottom: "20px" };
const fileInputStyle = { width: "100%", padding: "14px", borderRadius: "14px", background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.12)", color: "white", marginTop: "10px" };
const leadCardStyle = { padding: "18px", borderRadius: "18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.14)" };
const leadMetaText = { marginTop: "12px", color: "#cbd5e1", fontSize: "13px", lineHeight: 1.7 };
const statusBadge = { marginTop: "14px", padding: "4px 12px", borderRadius: "999px", background: "rgba(59,130,246,0.14)", display: "inline-flex", color: "#93c5fd", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" };
const pipelineActionGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "16px" };

const healthBadge = (score) => {
  const color = score > 80 ? "#22c55e" : score > 55 ? "#f59e0b" : "#ef4444";
  const bg = score > 80 ? "rgba(34,197,94,0.15)" : score > 55 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)";
  return { padding: "4px 10px", borderRadius: "8px", color, background: bg, fontSize: "12px", fontWeight: "bold" };
};

const panelCard = (glowColor) => ({
  marginBottom: "28px",
  padding: "24px",
  borderRadius: "24px",
  background: `radial-gradient(circle at top right, ${glowColor}15, transparent 35%), linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))`,
  border: `1px solid ${glowColor}33`,
  boxShadow: "0 20px 50px rgba(2,6,23,0.3)"
});
const internalChartCard = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  borderRadius: "16px",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between"
};

const chartTitle = { color: "white", fontSize: "16px", fontWeight: "800", margin: "0" };
const chartSub = { color: "#64748b", fontSize: "12px", margin: "2px 0 12px 0" };
const chartRowLabel = { display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: "12px", fontWeight: "600", marginBottom: "4px" };
const barBg = { width: "100%", height: "8px", backgroundColor: "#0f172a", borderRadius: "999px", overflow: "hidden" };
const barFill = { height: "100%", borderRadius: "999px", transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" };
const legendGrid = { display: "grid", gridTemplateColumns: "1fr", gap: "6px", marginTop: "4px" };
const legendItem = { display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "11px", fontWeight: "bold" };
const dot = { width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" };