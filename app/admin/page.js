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
  const [crmSearch, setCrmSearch] = useState("");
const [crmStageFilter, setCrmStageFilter] = useState("all");
const [crmSourceFilter, setCrmSourceFilter] = useState("all");
const [crmViewFilter, setCrmViewFilter] = useState("active");
const [selectedCRMLead, setSelectedCRMLead] = useState(null);
const [selectedCRMActivities, setSelectedCRMActivities] = useState([]);
const [crmActivitiesLoading, setCrmActivitiesLoading] = useState(false);
const [showAddProspectForm, setShowAddProspectForm] = useState(false);

const [newProspect, setNewProspect] = useState({
  business_name: "",
  owner_name: "",
  contact_title: "",
  email: "",
  phone: "",
  city: "",
  state: "",
 source: "walk_in",
  contact_method: "in_person",
  status: "not_contacted",
  notes: "",
  next_action: "",
  next_follow_up_at: "",
  estimated_monthly_value: "",
  recommended_plan: "",
});
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
const { data: uploadsData, error: uploadsError } = await supabase
  .from("uploads")
  .select("user_id, created_at, upload_type")
  .or("archived.is.false,archived.is.null")
  .order("created_at", { ascending: false });

if (uploadsError) {
  console.warn("ADMIN UPLOADS FETCH ERROR:", uploadsError.message);
}
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
      const customerUploads = (uploadsData || []).filter(
  (upload) => upload.user_id === customer.id
);
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
      const verifiedCustomerActions = customerAiActions.filter((action) => {
  const status = String(
    action.status ||
    action.recovery_status ||
    ""
  ).toLowerCase();

  return (
    status === "verified" ||
    status === "completed" ||
    action.verified === true ||
    action.is_verified === true
  );
});

const aiProfitGenerated = verifiedCustomerActions.reduce(
  (sum, action) => {
    const recoveredValue = Number(
      action.actual_recovery ||
      action.actualRecovery ||
      action.recovered_profit ||
      action.recoveredProfit ||
      action.verified_recovered ||
      action.recovered ||
      action.impact_value ||
      action.impactValue ||
      0
    );

    return sum + (
      Number.isFinite(recoveredValue)
        ? recoveredValue
        : 0
    );
  },
  0
);
      const openAlerts = customerAlerts.filter((alert) => String(alert.status || "open").toLowerCase() !== "closed").length;
const lastUpload = customerUploads.length
  ? customerUploads
      .map((upload) => upload.created_at)
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
verifiedAiActionsCount: verifiedCustomerActions.length,
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


  /* =========================
   SERVEN SALES CRM PIPELINE
========================= */

const CRM_PIPELINE_STAGES = [
  {
    value: "not_contacted",
    label: "Not Contacted",
    group: "prospecting",
  },
  {
    value: "email_sent",
    label: "Email Sent",
    group: "outreach",
  },
  {
    value: "linkedin_sent",
    label: "LinkedIn Sent",
    group: "outreach",
  },
  {
    value: "called",
    label: "Called",
    group: "outreach",
  },
  {
    value: "follow_up_1",
    label: "Follow-Up 1",
    group: "follow_up",
  },
  {
    value: "follow_up_2",
    label: "Follow-Up 2",
    group: "follow_up",
  },
  {
    value: "interested",
    label: "Interested",
    group: "qualified",
  },
  {
    value: "demo_scheduled",
    label: "Demo Scheduled",
    group: "demo",
  },
  {
    value: "pilot_offered",
    label: "Pilot Offered",
    group: "pilot",
  },
  {
    value: "pilot_started",
    label: "Pilot Started",
    group: "pilot",
  },
  {
    value: "pilot_active",
    label: "Pilot Active",
    group: "pilot",
  },
  {
    value: "pilot_completed",
    label: "Pilot Completed",
    group: "pilot",
  },
  {
    value: "proposal_sent",
    label: "Proposal Sent",
    group: "closing",
  },
  {
    value: "negotiating",
    label: "Negotiating",
    group: "closing",
  },
  {
    value: "won",
    label: "Client Won",
    group: "closed",
  },
  {
    value: "no_response",
    label: "No Response",
    group: "closed",
  },
  {
    value: "lost",
    label: "Not Interested / Lost",
    group: "closed",
  },
];

const CRM_LEGACY_STATUS_LABELS = {
  new: "New Lead",
  contacted: "Contacted",
  closed: "Closed â€” Needs Classification",
  closed_won: "Client Won",
  closed_lost: "Lost",
};

const getCRMStageLabel = (status) => {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  const stage = CRM_PIPELINE_STAGES.find(
    (item) => item.value === normalizedStatus
  );

  if (stage) {
    return stage.label;
  }

  if (CRM_LEGACY_STATUS_LABELS[normalizedStatus]) {
    return CRM_LEGACY_STATUS_LABELS[normalizedStatus];
  }

  return "Not Contacted";
};

const getCRMStageGroup = (status) => {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  const stage = CRM_PIPELINE_STAGES.find(
    (item) => item.value === normalizedStatus
  );

  if (stage) {
    return stage.group;
  }

  if (normalizedStatus === "closed_won") {
    return "closed";
  }

  if (normalizedStatus === "closed_lost") {
    return "closed";
  }

  return "prospecting";
};
 const updateLeadStatus = async (leadId, newStatus) => {
  try {
    const currentLead = (apolloLeads || []).find(
      (lead) => lead.id === leadId
    );

    if (!currentLead) {
      alert("Lead could not be found.");
      return;
    }

    const previousStatus = String(
      currentLead.status || "new"
    )
      .trim()
      .toLowerCase();

    const normalizedNewStatus = String(newStatus || "")
      .trim()
      .toLowerCase();

    if (!normalizedNewStatus) {
      alert("Select a valid CRM stage.");
      return;
    }

    if (previousStatus === normalizedNewStatus) {
      return;
    }

    const now = new Date().toISOString();

    /* =========================
       BUILD LEAD UPDATE
    ========================= */

    const leadUpdates = {
      status: normalizedNewStatus,
      updated_at: now,
    };

    const contactStages = [
      "email_sent",
      "linkedin_sent",
      "called",
      "follow_up_1",
      "follow_up_2",
      "interested",
      "demo_scheduled",
      "pilot_offered",
      "pilot_started",
      "pilot_completed",
      "proposal_sent",
      "negotiating",
      "won",
      "lost",
    ];

    if (contactStages.includes(normalizedNewStatus)) {
      leadUpdates.last_contacted_at = now;

      if (!currentLead.first_contacted_at) {
        leadUpdates.first_contacted_at = now;
      }
    }

    /* =========================
       FOLLOW-UP TRACKING
    ========================= */

    if (normalizedNewStatus === "follow_up_1") {
      leadUpdates.follow_up_count = Math.max(
        Number(currentLead.follow_up_count || 0),
        1
      );
    }

    if (normalizedNewStatus === "follow_up_2") {
      leadUpdates.follow_up_count = Math.max(
        Number(currentLead.follow_up_count || 0),
        2
      );
    }

    /* =========================
       DEMO TRACKING
    ========================= */

    if (normalizedNewStatus === "demo_scheduled") {
      leadUpdates.demo_scheduled_at =
        currentLead.demo_scheduled_at || now;
    }

    if (normalizedNewStatus === "pilot_offered") {
      leadUpdates.pilot_offered_at =
        currentLead.pilot_offered_at || now;
    }

    /* =========================
       PILOT TRACKING
    ========================= */

    if (normalizedNewStatus === "pilot_started") {
      leadUpdates.pilot_status = "started";

      if (!currentLead.pilot_start_date) {
        leadUpdates.pilot_start_date =
          new Date().toISOString().split("T")[0];
      }
    }

    if (normalizedNewStatus === "pilot_active") {
      leadUpdates.pilot_status = "active";
    }

    if (normalizedNewStatus === "pilot_completed") {
      leadUpdates.pilot_status = "completed";

      if (!currentLead.pilot_end_date) {
        leadUpdates.pilot_end_date =
          new Date().toISOString().split("T")[0];
      }
    }

    /* =========================
       PROPOSAL / CLOSE TRACKING
    ========================= */

    if (normalizedNewStatus === "proposal_sent") {
      leadUpdates.proposal_sent_at =
        currentLead.proposal_sent_at || now;
    }

    if (normalizedNewStatus === "won") {
      leadUpdates.won_at = currentLead.won_at || now;

      leadUpdates.lost_at = null;
      leadUpdates.lost_reason = null;
    }

    if (normalizedNewStatus === "lost") {
      leadUpdates.lost_at = currentLead.lost_at || now;
      leadUpdates.won_at = null;
    }

    /* =========================
       UPDATE LEAD
    ========================= */

    const { error: leadError } = await supabase
      .from("leads")
      .update(leadUpdates)
      .eq("id", leadId);

    if (leadError) {
      throw leadError;
    }

    /* =========================
       GET CURRENT SERVEN USER
    ========================= */

    const {
      data: { user: authenticatedUser },
    } = await supabase.auth.getUser();

    /* =========================
       PERMANENT CRM HISTORY
    ========================= */

    const previousLabel =
      getCRMStageLabel(previousStatus);

    const newLabel =
      getCRMStageLabel(normalizedNewStatus);

    const { error: activityError } = await supabase
      .from("lead_activities")
      .insert({
        lead_id: leadId,

        activity_type: "status_change",

        title: `Moved from ${previousLabel} to ${newLabel}`,

        notes: `${currentLead.business_name ||
          currentLead.restaurant_name ||
          currentLead.email ||
          "Lead"} moved from ${previousLabel} to ${newLabel}.`,

        previous_status: previousStatus,
        new_status: normalizedNewStatus,

        completed_at: now,

        created_by:
          authenticatedUser?.id || null,
      });

    if (activityError) {
      console.error(
        "CRM ACTIVITY HISTORY FAILED:",
        activityError
      );

      alert(
        "Lead stage was updated, but the CRM activity history could not be saved."
      );
    }

    /* =========================
       UPDATE ADMIN UI
    ========================= */

    setApolloLeads((prev) =>
      (prev || []).map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              ...leadUpdates,
            }
          : lead
      )
    );
setSelectedCRMLead((prev) =>
  prev?.id === leadId
    ? {
        ...prev,
        ...leadUpdates,
      }
    : prev
);

