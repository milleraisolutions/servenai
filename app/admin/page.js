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
    <div style={pageStyle}>
      <div style={topBar}>
        <div>
          <div style={eyebrow}>SERVEN OWNER PORTAL</div>
          <h1 style={titleStyle}>Admin Command Center</h1>
          <p style={subText}>Logged in as {currentUser?.email}</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchCustomers} style={refreshButton}>Refresh Data</button>
          <button onClick={resetMonthlyUsage} style={refreshButton}>Reset Monthly Usage</button>
        </div>
      </div>

      {/* EMAIL CENTER */}
      <div style={panelCard("#0ea5e9")}>
        <div style={{ color: "#7dd3fc", fontSize: "12px", fontWeight: "900" }}>OWNER EMAIL CENTER</div>
        <h2 style={{ color: "white", margin: "6px 0 8px", fontSize: "24px" }}>Send client emails</h2>
        <select
          value={selectedCustomer?.id || ""}
          onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === e.target.value) || null)}
          style={selectStyle}
        >
          <option value="">Select client</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.restaurant_name || c.email} — {c.email}</option>
          ))}
        </select>
        <div style={gridActionWrapper}>
          <button disabled={!selectedCustomer} onClick={() => sendClientEmail(selectedCustomer, "intro")} style={{ ...smallActionButton, background: "linear-gradient(135deg, #0ea5e9, #2563eb)" }}>Intro Email</button>
          <button disabled={!selectedCustomer} onClick={() => sendClientEmail(selectedCustomer, "agreement", "growth")} style={{ ...smallActionButton, background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>Agreement Email</button>
          <button disabled={!selectedCustomer} onClick={() => sendClientEmail(selectedCustomer, "activation", "growth")} style={{ ...smallActionButton, background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>Activation Email</button>
          <button disabled={!selectedCustomer} onClick={() => sendClientEmail(selectedCustomer, "upgrade", "pro")} style={{ ...smallActionButton, background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>Upgrade Email</button>
        </div>
      </div>

      {errorMessage && <div style={errorBox}>{errorMessage}</div>}

      {/* STATS ANALYTICS */}
      <div style={{ marginTop: "20px" }}>
        <div style={eyebrow}>PLATFORM SNAPSHOT</div>
        <h2 style={{ color: "white", fontSize: "24px", fontWeight: "900", marginBottom: "16px" }}>Owner Analytics</h2>
        <div style={statsGrid}>
          <StatCard label="Total Accounts" value={stats.total} />
          <StatCard label="New Leads" value={stats.leads} />
          <StatCard label="Active Clients" value={stats.active} />
          <StatCard label="Open Alerts" value={stats.openAlerts} />
          <StatCard
  label="Onboarding Needed"
  value={customers.filter((c) => !c.lastUpload).length}
/>
          <StatCard label="Client Revenue" value={`$${stats.totalClientRevenue.toLocaleString()}`} />
          <StatCard label="AI Profit Generated" value={`$${stats.totalAIProfitGenerated.toLocaleString()}`} />
          <StatCard label="Avg Health Score" value={`${stats.avgHealthScore}%`} />
          <StatCard label="At-Risk Clients" value={stats.atRiskClients} />
        </div>
      </div>
{/* VISUAL ANALYTICS PERFORMANCE DASHBOARD */}
<div style={panelCard("#22c55e")}>
  <div style={eyebrow}>PLATFORM PERFORMANCE VISUALIZER</div>
  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "22px" }}>
    Growth & Pipeline Analytics
  </h2>

  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
    
    {/* CHART 1: APOLLO PIPELINE CONVERSION */}
    <div style={internalChartCard}>
      <h3 style={chartTitle}>Apollo Sales Conversion</h3>
      <p style={chartSub}>Performance distribution of uploaded sales prospects</p>
      
      {/* Visual Progress Bar Stack */}
      {(() => {
        const total = apolloLeads.length || 1;
        const won = apolloLeads.filter(l => l.status === "closed_won").length;
        const lost = apolloLeads.filter(l => l.status === "closed_lost").length;
        const active = apolloLeads.filter(l => l.status && l.status !== "closed_won" && l.status !== "closed_lost").length;
        
        const wonPct = Math.round((won / total) * 100);
        const lostPct = Math.round((lost / total) * 100);
        const activePct = Math.round((active / total) * 100);

        return (
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", height: "16px", backgroundColor: "#0f172a", marginBottom: "16px" }}>
              <div style={{ width: `${wonPct}%`, backgroundColor: "#22c55e" }} title={`Won: ${wonPct}%`} />
              <div style={{ width: `${activePct}%`, backgroundColor: "#3b82f6" }} title={`Active Pipeline: ${activePct}%`} />
              <div style={{ width: `${lostPct}%`, backgroundColor: "#ef4444" }} title={`Lost: ${lostPct}%`} />
            </div>
            
            <div style={legendGrid}>
              <div style={legendItem}><span style={{ ...dot, backgroundColor: "#22c55e" }} /> Won ({wonPct}%)</div>
              <div style={legendItem}><span style={{ ...dot, backgroundColor: "#3b82f6" }} /> Active Pipeline ({activePct}%)</div>
              <div style={legendItem}><span style={{ ...dot, backgroundColor: "#ef4444" }} /> Lost ({lostPct}%)</div>
            </div>
          </div>
        );
      })()}
    </div>

    {/* CHART 2: SUBSCRIPTION MRR DISTRIBUTION */}
    <div style={internalChartCard}>
      <h3 style={chartTitle}>Revenue Tier Allocation</h3>
      <p style={chartSub}>Monthly Recurring Revenue breakdown by product tiers</p>
      
      {(() => {
        const starterMRR = stats.starter * 149;
        const growthMRR = stats.growth * 299;
        const proMRR = stats.pro * 499;
        const totalMRR = starterMRR + growthMRR + proMRR || 1;

        const starterPct = Math.round((starterMRR / totalMRR) * 100);
        const growthPct = Math.round((growthMRR / totalMRR) * 100);
        const proPct = Math.round((proMRR / totalMRR) * 100);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
            <div>
              <div style={chartRowLabel}><span>Starter ($149/mo)</span> <span>${starterMRR.toLocaleString()}</span></div>
              <div style={barBg}><div style={{ ...barFill, width: `${starterPct}%`, backgroundColor: "#6366f1" }} /></div>
            </div>
            <div>
              <div style={chartRowLabel}><span>Growth ($299/mo)</span> <span>${growthMRR.toLocaleString()}</span></div>
              <div style={barBg}><div style={{ ...barFill, width: `${growthPct}%`, backgroundColor: "#f59e0b" }} /></div>
            </div>
            <div>
              <div style={chartRowLabel}><span>Pro ($499/mo)</span> <span>${proMRR.toLocaleString()}</span></div>
              <div style={barBg}><div style={{ ...barFill, width: `${proPct}%`, backgroundColor: "#a855f7" }} /></div>
            </div>
          </div>
        );
      })()}
    </div>

    {/* CHART 3: INBOUND SIGNUP MARGINS */}
    <div style={internalChartCard}>
      <h3 style={chartTitle}>Inbound Traffic Velocity</h3>
      <p style={chartSub}>Real-time inbound dataset volume tracking balances</p>
      
      {(() => {
        const totalInbound = demoLeads.length || 0;
        const customRequests = customPlanLeads?.length || 0;
        const baselineMax = Math.max(totalInbound, customRequests, 10);

        const demoBarHeight = Math.min(Math.round((totalInbound / baselineMax) * 100), 100);
        const customBarHeight = Math.min(Math.round((customRequests / baselineMax) * 100), 100);

        return (
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "110px", marginTop: "20px", borderBottom: "1px solid #334155", paddingBottom: "8px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "45%" }}>
              <span style={{ color: "white", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>{totalInbound}</span>
              <div style={{ width: "100%", height: `${demoBarHeight}px`, background: "linear-gradient(to top, #a855f7, #c084fc)", borderRadius: "6px 6px 0 0", transition: "height 0.3s ease" }} />
              <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold", marginTop: "8px", textTransform: "uppercase" }}>Demo Leads</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "45%" }}>
              <span style={{ color: "white", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>{customRequests}</span>
              <div style={{ width: "100%", height: `${customBarHeight}px`, background: "linear-gradient(to top, #0ea5e9, #38bdf8)", borderRadius: "6px 6px 0 0", transition: "height 0.3s ease" }} />
              <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold", marginTop: "8px", textTransform: "uppercase" }}>Custom Plans</span>
            </div>
          </div>
        );
      })()}
    </div>

  </div>
</div>
{/* AT-RISK CLIENTS */}
<div style={panelCard("#ef4444")}>
  <div style={eyebrow}>CLIENT RETENTION RISK</div>
  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    At-Risk Clients
  </h2>

  {customers.filter((client) =>
    Number(client.healthScore || 0) <= 55 ||
    ["past_due", "unpaid"].includes(String(client.billingStatus || "").toLowerCase())
  ).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>
      No at-risk clients right now.
    </div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
      {customers
        .filter((client) =>
          Number(client.healthScore || 0) <= 55 ||
          ["past_due", "unpaid"].includes(String(client.billingStatus || "").toLowerCase())
        )
        .map((client) => (
          <div key={client.id} style={leadCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <div>
                <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>
                  {client.restaurant_name || "Unnamed Business"}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                  {client.email}
                </div>
              </div>

              <div style={healthBadge(client.healthScore)}>
                {client.healthScore}% Health
              </div>
            </div>

            <div style={leadMetaText}>
              <div>Plan: {client.plan || "starter"}</div>
              <div>Billing: {client.billingStatus}</div>
              <div>Open Alerts: {client.openAlerts}</div>
              <div>
                Last Upload:{" "}
                {client.lastUpload
                  ? new Date(client.lastUpload).toLocaleDateString()
                  : "Never"}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <button
                onClick={() => markContacted(client.id)}
                style={{ ...smallActionButton, flex: 1, background: "#334155" }}
              >
                Mark Contacted
              </button>

              <button
                onClick={() => sendClientEmail(client, "intro")}
                style={{
                  ...smallActionButton,
                  flex: 1,
                  background: "linear-gradient(135deg,#ef4444,#dc2626)",
                }}
              >
                Email Client
              </button>
            </div>
          </div>
        ))}
    </div>
  )}
</div>
{/* CLIENT HEALTH SUMMARY */}
<div style={panelCard("#22c55e")}>
  <div style={eyebrow}>CLIENT HEALTH MONITORING</div>

  <h2
    style={{
      color: "white",
      fontSize: "26px",
      fontWeight: "900",
      marginBottom: "18px",
    }}
  >
    Client Health Summary
  </h2>

  <div style={statsGrid}>
    <StatCard
      label="Healthy Clients"
      value={
        customers.filter((c) => Number(c.healthScore || 0) > 80).length
      }
    />

    <StatCard
      label="Watch List"
      value={
        customers.filter(
          (c) =>
            Number(c.healthScore || 0) <= 80 &&
            Number(c.healthScore || 0) > 55
        ).length
      }
    />

    <StatCard
      label="At Risk"
      value={
        customers.filter((c) => Number(c.healthScore || 0) <= 55).length
      }
    />

    <StatCard
      label="Past Due"
      value={
        customers.filter((c) =>
          ["past_due", "unpaid"].includes(
            String(c.billingStatus || "").toLowerCase()
          )
        ).length
      }
    />

    <StatCard
      label="No Uploads"
      value={
        customers.filter((c) => !c.lastUpload).length
      }
    />
  </div>
</div>
{/* PAST DUE BILLING */}
<div style={panelCard("#ef4444")}>
  <div style={eyebrow}>BILLING RISK</div>

  <h2
    style={{
      color: "white",
      fontSize: "26px",
      fontWeight: "900",
      marginBottom: "18px",
    }}
  >
    Past Due Billing
  </h2>

  {customers.filter((client) =>
    ["past_due", "unpaid", "canceled", "cancelled"].includes(
      String(client.billingStatus || "").toLowerCase()
    )
  ).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>
      No past due billing issues right now.
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        gap: "16px",
      }}
    >
      {customers
        .filter((client) =>
          ["past_due", "unpaid", "canceled", "cancelled"].includes(
            String(client.billingStatus || "").toLowerCase()
          )
        )
        .map((client) => (
          <div key={client.id} style={leadCardStyle}>
            <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>
              {client.restaurant_name || "Unnamed Business"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              {client.email}
            </div>

            <div style={leadMetaText}>
              <div>Plan: {client.plan || "starter"}</div>
              <div>
                Billing Status:{" "}
                <span style={{ color: "#ef4444", fontWeight: "900" }}>
                  {client.billingStatus}
                </span>
              </div>
              <div>Health Score: {client.healthScore}%</div>
              <div>
                Last Contacted:{" "}
                {client.last_contacted_at
                  ? new Date(client.last_contacted_at).toLocaleDateString()
                  : "Never"}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <button
                onClick={() => markContacted(client.id)}
                style={{ ...smallActionButton, flex: 1, background: "#334155" }}
              >
                Mark Contacted
              </button>

              <button
                onClick={() => sendClientEmail(client, "activation", client.plan || "starter")}
                style={{
                  ...smallActionButton,
                  flex: 1,
                  background: "linear-gradient(135deg,#ef4444,#dc2626)",
                }}
              >
                Send Billing Email
              </button>
            </div>
          </div>
        ))}
    </div>
  )}
</div>
{/* RECENT SIGNUPS */}
<div style={panelCard("#3b82f6")}>
  <div style={eyebrow}>NEW ACCOUNT ACTIVITY</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Recent Signups
  </h2>

  {customers.length === 0 ? (
    <div style={{ color: "#94a3b8" }}>No accounts found yet.</div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
      {customers
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .map((client) => {
          const signupDate = client.created_at ? new Date(client.created_at) : null;
          const daysSinceSignup = signupDate
            ? Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <div key={client.id} style={leadCardStyle}>
              <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>
                {client.restaurant_name || "Unnamed Business"}
              </div>

              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {client.email}
              </div>

              <div style={leadMetaText}>
                <div>Plan: {client.plan || "starter"}</div>
                <div>Status: {client.customer_status || "lead"}</div>
                <div>
                  Signup Date:{" "}
                  {signupDate ? signupDate.toLocaleDateString() : "Unknown"}
                </div>
                <div>
                  Days Since Signup:{" "}
                  {daysSinceSignup !== null ? daysSinceSignup : "Unknown"}
                </div>
              </div>

              <button
                onClick={() => markContacted(client.id)}
                style={{
                  ...smallActionButton,
                  marginTop: "14px",
                  width: "100%",
                  background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                }}
              >
                Mark Contacted
              </button>
            </div>
          );
        })}
    </div>
  )}
</div>
{/* CHURN WATCH LIST */}
<div style={panelCard("#f59e0b")}>
  <div style={eyebrow}>EARLY RETENTION WARNINGS</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Churn Watch List
  </h2>

  {customers.filter((client) =>
    Number(client.healthScore || 0) > 55 &&
    Number(client.healthScore || 0) <= 80
  ).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>No clients on churn watch right now.</div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
      {customers
        .filter((client) =>
          Number(client.healthScore || 0) > 55 &&
          Number(client.healthScore || 0) <= 80
        )
        .map((client) => (
          <div key={client.id} style={leadCardStyle}>
            <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>
              {client.restaurant_name || "Unnamed Business"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              {client.email}
            </div>

            <div style={leadMetaText}>
              <div>Health Score: {client.healthScore}%</div>
              <div>Open Alerts: {client.openAlerts}</div>
              <div>
                Last Upload:{" "}
                {client.lastUpload
                  ? new Date(client.lastUpload).toLocaleDateString()
                  : "Never"}
              </div>
              <div>Billing: {client.billingStatus}</div>
            </div>

            <button
              onClick={() => markContacted(client.id)}
              style={{
                ...smallActionButton,
                marginTop: "14px",
                width: "100%",
                background: "linear-gradient(135deg,#f59e0b,#d97706)",
              }}
            >
              Mark Contacted
            </button>
          </div>
        ))}
    </div>
  )}
</div>
{/* TOP CLIENTS BY REVENUE */}
<div style={panelCard("#22c55e")}>
  <div style={eyebrow}>CLIENT REVENUE LEADERBOARD</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Top Clients By Revenue
  </h2>

  {customers.filter((client) => Number(client.totalRevenue || 0) > 0).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>
      No client revenue data uploaded yet.
    </div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
      {customers
        .filter((client) => Number(client.totalRevenue || 0) > 0)
        .slice()
        .sort((a, b) => Number(b.totalRevenue || 0) - Number(a.totalRevenue || 0))
        .slice(0, 10)
        .map((client, index) => (
          <div key={client.id} style={leadCardStyle}>
            <div style={{ color: "#22c55e", fontSize: "12px", fontWeight: "900" }}>
              #{index + 1} TOP CLIENT
            </div>

            <div style={{ color: "white", fontWeight: "900", fontSize: "18px", marginTop: "4px" }}>
              {client.restaurant_name || "Unnamed Business"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              {client.email}
            </div>

            <div style={leadMetaText}>
              <div>
                Total Uploaded Revenue:{" "}
                <span style={{ color: "white", fontWeight: "900" }}>
                  ${Number(client.totalRevenue || 0).toLocaleString()}
                </span>
              </div>

              <div>
                AI Profit Generated:{" "}
                <span style={{ color: "#a855f7", fontWeight: "900" }}>
                  ${Number(client.aiProfitGenerated || 0).toLocaleString()}
                </span>
              </div>

              <div>Plan: {client.plan || "starter"}</div>
              <div>Billing: {client.billingStatus}</div>
              <div>Health Score: {client.healthScore}%</div>
            </div>

            <button
              onClick={() => markContacted(client.id)}
              style={{
                ...smallActionButton,
                marginTop: "14px",
                width: "100%",
                background: "linear-gradient(135deg,#22c55e,#16a34a)",
              }}
            >
              Mark Contacted
            </button>
          </div>
        ))}
    </div>
  )}
</div>
{/* LARGEST ACCOUNTS */}
<div style={panelCard("#14b8a6")}>
  <div style={eyebrow}>STRATEGIC ACCOUNTS</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Largest Accounts
  </h2>

  {customers.filter((client) => Number(client.totalRevenue || 0) > 0).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>
      No large account revenue data available yet.
    </div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
      {customers
        .filter((client) => Number(client.totalRevenue || 0) > 0)
        .slice()
        .sort((a, b) => Number(b.totalRevenue || 0) - Number(a.totalRevenue || 0))
        .slice(0, 20)
        .map((client, index) => (
          <div key={client.id} style={leadCardStyle}>
            <div style={{ color: "#14b8a6", fontSize: "12px", fontWeight: "900" }}>
              #{index + 1} STRATEGIC ACCOUNT
            </div>

            <div style={{ color: "white", fontWeight: "900", fontSize: "18px", marginTop: "4px" }}>
              {client.restaurant_name || "Unnamed Business"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              {client.email}
            </div>

            <div style={leadMetaText}>
              <div>
                Uploaded Revenue:{" "}
                <span style={{ color: "white", fontWeight: "900" }}>
                  ${Number(client.totalRevenue || 0).toLocaleString()}
                </span>
              </div>

              <div>
                AI Profit Generated:{" "}
                <span style={{ color: "#a855f7", fontWeight: "900" }}>
                  ${Number(client.aiProfitGenerated || 0).toLocaleString()}
                </span>
              </div>

              <div>Plan: {client.plan || "starter"}</div>
              <div>Billing: {client.billingStatus}</div>
              <div>Health Score: {client.healthScore}%</div>
              <div>Open Alerts: {client.openAlerts}</div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <button
                onClick={() => markContacted(client.id)}
                style={{
                  ...smallActionButton,
                  flex: 1,
                  background: "#334155",
                }}
              >
                Mark Contacted
              </button>

              <button
                onClick={() => sendClientEmail(client, "upgrade", client.plan || "pro")}
                style={{
                  ...smallActionButton,
                  flex: 1,
                  background: "linear-gradient(135deg,#14b8a6,#0f766e)",
                }}
              >
                Send Upgrade Email
              </button>
            </div>
          </div>
        ))}
    </div>
  )}
</div>
{/* ENTERPRISE ACCOUNTS */}
<div style={panelCard("#facc15")}>
  <div style={eyebrow}>ENTERPRISE CLIENTS</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Enterprise Accounts
  </h2>

  {customers.filter((client) =>
    String(client.plan || "").toLowerCase() === "enterprise" ||
    Number(client.locations || client.location_count || 0) > 1
  ).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>
      No enterprise or multi-location accounts found yet.
    </div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
      {customers
        .filter((client) =>
          String(client.plan || "").toLowerCase() === "enterprise" ||
          Number(client.locations || client.location_count || 0) > 1
        )
        .map((client) => (
          <div key={client.id} style={leadCardStyle}>
            <div style={{ color: "#facc15", fontSize: "12px", fontWeight: "900" }}>
              ENTERPRISE / MULTI-LOCATION
            </div>

            <div style={{ color: "white", fontWeight: "900", fontSize: "18px", marginTop: "4px" }}>
              {client.restaurant_name || "Unnamed Business"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              {client.email}
            </div>

            <div style={leadMetaText}>
              <div>Plan: {client.plan || "unknown"}</div>
              <div>
                Locations:{" "}
                {client.locations || client.location_count || "Unknown"}
              </div>
              <div>Billing: {client.billingStatus}</div>
              <div>Health Score: {client.healthScore}%</div>
              <div>
                Uploaded Revenue: ${Number(client.totalRevenue || 0).toLocaleString()}
              </div>
              <div>
                AI Profit Generated: ${Number(client.aiProfitGenerated || 0).toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => markContacted(client.id)}
              style={{
                ...smallActionButton,
                marginTop: "14px",
                width: "100%",
                background: "linear-gradient(135deg,#facc15,#ca8a04)",
              }}
            >
              Mark Contacted
            </button>
          </div>
        ))}
    </div>
  )}
</div>
{/* CUSTOMER GROWTH RATE */}
<div style={panelCard("#38bdf8")}>
  <div style={eyebrow}>ACCOUNT GROWTH</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Customer Growth Rate
  </h2>

  {(() => {
    const now = new Date();

    const thisMonth = customers.filter((client) => {
      if (!client.created_at) return false;
      const createdDate = new Date(client.created_at);

      return (
        createdDate.getMonth() === now.getMonth() &&
        createdDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const lastMonth = customers.filter((client) => {
      if (!client.created_at) return false;
      const createdDate = new Date(client.created_at);

      return (
        createdDate.getMonth() === lastMonthDate.getMonth() &&
        createdDate.getFullYear() === lastMonthDate.getFullYear()
      );
    }).length;

    const growthRate =
      lastMonth > 0
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
        : thisMonth > 0
        ? 100
        : 0;

    return (
      <div style={statsGrid}>
        <StatCard label="New This Month" value={thisMonth} />
        <StatCard label="New Last Month" value={lastMonth} />
        <StatCard label="Growth Rate" value={`${growthRate}%`} />
        <StatCard label="Total Accounts" value={customers.length} />
      </div>
    );
  })()}
</div>
{/* CONTRACT TRACKER */}
<div style={panelCard("#8b5cf6")}>
  <div style={eyebrow}>CONTRACT READINESS</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Contract Tracker
  </h2>

  <div style={statsGrid}>
    <StatCard
      label="Active Clients"
      value={customers.filter((c) => String(c.customer_status || "").toLowerCase() === "active").length}
    />

    <StatCard
      label="Leads"
      value={customers.filter((c) => String(c.customer_status || "lead").toLowerCase() === "lead").length}
    />

    <StatCard
      label="Needs Monthly Price"
      value={customers.filter((c) => !c.monthly_price).length}
    />

    <StatCard
      label="Contracts Ready"
      value={customers.filter((c) => c.monthly_price && c.contract_start_date).length}
    />
  </div>
</div>
{/* HIGHEST AI PROFIT GENERATED */}
<div style={panelCard("#a855f7")}>
  <div style={eyebrow}>AI VALUE LEADERBOARD</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Highest AI Profit Generated
  </h2>

  {customers.filter((client) => Number(client.aiProfitGenerated || 0) > 0).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>
      No AI profit impact recorded yet.
    </div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
      {customers
        .filter((client) => Number(client.aiProfitGenerated || 0) > 0)
        .slice()
        .sort((a, b) => Number(b.aiProfitGenerated || 0) - Number(a.aiProfitGenerated || 0))
        .slice(0, 10)
        .map((client, index) => (
          <div key={client.id} style={leadCardStyle}>
            <div style={{ color: "#a855f7", fontSize: "12px", fontWeight: "900" }}>
              #{index + 1} AI VALUE CLIENT
            </div>

            <div style={{ color: "white", fontWeight: "900", fontSize: "18px", marginTop: "4px" }}>
              {client.restaurant_name || "Unnamed Business"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              {client.email}
            </div>

            <div style={leadMetaText}>
              <div>
                AI Profit Generated:{" "}
                <span style={{ color: "#a855f7", fontWeight: "900" }}>
                  ${Number(client.aiProfitGenerated || 0).toLocaleString()}
                </span>
              </div>

              <div>
                Total Uploaded Revenue:{" "}
                <span style={{ color: "white", fontWeight: "900" }}>
                  ${Number(client.totalRevenue || 0).toLocaleString()}
                </span>
              </div>

              <div>Health Score: {client.healthScore}%</div>
              <div>Plan: {client.plan || "starter"}</div>
              <div>Billing: {client.billingStatus}</div>
            </div>

            <button
              onClick={() => markContacted(client.id)}
              style={{
                ...smallActionButton,
                marginTop: "14px",
                width: "100%",
                background: "linear-gradient(135deg,#a855f7,#7c3aed)",
              }}
            >
              Mark Contacted
            </button>
          </div>
        ))}
    </div>
  )}
</div>
{/* CLIENTS NEEDING ONBOARDING */}
<div style={panelCard("#f97316")}>
  <div style={eyebrow}>ONBOARDING PIPELINE</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Clients Needing Onboarding
  </h2>

  {customers.filter((client) => !client.lastUpload).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>
      No onboarding issues right now.
    </div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
      {customers
        .filter((client) => !client.lastUpload)
        .slice()
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .map((client) => {
          const signupDate = client.created_at ? new Date(client.created_at) : null;

          const daysSinceSignup = signupDate
            ? Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <div key={client.id} style={leadCardStyle}>
              <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>
                {client.restaurant_name || "Unnamed Business"}
              </div>

              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {client.email}
              </div>

              <div style={leadMetaText}>
                <div>Plan: {client.plan || "starter"}</div>
                <div>Status: {client.customer_status || "lead"}</div>
                <div>
                  Signup Date:{" "}
                  {signupDate ? signupDate.toLocaleDateString() : "Unknown"}
                </div>
                <div>
                  Days Since Signup:{" "}
                  {daysSinceSignup !== null ? daysSinceSignup : "Unknown"}
                </div>
                <div>Last Upload: Never</div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                <button
                  onClick={() => sendClientEmail(client, "intro")}
                  style={{
                    ...smallActionButton,
                    flex: 1,
                    background: "linear-gradient(135deg,#f97316,#ea580c)",
                  }}
                >
                  Send Onboarding Email
                </button>

                <button
                  onClick={() => markContacted(client.id)}
                  style={{
                    ...smallActionButton,
                    flex: 1,
                    background: "#334155",
                  }}
                >
                  Mark Contacted
                </button>
              </div>
            </div>
          );
        })}
    </div>
  )}
</div>
{/* NEW CLIENTS THIS MONTH */}
<div style={panelCard("#0ea5e9")}>
  <div style={eyebrow}>MONTHLY GROWTH</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    New Clients This Month
  </h2>

  {customers.filter((client) => {
    if (!client.created_at) return false;

    const createdDate = new Date(client.created_at);
    const now = new Date();

    return (
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear()
    );
  }).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>
      No new clients signed up this month.
    </div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
      {customers
        .filter((client) => {
          if (!client.created_at) return false;

          const createdDate = new Date(client.created_at);
          const now = new Date();

          return (
            createdDate.getMonth() === now.getMonth() &&
            createdDate.getFullYear() === now.getFullYear()
          );
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((client) => (
          <div key={client.id} style={leadCardStyle}>
            <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>
              {client.restaurant_name || "Unnamed Business"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              {client.email}
            </div>

            <div style={leadMetaText}>
              <div>Plan: {client.plan || "starter"}</div>
              <div>Status: {client.customer_status || "lead"}</div>
              <div>
                Signup Date:{" "}
                {client.created_at
                  ? new Date(client.created_at).toLocaleDateString()
                  : "Unknown"}
              </div>
              <div>
                Last Upload:{" "}
                {client.lastUpload
                  ? new Date(client.lastUpload).toLocaleDateString()
                  : "Never"}
              </div>
            </div>

            <button
              onClick={() => markContacted(client.id)}
              style={{
                ...smallActionButton,
                marginTop: "14px",
                width: "100%",
                background: "linear-gradient(135deg,#0ea5e9,#2563eb)",
              }}
            >
              Mark Contacted
            </button>
          </div>
        ))}
    </div>
  )}
</div>
      {/* CURRENT CLIENTS DIRECTORY */}
      <div style={panelCard("#6366f1")}>
        <div style={eyebrow}>CLIENT OPERATIONS</div>
        <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "14px" }}>Current Clients Directory</h2>
        
        {/* Search & Filtering Bars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <input 
            type="text" 
            placeholder="Search name, business or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="lead">Lead</option>
          </select>
          <select value={billingFilter} onChange={(e) => setBillingFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Billing</option>
            <option value="active">Paid/Active</option>
            <option value="past_due">Past Due</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        {!filteredCustomers.length ? (
          <div style={{ color: "#94a3b8" }}>No active or filtered clients discovered.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
            {filteredCustomers.map((customer) => (
              <div key={customer.id} style={{ ...leadCardStyle, position: "relative" }}>
                <button
  onClick={() => deleteCustomer(customer.id)}
  style={{
    position: "absolute",
    top: "14px",
    right: "14px",
    background: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    width: "26px",
    height: "26px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  }}
  title="Delete Client"
>
  ✕
</button>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>{customer.restaurant_name || "Unnamed Business"}</div>
                    <div style={{ color: "#94a3b8", fontSize: "13px" }}>{customer.email}</div>
                  </div>
                  <div style={healthBadge(customer.healthScore)}>{customer.healthScore}% Health</div>
                </div>

                <div style={leadMetaText}>
                  <div>Plan Level: <span style={{ color: "#6366f1", fontWeight: "bold", textTransform: "uppercase" }}>{customer.plan || "starter"}</span></div>
                  <div>Lifecycle Status: <span style={{ color: "#22c55e", fontWeight: "bold" }}>{customer.customer_status || "lead"}</span></div>
                  <div>Stripe Billing: <span style={{ color: customer.billingStatus === "active" ? "#22c55e" : "#ef4444" }}>{customer.billingStatus}</span></div>
                  <div>Total App Revenue: <span style={{ color: "white", fontWeight: "bold" }}>${(customer.totalRevenue || 0).toLocaleString()}</span></div>
                  <div>AI Value Add: <span style={{ color: "#a855f7", fontWeight: "bold" }}>${(customer.aiProfitGenerated || 0).toLocaleString()}</span></div>
                  <div>Open Operation Alerts: <span style={{ color: customer.openAlerts > 0 ? "#ef4444" : "#94a3b8" }}>{customer.openAlerts}</span></div>
                  <div>Last System Upload: <span>{customer.lastUpload ? new Date(customer.lastUpload).toLocaleDateString() : "Never"}</span></div>
                </div>

                <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <div>
                      <label style={labelStyle}>Status Override</label>
                      <select 
                        value={customer.customer_status || "lead"} 
                        onChange={(e) => updateCustomerStatus(customer.id, e.target.value)}
                        style={{ ...selectStyle, padding: "6px" }}
                      >
                        <option value="lead">Lead</option>
                        <option value="active">Active</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Tier Level</label>
                      <select 
                        value={customer.plan || "starter"} 
                        onChange={(e) => updatePlan(customer.id, e.target.value)}
                        style={{ ...selectStyle, padding: "6px" }}
                      >
                        <option value="starter">Starter</option>
                        <option value="growth">Growth</option>
                        <option value="pro">Pro</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                    <button 
                      onClick={() => {
                        const notes = window.prompt("Edit user notes:", customer.notes || "");
                        if (notes !== null) updateNotes(customer.id, notes);
                      }} 
                      style={{ ...smallActionButton, flex: 1, background: "#334155" }}
                    >
                      Edit Notes
                    </button>
                    <button 
                      onClick={() => markContacted(customer.id)} 
                      style={{ ...smallActionButton, flex: 1, background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                    >
                      Log Contact Date
                    </button>
                  </div>
                  {customer.notes && (
                    <div style={{ marginTop: "10px", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                      <strong>Notes:</strong> <em>{customer.notes}</em>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW: INBOUND WEBSITE DEMO LEADS PANEL */}
      <div style={panelCard("#a855f7")}>
        <div style={eyebrow}>INBOUND WEBSITE DEMO BOOKINGS</div>
        <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>Demo Leads Pipeline</h2>
        {!demoLeads.length ? (
          <div style={{ color: "#94a3b8" }}>No website demo requests received in database yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
            {demoLeads.map((demo) => (
              <div key={demo.id} style={{ ...leadCardStyle, position: "relative" }}>
                
                {/* Delete button for demo requests */}
                <button 
                  onClick={() => deleteDemoLead(demo.id)}
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "8px",
                    width: "26px",
                    height: "26px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10
                  }}
                  title="Remove Demo Request"
                >
                  ✕
                </button>

                <div style={{ color: "white", fontWeight: "900", fontSize: "18px", paddingRight: "30px" }}>
                  {demo.restaurant_name || demo.business_name || "Restaurant"}
                </div>
                <div style={{ color: "#a855f7", fontSize: "13px", fontWeight: "700", marginTop: "2px" }}>
                  Contact: {demo.contact_name || demo.owner_name || "Unknown"}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "13px" }}>{demo.email}</div>
                
                <div style={leadMetaText}>
                  <div>Phone: {demo.phone || "Unknown"}</div>
                  <div>City/Loc: {demo.city || "Unknown"}</div>
                  <div>Submitted: <span>{demo.created_at ? new Date(demo.created_at).toLocaleString() : "Unknown"}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APOLLO FILE UPLOAD */}
      <div style={panelCard("#3b82f6")}>
        <div style={{ color: "#93c5fd", fontSize: "12px", fontWeight: "900" }}>IMPORT APOLLO LEADS</div>
        <h2 style={{ color: "white", margin: "6px 0 8px", fontSize: "24px" }}>Upload prospect CSV</h2>
        <input type="file" accept=".csv, .xlsx, .xls" onChange={handleLeadUpload} style={fileInputStyle} />
      </div>

      {/* PROSPECT PIPELINE WITH INTEGRATED DELETE BUTTON */}
      <div style={panelCard("#1e293b")}>
        <div style={eyebrow}>APOLLO SALES PIPELINE</div>
        <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>Prospect Pipeline</h2>
        {!apolloLeads.length ? (
          <div style={{ color: "#94a3b8" }}>No Apollo leads uploaded yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
            {apolloLeads.map((lead) => (
              <div key={lead.id} style={{ ...leadCardStyle, position: "relative" }}>
                
                {/* Permanent Delete "X" Button */}
                <button 
                  onClick={() => deleteLead(lead.id)}
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    width: "26px",
                    height: "26px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10
                  }}
                  title="Delete Lead"
                >
                  ✕
                </button>

                <div style={{ color: "white", fontWeight: "900", fontSize: "18px", paddingRight: "30px" }}>
                  {lead.business_name || "Restaurant"}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "13px" }}>{lead.email}</div>
                <div style={leadMetaText}>
                  <div>Owner: {lead.owner_name || "Unknown"}</div>
                  <div>Phone: {lead.phone || "Unknown"}</div>
                  <div>City: {lead.city || "Unknown"}</div>
                </div>
                <div style={statusBadge}>{lead.status || "new"}</div>
                <div style={pipelineActionGrid}>
                  <button onClick={() => updateLeadStatus(lead.id, "contacted")} style={smallActionButton}>Contacted</button>
                  <button onClick={() => updateLeadStatus(lead.id, "follow_up")} style={smallActionButton}>Follow Up</button>
                  <button onClick={() => updateLeadStatus(lead.id, "interested")} style={smallActionButton}>Interested</button>
                  <button onClick={() => updateLeadStatus(lead.id, "demo_scheduled")} style={smallActionButton}>Demo</button>
                  <button onClick={() => updateLeadStatus(lead.id, "closed_won")} style={{ ...smallActionButton, background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>Closed Won</button>
                  <button onClick={() => updateLeadStatus(lead.id, "closed_lost")} style={{ ...smallActionButton, background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>Closed Lost</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OVERAGE RISK PANEL */}
      <div style={panelCard("#f59e0b")}>
        <div style={eyebrow}>RESOURCE ALERT RISK</div>
        <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>Overage Risk Clients</h2>
        {!overageRiskClients.length ? (
          <div style={{ color: "#94a3b8" }}>All operational client messaging usage within clean margins.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "16px" }}>
            {overageRiskClients.map((client) => (
              <div key={client.id} style={leadCardStyle}>
                <div style={{ color: "white", fontWeight: "800" }}>{client.restaurant_name}</div>
                <div style={{ color: "#f59e0b", fontSize: "13px", marginTop: "4px" }}>
                  Email Vol: {client.emailUsagePercent}% ({client.emailUsageThisMonth}/{client.emailLimit})
                </div>
                <div style={{ color: "#ef4444", fontSize: "13px" }}>
                  SMS Vol: {client.smsUsagePercent}% ({client.smsUsageThisMonth}/{client.smsLimit})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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