if (selectedCRMLead?.id === leadId) {
  await loadCRMLeadActivities(leadId);
}
    console.log("CRM STAGE UPDATED:", {
      leadId,
      previousStatus,
      newStatus: normalizedNewStatus,
      leadUpdates,
    });
  } catch (error) {
    console.error(
      "CRM LEAD STATUS UPDATE FAILED:",
      error
    );

    alert(
      error?.message ||
        "Could not update the CRM stage."
    );
  }
};
const loadCRMLeadActivities = async (leadId) => {
  if (!leadId) {
    setSelectedCRMActivities([]);
    return;
  }

  try {
    setCrmActivitiesLoading(true);

    const { data, error } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    setSelectedCRMActivities(data || []);
  } catch (error) {
    console.error(
      "CRM ACTIVITY LOAD FAILED:",
      error
    );

    setSelectedCRMActivities([]);
  } finally {
    setCrmActivitiesLoading(false);
  }
};

const openCRMLead = async (lead) => {
  if (!lead?.id) return;

  setSelectedCRMLead(lead);
  await loadCRMLeadActivities(lead.id);
};

const closeCRMLead = () => {
  setSelectedCRMLead(null);
  setSelectedCRMActivities([]);
};
/* =========================
   CRM DAILY ACTIVITY HELPERS
========================= */

const createCRMActivity = async ({
  leadId,
  activityType,
  title,
  notes = "",
  contactMethod = null,
  scheduledFor = null,
  completedAt = null,
}) => {
  if (!leadId) {
    throw new Error("Missing CRM lead ID.");
  }

  const {
    data: { user: authenticatedUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  const { data, error } = await supabase
    .from("lead_activities")
    .insert({
      lead_id: leadId,
      activity_type: activityType,
      title,
      notes: notes || null,
      contact_method: contactMethod,
      scheduled_for: scheduledFor,
      completed_at:
        completedAt || new Date().toISOString(),
      created_by: authenticatedUser?.id || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};


/* =========================
   LOG EMAIL / CALL / LINKEDIN
========================= */

const logCRMContact = async (
  lead,
  contactMethod,
  notes = ""
) => {
  if (!lead?.id) return;

  try {
    const now = new Date().toISOString();

    const cleanMethod = String(
      contactMethod || ""
    )
      .trim()
      .toLowerCase();

    const methodLabels = {
      email: "Email",
      call: "Phone Call",
      linkedin: "LinkedIn",
    };

    const methodLabel =
      methodLabels[cleanMethod] ||
      "Contact";

    const { error: leadError } = await supabase
      .from("leads")
      .update({
        last_contacted_at: now,
        first_contacted_at:
          lead.first_contacted_at || now,
        updated_at: now,
      })
      .eq("id", lead.id);

    if (leadError) {
      throw leadError;
    }

    await createCRMActivity({
      leadId: lead.id,
      activityType: "contact",
      title: `${methodLabel} logged`,
      notes,
      contactMethod: cleanMethod,
      completedAt: now,
    });

    const leadUpdates = {
      last_contacted_at: now,
      first_contacted_at:
        lead.first_contacted_at || now,
      updated_at: now,
    };

    setApolloLeads((prev) =>
      (prev || []).map((item) =>
        item.id === lead.id
          ? {
              ...item,
              ...leadUpdates,
            }
          : item
      )
    );

    setSelectedCRMLead((prev) =>
      prev?.id === lead.id
        ? {
            ...prev,
            ...leadUpdates,
          }
        : prev
    );

    await loadCRMLeadActivities(lead.id);
  } catch (error) {
    console.error(
      "CRM CONTACT LOG FAILED:",
      error
    );

    alert(
      error?.message ||
        "Could not log CRM contact."
    );
  }
};


/* =========================
   SAVE CRM NOTE
========================= */

const saveCRMNote = async (lead, noteText) => {
  if (!lead?.id) return;

  const cleanNote = String(noteText || "").trim();

  if (!cleanNote) {
    alert("Enter a note first.");
    return;
  }

  try {
    const now = new Date().toISOString();

    const existingNotes = String(
      lead.notes || ""
    ).trim();

    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${cleanNote}`
      : cleanNote;

    const { error: leadError } = await supabase
      .from("leads")
      .update({
        notes: updatedNotes,
        updated_at: now,
      })
      .eq("id", lead.id);

    if (leadError) {
      throw leadError;
    }

    await createCRMActivity({
      leadId: lead.id,
      activityType: "note",
      title: "CRM note added",
      notes: cleanNote,
      completedAt: now,
    });

    const leadUpdates = {
      notes: updatedNotes,
      updated_at: now,
    };

    setApolloLeads((prev) =>
      (prev || []).map((item) =>
        item.id === lead.id
          ? {
              ...item,
              ...leadUpdates,
            }
          : item
      )
    );

    setSelectedCRMLead((prev) =>
      prev?.id === lead.id
        ? {
            ...prev,
            ...leadUpdates,
          }
        : prev
    );

    await loadCRMLeadActivities(lead.id);
  } catch (error) {
    console.error(
      "CRM NOTE SAVE FAILED:",
      error
    );

    alert(
      error?.message ||
        "Could not save CRM note."
    );
  }
};


/* =========================
   SCHEDULE NEXT FOLLOW-UP
========================= */

const scheduleCRMFollowUp = async (
  lead,
  followUpDateTime,
  notes = ""
) => {
  if (!lead?.id) return;

  if (!followUpDateTime) {
    alert("Choose a follow-up date and time.");
    return;
  }

  try {
    const followUpDate = new Date(
      followUpDateTime
    );

    if (
      Number.isNaN(followUpDate.getTime())
    ) {
      alert("Choose a valid follow-up date.");
      return;
    }

    const followUpISO =
      followUpDate.toISOString();

    const now = new Date().toISOString();

    const { error: leadError } = await supabase
      .from("leads")
      .update({
        next_follow_up_at: followUpISO,
        next_action: "Follow up",
        updated_at: now,
      })
      .eq("id", lead.id);

    if (leadError) {
      throw leadError;
    }

    await createCRMActivity({
      leadId: lead.id,
      activityType: "follow_up_scheduled",
      title: "Follow-up scheduled",
      notes:
        notes ||
        `Follow-up scheduled for ${followUpDate.toLocaleString()}.`,
      scheduledFor: followUpISO,
      completedAt: now,
    });

    const leadUpdates = {
      next_follow_up_at: followUpISO,
      next_action: "Follow up",
      updated_at: now,
    };

    setApolloLeads((prev) =>
      (prev || []).map((item) =>
        item.id === lead.id
          ? {
              ...item,
              ...leadUpdates,
            }
          : item
      )
    );

    setSelectedCRMLead((prev) =>
      prev?.id === lead.id
        ? {
            ...prev,
            ...leadUpdates,
          }
        : prev
    );

    await loadCRMLeadActivities(lead.id);
  } catch (error) {
    console.error(
      "CRM FOLLOW-UP SCHEDULE FAILED:",
      error
    );

    alert(
      error?.message ||
        "Could not schedule CRM follow-up."
    );
  }
};
const saveManualCRMProspect = async () => {
  try {
    const businessName = String(
      newProspect.business_name || ""
    ).trim();

    const contactName = String(
      newProspect.owner_name || ""
    ).trim();

    if (!businessName) {
      alert("Enter the restaurant or company name.");
      return;
    }

    if (!contactName) {
      alert("Enter the contact name.");
      return;
    }

    const now = new Date().toISOString();

    const cleanEmail = String(
      newProspect.email || ""
    ).trim();

    const followUpISO = newProspect.next_follow_up_at
      ? new Date(
          newProspect.next_follow_up_at
        ).toISOString()
      : null;

    const estimatedMonthlyValue = Number(
      newProspect.estimated_monthly_value || 0
    );

    const leadPayload = {
      business_name: businessName,
      restaurant_name: businessName,

      owner_name: contactName,
      full_name: contactName,

      contact_title:
        String(newProspect.contact_title || "").trim() ||
        null,

      email: cleanEmail || null,

      phone:
        String(newProspect.phone || "").trim() ||
        null,

      city:
        String(newProspect.city || "").trim() ||
        null,

      state:
        String(newProspect.state || "").trim() ||
        null,

      source:
        String(newProspect.source || "manual")
          .trim()
          .toLowerCase(),

      lead_source:
        String(newProspect.source || "manual")
          .trim()
          .toLowerCase(),

          contact_method:
  String(newProspect.contact_method || "")
    .trim()
    .toLowerCase() || null,

      status:
        String(
          newProspect.status || "not_contacted"
        )
          .trim()
          .toLowerCase(),

      notes:
        String(newProspect.notes || "").trim() ||
        null,

      next_action:
        String(newProspect.next_action || "").trim() ||
        null,

      next_follow_up_at: followUpISO,

      estimated_monthly_value:
        Number.isFinite(estimatedMonthlyValue)
          ? estimatedMonthlyValue
          : 0,

      recommended_plan:
        String(
          newProspect.recommended_plan || ""
        ).trim() || null,

      updated_at: now,
    };

    const contactedMethods = [
      "in_person",
      "email",
      "phone",
      "linkedin",
      "text",
      "video_call",
    ];

    const hasInitialContact =
      contactedMethods.includes(
        String(newProspect.contact_method || "")
          .trim()
          .toLowerCase()
      );

    if (hasInitialContact) {
      leadPayload.first_contacted_at = now;
      leadPayload.last_contacted_at = now;
    }

    const { data: createdLead, error: leadError } =
      await supabase
        .from("leads")
        .insert(leadPayload)
        .select()
        .single();

    if (leadError) {
      throw leadError;
    }

    await createCRMActivity({
      leadId: createdLead.id,
      activityType: "prospect_created",
      title: `Prospect added: ${businessName}`,
      notes:
        String(newProspect.notes || "").trim() ||
        `${contactName} added to the Serven Sales CRM.`,
      contactMethod:
        String(
          newProspect.contact_method || ""
        )
          .trim()
          .toLowerCase() || null,
      scheduledFor: followUpISO,
      completedAt: now,
    });

    setApolloLeads((prev) => [
      createdLead,
      ...(prev || []),
    ]);

    setSelectedCRMLead(createdLead);

    await loadCRMLeadActivities(createdLead.id);

    setNewProspect({
      business_name: "",
      owner_name: "",
      contact_title: "",
      email: "",
      phone: "",
      city: "",
      state: "",
     source: "walk_in",
      contact_method: "in_person",
      status: "not_contacted",
      notes: "",
      next_action: "",
      next_follow_up_at: "",
      estimated_monthly_value: "",
      recommended_plan: "",
    });

    setShowAddProspectForm(false);

    alert("Prospect added to Serven Sales CRM.");
  } catch (error) {
    console.error(
      "MANUAL CRM PROSPECT SAVE FAILED:",
      error
    );

    alert(
      error?.message ||
        "Could not add prospect."
    );
  }
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

/* =========================
   SERVEN SALES CRM METRICS
========================= */

const salesCRMStats = useMemo(() => {
  const prospects = Array.isArray(apolloLeads)
    ? apolloLeads
    : [];

  const now = Date.now();

  const normalizeStatus = (lead) =>
    String(lead?.status || "new")
      .trim()
      .toLowerCase();

  const closedStatuses = [
    "won",
    "lost",
    "no_response",
    "closed_won",
    "closed_lost",
  ];

  const activeProspects = prospects.filter(
    (lead) =>
      !closedStatuses.includes(
        normalizeStatus(lead)
      )
  );

  const needFollowUp = activeProspects.filter(
    (lead) => {
      if (!lead.next_follow_up_at) return false;

      const followUpTime = new Date(
        lead.next_follow_up_at
      ).getTime();

      return (
        Number.isFinite(followUpTime) &&
        followUpTime <= now
      );
    }
  );

  const interested = prospects.filter(
    (lead) =>
      normalizeStatus(lead) === "interested"
  );

  const demos = prospects.filter(
    (lead) =>
      normalizeStatus(lead) ===
      "demo_scheduled"
  );

  const activePilots = prospects.filter(
    (lead) =>
      ["pilot_started", "pilot_active"].includes(
        normalizeStatus(lead)
      )
  );

  const proposalsOut = prospects.filter(
    (lead) =>
      ["proposal_sent", "negotiating"].includes(
        normalizeStatus(lead)
      )
  );

  const wonClients = prospects.filter(
    (lead) =>
      ["won", "closed_won"].includes(
        normalizeStatus(lead)
      )
  );

  const lostProspects = prospects.filter(
    (lead) =>
      ["lost", "closed_lost"].includes(
        normalizeStatus(lead)
      )
  );

  const pipelineMRR = activeProspects.reduce(
    (sum, lead) =>
      sum +
      Number(
        lead.estimated_monthly_value || 0
      ),
    0
  );

  return {
    totalProspects: prospects.length,
    activeProspects: activeProspects.length,
    needFollowUp: needFollowUp.length,
    interested: interested.length,
    demos: demos.length,
    activePilots: activePilots.length,
    proposalsOut: proposalsOut.length,
    wonClients: wonClients.length,
    lostProspects: lostProspects.length,
    pipelineMRR,
  };
}, [apolloLeads]);
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
const riskEligibleClients = useMemo(() => {
  return customers.filter((client) => {
    const status = String(client.customer_status || "")
      .trim()
      .toLowerCase();

    return ["active", "pilot"].includes(status);
  });
}, [customers]);
  const overageRiskClients = useMemo(() => {
  return riskEligibleClients.filter(
    (c) =>
      Number(c.emailUsagePercent || 0) >= 80 ||
      Number(c.smsUsagePercent || 0) >= 80
  );
}, [riskEligibleClients]);

const filteredCRMLeads = useMemo(() => {
  const prospects = Array.isArray(apolloLeads)
    ? apolloLeads
    : [];

  const search = String(crmSearch || "")
    .trim()
    .toLowerCase();

  return prospects.filter((lead) => {
    const status = String(
      lead.status || "new"
    )
      .trim()
      .toLowerCase();

    const source = String(
      lead.source || lead.lead_source || "unknown"
    )
      .trim()
      .toLowerCase();

const activeStatuses = [
  "not_contacted",
  "email_sent",
  "linkedin_sent",
  "called",
  "follow_up_1",
  "follow_up_2",
  "interested",
  "demo_scheduled",
  "pilot_offered",
  "pilot_started",
  "pilot_active",
  "pilot_completed",
  "proposal_sent",
  "negotiating",
];

const matchesView =
  crmViewFilter === "all"
    ? true
    : crmViewFilter === "active"
    ? activeStatuses.includes(status)
    : crmViewFilter === "follow_up"
    ? Boolean(
        lead.next_follow_up_at &&
          new Date(lead.next_follow_up_at).getTime() <= Date.now()
      )
    : crmViewFilter === "interested"
    ? status === "interested"
    : crmViewFilter === "demos"
    ? status === "demo_scheduled"
    : crmViewFilter === "pilots"
    ? ["pilot_started", "pilot_active"].includes(status)
    : crmViewFilter === "won"
    ? ["won", "closed_won"].includes(status)
    : crmViewFilter === "apollo"
    ? source === "apollo"
    : true;


    const searchableText = [
      lead.business_name,
      lead.restaurant_name,
      lead.owner_name,
      lead.full_name,
      lead.email,
      lead.phone,
      lead.city,
      lead.state,
      lead.website,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !search || searchableText.includes(search);

    const matchesStage =
      crmStageFilter === "all" ||
      status === crmStageFilter;

    const matchesSource =
      crmSourceFilter === "all" ||
      source === crmSourceFilter;

   return (
  matchesView &&
  matchesSearch &&
  matchesStage &&
  matchesSource
);
  });
}, [
  apolloLeads,
  crmSearch,
  crmStageFilter,
  crmSourceFilter,
  crmViewFilter,
]);

/* =========================
   SERVEN OWNER SUMMARY
========================= */

const servenOwnerSummary = useMemo(() => {
  const performanceRate = 0.15;

  const totalVerifiedRecovery = Number(
    stats?.totalAIProfitGenerated || 0
  );

  const totalPerformanceFees =
    totalVerifiedRecovery * performanceRate;

  // We will connect actual client base fees from Admin next.
  const totalPlatformRevenue = 0;

  const totalMonthlyRevenue =
    totalPerformanceFees + totalPlatformRevenue;

  const totalClients = customers.length;

  const activeClients = customers.filter(
    (client) =>
      String(client.customer_status || "").toLowerCase() === "active"
  ).length;

  const pilotClients = customers.filter(
    (client) =>
      String(client.customer_status || "").toLowerCase() === "pilot"
  ).length;

  const averageRecoveryPerClient =
    totalClients > 0
      ? totalVerifiedRecovery / totalClients
      : 0;

  return {
    totalVerifiedRecovery,
    totalPerformanceFees,
    totalPlatformRevenue,
    totalMonthlyRevenue,
    totalClients,
    activeClients,
    pilotClients,
    averageRecoveryPerClient,
  };
}, [
  stats?.totalAIProfitGenerated,
  customers,
]);

const topRecoveringClients = useMemo(() => {
  return (customers || [])
    .map((client) => {
      const verifiedRecovery = Number(
        client.aiProfitGenerated || 0
      );

      const performanceFee =
        verifiedRecovery * 0.15;

      return {
        ...client,
        verifiedRecovery,
        performanceFee,
      };
    })
    .filter((client) => client.verifiedRecovery > 0)
    .sort(
      (a, b) =>
        b.verifiedRecovery - a.verifiedRecovery
    )
    .slice(0, 10);
}, [customers]);

const clientInvoiceQueue = useMemo(() => {
  return (customers || [])
    .map((client) => {
      const verifiedRecovery = Number(
        client.aiProfitGenerated || 0
      );

      const performanceFee =
        verifiedRecovery * 0.15;

      const platformFee = Number(
        client.monthly_price ||
        client.platform_fee ||
        client.base_fee ||
        0
      );

      const totalDue =
        performanceFee + platformFee;

      return {
        ...client,
        verifiedRecovery,
        performanceFee,
        platformFee,
        totalDue,
      };
    })
    .filter(
      (client) =>
        client.verifiedRecovery > 0 ||
        client.platformFee > 0
    )
    .sort(
      (a, b) =>
        b.totalDue - a.totalDue
    );
}, [customers]);

const servenRevenueForecast = useMemo(() => {
  const currentPerformanceFees = Number(
    servenOwnerSummary?.totalPerformanceFees || 0
  );

  const currentPlatformRevenue = (customers || []).reduce(
    (sum, client) =>
      sum +
      Number(
        client.monthly_price ||
        client.platform_fee ||
        client.base_fee ||
        0
      ),
    0
  );

  const currentMonthlyRevenue =
    currentPerformanceFees + currentPlatformRevenue;

  const pendingContractRevenue = (customers || []).reduce(
    (sum, client) => {
      const status = String(
        client.customer_status || ""
      ).toLowerCase();

      const monthlyPrice = Number(
        client.monthly_price ||
        client.platform_fee ||
        client.base_fee ||
        0
      );

      const isPending =
        status === "lead" ||
        status === "pending" ||
        status === "pilot";

      return isPending
        ? sum + monthlyPrice
        : sum;
    },
    0
  );

  const projectedMonthlyRevenue =
    currentMonthlyRevenue + pendingContractRevenue;

  return {
    currentPerformanceFees,
    currentPlatformRevenue,
    currentMonthlyRevenue,
    pendingContractRevenue,
    projectedMonthlyRevenue,
  };
}, [
  customers,
  servenOwnerSummary?.totalPerformanceFees,
]);

const servenRevenueTrend = useMemo(() => {
  const months = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - offset);

    const year = date.getFullYear();
    const month = date.getMonth();

    const label = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    const verifiedActions = (aiActions || []).filter((action) => {
      const status = String(
        action.status ||
        action.recovery_status ||
        ""
      ).toLowerCase();

      const isVerified =
        status === "verified" ||
        status === "completed" ||
        action.verified === true ||
        action.is_verified === true;

      if (!isVerified) return false;

      const rawDate =
        action.completed_at ||
        action.updated_at ||
        action.created_at;

      if (!rawDate) return false;

      const actionDate = new Date(rawDate);

      return (
        !Number.isNaN(actionDate.getTime()) &&
        actionDate.getFullYear() === year &&
        actionDate.getMonth() === month
      );
    });

    const verifiedRecovery = verifiedActions.reduce(
      (sum, action) => {
        const recoveredValue = Number(
          action.actual_recovery ||
          action.actualRecovery ||
          action.recovered_profit ||
          action.recoveredProfit ||
          action.verified_recovered ||
          action.recovered ||
          action.impact_value ||
          action.impactValue ||
          0
        );

        return (
          sum +
          (Number.isFinite(recoveredValue)
            ? recoveredValue
            : 0)
        );
      },
      0
    );

    const performanceFees =
      verifiedRecovery * 0.15;

    months.push({
      label,
      verifiedRecovery,
      performanceFees,
    });
  }

  return months;
}, [aiActions]);

const clientsRequiringAttention = useMemo(() => {
  const now = Date.now();

  return (customers || [])
    .map((client) => {
      const reasons = [];

      const healthScore = Number(client.healthScore || 0);

      const billingStatus = String(
        client.billingStatus || ""
      ).toLowerCase();

      const verifiedRecovery = Number(
        client.aiProfitGenerated || 0
      );

      const lastUploadDate = client.lastUpload
        ? new Date(client.lastUpload)
        : null;

      const daysSinceUpload =
        lastUploadDate &&
        !Number.isNaN(lastUploadDate.getTime())
          ? Math.floor(
              (now - lastUploadDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

      if (!client.lastUpload) {
        reasons.push({
          label: "No uploads yet",
          severity: "critical",
        });
      } else if (
        daysSinceUpload !== null &&
        daysSinceUpload >= 14
      ) {
        reasons.push({
          label: `No upload in ${daysSinceUpload} days`,
          severity: "warning",
        });
      }

      if (healthScore <= 55) {
        reasons.push({
          label: `Health score ${healthScore}%`,
          severity: "critical",
        });
      } else if (healthScore <= 80) {
        reasons.push({
          label: `Health score ${healthScore}%`,
          severity: "warning",
        });
      }

      if (
        ["past_due", "unpaid"].includes(
          billingStatus
        )
      ) {
        reasons.push({
          label: "Billing needs attention",
          severity: "critical",
        });
      }

      if (
        String(client.customer_status || "").toLowerCase() ===
          "active" &&
        verifiedRecovery <= 0
      ) {
        reasons.push({
          label: "No verified recovery yet",
          severity: "warning",
        });
      }

      const priorityScore = reasons.reduce(
        (score, reason) =>
          score +
          (reason.severity === "critical"
            ? 2
            : 1),
        0
      );

      return {
        ...client,
        attentionReasons: reasons,
        attentionPriority: priorityScore,
        daysSinceUpload,
        verifiedRecovery,
      };
    })
    .filter(
      (client) =>
        client.attentionReasons.length > 0
    )
    .sort(
      (a, b) =>
        b.attentionPriority -
        a.attentionPriority
    );
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
       <div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  <button onClick={fetchCustomers} style={refreshButton}>
    Refresh Data
  </button>

  <button onClick={resetMonthlyUsage} style={refreshButton}>
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
      </div>
      {/* =========================
   ADMIN NAVIGATION
========================= */}

<div
  style={{
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "24px",
    padding: "10px",
    borderRadius: "16px",
    background: "rgba(15,23,42,0.88)",
    border: "1px solid rgba(148,163,184,0.12)",
    position: "sticky",
    top: "10px",
    zIndex: 100,
    backdropFilter: "blur(12px)",
  }}
>
  {[
    { value: "executive", label: "Overview" },
    { value: "clients", label: "Clients" },
    { value: "revenue", label: "Revenue" },
    { value: "billing", label: "Billing" },
    { value: "sales_crm", label: "Sales CRM" },
    { value: "growth", label: "Growth" },
    { value: "risk", label: "Risk" },
  ].map((item) => {
    const active = adminView === item.value;

    return (
      <button
        key={item.value}
        type="button"
        onClick={() => setAdminView(item.value)}
        style={{
          padding: "9px 14px",
          borderRadius: "10px",
          border: active
            ? "1px solid rgba(129,140,248,0.55)"
            : "1px solid rgba(148,163,184,0.12)",
          background: active
            ? "rgba(99,102,241,0.20)"
            : "rgba(255,255,255,0.035)",
          color: active ? "#c7d2fe" : "#94a3b8",
          fontSize: "12px",
          fontWeight: "900",
          cursor: "pointer",
        }}
      >
        {item.label}
      </button>
    );
  })}
</div>
{adminView === "executive" && (
  <> 
{/* =========================
   SERVEN OWNER PERFORMANCE
========================= */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "20px",
    padding: "24px",
    borderRadius: "26px",
    background:
      "radial-gradient(circle at top right, rgba(109,61,245,0.20), transparent 34%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))",
    border: "1px solid rgba(167,139,250,0.22)",
    boxShadow: "0 24px 70px rgba(2,6,23,0.30)",
  }}
>
  <div
    style={{
      color: "#c4b5fd",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    Serven Owner Performance
  </div>

  <h2
    style={{
      margin: 0,
      color: "white",
      fontSize: "30px",
      fontWeight: "950",
      letterSpacing: "-0.03em",
    }}
  >
    Revenue & Recovery Overview
  </h2>

  <p
    style={{
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
      marginTop: "8px",
      marginBottom: "20px",
    }}
  >
    Track verified client recovery, performance fees, platform revenue,
    and total monthly Serven revenue.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
      gap: "14px",
    }}
  >
    <StatCard
      label="Verified Client Recovery"
      value={`$${Number(
        servenOwnerSummary.totalVerifiedRecovery || 0
      ).toLocaleString()}`}
    />

    <StatCard
      label="Performance Fees (15%)"
      value={`$${Number(
        servenOwnerSummary.totalPerformanceFees || 0
      ).toLocaleString()}`}
    />

    <StatCard
      label="Platform Revenue"
      value={
        Number(servenOwnerSummary.totalPlatformRevenue || 0) > 0
          ? `$${Number(
              servenOwnerSummary.totalPlatformRevenue || 0
            ).toLocaleString()}`
          : "Not Connected"
      }
    />

    <StatCard
      label="Total Monthly Revenue"
      value={`$${Number(
        servenOwnerSummary.totalMonthlyRevenue || 0
      ).toLocaleString()}`}
    />

    <StatCard
      label="Active Clients"
      value={servenOwnerSummary.activeClients}
    />

    <StatCard
      label="Pilot Clients"
      value={servenOwnerSummary.pilotClients}
    />

    <StatCard
      label="Avg Recovery / Client"
      value={`$${Number(
        servenOwnerSummary.averageRecoveryPerClient || 0
      ).toLocaleString()}`}
    />
  </div>
</div>
  </>
)}
{adminView === "clients" && (
  <>
{/* =========================
   TOP RECOVERING CLIENTS
========================= */}
<div
  style={{
    marginBottom: "20px",
    padding: "22px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(15,23,42,0.96))",
    border: "1px solid rgba(34,197,94,0.18)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      color: "#86efac",
      fontSize: "11px",
      fontWeight: "900",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    Client Recovery Leaderboard
  </div>

  <h2
    style={{
      color: "white",
      fontSize: "24px",
      fontWeight: "950",
      margin: "0 0 6px",
    }}
  >
    Top Recovering Clients
  </h2>

  <p
    style={{
      color: "#94a3b8",
      fontSize: "13px",
      margin: "0 0 18px",
      lineHeight: 1.6,
    }}
  >
    See which clients have the most verified recovery and the corresponding
    15% Serven performance fee.
  </p>

  {topRecoveringClients.length === 0 ? (
    <div
      style={{
        padding: "18px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        color: "#94a3b8",
        fontSize: "13px",
      }}
    >
      No verified client recovery has been recorded yet.
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      {topRecoveringClients.map((client, index) => (
        <div
          key={client.id}
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.7fr) minmax(130px, 0.8fr) minmax(130px, 0.8fr) minmax(120px, 0.7fr)",
            gap: "14px",
            alignItems: "center",
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: "#86efac",
                fontSize: "10px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "4px",
              }}
            >
              #{index + 1} Recovery Client
            </div>

            <div
              style={{
                color: "white",
                fontSize: "16px",
                fontWeight: "900",
                overflowWrap: "anywhere",
              }}
            >
              {client.restaurant_name || client.email || "Unnamed Client"}
            </div>

            <div
              style={{
                color: "#64748b",
                fontSize: "12px",
                marginTop: "3px",
                overflowWrap: "anywhere",
              }}
            >
              {client.email}
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "10px",
                fontWeight: "900",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Verified Recovery
            </div>

            <div
              style={{
                color: "#86efac",
                fontSize: "20px",
                fontWeight: "950",
              }}
            >
              ${Number(client.verifiedRecovery || 0).toLocaleString()}
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "10px",
                fontWeight: "900",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Performance Fee
            </div>

            <div
              style={{
                color: "#c4b5fd",
                fontSize: "20px",
                fontWeight: "950",
              }}
            >
              ${Number(client.performanceFee || 0).toLocaleString()}
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "10px",
                fontWeight: "900",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Status
            </div>

            <div
              style={{
                color: "white",
                fontSize: "13px",
                fontWeight: "850",
                textTransform: "capitalize",
              }}
            >
              {client.customer_status || "lead"}
            </div>

            <div
              style={{
                color: "#64748b",
                fontSize: "11px",
                marginTop: "3px",
                textTransform: "capitalize",
              }}
            >
              {client.plan || "starter"}
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
  </>
)}
{adminView === "revenue" && (
  <>
{/* =========================
   SERVEN REVENUE FORECAST
========================= */}
<div
  style={{
    marginBottom: "20px",
    padding: "22px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(14,165,233,0.10), rgba(15,23,42,0.96))",
    border: "1px solid rgba(56,189,248,0.18)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      color: "#7dd3fc",
      fontSize: "11px",
      fontWeight: "900",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    Serven Revenue Forecast
  </div>

  <h2
    style={{
      color: "white",
      fontSize: "24px",
      fontWeight: "950",
      margin: "0 0 6px",
    }}
  >
    Monthly Revenue Outlook
  </h2>

  <p
    style={{
      color: "#94a3b8",
      fontSize: "13px",
      margin: "0 0 18px",
      lineHeight: 1.6,
    }}
  >
    Track current recurring revenue, performance fees, and additional
    contracted revenue that could move into the monthly run rate.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <StatCard
      label="Performance Fees"
      value={`$${Number(
        servenRevenueForecast.currentPerformanceFees || 0
      ).toLocaleString()}`}
    />

    <StatCard
      label="Platform Revenue"
      value={
        Number(
          servenRevenueForecast.currentPlatformRevenue || 0
        ) > 0
          ? `$${Number(
              servenRevenueForecast.currentPlatformRevenue || 0
            ).toLocaleString()}`
          : "Not Connected"
      }
    />

    <StatCard
      label="Current Monthly Revenue"
      value={`$${Number(
        servenRevenueForecast.currentMonthlyRevenue || 0
      ).toLocaleString()}`}
    />

    <StatCard
      label="Pending Contract Revenue"
      value={`$${Number(
        servenRevenueForecast.pendingContractRevenue || 0
      ).toLocaleString()}`}
    />

    <StatCard
      label="Projected Monthly Revenue"
      value={`$${Number(
        servenRevenueForecast.projectedMonthlyRevenue || 0
      ).toLocaleString()}`}
    />
  </div>
</div>

{/* =========================
   MONTHLY RECOVERY TREND
========================= */}
<div
  style={{
    marginBottom: "20px",
    padding: "22px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(15,23,42,0.96))",
    border: "1px solid rgba(34,197,94,0.16)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      color: "#86efac",
      fontSize: "11px",
      fontWeight: "900",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    Serven Recovery Trend
  </div>

  <h2
    style={{
      color: "white",
      fontSize: "24px",
      fontWeight: "950",
      margin: "0 0 6px",
    }}
  >
    Monthly Verified Recovery
  </h2>

  <p
    style={{
      color: "#94a3b8",
      fontSize: "13px",
      margin: "0 0 18px",
      lineHeight: 1.6,
    }}
  >
    Verified client profit recovery and the corresponding 15% Serven
    performance fee across the last six months.
  </p>

  <div
    style={{
      display: "grid",
      gap: "12px",
    }}
  >
    {servenRevenueTrend.map((month) => {
      const maxRecovery = Math.max(
        1,
        ...servenRevenueTrend.map((item) =>
          Number(item.verifiedRecovery || 0)
        )
      );

      const recoveryWidth = Math.min(
        100,
        (Number(month.verifiedRecovery || 0) / maxRecovery) * 100
      );

      const feeWidth = Math.min(
        100,
        (Number(month.performanceFees || 0) / maxRecovery) * 100
      );

      return (
        <div
          key={month.label}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                color: "white",
                fontWeight: "900",
                fontSize: "13px",
              }}
            >
              {month.label}
            </div>

            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              Recovery:{" "}
              <span style={{ color: "#86efac", fontWeight: "900" }}>
                ${Number(month.verifiedRecovery || 0).toLocaleString()}
              </span>
              {"  "}â€¢{"  "}
              Fee:{" "}
              <span style={{ color: "#c4b5fd", fontWeight: "900" }}>
                ${Number(month.performanceFees || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div
            style={{
              height: "10px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                width: `${recoveryWidth}%`,
                height: "100%",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, rgba(34,197,94,0.85), rgba(134,239,172,0.9))",
              }}
            />
          </div>

          <div
            style={{
              height: "6px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.04)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${feeWidth}%`,
                height: "100%",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, rgba(168,85,247,0.85), rgba(196,181,253,0.9))",
              }}
            />
          </div>
        </div>
      );
    })}
  </div>
</div>
{adminView === "risk" && (
  <>
{/* =========================
   CLIENTS REQUIRING ATTENTION
========================= */}
<div
  style={{
    marginBottom: "20px",
    padding: "22px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(15,23,42,0.96))",
    border: "1px solid rgba(248,113,113,0.16)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      color: "#fca5a5",
      fontSize: "11px",
      fontWeight: "900",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    Owner Action Queue
  </div>

  <h2
    style={{
      color: "white",
      fontSize: "24px",
      fontWeight: "950",
      margin: "0 0 6px",
    }}
  >
    Clients Requiring Attention Today
  </h2>

  <p
    style={{
      color: "#94a3b8",
      fontSize: "13px",
      margin: "0 0 18px",
      lineHeight: 1.6,
    }}
  >
    Clients are prioritized by onboarding gaps, stale uploads, health risk,
    billing issues, and missing verified recovery.
  </p>

  {clientsRequiringAttention.length === 0 ? (
    <div
      style={{
        padding: "18px",
        borderRadius: "16px",
        background: "rgba(34,197,94,0.06)",
        border: "1px solid rgba(34,197,94,0.14)",
        color: "#86efac",
        fontSize: "13px",
        fontWeight: "800",
      }}
    >
      No clients currently require immediate attention.
    </div>
  ) : (
    <div style={{ display: "grid", gap: "12px" }}>
      {clientsRequiringAttention.map((client) => (
        <div
          key={client.id}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.035)",
            border:
              client.attentionPriority >= 4
                ? "1px solid rgba(248,113,113,0.22)"
                : "1px solid rgba(245,158,11,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "900",
                  overflowWrap: "anywhere",
                }}
              >
                {client.restaurant_name || client.email || "Unnamed Client"}
              </div>

              <div
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  marginTop: "3px",
                  overflowWrap: "anywhere",
                }}
              >
                {client.email}
              </div>
            </div>

            <div
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                background:
                  client.attentionPriority >= 4
                    ? "rgba(239,68,68,0.12)"
                    : "rgba(245,158,11,0.12)",
                color:
                  client.attentionPriority >= 4
                    ? "#fca5a5"
                    : "#fcd34d",
                fontSize: "10px",
                fontWeight: "900",
                textTransform: "uppercase",
              }}
            >
              {client.attentionPriority >= 4
                ? "High Attention"
                : "Review Needed"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "12px",
            }}
          >
            {(client.attentionReasons || []).map((reason, index) => (
              <span
                key={`${client.id}-${index}`}
                style={{
                  padding: "5px 9px",
                  borderRadius: "999px",
                  background:
                    reason.severity === "critical"
                      ? "rgba(239,68,68,0.10)"
                      : "rgba(245,158,11,0.10)",
                  color:
                    reason.severity === "critical"
                      ? "#fca5a5"
                      : "#fcd34d",
                  border:
                    reason.severity === "critical"
                      ? "1px solid rgba(248,113,113,0.14)"
                      : "1px solid rgba(245,158,11,0.14)",
                  fontSize: "11px",
                  fontWeight: "800",
                }}
              >
                {reason.severity === "critical" ? "â—" : "â€¢"} {reason.label}
              </span>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
              marginTop: "14px",
            }}
          >
            <div>
              <div style={invoiceLabelStyle}>Verified Recovery</div>
              <div style={invoiceValueStyle}>
                ${Number(client.verifiedRecovery || 0).toLocaleString()}
              </div>
            </div>

            <div>
              <div style={invoiceLabelStyle}>Health Score</div>
              <div style={invoiceValueStyle}>
                {Number(client.healthScore || 0)}%
              </div>
            </div>

            <div>
              <div style={invoiceLabelStyle}>Open Alerts</div>
              <div style={invoiceValueStyle}>
                {Number(client.openAlerts || 0)}
              </div>
            </div>

            <div>
              <div style={invoiceLabelStyle}>Last Upload</div>
              <div style={{ ...invoiceValueStyle, fontSize: "14px" }}>
                {client.lastUpload
                  ? new Date(client.lastUpload).toLocaleDateString()
                  : "Never"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "14px",
            }}
          >
            <button
              type="button"
              onClick={() => markContacted(client.id)}
              style={{
                ...smallActionButton,
                background: "#334155",
              }}
            >
              Mark Contacted
            </button>

            <button
              type="button"
              onClick={() => sendClientEmail(client, "intro")}
              style={{
                ...smallActionButton,
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
  </>
)}
  </>
)}

{adminView === "clients" && (
  <>
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
            <option key={c.id} value={c.id}>{c.restaurant_name || c.email} â€” {c.email}</option>
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
  </>
)}

{adminView === "executive" && (
  <>
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
value={riskEligibleClients.filter((c) => !c.lastUpload).length}
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
  </>
)}

{adminView === "risk" && (
  <>
{/* AT-RISK CLIENTS */}
<div style={panelCard("#ef4444")}>
  <div style={eyebrow}>CLIENT RETENTION RISK</div>
  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    At-Risk Clients
  </h2>

{riskEligibleClients.filter((client) =>
    Number(client.healthScore || 0) <= 55 ||
    ["past_due", "unpaid"].includes(String(client.billingStatus || "").toLowerCase())
  ).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>
      No at-risk clients right now.
    </div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
      {riskEligibleClients
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
        riskEligibleClients.filter(
  (c) => Number(c.healthScore || 0) > 80
).length
      }
    />

    <StatCard
      label="Watch List"
      value={
        riskEligibleClients.filter(
  (c) =>
    Number(c.healthScore || 0) <= 80 &&
    Number(c.healthScore || 0) > 55
).length
      }
    />

    <StatCard
      label="At Risk"
      value={
       riskEligibleClients.filter(
  (c) => Number(c.healthScore || 0) <= 55
).length
      }
    />

    <StatCard
      label="Past Due"
      value={
        riskEligibleClients.filter((c) =>
  ["past_due", "unpaid"].includes(
    String(c.billingStatus || "").toLowerCase()
  )
).length
      }
    />

    <StatCard
      label="No Uploads"
      value={
        riskEligibleClients.filter((c) => !c.lastUpload).length
      }
    />
  </div>
</div>
  </>
)}

{adminView === "billing" && (
  <>
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
  </>
)}
{adminView === "growth" && (
  <>
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
 </>
)}

{adminView === "risk" && (
  <>
{/* CHURN WATCH LIST */}
<div style={panelCard("#f59e0b")}>
  <div style={eyebrow}>EARLY RETENTION WARNINGS</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Churn Watch List
  </h2>
{riskEligibleClients.filter((client) => {
  const healthScore = Number(client.healthScore || 0);

  const billingRisk = ["past_due", "unpaid"].includes(
    String(client.billingStatus || "").toLowerCase()
  );

  const lastUploadDate = client.lastUpload
    ? new Date(client.lastUpload)
    : null;

  const daysSinceUpload =
    lastUploadDate && !Number.isNaN(lastUploadDate.getTime())
      ? Math.floor(
          (Date.now() - lastUploadDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  const inactivityRisk =
    !client.lastUpload ||
    (daysSinceUpload !== null && daysSinceUpload >= 14);

  return (
    healthScore > 55 &&
    healthScore <= 80 &&
    (inactivityRisk || billingRisk || Number(client.openAlerts || 0) > 0)
  );
}).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>No clients on churn watch right now.</div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
    {riskEligibleClients
  .filter((client) => {
    const healthScore = Number(client.healthScore || 0);

    const billingRisk = ["past_due", "unpaid"].includes(
      String(client.billingStatus || "").toLowerCase()
    );

    const lastUploadDate = client.lastUpload
      ? new Date(client.lastUpload)
      : null;

    const daysSinceUpload =
      lastUploadDate && !Number.isNaN(lastUploadDate.getTime())
        ? Math.floor(
            (Date.now() - lastUploadDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

    const inactivityRisk =
      !client.lastUpload ||
      (daysSinceUpload !== null && daysSinceUpload >= 14);

    return (
      healthScore > 55 &&
      healthScore <= 80 &&
      (inactivityRisk || billingRisk || Number(client.openAlerts || 0) > 0)
    );
  })
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
  </>
)}

{adminView === "clients" && (
  <>
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
  </>
)}


{adminView === "growth" && (
  <>
{/* ACCOUNT GROWTH RATE */}
<div style={panelCard("#38bdf8")}>
  <div style={eyebrow}>ACCOUNT GROWTH</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
  Account Growth Rate
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
  </>
)}

{adminView === "clients" && (
  <>
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
  </>
)}

{adminView === "executive" && (
  <>
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
  </>
)}

{adminView === "clients" && (
  <>
{/* CLIENTS NEEDING ONBOARDING */}
<div style={panelCard("#f97316")}>
  <div style={eyebrow}>ONBOARDING PIPELINE</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    Clients Needing Onboarding
  </h2>

  {riskEligibleClients.filter((client) => !client.lastUpload).length === 0 ? (
    <div style={{ color: "#94a3b8" }}>
      No onboarding issues right now.
    </div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "16px" }}>
     {riskEligibleClients
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

  </>
)}

{adminView === "growth" && (
  <>
{/* NEW CLIENTS THIS MONTH */}
<div style={panelCard("#0ea5e9")}>
  <div style={eyebrow}>MONTHLY GROWTH</div>

  <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "18px" }}>
    New Clients This Month
  </h2>

 {riskEligibleClients.filter((client) => {
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
    {riskEligibleClients
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
  </>
)}

{adminView === "clients" && (
  <>
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
  âœ•
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
  </>
)}

{adminView === "sales_crm" && (
  <>
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
                  âœ•
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
        </>
)}
      {adminView === "sales_crm" && (
        <>
{/* =========================
   SERVEN SALES CRM COMMAND CENTER
========================= */}

<div
  style={{
    marginBottom: "20px",
    padding: "24px",
    borderRadius: "26px",
    background:
      "radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 34%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96))",
    border: "1px solid rgba(129,140,248,0.22)",
    boxShadow: "0 24px 70px rgba(2,6,23,0.28)",
  }}
>
  <div
    style={{
      color: "#a5b4fc",
      fontSize: "11px",
      fontWeight: "900",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    Serven Sales CRM
  </div>

  <h2
    style={{
      margin: 0,
      color: "white",
      fontSize: "28px",
      fontWeight: "950",
      letterSpacing: "-0.03em",
    }}
  >
    Sales Pipeline Command Center
  </h2>

  <p
    style={{
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
      marginTop: "8px",
      marginBottom: "20px",
    }}
  >
    Track every prospect from first contact through demo, pilot,
    proposal, and conversion into a Serven client.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "12px",
    }}
  >
    {[
      {
        label: "Total Prospects",
        value: salesCRMStats.totalProspects,
      },
      {
        label: "Active Pipeline",
        value: salesCRMStats.activeProspects,
      },
      {
        label: "Follow-Ups Due",
        value: salesCRMStats.needFollowUp,
      },
      {
        label: "Interested",
        value: salesCRMStats.interested,
      },
      {
        label: "Demos Scheduled",
        value: salesCRMStats.demos,
      },
      {
        label: "Active Pilots",
        value: salesCRMStats.activePilots,
      },
      {
        label: "Proposals Out",
        value: salesCRMStats.proposalsOut,
      },
      {
        label: "Won Clients",
        value: salesCRMStats.wonClients,
      },
      {
        label: "Lost",
        value: salesCRMStats.lostProspects,
      },
      {
        label: "Pipeline MRR",
        value: `$${Number(
          salesCRMStats.pipelineMRR || 0
        ).toLocaleString()}`,
      },
    ].map((metric) => (
      <div
        key={metric.label}
        style={{
          padding: "16px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            color: "#94a3b8",
            fontSize: "10px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: "6px",
          }}
        >
          {metric.label}
        </div>

        <div
          style={{
            color: "white",
            fontSize: "24px",
            fontWeight: "950",
          }}
        >
          {metric.value}
        </div>
      </div>
    ))}
  </div>
</div>
 
{/* =========================
   ADD PROSPECT / LOG OUTREACH
========================= */}

<div
  style={{
    marginBottom: "18px",
    padding: "18px",
    borderRadius: "20px",
    background: "rgba(15,23,42,0.86)",
    border: "1px solid rgba(99,102,241,0.18)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <div style={eyebrow}>NEW SALES ACTIVITY</div>
      <h3
        style={{
          margin: "4px 0 0",
          color: "white",
          fontSize: "20px",
          fontWeight: "900",
        }}
      >
        Add Prospect / Log Outreach
      </h3>
    </div>

    <button
      type="button"
      onClick={() =>
        setShowAddProspectForm((prev) => !prev)
      }
      style={{
        ...smallActionButton,
        background:
          "linear-gradient(135deg,#6366f1,#7c3aed)",
      }}
    >
      {showAddProspectForm
        ? "Close Form"
        : "+ Add Prospect"}
    </button>
  </div>

  {showAddProspectForm && (
    <div
      style={{
        marginTop: "18px",
        display: "grid",
        gap: "14px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "12px",
        }}
      >
        <input
          value={newProspect.business_name}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              business_name: e.target.value,
            }))
          }
          placeholder="Restaurant / Company *"
          style={inputStyle}
        />

        <input
          value={newProspect.owner_name}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              owner_name: e.target.value,
            }))
          }
          placeholder="Contact Name *"
          style={inputStyle}
        />

        <input
          value={newProspect.contact_title}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              contact_title: e.target.value,
            }))
          }
          placeholder="Title / Role"
          style={inputStyle}
        />

        <input
          value={newProspect.email}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
          placeholder="Email"
          style={inputStyle}
        />

        <input
          value={newProspect.phone}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              phone: e.target.value,
            }))
          }
          placeholder="Phone"
          style={inputStyle}
        />

        <input
          value={newProspect.city}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              city: e.target.value,
            }))
          }
          placeholder="City"
          style={inputStyle}
        />

        <input
          value={newProspect.state}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              state: e.target.value,
            }))
          }
          placeholder="State"
          style={inputStyle}
        />

    <select
  value={newProspect.source}
  onChange={(e) =>
    setNewProspect((prev) => ({
      ...prev,
      source: e.target.value,
    }))
  }
  style={selectStyle}
>
  <option value="walk_in">Walk-In</option>
  <option value="cold_research">Cold Research</option>
  <option value="referral">Referral</option>
  <option value="website">Website / Inbound</option>
  <option value="linkedin">LinkedIn</option>
  <option value="apollo">Apollo</option>
  <option value="inbound_demo">Inbound Demo</option>
  <option value="other">Other</option>
</select>

        <select
          value={newProspect.contact_method}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              contact_method: e.target.value,
            }))
          }
          style={selectStyle}
        >
          <option value="in_person">In Person</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="linkedin">LinkedIn</option>
          <option value="text">Text</option>
          <option value="video_call">Video Call</option>
          <option value="none">No Contact Yet</option>
        </select>

        <select
          value={newProspect.status}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              status: e.target.value,
            }))
          }
          style={selectStyle}
        >
          {CRM_PIPELINE_STAGES.map((stage) => (
            <option
              key={stage.value}
              value={stage.value}
            >
              {stage.label}
            </option>
          ))}
        </select>

        <select
          value={newProspect.recommended_plan}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              recommended_plan: e.target.value,
            }))
          }
          style={selectStyle}
        >
          <option value="">Recommended Plan</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="pro">Pro AI</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <input
          type="number"
          min="0"
          value={newProspect.estimated_monthly_value}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              estimated_monthly_value:
                e.target.value,
            }))
          }
          placeholder="Estimated Monthly Deal $"
          style={inputStyle}
        />

        <input
          value={newProspect.next_action}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              next_action: e.target.value,
            }))
          }
          placeholder="Next Action"
          style={inputStyle}
        />

        <input
          type="datetime-local"
          value={newProspect.next_follow_up_at}
          onChange={(e) =>
            setNewProspect((prev) => ({
              ...prev,
              next_follow_up_at:
                e.target.value,
            }))
          }
          style={inputStyle}
        />
      </div>

      <textarea
        value={newProspect.notes}
        onChange={(e) =>
          setNewProspect((prev) => ({
            ...prev,
            notes: e.target.value,
          }))
        }
        placeholder="What happened? What did they say? What should you remember?"
        rows={5}
        style={{
          ...inputStyle,
          width: "100%",
          resize: "vertical",
          boxSizing: "border-box",
          lineHeight: 1.6,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowAddProspectForm(false)
          }
          style={{
            ...smallActionButton,
            background: "#334155",
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={saveManualCRMProspect}
          style={{
            ...smallActionButton,
            background:
              "linear-gradient(135deg,#22c55e,#16a34a)",
          }}
        >
          Save Prospect
        </button>
      </div>
    </div>
  )}
</div>
{/* =========================
   CRM WORKING VIEWS
========================= */}

<div
  style={{
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "14px",
  }}
>
  {[
    { value: "active", label: "Active Pipeline" },
    { value: "follow_up", label: "Follow-Ups Due" },
    { value: "interested", label: "Interested" },
    { value: "demos", label: "Demos" },
    { value: "pilots", label: "Pilots" },
    { value: "won", label: "Won" },
    { value: "apollo", label: "Apollo Imports" },
    { value: "all", label: "All Prospects" },
  ].map((view) => {
    const isActive = crmViewFilter === view.value;

    return (
      <button
        key={view.value}
        type="button"
        onClick={() => setCrmViewFilter(view.value)}
        style={{
          padding: "8px 12px",
          borderRadius: "999px",
          border: isActive
            ? "1px solid rgba(129,140,248,0.55)"
            : "1px solid rgba(148,163,184,0.14)",
          background: isActive
            ? "rgba(99,102,241,0.18)"
            : "rgba(255,255,255,0.035)",
          color: isActive ? "#c7d2fe" : "#94a3b8",
          fontSize: "11px",
          fontWeight: "900",
          cursor: "pointer",
        }}
      >
        {view.label}
      </button>
    );
  })}
</div>
{/* =========================
   SALES CRM SEARCH + FILTERS
========================= */}

<div
  style={{
    marginBottom: "18px",
    padding: "18px",
    borderRadius: "20px",
    background: "rgba(15,23,42,0.82)",
    border: "1px solid rgba(148,163,184,0.14)",
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "minmax(220px, 2fr) minmax(170px, 1fr) minmax(150px, 1fr)",
      gap: "12px",
    }}
  >
    <input
      type="text"
      value={crmSearch}
      onChange={(e) => setCrmSearch(e.target.value)}
      placeholder="Search restaurant, contact, email, phone, city..."
      style={{
        ...inputStyle,
        width: "100%",
        boxSizing: "border-box",
      }}
    />

    <select
      value={crmStageFilter}
      onChange={(e) => setCrmStageFilter(e.target.value)}
      style={selectStyle}
    >
      <option value="all">All Stages</option>

      {CRM_PIPELINE_STAGES.map((stage) => (
        <option
          key={stage.value}
          value={stage.value}
        >
          {stage.label}
        </option>
      ))}

      <option value="new">Legacy: New</option>
      <option value="contacted">Legacy: Contacted</option>
      <option value="closed_won">Legacy: Closed Won</option>
      <option value="closed_lost">Legacy: Closed Lost</option>
    </select>

   <select
  value={crmSourceFilter}
  onChange={(e) => setCrmSourceFilter(e.target.value)}
  style={selectStyle}
>
  <option value="all">All Sources</option>
  <option value="walk_in">Walk-In</option>
  <option value="cold_research">Cold Research</option>
  <option value="referral">Referral</option>
  <option value="website">Website / Inbound</option>
  <option value="linkedin">LinkedIn</option>
  <option value="apollo">Apollo</option>
  <option value="inbound_demo">Inbound Demo</option>
  <option value="other">Other</option>

  {/* Keep temporarily for older CRM records */}
  <option value="manual">Legacy: Manual</option>
  <option value="unknown">Unknown</option>
</select>
  </div>

  <div
    style={{
      marginTop: "10px",
      color: "#64748b",
      fontSize: "12px",
      fontWeight: "700",
    }}
  >
    Showing {filteredCRMLeads.length} of {apolloLeads.length} prospects
  </div>
</div>

{/* =========================
   SALES CRM PROSPECT TABLE
========================= */}

<div
  style={{
    marginBottom: "20px",
    borderRadius: "22px",
    overflow: "hidden",
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(15,23,42,0.86)",
  }}
>
 <div
  style={{
    display: "grid",
    gridTemplateColumns:
      "minmax(180px,1.35fr) minmax(170px,1.2fr) minmax(145px,0.9fr) minmax(180px,1.2fr) minmax(145px,0.9fr) minmax(100px,0.65fr) minmax(120px,0.75fr)",
    gap: "12px",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.035)",
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  }}
>
  <div>Restaurant</div>
  <div>Contact</div>
  <div>Stage</div>
  <div>Next Action</div>
  <div>Follow-Up</div>
  <div>Deal</div>
  <div>Source</div>
</div>

  {filteredCRMLeads.length === 0 ? (
    <div
      style={{
        padding: "24px",
        color: "#94a3b8",
        fontSize: "13px",
      }}
    >
      No prospects match the current CRM filters.
    </div>
  ) : (
    filteredCRMLeads.map((lead) => (
      <div
        key={lead.id}
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(180px,1.35fr) minmax(170px,1.2fr) minmax(145px,0.9fr) minmax(180px,1.2fr) minmax(145px,0.9fr) minmax(100px,0.65fr) minmax(120px,0.75fr)",
          gap: "12px",
          alignItems: "center",
          padding: "14px 16px",
          borderTop: "1px solid rgba(148,163,184,0.08)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <button
  type="button"
  onClick={() => openCRMLead(lead)}
  style={{
    padding: 0,
    border: "none",
    background: "transparent",
    color: "white",
    fontSize: "13px",
    fontWeight: "900",
    overflowWrap: "anywhere",
    cursor: "pointer",
    textAlign: "left",
   
  }}
>
  {lead.business_name ||
    lead.restaurant_name ||
    "Restaurant"}
</button>

          <div
            style={{
              color: "#64748b",
              fontSize: "11px",
              marginTop: "3px",
            }}
          >
            {[lead.city, lead.state]
              .filter(Boolean)
              .join(", ") || "Location unknown"}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: "#cbd5e1",
              fontSize: "12px",
              fontWeight: "800",
            }}
          >
            {lead.owner_name ||
              lead.full_name ||
              "Unknown"}
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "11px",
              marginTop: "3px",
              overflowWrap: "anywhere",
            }}
          >
            {lead.email || "No email"}
          </div>
        </div>

       <div>
  <select
    value={String(lead.status || "new").toLowerCase()}
    onChange={(e) =>
      updateLeadStatus(lead.id, e.target.value)
    }
    style={{
      width: "100%",
      minWidth: "135px",
      padding: "8px 10px",
      borderRadius: "10px",
      border: "1px solid rgba(99,102,241,0.24)",
      background: "rgba(30,41,59,0.96)",
      color: "#c7d2fe",
      fontSize: "11px",
      fontWeight: "850",
      outline: "none",
      cursor: "pointer",
    }}
  >
    {/* Keep existing legacy status selectable during migration */}
    {["new", "contacted", "closed_won", "closed_lost"].includes(
      String(lead.status || "").toLowerCase()
    ) && (
      <option
        value={String(lead.status || "").toLowerCase()}
      >
        {getCRMStageLabel(lead.status)}
      </option>
    )}

    {CRM_PIPELINE_STAGES.map((stage) => (
      <option
        key={stage.value}
        value={stage.value}
      >
        {stage.label}
      </option>
    ))}
  </select>
</div>

        <div
  style={{
    minWidth: 0,
  }}
>
  <div
    style={{
      color: lead.next_action
        ? "#e2e8f0"
        : "#64748b",
      fontSize: "12px",
      fontWeight: lead.next_action
        ? "800"
        : "600",
      lineHeight: 1.45,
      overflowWrap: "anywhere",
    }}
  >
    {lead.next_action || "No next action"}
  </div>

  {lead.last_contacted_at && (
    <div
      style={{
        color: "#64748b",
        fontSize: "10px",
        marginTop: "4px",
      }}
    >
      Last contact{" "}
      {new Date(
        lead.last_contacted_at
      ).toLocaleDateString()}
    </div>
  )}
</div>

        <div>
  {lead.next_follow_up_at ? (
    (() => {
      const followUpTime = new Date(
        lead.next_follow_up_at
      ).getTime();

      const isOverdue =
        Number.isFinite(followUpTime) &&
        followUpTime < Date.now();

      return (
        <div>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 8px",
              borderRadius: "9px",
              background: isOverdue
                ? "rgba(239,68,68,0.12)"
                : "rgba(34,197,94,0.10)",
              border: isOverdue
                ? "1px solid rgba(239,68,68,0.22)"
                : "1px solid rgba(34,197,94,0.18)",
              color: isOverdue
                ? "#fca5a5"
                : "#86efac",
              fontSize: "11px",
              fontWeight: "900",
            }}
          >
            {new Date(
              lead.next_follow_up_at
            ).toLocaleDateString()}
          </div>

          {isOverdue && (
            <div
              style={{
                color: "#ef4444",
                fontSize: "9px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginTop: "4px",
              }}
            >
              Follow-Up Due
            </div>
          )}
        </div>
      );
    })()
  ) : (
    <span
      style={{
        color: "#64748b",
        fontSize: "11px",
      }}
    >
      Not scheduled
    </span>
  )}
</div>

        <div
  style={{
    color:
      Number(
        lead.estimated_monthly_value || 0
      ) > 0
        ? "#86efac"
        : "#64748b",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  }}
>
  {Number(
    lead.estimated_monthly_value || 0
  ) > 0
    ? `$${Number(
        lead.estimated_monthly_value
      ).toLocaleString()}/mo`
    : "—"}
</div>

<div
  style={{
    color: "#94a3b8",
    fontSize: "12px",
    textTransform: "capitalize",
  }}
>
  {String(
    lead.source ||
      lead.lead_source ||
      "unknown"
  ).replaceAll("_", " ")}
</div>
      </div>
    ))
  )}
</div>

{/* =========================
   CRM PROSPECT 360
========================= */}

{selectedCRMLead && (

 <div
  onClick={closeCRMLead}
  style={{
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    background: "rgba(2,6,23,0.82)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  }}
>
  <div
    onClick={(e) => e.stopPropagation()}
    style={{
      width: "min(1100px, 96vw)",
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "24px",
      borderRadius: "26px",
      background:
        "radial-gradient(circle at top right, rgba(139,92,246,0.16), transparent 32%), linear-gradient(135deg, rgba(15,23,42,0.99), rgba(30,41,59,0.99))",
      border: "1px solid rgba(139,92,246,0.28)",
      boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
    }}
  >
    {/* HEADER */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "16px",
        alignItems: "flex-start",
        marginBottom: "22px",
      }}
    >
      <div>
        <div
          style={{
            color: "#c4b5fd",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Prospect 360
        </div>

        <h2
          style={{
            margin: 0,
            color: "white",
            fontSize: "26px",
            fontWeight: "950",
          }}
        >
          {selectedCRMLead.business_name ||
            selectedCRMLead.restaurant_name ||
            "Restaurant"}
        </h2>

        <div
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            marginTop: "5px",
          }}
        >
          {[selectedCRMLead.city, selectedCRMLead.state]
            .filter(Boolean)
            .join(", ") || "Location unknown"}
        </div>
      </div>

      <button
        type="button"
        onClick={closeCRMLead}
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "10px",
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(255,255,255,0.05)",
          color: "#cbd5e1",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "900",
        }}
      >
        âœ•
      </button>
    </div>

    {/* CONTACT + PIPELINE */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
        marginBottom: "18px",
      }}
    >
      {/* CONTACT */}
      <div
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={crm360LabelStyle}>
          Contact
        </div>

        <div style={crm360ValueStyle}>
          {selectedCRMLead.owner_name ||
            selectedCRMLead.full_name ||
            "Unknown"}
        </div>

        <div style={crm360SubValueStyle}>
          {selectedCRMLead.contact_title ||
            "Title not entered"}
        </div>

        <div
          style={{
            ...crm360SubValueStyle,
            marginTop: "10px",
          }}
        >
          {selectedCRMLead.email || "No email"}
        </div>

        <div style={crm360SubValueStyle}>
          {selectedCRMLead.phone || "No phone"}
        </div>
      </div>

      {/* CURRENT STAGE */}
      <div
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={crm360LabelStyle}>
          Current Pipeline Stage
        </div>

        <select
          value={String(
            selectedCRMLead.status || "new"
          ).toLowerCase()}
          onChange={(e) =>
            updateLeadStatus(
              selectedCRMLead.id,
              e.target.value
            )
          }
          style={{
            ...selectStyle,
            marginTop: "8px",
          }}
        >
          {[
            "new",
            "contacted",
            "closed_won",
            "closed_lost",
          ].includes(
            String(
              selectedCRMLead.status || ""
            ).toLowerCase()
          ) && (
            <option
              value={String(
                selectedCRMLead.status || ""
              ).toLowerCase()}
            >
              {getCRMStageLabel(
                selectedCRMLead.status
              )}
            </option>
          )}

          {CRM_PIPELINE_STAGES.map((stage) => (
            <option
              key={stage.value}
              value={stage.value}
            >
              {stage.label}
            </option>
          ))}
        </select>
      </div>

      {/* DEAL VALUE */}
      <div
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={crm360LabelStyle}>
          Estimated Deal
        </div>

        <div style={crm360ValueStyle}>
          $
          {Number(
            selectedCRMLead.estimated_monthly_value ||
              0
          ).toLocaleString()}
          /mo
        </div>

        <div style={crm360SubValueStyle}>
          {selectedCRMLead.recommended_plan
            ? `${selectedCRMLead.recommended_plan} plan`
            : "Plan not selected"}
        </div>
      </div>
    </div>
{/* =========================
   PROSPECT DETAILS / SALES CONTEXT
========================= */}

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  }}
>
  {[
    {
      label: "Lead Source",
      value: String(
        selectedCRMLead.source ||
          selectedCRMLead.lead_source ||
          "Unknown"
      )
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        ),
    },

    {
      label: "Original Contact Method",
      value: String(
        selectedCRMLead.contact_method ||
          "Not recorded"
      )
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        ),
    },

    {
      label: "Next Action",
      value:
        selectedCRMLead.next_action ||
        "No next action recorded",
    },

    {
      label: "Recommended Plan",
      value: selectedCRMLead.recommended_plan
        ? String(
            selectedCRMLead.recommended_plan
          )
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) =>
              char.toUpperCase()
            )
        : "Not selected",
    },

    {
      label: "Location",
      value:
        [
          selectedCRMLead.city,
          selectedCRMLead.state,
        ]
          .filter(Boolean)
          .join(", ") || "Not entered",
    },

    {
      label: "Created",
      value: selectedCRMLead.created_at
        ? new Date(
            selectedCRMLead.created_at
          ).toLocaleString()
        : "Unknown",
    },
  ].map((detail) => (
    <div
      key={detail.label}
      style={{
        padding: "14px",
        borderRadius: "16px",
        background: "rgba(2,6,23,0.28)",
        border:
          "1px solid rgba(148,163,184,0.08)",
      }}
    >
      <div style={crm360LabelStyle}>
        {detail.label}
      </div>

      <div
        style={{
          color: "#e2e8f0",
          fontSize: "12px",
          fontWeight: "800",
          marginTop: "5px",
          lineHeight: 1.5,
          overflowWrap: "anywhere",
        }}
      >
        {detail.value}
      </div>
    </div>
  ))}
</div>
    {/* SALES DATES */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "18px",
      }}
    >
      {[
        {
          label: "Last Contact",
          value: selectedCRMLead.last_contacted_at
            ? new Date(
                selectedCRMLead.last_contacted_at
              ).toLocaleString()
            : "Never",
        },
        {
          label: "Next Follow-Up",
          value: selectedCRMLead.next_follow_up_at
            ? new Date(
                selectedCRMLead.next_follow_up_at
              ).toLocaleString()
            : "Not scheduled",
        },
        {
          label: "Demo",
          value: selectedCRMLead.demo_scheduled_at
            ? new Date(
                selectedCRMLead.demo_scheduled_at
              ).toLocaleString()
            : "Not scheduled",
        },
        {
          label: "Pilot Start",
          value:
            selectedCRMLead.pilot_start_date ||
            "Not started",
        },
        {
          label: "Pilot End",
          value:
            selectedCRMLead.pilot_end_date ||
            "Not scheduled",
        },
        {
          label: "Proposal Sent",
          value:
            selectedCRMLead.proposal_sent_at
              ? new Date(
                  selectedCRMLead.proposal_sent_at
                ).toLocaleDateString()
              : "Not sent",
        },
      ].map((item) => (
        <div
          key={item.label}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(2,6,23,0.28)",
            border:
              "1px solid rgba(148,163,184,0.08)",
          }}
        >
          <div style={crm360LabelStyle}>
            {item.label}
          </div>

          <div
            style={{
              color: "#e2e8f0",
              fontSize: "12px",
              fontWeight: "800",
              marginTop: "5px",
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
{/* =========================
   CRM QUICK ACTIONS
========================= */}

<div
  style={{
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
    marginBottom: "18px",
  }}
>
  <div style={crm360LabelStyle}>
    Sales Actions
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "10px",
      marginTop: "12px",
    }}
  >
    <button
      type="button"
      onClick={async () => {
        const notes = window.prompt(
          "Optional email notes:"
        );

        if (notes === null) return;

        await logCRMContact(
          selectedCRMLead,
          "email",
          notes
        );
      }}
      style={{
        ...smallActionButton,
        background:
          "linear-gradient(135deg,#3b82f6,#2563eb)",
      }}
    >
      Log Email
    </button>

    <button
      type="button"
      onClick={async () => {
        const notes = window.prompt(
          "Optional call notes:"
        );

        if (notes === null) return;

        await logCRMContact(
          selectedCRMLead,
          "call",
          notes
        );
      }}
      style={{
        ...smallActionButton,
        background:
          "linear-gradient(135deg,#22c55e,#16a34a)",
      }}
    >
      Log Call
    </button>

    <button
      type="button"
      onClick={async () => {
        const notes = window.prompt(
          "Optional LinkedIn notes:"
        );

        if (notes === null) return;

        await logCRMContact(
          selectedCRMLead,
          "linkedin",
          notes
        );
      }}
      style={{
        ...smallActionButton,
        background:
          "linear-gradient(135deg,#0ea5e9,#0284c7)",
      }}
    >
      Log LinkedIn
    </button>

    <button
      type="button"
      onClick={async () => {
        const note = window.prompt(
          "Add CRM note:"
        );

        if (note === null) return;

        await saveCRMNote(
          selectedCRMLead,
          note
        );
      }}
      style={{
        ...smallActionButton,
        background: "#475569",
      }}
    >
      Add Note
    </button>

    <button
      type="button"
      onClick={async () => {
        const followUpDate =
          window.prompt(
            "Enter follow-up date and time.\nExample: 2026-08-15 10:30"
          );

        if (followUpDate === null) return;

        const notes =
          window.prompt(
            "Optional follow-up notes:"
          );

        if (notes === null) return;

        await scheduleCRMFollowUp(
          selectedCRMLead,
          followUpDate,
          notes
        );
      }}
      style={{
        ...smallActionButton,
        background:
          "linear-gradient(135deg,#8b5cf6,#7c3aed)",
      }}
    >
      Schedule Follow-Up
    </button>
  </div>
</div>
    {/* NOTES */}
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        marginBottom: "18px",
      }}
    >
      <div style={crm360LabelStyle}>
        CRM Notes
      </div>

      <div
        style={{
          color: selectedCRMLead.notes
            ? "#cbd5e1"
            : "#64748b",
          fontSize: "13px",
          lineHeight: 1.7,
          marginTop: "7px",
          whiteSpace: "pre-wrap",
        }}
      >
        {selectedCRMLead.notes ||
          "No CRM notes recorded yet."}
      </div>
    </div>

    {/* ACTIVITY TIMELINE */}
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div>
          <div style={crm360LabelStyle}>
            Permanent Activity History
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "11px",
              marginTop: "3px",
            }}
          >
            Every recorded CRM action for this prospect.
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            loadCRMLeadActivities(
              selectedCRMLead.id
            )
          }
          style={{
            ...smallActionButton,
            background: "#334155",
          }}
        >
          Refresh
        </button>
      </div>

      {crmActivitiesLoading ? (
        <div
          style={{
            padding: "18px",
            color: "#94a3b8",
            fontSize: "12px",
          }}
        >
          Loading activity history...
        </div>
      ) : selectedCRMActivities.length === 0 ? (
        <div
          style={{
            padding: "18px",
            borderRadius: "16px",
            background: "rgba(2,6,23,0.28)",
            color: "#64748b",
            fontSize: "12px",
          }}
        >
          No CRM activity has been recorded for this
          prospect yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          {selectedCRMActivities.map(
            (activity) => (
              <div
                key={activity.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: "16px",
                  background:
                    "rgba(2,6,23,0.34)",
                  border:
                    "1px solid rgba(148,163,184,0.09)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "900",
                      }}
                    >
                      {activity.title ||
                        activity.activity_type ||
                        "CRM Activity"}
                    </div>

                    {activity.notes && (
                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: "11px",
                          lineHeight: 1.6,
                          marginTop: "4px",
                        }}
                      >
                        {activity.notes}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {activity.created_at
                      ? new Date(
                          activity.created_at
                        ).toLocaleString()
                      : ""}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  </div>
  </div>
)}
 </>
)}


{adminView === "sales_crm" && (
  <>
      {/* APOLLO FILE UPLOAD */}
      <div style={panelCard("#3b82f6")}>
        <div style={{ color: "#93c5fd", fontSize: "12px", fontWeight: "900" }}>IMPORT APOLLO LEADS</div>
        <h2 style={{ color: "white", margin: "6px 0 8px", fontSize: "24px" }}>Upload prospect CSV</h2>
        <input type="file" accept=".csv, .xlsx, .xls" onChange={handleLeadUpload} style={fileInputStyle} />
      </div>

      </>
)}
{adminView === "risk" && (
  <>
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
         </>
    )}
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
const invoiceLabelStyle = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: "900",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "4px",
};

const invoiceValueStyle = {
  color: "white",
  fontSize: "18px",
  fontWeight: "950",
};

const crm360LabelStyle = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: "900",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

const crm360ValueStyle = {
  color: "white",
  fontSize: "18px",
  fontWeight: "950",
  marginTop: "6px",
};

const crm360SubValueStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  marginTop: "3px",
  overflowWrap: "anywhere",
};
const chartTitle = { color: "white", fontSize: "16px", fontWeight: "800", margin: "0" };
const chartSub = { color: "#64748b", fontSize: "12px", margin: "2px 0 12px 0" };
const chartRowLabel = { display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: "12px", fontWeight: "600", marginBottom: "4px" };
const barBg = { width: "100%", height: "8px", backgroundColor: "#0f172a", borderRadius: "999px", overflow: "hidden" };
const barFill = { height: "100%", borderRadius: "999px", transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" };
const legendGrid = { display: "grid", gridTemplateColumns: "1fr", gap: "6px", marginTop: "4px" };
const legendItem = { display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "11px", fontWeight: "bold" };
const dot = { width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" };





