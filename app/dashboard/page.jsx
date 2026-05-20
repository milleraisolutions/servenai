"use client";

import useDashboardData from "../hooks/useDashboardData";
import { useEffect, useMemo, useRef, useState } from "react";
import ErrorBoundary from "../components/ErrorBoundary";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import * as XLSX from "xlsx";
import AICommandCenter from "./components/AICommandCenter";
import OwnerLeadsPanel from "./components/OwnerLeadsPanel";
import WeeklyExecutiveSummary from "./components/WeeklyExecutiveSummary";
import RiskPanel from "./components/RiskPanel";
/* ================= COMPONENTS ================= */

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const increment = value / (duration / 16);

    const counter = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(counter);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(counter);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}

function GlassCard({ title, value, subtext, featured = false }) {
  const [hover, setHover] = useState(false);
  const numericValue = Number(String(value).replace(/[^0-9.-]+/g, ""));

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "18px",
        padding: "18px",
        minHeight: "122px",
        transition: "all 0.28s ease",
        transform: hover ? "translateY(-5px)" : "none",
        background: featured
          ? "linear-gradient(135deg, #4f46e5, #6D3DF5)"
          : "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div>
        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{title}</div>

        <div style={{ fontSize: "30px", fontWeight: "800", color: "white" }}>
          {String(value).includes("/") ? (
            value
          ) : (
            <>
              {String(value).includes("$") && "$"}
              <AnimatedNumber value={numericValue || 0} />
              {String(value).includes("%") && "%"}
            </>
          )}
        </div>

        {subtext && (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#94a3b8" }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
    
  );
}

function Section({ title, children }) {
  return (
    <div style={sectionCard}>
      <div style={{ fontWeight: "600", marginBottom: "10px" }}>{title}</div>
      {children}
    </div>
  );
}

function Item({ text }) {
  return <div style={itemStyle}>{text}</div>;
}
function CountUpValue({ value, duration = 900, prefix = "", suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const end = Number(value || 0);
    let startTimestamp = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const next = Math.floor(progress * end);

      setDisplayValue(next);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
/* ================= MAIN ================= */

export default function Dashboard() {
  const router = useRouter();

  /* 🔹 CORE STATE */
  const [invoiceUploadLoading, setInvoiceUploadLoading] = useState(false);
  const [invoiceUploadMessage, setInvoiceUploadMessage] = useState("");
  const [supplierAlerts, setSupplierAlerts] = useState([]);
  const [aiPriceRecommendations, setAiPriceRecommendations] = useState([]);
  const [savedMessage, setSavedMessage] = useState("");
  const [autoMessage, setAutoMessage] = useState("");
  const [profitBoost, setProfitBoost] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [aiLog, setAiLog] = useState([]);
const [autopilotEnabled, setAutopilotEnabled] = useState(false);
const [lastAutopilotRun, setLastAutopilotRun] = useState(null);
const [showDataSourceMenu, setShowDataSourceMenu] = useState(false);
const [integrationModal, setIntegrationModal] = useState(null);
const [integrationEmail, setIntegrationEmail] = useState("");
const [integrationRequestSent, setIntegrationRequestSent] = useState(false);
const [showSourcePicker, setShowSourcePicker] = useState(false);
const [selectedDataSource, setSelectedDataSource] = useState("");
const [pendingUploadSummary, setPendingUploadSummary] = useState(null);
const [clientUploads, setClientUploads] = useState([]);
const [user, setUser] = useState(null);

const OWNER_EMAIL = "antoinemiller@servenai.com";

const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
const isMobile =
  typeof window !== "undefined" && window.innerWidth < 640;
const [clientAlerts, setClientAlerts] = useState([]);
const [alertsLoading, setAlertsLoading] = useState(false);
const [clientAlertFilter, setClientAlertFilter] = useState("all");
const [lastScanTime, setLastScanTime] = useState(null);
const [selectedAlertAction, setSelectedAlertAction] = useState(null);
const selectedAiFixRef = useRef(null);
const [aiHistory, setAiHistory] = useState([]);
const [totalAiProfit, setTotalAiProfit] = useState(0);
const [displayTotalAiProfit, setDisplayTotalAiProfit] = useState(0);
const [displaySimulatedProfit, setDisplaySimulatedProfit] = useState(0);
const [selectedClient, setSelectedClient] = useState(null);
const [clientSearch, setClientSearch] = useState("");
const [selectedRiskClient, setSelectedRiskClient] = useState(null);
const [reviewedRiskClients, setReviewedRiskClients] = useState([]);
const [showRiskEmailModal, setShowRiskEmailModal] = useState(false);
const [riskEmailSubject, setRiskEmailSubject] = useState("");
const [riskEmailBody, setRiskEmailBody] = useState("");
const [riskEmailTo, setRiskEmailTo] = useState("");
const [sendingRiskEmail, setSendingRiskEmail] = useState(false);
const [showOnlyMissingUploads, setShowOnlyMissingUploads] = useState(false);
const [recentlyDeletedUpload, setRecentlyDeletedUpload] = useState(null);
const [showUndoDelete, setShowUndoDelete] = useState(false);
const [deleteTimeoutId, setDeleteTimeoutId] = useState(null);
const [rows, setRows] = useState([]);
const [headers, setHeaders] = useState([]);
const [statusPlan, setStatusPlan] = useState("");
const [clientImports, setClientImports] = useState([]);
const [importsLoading, setImportsLoading] = useState(false);
const [inventoryView, setInventoryView] = useState("overview");
const [aiActionAutopilotEnabled, setAiActionAutopilotEnabled] = useState(false);
const [appliedAIFixes, setAppliedAIFixes] = useState([]);
const [executiveModeEnabled, setExecutiveModeEnabled] = useState(false);
const [recipeMenuItem, setRecipeMenuItem] = useState("");
const [recipeIngredient, setRecipeIngredient] = useState("");
const [recipeQuantityUsed, setRecipeQuantityUsed] = useState("");
const [recipeTolerance, setRecipeTolerance] = useState(5);
const [mapping, setMapping] = useState({
  name: "",
  category: "",
  quantity: "",
  revenue: "",
  date: "",
  price: "",
  cost: "",
  labor: "",
});
const [message, setMessage] = useState("");
const [uploadedFileName, setUploadedFileName] = useState("");
const [uploadType, setUploadType] = useState("pos");
const [menuItemsData, setMenuItemsData] = useState([]);
const [ingredientsData, setIngredientsData] = useState([]);
const [laborData, setLaborData] = useState([]);
const [pendingUploadRows, setPendingUploadRows] = useState([]);
const pendingUploadRowsRef = useRef([]);
const [realProfitEngine, setRealProfitEngine] = useState(null);
const [realProfitLoading, setRealProfitLoading] = useState(false);
const [realAppliedActions, setRealAppliedActions] = useState([]);
const [uploadComparison, setUploadComparison] = useState(null);
const [uploadComparisonLoading, setUploadComparisonLoading] = useState(false);
const [activeAiCommandTab, setActiveAiCommandTab] = useState("alerts");
const [dbSalesRows, setDbSalesRows] = useState([]);
const [displayProfit, setDisplayProfit] = useState(0);
const [aiLiveStatus, setAiLiveStatus] = useState("AI monitoring quietly");
const [autopilotActivity, setAutopilotActivity] = useState([]);
const [aiRecoveredProfit, setAiRecoveredProfit] = useState(0);
const [loadingUser, setLoadingUser] = useState(true);
const [userProfile, setUserProfile] = useState(null);
const [uploadError, setUploadError] = useState("");
const [lastAutopilotTrigger, setLastAutopilotTrigger] = useState(null);
const [lastAutopilotRunAt, setLastAutopilotRunAt] = useState(0);
const [autopilotReason, setAutopilotReason] = useState("");
const [totalAIRevenueRecovered, setTotalAIRevenueRecovered] = useState(0);
const [leads, setLeads] = useState([]);
const [leadsLoading, setLeadsLoading] = useState(false);
const [restockLogs, setRestockLogs] = useState([]);
const [sentInventoryAlerts, setSentInventoryAlerts] = useState({});
const [inventoryAutopilotEnabled, setInventoryAutopilotEnabled] = useState(false);
const [inventoryAutopilotFixed, setInventoryAutopilotFixed] = useState({});
const [inventoryAutopilotStatus, setInventoryAutopilotStatus] = useState("Idle");
const [inventoryAutopilotActivity, setInventoryAutopilotActivity] = useState([]);
const [inventoryProfitRecovered, setInventoryProfitRecovered] = useState(0);
const [customPlanLeads, setCustomPlanLeads] = useState([]);
const [loadingCustomPlanLeads, setLoadingCustomPlanLeads] = useState(false);
const [leadStatusFilter, setLeadStatusFilter] = useState("all");
const [invoicesData, setInvoicesData] = useState([]);
const [selectedUploadLocationId, setSelectedUploadLocationId] = useState(null);
const [activeLocation, setActiveLocation] = useState("all");
const [invoiceUploads, setInvoiceUploads] = useState([]);
const [laborUploads, setLaborUploads] = useState([]);
const [aiInsights, setAIInsights] = useState(null);
const [recentUploads, setRecentUploads] = useState([]);




const userPlan = user?.plan || userProfile?.plan || null;
const filteredCustomPlanLeads =
  leadStatusFilter === "all"
    ? customPlanLeads
    : customPlanLeads.filter((lead) => lead.status === leadStatusFilter);
const fetchLeads = async () => {
  if (!isOwner) return;

  try {
    setLeadsLoading(true);

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Leads fetch error:", error);
      return;
    }

    setLeads(data || []);
  } catch (err) {
    console.error("Leads panel error:", err);
  } finally {
    setLeadsLoading(false);
  }
};

useEffect(() => {
  fetchLeads();
}, [isOwner]);

  /* 🔹 CAMPAIGNS */
  const [savedCampaigns, setSavedCampaigns] = useState([]);
  const [generatedPromotions, setGeneratedPromotions] = useState(null);
  const [optimizedCampaigns, setOptimizedCampaigns] = useState(null);
  const [abResults, setAbResults] = useState(null);
  const [scheduledCampaigns, setScheduledCampaigns] = useState([]);
const [aiScanMessage, setAiScanMessage] = useState("");
const [topAiActions, setTopAiActions] = useState([]);
const [aiToast, setAiToast] = useState(null);
  /* 🔹 AI AUTOMATION */
  const [autoOptimizeEnabled, setAutoOptimizeEnabled] = useState(false);
  const [autoLaunchWinner, setAutoLaunchWinner] = useState(false);
  const [autoOptimizedCampaigns, setAutoOptimizedCampaigns] = useState([]);
const [generatedOpportunities, setGeneratedOpportunities] = useState([]);
  /* 🔹 ACTIVITY */
  const [activityFeed, setActivityFeed] = useState([]);

  /* 🔹 FORMS */
 const [campaignForm, setCampaignForm] = useState({
  name: "",
  offer: "",
  audience: "All Customers",
  timing: "This Week",
  goal: "Increase Traffic",
  channel: "SMS",
  expectedRevenue: "",
  cost: "",
});

  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "",
  });

  /* 🔹 SYSTEM */
  const [websitePromo, setWebsitePromo] = useState(null);
  const [devPlan, setDevPlan] = useState("starter");
  const [autoTriggersEnabled, setAutoTriggersEnabled] = useState(false);
  const [triggeredCampaigns, setTriggeredCampaigns] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [generatedCampaignPreview, setGeneratedCampaignPreview] = useState(null);
  const [campaignAudience, setCampaignAudience] = useState("Returning Customers");
  const [autoCampaignsEnabled, setAutoCampaignsEnabled] = useState(false);
  const [connectedPOS, setConnectedPOS] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
const [expandedAIAction, setExpandedAIAction] = useState(null);
  /* 🔹 AI */
  const [realAI, setRealAI] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [aiMessage, setAiMessage] = useState(
    "Your margins can improve by optimizing pricing."
  );
const latestAiAction = aiHistory?.length ? aiHistory[0] : null;
  const [simulatedProfit, setSimulatedProfit] = useState(0);
  const [appliedFixes, setAppliedFixes] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [autopilot, setAutopilot] = useState(false);
  const [timelineAnimated, setTimelineAnimated] = useState(false);
  const [revenueScenario, setRevenueScenario] = useState("base");
  /* ================= MAIN DASHBOARD ================= */
  const {
    totalRevenue,
    foodCostPercentage,
    foodCostStatus,
    foodCostInsight,
    revenueMomentum,
    revenueMomentumInsight,
    momentumPercent,
    revenueData,
    salesData,
    starterAlerts,
    score,
    avgMargin,
    topSellingItems,
    mostProfitableItems,
    worstItems,
    profitLeakSignals,
    peakHours,
    aov,
    loading,
    restaurantAISummary,
    restaurantSummary,
    finalStarterRecommendations,
    growthDiagnosis,
    growthRecoverableProfit,
    growthRecoverableConfidence,
    fixSuggestions,
    unusualDropDetected,
    unusualDropInsight,
    revenueDropPercent,
    topGrowthProblems,
    forecastedNextDayRevenue,
    forecastedNextWeekRevenue,
    forecastConfidence,
    forecastPeakPeriod,
    wasteRiskItems,
    totalWasteLoss,
    wasteDetectionInsight,
    laborCostPercentage,
    laborCostStatus,
    laborCostInsight,
    monthlyLaborLoss,
    inventoryForecast,
    inventoryForecastInsight,
    menuOptimization,
    menuOptimizationInsight,
    simulatorProjectedRevenue,
    simulatorProjectedProfit,
    simulatorProfitLift,
    simulatorMarginLift,
    simulatorInsight,
    priceElasticitySignals,
    elasticityInsight,
    salesAnalyzerInsight,
    salesAnalyzerSignal,
    salesAnalyzerHighlights,
    strongestSalesDay,
    weakestSalesDay,
    staffPlanningSignals,
    staffPlanningInsight,
    scoreLabel,
    profitLeaks,
    businessType,
    lastUpdatedText,
    dataSourceStatus,
    shelfLifeRiskItems,
    shelfLifeLoss,
    shelfLifeInsight,
    totalOrders,
  } = useDashboardData();
const filterByActiveLocation = (rows = []) => {
  if (activeLocation === "all" || !activeLocation) {
    return rows || [];
  }

  return (rows || []).filter((row) => {
    const location =
      row.location ||
      row.location_name ||
      row.store ||
      row.store_name ||
      row.restaurant_location ||
      "Main Location";

    return (
      String(location).trim().toLowerCase() ===
      String(activeLocation).trim().toLowerCase()
    );
  });
};
const locationSalesData = filterByActiveLocation(salesData);
const locationLaborData = filterByActiveLocation(laborData);
const locationMenuItemsData = filterByActiveLocation(menuItemsData);
const locationIngredientsData = filterByActiveLocation(ingredientsData);

const locationInvoicesData = filterByActiveLocation(invoicesData);
 const handleInvoiceUpload = async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  try {
    setInvoiceUploadLoading(true);
    setInvoiceUploadMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("You must be logged in");
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

const res = await fetch("/api/upload-invoices", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
  body: formData,
});

const data = await res.json();

if (!res.ok) {
  throw new Error(data?.error || "Invoice upload failed");
}

setInvoiceUploadMessage(
  `Uploaded ${data.uploadedCount} invoice(s) successfully`
);
setSupplierAlerts(data.alerts || []);
setAiLog((prev) =>
  [
    {
      id: Date.now(),
      text: `Uploaded ${data.uploadedCount} invoice(s) successfully`,
    },
    ...prev,
  ].slice(0, 6)
);
if (data.alerts && data.alerts.length > 0) {
  const recommendations = data.alerts.map((alert) => {
    let suggestion = "Consider promoting alternative items this week";

    if (String(alert.item || "").toLowerCase().includes("steak")) {
      suggestion = "Promote chicken and pasta this week to protect margins";
    } else if (String(alert.item || "").toLowerCase().includes("chicken")) {
      suggestion = "Bundle chicken meals or adjust pricing to protect margin";
    } else if (String(alert.item || "").toLowerCase().includes("cheese")) {
      suggestion = "Push high-margin favorites and reduce discounting";
    }

    return {
      item: alert.item,
      supplier: alert.supplier,
      percentChange: alert.percentChange,
      suggestion,
    };
  });

  setAiPriceRecommendations(recommendations);

 if (false && hasProAccess && autoCampaignsEnabled && recommendations.length > 0) {
  handleAutoLaunchCampaignFromRecommendation(recommendations[0]);
}
}
if (autopilotEnabled) {
  runAutopilotAI("Invoice upload scan");
}
} catch (err) {
  console.error(err);
  setInvoiceUploadMessage(err.message || "Invoice upload failed");
} finally {
  setInvoiceUploadLoading(false);
}
};

const handleGenerateCampaignFromRecommendation = (rec) => {
  const lowerItem = String(rec.item || "").toLowerCase();

  let suggestedItem = "featured menu items";
  let campaignName = "Margin Recovery Campaign";
  let offerText = "Try one of our specials tonight";
  let audience = campaignAudience || "Returning Customers";
  let channel = "SMS";
  let smsBody = "";

if (campaignAudience === "Rewards Members") {
  smsBody =
    "Earn rewards points tonight 🍽️ Try our featured special and get more from every visit.";
} else if (campaignAudience === "VIP Guests") {
  smsBody =
    "Exclusive for you — tonight’s featured special is available for our VIP guests. Don’t miss it.";
} else if (campaignAudience === "Low Traffic Guests") {
  smsBody =
    "We miss you 👋 Come back tonight and try one of our featured specials.";
} else {
  smsBody =
    "Tonight only — check out one of our featured specials.";
}
  let emailSubject = "";

if (campaignAudience === "VIP Guests") {
  emailSubject = "An Exclusive Offer Just for You";
} else if (campaignAudience === "Low Traffic Guests") {
  emailSubject = "We’d Love to See You Again";
} else {
  emailSubject = "Tonight’s Featured Special";
}
  let emailBody = "A great special is waiting for you tonight. Stop in and enjoy one of our featured menu items.";

  if (lowerItem.includes("steak")) {
    suggestedItem = "chicken and pasta";
    campaignName = "Promote Chicken & Pasta";
    offerText = "Try our pasta special tonight";
    smsBody =
      "Steak prices are up, so tonight we’re featuring our pasta special. Stop by and try it tonight.";
    emailSubject = "Try Our Pasta Special Tonight";
    emailBody =
      "We’re featuring our pasta special tonight — a guest favorite and a great choice for dinner. Stop in tonight and enjoy it while it’s featured.";
  } else if (lowerItem.includes("chicken")) {
    suggestedItem = "combo meals";
    campaignName = "Promote Combo Meals";
    offerText = "Try one of our combo specials tonight";
    smsBody =
      "Tonight’s combo specials are ready. Stop by and grab one of our best-value meals.";
    emailSubject = "Tonight’s Combo Specials";
    emailBody =
      "We’re highlighting our combo meals tonight for guests looking for great value and flavor. Come in and check out tonight’s featured combos.";
  } else if (lowerItem.includes("cheese")) {
    suggestedItem = "high-margin favorites";
    campaignName = "Promote High-Margin Favorites";
    offerText = "Check out tonight’s featured specials";
    smsBody =
      "Tonight’s featured specials are live. Come in and try one of our customer favorites.";
    emailSubject = "Featured Specials Tonight";
    emailBody =
      "Tonight we’re featuring some of our guest-favorite specials. Stop by and enjoy one of tonight’s top picks.";
  }

  setCampaignForm((prev) => ({
    ...prev,
    name: campaignName,
    offer: offerText,
    audience,
    timing: "This Week",
    channel,
    goal: "Increase Traffic",
    item: suggestedItem,
  }));

  setSelectedPromotion({
    title: campaignName,
    text: offerText,
    sourceItem: rec.item,
    recommendation: rec.suggestion,
  });

  setGeneratedCampaignPreview({
    title: campaignName,
    item: suggestedItem,
    audience,
    sms: smsBody,
    emailSubject,
    emailBody,
  });

  setShowCampaignBuilder(true);
  setActiveTab("growth");

  pushActivity(
    `Generated campaign suggestion from ${rec.item} price increase`,
    "campaign"
  );
};
const saveCampaignToSupabase = async (campaignToSave) => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    const user = session?.user;

    if (!user?.id) {
      setSavedMessage("You must be logged in to save campaigns");
      return null;
    }

    const payload = {
      user_id: user.id,
      name: campaignToSave.name || "Autopilot Campaign",
      offer: campaignToSave.offer || "",
      channel: campaignToSave.channel || "SMS / Email",
      audience: campaignToSave.audience || "All Customers",
      timing: campaignToSave.timing || "This Week",
      expected_revenue: campaignToSave.expected_revenue
        ? Number(campaignToSave.expected_revenue)
        : campaignToSave.expectedRevenue
        ? Number(campaignToSave.expectedRevenue)
        : null,
      status: campaignToSave.status || "live",
      active: true,
      automated: campaignToSave.automated ?? true,
    };

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    
    return data;
  } catch (err) {
  console.error("Campaign save failed:", err);
  setAutoMessage(`Auto campaign failed: ${err?.message || "Save error"}`);
  return null;
}
};

const handleAutoLaunchCampaignFromRecommendation = async (rec) => {
  const lowerItem = String(rec.item || "").toLowerCase();

  let suggestedItem = "featured menu items";
  let campaignName = "Auto Margin Recovery Campaign";
  let offerText = "Try one of our specials tonight";
  let audience = campaignAudience || "Returning Customers";
  let smsBody = "Tonight only — check out one of our featured specials.";
  let emailSubject = "Tonight’s Featured Special";
  let emailBody =
    "A great special is waiting for you tonight. Stop in and enjoy one of our featured menu items.";

  if (lowerItem.includes("steak")) {
    suggestedItem = "chicken and pasta";
    campaignName = "Auto Promote Chicken & Pasta";
    offerText = "Try our pasta special tonight";
    smsBody =
      "Tonight we’re featuring our pasta special. Stop by and try it tonight.";
    emailSubject = "Tonight’s Pasta Special";
    emailBody =
      "We’re featuring our pasta special tonight — a guest favorite and a strong value option for dinner. Stop in tonight and enjoy it while it’s featured.";
  } else if (lowerItem.includes("chicken")) {
    suggestedItem = "combo meals";
    campaignName = "Auto Promote Combo Meals";
    offerText = "Try one of our combo specials tonight";
    smsBody =
      "Tonight’s combo specials are ready. Stop by and grab one of our best-value meals.";
    emailSubject = "Tonight’s Combo Specials";
    emailBody =
      "We’re highlighting our combo meals tonight for guests looking for great value and flavor. Come in and check out tonight’s featured combos.";
  } else if (lowerItem.includes("cheese")) {
    suggestedItem = "high-margin favorites";
    campaignName = "Auto Promote High-Margin Favorites";
    offerText = "Check out tonight’s featured specials";
    smsBody =
      "Tonight’s featured specials are live. Come in and try one of our customer favorites.";
    emailSubject = "Featured Specials Tonight";
    emailBody =
      "Tonight we’re featuring some of our guest-favorite specials. Stop by and enjoy one of tonight’s top picks.";
  }

 const liveCampaign = {
  id: Date.now() + Math.random(),

  name: campaignName || "Autopilot Campaign",
  offer: smsBody || offerText || "Try our featured high-margin items today",
  channel: "SMS / Email",
  audience: audience || "Returning Customers",
  timing: "This Week",

  estimated_impact: Number(rec?.estimatedImpact || rec?.impact || 0),
  actual_revenue: 0,

  launched_by: "autopilot",
  automated: true,

  status: "live",
  active: true,

  created_at: new Date().toISOString(),
};

  setCampaignForm((prev) => ({
    ...prev,
    name: campaignName,
    offer: offerText,
    audience,
    timing: "This Week",
    channel: "SMS",
    goal: "Increase Traffic",
    item: suggestedItem,
  }));

  setGeneratedCampaignPreview({
    title: campaignName,
    item: suggestedItem,
    audience,
    sms: smsBody,
    emailSubject,
    emailBody,
  });

 const savedCampaign = await saveCampaignToSupabase(liveCampaign);

if (!savedCampaign) {
  return;
}

setSavedCampaigns((prev) => [
  {
    ...liveCampaign,
    id: savedCampaign.id || liveCampaign.id,
  },
  ...prev,
]);

 setWebsitePromo({
  title: campaignName,
  offer: smsBody,
  body: emailBody,
  smsBody: smsBody,
  emailSubject: emailSubject,
});

  setSelectedPromotion({
    title: campaignName,
    text: smsBody,
    sourceItem: rec.item,
    recommendation: rec.suggestion,
  });

  
  pushActivity(
    `Auto-launched campaign from ${rec.item} price increase`,
    "launch"
  );
 
};
  const shelfLifeCopy = {
  coffee: {
    title: "Coffee Inventory Freshness",
    subtitle: "Track milk, pastries, and short-life cafe inventory.",
    lockedTitle: "Unlock Coffee Inventory Freshness",
    lockedText:
      "Track perishable cafe items before they expire and create waste.",
  },
  smoothie: {
    title: "Smoothie Ingredient Freshness",
    subtitle: "Track fruit, dairy, and add-ins with short shelf life.",
    lockedTitle: "Unlock Smoothie Ingredient Freshness",
    lockedText:
      "Track smoothie ingredients that are close to expiration and reduce spoilage risk.",
  },
  restaurant: {
    title: "Shelf Life Tracking",
    subtitle: "Track produce, proteins, and prep items close to expiration.",
    lockedTitle: "Unlock Shelf Life Tracking",
    lockedText:
      "Track ingredients that are close to expiration and reduce spoilage risk.",
  },
};

const currentShelfLifeCopy =
  shelfLifeCopy?.[businessType] || shelfLifeCopy.restaurant;
  const businessKPI = {
  title:
    businessType === "coffee"
      ? "Upsell Opportunity"
      : businessType === "smoothie"
      ? "Waste Exposure"
      : "Menu Margin Risk",

  value:
    businessType === "coffee"
      ? `${Math.max(0, Math.round((22 - Number(aov || 0)) * 10))}%`
      : businessType === "smoothie"
      ? `$${Number(totalWasteLoss || 0).toLocaleString()}`
      : `${profitLeakSignals?.length || 0} issues`,

  subtext:
    businessType === "coffee"
      ? "Potential ticket growth from add-ons and combos"
      : businessType === "smoothie"
      ? "Estimated monthly waste-related margin pressure"
      : "Low-margin menu items needing attention",
};
const wowInsight = (() => {
  if (businessType === "coffee") {
    return {
      title: "Missed Revenue Opportunity",
      value: "$2,300/month",
      message: "Low add-on rates are limiting revenue",
    };
  }

  if (businessType === "smoothie") {
    return {
      title: "Ingredient Waste Impact",
      value: "$1,200/month",
      message: "Waste is reducing profitability",
    };
  }

  return {
    title: "Profit Leakage Detected",
    value: "$3,000/month",
    message: "Menu pricing inefficiencies detected",
  };
})();
const dashboardCopy = {
  coffee: {
    title: "Coffee Shop Dashboard",
    subtitle: "Track revenue, margins, and café performance in real time.",
    aovTitle: "Average Ticket",
    peakTitle: "Best Rush Window",
  },
  restaurant: {
    title: "Restaurant Dashboard",
    subtitle: "Monitor sales, food cost, labor, and AI-driven opportunities.",
    aovTitle: "Average Order Value",
    peakTitle: "Peak Hours",
  },
  smoothie: {
    title: "Smoothie Bar Dashboard",
    subtitle: "Track demand, waste, and profit performance across your menu.",
    aovTitle: "Average Ticket",
    peakTitle: "Best Sales Window",
  },
};

const currentCopy =
  dashboardCopy?.[businessType] || dashboardCopy.restaurant;
useEffect(() => {
  const loadLeads = async () => {
    if (!isOwner) return;

    try {
      const res = await fetch("/api/get-leads");
      const data = await res.json();

      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load leads:", err);
      setLeads([]);
    }
  };

  loadLeads();
}, [isOwner]);


 const pushActivity = (text, type = "info", details = {}) => {
  setActivityFeed((prev) => [
    {
      id: Date.now() + Math.random(),
      type,
      text,
      reason: details.reason || "",
      campaignName: details.campaignName || "",
      expectedRevenue: details.expectedRevenue || "",
      status: details.status || "",
      time: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    },
    ...prev,
  ].slice(0, 8));
};
  const handleOptimizeCampaigns = () => {
    if (!generatedPromotions) return;

    const mockPerformance = {
      impressions: 1200,
      clicks: 180,
      conversions: 30,
      revenue: 2500,
    };

    const optimized = {
      sms: optimizeCampaignAI(
        generatedPromotions.sms,
        mockPerformance,
        businessType
      ),
      email: optimizeCampaignAI(
        generatedPromotions.email,
        mockPerformance,
        businessType
      ),
      social: optimizeCampaignAI(
        generatedPromotions.social,
        mockPerformance,
        businessType
      ),
      inStore: optimizeCampaignAI(
        generatedPromotions.inStore,
        mockPerformance,
        businessType
      ),
    };

    setOptimizedCampaigns(optimized);
    pushActivity("AI optimized campaign copy across all channels", "optimize");
  };
const getTabButtonStyle = (isActive, locked) => {
  return {
    width: "100%",
    minWidth: 0,

    display: "flex",
    alignItems: "center",
    gap: "10px",

    padding: "10px 12px",
    borderRadius: "10px",
    border: "none",

    cursor: locked ? "not-allowed" : "pointer",

    background: isActive
      ? "linear-gradient(135deg, #4f46e5, #6D3DF5)"
      : "transparent",

    color: locked ? "#64748b" : isActive ? "white" : "#e2e8f0",

    opacity: locked ? 0.5 : 1,

    fontWeight: "600",
    transition: "0.2s",
  };
};
  const handleEndCampaign = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) return;

      const { error } = await supabase
        .from("marketing_campaigns")
        .update({ active: false })
        .eq("user_id", user.id)
        .eq("active", true);

      if (error) throw error;

      setWebsitePromo(null);
      setSavedMessage("Campaign ended");
      setTimeout(() => setSavedMessage(""), 2000);
    } catch (err) {
      console.error("End campaign error:", err);
      setSavedMessage("Failed to end campaign");
    }
  };

const handleGeneratePromotions = () => {
  if (!campaignForm) return;

  const cleanName = campaignForm.name?.trim() || "Limited-Time Restaurant Offer";
  const cleanOffer =
    campaignForm.offer?.trim() || "A limited-time special for your guests";
  const cleanAudience = campaignForm.audience || "All Customers";
  const cleanTiming = campaignForm.timing || "This Week";
  const cleanGoal = campaignForm.goal || "Increase Traffic";
  const cleanChannel = campaignForm.channel || "SMS";
  const cleanImpact =
    campaignForm.expectedRevenue?.trim() || "Potential revenue lift";

  const promotion = {
    title: cleanName,
    text: cleanOffer,
    audience: cleanAudience,
    timing: cleanTiming,
    goal: cleanGoal,
    channel: cleanChannel,
    expectedRevenue: cleanImpact,
  };

  const generated = generateCampaignCopy(
    {
      ...campaignForm,
      name: cleanName,
      offer: cleanOffer,
      audience: cleanAudience,
      timing: cleanTiming,
      goal: cleanGoal,
      channel: cleanChannel,
      expectedRevenue: cleanImpact,
    },
    promotion,
    businessType || "restaurant"
  );

  setGeneratedPromotions(generated);

  

  pushActivity("Generated new campaign copy", "generate");

  
};
  function optimizeCampaignAI(campaign, performance, businessType) {
    const ctr = performance.impressions
      ? performance.clicks / performance.impressions
      : 0;

    const conversionRate = performance.clicks
      ? performance.conversions / performance.clicks
      : 0;

    let suggestions = [];
    let optimized = { ...campaign };
    let projectedLift = 0;

    if (ctr < 0.15) {
      optimized.title = `${campaign.title} 🔥 Limited Time`;
      suggestions.push("Boost urgency in headline to increase clicks");
      projectedLift += 400;
    }

    if (conversionRate < 0.2) {
      optimized.body = `${campaign.body} — Exclusive deal for today only!`;
      suggestions.push("Added urgency to increase conversions");
      projectedLift += 650;
    }

    if (conversionRate > 0.3) {
      suggestions.push("High-performing campaign — consider increasing ad spend");
      projectedLift += 900;
    }

    if (businessType === "coffee") {
      optimized.body += " ☕ Perfect for your daily coffee fix.";
      projectedLift += 150;
    }

    if (businessType === "restaurant") {
      optimized.body += " 🍽️ Limited reservations available!";
      projectedLift += 250;
    }

    if (projectedLift === 0) {
      projectedLift = 300;
      suggestions.push(
        "Campaign is healthy, but minor copy improvements can still lift results"
      );
    }

    return {
      optimized,
      suggestions,
      ctr: (ctr * 100).toFixed(1),
      conversionRate: (conversionRate * 100).toFixed(1),
      projectedLift,
    };
  }
/* ===============================
   🤖 AI PROFIT OPPORTUNITIES (PRO)
================================= */

const fallbackProfitOpportunities = [
  {
    id: 1,
    title: "Menu Price Optimization",
    description: "Increase prices on underpriced high-demand items",
    impact: 3200,
    difficulty: "Easy",
    category: "Revenue Boost",
  },
  {
    id: 2,
    title: "Reduce Ingredient Waste",
    description: "Optimize portion sizes and prep tracking",
    impact: 1800,
    difficulty: "Medium",
    category: "Cost Reduction",
  },
  {
    id: 3,
    title: "Upsell Optimization",
    description: "Improve add-on attach rates (drinks, sides)",
    impact: 2500,
    difficulty: "Easy",
    category: "Revenue Boost",
  },
  {
    id: 4,
    title: "Supplier Cost Adjustment",
    description: "Switch suppliers or renegotiate pricing",
    impact: 1400,
    difficulty: "Medium",
    category: "Cost Reduction",
  },
  {
    id: 5,
    title: "Labor Efficiency Fix",
    description: "Adjust staffing on low-efficiency days",
    impact: 2100,
    difficulty: "Hard",
    category: "Labor Optimization",
  },
];

const aiProfitOpportunities = useMemo(() => {
  if (generatedOpportunities?.length) {
    return generatedOpportunities.map((item, index) => {
      const parsedImpact = Number(
        String(item.impact || "0").replace(/[^0-9.-]/g, "")
      );

      const actionText =
        item.action ||
        item.description ||
        "AI identified an optimization opportunity.";

      let category = "Profit Optimization";
      let difficulty = "Medium";

      const lower = `${item.title || ""} ${actionText}`.toLowerCase();

      if (
        lower.includes("price") ||
        lower.includes("pricing") ||
        lower.includes("menu")
      ) {
        category = "Revenue Boost";
        difficulty = "Easy";
      } else if (
        lower.includes("waste") ||
        lower.includes("food cost") ||
        lower.includes("supplier")
      ) {
        category = "Cost Reduction";
        difficulty = "Medium";
      } else if (
        lower.includes("labor") ||
        lower.includes("staff") ||
        lower.includes("scheduling")
      ) {
        category = "Labor Optimization";
        difficulty = "Hard";
      }

      return {
        id: index + 1,
        title: item.title || `AI Opportunity ${index + 1}`,
        description: actionText,
        impact: parsedImpact || 0,
        difficulty,
        category,
      };
    });
  }

  return fallbackProfitOpportunities;
}, [generatedOpportunities]);
  function runABTest(campaign, businessType) {
    const versionA = {
      title: campaign.title,
      body: campaign.body,
    };

    const versionB = {
      title: `${campaign.title} 🔥`,
      body:
        `${campaign.body} — Today only.` +
        (businessType === "coffee"
          ? " Grab your favorite drink now."
          : businessType === "restaurant"
          ? " Reserve your table now."
          : ""),
    };

    const scoreA = Math.floor(Math.random() * 18) + 72;
    const scoreB = Math.floor(Math.random() * 18) + 78;

    const winner = scoreB >= scoreA ? "B" : "A";

    return {
      versionA,
      versionB,
      scoreA,
      scoreB,
      winner,
      lift:
        winner === "B"
          ? Math.max(200, (scoreB - scoreA) * 45)
          : Math.max(100, (scoreA - scoreB) * 25),
    };
  }

const handleSaveCampaign = async (campaign) => {
  try {
    const campaignToSave = campaign || {
      name: campaignForm.name || "Untitled Campaign",
      offer: campaignForm.offer || "",
      channel: campaignForm.channel || "SMS",
      timing: campaignForm.timing || "This Week",
      expectedRevenue: campaignForm.expectedRevenue || null,
      status: "draft",
    };

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      setSavedMessage("Session error");
      setTimeout(() => setSavedMessage(""), 2000);
      return;
    }

    const user = session?.user;

    if (!user?.id) {
      setSavedMessage("You must be logged in");
      
      router.push("/login");
      return;
    }

    const payload = {
  user_id: user.id,

  campaign_name: campaignToSave.name,
  promotion_title: campaignToSave.offer,
  business_type: businessType || "restaurant",

  audience: campaignForm.audience || "All Customers",
  timing: campaignToSave.timing,

  expected_revenue: campaignToSave.expectedRevenue || null,

  active: false,
  published_to_website: false,

  sms_title: generatedPromotions?.sms?.title || campaignToSave.name,
  sms_body: generatedPromotions?.sms?.body || null,

  email_title: generatedPromotions?.email?.title || campaignToSave.name,
  email_body: generatedPromotions?.email?.body || null,

  social_title: generatedPromotions?.social?.title || campaignToSave.name,
  social_body: generatedPromotions?.social?.body || null,

  in_store_title: generatedPromotions?.inStore?.title || campaignToSave.name,
  in_store_body: generatedPromotions?.inStore?.body || null,

  generated_sms: generatedPromotions?.sms?.body || null,
  generated_email: generatedPromotions?.email?.body || null,
  generated_social: generatedPromotions?.social?.body || null,
  generated_in_store: generatedPromotions?.inStore?.body || null,
};

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

  setSavedCampaigns((prev) => [
  {
    id: data.id || Date.now(),
    ...campaignToSave,

    // ✅ FIXED mapping from Supabase → UI
    name: data.campaign_name || campaignToSave.name,
    offer: data.promotion_title || campaignToSave.offer,

    audience: campaignForm.audience || "All Customers",
    createdAt: new Date().toISOString(),
  },
  ...prev,
]);
   setSavedMessage("Campaign saved");
    pushActivity(`Saved ${campaignToSave.channel} campaign draft`, "save");
    
  } catch (error) {
    console.error("Save campaign error FULL:", error);
    console.error("Message:", error?.message);
    console.error("Details:", error?.details);
    console.error("Hint:", error?.hint);
    console.error("Code:", error?.code);

    setSavedMessage(error?.message || "Failed to save campaign");
   
  }
};

  const handleSaveGeneratedCampaign = (channel, data = {}) => {
    const newCampaign = {
      id: Date.now(),
      name: data?.title || `${channel} Campaign`,
offer: data?.body || "Generated campaign content",
      channel,
      audience: campaignForm.audience || "All Customers",
      timing: campaignForm.timing || "This Week",
      impact: campaignForm.expectedRevenue
        ? `+$${campaignForm.expectedRevenue}/month`
        : "+$1,200/mo",
      status: "Draft",
    };

    setSavedCampaigns((prev) => [newCampaign, ...prev]);
   
    pushActivity(`Saved ${channel} campaign draft`, "save");
    
  };
  const getSaleRevenue = (sale = {}) => {
  return Number(
    sale.value ??
      sale.revenue ??
      sale.total ??
      sale.total_revenue ??
      sale.total_amount ??
      sale.sales_amount ??
      sale.gross_sales ??
      sale.net_sales ??
      sale.amount ??
      sale.sales ??
      sale.total_sales ??
      sale.price ??
      0
  );
};

const getSaleDate = (sale = {}) => {
  const rawDate =
    sale.sale_date ??
    sale.date ??
    sale.order_date ??
    sale.created_at ??
    sale.timestamp ??
    sale.day;

  const parsed = rawDate ? new Date(rawDate) : null;

  return parsed && !isNaN(parsed.getTime()) ? parsed : null;
};
   /* ===============================
   💰 REVENUE TRACKER
================================= */
const revenueTracker = useMemo(() => {
 const rawSales =
  dbSalesRows?.length
    ? dbSalesRows
    : locationSalesData?.length
    ? locationSalesData
    : pendingUploadRows?.length
    ? pendingUploadRows
    : [];

  const safeSales = rawSales
    .map((sale) => {
      const revenue = getSaleRevenue(sale);
      const date = getSaleDate(sale);

      return {
        ...sale,
        revenue: Number(revenue || 0),
        date,
      };
    })
    .filter(
      (sale) =>
        sale.date &&
        !Number.isNaN(sale.date.getTime()) &&
        Number(sale.revenue || 0) > 0
    );

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let todayRevenue = 0;
  let weekRevenue = 0;
  let monthRevenue = 0;

  const revenueByDay = {};

  safeSales.forEach((sale) => {
    const saleDate = new Date(
      sale.date.getFullYear(),
      sale.date.getMonth(),
      sale.date.getDate()
    );

    const dayKey = saleDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + sale.revenue;

    if (saleDate.getTime() === todayStart.getTime()) {
      todayRevenue += sale.revenue;
    }

    if (saleDate >= weekStart) {
      weekRevenue += sale.revenue;
    }

    if (saleDate >= monthStart) {
      monthRevenue += sale.revenue;
    }
  });

  const totalRevenueValue = safeSales.reduce(
    (sum, sale) => sum + Number(sale.revenue || 0),
    0
  );

  const revenueDays = Object.entries(revenueByDay).map(([day, revenue]) => ({
    day,
    revenue: Number(revenue || 0),
  }));

  const bestDay =
    revenueDays.length > 0
      ? revenueDays.reduce((best, current) =>
          current.revenue > best.revenue ? current : best
        )
      : { day: "N/A", revenue: 0 };

  const averageDailyRevenue =
    revenueDays.length > 0 ? totalRevenueValue / revenueDays.length : 0;

  const recentSales = [...safeSales]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 7);

  return {
    totalRevenue: totalRevenueValue,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    averageDailyRevenue,
    bestDay,
    recentSales,
  };
}, [dbSalesRows, locationSalesData, pendingUploadRows]);


    /* ===============================
   📈 REVENUE TREND + WEEKLY GROWTH
================================= */


const revenueTrend = useMemo(() => {
  const rawSales =
  dbSalesRows?.length
    ? dbSalesRows
    : locationSalesData?.length
    ? locationSalesData
    : pendingUploadRows?.length
    ? pendingUploadRows
    : [];

  const safeSales = rawSales
    .map((sale) => {
      const date = getSaleDate(sale);
      const revenue = getSaleRevenue(sale);

      return {
        ...sale,
        revenue: Number(revenue || 0),
        date,
      };
    })
    .filter(
      (sale) =>
        sale.date &&
        !Number.isNaN(sale.date.getTime()) &&
        sale.revenue > 0
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (!safeSales.length) {
    return {
      chartData: [],
      currentWeekRevenue: 0,
      lastWeekRevenue: 0,
      growthPercent: 0,
      growthLabel: "flat",
      strongestDay: null,
      weakestDay: null,
    };
  }

  const grouped = safeSales.reduce((acc, sale) => {
    const key = sale.date.toISOString().slice(0, 10);

    acc[key] = (acc[key] || 0) + Number(sale.revenue || 0);

    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([date, revenue]) => ({
      date,
      day: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue: Number(revenue || 0),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const latestSales = safeSales.slice(-30);
  const previousSales = safeSales.slice(-60, -30);

  const currentWeekRevenue = latestSales.reduce(
    (sum, sale) => sum + Number(sale.revenue || 0),
    0
  );

  const lastWeekRevenue = previousSales.reduce(
    (sum, sale) => sum + Number(sale.revenue || 0),
    0
  );

  const growthPercent =
    lastWeekRevenue > 0
      ? ((currentWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
      : currentWeekRevenue > 0
      ? 100
      : 0;

  const strongestDay =
    chartData.length > 0
      ? chartData.reduce((best, current) =>
          current.revenue > best.revenue ? current : best
        )
      : null;

  const weakestDay =
    chartData.length > 0
      ? chartData.reduce((worst, current) =>
          current.revenue < worst.revenue ? current : worst
        )
      : null;

  return {
    chartData,
    currentWeekRevenue,
    lastWeekRevenue,
    growthPercent,

    strongestDay,
    weakestDay,

    growthLabel:
      growthPercent > 0
        ? "up"
        : growthPercent < 0
        ? "down"
        : "flat",
  };
}, [dbSalesRows, locationSalesData, pendingUploadRows]);

const liveTotalRevenue =
  revenueTracker?.totalRevenue || totalRevenue || 0;

const liveMomentumPercent =
  revenueTrend?.growthPercent || momentumPercent || 0;

const liveTotalOrders =
  revenueTracker?.recentSales?.length || totalOrders || 0;

const liveAOV =
  liveTotalOrders > 0
    ? liveTotalRevenue / liveTotalOrders
    : aov || 0;

const livePeakHours =
  peakHours || "N/A";

const liveAvgMargin =
  avgMargin || 0;

const liveFoodCostPercentage =
  foodCostPercentage || 0;

const liveScore =
  score || 0;
  const liveLaborIntelligence = useMemo(() => {
 const totalLaborCost = (locationLaborData || []).reduce((sum, row) => {
  const cost = Number(
    row.labor_cost ||
      row["Labor Cost"] ||
      row.laborCost ||
      row.cost ||
      row.Cost ||
      0
  );

  const hours = Number(
    row.hours ||
      row.Hours ||
      row.total_hours ||
      row["Total Hours"] ||
      0
  );

  const rate = Number(
    row.hourly_rate ||
      row.hourlyRate ||
      row.rate ||
      row.Rate ||
      row["Hourly Rate"] ||
      0
  );

  return sum + (cost > 0 ? cost : hours * rate);
}, 0);

  const laborPercent =
    liveTotalRevenue > 0 && totalLaborCost > 0
      ? (totalLaborCost / liveTotalRevenue) * 100
      : 0;

  return {
    totalLaborCost,
    laborPercent,
    rows: laborData || [],
  };
}, [laborData, liveTotalRevenue]);
console.log("LABOR DATA CHECK:", laborData);
console.log("LABOR FIRST ROW:", laborData?.[0]);
console.log("LABOR TOTAL COST:", liveLaborIntelligence?.totalLaborCost);
console.log("LIVE TOTAL REVENUE:", liveTotalRevenue);
console.log("SALES DATA CHECK:", locationSalesData);
console.log("FIRST SALES ROW:", locationSalesData?.[0]);
console.log("REVENUE TRACKER:", revenueTracker);
console.log("REVENUE TREND:", revenueTrend);
const revenueInsight = useMemo(() => {
  const growth = Number(revenueTrend?.growthPercent || 0);
  const bestDay = revenueTracker?.bestDay?.day || "N/A";
  const bestDayRevenue = Number(revenueTracker?.bestDay?.revenue || 0);
  const thisWeek = Number(revenueTrend?.currentWeekRevenue || 0);
  const lastWeek = Number(revenueTrend?.lastWeekRevenue || 0);

  let headline = "Revenue is holding steady.";
  let message = "Performance is stable compared to last week.";
  let tone = {
    bg: "linear-gradient(135deg, #e0f2fe, #f8fafc)",
    border: "1px solid #bae6fd",
    accent: "#0369a1",
  };

  if (growth > 0) {
    headline = `Revenue is up ${growth.toFixed(1)}% vs last week`;
    message = `${bestDay} is currently your strongest sales day, generating $${bestDayRevenue.toLocaleString()}.`;
    tone = {
      bg: "linear-gradient(135deg, #ecfdf5, #f0fdf4)",
      border: "1px solid #bbf7d0",
      accent: "#15803d",
    };
  } else if (growth < 0) {
    headline = `Revenue is down ${Math.abs(growth).toFixed(1)}% vs last week`;
    message = `This week has generated $${thisWeek.toLocaleString()} compared to $${lastWeek.toLocaleString()} last week.`;
    tone = {
      bg: "linear-gradient(135deg, #fef2f2, #fff7ed)",
      border: "1px solid #fecaca",
      accent: "#dc2626",
    };
  }

  return {
    headline,
    message,
    tone,
  };
}, [revenueTrend, revenueTracker]);
const revenueAlerts = useMemo(() => {
  const alerts = [];
  const growth = Number(revenueTrend?.growthPercent || 0);
  const bestDay = revenueTracker?.bestDay?.day || "N/A";
  const bestDayRevenue = Number(revenueTracker?.bestDay?.revenue || 0);
  const thisWeek = Number(revenueTrend?.currentWeekRevenue || 0);
  const lastWeek = Number(revenueTrend?.lastWeekRevenue || 0);

  if (growth > 8) {
    alerts.push({
      type: "success",
      title: "Revenue Momentum",
      message: `Revenue is up ${growth.toFixed(1)}% compared to last week.`,
    });
  }

  if (growth < 0) {
    alerts.push({
      type: "critical",
      title: "Revenue Drop Detected",
      message: `This week is at $${thisWeek.toLocaleString()} vs $${lastWeek.toLocaleString()} last week.`,
    });
  }

  if (bestDay !== "N/A" && bestDayRevenue > 0) {
    alerts.push({
      type: "info",
      title: "Strongest Day",
      message: `${bestDay} is currently your strongest day at $${bestDayRevenue.toLocaleString()}.`,
    });
  }

  if (bestDayRevenue < 5000) {
    alerts.push({
      type: "warning",
      title: "No Strong Sales Day",
      message: "No day has crossed your strong-sales threshold yet.",
    });
  }

  return alerts.slice(0, 3);
}, [revenueTrend, revenueTracker]);
const revenueForecastConfidence = useMemo(() => {
  if (appliedFixes.length >= 3) return 91;
  if (appliedFixes.length === 2) return 84;
  if (appliedFixes.length === 1) return 76;
  return 68;
}, [appliedFixes]);
const revenueDrivers = useMemo(() => {
  let pricingTotal = 0;
  let laborTotal = 0;
  let wasteTotal = 0;

  topAiActions.forEach((action) => {
    if (!appliedFixes.includes(action.title)) return;

    const value = Number(
      String(action.impact || "").replace(/[^0-9]/g, "")
    );

    const text = `${action.title} ${action.description || ""}`.toLowerCase();

    if (text.includes("price") || text.includes("menu")) {
      pricingTotal += value;
    } else if (text.includes("labor") || text.includes("staff")) {
      laborTotal += value;
    } else if (text.includes("waste") || text.includes("cost")) {
      wasteTotal += value;
    }
  });

  const total = pricingTotal + laborTotal + wasteTotal;

  return {
    rows: [
      { label: "Pricing & Menu", value: pricingTotal, accent: "#22c55e" },
      { label: "Labor Optimization", value: laborTotal, accent: "#3b82f6" },
      { label: "Waste & Food Cost", value: wasteTotal, accent: "#f59e0b" },
    ],
    total,
    topDriver:
      total > 0
        ? [pricingTotal, laborTotal, wasteTotal].indexOf(
            Math.max(pricingTotal, laborTotal, wasteTotal)
          )
        : -1,
  };
}, [topAiActions, appliedFixes]);
const getTrend = (value, inverse = false) => {
  const isPositive = inverse ? value < 0 : value > 0;

  if (value === 0) {
    return {
      color: "#64748b",
      symbol: "→",
      bg: "rgba(100,116,139,0.12)",
      label: "No change",
    };
  }

  if (isPositive) {
    return {
      color: "#16a34a",
      symbol: "↑",
      bg: "rgba(22,163,74,0.12)",
      label: "Improving",
    };
  }

  return {
    color: "#dc2626",
    symbol: "↓",
    bg: "rgba(220,38,38,0.12)",
    label: "Declining",
  };
};

const revenueLiftTimeline = useMemo(() => {
  const currentRevenue = Number(totalRevenue || 0);

  const aiLift = topAiActions.reduce((sum, action) => {
    if (!appliedFixes.includes(action.title)) return sum;

    return (
      sum + Number(String(action.impact || "").replace(/[^0-9]/g, ""))
    );
  }, 0);

  const month1 = currentRevenue;
  const month2 = currentRevenue + aiLift * 0.4;
  const month3 = currentRevenue + aiLift * 0.75;
  const month4 = currentRevenue + aiLift;

  return [
    { label: "Current Month", revenue: month1 },
    { label: "Next Month", revenue: month2 },
    { label: "Month 3", revenue: month3 },
    { label: "Optimized Run Rate", revenue: month4 },
  ];
}, [totalRevenue, topAiActions, appliedFixes]);
const marginTrendBadge = getTrend(Number(avgMargin || 0) - 60);
const foodCostTrendBadge = getTrend(Number(foodCostPercentage || 0) - 30, true);
const revenueTrendBadge = getTrend(
  Number(revenueTrend?.growthPercent || 0)
);
const foodCostTrendValue = foodCostPercentage - 30; // baseline


const profitLeakTrendValue = -(profitLeaks?.length || 0);
const profitLeakTrendBadge = getTrend(profitLeakTrendValue, true);

const scoreTrendValue = score - 70;
const scoreTrendBadge = getTrend(scoreTrendValue);
const handleScheduleCampaign = (campaign) => {
  if (!scheduleForm.date || !scheduleForm.time) {
    setSavedMessage("Select a date and time first");
    setTimeout(() => setSavedMessage(""), 2000);
    return;
  }

  const scheduledAt = `${scheduleForm.date} ${scheduleForm.time}`;

  const newScheduledCampaign = {
    id: Date.now(),
    ...campaign,
    scheduledAt,
    status: "Scheduled",
  };

  setScheduledCampaigns((prev) => [newScheduledCampaign, ...prev]);
  setSavedMessage("Campaign scheduled");
  pushActivity(`Scheduled campaign: ${campaign?.name || "Campaign"}`, "schedule");
  setTimeout(() => setSavedMessage(""), 2000);
};



useEffect(() => {
  const loadWebsitePromo = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setWebsitePromo(null);
        return;
      }

      if (!session?.user) {
        setWebsitePromo(null);
        return;
      }

    const currentIsOwner = isServenAdmin;

      if (!currentIsOwner) {
        setWebsitePromo(null);
        return;
      }

      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("active", true)
        .eq("published_to_website", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Website promo load error:", error);
        setWebsitePromo(null);
        return;
      }

      if (data) {
        setWebsitePromo({
          title: data.name || "Live Promotion",
          offer: data.offer || "",
          body: data.generated_in_store || data.offer || "",
          smsBody: data.generated_sms || "",
          emailSubject: data.generated_email || "",
        });
      } else {
        setWebsitePromo(null);
      }
    } catch (error) {
      console.error("Website promo effect error:", error);
      setWebsitePromo(null);
    }
  };

  loadWebsitePromo();
}, []);

function generateCampaignCopy(form, promotion, businessType) {
  const {
    name,
    offer,
    audience,
    timing,
    goal,
    channel,
    expectedRevenue,
  } = form;

  const baseOffer =
    offer ||
    `Enjoy a limited-time special on ${form.item || "our most popular items"}`;

  const urgency = (timing || "this week").toLowerCase();

  // 🎯 Goal-driven hook
  let goalHook = "";
  if (goal === "Increase Traffic") {
    goalHook = "Bring more guests through your doors";
  } else if (goal === "Increase Repeat Visits") {
    goalHook = "Give your customers a reason to come back";
  } else if (goal === "Boost AOV") {
    goalHook = "Increase your average order value";
  } else if (goal === "Promote High-Margin Items") {
    goalHook = "Highlight your most profitable menu items";
  }

  // 👥 Audience personalization
  let audienceLine = "";
  if (audience === "VIP Guests") {
    audienceLine = "An exclusive offer just for our VIP guests.";
  } else if (audience === "Returning Customers") {
    audienceLine = "We miss you — come back for something special.";
  } else if (audience === "Low Traffic Guests") {
    audienceLine = "Haven’t seen you in a while — this one’s for you.";
  } else if (audience === "Rewards Members") {
    audienceLine = "A special reward just for our loyal members.";
  } else {
    audienceLine = "A special offer for all our guests.";
  }

  // 🧠 Business flavor
  let businessFlavor = "";
  if (businessType === "coffee") {
    businessFlavor = "Perfect for your daily coffee run.";
  } else if (businessType === "smoothie") {
    businessFlavor = "Fresh, healthy, and made just for you.";
  } else {
    businessFlavor = "One of our top menu experiences.";
  }

  // 💰 Revenue framing (THIS is what makes it feel premium)
  const revenueLine = expectedRevenue
    ? `This campaign is designed to generate ${expectedRevenue}.`
    : "Drive measurable revenue with this campaign.";

  const mainMessage = `${baseOffer}. ${businessFlavor}`;

  return {
    sms: {
      title: name || "Limited-Time Offer",
      body: `${audienceLine} ${mainMessage} Stop by ${urgency}.`,
    },

    email: {
      title: `${name || "Special Offer"} — ${urgency.toUpperCase()}`,
      body: `${audienceLine}

${mainMessage}

${goalHook}. ${revenueLine}

Visit us ${urgency} and take advantage before it’s gone.`,
    },

    social: {
      title: `${name || "Special Offer"} 🔥`,
      body: `${mainMessage}

${audienceLine}
Available ${urgency}.

#restaurant #foodie #limitedtime`,
    },

    inStore: {
      title: name || "In-Store Special",
      body: `${mainMessage}

${audienceLine}
Available ${urgency} — ask our team for details.`,
    },
  };
}

const handleLaunchCampaign = async (campaign) => {
  try {
    const campaignToLaunch = campaign || {
      name: campaignForm.name || "Live Campaign",
      offer: campaignForm.offer || "",
      channel: campaignForm.channel || "SMS",
      audience: campaignForm.audience || "All Customers",
      timing: campaignForm.timing || "This Week",
      impact: campaignForm.expectedRevenue
        ? `+$${campaignForm.expectedRevenue}/month`
        : "+$1,200/mo",
      status: "draft",
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSavedMessage("User not found");
  
      return;
    }

    const PLAN_LIMITS = {
      starter: { emails: 500, sms: 250 },
      growth: { emails: 5000, sms: 2500 },
      pro: { emails: 25000, sms: 10000 },
    };

    const currentPlan = String(
      effectivePlan || userProfile?.plan || "starter"
    ).toLowerCase();

    const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.starter;

    const emailsUsed = Number(userProfile?.emails_sent_this_month || 0);
    const smsUsed = Number(userProfile?.sms_sent_this_month || 0);

    const emailUsagePercent =
      Number(userProfile?.email_usage_percent || 0) ||
      Math.round((emailsUsed / limits.emails) * 100);

    const smsUsagePercent =
      Number(userProfile?.sms_usage_percent || 0) ||
      Math.round((smsUsed / limits.sms) * 100);

    if (emailUsagePercent >= 100 || smsUsagePercent >= 100) {
      setSavedMessage(
        "Campaign blocked — usage limit exceeded. Upgrade required."
      );
      setTimeout(() => setSavedMessage(""), 3000);
      return;
    }

    if (emailUsagePercent >= 80 || smsUsagePercent >= 80) {
      setSavedMessage(
        "Warning: campaign usage is approaching your plan limit."
      );
      setTimeout(() => setSavedMessage(""), 3000);
    }

    const channelText = String(campaignToLaunch.channel || "").toLowerCase();

    const usesEmail =
      channelText.includes("email") ||
      Boolean(generatedPromotions?.email?.body);

    const usesSms =
      channelText.includes("sms") ||
      Boolean(generatedPromotions?.sms?.body);

    const estimatedEmailSend = usesEmail ? 100 : 0;
    const estimatedSmsSend = usesSms ? 50 : 0;

    const nextEmailsUsed = emailsUsed + estimatedEmailSend;
    const nextSmsUsed = smsUsed + estimatedSmsSend;

    const nextEmailUsagePercent = Math.min(
      100,
      Math.round((nextEmailsUsed / limits.emails) * 100)
    );

    const nextSmsUsagePercent = Math.min(
      100,
      Math.round((nextSmsUsed / limits.sms) * 100)
    );
const estimatedCampaignCost =
  (campaignToLaunch.channel === "SMS" ? 50 * 0.015 : 0) +
  (campaignToLaunch.channel === "Email" ? 100 * 0.002 : 0);
    const payload = {
      user_id: user.id,
      campaign_name: campaignToLaunch.name,
      promotion_title: campaignToLaunch.offer,
      business_type: businessType || "restaurant",
      audience: campaignToLaunch.audience,
      timing: campaignToLaunch.timing,
estimated_cost: estimatedCampaignCost,
      expected_revenue:
        campaignToLaunch.expectedRevenue ||
        campaignForm.expectedRevenue ||
        null,

      active: true,
      published_to_website: true,

      sms_title: campaignToLaunch.name,
      sms_body: generatedPromotions?.sms?.body || campaignToLaunch.offer,

      email_title: campaignToLaunch.name,
      email_body: generatedPromotions?.email?.body || campaignToLaunch.offer,

      social_title: campaignToLaunch.name,
      social_body: generatedPromotions?.social?.body || campaignToLaunch.offer,

      in_store_title: campaignToLaunch.name,
      in_store_body:
        generatedPromotions?.inStore?.body || campaignToLaunch.offer,

      generated_sms: generatedPromotions?.sms?.body || null,
      generated_email: generatedPromotions?.email?.body || null,
      generated_social: generatedPromotions?.social?.body || null,
      generated_in_store: generatedPromotions?.inStore?.body || null,
    };

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    const { error: usageUpdateError } = await supabase
      .from("users")
      .update({
        emails_sent_this_month: nextEmailsUsed,
        sms_sent_this_month: nextSmsUsed,
        email_usage_percent: nextEmailUsagePercent,
        sms_usage_percent: nextSmsUsagePercent,
      })
      .eq("id", user.id);

    if (usageUpdateError) {
      console.error("Usage update error:", usageUpdateError);
    }

    const launchedCampaign = {
      id: data?.id || Date.now(),
      ...campaignToLaunch,
      createdAt: new Date().toLocaleString(),
      status: "Live",
    };

    setSavedCampaigns((prev) => [launchedCampaign, ...prev]);

    setWebsitePromo({
      title: campaignToLaunch.name,
      offer: campaignToLaunch.offer,
      body:
        generatedPromotions?.inStore?.body ||
        campaignToLaunch.offer ||
        "Live promotion now active",
    });

    setSavedMessage("Campaign launched");
    pushActivity(`Launched ${campaignToLaunch.channel} campaign`, "launch");
    setTimeout(() => setSavedMessage(""), 2000);
  } catch (error) {
    console.error("Launch campaign error:", error);
    setSavedMessage("Failed to launch campaign");
    setTimeout(() => setSavedMessage(""), 2000);
  }
};

const topAIActions = (fixSuggestions || [])
  .slice()
  .sort((a, b) => (b.estimatedGain || 0) - (a.estimatedGain || 0))
  .slice(0, 3);


const dashboardShellStyle = {
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "260px minmax(0, 1fr)",
  gap: isMobile ? "14px" : "22px",
  alignItems: "start",
};
const sidebarTitleStyle = {
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "1px",
  color: "#94a3b8",
  marginBottom: "10px",
};
const contentAreaStyle = {
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  overflowX: "hidden",
};
const upgradePillStyle = {
  padding: "10px 12px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
  color: "white",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center",
  boxShadow: "0 6px 18px rgba(79,70,229,0.35)",
};
const sidebarStyle = {
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  position: isMobile ? "relative" : "sticky",
  top: isMobile ? "auto" : "20px",
  padding: "18px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))",
  border: "1px solid rgba(148,163,184,0.14)",
  boxShadow: "0 18px 50px rgba(2,6,23,0.22)",
};
const sidebarFooterStyle = {
  marginTop: "auto",
  paddingTop: "12px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};
const secondaryButtonStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  fontWeight: "700",
  cursor: "pointer",
};

  const revenueChartData = useMemo(() => {
  let currentWeek = revenueTrend?.chartData || [];

  currentWeek = currentWeek.map((item, index) => ({
    ...item,
    label: item.day || item.label || item.date || `Day ${index + 1}`,
    day: item.day || item.label || item.date || `Day ${index + 1}`,
    revenue: Number(item.revenue || 0),
  }));

  if (selectedClient) {
    currentWeek = currentWeek.filter((item) => {
      return (
        item.client_id === selectedClient.id ||
        item.upload_id === selectedClient.id ||
        item.client_name === selectedClient.client_name
      );
    });
  }

  const bestRevenue = Math.max(
    ...currentWeek.map((item) => Number(item.revenue || 0)),
    0
  );

  return currentWeek.map((item) => ({
    ...item,
    isBestDay:
      Number(item.revenue || 0) === bestRevenue && bestRevenue > 0,
  }));
}, [revenueTrend, selectedClient]);
const aiProfitTrendData =
  revenueChartData?.length > 0
    ? revenueChartData.map((row, index) => ({
        day:
          row.day ||
          row.label ||
          row.date ||
          `Day ${index + 1}`,

        baseline: Number(row.revenue || 0),

        optimized:
          Number(row.revenue || 0) +
          Number(simulatedProfit || 0) / 30,

        revenue: Number(row.revenue || 0),

        projectedRevenue:
          Number(row.revenue || 0) +
          Number(simulatedProfit || 0) / 30,

        isBestDay: row.isBestDay || false,
      }))
    : [];
const projectedWeekRevenue = useMemo(() => {
  const todayIndex = new Date().getDay() + 1;
  const currentRevenue = Number(revenueTrend?.currentWeekRevenue || 0);

  if (todayIndex <= 0 || currentRevenue <= 0) return 0;

  return Math.round((currentRevenue / todayIndex) * 7);
}, [revenueTrend]);

const foodCostTrendData =
  revenueChartData?.length > 0
    ? revenueChartData.map((row, index) => ({
        day: row.day || row.label || `Day ${index + 1}`,
        foodCostPercent: Number(foodCostPercentage || 0),
        target: 30,
        danger: 35,
      }))
    : [];
    const laborVsRevenueData =
  revenueChartData?.length > 0
    ? revenueChartData.map((row, index) => ({
        day: row.day || row.label || `Day ${index + 1}`,
        revenue: Number(row.revenue || 0),
        labor:
          Number(row.revenue || 0) *
          (Number(laborCostPercentage || 0) / 100)
      }))
    : [];
const bestRevenueDay = useMemo(() => {
  return revenueChartData.find((item) => item.isBestDay) || {
    day: "N/A",
    revenue: 0,
  };
}, [revenueChartData]);
console.log("FIRST SALE ROW:", salesData?.[0]);
console.log("REVENUE CHART DATA:", revenueChartData);
const foodCostChartData = useMemo(() => {
  const base = Number(foodCostPercentage || 0);

  if (!revenueTrend?.chartData?.length) {
    return [];
  }

  return revenueTrend.chartData.map((item, index) => ({
    day: item.day,
    foodCost: Number((base + (index - 3) * 0.6).toFixed(1)),
  }));
}, [revenueTrend, foodCostPercentage]);

const menuMixData = useMemo(() => {
  if (topSellingItems?.length) {
    return topSellingItems.slice(0, 5).map((item, index) => ({
      name:
        item.name ||
        item.item ||
        item.menuItem ||
        `Item ${index + 1}`,
      value: Number(item.quantity || item.orders || item.sales || item.value || 0),
    }));
  }

  return [];
}, [topSellingItems]);

const laborRevenueChartData = useMemo(() => {
  const laborPercent = Number(laborCostPercentage || 0) / 100;

  if (!revenueTrend?.chartData?.length) {
    return [];
  }

  return revenueTrend.chartData.map((item) => ({
    day: item.day,
    revenue: Number(item.revenue || 0),
    labor: Number(((item.revenue || 0) * laborPercent).toFixed(0)),
  }));
}, [revenueTrend, laborCostPercentage]);

const profitLeakageChartData = useMemo(() => {
  const source = menuItemsData || [];

  return source
    .map((item) => {
      const price = Number(item.price || 0);
      const cost = Number(item.cost || 0);
      const quantitySold = Number(
        item.quantity_sold || item.quantitySold || item.quantity || 0
      );

      const revenue = Number(item.revenue || price * quantitySold || 0);

      const marginPercent =
        price > 0 ? ((price - cost) / price) * 100 : 0;

      const targetMargin = 70;

      const estimatedLoss =
        marginPercent < targetMargin && revenue > 0
          ? ((targetMargin - marginPercent) / 100) * revenue
          : 0;

      return {
        name: item.name || "Menu Item",
        loss: Math.round(estimatedLoss),
        margin: marginPercent,
        revenue,
      };
    })
    .filter((item) => item.loss > 0)
    .sort((a, b) => b.loss - a.loss)
    .slice(0, 8);
}, [menuItemsData]);
console.log("profitLeaks:", profitLeaks);
console.log("fixSuggestions:", fixSuggestions);
console.log("profitLeakageChartData:", profitLeakageChartData);
const [aiSummary, setAiSummary] = useState("");
const [aiAlerts, setAiAlerts] = useState([]);
const [aiRecommendations, setAiRecommendations] = useState([]);
const [aiLoading, setAiLoading] = useState(false);



 const eliteCardStyle = {
  borderRadius: "20px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 12px 30px rgba(15,23,42,0.14)",
};

const eliteSectionEyebrow = {
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#a5b4fc",
  marginBottom: "10px",
};

const eliteTitleStyle = {
  fontSize: "18px",
  fontWeight: "800",
  color: "#ffffff",
  margin: 0,
};

const eliteSubtleText = {
  fontSize: "13px",
  color: "#94a3b8",
  lineHeight: 1.6,
};

const elitePill = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  color: "#cbd5e1",
  fontSize: "11px",
  fontWeight: "700",
};

const eliteGridTwo = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: "20px",
};

const eliteGridFour = {
  display: "grid",

  gridTemplateColumns: isMobile
    ? "1fr"
    : "repeat(auto-fit, minmax(220px, 1fr))",

  gap: isMobile ? "12px" : "16px",
};
console.log("profitLeakageChartData:", profitLeakageChartData);
useEffect(() => {
  try {
    const saved = localStorage.getItem("serven_ai_opportunities");
    if (saved) {
      setGeneratedOpportunities(JSON.parse(saved));
    }
  } catch (err) {
    console.error("Failed to load saved opportunities:", err);
  }
}, []);
const fetchAIInsights = async () => {
  try {
    const response = await fetch("/api/ai-insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  salesData: salesData || [],
  menuItemsData: menuItemsData || [],
  ingredientsData: ingredientsData || [],
  laborData: laborData || [],
  invoiceData: invoicesData || [],
}),
    });

    if (!response.ok) {
      console.error("AI insights failed:", response.status);
      return;
    }

    const data = await response.json();
    setAIInsights(data);
  } catch (error) {
    console.error("AI insights fetch failed:", error);
  }
};
useEffect(() => {
  const fetchHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) return;

      const { data, error } = await supabase
        .from("ai_applied_actions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("History fetch error:", error);
        return;
      }

      const rows = data || [];

      setAiHistory(rows.slice(0, 5));

      const total = rows.reduce(
        (sum, item) => sum + Number(item.impact_value || 0),
        0
      );

      setTotalAiProfit(total);
    } catch (err) {
      console.error("History fetch failed:", err);
    }
  };

  fetchHistory();
}, []);


useEffect(() => {
  if (!revenueChartData?.length) return;
  fetchAIInsights();
}, [totalRevenue, foodCostPercentage, avgMargin, score, revenueChartData]);
useEffect(() => {
  if (displaySimulatedProfit === simulatedProfit) return;

  const diff = simulatedProfit - displaySimulatedProfit;
  const step = Math.abs(diff) < 10 ? diff : diff / 8;

  const timer = setTimeout(() => {
    setDisplaySimulatedProfit((prev) => {
      const next = prev + step;

      if (
        (diff > 0 && next >= simulatedProfit) ||
        (diff < 0 && next <= simulatedProfit)
      ) {
        return simulatedProfit;
      }

      return next;
    });
  }, 40);

  return () => clearTimeout(timer);
}, [simulatedProfit, displaySimulatedProfit]);
useEffect(() => {
  if (!autopilot) return;

  aiProfitOpportunities.forEach((item) => {
    if (!appliedFixes.includes(item.id)) {
      setSimulatedProfit((prev) => prev + item.impact);
      setAppliedFixes((prev) => [...prev, item.id]);
    }
  });
}, [autopilot, aiProfitOpportunities, appliedFixes]);
console.log("profitLeakageChartData:", profitLeakageChartData);
useEffect(() => {
  if (!aiToast) return;

  const timer = setTimeout(() => {
    setAiToast(null);
  }, 2600);

  return () => clearTimeout(timer);
}, [aiToast]);
useEffect(() => {
  try {
    const saved = localStorage.getItem("serven_ai_opportunities");
    if (saved) {
      setGeneratedOpportunities(JSON.parse(saved));
    }
  } catch (err) {
    console.error("Failed to load saved opportunities:", err);
  }
}, []);

const loadClientAlerts = async () => {
  console.log("LOADING CLIENT ALERTS FOR USER:", user?.id);

  if (!user?.id) {
    console.error("No user id found for loading client alerts");
    return;
  }

  setAlertsLoading(true);

  const { data, error } = await supabase
    .from("client_alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("triggered_at", { ascending: false });

  console.log("CLIENT ALERTS DATA:", data);
  console.log("CLIENT ALERTS ERROR:", error);

  if (error) {
    console.error("Failed to load client alerts:", error);
    setClientAlerts([]);
  } else {
    setClientAlerts(data || []);
  }

  setAlertsLoading(false);
};

const runAutopilotAI = async (reason = "Autopilot scan") => {
  try {
    setAiLoading(true);
    setAiScanMessage("AI scanning new data...");

    setAiLog((prev) =>
      [
        {
          id: Date.now(),
          text:
            reason === "Autopilot enabled"
              ? "Autopilot activated"
              : "Autopilot ran scheduled scan",
        },
        ...prev,
      ].slice(0, 6)
    );
const payload = {
  revenueData: revenueChartData || revenueData || [],
  foodCost: Number(foodCostPercentage || 0),
  margin: Number(avgMargin || 0),
  score: Number(score || 0),

  topItems: menuMixData || [],
  distribution: salesDistributionSignals || [],
  leaks: profitLeakageChartData || [],
  profitLeaks: profitLeakageChartData || [],

  laborData: laborRevenueChartData || [],
  alerts: starterAlerts || [],
  peakHours: peakHours || [],
  aov: Number(aov || 0),

  question:
    "Analyze the latest restaurant data and generate the highest-value profit opportunities.",
};

const res = await fetch("/api/ai-insights", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const result = await res.json();

  if (!res.ok) {
  setAiSummary(
    result?.summary || "AI insights are temporarily unavailable."
  );

  setAiAlerts(
    Array.isArray(result?.alerts) ? result.alerts : []
  );

  setTopAiActions(
    Array.isArray(result?.recommendations)
      ? result.recommendations
      : []
  );

  return;
}

setAiSummary(
  result?.summary || "Serven found new restaurant opportunities."
);

setAiAlerts(
  Array.isArray(result?.alerts) ? result.alerts : []
);

setTopAiActions(
  Array.isArray(result?.recommendations)
    ? result.recommendations
    : []
);

    if (
      autopilotEnabled &&
      hasProAccess &&
     Array.isArray(result?.recommendations),
      result.actions.length
    ) {
      const topAction = result.actions[0];
      const actionKey =
        topAction?.title || topAction?.name || "AI action";

      if (!appliedFixes.includes(actionKey)) {
        const value =
          Number(
            String(topAction?.impact || 0).replace(/[^0-9]/g, "")
          ) || 0;

        setSimulatedProfit((prev) => prev + value);
        setAppliedFixes((prev) => [...prev, actionKey]);

        const savedAction = await saveAppliedAIAction({
          actionName: actionKey,
          actionDescription: topAction?.description || "",
          impactValue: value,
          appliedBy: "autopilot",
        });

        addToAiHistory(savedAction);

        showAiToast({
          title: actionKey,
          impact: value,
          source: "autopilot",
        });

        setAiLog((prev) =>
          [
            {
              id: Date.now() + 1,
              text: `Autopilot applied: ${actionKey}`,
            },
            ...prev,
          ].slice(0, 6)
        );
      }
    }
  } catch (error) {
    console.error("Autopilot AI error:", error);

    setAiSummary("AI insights are temporarily unavailable.");
    setAiLog((prev) =>
      [
        {
          id: Date.now(),
          text: "Autopilot failed to complete scan",
        },
        ...prev,
      ].slice(0, 6)
    );
  } finally {
    setAiLoading(false);
    setAiScanMessage("");
  }
};
useEffect(() => {
  if (!autopilotEnabled) return;
  if (!revenueChartData?.length) return;
  if (!user?.id) return;

  const now = Date.now();
  if (lastAutopilotRun && now - lastAutopilotRun < 15000) return;

  const timeout = setTimeout(() => {
    runAutopilotAI("Autopilot scan");
  }, 1200);

  return () => clearTimeout(timeout);
}, [
  autopilotEnabled,
  user?.id,
  totalRevenue,
  foodCostPercentage,
  avgMargin,
  score,
  revenueChartData,
  menuMixData,
  laborRevenueChartData,
  profitLeakageChartData,
  lastAutopilotRun,
]);
useEffect(() => {
  if (!autopilotEnabled) return;
  if (!topAiActions?.length) return;

  const nextAction = topAiActions.find(
    (action) => !appliedFixes.includes(action.title)
  );

  if (!nextAction) return;

  const timeout = setTimeout(() => {
    const value = Number(
      String(nextAction.impact || "").replace(/[^0-9]/g, "")
    );

    setSimulatedProfit((prev) => prev + (value || 0));

    setAppliedFixes((prev) =>
      prev.includes(nextAction.title)
        ? prev
        : [...prev, nextAction.title]
    );

    setAiLog((prev) =>
      [
        {
          id: Date.now(),
          text: `AI applied: ${nextAction.title} → ${nextAction.impact || "+$0/mo"}`,
        },
        ...prev,
      ].slice(0, 6)
    );
  }, 2500);

  return () => clearTimeout(timeout);
}, [autopilotEnabled, topAiActions, appliedFixes]);
useEffect(() => {
  try {
    const savedAutopilot = localStorage.getItem("serven_autopilot_enabled");
    if (savedAutopilot) {
      setAutopilotEnabled(JSON.parse(savedAutopilot));
    }
  } catch (err) {
    console.error("Failed to load autopilot setting:", err);
  }
}, []);
useEffect(() => {
  if (displayTotalAiProfit === totalAiProfit) return;

  const diff = totalAiProfit - displayTotalAiProfit;
  const step = Math.abs(diff) < 10 ? diff : diff / 8;

  const timer = setTimeout(() => {
    setDisplayTotalAiProfit((prev) => {
      const next = prev + step;

      if (
        (diff > 0 && next >= totalAiProfit) ||
        (diff < 0 && next <= totalAiProfit)
      ) {
        return totalAiProfit;
      }

      return next;
    });
  }, 40);

  return () => clearTimeout(timer);
}, [totalAiProfit, displayTotalAiProfit]);
useEffect(() => {
  localStorage.setItem(
    "serven_autopilot_enabled",
    JSON.stringify(autopilotEnabled)
  );
}, [autopilotEnabled]);
useEffect(() => {
  setTimelineAnimated(false);

  const timeout = setTimeout(() => {
    setTimelineAnimated(true);
  }, 120);

  return () => clearTimeout(timeout);
}, [revenueLiftTimeline]);
const loadClientUploads = async () => {
  try {
    const { data, error } = await supabase
      .from("client_data_uploads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Client uploads direct fetch error:", error);
      setClientUploads([]);
      return;
    }

    console.log("DIRECT CLIENT UPLOADS:", data);
    setClientUploads(data || []);
  } catch (err) {
    console.error("Failed to load client uploads:", err);
    setClientUploads([]);
  }
};
useEffect(() => {
  const loadAIRevenue = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error loading AI revenue:", sessionError);
        return;
      }

      const user = session?.user;

      if (!user?.id) {
        console.log("No logged-in user for AI revenue load");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, ai_revenue_recovered")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Supabase users read error:", JSON.stringify(error, null, 2));
        return;
      }

      console.log("Loaded AI revenue row:", data);

      setTotalAIRevenueRecovered(Number(data?.ai_revenue_recovered || 0));
    } 
      
    catch (error) {
  const message = String(error?.message || error || "");

  if (message.includes("Lock broken by another request")) {
    console.warn("AI revenue load skipped because another request finished first.");
    return;
  }

  console.error("Unexpected AI revenue load error:", error);
}
  };

  loadAIRevenue();
}, []);
useEffect(() => {
  loadClientUploads();
}, []);
const top3AIActions = useMemo(() => {
  const source = aiProfitOpportunities?.length
    ? aiProfitOpportunities
    : fixSuggestions?.length
    ? fixSuggestions.map((item, index) => ({
        id: index + 1,
        title: item.name || item.title || `Opportunity ${index + 1}`,
        description:
          item.description ||
          item.action ||
          "AI identified a profit improvement opportunity.",
        impact: Number(item.estimatedGain || item.impact || 0),
        category: "Profit Optimization",
        difficulty: "Medium",
      }))
    : [];

  return [...source]
    .sort((a, b) => Number(b.impact || 0) - Number(a.impact || 0))
    .slice(0, 3);
}, [aiProfitOpportunities, fixSuggestions]);

const top3AITotalImpact = useMemo(() => {
  return top3AIActions.reduce(
    (sum, item) => sum + Number(item.impact || 0),
    0
  );
}, [top3AIActions]);

const aiConfidenceScore = useMemo(() => {
  if (top3AIActions.length >= 3) return 92;
  if (top3AIActions.length === 2) return 84;
  if (top3AIActions.length === 1) return 76;
  return 68;
}, [top3AIActions]);
const proLockOverlay = (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: "20px",
      background: "rgba(2,6,23,0.62)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 5,
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "260px",
        textAlign: "center",
        padding: "18px",
        borderRadius: "18px",
        background: "rgba(15,23,42,0.9)",
        border: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 20px 50px rgba(2,6,23,0.35)",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: "900",
          color: "white",
        }}
      >
        Unlock Pro AI
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          lineHeight: 1.5,
          marginTop: "8px",
        }}
      >
        Enable Autopilot, live AI optimization, and advanced profit recovery tools.
      </div>

      <button
        onClick={() => router.push("/pricing")}
        style={{
          marginTop: "14px",
          padding: "10px 14px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "white",
          fontSize: "12px",
          fontWeight: "800",
          cursor: "pointer",
          width: "100%",
        }}
      >
        Upgrade to Pro →
      </button>
    </div>
  </div>
);
const getAIWhyReason = (action) => {
  const text = `${action?.title || ""} ${action?.description || ""}`.toLowerCase();

  if (text.includes("price") || text.includes("pricing") || text.includes("menu")) {
    return `Menu pricing is likely leaving margin on the table. Current average margin is ${Number(avgMargin || 0).toFixed(1)}%, so AI is prioritizing a pricing or menu mix adjustment.`;
  }

  if (
    text.includes("waste") ||
    text.includes("food cost") ||
    text.includes("portion") ||
    text.includes("supplier")
  ) {
    return `Food cost pressure is elevated at ${Number(foodCostPercentage || 0).toFixed(1)}%, so AI is recommending a cost-control action to protect profitability.`;
  }

  if (
    text.includes("labor") ||
    text.includes("staff") ||
    text.includes("schedule")
  ) {
    return `Labor efficiency looks like a profit lever right now. AI detected staffing or scheduling patterns that may be reducing margin on lower-efficiency periods.`;
  }

  return `AI detected this as a high-value opportunity based on current revenue, margin, labor, and cost signals across your dashboard.`;
};

const projectedRevenueLift = useMemo(() => {
  const currentRevenue = Number(totalRevenue || 0);

  const rawLift = topAiActions.reduce((sum, action) => {
    if (!appliedFixes.includes(action.title)) return sum;

    return (
      sum + Number(String(action.impact || "").replace(/[^0-9]/g, ""))
    );
  }, 0);

  const multiplier =
    revenueScenario === "conservative"
      ? 0.65
      : revenueScenario === "aggressive"
      ? 1.2
      : 1;

  const aiLift = Math.round(rawLift * multiplier);
  const projectedRevenue = currentRevenue + aiLift;
  const percentLift =
    currentRevenue > 0 ? (aiLift / currentRevenue) * 100 : 0;

  return {
    currentRevenue,
    aiLift,
    projectedRevenue,
    percentLift,
  };
}, [totalRevenue, topAiActions, appliedFixes, revenueScenario]);
const weeklyChangeSummary = useMemo(() => {
  const currentWeekRevenue = Number(revenueTrend?.currentWeekRevenue || 0);
  const lastWeekRevenue = Number(revenueTrend?.lastWeekRevenue || 0);
  const revenueDelta = currentWeekRevenue - lastWeekRevenue;
  const revenueDeltaPercent =
    lastWeekRevenue > 0 ? (revenueDelta / lastWeekRevenue) * 100 : 0;

  const marginNow = Number(avgMargin || 0);
  const foodCostNow = Number(foodCostPercentage || 0);

  let headline = "Operations are holding steady this week.";
  let focus = "Maintain current performance and keep monitoring AI opportunities.";

  if (revenueDelta > 0 && marginNow >= 60) {
    headline = "Revenue and margins improved this week.";
    focus = "AI is seeing healthy momentum. Focus on scaling top-performing actions.";
  } else if (revenueDelta > 0 && foodCostNow > 30) {
    headline = "Revenue is up, but food cost pressure is rising.";
    focus = "Protect gains by tightening purchasing, waste, and portion control.";
  } else if (revenueDelta < 0 && marginNow < 60) {
    headline = "Revenue softened and margin is under pressure.";
    focus = "Prioritize pricing corrections and low-margin item fixes first.";
  } else if (foodCostNow > 30) {
    headline = "Food cost is the biggest drag on this week’s performance.";
    focus = "Supplier monitoring and food cost controls should be your top priority.";
  }

  return {
    currentWeekRevenue,
    lastWeekRevenue,
    revenueDelta,
    revenueDeltaPercent,
    marginNow,
    foodCostNow,
    headline,
    focus,
  };
}, [revenueTrend, avgMargin, foodCostPercentage]);
const topRisksThisWeek = useMemo(() => {
  const risks = [];

  if (Number(foodCostPercentage || 0) > 30) {
    risks.push({
      title: "Food cost is above healthy range",
      description:
        "Current food cost is pressuring profitability and may reduce gains from higher sales volume.",
      value: `${Number(foodCostPercentage || 0).toFixed(1)}%`,
      severity: "high",
    });
  }

  if (Number(avgMargin || 0) < 60) {
    risks.push({
      title: "Average margin is below target",
      description:
        "Lower-margin menu items may be dragging profitability and limiting revenue conversion.",
      value: `${Number(avgMargin || 0).toFixed(1)}%`,
      severity: "high",
    });
  }

  const laborRisk =
    laborRevenueChartData?.some(
      (day) => Number(day?.laborPercent || 0) > 30
    ) || false;

  if (laborRisk) {
    risks.push({
      title: "Labor efficiency risk detected",
      description:
        "At least one shift appears overstaffed based on labor-to-revenue ratio.",
      value: "Over 30%",
      severity: "medium",
    });
  }

  if (Number(revenueTrend?.growthPercent || 0) < 0) {
    risks.push({
      title: "Revenue slowed versus last week",
      description:
        "Sales momentum softened compared to the prior week, which may reduce short-term upside.",
      value: `${Number(revenueTrend?.growthPercent || 0).toFixed(1)}%`,
      severity: "medium",
    });
  }

  if (!risks.length) {
    risks.push({
      title: "No major operational risks detected",
      description:
        "Current data looks stable. Continue monitoring AI recommendations and weekly performance shifts.",
      value: "Stable",
      severity: "low",
    });
  }

  return risks.slice(0, 3);
}, [foodCostPercentage, avgMargin, laborRevenueChartData, revenueTrend]);
const topOpportunitiesThisWeek = useMemo(() => {
  const opportunities = [];

  if (Number(avgMargin || 0) < 65) {
    opportunities.push({
      title: "Pricing optimization opportunity",
      description:
        "AI sees room to improve menu pricing and margin capture on underperforming items.",
      value: `+${Math.round((65 - Number(avgMargin || 0)) * 120).toLocaleString()}/mo`,
      priority: "high",
    });
  }

  if (Number(foodCostPercentage || 0) > 28) {
    opportunities.push({
      title: "Food cost recovery window",
      description:
        "Reducing waste, tightening portions, or improving supplier pricing could unlock fast margin gains.",
      value: `+${Math.round((Number(foodCostPercentage || 0) - 28) * 180).toLocaleString()}/mo`,
      priority: "high",
    });
  }

  const laborRisk =
    laborRevenueChartData?.some(
      (day) => Number(day?.laborPercent || 0) > 28
    ) || false;

  if (laborRisk) {
    opportunities.push({
      title: "Labor scheduling improvement",
      description:
        "AI detected at least one period where staffing efficiency can be improved without hurting service.",
      value: "+900/mo",
      priority: "medium",
    });
  }

  if (Number(revenueTrend?.growthPercent || 0) >= 0) {
    opportunities.push({
      title: "Momentum scaling opportunity",
      description:
        "Revenue is stable or improving, which gives you room to push promotions, upsells, and winning menu items.",
      value: `+${Math.max(
        600,
        Math.round(Number(revenueTrend?.currentWeekRevenue || 0) * 0.04)
      ).toLocaleString()}/mo`,
      priority: "medium",
    });
  }

  if (!opportunities.length) {
    opportunities.push({
      title: "No major upside signals yet",
      description:
        "Current performance looks stable. Keep monitoring AI actions to surface the next revenue opportunity.",
      value: "+0/mo",
      priority: "low",
    });
  }

  return opportunities.slice(0, 3);
}, [avgMargin, foodCostPercentage, laborRevenueChartData, revenueTrend]);
const weeklyAIActionPlan = useMemo(() => {
  const steps = [];

  if (Number(avgMargin || 0) < 60) {
    steps.push({
      step: "01",
      title: "Fix low-margin menu items",
      description:
        "Review menu items with weak margins and adjust pricing, portions, or recipe costs first.",
      priority: "High",
    });
  }

  if (Number(foodCostPercentage || 0) > 30) {
    steps.push({
      step: "02",
      title: "Reduce food cost leakage",
      description:
        "Audit supplier pricing, portion control, and waste to protect profitability this week.",
      priority: "High",
    });
  }

  const laborRisk =
    laborRevenueChartData?.some(
      (day) => Number(day?.laborPercent || 0) > 30
    ) || false;

  if (laborRisk) {
    steps.push({
      step: "03",
      title: "Tighten labor scheduling",
      description:
        "Adjust staffing around lower-efficiency shifts to reduce labor drag without hurting service.",
      priority: "Medium",
    });
  }

  if (Number(revenueTrend?.growthPercent || 0) >= 0) {
    steps.push({
      step: "04",
      title: "Push top-performing revenue drivers",
      description:
        "Lean into promotions, upsells, and winning menu items while momentum is positive.",
      priority: "Medium",
    });
  }

  if (!steps.length) {
    steps.push({
      step: "01",
      title: "Maintain current performance",
      description:
        "No urgent issues detected right now. Monitor AI recommendations and protect current gains.",
      priority: "Low",
    });
  }

  return steps.slice(0, 3);
}, [avgMargin, foodCostPercentage, laborRevenueChartData, revenueTrend]);
const getPriorityTone = (priority) => {
  if (priority === "high") {
    return {
      bg: "rgba(239,68,68,0.10)",
      border: "1px solid rgba(239,68,68,0.18)",
      accent: "#fca5a5",
      pillBg: "rgba(239,68,68,0.14)",
      label: "High Priority",
    };
  }

  if (priority === "medium") {
    return {
      bg: "rgba(245,158,11,0.10)",
      border: "1px solid rgba(245,158,11,0.18)",
      accent: "#fcd34d",
      pillBg: "rgba(245,158,11,0.14)",
      label: "Medium Priority",
    };
  }

  return {
    bg: "rgba(34,197,94,0.10)",
    border: "1px solid rgba(34,197,94,0.18)",
    accent: "#86efac",
    pillBg: "rgba(34,197,94,0.14)",
    label: "Stable",
  };
};
const weeklyExecutiveSummary = useMemo(() => {
  const revenueDelta = Number(revenueTrend?.growthPercent || 0);
  const revenueNow = Number(revenueTrend?.currentWeekRevenue || 0);
  const marginNow = Number(avgMargin || 0);
  const foodCostNow = Number(foodCostPercentage || 0);

  let headline = "The business is stable this week.";
  let summary =
    "Serven AI is monitoring revenue, margin, labor, and food cost for the next best optimization opportunities.";
  let priority = "low";

  if (revenueDelta > 0 && marginNow >= 60 && foodCostNow <= 30) {
    headline = "Revenue is rising and operations look healthy.";
    summary = `This week revenue is tracking at $${revenueNow.toLocaleString()} with margin at ${marginNow.toFixed(
      1
    )}%. AI sees a strong opportunity to scale what is already working.`;
    priority = "low";
  } else if (revenueDelta > 0 && foodCostNow > 30) {
    headline = "Sales are improving, but food cost is limiting upside.";
    summary = `Revenue momentum is positive, but food cost is elevated at ${foodCostNow.toFixed(
      1
    )}%. AI recommends protecting gains through tighter cost controls.`;
    priority = "medium";
  } else if (revenueDelta < 0 && marginNow < 60) {
    headline = "Revenue softened and margins need attention.";
    summary = `This week revenue is under pressure and average margin is ${marginNow.toFixed(
      1
    )}%. AI recommends prioritizing pricing and profitability fixes first.`;
    priority = "high";
  } else if (foodCostNow > 30) {
    headline = "Food cost is the main operational pressure this week.";
    summary = `Revenue is relatively stable, but food cost at ${foodCostNow.toFixed(
      1
    )}% is limiting profit conversion. AI sees cost recovery as the fastest path to improvement.`;
    priority = "medium";
  }

  return {
    headline,
    summary,
    priority,
    tone: getPriorityTone(priority),
  };
}, [revenueTrend, avgMargin, foodCostPercentage]);
const handleCSVUpload = async (e) => {
  setShowDataSourceMenu(false);

  const file = e.target.files?.[0];
  if (!file) return;

  try {
    let rows = [];

    if (file.name.toLowerCase().endsWith(".csv")) {
      const text = await file.text();

      rows = text
        .split("\n")
        .map((row) => row.split(","))
        .filter((row) =>
          row.some((cell) => String(cell || "").trim() !== "")
        );
    } else if (file.name.toLowerCase().endsWith(".xlsx")) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    } else {
      alert("Unsupported file type. Please upload CSV or XLSX.");
      return;
    }
const detectedSource = detectPOSSourceFromRows(rows);

console.log("UPLOADED DATA:", rows);
console.log("Detected POS Source:", detectedSource);

setAiLog((prev) =>
  [
    {
      id: Date.now(),
      text: `New sales data uploaded (${detectedSource} detected)`,
    },
    ...prev,
  ].slice(0, 6)
);
setPendingUploadSummary({
  fileName: file.name,
  rowCount: rows.length,
  uploadedAt: Date.now(),
  detectedSource,
  uploadType: uploadType || "unknown",
  rows: rows,
});
if (!rows || rows.length === 0) {
  throw new Error(
    "This file looks empty. Please upload a CSV/XLSX with sales data."
  );
}

const firstRow = rows[0] || {};

const normalizedKeys = Object.keys(firstRow).map((key) =>
  key.toLowerCase().replace(/\s+/g, "")
);

const requiredColumns = ["date", "item", "quantity", "revenue"];

const missingColumns = requiredColumns.filter(
  (column) => !normalizedKeys.some((key) => key.includes(column))
);

if (missingColumns.length > 0) {
  throw new Error(`Missing required columns: ${missingColumns.join(", ")}.`);
}
if (uploadType === "pos") {
  setSelectedDataSource(detectedSource);
  setShowSourcePicker(true);
}
// if (autopilotEnabled) {
//   runAutopilotAI("CSV upload scan");
// }


} catch (error) {
  console.error("CSV/XLSX upload failed:", error);

  setUploadError(
    error?.message || "Upload failed. Please check your file and try again."
  );

} finally {
  e.target.value = "";
}
};

const applyTopRecommendedFix = () => {
  const source =
    Array.isArray(topAIActions) && topAIActions.length
      ? topAIActions
      : Array.isArray(topAiActions) && topAiActions.length
      ? topAiActions.map((action) => ({
          name: action.title || action.name || "AI Fix",
          estimatedGain: Number(
            String(action.impact || action.estimatedGain || 0).replace(/[^0-9]/g, "")
          ),
          description:
            action.description || action.action || "Recommended optimization",
          priority: action.priority || "Medium",
        }))
      : [];

  if (!source.length) return;

  const nextAction = source.find(
    (item) => !appliedFixes.includes(item.name)
  );

  if (!nextAction) return;

  const value = Number(nextAction.estimatedGain || 0);

  setSimulatedProfit((prev) => prev + value);

  setAppliedFixes((prev) =>
    prev.includes(nextAction.name) ? prev : [...prev, nextAction.name]
  );

  setAiLog((prev) =>
    [
      {
        id: Date.now(),
        text: `Auto-applied AI fix: ${nextAction.name} → +$${value.toFixed(0)}/mo`,
      },
      ...prev,
    ].slice(0, 6)
  );

  setSelectedAlertAction(null);
};

const closeSourcePicker = () => {
  setShowSourcePicker(false);
  setSelectedDataSource("");
  setPendingUploadSummary(null);
};

const detectPOSSourceFromRows = (rows) => {
  if (!Array.isArray(rows) || !rows.length) {
    return "Other";
  }

  const headerRow = rows[0] || [];
  const headers = headerRow.map((cell) =>
    String(cell || "").trim().toLowerCase()
  );

  const hasAny = (candidates) =>
    candidates.some((candidate) => headers.includes(candidate));

  const scoreMatches = (candidates) =>
    candidates.reduce(
      (count, candidate) => count + (headers.includes(candidate) ? 1 : 0),
      0
    );

  const profiles = [
    {
      name: "Square",
      headers: [
        "date",
        "time",
        "gross sales",
        "net sales",
        "discounts",
        "refunds",
        "tips",
      ],
    },
    {
      name: "Shopify",
      headers: [
        "name",
        "email",
        "financial status",
        "paid at",
        "lineitem name",
        "lineitem quantity",
        "lineitem price",
      ],
    },
    {
      name: "Toast",
      headers: [
        "menu item",
        "gross price",
        "net price",
        "dining option",
        "order date",
        "void",
      ],
    },
    {
      name: "Clover",
      headers: [
        "order id",
        "employee",
        "item",
        "item price",
        "qty",
        "tax",
        "payment method",
      ],
    },
  ];

  let bestMatch = { name: "Other", score: 0 };

  for (const profile of profiles) {
    const score = scoreMatches(profile.headers);
    if (score > bestMatch.score) {
      bestMatch = { name: profile.name, score };
    }
  }

  if (bestMatch.score >= 2) {
    return bestMatch.name;
  }

  if (hasAny(["lineitem name", "financial status"])) return "Shopify";
  if (hasAny(["gross sales", "net sales"])) return "Square";
  if (hasAny(["menu item", "dining option"])) return "Toast";
  if (hasAny(["order id", "payment method"])) return "Clover";

  return "Other";
};

const deleteClientUpload = async (id) => {
  if (!id) return;
  if (!confirm("Delete this upload?")) return;

  try {
    const res = await fetch("/api/delete-client-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Delete failed:", result);
      alert(result?.error || "Delete failed");
      return;
    }

    setClientUploads((prev) =>
      (prev || []).filter((item) => item.id !== id)
    );

    await loadClientUploads();
  } catch (err) {
    console.error("Delete error:", err);
    alert(err?.message || "Delete error");
  }
};
const clientRiskSummary = {
  critical: clientAlerts?.filter((a) => a.severity === "critical").length || 0,
  warning: clientAlerts?.filter((a) => a.severity === "warning").length || 0,
  good: clientAlerts?.filter((a) => a.severity === "good").length || 0,
};
const filteredClientAlerts = clientAlerts.filter((alert) => {
  if (clientAlertFilter === "all") return true;
  return alert.severity === clientAlertFilter;
});
const buildAlertMetricsFromDashboard = () => {
  const safeLaborData = Array.isArray(laborRevenueChartData)
    ? laborRevenueChartData
    : [];

  const avgLaborCostPct = safeLaborData.length
    ? safeLaborData.reduce(
        (sum, day) => sum + Number(day?.laborPercent || 0),
        0
      ) / safeLaborData.length
    : 0;

  return {
    health_score: Number(score || 0),
    food_cost_pct: Number(foodCostPercentage || 0),
    labor_cost_pct: Number(avgLaborCostPct || 0),
    revenue_growth: Number(revenueTrend?.growth || 0),
    review_rating: 0,
    missed_campaigns: 0,
  };
};

const updateClientAlertStatus = async (alertId, status) => {
  try {
    const { error } = await supabase
      .from("client_alerts")
      .update({ status })
      .eq("id", alertId);

    if (error) {
      console.error("Failed to update client alert status:", error);
      return;
    }

    setClientAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, status } : alert
      )
    );

    setAiLog((prev) =>
      [
        {
          id: Date.now(),
          text: `Client alert marked as ${status}`,
        },
        ...prev,
      ].slice(0, 6)
    );

    await loadClientAlerts();
  } catch (error) {
    console.error("Client alert status update failed:", error);
  }
};


console.log("DASHBOARD COMPONENT RENDERED");

useEffect(() => {
  const fetchUserProfile = async (authUser, label = "PROFILE") => {
    if (!authUser?.email) {
      setUserProfile(null);
      return;
    }

    const cleanEmail = String(authUser.email).trim().toLowerCase();

    const { data: profileRows, error: profileError } = await supabase
      .from("users")
      .select("*")
      .ilike("email", cleanEmail)
      .limit(1);

    if (profileError) {
      console.error(`${label} FETCH FAILED:`, profileError);
      setUserProfile(null);
      return;
    }

    console.log(`${label} ROWS:`, profileRows);

    const profileData = profileRows?.[0] || null;

    if (!profileData) {
      console.error("NO USER PROFILE FOUND FOR:", cleanEmail);
      setUserProfile(null);
      return;
    }

    console.log(`${label} DATA:`, profileData);
    setUserProfile(profileData);
  };

  const loadUser = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Failed to load session:", sessionError);
        setUser(null);
        setUserProfile(null);
        return;
      }

      const authUser = session?.user || null;

      console.log("AUTH USER:", authUser);
      setUser(authUser);

      await fetchUserProfile(authUser, "PROFILE");
    } catch (err) {
      console.error("Failed to get current user:", err);
      setUser(null);
      setUserProfile(null);
    }
  };

  loadUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const authUser = session?.user || null;

    console.log("AUTH STATE CHANGED:", authUser);
    setUser(authUser);

    await fetchUserProfile(authUser, "PROFILE AFTER AUTH CHANGE");
  });

  return () => {
    subscription?.unsubscribe();
  };
}, []);
useEffect(() => {
  if (user?.id && isOwner) {
    loadClientAlerts();
  } else {
    setClientAlerts([]);
  }
}, [user?.id, isOwner]);
const getRecommendedActionForAlert = (alert) => {
  const actionsSource =
    Array.isArray(topAiActions) && topAiActions.length
      ? topAiActions
      : Array.isArray(aiRecommendations) && aiRecommendations.length
      ? aiRecommendations
      : [];

  if (!actionsSource.length || !alert) return null;

  const metricKey = String(alert.metric_key || "").toLowerCase();
  const ruleName = String(alert.rule_name || "").toLowerCase();
  const combinedAlertText = `${metricKey} ${ruleName}`;

 const normalizeAction = (action) => ({
  title: action.name || action.title || "AI Recommendation",
  description:
    action.description ||
    action.action ||
    action.text ||
    "Recommended optimization",
  impact: action.estimatedGain
    ? `+$${Number(action.estimatedGain).toFixed(0)}/mo`
    : "+$0/mo",
});

  const matchByKeywords = (keywords) =>
    actionsSource.find((action) => {
      const text = `${action.title || ""} ${action.description || ""} ${action.action || ""}`.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword));
    });

  if (
    combinedAlertText.includes("food_cost") ||
    combinedAlertText.includes("food cost") ||
    combinedAlertText.includes("waste") ||
    combinedAlertText.includes("supplier")
  ) {
    return normalizeAction(
      matchByKeywords(["food cost", "waste", "supplier", "portion", "pricing"]) ||
        actionsSource[0]
    );
  }

  if (
    combinedAlertText.includes("labor") ||
    combinedAlertText.includes("staff") ||
    combinedAlertText.includes("schedule")
  ) {
    return normalizeAction(
      matchByKeywords(["labor", "staff", "schedule", "shift"]) ||
        actionsSource[0]
    );
  }

  if (
    combinedAlertText.includes("health_score") ||
    combinedAlertText.includes("health score") ||
    combinedAlertText.includes("margin") ||
    combinedAlertText.includes("profit")
  ) {
    return normalizeAction(
      matchByKeywords(["margin", "profit", "pricing", "menu"]) ||
        actionsSource[0]
    );
  }

  if (
    combinedAlertText.includes("revenue") ||
    combinedAlertText.includes("campaign") ||
    combinedAlertText.includes("review")
  ) {
    return normalizeAction(
      matchByKeywords(["revenue", "upsell", "promotion", "campaign", "review"]) ||
        actionsSource[0]
    );
  }

  return normalizeAction(actionsSource[0]);
};
useEffect(() => {
  if (activeTab !== "ai") return;
  if (!selectedAlertAction) return;

  const timeout = setTimeout(() => {
    selectedAiFixRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 200);

  return () => clearTimeout(timeout);
}, [activeTab, selectedAlertAction]);
const saveAppliedAIAction = async ({
  actionName,
  actionDescription = "",
  impactValue = 0,
  appliedBy = "autopilot",
}) => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return null;
    }

    const user = session?.user;

    if (!user?.id) return null;

    const { data, error } = await supabase
      .from("ai_applied_actions")
      .insert([
        {
          user_id: user.id,
          action_name: actionName,
          action_description: actionDescription,
          impact_value: Number(impactValue || 0),
          applied_by: appliedBy,
          status: "applied",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Failed to save AI action:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error saving AI action:", error);
    return null;
  }
};
const addToAiHistory = (newItem) => {
  if (!newItem) return;

  setAiHistory((prev) => {
    const exists = prev.some((item) => item.id === newItem.id);
    if (exists) return prev;

    return [newItem, ...prev].slice(0, 5);
  });

  setTotalAiProfit((prev) => prev + Number(newItem.impact_value || 0));
};
const formatTimeAgo = (dateString) => {
  if (!dateString) return "Just now";

  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};
const showAiToast = ({ title, impact = 0, source = "autopilot" }) => {
  setAiToast({
    id: Date.now(),
    title,
    impact,
    source,
  });
};
const filteredClientUploads = useMemo(() => {
  const source = Array.isArray(clientUploads) ? clientUploads : [];
  const search = String(clientSearch || "").trim().toLowerCase();

  if (!search) return source;

  return source.filter((client) => {
    const name = String(
      client.client_name || client.restaurant_name || client.name || ""
    ).toLowerCase();

    const email = String(
      client.client_email || client.email || ""
    ).toLowerCase();

    const sourceName = String(
      client.source_name || client.detected_source || ""
    ).toLowerCase();

    const ownerScore = String(
      Number(client.owner_score || 0).toFixed(0)
    ).toLowerCase();

    const clientScore = String(
      Number(client.client_score || 0).toFixed(0)
    ).toLowerCase();

    const revenue = String(
      Number(client.month_revenue || 0).toFixed(0)
    ).toLowerCase();

    return (
      name.includes(search) ||
      email.includes(search) ||
      sourceName.includes(search) ||
      ownerScore.includes(search) ||
      clientScore.includes(search) ||
      revenue.includes(search)
    );
  });
}, [clientUploads, clientSearch]);
const activeClientUploads = selectedClient
  ? filteredClientUploads.filter(
      (client) =>
        client.id === selectedClient.id ||
        client.client_name === selectedClient.client_name
    )
  : filteredClientUploads;
const getClientHealthTone = (client) => {
  const scoreValue = Number(client?.health_score || client?.ai_score || 0);

  if (scoreValue >= 80) {
    return {
      label: "Healthy",
      color: "#86efac",
      bg: "rgba(34,197,94,0.14)",
      border: "1px solid rgba(34,197,94,0.22)",
    };
  }

  if (scoreValue >= 60) {
    return {
      label: "Watch",
      color: "#fcd34d",
      bg: "rgba(245,158,11,0.14)",
      border: "1px solid rgba(245,158,11,0.22)",
    };
  }

  return {
    label: "At Risk",
    color: "#fca5a5",
    bg: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(239,68,68,0.22)",
  };
};
const activeClient = isOwner && selectedClient ? selectedClient : null;

const dashboardRevenue = activeClient
  ? Number(activeClient.month_revenue || activeClient.revenue || totalRevenue || 0)
  : Number(totalRevenue || 0);

const dashboardScore = activeClient
  ? Number(activeClient.health_score || activeClient.ai_score || score || 0)
  : Number(score || 0);

const dashboardFoodCost = activeClient
  ? Number(activeClient.food_cost || foodCostPercentage || 0)
  : Number(foodCostPercentage || 0);

const dashboardMargin = activeClient
  ? Number(activeClient.avg_margin || activeClient.margin || avgMargin || 0)
  : Number(avgMargin || 0);

const dashboardClientName = activeClient
  ? activeClient.client_name ||
    activeClient.restaurant_name ||
    activeClient.name ||
    "Selected Client"
  : null;
const sortedRiskClients = [...(clientUploads || [])]
  .map((client) => {
    const ownerScore = Number(client?.owner_score ?? 0);
    const clientScore = Number(client?.client_score ?? 0);
    const monthlyChange = Number(client?.monthly_change_percent ?? 0);
    const weeklyChange = Number(client?.weekly_change_percent ?? 0);
    const foodCost = Number(client?.food_cost ?? 0);
    const laborCost = Number(client?.labor_cost ?? 0);
    const alerts = Number(client?.alerts_triggered ?? 0);
    const wasteLoss = Number(client?.waste_loss ?? 0);
    const profitLeakCount = Number(client?.profit_leak_count ?? 0);

    let riskLevel = "Healthy";
    let riskColor = "#22c55e";
    let riskBg = "rgba(34,197,94,0.14)";
    let riskBorder = "1px solid rgba(34,197,94,0.28)";

    if (
      ownerScore < 55 ||
      monthlyChange <= -15 ||
      foodCost >= 40 ||
      alerts >= 3
    ) {
      riskLevel = "High Risk";
      riskColor = "#ef4444";
      riskBg = "rgba(239,68,68,0.14)";
      riskBorder = "1px solid rgba(239,68,68,0.28)";
    } else if (
      ownerScore < 70 ||
      monthlyChange < 0 ||
      weeklyChange < 0 ||
      foodCost >= 32 ||
      laborCost >= 30 ||
      alerts >= 1
    ) {
      riskLevel = "Watch";
      riskColor = "#f59e0b";
      riskBg = "rgba(245,158,11,0.14)";
      riskBorder = "1px solid rgba(245,158,11,0.28)";
    }

    const urgencyScore =
      (100 - ownerScore) +
      Math.max(0, Math.abs(Math.min(monthlyChange, 0)) * 2) +
      Math.max(0, Math.abs(Math.min(weeklyChange, 0)) * 1.5) +
      Math.max(0, foodCost - 30) +
      Math.max(0, laborCost - 28) +
      alerts * 8 +
      profitLeakCount * 2 +
      Math.min(wasteLoss / 100, 25);

    let topRiskReason = "Stable performance";
    if (ownerScore < 55) topRiskReason = "Low owner score";
    else if (monthlyChange <= -15) topRiskReason = "Monthly revenue falling";
    else if (foodCost >= 40) topRiskReason = "Food cost too high";
    else if (laborCost >= 30) topRiskReason = "Labor cost pressure";
    else if (alerts >= 3) topRiskReason = "Multiple alerts triggered";
    else if (weeklyChange < 0) topRiskReason = "Weekly momentum is down";

    return {
      ...client,
      ownerScore,
      clientScore,
      monthlyChange,
      weeklyChange,
      foodCost,
      laborCost,
      alerts,
      wasteLoss,
      profitLeakCount,
      riskLevel,
      riskColor,
      riskBg,
      riskBorder,
      urgencyScore,
      topRiskReason,
    };
  })
  .sort((a, b) => b.urgencyScore - a.urgencyScore);

const highRiskClients = sortedRiskClients.filter(
  (client) => client.riskLevel === "High Risk"
);

const watchClients = sortedRiskClients.filter(
  (client) => client.riskLevel === "Watch"
);

const healthyClients = sortedRiskClients.filter(
  (client) => client.riskLevel === "Healthy"
);

const riskPanelCardStyle = {
  borderRadius: "24px",
  padding: "22px",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
  border: "1px solid rgba(148,163,184,0.16)",
  boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
};

const riskStatCardStyle = {
  borderRadius: "18px",
  padding: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(148,163,184,0.14)",
};

const getRiskStatusText = (client) => {
  if (client.riskLevel === "High Risk") {
    return "Needs immediate attention";
  }
  if (client.riskLevel === "Watch") {
    return "Monitor closely";
  }
  return "Currently stable";
};

const getRiskArrow = (value) => {
  if (value > 0) return "↑";
  if (value < 0) return "↓";
  return "•";
};
const isRiskClientReviewed = (client) => {
  const key = client?.id || client?.client_name;
  return reviewedRiskClients.includes(key);
};

const markRiskClientReviewed = (client) => {
  const key = client?.id || client?.client_name;
  if (!key) return;

  setReviewedRiskClients((prev) =>
    prev.includes(key) ? prev : [...prev, key]
  );
};
const openRiskEmailModal = (client) => {
  const clientName = client?.client_name || "Client";
  const issue =
    client?.top_issue || client?.topRiskReason || "recent performance issues";

  setRiskEmailTo(client?.client_email || "");

  setRiskEmailSubject(`Serven performance review for ${clientName}`);

  setRiskEmailBody(`Hi ${clientName},

I reviewed your latest Serven data and noticed a few areas that may need attention, especially around ${issue}.

Here’s what stood out:
- Owner Score: ${Math.round(client?.ownerScore || 0)}
- Client Score: ${Math.round(client?.clientScore || 0)}
- Monthly Trend: ${Number(client?.monthlyChange || 0).toFixed(1)}%
- Weekly Trend: ${Number(client?.weeklyChange || 0).toFixed(1)}%
- Food Cost: ${Number(client?.foodCost || 0).toFixed(1)}%
- Labor Cost: ${Number(client?.laborCost || 0).toFixed(1)}%

Recommended next step:
${
  client?.ownerScore < 55
    ? "We should review pricing, waste, and operations right away."
    : client?.monthlyChange <= -15
    ? "We should put together a short recovery plan and review campaign performance."
    : client?.foodCost >= 40
    ? "We should review supplier pricing and menu mix."
    : client?.alerts >= 3
    ? "We should review repeated alert patterns and fix the main drivers."
    : "We should monitor closely and review the next upload together."
}

Let me know a good time to connect and go through it.

Best,
Antoine`);

  setShowRiskEmailModal(true);
};useEffect(() => {
  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("CURRENT SESSION:", session);

      if (!session) {
        window.location.replace("/login");
      }
    } catch (err) {
      console.error("Session check failed:", err);
    }
  };

  checkSession();
}, []);

console.log("CLIENTUPLOADS STATE VALUE:", clientUploads);

const handleLogout = async () => {
  console.log("START LOGOUT");

  try {
    // logout from supabase
    await supabase.auth.signOut({ scope: "global" });

    // clear browser storage
    localStorage.clear();
    sessionStorage.clear();

    // manually remove supabase keys
    for (const key in localStorage) {
      if (key.toLowerCase().includes("supabase")) {
        localStorage.removeItem(key);
      }
    }

    console.log("REDIRECTING");

    // HARD redirect
    window.location.replace("/login");
  } catch (err) {
    console.error("LOGOUT ERROR:", err);

    // force redirect anyway
    window.location.replace("/login");
  }
};
const getDailyUploadStatus = (client) => {
  if (!client?.created_at) {
    return {
      label: "No Upload",
      color: "#f87171",
      bg: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.18)",
    };
  }

  const uploadDate = new Date(client.created_at);
  const now = new Date();

  const uploadDay = new Date(
    uploadDate.getFullYear(),
    uploadDate.getMonth(),
    uploadDate.getDate()
  );

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const diffMs = today.getTime() - uploadDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      label: "Uploaded Today",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.12)",
      border: "1px solid rgba(34,197,94,0.18)",
    };
  }

  if (diffDays === 1) {
    return {
      label: "Needs Upload",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.18)",
    };
  }

  return {
    label: "Overdue",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.18)",
  };
};
const overdueClients = (clientUploads || []).filter((client) => {
  const status = getDailyUploadStatus(client);
  return status.label === "Overdue" || status.label === "Needs Upload";
});

const uploadedTodayCount = (clientUploads || []).filter((client) => {
  const status = getDailyUploadStatus(client);
  return status.label === "Uploaded Today";
}).length;

const overdueCount = overdueClients.filter(
  (client) => getDailyUploadStatus(client).label === "Overdue"
).length;

const needsUploadCount = overdueClients.filter(
  (client) => getDailyUploadStatus(client).label === "Needs Upload"
).length;
const undoDeleteClientUpload = async () => {
  if (!recentlyDeletedUpload) return;

  try {
    const { error } = await supabase
      .from("client_data_uploads")
      .insert([recentlyDeletedUpload]);

    if (error) {
      console.error("Undo delete failed:", error);
      return;
    }

    if (deleteTimeoutId) {
      clearTimeout(deleteTimeoutId);
      setDeleteTimeoutId(null);
    }

    await loadClientUploads();
    setShowUndoDelete(false);
    setRecentlyDeletedUpload(null);
  } catch (err) {
    console.error("Undo delete error:", err);
  }
};
const detectColumn = (sample, keywords = []) => {
  const columns = Object.keys(sample || {});
  return (
    columns.find((col) =>
      keywords.some((keyword) =>
        String(col).toLowerCase().includes(keyword.toLowerCase())
      )
    ) || ""
  );
};
const handleFileUpload = async (e) => {
  

  const file = e.target.files?.[0];
  if (!file) return;

  try {
    
    const activeUploadType = selectedUploadTypeRef.current || uploadType;

    let dataRows = [];

    const fileName = file.name.toLowerCase();
    const isExcelFile =
      fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (isExcelFile) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      let bestRows = [];

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];

        const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          blankrows: false,
          raw: false,
        });

        if (sheetRows.length > bestRows.length) {
          bestRows = sheetRows;
        }
      });

      if (!bestRows.length) {
        alert("Excel file opened, but no rows were found.");
        dataRows = [];
      } else {
        const headers = (bestRows[0] || []).map((h) =>
          String(h || "").trim()
        );

        dataRows = bestRows.slice(1).map((row) => {
          const obj = {};

          headers.forEach((header, index) => {
            if (header) obj[header] = row[index] ?? "";
          });

          return obj;
        });
      }
    } else {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

      if (!lines.length) {
        setMessage("The selected file is empty.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim());

      dataRows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        return row;
      });
    }

    const safeRows = dataRows.filter((row) =>
      Object.values(row).some((value) => String(value || "").trim() !== "")
    );

    pendingUploadRowsRef.current = safeRows;
    setPendingUploadRows(safeRows);

    

    if (activeUploadType === "pos") {
      setRows(safeRows);

      const {
        data: { user },
      } = await supabase.auth.getUser();
console.log("AUTH USER:", user);

      if (user?.id && safeRows.length) {
        const { data: uploadRow, error: uploadError } = await supabase
          .from("uploads")
          .insert([
            {
              user_id: user.id,
              file_name: file.name,
              source_name: "Manual Upload",
              row_count: safeRows.length,
              upload_type: "pos",
              status: "completed",
location_id: selectedUploadLocationId,
            },
          ])
          .select()
          .single();

        if (uploadError) {
          console.error("POS upload save failed:", uploadError);
        }

        const salesRows = safeRows
          .map((row) => {
            const rawDate =
              row.date ||
              row.Date ||
              row.sale_date ||
              row["Sale Date"] ||
              row["Business Date"] ||
              row.day ||
              row.Day ||
              null;

            const rawRevenue =
  row.revenue ||
  row.Revenue ||
  row.sales ||
  row.Sales ||
  row.total ||
  row.Total ||
  row.total_sales ||
  row["Total Sales"] ||
  row["Net Sales"] ||
  row["Gross Sales"] ||
  row.amount ||
  row.Amount ||
  row.price ||
  row.Price ||
  0;
const rawOrders =
  row.orders ||
  row.Orders ||
  row.order_count ||
  row["Order Count"] ||
  row.transactions ||
  row.Transactions ||
  row.quantity ||
  row.Quantity ||
  row.qty ||
  row.Qty ||
  1;

            return {
              user_id: user.id,
              sale_date: rawDate ? new Date(rawDate).toISOString().slice(0, 10) : null,
              revenue: Number(String(rawRevenue).replace(/[$,]/g, "") || 0),
              orders_count: Number(String(rawOrders).replace(/[,]/g, "") || 0),
              source_name: "Manual Upload",
              upload_id: uploadRow?.id || null,
location_id: selectedUploadLocationId,
            };
          })
          .filter((row) => row.sale_date && row.revenue > 0);
console.log("SALES ROWS TO INSERT:", salesRows);
        if (salesRows.length) {
          const { error: salesError } = await supabase
            .from("sales")
            .insert(salesRows);

          if (salesError) {
       console.error("Sales save failed:", salesError);
alert(`Sales save failed: ${salesError.message}`);
            setMessage("POS file loaded, but sales history failed to save.");
          } else {
            setMessage(
              `POS / Sales file loaded and saved: ${salesRows.length} sales rows stored.`
            );
          }
        }
      }
setPendingUploadSummary({
  fileName: file.name,
  rowCount: safeRows.length,
  uploadType: "pos",
  uploadedAt: Date.now(),
  rows: safeRows,
});
setPendingUploadSummary({
  fileName: file.name,
  rowCount: safeRows.length,
  uploadType: "pos",
  uploadedAt: Date.now(),
  rows: safeRows,
});

setPendingUploadRows(safeRows);
setDbSalesRows(safeRows);
setShowSourcePicker(false);

await loadClientUploads?.();
await loadUploadComparison?.();

setMessage(
  `POS data uploaded successfully: ${safeRows.length} rows processed.`
);

    } else if (activeUploadType === "menu_items") {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    alert("No logged-in user found.");
    setMessage("Please log in before uploading menu items.");
    return;
  }

  const toNumber = (value) => {
    const cleaned = String(value ?? "")
      .replaceAll("$", "")
      .replaceAll("%", "")
      .replaceAll(",", "")
      .trim();

    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  };

  const menuRows = safeRows
    .map((row) => {
      const name =
        row.name ||
        row.Name ||
        row.item_name ||
        row["Item Name"] ||
        row.menu_item ||
        row["Menu Item"] ||
        row["Menu Item Name"] ||
        row["Item"] ||
        row.Item ||
        row.product ||
        row.Product ||
        "";

      const category =
        row.category ||
        row.Category ||
        row.item_category ||
        row["Item Category"] ||
        row["Category Name"] ||
        row.menu_category ||
        row["Menu Category"] ||
        "Uncategorized";

      const price = toNumber(
        row.price ||
          row.Price ||
          row.selling_price ||
          row["Selling Price"] ||
          row.menu_price ||
          row["Menu Price"] ||
          row["Sales Price"] ||
          row["Retail Price"] ||
          row.amount ||
          row.Amount ||
          0
      );

      const cost = toNumber(
        row.cost ||
          row.Cost ||
          row.food_cost ||
          row["Food Cost"] ||
          row.item_cost ||
          row["Item Cost"] ||
          row["Unit Cost"] ||
          row.unit_cost ||
          0
      );

      const quantity_sold = toNumber(
        row.quantity_sold ||
          row["Quantity Sold"] ||
          row.qty_sold ||
          row["Qty Sold"] ||
          row.units_sold ||
          row["Units Sold"] ||
          row.quantity ||
          row.Quantity ||
          row.qty ||
          row.Qty ||
          0
      );

      const revenue =
        price > 0 && quantity_sold > 0 ? price * quantity_sold : 0;

      const margin =
        price > 0 ? ((price - cost) / price) * 100 : 0;

      return {
        user_id: user.id,
        name: String(name || "").trim(),
        category: String(category || "Uncategorized").trim(),
        price,
        cost,
        quantity_sold,
        revenue,
        margin,
        is_active: true,
        status: "active",
      };
    })
    .filter((item) => item.name);

  console.log("MENU SAFE ROWS RAW:", safeRows);
  console.log("MENU ROWS TO IMPORT:", menuRows);

  setMenuItemsData(menuRows);

  setPendingUploadSummary({
    fileName: file.name,
    rowCount: menuRows.length,
    uploadType: "menu_items",
    uploadedAt: Date.now(),
    rows: menuRows,
  });

  if (!menuRows.length) {
    setMessage("Menu file loaded, but no valid menu item names were found.");
    return;
  }

  setMessage(
    `Menu items file loaded: ${menuRows.length} rows ready to import.`
  );
} else if (activeUploadType === "ingredients") {
  const cleanedIngredientRows = safeRows.map((row) => ({
    ...row,

    ingredient_type:
      row.ingredient_type ||
      row["Ingredient Type"] ||
      row.type ||
      row.Type ||
      "core",

    variance_tolerance: Number(
      row.variance_tolerance ||
        row["Variance Tolerance"] ||
        row.tolerance ||
        row.Tolerance ||
        5
    ),
  }));

  setIngredientsData(cleanedIngredientRows);

  setPendingUploadSummary({
    fileName: file.name,
    rowCount: cleanedIngredientRows.length,
    uploadType: "ingredients",
    uploadedAt: Date.now(),
    rows: cleanedIngredientRows,
  });

  setMessage(
    `Ingredients file loaded: ${cleanedIngredientRows.length} rows ready to import.`
  );

} else if (activeUploadType === "labor") {
  const cleanedLaborRows = safeRows.map((row) => ({
    ...row,

    hours:
      Number(
        row.hours ||
          row.Hours ||
          row.total_hours ||
          row["Total Hours"] ||
          0
      ) || 0,

    labor_cost:
      Number(
        row.labor_cost ||
          row.laborCost ||
          row.cost ||
          row.payroll ||
          row["Labor Cost"] ||
          row["Payroll Cost"] ||
          0
      ) || 0,
  }));

  setLaborData(cleanedLaborRows);
localStorage.setItem("serven_labor_rows", JSON.stringify(cleanedLaborRows));
  setPendingUploadSummary({
    fileName: file.name,
    rowCount: cleanedLaborRows.length,
    uploadType: "labor",
    uploadedAt: Date.now(),
    rows: cleanedLaborRows,
  });

  setMessage(
    `Labor file loaded: ${cleanedLaborRows.length} rows ready to import.`
  );

} else if (activeUploadType === "invoices") {
  setPendingUploadSummary({
    fileName: file.name,
    rowCount: safeRows.length,
    uploadType: "invoices",
    uploadedAt: Date.now(),
    rows: safeRows,
  });

  setMessage(`Invoice file loaded: ${safeRows.length} rows ready to import.`);
} else {
  setPendingUploadSummary({
    fileName: file.name,
    rowCount: safeRows.length,
    uploadType: "unknown",
    uploadedAt: Date.now(),
    rows: safeRows,
  });

  setMessage("Upload type was not detected.");
}

e.target.value = "";
} catch (error) {
  console.error("File upload error:", error);
  setMessage("There was an error reading that file.");
  alert(error?.message || "There was an error reading that file.");
}
};
const handleImportMappedSales = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setMessage("You must be logged in");
      return;
    }

    if (!rows?.length) {
      setMessage("No rows to import");
      return;
    }

    if (!mapping?.name || !mapping?.quantity || !mapping?.revenue) {
      setMessage("Please confirm your column mapping first");
      return;
    }

    // 1) Create upload record
    const { data: uploadedFileRow, error: uploadInsertError } = await supabase
      .from("uploads")
      .insert([
        {
          user_id: user.id,
          file_name:
            uploadedFileName ||
            pendingUploadSummary?.fileName ||
            "POS Upload",
          source_name: selectedDataSource || "Manual Upload",
          row_count: Number(rows.length || 0),
          upload_type: "pos",
          status: "completed",
location_id: selectedUploadLocationId,
        },
      ])
      .select()
      .single();

    if (uploadInsertError) {
      console.error("Uploads insert failed:", uploadInsertError);
      setMessage(uploadInsertError?.message || "Upload failed");
      return;
    }

    // 2) Insert sales rows
    const salesRows = rows.map((row) => ({
      user_id: user.id,
      upload_id: uploadedFileRow?.id || null,
      name: row[mapping.name] || "Unknown",
      category: mapping.category
        ? row[mapping.category] || "Uncategorized"
        : "Uncategorized",
      quantity: Number(row[mapping.quantity] || 0),
      revenue: Number(row[mapping.revenue] || 0),
      date: mapping.date ? row[mapping.date] || null : null,
      labor: mapping.labor ? Number(row[mapping.labor] || 0) : 0,
    }));

    const { error: salesInsertError } = await supabase
      .from("sales")
      .insert(salesRows);

    if (salesInsertError) {
      console.error("Sales insert failed:", salesInsertError);
      setMessage("Failed to import sales");
      return;
    }

    setMessage(`Sales imported: ${salesRows.length} rows`);
    setPendingUploadSummary(null);
    setRows([]);

  } catch (error) {
    console.error("Import failed:", error);
    setMessage("Import failed");
  }
};
const handleImportMenuItems = async () => {
  try {
    setMessage("Importing menu items...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setMessage("You must be logged in to import menu items.");
      return;
    }

    const rawRowsToImport = pendingUploadSummary?.rows?.length
      ? pendingUploadSummary.rows
      : menuItemsData || [];

    const rowsToImport = rawRowsToImport.filter((row) => {
      const name = Array.isArray(row)
        ? row[0]
        : row.name ||
          row.Name ||
          row.item_name ||
          row["Item Name"] ||
          row.menu_item ||
          row["Menu Item"];

      const cleanName = String(name || "").trim().toLowerCase();
      return cleanName && cleanName !== "name" && cleanName !== "item name";
    });

    if (!rowsToImport.length) {
      setMessage("No menu items data found to import.");
      return;
    }

    const getValue = (row, keys, fallback = "") => {
      for (const key of keys) {
        if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") {
          return row[key];
        }
      }
      return fallback;
    };

    const toNumber = (value) => {
      const cleaned = String(value ?? "")
        .replaceAll("$", "")
        .replaceAll("%", "")
        .replaceAll(",", "")
        .trim();

      const num = Number(cleaned);
      return Number.isFinite(num) ? num : 0;
    };

    const now = new Date().toISOString();

    const cleanedRows = rowsToImport
      .map((row) => {
        const isArrayRow = Array.isArray(row);

        const name = String(
          isArrayRow
            ? row[0]
            : getValue(row, [
                "name",
                "Name",
                "item_name",
                "Item Name",
                "menu_item",
                "Menu Item",
                "item",
                "Item",
                "product",
                "Product",
              ])
        ).trim();

        if (!name || name.toLowerCase() === "unnamed item") return null;

        const category = String(
          isArrayRow
            ? row[1]
            : getValue(
                row,
                [
                  "category",
                  "Category",
                  "item_category",
                  "Item Category",
                  "menu_category",
                  "Menu Category",
                ],
                "Uncategorized"
              )
        ).trim();

        const price = toNumber(
          isArrayRow
            ? row[2]
            : getValue(row, [
                "price",
                "Price",
                "selling_price",
                "Selling Price",
                "menu_price",
                "Menu Price",
              ])
        );

        const cost = toNumber(
          isArrayRow
            ? row[3]
            : getValue(row, [
                "cost",
                "Cost",
                "food_cost",
                "Food Cost",
                "item_cost",
                "Item Cost",
                "unit_cost",
                "Unit Cost",
              ])
        );

        const quantitySold = toNumber(
          isArrayRow
            ? row[4]
            : getValue(row, [
                "quantity_sold",
                "Quantity Sold",
                "qty_sold",
                "Qty Sold",
                "sold",
                "Sold",
                "quantity",
                "Quantity",
                "units_sold",
                "Units Sold",
              ])
        );

        const uploadedRevenue = toNumber(
          isArrayRow
            ? row[5]
            : getValue(row, [
                "revenue",
                "Revenue",
                "sales",
                "Sales",
                "total_sales",
                "Total Sales",
                "gross_sales",
                "Gross Sales",
              ])
        );

        const revenue = uploadedRevenue > 0 ? uploadedRevenue : price * quantitySold;

        const uploadedMargin = toNumber(
          isArrayRow
            ? row[6]
            : getValue(row, [
                "margin",
                "Margin",
                "margin_percent",
                "Margin %",
                "Margin Percent",
              ])
        );

        const margin =
          uploadedMargin > 0
            ? uploadedMargin
            : price > 0
            ? ((price - cost) / price) * 100
            : 0;

        return {
          user_id: user.id,
          name,
          category: category || "Uncategorized",
          price,
          cost,
          quantity_sold: quantitySold,
          revenue,
          margin,
          is_active: true,
          last_seen_at: now,
          created_at: now,
        };
      })
      .filter(Boolean);

    if (!cleanedRows.length) {
      setMessage("No valid menu items found after cleaning.");
      return;
    }

    const { data: uploadRow, error: uploadError } = await supabase
      .from("uploads")
      .insert([
        {
          user_id: user.id,
          file_name: pendingUploadSummary?.fileName || "Menu Items Upload",
          source_name: "Manual Upload",
          row_count: cleanedRows.length,
          upload_type: "menu_items",
          status: "completed",
          created_at: now,
          location_id: selectedUploadLocationId || null,
        },
      ])
      .select()
      .single();

    if (uploadError) throw uploadError;

    const { data: existingRows, error: existingError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("user_id", user.id);

    if (existingError) throw existingError;

    const uploadedNames = cleanedRows.map((item) =>
      item.name.trim().toLowerCase()
    );

    for (const menuItem of cleanedRows) {
      const existing = (existingRows || []).find(
        (item) =>
          String(item.name || "").trim().toLowerCase() ===
          menuItem.name.trim().toLowerCase()
      );

      if (existing) {
        const { error } = await supabase
          .from("menu_items")
          .update({
            upload_id: uploadRow?.id || null,
            category: menuItem.category,
            price: menuItem.price,
            cost: menuItem.cost,
            quantity_sold: menuItem.quantity_sold,
            revenue: menuItem.revenue,
            margin: menuItem.margin,
            is_active: true,
            last_seen_at: now,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert([
          {
            ...menuItem,
            upload_id: uploadRow?.id || null,
          },
        ]);

        if (error) throw error;
      }
    }
const isFullMenuSync = cleanedRows.length >= 20;
    const menuItemsToDeactivate = isFullMenuSync
  ? (existingRows || []).filter(
      (item) =>
        item.is_active !== false &&
        !uploadedNames.includes(String(item.name || "").trim().toLowerCase())
    )
  : [];
    for (const oldItem of menuItemsToDeactivate) {
      const { error } = await supabase
        .from("menu_items")
        .update({
          is_active: false,
          last_seen_at: now,
        })
        .eq("id", oldItem.id);

      if (error) throw error;
    }

    const newUpload = {
      id: uploadRow?.id || `menu-${Date.now()}`,
      file_name: pendingUploadSummary?.fileName || "Menu Items Upload",
      upload_type: "menu_items",
      row_count: cleanedRows.length,
      status: "completed",
      created_at: now,
      rows: cleanedRows,
    };

    setClientImports((prev) => [newUpload, ...(prev || [])]);
    setRecentUploads((prev) => [newUpload, ...(prev || [])]);

    const { data: refreshedMenuItems, error: refreshError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (refreshError) throw refreshError;

    setMenuItemsData(refreshedMenuItems || []);

    setMessage(
      `Menu items synced: ${cleanedRows.length} active, ${menuItemsToDeactivate.length} marked inactive.`
    );

    setPendingUploadSummary(null);
    setPendingUploadRows([]);
    pendingUploadRowsRef.current = [];
  } catch (error) {
    console.error("Menu items import failed:", error);
    setMessage(`Menu items import failed: ${error?.message || "Unknown error"}`);
    alert(error?.message || "Menu items import failed.");
  }
};
const handleImportIngredients = async () => {
 

  try {
    setMessage("Importing ingredients...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setMessage("You must be logged in to import ingredients.");
      alert("You must be logged in to import ingredients.");
      return;
    }

    const rawRowsToImport = pendingUploadSummary?.rows || [];

    const rowsToImport = rawRowsToImport.filter((row) => {
      if (Array.isArray(row)) {
        const firstCell = String(row[0] || "").trim().toLowerCase();
        return firstCell !== "name";
      }

      const firstValue = String(row.name || "").trim().toLowerCase();
      return firstValue !== "name";
    });

    if (!rowsToImport.length) {
      setMessage("No ingredients data found to import.");
      alert("No ingredients data found to import.");
      return;
    }

    const now = new Date().toISOString();

    const cleanedRows = rowsToImport
  .map((row) => {
    const isArrayRow = Array.isArray(row);

    const name = String(
      isArrayRow
        ? row[0]
        : row.name ||
            row.Name ||
            row.ingredient_name ||
            row["Ingredient Name"] ||
            row.ingredient ||
            row.Ingredient ||
            row.item ||
            row.Item ||
            ""
    ).trim();

    if (!name || name.toLowerCase() === "unnamed ingredient") return null;

    const supplier = String(
      isArrayRow
        ? row[1]
        : row.supplier ||
            row.Supplier ||
            row.vendor ||
            row.Vendor ||
            ""
    ).trim();

    const category = String(
      isArrayRow
        ? row[2]
        : row.category ||
            row.Category ||
            row.type ||
            row.Type ||
            "Uncategorized"
    ).trim();

    const unit = String(
      isArrayRow
        ? row[3]
        : row.unit ||
            row.Unit ||
            row.uom ||
            row.UOM ||
            row["Unit Of Measure"] ||
            row["Unit of Measure"] ||
            ""
    ).trim();

    const quantity = Number(
      String(
        isArrayRow
          ? row[4]
          : row.quantity ||
              row.Quantity ||
              row.qty ||
              row.Qty ||
              row["Quantity On Hand"] ||
              row["Qty On Hand"] ||
              row.stock ||
              row.Stock ||
              0
      ).replace(/[$,]/g, "")
    );

    const costPerUnit = Number(
      String(
        isArrayRow
          ? row[5]
          : row.cost_per_unit ||
              row["Cost Per Unit"] ||
              row["Unit Cost"] ||
              row.unit_cost ||
              row.cost ||
              row.Cost ||
              row.price ||
              row.Price ||
              0
      ).replace(/[$,]/g, "")
    );

    const totalCost = Number(
      String(
        isArrayRow
          ? row[6]
          : row.total_cost ||
              row["Total Cost"] ||
              row.value ||
              row.Value ||
              quantity * costPerUnit
      ).replace(/[$,]/g, "")
    );
return {
  user_id: user.id,
  name,
  supplier,
  category,
  unit,
  quantity: Number.isFinite(quantity) ? quantity : 0,
  cost_per_unit: Number.isFinite(costPerUnit) ? costPerUnit : 0,
  total_cost: Number.isFinite(totalCost) ? totalCost : 0,

  ingredient_type: String(
    isArrayRow
      ? row[7]
      : row.ingredient_type ||
          row["Ingredient Type"] ||
          row.type ||
          row.Type ||
          "core"
  ).trim(),

  variance_tolerance: Number(
    String(
      isArrayRow
        ? row[8]
        : row.variance_tolerance ||
            row["Variance Tolerance"] ||
            row.tolerance ||
            row.Tolerance ||
            5
    ).replace(/[$,]/g, "")
  ),

  is_active: true,
  last_seen_at: now,
  created_at: now,
};
  })
  .filter(Boolean);

    const uploadedNames = cleanedRows.map((i) => i.name.toLowerCase());

    const { data: uploadRow } = await supabase
      .from("uploads")
      .insert([
        {
          user_id: user.id,
          file_name: pendingUploadSummary?.fileName || "Ingredients Upload",
          source_name: "Manual Upload",
          row_count: cleanedRows.length,
          upload_type: "ingredients",
          status: "completed",
location_id: selectedUploadLocationId,
        },
      ])
      .select()
      .single();

    const { data: existingRows } = await supabase
      .from("ingredients")
      .select("*")
      .eq("user_id", user.id);

    for (const ingredient of cleanedRows) {
      const existing = (existingRows || []).find(
        (item) =>
          String(item.name || "").trim().toLowerCase() ===
          ingredient.name.toLowerCase()
      );

     if (existing) {
  const { error: updateError } = await supabase
    .from("ingredients")
    .update({
      upload_id: uploadRow?.id || null,
      supplier: ingredient.supplier,
      category: ingredient.category,
      unit: ingredient.unit,
      quantity: ingredient.quantity,
      cost_per_unit: ingredient.cost_per_unit,
      total_cost: ingredient.total_cost,

      ingredient_type: ingredient.ingredient_type || "core",
      variance_tolerance: Number(
        ingredient.variance_tolerance || 5
      ),

      is_active: true,
      last_seen_at: now,
    })
    .eq("id", existing.id);

  if (updateError) {
    console.error("Ingredient update error:", updateError);
    throw updateError;
  }
} else {
        const { error: insertError } = await supabase.from("ingredients").insert([
          {
            ...ingredient,
            upload_id: uploadRow?.id || null,
          },
        ]);

        if (insertError) {
          console.error("Ingredient insert error:", insertError);
          throw insertError;
        }
      }
    }

    const ingredientsToDeactivate = (existingRows || []).filter(
  (item) =>
    item.is_active !== false &&
    !uploadedNames.includes(
      String(item.name || "").trim().toLowerCase()
    )
);

for (const oldIngredient of ingredientsToDeactivate) {
  const { error: deactivateError } = await supabase
    .from("ingredients")
    .update({
      is_active: false,
      last_seen_at: now,
    })
    .eq("id", oldIngredient.id);

  if (deactivateError) {
    console.error("Ingredient deactivate error:", deactivateError);
    throw deactivateError;
  }
}

    for (const oldIngredient of ingredientsToDeactivate) {
      const { error: deactivateError } = await supabase
        .from("ingredients")
        .update({
          is_active: false,
          last_seen_at: now,
        })
        .eq("id", oldIngredient.id);

      if (deactivateError) {
        console.error("Ingredient deactivate error:", deactivateError);
        throw deactivateError;
      }
    }

    await loadClientUploads?.();
await loadUploadComparison?.();

    setMessage(
      `Ingredients synced: ${cleanedRows.length} active, ${ingredientsToDeactivate.length} marked inactive.`
    );

    alert(
      `Ingredients synced: ${cleanedRows.length} active, ${ingredientsToDeactivate.length} marked inactive.`
    );

    setPendingUploadSummary(null);
    setIngredientsData([]);
    setPendingUploadRows([]);
    pendingUploadRowsRef.current = [];
  } catch (error) {
    console.error("Ingredients import failed:", error);
    setMessage("Ingredients import failed.");
    alert(error?.message || "Ingredients import failed.");
  }
};
const cleanDate = (value) => {
  if (!value || String(value).trim() === "") return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().split("T")[0];
};
const handleImportInvoices = async () => {
  try {
    setMessage("Importing invoice items...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setMessage("You must be logged in.");
      return;
    }

    const rows = (pendingUploadSummary?.rows || []).filter((row) => {
      const vendor = row?.Vendor || row?.vendor;
      const ingredient = row?.["Ingredient Name"] || row?.ingredient_name;
      return vendor || ingredient;
    });

    if (!rows.length) {
      setMessage("No invoice rows found.");
      return;
    }

    const getValue = (row, keys, fallback = "") => {
      for (const key of keys) {
        if (
          row?.[key] !== undefined &&
          row?.[key] !== null &&
          row?.[key] !== ""
        ) {
          return row[key];
        }
      }

      return fallback;
    };

    const toNumber = (value) => {
      const cleaned = String(value || "")
        .replace("$", "")
        .replaceAll(",", "")
        .trim();

      const num = Number(cleaned);

      return Number.isFinite(num) ? num : 0;
    };

    const cleanedRows = rows.map((row) => ({
      user_id: user.id,
      vendor: getValue(row, ["Vendor", "vendor"]),
      invoice_number: getValue(row, ["Invoice Number", "invoice_number"]),
      invoice_date: getValue(row, ["Invoice Date", "invoice_date"]),
      ingredient_name: getValue(row, [
        "Ingredient Name",
        "ingredient_name",
        "item",
        "Item",
      ]),
      category: getValue(row, ["Category", "category"]),
      quantity: toNumber(getValue(row, ["Quantity", "quantity"])),
      unit: getValue(row, ["Unit", "unit"]),
      unit_cost: toNumber(getValue(row, ["Unit Cost", "unit_cost"])),
      total_cost: toNumber(getValue(row, ["Total Cost", "total_cost"])),
      location_id: selectedUploadLocationId,
    }));

    const { data: uploadRow, error: uploadError } = await supabase
      .from("uploads")
      .insert([
        {
          user_id: user.id,
          file_name: pendingUploadSummary?.fileName || "Invoice Upload",
          source_name: "Manual Upload",
          row_count: cleanedRows.length,
          upload_type: "invoices",
          status: "completed",
          archived: false,
          location_id: selectedUploadLocationId,
        },
      ])
      .select()
      .single();

    if (uploadError) {
      console.error("Invoice upload record failed:", uploadError);
      throw uploadError;
    }

    const rowsWithUploadId = cleanedRows.map((row) => ({
      ...row,
      upload_id: uploadRow?.id || null,
    }));

    console.log("CLEANED INVOICE ROWS BEFORE INSERT:", rowsWithUploadId);

    const { error } = await supabase
      .from("invoice_items")
      .insert(rowsWithUploadId);

    console.log("INVOICE INSERT ERROR:", error);

    if (error) {
      console.error("Invoice insert error:", error);
      throw error;
    }

    console.log("INVOICE IMPORT COMPLETE:", rowsWithUploadId);

    setMessage(`Imported ${rowsWithUploadId.length} invoice rows successfully.`);

    alert(`Imported ${rowsWithUploadId.length} invoice rows successfully.`);

    setPendingUploadSummary(null);

    await loadClientImports?.();
  } catch (error) {
    console.error("Invoice import failed:", error);

    setMessage(`Invoice import failed: ${error?.message || "Unknown error"}`);

    alert(error?.message || "Invoice import failed.");
  }
};
const selectedUploadTypeRef = useRef("pos");

const openUploadPicker = (type) => {
  selectedUploadTypeRef.current = type;
  setUploadType(type);

  setTimeout(() => {
    document.getElementById("csvUpload")?.click();
  }, 0);

  setShowDataSourceMenu(false);
};
const runRealProfitEngine = async () => {
  try {
    setRealProfitLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setMessage("You must be logged in to run the AI Profit Engine.");
      return null;
    }

    const res = await fetch("/api/real-profit-engine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        menuItems: uploadComparison?.activeMenuItems || menuItemsData || [],
        ingredients: uploadComparison?.activeIngredients || ingredientsData || [],
        distribution: salesDistributionSignals,
        leaks: profitLeakageChartData,
        uploadChanges: uploadComparison?.changedMenuItems || [],
        aiAlerts: aiGeneratedAlerts,
        autopilotRecommendation,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Real Profit Engine failed:", data);
      setMessage(data?.error || "AI Profit Engine failed.");
      return null;
    }

    if (data?.actions?.length) {
      setRealProfitEngine(data);
      setMessage("AI Profit Engine updated with real uploaded data.");
      return data;
    }

    const fallbackProfitActions = [
      {
        title: "Increase price on high-demand items",
        issue:
          "Revenue data shows demand, but margin opportunities may be underpriced.",
        recommendation:
          "Test a small price increase on your strongest selling items.",
        estimatedMonthlyImpact: 1200,
        type: "pricing",
      },
      {
        title: "Reduce food cost on low-margin items",
        issue:
          "Some menu items may be leaking profit through high ingredient cost.",
        recommendation:
          "Review portion size, supplier cost, or recipe cost on margin-risk items.",
        estimatedMonthlyImpact: 900,
        type: "food_cost",
      },
      {
        title: "Promote higher-margin menu items",
        issue:
          "Sales can be shifted toward items with better profit contribution.",
        recommendation:
          "Run a promotion that pushes high-margin dishes during slower periods.",
        estimatedMonthlyImpact: 1500,
        type: "marketing",
      },
    ];

    const fallbackData = {
      actions: fallbackProfitActions,
    };

    setRealProfitEngine(fallbackData);
    setMessage("AI Profit Engine generated starter profit opportunities.");

    return fallbackData;
  } catch (error) {
    console.error("Real Profit Engine error:", error);
    setMessage("AI Profit Engine failed.");
    return null;
  } finally {
    setRealProfitLoading(false);
  }
};

const finalTopAiActions =
  realProfitEngine?.actions?.length > 0
    ? realProfitEngine.actions.map((action) => ({
        title: action.title,
        description: action.recommendation,
        impact: `+$${Number(action.estimatedMonthlyImpact || 0).toLocaleString()}/mo`,
        source: "real_profit_engine",
      }))
    : topAiActions;
const saveRealAppliedFix = async ({
  actionName,
  actionDescription,
  impactValue,
  source = "real_profit_engine",
  appliedBy = "manual",
}) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    setMessage("You must be logged in to apply fixes.");
    return null;
  }

  const { data, error } = await supabase
    .from("ai_applied_actions")
    .insert([
      {
        user_id: user.id,
        action_name: actionName,
        action_description: actionDescription,
        impact_value: Number(impactValue || 0),
        source,
        applied_by: appliedBy,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Save applied fix failed:", JSON.stringify(error, null, 2));
    setMessage(error.message || "Failed to save applied fix.");
    return null;
  }

  return data;
};
const loadRealAppliedActions = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return;

  const { data, error } = await supabase
    .from("ai_applied_actions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load real applied actions failed:", error);
    return;
  }

  setRealAppliedActions(data || []);
};
useEffect(() => {
  loadRealAppliedActions();
}, []);
const realTotalAiProfit = realAppliedActions.reduce(
  (sum, action) => sum + Number(action.impact_value || 0),
  0
);
const loadUploadComparison = async () => {
  try {
    
    setUploadComparisonLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("*")
      .eq("user_id", user.id)
      .order("last_seen_at", { ascending: false });

    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("*")
      .eq("user_id", user.id)
      .order("last_seen_at", { ascending: false });

    const activeMenuItems = (menuItems || []).filter((i) => i.is_active);
    const inactiveMenuItems = (menuItems || []).filter(
      (i) => i.is_active === false
    );

    const activeIngredients = (ingredients || []).filter((i) => i.is_active);
    const inactiveIngredients = (ingredients || []).filter(
      (i) => i.is_active === false
    );
const changedMenuItems = activeMenuItems
  .map((item) => {
    const priceChange =
      Number(item.price || 0) - Number(item.previous_price || 0);

    const costChange =
      Number(item.cost || 0) - Number(item.previous_cost || 0);

    const marginChange =
      Number(item.margin || 0) - Number(item.previous_margin || 0);

    if (
      Math.abs(priceChange) > 0.01 ||
      Math.abs(costChange) > 0.01 ||
      Math.abs(marginChange) > 0.5
    ) {
      return {
        ...item,
        priceChange,
        costChange,
        marginChange,
      };
    }

    return null;
  })
  .filter(Boolean)
  .slice(0, 5);


setUploadComparison({
  activeMenuItems,
  inactiveMenuItems,
  activeIngredients,
  inactiveIngredients,

  newMenuItems: activeMenuItems.slice(0, 5),
  removedMenuItems: inactiveMenuItems.slice(0, 5),

  changedMenuItems,

  changedIngredients: activeIngredients
    .filter((i) => Number(i.cost_per_unit || 0) > 0)
    .slice(0, 5),
});
  } catch (error) {
    console.error("Upload comparison failed:", error);
  } finally {
    setUploadComparisonLoading(false);
  }
};
useEffect(() => {
  loadUploadComparison();
}, []);
const miniChangeListStyle = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(148,163,184,0.12)",
};
const salesDistributionData = (uploadComparison?.activeMenuItems || [])
  .filter((item) => Number(item.revenue || 0) > 0)
  .slice(0, 6)
  .map((item) => ({
    name: item.name || "Unknown",
    value: Number(item.revenue || 0),
  }));
const salesDistributionInsight = useMemo(() => {
  if (!salesDistributionData?.length) {
    return "Upload menu items with revenue values to generate sales distribution insights.";
  }

  const total = salesDistributionData.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  const sorted = [...salesDistributionData].sort(
    (a, b) => Number(b.value || 0) - Number(a.value || 0)
  );

  const topItem = sorted[0];
  const topTwo = sorted.slice(0, 2);

  const topItemPercent =
    total > 0 ? (Number(topItem?.value || 0) / total) * 100 : 0;

  const topTwoPercent =
    total > 0
      ? (topTwo.reduce((sum, item) => sum + Number(item.value || 0), 0) /
          total) *
        100
      : 0;

  if (topItemPercent >= 45) {
    return `${topItem.name} is driving ${topItemPercent.toFixed(
      1
    )}% of tracked revenue. That is a strong seller, but also a concentration risk.`;
  }

  if (topTwoPercent >= 65) {
    return `Your top 2 items drive ${topTwoPercent.toFixed(
      1
    )}% of tracked revenue. Consider protecting margins on these items first.`;
  }

  return `Sales are spread across multiple items. Focus on improving margins across your top sellers.`;
}, [salesDistributionData]);
const salesDistributionSignals = useMemo(() => {
  const safeSales = salesDistributionData || [];
  const safeLeaks = profitLeakageChartData || [];

const sortedSales = [...(locationSalesData || [])].sort(
  (a, b) =>
    Number(b.value || b.revenue || 0) -
    Number(a.value || a.revenue || 0)
);

const latestSales = sortedSales.slice(0, 30);

const totalRevenue = latestSales.reduce((sum, item) => {
  const revenueValue =
    item.value ??
    item.revenue ??
    item.total ??
    item.amount ??
    item.sales ??
    item.total_sales ??
    item.net_sales ??
    item.gross_sales ??
    item.price ??
    0;

  return sum + Number(revenueValue || 0);
}, 0);

const topItem = sortedSales[0] || null;

const topTwoRevenue = sortedSales
  .slice(0, 2)
  .reduce((sum, item) => sum + Number(item.value || 0), 0);

const topItemPercent =
  totalRevenue > 0 ? (Number(topItem?.value || 0) / totalRevenue) * 100 : 0;

const topTwoPercent =
  totalRevenue > 0 ? (topTwoRevenue / totalRevenue) * 100 : 0;

  const biggestLeak = [...safeLeaks].sort(
    (a, b) => Number(b.loss || 0) - Number(a.loss || 0)
  )[0];

  return {
    totalRevenue,
    topItem,
    topItemPercent,
    topTwoPercent,
    biggestLeak,
    hasConcentrationRisk: topTwoPercent >= 65,
    hasMajorLeak: Number(biggestLeak?.loss || 0) > 0,
  };
}, [salesDistributionData, profitLeakageChartData]);
const aiGeneratedAlerts = useMemo(() => {
  const alerts = [];

  if (salesDistributionSignals?.hasConcentrationRisk) {
    alerts.push({
      type: "warning",
      title: "Revenue Concentration Risk",
      message: `Top 2 items drive ${salesDistributionSignals.topTwoPercent.toFixed(
        1
      )}% of tracked sales. Protect margins on those items first.`,
    });
  }

  const costIncreases = (uploadComparison?.changedMenuItems || []).filter(
    (item) => Number(item.costChange || 0) > 0
  );

  if (costIncreases.length) {
    alerts.push({
      type: "critical",
      title: "Menu Cost Increase Detected",
      message: `${costIncreases.length} menu item cost${
        costIncreases.length === 1 ? "" : "s"
      } increased after the latest upload.`,
    });
  }

 const marginDrops = (uploadComparison?.changedMenuItems || []).filter(
  (item) =>
    Number(item.marginChange || 0) < -0.5 ||
    Number(item.costChange || 0) > 0
);

  if (marginDrops.length) {
    alerts.push({
      type: "critical",
      title: "Margin Drop Detected",
      message: `${marginDrops.length} item${
        marginDrops.length === 1 ? "" : "s"
      } dropped in margin. Review pricing or ingredient costs.`,
    });
  }

  if (salesDistributionSignals?.hasMajorLeak) {
    alerts.push({
      type: "warning",
      title: "Profit Leakage Detected",
      message: `${salesDistributionSignals.biggestLeak?.name || "An item"} may be leaking about $${Number(
        salesDistributionSignals.biggestLeak?.loss || 0
      ).toLocaleString()} in profit opportunity.`,
    });
  }

  if ((uploadComparison?.inactiveMenuItems || []).length) {
    alerts.push({
      type: "info",
      title: "Removed Menu Items Detected",
      message: `${uploadComparison.inactiveMenuItems.length} menu item${
        uploadComparison.inactiveMenuItems.length === 1 ? "" : "s"
      } no longer appear in the latest upload.`,
    });
  }

  return alerts.slice(0, 5);
}, [salesDistributionSignals, uploadComparison, profitLeakageChartData]);
const [hiddenAiAlerts, setHiddenAiAlerts] = useState([]);
const [selectedAiAlert, setSelectedAiAlert] = useState(null);
const [resolvedAiAlerts, setResolvedAiAlerts] = useState([]);

const getAlertKey = (alert) =>
  `${alert?.type || "alert"}-${alert?.title || ""}`;

const filteredAiAlerts = (aiGeneratedAlerts || []).filter((alert) => {
  return !(hiddenAiAlerts || []).includes(getAlertKey(alert));
});

const handleViewAlertFix = (alert) => {
  setSelectedAiAlert(alert);
  setActiveAiCommandTab("autopilot");
};

const handleResolveAlert = (alert) => {
  const alertKey = getAlertKey(alert);

  setResolvedAiAlerts((prev) =>
    prev.includes(alertKey) ? prev : [...prev, alertKey]
  );

  setHiddenAiAlerts((prev) =>
    prev.includes(alertKey) ? prev : [...prev, alertKey]
  );
};

const handleIgnoreAlert = (alert) => {
  const alertKey = getAlertKey(alert);

  setHiddenAiAlerts((prev) =>
    prev.includes(alertKey) ? prev : [...prev, alertKey]
  );
};

const autopilotRecommendation = useMemo(() => {
  const selectedAlert = selectedAiAlert;

  if (selectedAlert) {
    let action = "Review this alert and apply the highest-impact fix.";

    if (selectedAlert.title?.includes("Cost")) {
      action = "Review pricing on affected items and protect margins.";
    } else if (selectedAlert.title?.includes("Margin")) {
      action = "Audit pricing, recipe cost, and portion size.";
    } else if (selectedAlert.title?.includes("Revenue")) {
      action = "Protect top sellers and promote secondary items to balance revenue.";
    } else if (selectedAlert.title?.includes("Profit")) {
      action = "Prioritize the biggest leaking item and apply the recommended fix.";
    }

    return { alert: selectedAlert, action };
  }

  const alerts = filteredAiAlerts || [];
  const changedItems = uploadComparison?.changedMenuItems || [];

  const costIncreases = changedItems.filter(
    (item) => Number(item.costChange || 0) > 0
  );

  const marginDrops = changedItems.filter(
    (item) => Number(item.marginChange || 0) < 0
  );

  if (alerts.length) {
    const fallbackAlert =
      alerts.find((a) => a.type === "critical") ||
      alerts.find((a) => a.type === "warning") ||
      alerts[0];

    let action = "Review this alert and apply the highest-impact fix.";

    if (fallbackAlert.title?.includes("Cost")) {
      action = "Review pricing on affected items and protect margins.";
    } else if (fallbackAlert.title?.includes("Margin")) {
      action = "Audit pricing, recipe cost, and portion size.";
    } else if (fallbackAlert.title?.includes("Revenue")) {
      action = "Protect top sellers and promote secondary items to balance revenue.";
    } else if (fallbackAlert.title?.includes("Profit")) {
      action = "Prioritize the biggest leaking item and apply the recommended fix.";
    }

    return { alert: fallbackAlert, action };
  }

  if (costIncreases.length) {
    return {
      alert: {
        title: "Cost Increase Detected",
        message: `${costIncreases.length} item${
          costIncreases.length === 1 ? "" : "s"
        } increased in cost.`,
      },
      action: "Review pricing on affected items and protect margins.",
    };
  }

  if (marginDrops.length) {
    return {
      alert: {
        title: "Margin Drop Detected",
        message: `${marginDrops.length} item${
          marginDrops.length === 1 ? "" : "s"
        } dropped in margin.`,
      },
      action: "Audit pricing, recipe cost, and portion size.",
    };
  }

  return null;
}, [selectedAiAlert, filteredAiAlerts, uploadComparison]);

const handleApplyAiFix = async () => {
  if (!autopilotRecommendation?.alert) return;

  const impact = 1200;

  setSimulatedProfit((prev) => Number(prev || 0) + impact);
  handleResolveAlert(autopilotRecommendation.alert);

  setMessage(`Applied fix: +$${impact.toLocaleString()}/month improvement`);
};
const weeklyDashboardContext = useMemo(() => {
  const now = new Date();

  const dayIndex = now.getDay(); // Sunday = 0
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayIndex);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const daysPassed = dayIndex + 1;
  const daysLeft = Math.max(7 - daysPassed, 0);

  const currentWeekRevenue = Number(revenueTrend?.currentWeekRevenue || 0);
  const lastWeekRevenue = Number(revenueTrend?.lastWeekRevenue || 0);

  const avgDailyRevenue =
    daysPassed > 0 ? currentWeekRevenue / daysPassed : 0;

  const projectedRestOfWeekRevenue = avgDailyRevenue * daysLeft;
  const projectedFullWeekRevenue =
    currentWeekRevenue + projectedRestOfWeekRevenue;

  const weeklyChangePercent =
    lastWeekRevenue > 0
      ? ((projectedFullWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
      : 0;

  return {
    todayLabel: now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    }),
    weekRange: `${startOfWeek.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })} - ${endOfWeek.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`,
    daysPassed,
    daysLeft,
    currentWeekRevenue,
    lastWeekRevenue,
    avgDailyRevenue,
    projectedRestOfWeekRevenue,
    projectedFullWeekRevenue,
    weeklyChangePercent,
  };
}, [revenueTrend]);
const weeklyContext = useMemo(() => {
  const now = new Date();

  const dayIndex = now.getDay(); // Sunday = 0
  const daysPassed = dayIndex + 1;
  const daysLeft = Math.max(7 - daysPassed, 0);

  const currentWeekRevenue = Number(revenueTrend?.currentWeekRevenue || 0);
  const lastWeekRevenue = Number(revenueTrend?.lastWeekRevenue || 0);

  const avgDaily = daysPassed > 0 ? currentWeekRevenue / daysPassed : 0;
  const projectedRest = avgDaily * daysLeft;
  const projectedTotal = currentWeekRevenue + projectedRest;

  const weeklyChange =
    lastWeekRevenue > 0
      ? ((projectedTotal - lastWeekRevenue) / lastWeekRevenue) * 100
      : 0;

  return {
    daysPassed,
    daysLeft,
    avgDaily,
    projectedTotal,
    weeklyChange,
  };
}, [revenueTrend]);
const [recipeUsageRules, setRecipeUsageRules] = useState([]);
const ingredientUsageFromSales = useMemo(() => {
  const safeMenuMixData = Array.isArray(menuMixData) ? menuMixData : [];
  const safeRecipeUsageRules = Array.isArray(recipeUsageRules)
    ? recipeUsageRules
    : [];

  if (!safeMenuMixData.length || !safeRecipeUsageRules.length) return {};

  const usageMap = {};

  safeMenuMixData.forEach((item) => {
    const itemName = item?.name;
    const quantitySold = Number(item?.value || 0);

    if (!itemName || quantitySold <= 0) return;

    const matchingRules = safeRecipeUsageRules.filter(
      (rule) => rule?.menuItem === itemName
    );

    matchingRules.forEach((rule) => {
      const amountUsed = Number(rule?.amountUsed || 0);
      const ingredient = rule?.ingredient;

      if (!ingredient || amountUsed <= 0) return;

      const totalUsed = quantitySold * amountUsed;

      if (!usageMap[ingredient]) {
        usageMap[ingredient] = 0;
      }

      usageMap[ingredient] += totalUsed;
    });
  });

  return usageMap;
}, [menuMixData, recipeUsageRules]);
const inventoryRestockContext = useMemo(() => {
  const ingredients = (uploadComparison?.activeIngredients || []).map((item) => {
  const used = ingredientUsageFromSales[item.name] || 0;
const quantity = Number(item.quantity || 0) - used;
const salesUsageNote =
  used > 0
    ? `${used.toFixed(1)} ${item.unit || ""} used from recent menu sales`
    : "No recipe-based usage detected yet";
  return {
    ...item,
    quantity,
    usedFromSales: used,
salesUsageNote,
    maxQuantity: Number(item.maxQuantity ?? item.max_quantity ?? quantity * 2),
    parLevel: Number(item.parLevel ?? item.par_level ?? quantity * 0.4),
  };
});

  const items = (locationIngredientsData || []).map((item) => {
    const quantity = Number(item.quantity || 0);
    const avgDailyUsage = Number(item.avg_daily_usage || item.daily_usage || 1);
    const costPerUnit = Number(item.cost_per_unit || 0);

    const daysOnHand =
      avgDailyUsage > 0 ? quantity / avgDailyUsage : quantity > 0 ? 999 : 0;
const runOutDate =
  daysOnHand !== 999
    ? new Date(Date.now() + daysOnHand * 24 * 60 * 60 * 1000)
    : null;
    return {
      ...item,
      quantity,
      avgDailyUsage,
      costPerUnit,
      daysOnHand,
      runOutDate,
      inventoryValue: quantity * costPerUnit,
      status:
  quantity <= Number(item.parLevel || 0)
    ? "critical"
    : daysOnHand <= 2
    ? "critical"
    : daysOnHand <= 5
    ? "warning"
    : "healthy",
    };
  });

  const criticalItems = items.filter((item) => item.status === "critical");
  const warningItems = items.filter((item) => item.status === "warning");

  const totalInventoryValue = items.reduce(
    (sum, item) => sum + Number(item.inventoryValue || 0),
    0
  );

  return {
    items,
    criticalItems,
    warningItems,
    totalInventoryValue,
    lowestStockItems: [...items]
      .sort((a, b) => Number(a.daysOnHand || 0) - Number(b.daysOnHand || 0))
      .slice(0, 5),
  };
}, [uploadComparison, ingredientUsageFromSales]);
const handleAutoRestockFromAlert = async (alert) => {
  try {
    const ingredientName = alert?.ingredientName || "Unknown ingredient";
    const suggestedQuantity = Number(alert?.suggestedQuantity || 0);
    const unit = alert?.unit || "units";

    if (!ingredientName || suggestedQuantity <= 0) {
      setInventoryAutopilotStatus("Restock skipped — missing inventory data");
      return false;
    }

    console.log("AI restocking inventory:", {
      ingredientName,
      suggestedQuantity,
      unit,
      alert,
    });

    // For now this simulates the restock action.
    // Later we can connect this to Supabase so it updates the ingredients table.
    await new Promise((resolve) => setTimeout(resolve, 400));

    return true;
  } catch (error) {
    console.error("Auto restock failed:", error);
    setInventoryAutopilotStatus("Auto restock failed");
    return false;
  }
};
const [restockForm, setRestockForm] = useState({
  ingredientName: "",
  quantityAdded: "",
  costPerUnit: "",
});
const inventoryAlerts = useMemo(() => {
  if (!inventoryRestockContext?.items) return [];

  const alerts = [];

  inventoryRestockContext.items.forEach((item) => {
    if (item.daysOnHand <= 2) {
    alerts.push({
  type: "critical",
  message: `${item.name} will run out in ${item.daysOnHand.toFixed(1)} days`,
  suggestion: `Suggested order: ${Math.ceil(
    Math.max(Number(item.maxQuantity || 0) - Number(item.quantity || 0), 0)
  )} ${item.unit || "units"}`,

  // 👇 ADD THESE
  ingredientName: item.name,
  suggestedQuantity: Math.ceil(
    Math.max(Number(item.maxQuantity || 0) - Number(item.quantity || 0), 0)
  ),
  unit: item.unit || "units",
});
    }

    if (item.usedFromSales > 0 && item.daysOnHand <= 5) {
      alerts.push({
        type: "usage",
        message: `${item.name} usage increased from sales (${item.usedFromSales.toFixed(
          1
        )} used)`,
      });
    }

    if (item.quantity <= item.parLevel) {
      alerts.push({
        type: "low_stock",
        message: `${item.name} is below par level`,
      });
    }
  });

  return alerts.slice(0, 5);
}, [inventoryRestockContext]);
const [outOfStockIngredient, setOutOfStockIngredient] = useState("");
const handleRestockIngredient = async () => {
  if (!restockForm.ingredientName || !restockForm.quantityAdded) return;

  const quantityToAdd = Number(restockForm.quantityAdded || 0);
  const costPerUnit = Number(restockForm.costPerUnit || 0);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user?.id) {
    setMessage("You must be logged in to save restocks");
    return;
  }

  const updatedIngredients = (uploadComparison?.activeIngredients || []).map(
    (item) => {
      if (item.name === restockForm.ingredientName) {
        return {
          ...item,
          quantity: Number(item.quantity || 0) + quantityToAdd,
          cost_per_unit: costPerUnit || item.cost_per_unit || 0,
        };
      }

      return item;
    }
  );

  setUploadComparison((prev) => ({
    ...prev,
    activeIngredients: updatedIngredients,
  }));

  const { error } = await supabase.from("inventory_restock_logs").insert({
    user_id: user.id,
    ingredient_name: restockForm.ingredientName,
    quantity_added: quantityToAdd,
    cost_per_unit: costPerUnit,
    restock_type: "partial",
  });

  if (error) {
    console.error("Restock log save failed:", error);
    setMessage("Restock updated, but log failed to save");
    return;
  }

  setRestockForm({
    ingredientName: "",
    quantityAdded: "",
    costPerUnit: "",
  });

  setMessage("Ingredient restocked and saved");
};
const handleMarkIngredientOut = async () => {
  if (!outOfStockIngredient) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user?.id) {
    setMessage("You must be logged in to save inventory changes");
    return;
  }

  const updatedIngredients = (uploadComparison?.activeIngredients || []).map(
    (item) => {
      if (
        item.name?.toLowerCase().trim() ===
        outOfStockIngredient.toLowerCase().trim()
      ) {
        return {
          ...item,
          quantity: 0,
        };
      }

      return item;
    }
  );

  setUploadComparison((prev) => ({
    ...prev,
    activeIngredients: updatedIngredients,
  }));

  const { error } = await supabase.from("inventory_restock_logs").insert({
    user_id: user.id,
    ingredient_name: outOfStockIngredient,
    quantity_added: 0,
    cost_per_unit: 0,
    restock_type: "out_of_stock",
  });

  if (error) {
    console.error("Out of stock log save failed:", error);
    setMessage("Marked out, but log failed to save");
    return;
  }

  setOutOfStockIngredient("");
  setMessage("Ingredient marked out of stock and saved");
};
const [lastInventoryUpdate, setLastInventoryUpdate] = useState(null);

useEffect(() => {
  if (uploadComparison?.activeIngredients?.length) {
    setLastInventoryUpdate(new Date());
  }
}, [uploadComparison]);
const inventoryFreshness = useMemo(() => {
  if (!lastInventoryUpdate) return null;

  const now = new Date();
  const diffMs = now - new Date(lastInventoryUpdate);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}, [lastInventoryUpdate]);
const [sentAlertEmailKeys, setSentAlertEmailKeys] = useState([]);

useEffect(() => {
  const sendCriticalAlertEmail = async () => {
    const criticalAlerts = (aiGeneratedAlerts || []).filter(
      (alert) => alert.type === "critical"
    );

    const unsentAlerts = criticalAlerts.filter((alert) => {
      const key = `${alert.type}-${alert.title}`;
      return !sentAlertEmailKeys.includes(key);
    });

    if (!unsentAlerts.length) return;

    try {
    const res = await fetch("/api/send-alert-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    clientName:
  user?.email ||
  "Restaurant Client",

    alerts: unsentAlerts, // ✅ REQUIRED

    dashboardUrl:
      typeof window !== "undefined" ? window.location.href : "",

    ownerEmail: undefined, // optional (can remove later)
  }),
});
      const data = await res.json();

      if (!res.ok) {
        console.error("Alert email failed:", data);
        return;
      }

      setSentAlertEmailKeys((prev) => [
        ...prev,
        ...unsentAlerts.map((alert) => `${alert.type}-${alert.title}`),
      ]);
    } catch (error) {
      console.error("Alert email trigger failed:", error);
    }
  };

  sendCriticalAlertEmail();
}, [aiGeneratedAlerts, sentAlertEmailKeys]);
const laborIntelligence = useMemo(() => {
  const revenue = Number(dashboardRevenue || totalRevenue || 0);

  // SAFE fallback (no errors even if nothing exists)
  const laborCostValue = Number(
    typeof laborCost !== "undefined" ? laborCost : 0
  );

  const laborPercent = revenue > 0 ? (laborCostValue / revenue) * 100 : 0;

  const status =
    laborPercent === 0
      ? "missing"
      : laborPercent < 20
      ? "understaffed"
      : laborPercent > 32
      ? "overstaffed"
      : "healthy";

  const statusLabel =
    status === "missing"
      ? "No labor data"
      : status === "understaffed"
      ? "Potential understaffing"
      : status === "overstaffed"
      ? "Labor cost risk"
      : "Healthy labor range";

  const insight =
    status === "missing"
      ? "Upload labor data or enter weekly labor cost to activate labor intelligence."
      : status === "understaffed"
      ? "Labor is low compared to revenue. Watch service quality."
      : status === "overstaffed"
      ? "Labor is high compared to revenue. Review scheduling."
      : "Labor cost is within a healthy range.";

  return {
    laborCost: laborCostValue,
    laborPercent,
    status,
    statusLabel,
    insight,
  };
}, [dashboardRevenue, totalRevenue]);

const loadSalesFromDatabase = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", user.id)
      .order("sale_date", { ascending: true });

    if (error) {
      console.error("Sales error:", error);
      return;
    }

    setDbSalesRows(data || []);
  } catch (error) {
    console.error("Load sales error:", error);
  }
};
useEffect(() => {
  loadSalesFromDatabase();
}, []);
const realSalesMetrics = useMemo(() => {
  const rows = dbSalesRows || [];

  const totalRevenueFromDb = rows.reduce(
    (sum, row) => sum + Number(row.revenue || 0),
    0
  );

  const totalOrdersFromDb = rows.reduce(
    (sum, row) => sum + Number(row.orders_count || 0),
    0
  );

  const averageOrderValueFromDb =
    totalOrdersFromDb > 0 ? totalRevenueFromDb / totalOrdersFromDb : 0;

  return {
    totalRevenueFromDb,
    totalOrdersFromDb,
    averageOrderValueFromDb,
    hasDbSales: rows.length > 0,
  };
}, [dbSalesRows]);
useEffect(() => {
  if (!autopilotEnabled) return;

  const interval = setInterval(() => {
    runRealProfitEngine();
  }, 15000); // every 15 seconds

  return () => clearInterval(interval);
}, [autopilotEnabled]);
useEffect(() => {
  let start = Number(displayProfit || 0);
  const end = Number(simulatedProfit || 0);

  if (start === end) return;

  const step = (end - start) / 12;

  const interval = setInterval(() => {
    start += step;

    if (Math.abs(start - end) < 1) {
      setDisplayProfit(end);
      clearInterval(interval);
      return;
    }

    setDisplayProfit(start);
  }, 30);

  return () => clearInterval(interval);
}, [simulatedProfit]);
const fallbackAIActions = [
  {
    title: "Raise price on low-margin best seller",
    impact: 1250,
    description: "AI detected strong demand with margin room.",
  },
  {
    title: "Reduce waste on slow-moving inventory",
    impact: 840,
    description: "AI found inventory items at risk of waste.",
  },
  {
    title: "Promote high-margin menu item",
    impact: 980,
    description: "AI recommends pushing a profitable item this week.",
  },
];
const visibleAIActions =
  realProfitEngine?.actions?.length
    ? realProfitEngine.actions
    : topAIActions?.length
    ? topAIActions
    : fixSuggestions?.length
    ? fixSuggestions
    : fallbackAIActions;

const autoApplyTopProfitFix = async () => {
  if (!hasProAccess || !autopilotEnabled) return;

 const actions =
  realProfitEngine?.actions?.length
    ? realProfitEngine.actions
    : topAIActions?.length
    ? topAIActions
    : fixSuggestions?.length
    ? fixSuggestions
    : fallbackAIActions;
  if (!actions.length) return;
console.log("AUTOPILOT ACTIONS:", actions);
  const topAction = actions[0];
  const actionTitle = topAction.title || "Autopilot Profit Fix";

  // prevent duplicate applying
  if (appliedFixes.includes(actionTitle)) return;

  // simulate applying fix
  setAppliedFixes((prev) => [...prev, actionTitle]);
setAiRecoveredProfit((prev) => prev + Number(topAction.impact || topAction.monthlyImpact || 0));
  // 🔥 THIS IS YOUR NEW PART (activity tracking)
  setAutopilotActivity((prev) => [
    {
      title: actionTitle,
      impact: topAction.impact || topAction.monthlyImpact || 0,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    ...prev,
  ].slice(0, 5));
};

useEffect(() => {
  const interval = setInterval(() => {
    setDisplayProfit((prev) => {
      if (prev >= aiRecoveredProfit) return prev;

      const diff = aiRecoveredProfit - prev;
      const step = Math.max(diff * 0.2, 1); // smooth growth

      return Math.min(prev + step, aiRecoveredProfit);
    });
  }, 50);

  return () => clearInterval(interval);
}, [aiRecoveredProfit]);
const safeSales =
  Array.isArray(dbSalesRows) && dbSalesRows.length
    ? dbSalesRows
    : Array.isArray(realSalesMetrics?.salesRows) && realSalesMetrics.salesRows.length
    ? realSalesMetrics.salesRows
    : Array.isArray(realSalesMetrics?.salesData) && realSalesMetrics.salesData.length
    ? realSalesMetrics.salesData
    : [];
const projectedRevenue =
  Number(totalRevenue || 0) + Number(aiRecoveredProfit || 0);
const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(148,163,184,0.25)",
  background: "rgba(15, 23, 42, 0.85)",
  color: "white",
  fontSize: "14px",
  outline: "none",
};
const primaryButtonStyle = {
  padding: "12px 16px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  color: "white",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(124,58,237,0.25)",
};
const markLeadClosed = async (id) => {
  try {
    await fetch("/api/update-lead-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status: "closed" }),
    });

    setLeads((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: "closed" } : l
      )
    );
  } catch (err) {
    console.error("Failed to update lead:", err);
  }
};
const loadingPage = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#020617", // dark background to match dashboard
};

const loadingCard = {
  padding: "40px",
  borderRadius: "20px",
  background: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(148,163,184,0.15)",
  textAlign: "center",
  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
};

const loadingEyebrow = {
  fontSize: "12px",
  letterSpacing: "1px",
  color: "#a855f7",
  fontWeight: "800",
  marginBottom: "10px",
};

const loadingTitle = {
  fontSize: "24px",
  color: "white",
  fontWeight: "800",
};

const loadingText = {
  marginTop: "10px",
  fontSize: "14px",
  color: "#94a3b8",
};
const getProfitDrivenCampaign = () => {
  const foodCost = Number(foodCostPercentage || 0);
  const margin = Number(avgMargin || 0);
  const wasteLoss = Number(totalWasteLoss || 0);

  if (foodCost > 35) {
    return {
      issue: "High food cost detected",
      title: "Promote High-Margin Items This Week",
      sms: "This week only: try one of our chef-picked favorites and save on your next visit.",
      emailBody:
        "We’re featuring select high-margin favorites this week to drive more profitable orders while keeping guests engaged.",
      audience: "Returning Customers",
      reason:
        "Food cost is running high, so Serven recommends shifting demand toward better-margin menu items.",
    };
  }

  if (margin < 60) {
    return {
      issue: "Low margin detected",
      title: "Boost Profitable Menu Items",
      sms: "Limited-time favorite: enjoy one of our most popular picks this week.",
      emailBody:
        "Serven detected margin pressure, so this campaign is designed to push higher-profit items.",
      audience: "All Customers",
      reason:
        "Average margin is below target, so Serven recommends promoting items with stronger profitability.",
    };
  }

  if (wasteLoss > 0) {
    return {
      issue: "Waste risk detected",
      title: "Move Inventory Before It Becomes Waste",
      sms: "Fresh special this week — available while supplies last.",
      emailBody:
        "Serven detected potential waste risk, so this campaign helps move inventory before it becomes lost profit.",
      audience: "Nearby Customers",
      reason:
        "Waste risk was detected, so Serven recommends a timed promotion to turn inventory into revenue.",
    };
  }

  return {
    issue: "Growth opportunity detected",
    title: "Drive More Repeat Visits",
    sms: "Come back this week and enjoy a limited-time offer made just for returning guests.",
    emailBody:
      "Serven recommends a repeat-visit campaign to increase revenue without relying only on new customers.",
    audience: "Returning Customers",
    reason:
      "No major profit leak was detected, so Serven recommends increasing repeat visits.",
  };
};
const marketingInputStyle = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(148,163,184,0.18)",
  background: "rgba(15,23,42,0.75)",
  color: "white",
  outline: "none",
  fontSize: "14px",
  minWidth: 0,
};
const buildProfitDrivenCampaign = () => {
  const margin = Number(avgMargin || 0);
  const wasteLoss = Number(totalWasteLoss || 0);
  const revenueDrop = Number(revenueDropPercent || 0);

  let smartCampaign = {
    name: "Weekend Traffic Booster",
    offer: "Limited-time combo special to bring in more guests this weekend.",
    audience: "All Customers",
    timing: "This Weekend",
    goal: "Increase Traffic",
    channel: "SMS",
    expectedRevenue: "$500 - $1,500",
    cost: "150",
  };

  if (margin < 60) {
    smartCampaign = {
      name: "High-Margin Menu Push",
      offer: "Try one of our most profitable chef-recommended favorites this week.",
      audience: "Returning Customers",
      timing: "This Week",
      goal: "Promote High-Margin Items",
      channel: "Email",
      expectedRevenue: "$750 - $2,000",
      cost: "200",
    };
  }

  if (wasteLoss > 0) {
    smartCampaign = {
      name: "Waste Recovery Special",
      offer: "Limited-time special on select fresh items before inventory turns.",
      audience: "Low Traffic Guests",
      timing: "Next 7 Days",
      goal: "Increase Traffic",
      channel: "SMS",
      expectedRevenue: "$400 - $1,200",
      cost: "125",
    };
  }

  if (unusualDropDetected || revenueDrop > 10) {
    smartCampaign = {
      name: "Traffic Recovery Campaign",
      offer: "Come back this week for a limited-time guest favorite.",
      audience: "Returning Customers",
      timing: "This Week",
      goal: "Increase Repeat Visits",
      channel: "SMS",
      expectedRevenue: "$600 - $1,800",
      cost: "175",
    };
  }

  const updatedForm = {
    ...campaignForm,
    ...smartCampaign,
  };

  setCampaignForm(updatedForm);

  const promotion = {
    title: updatedForm.name,
    text: updatedForm.offer,
  };

  const generated = generateCampaignCopy(
    updatedForm,
    promotion,
    businessType || "restaurant"
  );

  setGeneratedPromotions(generated);
 

  

  

  return smartCampaign;
};


const getCampaignRevenueImpact = (campaign = {}) => {
  const expected = campaign.expectedRevenue || campaign.impact || "";

  if (expected.includes("$")) return expected;

  if (campaign.goal === "Boost AOV") return "$900 - $2,400";
  if (campaign.goal === "Promote High-Margin Items") return "$750 - $2,000";
  if (campaign.goal === "Increase Repeat Visits") return "$600 - $1,800";
  if (campaign.goal === "Increase Traffic") return "$500 - $1,500";

  return "$400 - $1,200";
};
const getCampaignWindowDays = (campaign = {}) => {
  if (campaign.timing === "This Weekend") return 2;
  if (campaign.timing === "Next 30 Days") return 30;
  return 7;
};


const getRealCampaignPerformance = (campaign = {}) => {
 if (!locationSalesData?.length) {
    return {
      revenue: 0,
      orders: 0,
      avgOrderValue: 0,
    };
  }

  const now = new Date();
  const daysBack = getCampaignWindowDays(campaign);

  const campaignStart = campaign.createdAt
    ? new Date(campaign.createdAt)
    : new Date(now);

  if (!campaign.createdAt) {
    campaignStart.setDate(now.getDate() - daysBack);
  }

const campaignSales = locationSalesData.filter((sale) => {
  const saleDate = getSaleDate(sale);
  return saleDate >= campaignStart && saleDate <= now;
});

  const revenue = campaignSales.reduce(
    (sum, sale) => sum + getSaleRevenue(sale),
    0
  );

  const orders = campaignSales.length;
  const avgOrderValue = orders > 0 ? revenue / orders : 0;

  return {
    revenue,
    orders,
    avgOrderValue,
  };
};

const getCampaignLift = (campaign = {}) => {
if (!locationSalesData?.length) {
    return {
      beforeRevenue: 0,
      afterRevenue: 0,
      liftAmount: 0,
      liftPercent: 0,
      beforeOrders: 0,
      afterOrders: 0,
    };
  }

  const now = new Date();
  const daysBack = getCampaignWindowDays(campaign);

  const campaignStart = campaign.createdAt
    ? new Date(campaign.createdAt)
    : new Date(now);

  if (!campaign.createdAt) {
    campaignStart.setDate(now.getDate() - daysBack);
  }

  const baselineStart = new Date(campaignStart);
  baselineStart.setDate(campaignStart.getDate() - daysBack);

const baselineSales = locationSalesData.filter((sale) => {
  const saleDate = getSaleDate(sale);
  return saleDate >= baselineStart && saleDate < campaignStart;
});

const campaignSales = locationSalesData.filter((sale) => {
  const saleDate = getSaleDate(sale);
  return saleDate >= campaignStart && saleDate <= now;
});

  const beforeRevenue = baselineSales.reduce(
    (sum, sale) => sum + getSaleRevenue(sale),
    0
  );

  const afterRevenue = campaignSales.reduce(
    (sum, sale) => sum + getSaleRevenue(sale),
    0
  );

  const beforeOrders = baselineSales.length;
  const afterOrders = campaignSales.length;

  const liftAmount = afterRevenue - beforeRevenue;
  const liftPercent =
    beforeRevenue > 0 ? (liftAmount / beforeRevenue) * 100 : 0;

  return {
    beforeRevenue,
    afterRevenue,
    liftAmount,
    liftPercent,
    beforeOrders,
    afterOrders,
  };
};
const getTopCampaign = () => {
  if (!savedCampaigns?.length) return null;

  let best = null;
  let bestLift = -Infinity;

  savedCampaigns.forEach((campaign) => {
    const lift = getCampaignLift(campaign);

    if (lift.liftAmount > bestLift) {
      bestLift = lift.liftAmount;
      best = campaign;
    }
  });

  return best;
};
useEffect(() => {
  if (!savedCampaigns?.length) return;

  const now = new Date();

  setSavedCampaigns((prev) =>
    prev.map((campaign) => {
      if (campaign.status !== "live") return campaign;

      const createdAt = new Date(campaign.created_at || campaign.createdAt || Date.now());

      let daysToRun = 7;

      if (campaign.timing === "This Weekend") daysToRun = 2;
      if (campaign.timing === "Next 7 Days") daysToRun = 7;
      if (campaign.timing === "Next 30 Days") daysToRun = 30;

      const endDate = new Date(createdAt);
      endDate.setDate(createdAt.getDate() + daysToRun);

      if (now >= endDate) {
        return {
          ...campaign,
          status: "completed",
          completed_at: now.toISOString(),
        };
      }

      return campaign;
    })
  );
}, [savedCampaigns?.length]);
const getAIRecommendations = () => {
  const recs = [];

  if (unusualDropDetected) {
   recs.push({
  title: "Revenue Drop Detected",
  message: "Traffic dropped recently. Launch a recovery campaign to bring customers back.",
  action: "Launch Recovery Campaign",
  type: "danger",
  confidence: "92%",
  impact: "$600 - $1,800",
});
  }

  if (Number(avgMargin || 0) < 60) {
    recs.push({
      title: "Margin Pressure",
      message: "Margins are low. Promote high-margin items to improve profitability.",
      action: "Promote High-Margin Items",
      type: "warning",
    });
  }

  if (Number(totalWasteLoss || 0) > 0) {
    recs.push({
      title: "Waste Risk Detected",
      message: "Inventory waste is increasing. Run a limited-time promo to recover losses.",
      action: "Launch Waste Recovery Campaign",
      type: "warning",
    });
  }

  if (!recs.length) {
    recs.push({
      title: "All Systems Healthy",
      message: "No urgent issues detected. Continue running your current campaigns.",
      action: null,
      type: "good",
    });
  }

  return recs;
};
const getTotalCampaignRevenue = () => {
  if (!savedCampaigns?.length) {
    return {
      totalRevenue: 0,
      totalLift: 0,
      campaignCount: 0,
    };
  }

  const totals = savedCampaigns.reduce(
    (acc, campaign) => {
      const performance = getRealCampaignPerformance(campaign);
      const lift = getCampaignLift(campaign);

      acc.totalRevenue += Number(performance.revenue || 0);
      acc.totalLift += Number(lift.liftAmount || 0);
      acc.campaignCount += 1;

      return acc;
    },
    {
      totalRevenue: 0,
      totalLift: 0,
      campaignCount: 0,
    }
  );

  return totals;
};
const getBeforeAfterData = () => {
  if (!savedCampaigns?.length) {
    return [
      { name: "Before", revenue: 0 },
      { name: "After", revenue: 0 },
    ];
  }

  const topCampaign = getTopCampaign?.() || savedCampaigns[0];
  const lift = getCampaignLift(topCampaign);

  return [
    {
      name: "Before",
      revenue: Number(lift.beforeRevenue || 0),
    },
    {
      name: "After",
      revenue: Number(lift.afterRevenue || 0),
    },
  ];
};
const getCampaignIntelligence = () => {
  if (!savedCampaigns?.length) {
    return {
      title: "No campaign intelligence yet",
      message: "Launch a campaign to let Serven identify what is working.",
      action: "Create your first campaign",
      tone: "neutral",
      campaign: null,
      type: "empty",
    };
  }

  const campaignsWithPerformance = savedCampaigns.map((campaign) => {
    const lift = getCampaignLift(campaign);
    const roi = getCampaignROI(campaign);

    return {
      ...campaign,
      liftAmount: Number(lift.liftAmount || 0),
      liftPercent: Number(lift.liftPercent || 0),
      beforeRevenue: Number(lift.beforeRevenue || 0),
      afterRevenue: Number(lift.afterRevenue || 0),
      roi: Number(roi.roi || 0),
      profitAfterCost: Number(roi.profitAfterCost || 0),
    };
  });

  const bestCampaign = [...campaignsWithPerformance].sort(
    (a, b) => b.profitAfterCost - a.profitAfterCost
  )[0];

  const worstCampaign = [...campaignsWithPerformance].sort(
    (a, b) => a.profitAfterCost - b.profitAfterCost
  )[0];

  if (bestCampaign?.profitAfterCost > 0) {
    return {
      title: "Repeat winning campaign",
      message: `${bestCampaign.name} is your strongest campaign. It generated an estimated $${Number(
        bestCampaign.profitAfterCost || 0
      ).toLocaleString()} in net profit with ${Number(bestCampaign.roi || 0).toFixed(
        1
      )}% ROI. Serven recommends repeating this offer with the same audience.`,
      action: "Repeat this campaign",
      tone: "positive",
      campaign: bestCampaign,
      type: "repeat",
    };
  }

  if (worstCampaign?.profitAfterCost < 0) {
    return {
      title: "Optimize underperforming campaign",
      message: `${worstCampaign.name} is underperforming. Serven recommends adjusting the offer, changing the audience, or pausing it before spending more.`,
      action: "Optimize campaign",
      tone: "warning",
      campaign: worstCampaign,
      type: "optimize",
    };
  }

  return {
    title: "Campaign data is building",
    message:
      "Serven is tracking lift, revenue, orders, and ROI. More sales data will improve recommendations.",
    action: "Keep monitoring",
    tone: "neutral",
    campaign: null,
    type: "monitor",
  };
};
const handleCampaignIntelligenceAction = () => {
  const intelligence = getCampaignIntelligence();

  if (!intelligence?.campaign) {
    setSavedMessage("No campaign action available yet");
    setTimeout(() => setSavedMessage(""), 2000);
    return;
  }

  if (intelligence.type === "repeat") {
    const repeatedCampaign = {
      ...intelligence.campaign,
      id: Date.now() + Math.random(),
      name: `${intelligence.campaign.name} — Repeat`,
      status: "draft",
      source: "ai-intelligence",
      createdAt: new Date().toISOString(),
    };

    setSavedCampaigns((prev) => [repeatedCampaign, ...prev]);
    setCampaignForm(repeatedCampaign);

    pushActivity?.(
      `AI Intelligence recommended repeating ${intelligence.campaign.name}`,
      "intelligence"
    );

    setSavedMessage("Winning campaign copied as draft");
    setTimeout(() => setSavedMessage(""), 2000);
    return;
  }

  if (intelligence.type === "optimize") {
    const optimizedCampaign = {
      ...intelligence.campaign,
      id: Date.now() + Math.random(),
      name: `${intelligence.campaign.name} — Optimized`,
      offer: "Improved offer based on campaign performance data.",
      status: "draft",
      source: "ai-intelligence",
      createdAt: new Date().toISOString(),
    };

    setSavedCampaigns((prev) => [optimizedCampaign, ...prev]);
    setCampaignForm(optimizedCampaign);

    pushActivity?.(
      `AI Intelligence created an optimized version of ${intelligence.campaign.name}`,
      "intelligence"
    );

    setSavedMessage("Optimized campaign created as draft");
    setTimeout(() => setSavedMessage(""), 2000);
  }
};
const getCampaignROI = (campaign = {}) => {
  const lift = getCampaignLift(campaign);
  const liftAmount = Number(lift.liftAmount || 0);

  // Use real campaign cost first
  let estimatedCost = Number(campaign.cost || 0);

  // If no real cost is entered, use smart fallback estimate
  if (!estimatedCost) {
    estimatedCost = 100;

    if (campaign.channel === "SMS") estimatedCost = 75;
    if (campaign.channel === "Email") estimatedCost = 35;
    if (campaign.channel === "Social") estimatedCost = 50;
    if (campaign.channel === "In-Store") estimatedCost = 25;

    if (campaign.goal === "Boost AOV") estimatedCost += 50;
    if (campaign.goal === "Increase Traffic") estimatedCost += 75;
    if (campaign.goal === "Increase Repeat Visits") estimatedCost += 40;
    if (campaign.goal === "Promote High-Margin Items") estimatedCost += 30;
  }

  const roi = estimatedCost > 0 ? (liftAmount / estimatedCost) * 100 : 0;
  const profitAfterCost = liftAmount - estimatedCost;

  return {
    roi,
    estimatedCost,
    profitAfterCost,
  };
};
const autoBuildCampaignFromSignals = () => {
  if (!hasProAccess || !autoCampaignsEnabled) return;

  const margin = Number(avgMargin || 0);
  const wasteLoss = Number(totalWasteLoss || 0);
  const revenueDrop = Number(revenueDropPercent || 0);

  let reason = "";
  let campaign = null;
let aiReasoning = "";
let aiConfidence = 0;
let expectedLift = 0;

if (unusualDropDetected || revenueDrop > 10) {
  reason = "Revenue Drop";

  aiReasoning = `Revenue dropped ${Number(revenueDrop || 0).toFixed(
    1
  )}%, so Serven launched a recovery campaign to bring back customers this week.`;

  aiConfidence = 92;
  expectedLift = 18;

  campaign = {
    name: "🚨 Traffic Recovery Campaign",
    offer: "We miss you — come back this week for a limited-time special.",
    audience: "Returning Customers",
    timing: "This Week",
    goal: "Increase Repeat Visits",
    channel: "SMS",
    expectedRevenue: "$800 - $2,000",
    cost: "175",
  };

} else if (wasteLoss > 0) {
  reason = "Waste Risk";

  aiReasoning = `Waste risk of $${Number(wasteLoss || 0).toLocaleString()} detected, so Serven launched a promotion to recover inventory value before items expire.`;

  aiConfidence = 87;
  expectedLift = 12;

  campaign = {
    name: "♻️ Waste Recovery Promo",
    offer: "Fresh specials available now — limited quantities!",
    audience: "All Customers",
    timing: "Next 7 Days",
    goal: "Increase Traffic",
    channel: "SMS",
    expectedRevenue: "$500 - $1,400",
    cost: "120",
  };

} else if (margin < 60) {
  reason = "Low Margin";

  aiReasoning = `Margins are at ${Number(margin || 0).toFixed(
    1
  )}%, so Serven launched a high-margin push to increase profitability across orders.`;

  aiConfidence = 90;
  expectedLift = 15;

  campaign = {
    name: "💰 High-Margin Push",
    offer: "Try our chef’s most popular dishes this week.",
    audience: "Returning Customers",
    timing: "This Week",
    goal: "Promote High-Margin Items",
    channel: "Email",
    expectedRevenue: "$900 - $2,200",
    cost: "220",
  };
}
if (!campaign) return;
  const updatedForm = {
    ...campaignForm,
    ...campaign,
  };

  setCampaignForm(updatedForm);

  const promotion = {
    title: campaign.name,
    text: campaign.offer,
  };

  const generated = generateCampaignCopy(
    updatedForm,
    promotion,
    businessType || "restaurant"
  );

  setGeneratedPromotions(generated);

const newCampaign = {
  id: Date.now() + Math.random(), // temporary local ID
  ...updatedForm,
  status: "draft", // important change
  source: "autopilot",
  reason,
  createdAt: new Date().toISOString(),
};

setSavedCampaigns((prev) => [newCampaign, ...prev]);

pushActivity(
  `🚀 ${campaign.name} launched • ${reason} detected • Expected ${campaign.expectedRevenue}`,
  "autopilot",
  {
    reason,
    aiReasoning,
    aiConfidence,
    expectedLift,
    campaignName: campaign.name,
    expectedRevenue: campaign.expectedRevenue,
    status: "live",
  }
);

  return campaign;
};
const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(id || "")
  );
};
const saveAutopilotCampaign = async (campaignData, userId) => {
  const payload = {
    user_id: userId,

    campaign_name: campaignData.name,
    promotion_title: campaignData.offer,
    business_type: businessType || "restaurant",

    audience: campaignData.audience || "All Customers",
    timing: campaignData.timing || "This Week",

    expected_revenue: campaignData.expectedRevenue || null,

    active: false,
    published_to_website: false,

    sms_title: campaignData.name,
    sms_body: campaignData.offer,

    email_title: campaignData.name,
    email_body: campaignData.offer,

    social_title: campaignData.name,
    social_body: campaignData.offer,

    in_store_title: campaignData.name,
    in_store_body: campaignData.offer,
  };

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data; // ← contains REAL UUID
};
const autopilotRecoverableRevenue =
  Math.round(
    Number(growthRecoverableProfit || 0) +
    Number(totalWasteLoss || 0)
  ) || 0;

const updateAIRevenue = async (newTotal) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user?.id) return;

    await supabase
      .from("users")
      .update({ ai_revenue_recovered: newTotal })
      .eq("id", user.id);
  } catch (err) {
    console.error("Failed to update AI revenue:", err);
  }
};
const updateCampaignRevenueAutomatically = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user?.id) return;

    const estimatedRevenue = Number(totalRevenue || 0);
    const campaignRevenue = Math.round(estimatedRevenue * 0.08); // 8% attribution estimate

    const { error } = await supabase
      .from("campaigns")
      .update({
        actual_revenue: campaignRevenue,
      })
      .eq("user_id", user.id)
      .eq("active", true)
      .eq("launched_by", "autopilot");

    if (error) throw error;
  } catch (err) {
    console.error("Failed to update campaign revenue:", err);
  }
};
const revenueTrendData =
  revenueChartData?.length > 0
    ? revenueChartData.map((item) => ({
        ...item,
        day: item.day || item.label || item.date || "Day",
        date: item.date || item.sale_date || item.created_at || item.day,
        revenue: Number(item.revenue || 0),
      }))
    : (locationSalesData || []).map((sale, index) => {
        const date = getSaleDate(sale);
        return {
          day: date
            ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : `Sale ${index + 1}`,
          date: date ? date.toISOString().slice(0, 10) : null,
          revenue: getSaleRevenue(sale),
        };
      });
const [revenueRange, setRevenueRange] = useState("All");

const revenueRangeOptions = ["7D", "30D", "90D", "1Y", "All"];

const filteredRevenueTrendData = revenueTrendData.filter((item) => {
  if (revenueRange === "All") return true;

  const daysBack =
    revenueRange === "7D"
      ? 7
      : revenueRange === "30D"
      ? 30
      : revenueRange === "90D"
      ? 90
      : 365;

 const itemDate = item.date ? new Date(item.date) : null;

if (!itemDate || isNaN(itemDate.getTime())) return true;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return itemDate >= cutoffDate;
});
const [intelligenceRevenueRange, setIntelligenceRevenueRange] = useState("All");

const intelligenceRevenueRangeOptions = ["7D", "30D", "90D", "1Y", "All"];

const getIntelligenceDaysBack = (range) => {
  if (range === "7D") return 7;
  if (range === "30D") return 30;
  if (range === "90D") return 90;
  if (range === "1Y") return 365;
  return null;
};

const intelligenceRevenueDataSource =
  revenueTrendData?.length > 0
    ? revenueTrendData
    : revenueChartData?.map((item) => ({
        label: item.day || item.date || "Day",
        date: item.date || item.sale_date || item.created_at || item.day,
        revenue: Number(item.revenue || 0),
      })) || [];

const normalizedIntelligenceRevenueData = intelligenceRevenueDataSource
  .map((item) => {
    const rawDate = item.date || item.sale_date || item.created_at || item.label;
    const parsedDate = new Date(rawDate);

    return {
      ...item,
      label: item.label || item.day || item.date || "Day",
      date: rawDate,
      parsedDate,
      revenue: Number(item.revenue || 0),
    };
  })
  .sort((a, b) => {
    const aTime = a.parsedDate?.getTime?.() || 0;
    const bTime = b.parsedDate?.getTime?.() || 0;
    return aTime - bTime;
  });

const intelligenceDaysBack = getIntelligenceDaysBack(intelligenceRevenueRange);

const intelligenceNow = new Date();

const intelligenceCurrentStart = intelligenceDaysBack
  ? new Date(intelligenceNow)
  : null;

if (intelligenceCurrentStart) {
  intelligenceCurrentStart.setDate(
    intelligenceCurrentStart.getDate() - intelligenceDaysBack
  );
}

const intelligencePreviousStart = intelligenceDaysBack
  ? new Date(intelligenceCurrentStart)
  : null;

if (intelligencePreviousStart) {
  intelligencePreviousStart.setDate(
    intelligencePreviousStart.getDate() - intelligenceDaysBack
  );
}

const currentIntelligenceRevenueData =
  intelligenceRevenueRange === "All"
    ? normalizedIntelligenceRevenueData
    : normalizedIntelligenceRevenueData.filter((item) => {
        if (Number.isNaN(item.parsedDate.getTime())) return true;
        return item.parsedDate >= intelligenceCurrentStart;
      });

const previousIntelligenceRevenueData =
  intelligenceRevenueRange === "All"
    ? []
    : normalizedIntelligenceRevenueData.filter((item) => {
        if (Number.isNaN(item.parsedDate.getTime())) return false;
        return (
          item.parsedDate >= intelligencePreviousStart &&
          item.parsedDate < intelligenceCurrentStart
        );
      });

const intelligenceRevenueChartData = currentIntelligenceRevenueData.map(
  (item, index) => ({
    label: item.label || item.day || item.date || `Point ${index + 1}`,
    revenue: Number(item.revenue || 0),
    previousRevenue:
      previousIntelligenceRevenueData[index]?.revenue !== undefined
        ? Number(previousIntelligenceRevenueData[index]?.revenue || 0)
        : null,
  })
);

const intelligenceCurrentTotal = currentIntelligenceRevenueData.reduce(
  (sum, item) => sum + Number(item.revenue || 0),
  0
);

const intelligencePreviousTotal = previousIntelligenceRevenueData.reduce(
  (sum, item) => sum + Number(item.revenue || 0),
  0
);

const intelligenceComparisonPercent =
  intelligencePreviousTotal > 0
    ? ((intelligenceCurrentTotal - intelligencePreviousTotal) /
        intelligencePreviousTotal) *
      100
    : 0;

const intelligenceComparisonLabel =
  intelligenceRevenueRange === "All"
    ? "All-time view"
    : intelligencePreviousTotal > 0
    ? `${intelligenceComparisonPercent >= 0 ? "+" : ""}${intelligenceComparisonPercent.toFixed(
        1
      )}% vs previous ${intelligenceRevenueRange}`
    : "Not enough previous data";
const activeClientName =
  selectedClient?.client_name || selectedClient?.file_name || null;
const updateLeadStatus = async (leadId, newStatus) => {
  try {
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) {
      console.error("Lead status update error:", error);
      return;
    }

    setLeads((prev) =>
      (prev || []).map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );
  } catch (err) {
    console.error("Lead status failed:", err);
  }
};

const getLeadValue = (lead) => {
  const plan = String(lead?.recommended_plan || "").toLowerCase();

  if (plan.includes("pro")) return 749;
  if (plan.includes("growth")) return 449;
  if (plan.includes("starter")) return 199;

  return 299;
};

const leadPipelineValue = (leads || []).reduce(
  (sum, lead) => sum + getLeadValue(lead),
  0
);

const newLeadCount = (leads || []).filter(
  (lead) => (lead.status || "new") === "new"
).length;

const contactedLeadCount = (leads || []).filter(
  (lead) => lead.status === "contacted"
).length;

const closedLeadCount = (leads || []).filter(
  (lead) => lead.status === "closed"
).length;
const handleFullyRestocked = async () => {
  if (!restockForm?.ingredientName) {
    setMessage("Select an ingredient first");
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user?.id) {
    setMessage("You must be logged in to save restocks");
    return;
  }

  let fullQuantity = 0;

  const updatedIngredients = (uploadComparison?.activeIngredients || []).map(
    (item) => {
      if (item.name === restockForm.ingredientName) {
        fullQuantity = Number(item.maxQuantity ?? item.max_quantity ?? item.quantity ?? 0);

        return {
          ...item,
          quantity: fullQuantity,
        };
      }

      return item;
    }
  );

  setUploadComparison((prev) => ({
    ...prev,
    activeIngredients: updatedIngredients,
  }));

  const { error } = await supabase.from("inventory_restock_logs").insert({
    user_id: user.id,
    ingredient_name: restockForm.ingredientName,
    quantity_added: fullQuantity,
    cost_per_unit: Number(restockForm.costPerUnit || 0),
    restock_type: "full",
  });

  if (error) {
    console.error("Full restock log save failed:", error);
    setMessage("Full restock updated, but log failed to save");
    return;
  }

  setRestockForm({
    ingredientName: "",
    quantityAdded: "",
    costPerUnit: "",
  });

  setMessage("Ingredient fully restocked and saved");
};
const [recipeForm, setRecipeForm] = useState({
  menuItem: "",
  ingredient: "",
  amountUsed: "",
  unit: "oz",
});


const handleSaveRecipeRule = async () => {
  if (!recipeForm.menuItem || !recipeForm.ingredient || !recipeForm.amountUsed) {
    alert("Fill out all fields");
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return;

  const { error } = await supabase
    .from("recipe_usage_rules")
    .insert({
      user_id: user.id,
      menu_item: recipeForm.menuItem,
      ingredient: recipeForm.ingredient,
      amount_used: Number(recipeForm.amountUsed),
      unit: recipeForm.unit,
    });

  if (error) {
    console.error(error);
    return;
  }

  setRecipeForm({
    menuItem: "",
    ingredient: "",
    amountUsed: "",
    unit: "oz",
  });

  console.log("✅ Recipe saved");
};
useEffect(() => {
  const loadRules = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const { data } = await supabase
      .from("recipe_usage_rules")
      .select("*")
      .eq("user_id", user.id);

    if (data) {
      setRecipeUsageRules(
        data.map((r) => ({
          id: r.id,
          menuItem: r.menu_item,
          ingredient: r.ingredient,
          amountUsed: r.amount_used,
          unit: r.unit,
        }))
      );
    }
  };

  loadRules();
}, []);
useEffect(() => {
  const loadRestockLogs = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("inventory_restock_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Restock logs load failed:", error);
      return;
    }

    setRestockLogs(data || []);
  };

  loadRestockLogs();
}, []);
const quickRestockRef = useRef(null);

const loadRestockLogs = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user?.id) return;

  const { data, error } = await supabase
    .from("inventory_restock_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Restock logs load failed:", error);
    return;
  }

  setRestockLogs(data || []);
};
useEffect(() => {
  const sendAutomaticInventoryAlerts = async () => {
    if (!inventoryAlerts?.length) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user?.id) return;

   const criticalAlerts = combinedInventoryAlerts.filter(
  (alert) =>
    alert.type === "critical" &&
    (alert.ingredientName || alert.title)
);

    for (const alert of criticalAlerts) {
      const todayKey = new Date().toISOString().slice(0, 10);

const alertKey = `${user.id}-${alert.ingredientName}-${todayKey}`;

      // Check if already sent
      const { data: existingLog } = await supabase
        .from("inventory_alert_email_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("alert_key", alertKey)
        .maybeSingle();

      if (existingLog) continue;

      // Send email
     const emailRes = await fetch("/api/inventory-alert-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ownerEmail: "antoinemiller@servenai.com",
    restaurantName: selectedClient?.client_name || "Restaurant",
    ingredientName: alert.ingredientName,
    message: alert.message,
    suggestion: alert.suggestion,
  }),
});

if (!emailRes.ok) {
  console.error("Auto inventory alert email failed");
  continue;
}

await supabase.from("inventory_alert_email_logs").insert({
  user_id: user.id,
  ingredient_name: alert.ingredientName,
  alert_key: alertKey,
  message: alert.message,
  suggestion: alert.suggestion,
  restaurant_name: selectedClient?.client_name || "Restaurant",
});

setMessage(`Auto inventory alert sent for ${alert.ingredientName}`);

      // Save log so it doesn't resend after refresh
      await supabase.from("inventory_alert_email_logs").insert({
        user_id: user.id,
        ingredient_name: alert.ingredientName,
        alert_key: alertKey,
        message: alert.message,
        suggestion: alert.suggestion,
        restaurant_name: selectedClient?.client_name || "Restaurant",
      });
    }
  };

  sendAutomaticInventoryAlerts();
}, [inventoryAlerts, selectedClient]);
const getInventoryAlertTone = (type) => {
  if (type === "critical") {
    return {
      bg: "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(15,23,42,0.92))",
      border: "1px solid rgba(239,68,68,0.28)",
      color: "#fca5a5",
      label: "Critical",
      icon: "🔴",
      shadow: "0 18px 45px rgba(239,68,68,0.12)",
    };
  }

  if (type === "usage") {
    return {
      bg: "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(15,23,42,0.92))",
      border: "1px solid rgba(245,158,11,0.26)",
      color: "#fde68a",
      label: "Usage Spike",
      icon: "🟡",
      shadow: "0 18px 45px rgba(245,158,11,0.10)",
    };
  }

  return {
    bg: "linear-gradient(135deg, rgba(148,163,184,0.10), rgba(15,23,42,0.92))",
    border: "1px solid rgba(148,163,184,0.18)",
    color: "#cbd5e1",
    label: "Notice",
    icon: "⚪",
    shadow: "0 18px 45px rgba(15,23,42,0.20)",
  };
};
const inventoryAISummary = useMemo(() => {
  const criticalItems = inventoryAlerts.filter((a) => a.type === "critical");
  const usageItems = inventoryAlerts.filter((a) => a.type === "usage");

  const criticalCount = criticalItems.length;
  const usageCount = usageItems.length;

  const estimatedRisk = criticalCount * 600 + usageCount * 250;
  const potentialRevenueLoss = criticalCount * 900 + usageCount * 350;

  // 🔥 NEW: Build recommendation text
  let recommendation = "";

  if (criticalItems.length > 0) {
    const topItems = criticalItems
      .slice(0, 2)
      .map((a) => a.ingredientName)
      .filter(Boolean);

    if (topItems.length > 0) {
      recommendation = `Restock ${topItems.join(
        " and "
      )} immediately to avoid losses`;
    }
  } else if (usageItems.length > 0) {
    recommendation = "Monitor rising ingredient usage to prevent shortages";
  } else {
    recommendation = "Inventory levels are stable — no immediate action needed";
  }

  return {
    criticalCount,
    usageCount,
    estimatedRisk,
    potentialRevenueLoss,
    recommendation,
    message:
      criticalCount > 0
        ? `${criticalCount} critical inventory issue${criticalCount === 1 ? "" : "s"} detected`
        : "Inventory is currently stable",
  };
}, [inventoryAlerts]);
const getInventorySummaryTone = (criticalCount) => {
  if (criticalCount >= 3) {
    return {
      bg: "linear-gradient(135deg, rgba(239,68,68,0.16), rgba(15,23,42,0.95))",
      border: "1px solid rgba(239,68,68,0.32)",
      labelColor: "#fca5a5",
      tag: "High Risk",
    };
  }

  if (criticalCount > 0) {
    return {
      bg: "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(15,23,42,0.95))",
      border: "1px solid rgba(245,158,11,0.28)",
      labelColor: "#fbbf24",
      tag: "Attention Needed",
    };
  }

  return {
    bg: "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(15,23,42,0.95))",
    border: "1px solid rgba(34,197,94,0.22)",
    labelColor: "#86efac",
    tag: "Healthy",
  };
};
useEffect(() => {
  const runInventoryAutopilot = async () => {
    if (!inventoryAutopilotEnabled) {
      setInventoryAutopilotStatus("Off");
      return;
    }

    if (!inventoryAlerts?.length) {
      setInventoryAutopilotStatus("No issues detected");
      return;
    }

    setInventoryAutopilotStatus("Scanning inventory...");

    const criticalAlerts = combinedInventoryAlerts.filter(
  (alert) =>
    alert.type === "critical" &&
    (
      (
        Number(alert.suggestedQuantity || 0) > 0 &&
        alert.ingredientName
      ) ||
      alert.title
    )
);

    if (!criticalAlerts.length) {
      setInventoryAutopilotStatus("Inventory stable");
      return;
    }

    for (const alert of criticalAlerts.slice(0, 3)) {
 const isRestockAlert =
  alert.ingredientName &&
  Number(alert.suggestedQuantity || 0) > 0 &&
  !alert.shiftName &&
  !alert.title?.toLowerCase?.().includes("waste");

  const fixKey = isRestockAlert
    ? `${alert.ingredientName}-${alert.suggestedQuantity}`
    : `usage-${alert.title}`;

  if (inventoryAutopilotFixed?.[fixKey]) continue;

  setInventoryAutopilotStatus(
    isRestockAlert
      ? `Fixing ${alert.ingredientName}...`
      : `Flagging ${alert.title}...`
  );

  if (isRestockAlert) {
    await handleAutoRestockFromAlert(alert);
  }

  const estimatedImpact = Number(
    alert.estimatedLoss ||
      alert.potentialRevenueLoss ||
      alert.weeklyRisk ||
      Math.max(usageVariance || 0, 0) ||
      0
  );

  setInventoryProfitRecovered((prev) => prev + estimatedImpact);

  setInventoryAutopilotActivity((prev) => [
    {
      id: Date.now() + Math.random(),
      message: isRestockAlert
        ? `AI restocked ${alert.ingredientName} by ${alert.suggestedQuantity} ${
            alert.unit || "units"
          }`
       : alert.shiftName
? `AI flagged shift waste risk: ${alert.shiftName}`
: `AI flagged possible waste: ${alert.title}`,
      impact:
        estimatedImpact > 0
          ? `Protected about $${estimatedImpact.toLocaleString()}`
          : isRestockAlert
          ? "Prevented potential stockout"
          : "Usage anomaly logged",
      createdAt: new Date(),
    },
    ...prev.slice(0, 4),
  ]);

  setInventoryAutopilotFixed((prev) => ({
    ...prev,
    [fixKey]: true,
  }));
}
    setInventoryAutopilotStatus("Inventory Autopilot complete");
  };

  runInventoryAutopilot();
}, [
  inventoryAutopilotEnabled,
  inventoryAlerts,
  inventoryAutopilotFixed,
  handleAutoRestockFromAlert,
]);
useEffect(() => {
  const fetchCustomPlanLeads = async () => {
    if (!isOwner) return;

    try {
      setLoadingCustomPlanLeads(true);

      const { data, error } = await supabase
        .from("custom_plan_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Lead fetch error:", error);
        return;
      }

      setCustomPlanLeads(data || []);
    } catch (err) {
      console.error("Lead fetch failed:", err);
    } finally {
      setLoadingCustomPlanLeads(false);
    }
  };

  fetchCustomPlanLeads();
}, [isOwner]);
const leadMiniBox = {
  padding: "10px",
  borderRadius: "14px",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.12)",
};

const leadMiniLabel = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "800",
  marginBottom: "4px",
};

const leadMiniValue = {
  color: "white",
  fontSize: "14px",
  fontWeight: "950",
};
const getLeadStatusStyle = (status) => {
  switch (status) {
    case "closed":
      return {
        background: "rgba(34,197,94,0.14)",
        border: "1px solid rgba(34,197,94,0.28)",
        color: "#86efac",
      };

    case "lost":
      return {
        background: "rgba(239,68,68,0.14)",
        border: "1px solid rgba(239,68,68,0.28)",
        color: "#fca5a5",
      };

    case "call_booked":
      return {
        background: "rgba(59,130,246,0.14)",
        border: "1px solid rgba(59,130,246,0.28)",
        color: "#93c5fd",
      };

    case "proposal_sent":
      return {
        background: "rgba(168,85,247,0.14)",
        border: "1px solid rgba(168,85,247,0.28)",
        color: "#d8b4fe",
      };

    case "contacted":
      return {
        background: "rgba(250,204,21,0.14)",
        border: "1px solid rgba(250,204,21,0.28)",
        color: "#fde68a",
      };

    default:
      return {
        background: "rgba(148,163,184,0.12)",
        border: "1px solid rgba(148,163,184,0.22)",
        color: "#cbd5e1",
      };
  }
};
const updateLeadStripeLink = async (leadId, stripeLink) => {
  try {
    const { error } = await supabase
      .from("custom_plan_requests")
      .update({ stripe_link: stripeLink })
      .eq("id", leadId);

    if (error) {
      console.error("Stripe link update error:", error);
      alert("Failed to save Stripe link");
      return;
    }

    setCustomPlanLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, stripe_link: stripeLink } : lead
      )
    );
  } catch (err) {
    console.error("Stripe link update failed:", err);
    alert("Failed to save Stripe link");
  }
};
const updateLeadDealField = async (leadId, field, value) => {
  try {
    const { error } = await supabase
      .from("custom_plan_requests")
      .update({ [field]: value })
      .eq("id", leadId);

    if (error) {
      console.error("Deal field update error:", error);
      alert("Failed to update lead");
      return;
    }

    setCustomPlanLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, [field]: value } : lead
      )
    );
  } catch (err) {
    console.error("Deal field update failed:", err);
    alert("Failed to update lead");
  }
};
const dealInputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(148,163,184,0.18)",
  background: "rgba(15,23,42,0.72)",
  color: "white",
  fontSize: "12px",
  outline: "none",
  boxSizing: "border-box",
};
const activateClient = async (lead) => {
  try {
    if (!lead.email) {
      alert("No email found for this lead");
      return;
    }

    const plan = lead.recommended_plan || "starter";

    const { error: userError } = await supabase
      .from("users")
      .update({ plan })
      .eq("email", lead.email);

    if (userError) {
      console.error("User update error:", userError);
      alert("Failed to activate client");
      return;
    }

    // 🔥 ALSO update the lead in DB
    const { error: leadError } = await supabase
      .from("custom_plan_requests")
      .update({
        payment_status: "paid",
        status: "closed",
      })
      .eq("id", lead.id);

    if (leadError) {
      console.error("Lead update error:", leadError);
    }

    // update UI
    setCustomPlanLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, payment_status: "paid", status: "closed" }
          : l
      )
    );

    alert("Client activated ✅");
  } catch (err) {
    console.error(err);
    alert("Activation failed");
  }
};
useEffect(() => {
  const loadUserProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("USER PROFILE LOAD ERROR:", error);
      setUserProfile(null);
      setStatusPlan("");
      return;
    }

    console.log("LOADED USER PROFILE:", data);

    setUserProfile(data || null);
    setStatusPlan(data?.plan || "");
  };

  loadUserProfile();
}, [user?.id]);





/* ================= ACCESS / PLAN GATE ================= */

const ownerEmail = "antoinemiller@servenai.com";
const isDev =
  process.env.NODE_ENV === "development";

const testAccessEmail = isDev
  ? "millerantoine2137@gmail.com"
  : null;

const normalizedEmail = String(user?.email || "")
  .trim()
  .toLowerCase();

const safePlan = String(statusPlan || userProfile?.plan || userPlan || "none")
  .trim()
  .toLowerCase();

const effectivePlan = String(
  isOwner ? devPlan || "pro" : safePlan || "none"
)
  .trim()
  .toLowerCase();
const normalizedPlan = String(effectivePlan || "")
  .trim()
  .toLowerCase();

const normalizedStatus = String(
  userProfile?.customer_status || ""
)
  .trim()
  .toLowerCase();

const hasPaidAccess =
  isOwner ||
  normalizedEmail === ownerEmail ||
  normalizedEmail === testAccessEmail ||
  (
    normalizedStatus === "active" &&
    ["starter", "growth", "pro"].includes(normalizedPlan)
  );

const hasStarterAccess = hasPaidAccess;

const hasGrowthAccess =
  isOwner ||
  (
    normalizedStatus === "active" &&
    ["growth", "pro"].includes(normalizedPlan)
  );

const hasProAccess =
  isOwner ||
  (
    normalizedStatus === "active" &&
    normalizedPlan === "pro"
  );
const sidebarTabs = [
  {
    key: "overview",
    label: "Overview",
    icon: "📊",
    locked: false,
  },
  {
    key: "ai",
    label: "AI Insights",
    icon: "🧠",
    locked: false,
  },
  {
    key: "client_alerts",
    label: "Client Alerts",
    icon: "🚨",
    locked: false,
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: "📊",
    locked: false,
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: "📦",
    locked: false,
  },

  // NEW TABS

  {
    key: "financial",
    label: "Financial Intelligence",
    icon: "💰",
    locked: false,
  },
  {
    key: "labor",
    label: "Labor Intelligence",
    icon: "👥",
    locked: false,
  },
  {
  key: "operations",
  label: "Operations Intelligence",
  icon: "⚙️",
},
  {
    key: "menu",
    label: "Menu Intelligence",
    icon: "🍽️",
    locked: false,
  },
  {
    key: "beverage",
    label: "Beverage Intelligence",
    icon: "🍸",
    locked: false,
  },
  {
    key: "ai_alerts",
    label: "AI Alerts",
    icon: "🚨",
    locked: false,
  },

  {
    key: "growth",
    label: "Growth Tools",
    icon: "📈",
    locked: !hasGrowthAccess,
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: "📣",
    locked: !hasGrowthAccess,
  },
  {
    key: "pro",
    label: "Pro AI",
    icon: "⚡",
    locked: !hasProAccess,
  },
];
const getBestAutopilotLeak = () => {
  const signals = Array.isArray(profitLeakSignals) ? profitLeakSignals : [];

  if (!signals.length) return null;

  return signals
    .map((leak) => ({
      ...leak,
      itemName: leak.item || leak.name || "Low-margin item",
      margin: Number(leak.margin ?? leak.marginPercent ?? 0),
      impact: Number(
        leak.impact ??
          leak.recoverableProfit ??
          leak.monthlyImpact ??
          leak.loss ??
          0
      ),
    }))
    .sort((a, b) => {
      if (b.impact !== a.impact) return b.impact - a.impact;
      return a.margin - b.margin;
    })[0];
};

useEffect(() => {
  if (!hasProAccess || !autoCampaignsEnabled) return;

  const timer = setTimeout(() => {
    autoBuildCampaignFromSignals();
  }, 1500);

  return () => clearTimeout(timer);
}, [
  hasProAccess,
  autoCampaignsEnabled,
  unusualDropDetected,
  totalWasteLoss,
  avgMargin,
  revenueDropPercent,
  autoBuildCampaignFromSignals,
]);

useEffect(() => {
  if (!hasProAccess) return;
  if (!totalRevenue || totalRevenue <= 0) return;

  updateCampaignRevenueAutomatically();
}, [totalRevenue, hasProAccess]);

useEffect(() => {
  if (!hasProAccess) return;
  if (!autoCampaignsEnabled) return;
  if (!profitLeakSignals || profitLeakSignals.length === 0) return;

  const topLeak = getBestAutopilotLeak();

  if (!topLeak) return;

  const itemName = topLeak.itemName;
  const triggerKey = `profit-leak-${itemName}`;

  if (lastAutopilotTrigger === triggerKey) return;

  setLastAutopilotTrigger(triggerKey);

 // handleAutoLaunchCampaignFromRecommendation({
//   item: itemName,
//   suggestion:
//     topLeak?.suggestion || "Promote higher-margin items to recover profit",
// });
}, [
  hasProAccess,
  autoCampaignsEnabled,
  profitLeakSignals,
  lastAutopilotTrigger,
]);

useEffect(() => {
  if (!hasProAccess) return;
  if (!autoCampaignsEnabled) return;

  const shouldRunCampaign =
    unusualDropDetected ||
    Number(avgMargin || 0) < 60 ||
    Number(totalWasteLoss || 0) > 0;

  if (!shouldRunCampaign) return;

  const campaign = buildProfitDrivenCampaign();

  if (!campaign) return;

  setSavedCampaigns((prev) => [
    {
      id: Date.now() + Math.random(),
      ...campaign,
      status: "draft",
      created_at: new Date().toISOString(),
      autoGenerated: true,
    },
    ...(prev || []),
  ]);

  setSavedMessage("Autopilot created a campaign draft");
  pushActivity("Autopilot created campaign draft", "launch");

  const timer = setTimeout(() => setSavedMessage(""), 2500);

  return () => clearTimeout(timer);
}, [
  hasProAccess,
  autoCampaignsEnabled,
  unusualDropDetected,
  avgMargin,
  totalWasteLoss,
]);

console.log("ACCESS DEBUG:", {
  email: normalizedEmail,
  isOwner,
  statusPlan,
  userProfilePlan: userProfile?.plan,
  userPlan,
  safePlan,
  effectivePlan,
  hasPaidAccess,
  hasStarterAccess,
  hasGrowthAccess,
  hasProAccess,
});

console.log("RAW USER PROFILE:", userProfile);

const topSellingItemsData =
  topSellingItems?.length > 0
    ? topSellingItems.slice(0, 6).map((item, index) => ({
        rank: index + 1,
        name: item.name || item.item || `Item ${index + 1}`,
        revenue: Number(item.revenue || item.sales || item.total || 0),
        quantity: Number(item.quantity || item.quantity_sold || item.orders || 0),
      }))
    : [];



const shouldShowLoading =
  loading &&
  !user &&
  !userProfile &&
  !revenueData?.length &&
  !salesData?.length &&
  !clientUploads?.length;

const fetchClientImports = async () => {
  try {
    setImportsLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user?.id) {
      console.log("No user found for imports");
      return;
    }

    const { data, error } = await supabase
      .from("client_data_uploads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("CLIENT IMPORTS LOAD ERROR:", error);
      return;
    }

    console.log("CLIENT IMPORTS:", data);
    setClientImports(data || []);
  } catch (err) {
    console.error("fetchClientImports crashed:", err);
  } finally {
    setImportsLoading(false);
  }
};
useEffect(() => {
  fetchClientImports();
}, []);

const getCampaignROIStats = () => {
  const campaigns = savedCampaigns || [];

  const totalSpend = campaigns.reduce(
    (sum, campaign) => sum + Number(campaign.estimated_cost || 0),
    0
  );

  const totalRevenue = campaigns.reduce((sum, campaign) => {
    const performance = getRealCampaignPerformance(campaign);
    return sum + Number(performance?.revenue || 0);
  }, 0);

  const netProfit = totalRevenue - totalSpend;

  const roiPercent =
    totalSpend > 0 ? ((netProfit / totalSpend) * 100).toFixed(1) : 0;

  return {
    totalSpend,
    totalRevenue,
    netProfit,
    roiPercent,
  };
};

const executiveSummary = useMemo(() => {
  const revenueGrowth = Number(revenueTrend?.growthPercent || 0);
  const bestDay = revenueTracker?.bestDay?.day || "N/A";
  const bestDayRevenue = Number(
    revenueTracker?.bestDay?.revenue || 0
  );

  const foodCost = Number(foodCostPercentage || 0);
  const margin = Number(avgMargin || 0);

  const aiOpportunityValue = topAiActions.reduce((sum, action) => {
    return (
      sum +
      Number(
        String(action.impact || "").replace(/[^0-9]/g, "")
      )
    );
  }, 0);

  let revenueLine = "";

  if (revenueGrowth > 0) {
    revenueLine = `Revenue increased ${revenueGrowth.toFixed(
      1
    )}% compared to last week.`;
  } else if (revenueGrowth < 0) {
    revenueLine = `Revenue declined ${Math.abs(
      revenueGrowth
    ).toFixed(1)}% compared to last week.`;
  } else {
    revenueLine = "Revenue remained stable compared to last week.";
  }

  let foodCostLine =
    foodCost > 35
      ? "Food cost is currently above the recommended target."
      : "Food cost is operating within a healthy range.";

  let marginLine =
    margin < 60
      ? "Average margin performance needs attention."
      : "Margin performance is healthy overall.";

  return {
    headline: "AI Executive Summary",
    summary: `
${revenueLine}

${bestDay} generated the strongest sales performance at $${bestDayRevenue.toLocaleString()}.

${foodCostLine}

${marginLine}

SerVen identified approximately $${aiOpportunityValue.toLocaleString()} in potential recoverable profit opportunities.
    `,
  };
}, [
  revenueTrend,
  revenueTracker,
  foodCostPercentage,
  avgMargin,
  topAiActions,
]);

const benchmarkInsights = useMemo(() => {
  const foodCost = Number(foodCostPercentage || 0);

const laborCost = Number(
  liveLaborIntelligence?.laborPercent ||
    laborCostPercentage ||
    laborIntelligence?.laborPercentage ||
    0
);

  const margin = Number(avgMargin || 0);

const benchmarks = {
  foodCost: 30,
  laborCost: 25,
  margin: 65,
  primeCost: 60,
};

const activeBenchmarks = {
  foodCost: {
    low: 28,
    high: 32,
  },
  laborCost: {
    low: 20,
    high: 30,
  },
  margin: {
    low: 60,
    high: 75,
  },
  primeCost: {
    low: 55,
    high: 60,
  },
};

  return [
    {
      title: "Food Cost",
      current: `${foodCost.toFixed(1)}%`,
      benchmark: `${benchmarks.foodCost}%`,
      status:
        foodCost <= benchmarks.foodCost
          ? "Healthy"
          : "Above Industry Average",
      impact:
        foodCost > benchmarks.foodCost
          ? "Higher food costs may be reducing profitability."
          : "Food cost is operating efficiently.",
    },
    {
      title: "Labor Cost",
      current: `${laborCost.toFixed(1)}%`,
      benchmark: `${benchmarks.laborCost}%`,
      status:
        laborCost <= benchmarks.laborCost
          ? "Healthy"
          : "Higher Than Recommended",
      impact:
        laborCost > benchmarks.laborCost
          ? "Labor efficiency may need optimization."
          : "Labor cost is within target range.",
    },
    {
      title: "Average Margin",
      current: `${margin.toFixed(1)}%`,
      benchmark: `${benchmarks.margin}%`,
      status:
        margin >= benchmarks.margin ? "Strong" : "Below Industry Target",
      impact:
        margin < benchmarks.margin
          ? "Menu pricing or food cost may need adjustment."
          : "Margin performance is strong.",
    },
  ];
}, [
  foodCostPercentage,
  laborCostPercentage,
  laborIntelligence,
  avgMargin,
]);

/* ========================= */
/* 📊 RESTAURANT BENCHMARKS */
/* ========================= */

const restaurantBenchmarks = {
  pizza: {
    foodCost: { low: 24, high: 28 },
    labor: { low: 26, high: 30 },
    margin: { low: 62, high: 72 },
  },

  casual: {
    foodCost: { low: 26, high: 30 },
    labor: { low: 28, high: 32 },
    margin: { low: 58, high: 68 },
  },

  fine_dining: {
    foodCost: { low: 28, high: 34 },
    labor: { low: 30, high: 36 },
    margin: { low: 55, high: 65 },
  },

  cafe: {
    foodCost: { low: 22, high: 27 },
    labor: { low: 24, high: 30 },
    margin: { low: 60, high: 75 },
  },

  default: {
    foodCost: { low: 26, high: 30 },
    labor: { low: 28, high: 32 },
    margin: { low: 58, high: 68 },
  },
};

/* ========================= */
/* 🧠 ACTIVE BENCHMARK SET */
/* ========================= */

const normalizedBusinessType = (
  userProfile?.business_type ||
  businessType ||
  "default"
)
  .toLowerCase()
  .replace(/\s+/g, "_");

const activeBenchmarks =
  restaurantBenchmarks[normalizedBusinessType] ||
  restaurantBenchmarks.default;


if (shouldShowLoading) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, rgba(109,61,245,0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(79,70,229,0.1), transparent 40%), linear-gradient(180deg, #0B0F1A 0%, #111827 100%)",
        padding: "40px",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          padding: "32px",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          textAlign: "center",
          maxWidth: "420px",
          width: "100%",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "0.08em",
            color: "#a5b4fc",
            marginBottom: "10px",
          }}
        >
          AI ANALYZING
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: "800",
            color: "#ffffff",
          }}
        >
          Building your dashboard...
        </h2>

        <p
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "#94a3b8",
          }}
        >
          AI is processing your restaurant data in real time
        </p>
      </div>
    </div>
  );
}

const monthlyRevenueForImpact = Number(
  totalRevenue ||
    realSalesMetrics?.totalRevenueFromDb ||
    dashboardRevenue ||
    0
);

const foodCostOveragePercent = Math.max(
  0,
  Number(foodCostPercentage || 0) - activeBenchmarks.foodCost.high
);

const estimatedFoodCostImpact = Math.round(
  monthlyRevenueForImpact * (foodCostOveragePercent / 100)
);



const laborOveragePercent = Math.max(
  0,
  Number(liveLaborIntelligence?.laborPercent || 0) -
    activeBenchmarks.labor.high
);










/* ========================= */
/* 🍽️ MENU PRICING INTELLIGENCE */
/* ========================= */

const menuPricingOpportunities = (menuItemsData || [])
  .map((item) => {
    const price = Number(item.price || item.menu_price || item.selling_price || 0);
    const cost = Number(item.cost || item.food_cost || item.unit_cost || 0);
    const quantitySold = Number(item.quantity_sold || item.qty_sold || item.sold || 0);

    const marginPercent = price > 0 ? ((price - cost) / price) * 100 : 0;
    const targetMargin = activeBenchmarks.margin.low;

    const marginGap = Math.max(0, targetMargin - marginPercent);
    const estimatedMonthlyImpact = Math.round(
      price * (marginGap / 100) * quantitySold
    );

    return {
      ...item,
      price,
      cost,
      quantitySold,
      marginPercent,
      marginGap,
      estimatedMonthlyImpact,
      name: item.name || item.item_name || item.menu_item || "Menu Item",
    };
  })
  .filter((item) => item.price > 0 && item.cost > 0 && item.marginGap > 0)
  .sort((a, b) => b.estimatedMonthlyImpact - a.estimatedMonthlyImpact);

const topUnderpricedItems = menuPricingOpportunities.slice(0, 3);

const dynamicMenuPricingImpact = topUnderpricedItems.reduce(
  (sum, item) => sum + Number(item.estimatedMonthlyImpact || 0),
  0
);
const estimatedMenuPricingImpact =
  dynamicMenuPricingImpact > 0
    ? dynamicMenuPricingImpact
    : Math.round(monthlyRevenueForImpact * 0.015);
    let recommendedAction = {
  title:
  topUnderpricedItems.length > 0
    ? "Fix underpriced menu items"
    : "Optimize menu pricing",
 text:
  topUnderpricedItems.length > 0
    ? `Top pricing opportunities detected: ${topUnderpricedItems
        .map((item) => item.name)
        .join(", ")}. These items are below target margin and may be reducing profit.`
    : "Several high-volume items may be priced below target margins.",
  impact: estimatedMenuPricingImpact,
  type: "Menu Pricing",
};
const estimatedLaborImpact = Math.round(
  monthlyRevenueForImpact * (laborOveragePercent / 100) * 0.45
);
if (
  estimatedFoodCostImpact >
  estimatedMenuPricingImpact &&
  estimatedFoodCostImpact > estimatedLaborImpact
)
 {
  recommendedAction = {
    title: "Reduce food cost variance",
    text:
      "Food cost percentage is currently running above benchmark range.",
    impact: estimatedFoodCostImpact,
    type: "Food Cost",
  };
}
if (
  estimatedLaborImpact >
  estimatedMenuPricingImpact &&
  estimatedLaborImpact > estimatedFoodCostImpact
) {
  recommendedAction = {
    title: "Optimize labor coverage",
    text:
      "Labor allocation appears above efficient operating range.",
    impact: estimatedLaborImpact,
    type: "Labor",
  };
}

/* ========================= */
/* 🧾 EXPECTED USAGE ENGINE V1 */
/* ========================= */

const normalizeName = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const expectedIngredientUsage = (recipeUsageRules || [])
  .map((rule) => {
    const menuItemName = normalizeName(
      rule.menuItem || rule.menu_item || rule.itemName || rule.item_name
    );

    const matchingMenuItem = (menuItemsData || []).find((item) => {
      const itemName = normalizeName(
        item.name || item.item_name || item.menu_item || item.menuItem
      );

      return itemName === menuItemName;
    });

    const quantitySold = Number(
      matchingMenuItem?.quantity_sold ||
        matchingMenuItem?.qty_sold ||
        matchingMenuItem?.sold ||
        matchingMenuItem?.quantitySold ||
        0
    );

    const amountUsed = Number(
      rule.amountUsed || rule.amount_used || rule.quantity || rule.amount || 0
    );

    const expectedUsage = quantitySold * amountUsed;

    return {
      ingredientName:
        rule.ingredientName ||
        rule.ingredient_name ||
        rule.ingredient ||
        "Ingredient",
      menuItemName:
        rule.menuItem || rule.menu_item || rule.itemName || "Menu Item",
      quantitySold,
      amountUsed,
      unit: rule.unit || "unit",
      expectedUsage,
    };
  })
  .filter((item) => item.expectedUsage > 0);

const ingredientUsageTotals = expectedIngredientUsage.reduce((acc, item) => {
  const key = normalizeName(item.ingredientName);

  if (!acc[key]) {
    acc[key] = {
      ingredientName: item.ingredientName,
      expectedUsage: 0,
      unit: item.unit,
      linkedMenuItems: [],
    };
  }

  acc[key].expectedUsage += Number(item.expectedUsage || 0);
  acc[key].linkedMenuItems.push(item.menuItemName);

  return acc;
}, {});

const expectedUsageSummary = Object.values(ingredientUsageTotals).sort(
  (a, b) => b.expectedUsage - a.expectedUsage
);

const usageVarianceAlerts = expectedUsageSummary.slice(0, 5).map((item) => ({
  ingredientName: item.ingredientName,
  expectedUsage: item.expectedUsage,
  unit: item.unit,
  linkedMenuItems: [...new Set(item.linkedMenuItems)],
  status: item.expectedUsage > 0 ? "Tracking expected usage" : "No usage",
}));
const ingredientUsageAnomalies = expectedUsageSummary
  .filter((item) => Number(item.expectedUsage || 0) > 20)
  .slice(0, 5);
  const shiftWasteSignals = (locationSalesData || [])
  .map((sale) => {
    const saleHour = new Date(
      sale.sale_date || sale.date || sale.created_at || Date.now()
    ).getHours();

    const shift =
      saleHour >= 6 && saleHour < 14
        ? "Morning Shift"
        : saleHour >= 14 && saleHour < 22
        ? "Evening Shift"
        : "Late Night Shift";

    const voids = Number(sale.voids || sale.void_amount || 0);
    const comps = Number(sale.comps || sale.comp_amount || 0);
    const refunds = Number(sale.refunds || sale.refund_amount || 0);
    const revenue = Number(
      sale.revenue || sale.total || sale.sales || sale.amount || 0
    );

    const riskAmount = voids + comps + refunds;
    const riskPercent = revenue > 0 ? (riskAmount / revenue) * 100 : 0;

    return {
      shift,
      revenue,
      riskAmount,
      riskPercent,
      sourceDate: sale.sale_date || sale.date || sale.created_at,
    };
  })
  .filter((item) => item.riskAmount > 0);

const shiftWasteSummary = Object.values(
  shiftWasteSignals.reduce((acc, item) => {
    if (!acc[item.shift]) {
      acc[item.shift] = {
        shift: item.shift,
        revenue: 0,
        riskAmount: 0,
        count: 0,
      };
    }

    acc[item.shift].revenue += item.revenue;
    acc[item.shift].riskAmount += item.riskAmount;
    acc[item.shift].count += 1;

    return acc;
  }, {})
).map((item) => ({
  ...item,
  riskPercent:
    item.revenue > 0 ? (item.riskAmount / item.revenue) * 100 : 0,
}));

const shiftWasteAlerts = shiftWasteSummary
  .filter((item) => item.riskPercent >= 3 || item.riskAmount >= 100)
  .sort((a, b) => b.riskPercent - a.riskPercent)
  .slice(0, 3);
  
const shiftWasteInventoryAlerts = (shiftWasteAlerts || []).map((shift) => ({
  type: "critical",
  title: `${shift.shift} waste risk`,
  message: `Voids/comps/refunds are ${Number(shift.riskPercent || 0).toFixed(
    1
  )}% of revenue during this shift.`,
  shiftName: shift.shift,
  riskAmount: shift.riskAmount,
  riskPercent: shift.riskPercent,
}));


  const shiftWasteRecommendations = shiftWasteAlerts.map((shift) => ({
  shift: shift.shift,
  recommendation:
    shift.riskPercent >= 5
      ? "Review voids, comps, refunds, and manager approvals for this shift."
      : "Monitor this shift for unusual waste or comp patterns.",
  priority: shift.riskPercent >= 5 ? "High" : "Medium",
}));
const expectedUsageItems = (menuItemsData || []).map((item) => {
  const quantitySold = Number(item.quantity_sold || item.qty_sold || 0);
  const recipeCost = Number(item.cost || item.recipe_cost || 0);
  const price = Number(item.price || 0);

  return {
    name: item.name || item.item_name || "Menu Item",
    quantitySold,
    expectedCost: quantitySold * recipeCost,
    revenue: quantitySold * price,
    margin: price > 0 ? ((price - recipeCost) / price) * 100 : 0,
  };
});

const totalExpectedUsageCost = expectedUsageItems.reduce(
  (sum, item) => sum + item.expectedCost,
  0
);

const actualFoodCost = Number(foodCostPercentage || 0);

const usageVariance = actualFoodCost - totalExpectedUsageCost;

const usageVariancePercent =
  totalExpectedUsageCost > 0
    ? (usageVariance / totalExpectedUsageCost) * 100
    : 0;

const wasteRiskLevel =
  usageVariancePercent >= 15
    ? "High"
    : usageVariancePercent >= 7
    ? "Medium"
    : "Low";

const expectedUsageAlerts = [];

if (usageVariancePercent >= 15) {
  expectedUsageAlerts.push({
    type: "critical",
    title: "Possible waste or untracked food loss",
    message: `Actual food cost is ${usageVariancePercent.toFixed(
      1
    )}% higher than expected based on menu sales.`,
  });
} else if (usageVariancePercent >= 7) {
  expectedUsageAlerts.push({
    type: "warning",
    title: "Food usage running above expected",
    message: `Food cost is ${usageVariancePercent.toFixed(
      1
    )}% above expected usage.`,
  });
}
const possibleWasteSignals = [];
const suspiciousMenuItems = expectedUsageItems
  .filter(
    (item) =>
      item.margin < 45 &&
      item.quantitySold > 15
  )
  .sort((a, b) => a.margin - b.margin)
  .slice(0, 5);
  
if (usageVariancePercent >= 15) {
  possibleWasteSignals.push(
    "Possible over-portioning detected"
  );

  possibleWasteSignals.push(
    "Potential untracked food waste"
  );

  possibleWasteSignals.push(
    "Possible employee comps or voided meals"
  );
}

if (usageVariancePercent >= 25) {
  possibleWasteSignals.push(
    "High variance suggests inventory loss or repeated waste patterns"
  );
}
const combinedInventoryAlerts = [
  ...(inventoryAlerts || []),
  ...(expectedUsageAlerts || []),
  ...(shiftWasteInventoryAlerts || []),
];

const miniKpiCard = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.16)",
};

const miniKpiLabel = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: "800",
  marginBottom: "6px",
};

const miniKpiValue = {
  color: "white",
  fontSize: "22px",
  fontWeight: "950",
};
const lossRiskFactors = [
  usageVariancePercent >= 15 ? 30 : usageVariancePercent >= 7 ? 15 : 0,

  suspiciousMenuItems.length >= 5
    ? 20
    : suspiciousMenuItems.length >= 3
    ? 10
    : 0,

  ingredientUsageAnomalies.length >= 5
    ? 20
    : ingredientUsageAnomalies.length >= 3
    ? 10
    : 0,

  shiftWasteAlerts.length >= 3
    ? 20
    : shiftWasteAlerts.length >= 1
    ? 10
    : 0,

  (combinedInventoryAlerts || []).filter((alert) => alert.type === "critical")
  .length >= 5
  ? 10
  : (combinedInventoryAlerts || []).filter((alert) => alert.type === "critical")
      .length >= 2
  ? 5
  : 0,
];

const totalLossRisk = lossRiskFactors.reduce(
  (sum, value) => sum + value,
  0
);

const aiLossPreventionScore = Math.max(
  100 - totalLossRisk,
  5
);

const aiLossPreventionStatus =
  aiLossPreventionScore >= 85
    ? "Excellent"
    : aiLossPreventionScore >= 70
    ? "Moderate Risk"
    : aiLossPreventionScore >= 50
    ? "Elevated Risk"
    : "Critical";


const estimatedWasteRecovery =
  Math.max(usageVariance || 0, 0) * 0.35;

const estimatedShiftRecovery = shiftWasteAlerts.reduce(
  (sum, shift) => sum + Number(shift.riskAmount || 0) * 0.25,
  0
);

const estimatedInventoryRecovery =
  (combinedInventoryAlerts || []).filter(
    (alert) =>
      alert.type === "critical" &&
      alert.ingredientName
  ).length * 75;

const estimatedTotalRecovery =
  estimatedWasteRecovery +
  estimatedShiftRecovery +
  estimatedInventoryRecovery;

const yearlyRecoveryProjection =
  estimatedTotalRecovery * 12;

const aiOperationalSummary =
  aiLossPreventionScore >= 85
    ? "Operations appear stable with low loss exposure. Current inventory, shift behavior, and food usage patterns are healthy."
    : aiLossPreventionScore >= 70
    ? "Moderate operational leakage detected. AI identified several areas where waste, menu inefficiency, or shift behavior may be reducing profit."
    : aiLossPreventionScore >= 50
    ? "Elevated loss risk detected. Waste patterns, inventory variance, and suspicious operational signals are impacting profitability."
    : "Critical operational risk detected. AI identified significant loss exposure across food usage, inventory control, and shift activity.";


const topAIRecommendedAction =
  shiftWasteAlerts.length > 0
    ? `Review ${shiftWasteAlerts[0].shift} voids, comps, and refunds first.`
    : ingredientUsageAnomalies.length > 0
    ? `Audit ${ingredientUsageAnomalies[0].ingredientName} usage against recipes.`
    : suspiciousMenuItems.length > 0
    ? `Review portioning and pricing for ${suspiciousMenuItems[0].name}.`
    : usageVariancePercent >= 7
    ? "Review food cost variance and compare actual prep usage against sales."
    : "No urgent action needed. Continue monitoring usage trends.";

const overallAIConfidence = 92;
  
const aiRiskBreakdown = [
  {
    label: "Food Cost Variance",
    value: Math.min(Math.abs(usageVariancePercent || 0), 100),
  },
  {
    label: "Inventory Exposure",
    value: Math.min(
      (combinedInventoryAlerts?.length || 0) * 18,
      100
    ),
  },
  {
    label: "Shift Waste Risk",
    value: Math.min(
      (shiftWasteAlerts?.length || 0) * 20,
      100
    ),
  },
  {
    label: "Ingredient Anomalies",
    value: Math.min(
      (ingredientUsageAnomalies?.length || 0) * 14,
      100
    ),
  },
];

const aiDetectedLossSources = [
  usageVariancePercent >= 10 && "Food cost variance is above expected usage",
  shiftWasteAlerts.length > 0 &&
    "Shift-level void/refund behavior may be impacting margins",
  suspiciousMenuItems.length > 0 &&
    "Several menu items show weak margin efficiency",
  ingredientUsageAnomalies.length > 0 &&
    "Ingredient usage patterns are inconsistent with sales volume",
  combinedInventoryAlerts.length > 0 &&
    "Inventory exposure may lead to spoilage or stock loss",
].filter(Boolean);

const activeUploadCount = (clientUploads || []).filter((upload) => {
  const status = String(upload.status || "active").toLowerCase();
  return upload.active !== false && status !== "deleted" && status !== "archived";
}).length;

useEffect(() => {
  const loadMenuItems = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (error) {
      console.error("Failed to load menu items:", error);
      return;
    }

    console.log("LOADED MENU ITEMS:", data);
    setMenuItemsData(data || []);
  };

  loadMenuItems();
}, []);
useEffect(() => {
  const loadSavedLaborData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) return;

      const { data, error } = await supabase
        .from("labor_uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Failed to load labor data:", error);
        return;
      }

      if (data?.length) {
        setLaborData(data);

        console.log(
          "Loaded saved labor data:",
          data.length,
          "rows"
        );
      }
    } catch (err) {
      console.error("Labor load error:", err);
    }
  };

  loadSavedLaborData();
}, []);

const BEVERAGE_CATEGORY_KEYWORDS = [
  "beer",
  "wine",
  "liquor",
  "cocktail",
  "vodka",
  "tequila",
  "whiskey",
  "bourbon",
  "rum",
  "gin",
  "margarita",
  "martini",
  "mimosa",
  "bloody mary",
  "draft",
  "ipa",
  "lager",
  "ale",
  "stout",
  "seltzer",
  "champagne",
  "prosecco",
  "rosé",
  "cabernet",
  "pinot",
  "merlot",
  "chardonnay",
  "sauvignon",
  "moscow mule",
  "old fashioned",
  "negroni",
  "spritz",
];

const getMenuItemName = (item) =>
  String(
    item?.name ||
      item?.item_name ||
      item?.menu_item ||
      item?.product_name ||
      item?.description ||
      ""
  ).toLowerCase();

const getMenuItemCategory = (item) =>
  String(
    item?.category ||
      item?.item_category ||
      item?.department ||
      item?.sales_category ||
      ""
  ).toLowerCase();

const isAlcoholItem = (item) => {
  const name = getMenuItemName(item);
  const category = getMenuItemCategory(item);

  const combined = `${name} ${category}`;

  return BEVERAGE_CATEGORY_KEYWORDS.some((word) =>
    combined.includes(word)
  );
};
const alcoholSalesRows = (locationSalesData || []).filter(isAlcoholItem);

const alcoholRevenue = alcoholSalesRows.reduce((sum, item) => {
  return sum + Number(getSaleRevenue(item) || 0);
}, 0);

const totalSalesRevenueForAlcohol =
  (locationSalesData || []).reduce((sum, item) => {
    return sum + Number(getSaleRevenue(item) || 0);
  }, 0) || 0;

const alcoholRevenuePercent =
  totalSalesRevenueForAlcohol > 0
    ? (alcoholRevenue / totalSalesRevenueForAlcohol) * 100
    : 0;

const topAlcoholItem =
  [...alcoholSalesRows].sort(
    (a, b) =>
      Number(getSaleRevenue(b) || 0) -
      Number(getSaleRevenue(a) || 0)
  )[0] || null;

const topAlcoholItemName =
  topAlcoholItem?.name ||
  topAlcoholItem?.item_name ||
  topAlcoholItem?.menu_item ||
  topAlcoholItem?.product_name ||
  "No alcohol item detected";

const alcoholInsight =
  alcoholRevenuePercent >= 40
    ? "Alcohol sales are a major revenue driver for this business. Beverage performance should be a primary optimization focus."
    : alcoholRevenuePercent >= 20
    ? "Alcohol sales are contributing healthy supplemental revenue alongside food sales."
    : alcoholRevenuePercent > 0
    ? "Alcohol sales are present but may have growth opportunities through menu engineering and promotions."
    : "No alcohol sales trends detected yet.";

const alcoholPerformanceLevel =
  alcoholRevenuePercent >= 40
    ? "High Beverage Dependency"
    : alcoholRevenuePercent >= 20
    ? "Balanced Food & Beverage Mix"
    : alcoholRevenuePercent > 0
    ? "Low Beverage Penetration"
    : "No Beverage Data";

const estimatedAlcoholCostPercent =
  alcoholRevenuePercent > 0
    ? alcoholRevenuePercent >= 40
      ? 22
      : alcoholRevenuePercent >= 20
      ? 25
      : 28
    : 0;

const alcoholMarginPercent =
  estimatedAlcoholCostPercent > 0
    ? 100 - estimatedAlcoholCostPercent
    : 0;

const alcoholMarginStatus =
  alcoholMarginPercent >= 75
    ? "Strong Beverage Margin"
    : alcoholMarginPercent >= 65
    ? "Healthy Beverage Margin"
    : alcoholMarginPercent > 0
    ? "Margin Needs Review"
    : "No Beverage Margin Data";

const getBeverageType = (item) => {
  const combined = `${getMenuItemName(item)} ${getMenuItemCategory(item)}`;

  if (
    combined.includes("cocktail") ||
    combined.includes("margarita") ||
    combined.includes("martini") ||
    combined.includes("mimosa") ||
    combined.includes("bloody mary") ||
    combined.includes("moscow mule") ||
    combined.includes("old fashioned") ||
    combined.includes("negroni")
  ) {
    return "Cocktails";
  }

  if (
    combined.includes("beer") ||
    combined.includes("draft") ||
    combined.includes("ipa") ||
    combined.includes("lager") ||
    combined.includes("ale") ||
    combined.includes("stout")
  ) {
    return "Beer";
  }

  if (
    combined.includes("wine") ||
    combined.includes("cabernet") ||
    combined.includes("pinot") ||
    combined.includes("merlot") ||
    combined.includes("chardonnay") ||
    combined.includes("sauvignon") ||
    combined.includes("rosé") ||
    combined.includes("prosecco") ||
    combined.includes("champagne")
  ) {
    return "Wine";
  }

  if (
    combined.includes("liquor") ||
    combined.includes("vodka") ||
    combined.includes("tequila") ||
    combined.includes("whiskey") ||
    combined.includes("bourbon") ||
    combined.includes("rum") ||
    combined.includes("gin")
  ) {
    return "Liquor";
  }

  return "Other Beverage";
};

const beverageCategoryBreakdown = alcoholSalesRows.reduce((acc, item) => {
  const type = getBeverageType(item);
  const revenue = Number(getSaleRevenue(item) || 0);

  acc[type] = (acc[type] || 0) + revenue;

  return acc;
}, {});

const topBeverageCategory =
  Object.entries(beverageCategoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ||
  "No beverage category detected";

const topAlcoholItems = [...alcoholSalesRows]
  .sort(
    (a, b) =>
      Number(getSaleRevenue(b) || 0) -
      Number(getSaleRevenue(a) || 0)
  )
  .slice(0, 5);

const beverageLeaderboard = topAlcoholItems.map((item) => ({
  name:
    item?.name ||
    item?.item_name ||
    item?.menu_item ||
    item?.product_name ||
    "Unknown Item",

  revenue: Number(getSaleRevenue(item) || 0),

  category: getBeverageType(item),
}));
const beverageAIInsight =
  alcoholRevenuePercent >= 40
    ? "Alcohol sales are a major operational driver. Beverage profitability and menu engineering should be prioritized to maximize margin performance."
    : alcoholRevenuePercent >= 20
    ? "Beverage revenue is contributing meaningful supplemental profit alongside food sales."
    : alcoholRevenuePercent > 0
    ? "Alcohol sales are present but may have additional upside through promotions and beverage optimization."
    : "No strong beverage revenue trends detected yet.";

const beverageRiskInsight =
  estimatedAlcoholCostPercent >= 28
    ? "Potential pour cost pressure detected. Beverage pricing or inventory controls may need review."
    : estimatedAlcoholCostPercent >= 24
    ? "Beverage margins appear stable with moderate cost pressure."
    : "Strong beverage margin profile detected.";/* =========================
   PRIME COST INTELLIGENCE
========================= */

const laborCostPercent = Number(laborIntelligence?.laborPercent || 0);

const totalLaborCost = (locationLaborData || []).reduce(
  (sum, row) =>
    sum +
    Number(
      row.labor_cost ||
        row.total_labor ||
        row.cost ||
        row.amount ||
        row.total ||
        0
    ),
  0
);const effectiveFoodCostPercent =
  Number(foodCostPercentage || 0);

const effectiveLaborCostPercent =
  Number(laborCostPercent || 0);

const estimatedCOGS =
  Number(liveTotalRevenue || 0) * (effectiveFoodCostPercent / 100);

const totalCOGS = Number(estimatedCOGS || 0) || 0;

const estimatedLaborCost =
  Number(liveTotalRevenue || 0) * (effectiveLaborCostPercent / 100);

const effectiveLaborCost =
  Number(totalLaborCost || 0) || Number(estimatedLaborCost || 0) || 0;

const livePrimeCost =
  liveTotalRevenue > 0
    ? Number(
        (((totalCOGS + effectiveLaborCost) / liveTotalRevenue) * 100).toFixed(1)
      )
    : 0;

const primeCostStatus =
  livePrimeCost <= 0
    ? "Waiting for data"
    : livePrimeCost <= 55
    ? "Excellent"
    : livePrimeCost <= 60
    ? "Healthy"
    : livePrimeCost <= 65
    ? "Watch Closely"
    : "Critical";

const primeCostColor =
  livePrimeCost <= 0
    ? "#94a3b8"
    : livePrimeCost <= 55
    ? "#86efac"
    : livePrimeCost <= 60
    ? "#22c55e"
    : livePrimeCost <= 65
    ? "#fbbf24"
    : "#f87171";

const primeCostInsight =
  livePrimeCost <= 0
    ? "Upload labor and invoice data to calculate prime cost."
    : livePrimeCost <= 55
    ? "Prime cost is operating in an excellent profitability range."
    : livePrimeCost <= 60
    ? "Prime cost is healthy and within benchmark range."
    : livePrimeCost <= 65
    ? "Prime cost is slightly elevated. Monitor labor and food cost trends."
    : "Critical prime cost pressure detected. Food or labor costs need immediate attention.";

const estimatedRecoverableProfit =
  livePrimeCost > 60 && liveTotalRevenue > 0
    ? Math.round(((livePrimeCost - 60) / 100) * liveTotalRevenue)
    : 0;

    console.log("PRIME COST DEBUG:", {
  laborCostPercent,
  foodCostPercentage,
  totalLaborCost,
  totalCOGS,
  liveTotalRevenue,
  livePrimeCost,
  primeCostStatus,
  estimatedRecoverableProfit,
});

/* =========================
   LABOR EFFICIENCY INTELLIGENCE
========================= */

// TOTAL LABOR HOURS
const totalLaborHours = (locationLaborData || []).reduce(
  (sum, row) =>
    sum +
    Number(
      row.hours ||
      row.total_hours ||
      row.labor_hours ||
      row.hours_worked ||
      0
    ),
  0
);

// SALES PER LABOR HOUR
const salesPerLaborHour =
  totalLaborHours > 0
    ? Number(
        (liveTotalRevenue / totalLaborHours).toFixed(2)
      )
    : 0;

// LABOR EFFICIENCY SCORE
const laborEfficiencyScore =
  salesPerLaborHour >= 150
    ? 100
    : salesPerLaborHour >= 120
    ? 85
    : salesPerLaborHour >= 90
    ? 70
    : salesPerLaborHour >= 60
    ? 55
    : salesPerLaborHour > 0
    ? 40
    : 0;

// LABOR EFFICIENCY STATUS
const laborEfficiencyStatus =
  laborEfficiencyScore >= 90
    ? "Elite"
    : laborEfficiencyScore >= 75
    ? "Strong"
    : laborEfficiencyScore >= 60
    ? "Average"
    : laborEfficiencyScore > 0
    ? "Needs Attention"
    : "Waiting for data";

// LABOR EFFICIENCY COLOR
const laborEfficiencyColor =
  laborEfficiencyScore >= 90
    ? "#86efac"
    : laborEfficiencyScore >= 75
    ? "#22c55e"
    : laborEfficiencyScore >= 60
    ? "#fbbf24"
    : laborEfficiencyScore > 0
    ? "#f87171"
    : "#94a3b8";

// AI LABOR INSIGHT
const laborEfficiencyInsight =
  laborEfficiencyScore >= 90
    ? "Labor is operating at highly efficient productivity levels."
    : laborEfficiencyScore >= 75
    ? "Labor efficiency is healthy and supporting profitability."
    : laborEfficiencyScore >= 60
    ? "Labor productivity is average with optimization opportunities."
    : laborEfficiencyScore > 0
    ? "Labor costs may be reducing operational efficiency."
    : "Upload labor hour data to calculate labor efficiency.";

/* =========================
   SHIFT PERFORMANCE INTELLIGENCE
========================= */

const shiftPerformanceData = (locationSalesData || []).reduce(
  (acc, sale) => {
    const saleHour =
      new Date(
        sale.created_at ||
        sale.date ||
        sale.sale_date ||
        Date.now()
      ).getHours();

    let shiftLabel = "Late Night";

    if (saleHour >= 5 && saleHour < 11) {
      shiftLabel = "Breakfast";
    } else if (saleHour >= 11 && saleHour < 16) {
      shiftLabel = "Lunch";
    } else if (saleHour >= 16 && saleHour < 21) {
      shiftLabel = "Dinner";
    }

    const revenue =
      Number(
        sale.revenue ||
        sale.total ||
        sale.amount ||
        sale.sales ||
        0
      );

    if (!acc[shiftLabel]) {
      acc[shiftLabel] = {
        shift: shiftLabel,
        revenue: 0,
        orders: 0,
      };
    }

    acc[shiftLabel].revenue += revenue;
    acc[shiftLabel].orders += 1;

    return acc;
  },
  {}
);

const shiftPerformanceArray =
  Object.values(shiftPerformanceData);

const topShift =
  shiftPerformanceArray.sort(
    (a, b) => b.revenue - a.revenue
  )[0] || null;
const shiftLaborData = (locationLaborData || laborData || []).reduce(
  (acc, entry) => {
    const laborHour = new Date(
      entry.shift_date ||
        entry.created_at ||
        entry.date ||
        Date.now()
    ).getHours();

    let shiftLabel = "Late Night";

    if (laborHour >= 5 && laborHour < 11) {
      shiftLabel = "Breakfast";
    } else if (laborHour >= 11 && laborHour < 16) {
      shiftLabel = "Lunch";
    } else if (laborHour >= 16 && laborHour < 21) {
      shiftLabel = "Dinner";
    }

    const laborCost = Number(
      entry.labor_cost ||
        entry.cost ||
        entry.payroll_cost ||
        entry.total_cost ||
        entry.wages ||
        0
    );

    if (!acc[shiftLabel]) {
      acc[shiftLabel] = {
        shift: shiftLabel,
        laborCost: 0,
      };
    }

    acc[shiftLabel].laborCost += laborCost;

    return acc;
  },
  {}
);

const shiftOperationalData = shiftPerformanceArray.map((shift) => {
  const laborMatch = shiftLaborData[shift.shift] || {};
  const laborCost = Number(laborMatch.laborCost || 0);

  const laborPercent =
    shift.revenue > 0 ? (laborCost / shift.revenue) * 100 : 0;

  let status = "Efficient";

  if (laborPercent > 35) {
    status = "Overstaffed";
  } else if (laborPercent > 28) {
    status = "Watch Closely";
  }

  return {
    ...shift,
    laborCost,
    laborPercent,
    avgOrderValue:
      shift.orders > 0 ? shift.revenue / shift.orders : 0,
    status,
  };
});
/* =========================
   PREDICTIVE OPERATIONAL ALERTS
========================= */

const predictiveAlerts = [];

if (livePrimeCost >= 65) {
  predictiveAlerts.push({
    type: "critical",
    title: "Prime Cost Risk",
    message:
      "Prime cost is operating above healthy benchmark range.",
  });
}

if (
  laborEfficiencyScore > 0 &&
  laborEfficiencyScore < 60
) {
  predictiveAlerts.push({
    type: "warning",
    title: "Labor Efficiency Declining",
    message:
      "Labor productivity may be reducing profitability.",
  });
}

if (
  Number(liveMomentumPercent || 0) < -10
) {
  predictiveAlerts.push({
    type: "critical",
    title: "Revenue Momentum Slowing",
    message:
      "Revenue trend has declined significantly compared to previous periods.",
  });
}

if (
  topShift?.shift === "Dinner" &&
  topShift?.revenue > liveTotalRevenue * 0.5
) {
  predictiveAlerts.push({
    type: "good",
    title: "Strong Dinner Performance",
    message:
      "Dinner service is generating the majority of revenue.",
  });
}

if (
  effectiveFoodCostPercent >
  activeBenchmarks?.foodCost?.high
) {
  predictiveAlerts.push({
    type: "warning",
    title: "Food Cost Pressure",
    message:
      "Food cost is operating above benchmark range.",
  });
}
/* =========================
   ACTUAL VS EXPECTED USAGE INTELLIGENCE
========================= */

const expectedUsageValue =
  Number(totalCOGS || 0) > 0
    ? Number(totalCOGS || 0)
    : 0;

const actualUsageValue =
  Number(totalCOGS || 0) > 0
    ? Number(totalCOGS || 0)
    : 0;

const operationalUsageVarianceValue =
  actualUsageValue - expectedUsageValue;

const operationalUsageVariancePercent =
  expectedUsageValue > 0
    ? Number(
        (
          (operationalUsageVarianceValue /
            expectedUsageValue) *
          100
        ).toFixed(1)
      )
    : 0;

const operationalUsageVarianceStatus =
  operationalUsageVariancePercent <= 0
    ? "Controlled"
    : operationalUsageVariancePercent <= 5
    ? "Minor Variance"
    : operationalUsageVariancePercent <= 10
    ? "Waste Risk"
    : "Critical Waste Risk";

const operationalUsageVarianceColor =
  operationalUsageVariancePercent <= 0
    ? "#86efac"
    : operationalUsageVariancePercent <= 5
    ? "#fbbf24"
    : "#f87171";

const operationalUsageVarianceInsight =
  expectedUsageValue <= 0
    ? "Upload recipes, invoices, and inventory data to compare expected vs actual usage."
    : operationalUsageVariancePercent <= 0
    ? "Usage is controlled against expected cost."
    : operationalUsageVariancePercent <= 5
    ? "Minor usage variance detected. Continue monitoring prep and portioning."
    : operationalUsageVariancePercent <= 10
    ? "Waste risk detected. Review portions, prep waste, and invoice changes."
    : "Critical waste variance detected. Immediate review recommended.";

/* =========================
   INVENTORY DEPLETION INTELLIGENCE
========================= */

const inventoryDepletionData = (ingredientsData || []).map(
  (item) => {
    const quantity =
      Number(
        item.quantity ||
        item.stock ||
        item.current_stock ||
        item.inventory ||
        0
      );

    const usageRate =
      Number(
        item.daily_usage ||
        item.avg_daily_usage ||
        item.usage ||
        0
      );

    const daysRemaining =
      usageRate > 0
        ? Number((quantity / usageRate).toFixed(1))
        : 0;

    const depletionStatus =
      daysRemaining <= 0
        ? "Unknown"
        : daysRemaining <= 2
        ? "Critical"
        : daysRemaining <= 5
        ? "Low"
        : "Healthy";

    return {
      ...item,
      quantity,
      usageRate,
      daysRemaining,
      depletionStatus,
    };
  }
);

const criticalInventoryItems =
  inventoryDepletionData.filter(
    (item) =>
      item.depletionStatus === "Critical"
  );

const lowInventoryItems =
  inventoryDepletionData.filter(
    (item) =>
      item.depletionStatus === "Low"
  );
/* =========================
   MENU ENGINEERING INTELLIGENCE
========================= */

const menuEngineeringData = (menuItemsData || []).map(
  (item) => {
    const revenue =
      Number(
        item.revenue ||
        item.sales ||
        item.total_sales ||
        item.total ||
        0
      );

    const quantitySold =
      Number(
        item.quantity_sold ||
        item.qty_sold ||
        item.orders ||
        item.quantity ||
        0
      );

    const price =
      Number(
        item.price ||
        item.menu_price ||
        item.selling_price ||
        0
      );

    const cost =
      Number(
        item.cost ||
        item.food_cost ||
        item.item_cost ||
        0
      );

    const margin =
      price > 0
        ? Number((((price - cost) / price) * 100).toFixed(1))
        : 0;

    let performanceCategory = "Unknown";

    if (margin >= 70 && quantitySold >= 20) {
      performanceCategory = "Star";
    } else if (margin >= 70 && quantitySold < 20) {
      performanceCategory = "Puzzle";
    } else if (margin < 70 && quantitySold >= 20) {
      performanceCategory = "Plowhorse";
    } else if (margin > 0) {
      performanceCategory = "Dog";
    }

    return {
      ...item,
      revenue,
      quantitySold,
      price,
      cost,
      margin,
      performanceCategory,
    };
  }
);

const starMenuItems =
  menuEngineeringData.filter(
    (item) => item.performanceCategory === "Star"
  );

const lowPerformingMenuItems =
  menuEngineeringData.filter(
    (item) =>
      item.performanceCategory === "Dog"
  );
/* =========================
   VENDOR INVOICE MATCHING INTELLIGENCE
========================= */

const vendorInvoiceData = (ingredientsData || []).map((invoice) => {
  const vendor =
    invoice.vendor ||
    invoice.vendor_name ||
    invoice.supplier ||
    invoice.supplier_name ||
    invoice.company ||
    "Unknown Vendor";

  const invoiceTotal = Number(
    invoice.total ||
      invoice.amount ||
      invoice.invoice_total ||
      invoice.total_cost ||
      invoice.cost ||
      invoice.price ||
      0
  );

  const expectedTotal = Number(
    invoice.expected_total ||
      invoice.expected_cost ||
      invoice.previous_total ||
      invoice.par_cost ||
      invoice.avg_cost ||
      invoiceTotal ||
      0
  );

  const varianceValue =
    invoiceTotal - expectedTotal;

  const variancePercent =
    expectedTotal > 0
      ? Number(
          (
            (varianceValue / expectedTotal) *
            100
          ).toFixed(1)
        )
      : 0;

  const matchStatus =
    Math.abs(variancePercent) <= 2
      ? "Matched"
      : Math.abs(variancePercent) <= 8
      ? "Review"
      : "Mismatch";

  return {
    ...invoice,
    vendor,
    invoiceTotal,
    expectedTotal,
    varianceValue,
    variancePercent,
    matchStatus,
  };
});

const invoiceMismatchItems = vendorInvoiceData.filter(
  (item) => item.matchStatus === "Mismatch"
);

const invoiceReviewItems = vendorInvoiceData.filter(
  (item) => item.matchStatus === "Review"
);

const invoiceMatchRate =
  vendorInvoiceData.length > 0
    ? Number(
        (
          ((vendorInvoiceData.length - invoiceMismatchItems.length) /
            vendorInvoiceData.length) *
          100
        ).toFixed(1)
      )
    : 0;
/* =========================
   POUR VARIANCE INTELLIGENCE
========================= */

const expectedAlcoholUsage =
  Number(alcoholRevenue || 0) *
  0.18;

const actualAlcoholUsage =
  expectedAlcoholUsage;

const alcoholVarianceValue =
  actualAlcoholUsage -
  expectedAlcoholUsage;

const alcoholVariancePercent =
  expectedAlcoholUsage > 0
    ? Number(
        (
          (alcoholVarianceValue /
            expectedAlcoholUsage) *
          100
        ).toFixed(1)
      )
    : 0;

const alcoholVarianceStatus =
  alcoholVariancePercent <= 3
    ? "Controlled"
    : alcoholVariancePercent <= 8
    ? "Watch"
    : alcoholVariancePercent <= 15
    ? "High Variance"
    : "Critical";

const alcoholVarianceColor =
  alcoholVariancePercent <= 3
    ? "#86efac"
    : alcoholVariancePercent <= 8
    ? "#fbbf24"
    : "#f87171";

const alcoholVarianceInsight =
  alcoholRevenue <= 0
    ? "Upload alcohol sales and inventory data to monitor pour variance."
    : alcoholVariancePercent <= 3
    ? "Alcohol usage is operating within healthy variance."
    : alcoholVariancePercent <= 8
    ? "Minor pour variance detected. Continue monitoring."
    : alcoholVariancePercent <= 15
    ? "Elevated beverage variance detected. Review pour control and waste."
    : "Critical beverage variance detected. Theft, overpouring, or shrink may be occurring.";

/* =========================
   BARTENDER / SHIFT VARIANCE INTELLIGENCE
========================= */

const bartenderVarianceData = (alcoholSalesRows || []).reduce((acc, row) => {
  const bartender =
    row.bartender ||
    row.employee ||
    row.server ||
    row.staff_name ||
    "Unassigned";

  const revenue = Number(
    row.revenue ||
      row.total ||
      row.amount ||
      row.sales ||
      row.price ||
      0
  );

  if (!acc[bartender]) {
    acc[bartender] = {
      bartender,
      revenue: 0,
      orders: 0,
    };
  }

  acc[bartender].revenue += revenue;
  acc[bartender].orders += 1;

  return acc;
}, {});

const bartenderVarianceArray = Object.values(bartenderVarianceData).sort(
  (a, b) => b.revenue - a.revenue
);

const topBartender =
  bartenderVarianceArray[0] || null;

const bartenderRiskStatus =
  bartenderVarianceArray.length <= 0
    ? "Needs data"
    : alcoholVariancePercent <= 3
    ? "Controlled"
    : alcoholVariancePercent <= 8
    ? "Watch"
    : "Review Required";

const bartenderVarianceInsight =
  bartenderVarianceArray.length <= 0
    ? "Upload alcohol sales with bartender or server names to identify variance by staff member."
    : alcoholVariancePercent <= 3
    ? "Bartender-level beverage performance appears controlled based on current alcohol sales."
    : alcoholVariancePercent <= 8
    ? "Minor beverage variance detected. Review top bartender/server alcohol activity."
    : "Elevated beverage variance detected. Review staff-level pours, comps, voids, and transfers.";

/* =========================
   HAPPY HOUR PROFITABILITY INTELLIGENCE
========================= */

const happyHourRows = (locationSalesData || []).filter((sale) => {
  const saleHour = new Date(
    sale.created_at ||
      sale.date ||
      sale.sale_date ||
      Date.now()
  ).getHours();

  return saleHour >= 15 && saleHour < 18;
});

const happyHourRevenue = happyHourRows.reduce(
  (sum, sale) =>
    sum +
    Number(
      sale.revenue ||
        sale.total ||
        sale.amount ||
        sale.sales ||
        0
    ),
  0
);

const happyHourOrders = happyHourRows.length;

const happyHourAvgOrder =
  happyHourOrders > 0
    ? Number((happyHourRevenue / happyHourOrders).toFixed(2))
    : 0;

const happyHourRevenuePercent =
  liveTotalRevenue > 0
    ? Number(((happyHourRevenue / liveTotalRevenue) * 100).toFixed(1))
    : 0;

const happyHourStatus =
  happyHourRevenuePercent >= 20
    ? "Strong Traffic Driver"
    : happyHourRevenuePercent >= 10
    ? "Moderate Impact"
    : happyHourRevenuePercent > 0
    ? "Low Impact"
    : "Needs data";

const happyHourInsight =
  happyHourRevenuePercent >= 20
    ? "Happy hour is driving meaningful revenue and guest traffic."
    : happyHourRevenuePercent >= 10
    ? "Happy hour is contributing to sales but may need margin review."
    : happyHourRevenuePercent > 0
    ? "Happy hour impact appears limited. Review pricing, timing, and offer mix."
    : "Upload timestamped sales data to evaluate happy hour profitability.";

/* =========================
   COCKTAIL RECIPE COSTING INTELLIGENCE
========================= */

const cocktailRecipeData = (alcoholSalesRows || []).map((item) => {
  const name =
    item.name ||
    item.item_name ||
    item.product ||
    item.menu_item ||
    "Unknown Drink";

  const price = Number(
    item.price ||
      item.revenue ||
      item.total ||
      item.amount ||
      0
  );

  const estimatedCost =
    Number(item.cost || item.recipe_cost || item.pour_cost || 0) ||
    price * 0.18;

  const cocktailMargin =
    price > 0
      ? Number((((price - estimatedCost) / price) * 100).toFixed(1))
      : 0;

  const cocktailStatus =
    cocktailMargin >= 80
      ? "Excellent"
      : cocktailMargin >= 70
      ? "Healthy"
      : cocktailMargin >= 60
      ? "Watch"
      : cocktailMargin > 0
      ? "Low Margin"
      : "Needs data";

  return {
    ...item,
    name,
    price,
    estimatedCost,
    cocktailMargin,
    cocktailStatus,
  };
});

const lowMarginCocktails = cocktailRecipeData.filter(
  (item) => item.cocktailMargin > 0 && item.cocktailMargin < 70
);

const topMarginCocktails = cocktailRecipeData
  .filter((item) => item.cocktailMargin > 0)
  .sort((a, b) => b.cocktailMargin - a.cocktailMargin)
  .slice(0, 5);

/* =========================
   KEG / DRAFT BEER DEPLETION INTELLIGENCE
========================= */

const draftBeerRows = (alcoholSalesRows || []).filter((item) => {
  const text = String(
    item.name ||
      item.item_name ||
      item.product ||
      item.menu_item ||
      item.category ||
      ""
  ).toLowerCase();

  return (
    text.includes("draft") ||
    text.includes("tap") ||
    text.includes("keg") ||
    text.includes("beer")
  );
});

const draftBeerRevenue = draftBeerRows.reduce(
  (sum, item) =>
    sum +
    Number(
      item.revenue ||
        item.total ||
        item.amount ||
        item.sales ||
        item.price ||
        0
    ),
  0
);

const draftBeerOrders = draftBeerRows.length;

const estimatedDraftPours = draftBeerOrders;

const estimatedKegUsageGallons =
  Number((estimatedDraftPours * 0.125).toFixed(2));

const kegStatus =
  draftBeerOrders <= 0
    ? "Needs data"
    : estimatedKegUsageGallons >= 12
    ? "High Depletion"
    : estimatedKegUsageGallons >= 6
    ? "Moderate Depletion"
    : "Controlled";

const kegInsight =
  draftBeerOrders <= 0
    ? "Upload draft beer sales to monitor keg depletion."
    : estimatedKegUsageGallons >= 12
    ? "Draft beer depletion is high. Review keg inventory and upcoming restock needs."
    : estimatedKegUsageGallons >= 6
    ? "Draft beer usage is moderate. Continue monitoring keg levels."
    : "Draft beer usage appears controlled based on current sales.";

/* =========================
   AI PROFIT RECOVERY INTELLIGENCE
========================= */

const estimatedFoodRecovery =
  effectiveFoodCostPercent >
  activeBenchmarks?.foodCost?.high
    ? Math.round(
        ((effectiveFoodCostPercent -
          activeBenchmarks.foodCost.high) /
          100) *
          liveTotalRevenue
      )
    : 0;

const estimatedLaborRecovery =
  effectiveLaborCostPercent >
  activeBenchmarks?.laborCost?.high
    ? Math.round(
        ((effectiveLaborCostPercent -
          activeBenchmarks.laborCost.high) /
          100) *
          liveTotalRevenue
      )
    : 0;

const operationalEstimatedWasteRecovery =
  operationalUsageVariancePercent > 5
    ? Math.round(
        (operationalUsageVariancePercent / 100) *
          liveTotalRevenue *
          0.25
      )
    : 0;

const estimatedAlcoholRecovery =
  alcoholVariancePercent > 5
    ? Math.round(
        (alcoholVariancePercent / 100) *
          alcoholRevenue *
          0.2
      )
    : 0;

const totalAIRecoveryOpportunity =
  estimatedFoodRecovery +
  estimatedLaborRecovery +
  operationalEstimatedWasteRecovery +
  estimatedAlcoholRecovery;

const aiRecoveryStatus =
  totalAIRecoveryOpportunity <= 0
    ? "Optimized"
    : totalAIRecoveryOpportunity <= 2000
    ? "Minor Opportunity"
    : totalAIRecoveryOpportunity <= 5000
    ? "Moderate Opportunity"
    : "High Recovery Opportunity";

const aiRecoveryInsight =
  totalAIRecoveryOpportunity <= 0
    ? "Operations appear optimized based on current data."
    : `AI has identified approximately $${Number(
        totalAIRecoveryOpportunity
      ).toLocaleString()} in potential operational recovery opportunities.`;

console.log("AI RECOVERY DEBUG:", {
  estimatedFoodRecovery,
  estimatedLaborRecovery,
  operationalEstimatedWasteRecovery,
  estimatedAlcoholRecovery,
  totalAIRecoveryOpportunity,
  aiRecoveryStatus,
});

/* =========================
   EXECUTIVE RISK SCORE
========================= */

const executiveRiskScore = Math.min(
  100,
  Math.round(
    (livePrimeCost >= 65 ? 25 : livePrimeCost >= 60 ? 12 : 0) +
      (laborEfficiencyScore > 0 && laborEfficiencyScore < 60 ? 20 : 0) +
      (operationalUsageVariancePercent > 10
        ? 20
        : operationalUsageVariancePercent > 5
        ? 10
        : 0) +
      (alcoholVariancePercent > 10 ? 15 : alcoholVariancePercent > 5 ? 8 : 0) +
      (criticalInventoryItems.length > 0 ? 15 : lowInventoryItems.length > 0 ? 8 : 0) +
      (Number(liveMomentumPercent || 0) < -10 ? 15 : 0)
  )
);

const executiveRiskStatus =
  executiveRiskScore <= 20
    ? "Low Risk"
    : executiveRiskScore <= 45
    ? "Moderate Risk"
    : executiveRiskScore <= 70
    ? "High Risk"
    : "Critical Risk";

const executiveRiskColor =
  executiveRiskScore <= 20
    ? "#86efac"
    : executiveRiskScore <= 45
    ? "#fbbf24"
    : "#fb923c";

const executiveRiskInsight =
  executiveRiskScore <= 20
    ? "Operations appear stable based on current intelligence signals."
    : executiveRiskScore <= 45
    ? "Some operational risks are emerging. Review cost, labor, and inventory trends."
    : executiveRiskScore <= 70
    ? "High operational risk detected. Multiple cost or efficiency signals need attention."
    : "Critical operational risk detected. Immediate executive review recommended.";

/* =========================
   AI AUTOPILOT RECOMMENDATIONS
========================= */

const aiOperationalRecommendations = [];

if (livePrimeCost >= 65) {
  aiOperationalRecommendations.push({
    priority: "High",
    title: "Reduce Prime Cost Pressure",
    message:
      "Food or labor costs are operating above benchmark range. Review scheduling, waste, and portion control.",
  });
}

if (
  laborEfficiencyScore > 0 &&
  laborEfficiencyScore < 60
) {
  aiOperationalRecommendations.push({
    priority: "Medium",
    title: "Improve Labor Efficiency",
    message:
      "Sales per labor hour suggest staffing inefficiencies during certain operating windows.",
  });
}

if (
  operationalUsageVariancePercent > 5
) {
  aiOperationalRecommendations.push({
    priority: "High",
    title: "Investigate Usage Variance",
    message:
      "Inventory or prep variance may indicate waste, overportioning, or operational leakage.",
  });
}

if (
  alcoholVariancePercent > 8
) {
  aiOperationalRecommendations.push({
    priority: "High",
    title: "Review Beverage Variance",
    message:
      "Alcohol variance is elevated. Audit pours, comps, voids, and bartender activity.",
  });
}

if (
  lowPerformingMenuItems.length > 0
) {
  aiOperationalRecommendations.push({
    priority: "Medium",
    title: "Optimize Menu Performance",
    message:
      "Some menu items may be lowering profitability or underperforming operationally.",
  });
}

if (
  criticalInventoryItems.length > 0
) {
  aiOperationalRecommendations.push({
    priority: "High",
    title: "Restock Critical Inventory",
    message:
      "Multiple ingredients are approaching depletion thresholds.",
  });
}

if (
  aiOperationalRecommendations.length <= 0
) {
  aiOperationalRecommendations.push({
    priority: "Stable",
    title: "Operations Stable",
    message:
      "AI has not detected major operational risks based on current uploaded data.",
  });
}

const topMarginItem =
  [...menuItemsData]
    .sort((a, b) => Number(b.margin || 0) - Number(a.margin || 0))[0] || null;

const lowestMarginItem =
  [...menuItemsData]
    .sort((a, b) => Number(a.margin || 0) - Number(b.margin || 0))[0] || null;

const lowMarginMenuItems = menuItemsData.filter(
  (item) => Number(item.margin || 0) < 60
);

const menuOptimizationOpportunity =
  lowMarginMenuItems.reduce(
    (sum, item) => sum + Number(item.revenue || 0) * 0.08,
    0
  );

const menuEngineeringInsight =
  lowMarginMenuItems.length > 0
    ? `${lowMarginMenuItems.length} menu items are operating below target profitability. AI recommends adjusting pricing, reducing ingredient cost, or repositioning low-performing items to improve contribution margins.`
    : "Menu profitability looks healthy based on current menu engineering analysis.";

const handleImportLabor = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setMessage("Please log in before importing labor data.");
      return;
    }

    const cleanDate = (value) => {
      if (!value || String(value).trim() === "") {
        return new Date().toISOString().slice(0, 10);
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return new Date().toISOString().slice(0, 10);
      }

      return date.toISOString().slice(0, 10);
    };

    const laborRows =
  pendingUploadSummary?.uploadType === "labor"
    ? pendingUploadSummary?.rows || []
    : laborData || [];

console.log("LABOR ROWS FOUND:", laborRows);

const rowsToInsert = laborRows.map((row) => {
      const rawShift =
        row.shift ||
        row.Shift ||
        row.shift_name ||
        row["Shift Name"] ||
        row.daypart ||
        row.Daypart ||
        row.period ||
        row.Period ||
        row.service ||
        row.Service ||
        "";

      const rawTime =
        row.time ||
        row.Time ||
        row.clock_in ||
        row["Clock In"] ||
        row.order_time ||
        row["Order Time"] ||
        row.start_time ||
        row["Start Time"] ||
        "";

      const hour = Number(String(rawTime).split(":")[0]);

      let detectedShift = "Unknown";

      if (rawShift) {
        detectedShift = String(rawShift).trim();
      } else if (!Number.isNaN(hour)) {
        if (hour >= 5 && hour < 11) detectedShift = "Morning";
        else if (hour >= 11 && hour < 15) detectedShift = "Lunch";
        else if (hour >= 15 && hour < 22) detectedShift = "Dinner";
        else detectedShift = "Late Night";
      }

      return {
        user_id: user.id,

        employee_name:
          row.employee_name ||
          row.Employee ||
          row["Employee Name"] ||
          row.name ||
          row.Name ||
          "Unknown Employee",

        role:
          row.role ||
          row.Role ||
          row.position ||
          row.Position ||
          "Staff",

        work_date: cleanDate(
          row.work_date ||
            row.date ||
            row.Date ||
            row["Work Date"]
        ),

        hours_worked: Number(
          row.hours_worked ||
            row.hours ||
            row.Hours ||
            row["Hours Worked"] ||
            0
        ),

        hourly_rate: Number(
          row.hourly_rate ||
            row.rate ||
            row.Rate ||
            row["Hourly Rate"] ||
            0
        ),

        labor_cost: Number(
          row.labor_cost ||
            row.cost ||
            row.Cost ||
            row["Labor Cost"] ||
            0
        ),

        shift: detectedShift,

        file_name: pendingUploadSummary?.fileName || null,
        source_name: "labor_upload",
      };
    });

    if (!rowsToInsert.length) {
      setMessage("No labor rows found to import.");
      return;
    }

    const { data: insertedLaborRows, error } = await supabase
      .from("labor_uploads")
      .insert(rowsToInsert)
      .select();

    if (error) {
      console.error("Labor import failed:", error);
      setMessage(`Labor import failed: ${error.message}`);
      return;
    }

    const newLaborUpload = {
  id: `labor-${Date.now()}`,
  file_name: pendingUploadSummary?.fileName || "Labor upload",
  source_name: "labor_upload",
  row_count: rowsToInsert.length,
  created_at: new Date().toISOString(),
  rows: insertedLaborRows || rowsToInsert,
};
setClientImports((prev) => [newLaborUpload, ...(prev || [])]);
    

    setMessage(`Imported ${rowsToInsert.length} labor rows successfully.`);
    setPendingUploadSummary(null);
    setLaborData(insertedLaborRows || rowsToInsert);
  } catch (error) {
    console.error("Labor import error:", error);
    setMessage("Labor import failed. Check console for details.");
  }
};

const laborRiskStatus =
  liveLaborIntelligence?.laborPercent > 35
    ? "Critical"
    : liveLaborIntelligence?.laborPercent > 30
    ? "High"
    : liveLaborIntelligence?.laborPercent > 25
    ? "Moderate"
    : "Stable";

const dailyLaborEfficiency = useMemo(() => {
  const salesRows =
    dbSalesRows?.length
      ? dbSalesRows
      : locationSalesData?.length
? locationSalesData
      : pendingUploadRows?.length
      ? pendingUploadRows
      : [];

  const laborRows = laborData || [];

  const salesByDate = {};
  const laborByDate = {};

  salesRows.forEach((sale) => {
    const dateObj = getSaleDate(sale);
    if (!dateObj) return;

    const key = dateObj.toISOString().slice(0, 10);
    const revenue = getSaleRevenue(sale);

    salesByDate[key] = (salesByDate[key] || 0) + Number(revenue || 0);
  });

  laborRows.forEach((row) => {
    const rawDate =
      row.work_date ||
      row.date ||
      row.shift_date ||
      row["Work Date"] ||
      row["Date"];

    const dateObj = rawDate ? new Date(rawDate) : null;
    if (!dateObj || isNaN(dateObj.getTime())) return;

    const key = dateObj.toISOString().slice(0, 10);

    const laborCost =
      Number(row.labor_cost || row["Labor Cost"] || row.laborCost || 0) ||
      Number(row.hours || row.Hours || 0) *
        Number(row.hourly_rate || row["Hourly Rate"] || row.rate || 0);

    laborByDate[key] = (laborByDate[key] || 0) + Number(laborCost || 0);
  });

  const allDates = Array.from(
    new Set([...Object.keys(salesByDate), ...Object.keys(laborByDate)])
  ).sort((a, b) => new Date(b) - new Date(a));

  return allDates.map((date) => {
    const revenue = Number(salesByDate[date] || 0);
    const laborCost = Number(laborByDate[date] || 0);
    const laborPercent = revenue > 0 ? (laborCost / revenue) * 100 : 0;

    let status = "Needs revenue data";
    let recommendation = "Upload POS sales for this date to compare labor vs revenue.";

    if (revenue > 0 && laborPercent > 35) {
      status = "Overstaffed";
      recommendation = "Reduce labor hours or adjust scheduling for this day.";
    } else if (revenue > 0 && laborPercent > 28) {
      status = "Watch Closely";
      recommendation = "Labor is slightly high. Review staffing by shift.";
    } else if (revenue > 0 && laborPercent < 14) {
      status = "Possibly Understaffed";
      recommendation = "Labor is low compared to sales. Check service quality and wait times.";
    } else if (revenue > 0) {
      status = "Healthy";
      recommendation = "Labor is aligned with revenue.";
    }

    return {
      date,
      label: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue,
      laborCost,
      laborPercent,
      status,
      recommendation,
    };
  });
}, [dbSalesRows, locationSalesData, pendingUploadRows, laborData]);

const shiftLaborIntelligence = useMemo(() => {
  const salesRows =
    dbSalesRows?.length
      ? dbSalesRows
     : locationSalesData?.length
? locationSalesData
      : pendingUploadRows?.length
      ? pendingUploadRows
      : [];

  const laborRows = laborData || [];

  const getShiftName = (row = {}) => {
    const rawShift =
      row.shift ||
      row.Shift ||
      row.shift_name ||
      row["Shift"] ||
      row["Shift Name"] ||
      "";

    if (rawShift) return String(rawShift);

    const rawTime =
      row.time ||
      row.Time ||
      row.order_time ||
      row["Order Time"] ||
      row.clock_in ||
      row["Clock In"];

    if (!rawTime) return "Unknown Shift";

    const hour = Number(String(rawTime).split(":")[0]);

    if (hour >= 5 && hour < 11) return "Morning";
    if (hour >= 11 && hour < 15) return "Lunch";
    if (hour >= 15 && hour < 22) return "Dinner";
    return "Late Night";
  };

  const shifts = {};

 salesRows.forEach((sale) => {
  const shift = getShiftName(sale);

  const revenue = Number(
    sale.revenue ||
      sale.Revenue ||
      sale.total_revenue ||
      sale["Total Revenue"] ||
      sale.total_sales ||
      sale["Total Sales"] ||
      sale.net_sales ||
      sale["Net Sales"] ||
      sale.gross_sales ||
      sale["Gross Sales"] ||
      sale.sales ||
      sale.Sales ||
      sale.amount ||
      sale.Amount ||
      sale.total ||
      sale.Total ||
      sale.value ||
      sale.Value ||
      0
  );

  if (!shifts[shift]) {
    shifts[shift] = {
      shift,
      revenue: 0,
      laborCost: 0,
      laborHours: 0,
    };
  }

  shifts[shift].revenue += Number(revenue || 0);
});

  laborRows.forEach((row) => {
    const shift = getShiftName(row);

   const hours = Number(
  row.hours_worked ||
    row.hoursWorked ||
    row.hours ||
    row.Hours ||
    row.total_hours ||
    row["Total Hours"] ||
    row["Hours Worked"] ||
    0
);

    const laborCost =
  Number(
    row.labor_cost ||
      row.laborCost ||
      row["Labor Cost"] ||
      row.cost ||
      row.Cost ||
      row.total_labor_cost ||
      row["Total Labor Cost"] ||
      0
  ) ||
  hours *
    Number(
      row.hourly_rate ||
        row.hourlyRate ||
        row["Hourly Rate"] ||
        row.rate ||
        row.Rate ||
        row.pay_rate ||
        row["Pay Rate"] ||
        0
    );

    if (!shifts[shift]) {
      shifts[shift] = {
        shift,
        revenue: 0,
        laborCost: 0,
        laborHours: 0,
      };
    }

    shifts[shift].laborCost += Number(laborCost || 0);
    shifts[shift].laborHours += Number(hours || 0);
  });

  return Object.values(shifts).map((item) => {
    const laborPercent =
      item.revenue > 0 ? (item.laborCost / item.revenue) * 100 : 0;

    const salesPerLaborHour =
      item.laborHours > 0 ? item.revenue / item.laborHours : 0;

    let status = "Needs Data";
    let recommendation = "Upload shift-level sales and labor data.";

    if (item.revenue > 0 && laborPercent > 35) {
      status = "Overstaffed";
      recommendation = "Reduce labor hours or move staff to stronger shifts.";
    } else if (item.revenue > 0 && laborPercent > 28) {
      status = "Watch Closely";
      recommendation = "Labor is high for this shift. Review staffing levels.";
    } else if (item.revenue > 0 && laborPercent < 14) {
      status = "Possibly Understaffed";
      recommendation = "Revenue is strong compared to labor. Check service speed.";
    } else if (item.revenue > 0) {
      status = "Healthy";
      recommendation = "Shift labor is aligned with revenue.";
    }

    return {
      ...item,
      laborPercent,
      salesPerLaborHour,
      status,
      recommendation,
    };
  });
}, [dbSalesRows, locationSalesData, pendingUploadRows, laborData]);

const primeCostPercentage =
  Number(foodCostPercentage || 0) +
  Number(liveLaborIntelligence?.laborPercent || 0);


const estimatedPrimeCostLoss =
  primeCostPercentage > 60
    ? Math.round((primeCostPercentage - 60) * 250)
    : 0;



const getIngredientTolerance = (ingredientName = "") => {
  const name = String(ingredientName).toLowerCase();

  if (
    name.includes("steak") ||
    name.includes("ribeye") ||
    name.includes("filet") ||
    name.includes("salmon") ||
    name.includes("shrimp") ||
    name.includes("lobster") ||
    name.includes("tequila") ||
    name.includes("vodka") ||
    name.includes("bourbon") ||
    name.includes("liquor")
  ) {
    return 8;
  }

  if (
    name.includes("chicken") ||
    name.includes("cheese") ||
    name.includes("mozzarella") ||
    name.includes("parmesan") ||
    name.includes("sauce")
  ) {
    return 18;
  }

  if (
    name.includes("garnish") ||
    name.includes("lettuce") ||
    name.includes("oil") ||
    name.includes("butter") ||
    name.includes("seasoning") ||
    name.includes("spice") ||
    name.includes("bread") ||
    name.includes("fries")
  ) {
    return 30;
  }

  return 15;
};

const getVarianceClassification = (ingredientName, variancePercent) => {
  const tolerance = getIngredientTolerance(ingredientName);
  const variance = Number(variancePercent || 0);

  if (variance <= tolerance) {
    return {
      tolerance,
      status: "Normal Kitchen Variance",
      cause: "Usage is within the expected tolerance for this ingredient.",
      severity: "healthy",
    };
  }

  if (variance <= tolerance + 8) {
    return {
      tolerance,
      status: "Monitor",
      cause: "Usage is slightly above the expected tolerance.",
      severity: "watch",
    };
  }

  if (variance <= tolerance + 18) {
    return {
      tolerance,
      status: "Waste Risk",
      cause: "Usage is above expected tolerance and may indicate prep loss or over-portioning.",
      severity: "risk",
    };
  }

  return {
    tolerance,
    status: "Critical Waste Risk",
    cause: "Usage is far above expected tolerance and may indicate major waste, theft, or recipe execution problems.",
    severity: "critical",
  };
};
const ingredientVarianceData = useMemo(() => {
  const ingredients =
    uploadComparison?.activeIngredients ||
    ingredientsData ||
    [];

  return ingredients.map((ingredient) => {
    const ingredientName =
      ingredient.name ||
      ingredient.ingredient_name ||
      ingredient.item_name ||
      "Unknown Ingredient";

    const expectedUsage = Number(
      ingredient.expected_usage ||
        ingredient.expectedUsage ||
        ingredient.usedFromSales ||
        ingredient.projected_usage ||
        0
    );

    const actualUsage = Number(
      ingredient.actual_usage ||
        ingredient.actualUsage ||
        ingredient.quantity_used ||
        ingredient.inventory_depletion ||
        0
    );

    const variance = actualUsage - expectedUsage;

    const variancePercent =
      expectedUsage > 0
        ? (variance / expectedUsage) * 100
        : 0;

    const estimatedLoss =
      variance > 0
        ? variance * Number(ingredient.cost_per_unit || 3)
        : 0;

    const classification = getVarianceClassification(
      ingredientName,
      variancePercent
    );

    return {
      ingredientName,
      expectedUsage,
      actualUsage,
      variance,
      variancePercent,
      estimatedLoss,

      tolerance: classification.tolerance,
      status: classification.status,
      likelyCause: classification.cause,
      severity: classification.severity,
    };
  });
}, [uploadComparison, ingredientsData]);

const aiWasteDetection = useMemo(() => {
  return (ingredientVarianceData || [])
    .filter(
      (item) =>
        Number(item.variancePercent || 0) >
        Number(item.tolerance || 5)
    )
    .map((item) => {
      let likelyCause =
        item.likelyCause || "Minor operational variance";

      let recommendation =
        "Monitor ingredient usage and compare against prep behavior.";

      if (item.severity === "critical") {
        likelyCause =
          "Possible over-portioning, theft, spoilage, or major prep waste";

        recommendation =
          "Audit prep procedures, inventory handling, shift activity, and manager approvals immediately.";
      } else if (item.severity === "risk") {
        likelyCause =
          "Prep waste or inaccurate recipe execution detected";

        recommendation =
          "Review kitchen prep consistency, recipe compliance, and portion control.";
      } else if (item.severity === "watch") {
        likelyCause =
          "Ingredient usage slightly exceeds expected kitchen tolerance";

        recommendation =
          "Monitor ingredient usage trends over the next few shifts.";
      }

      return {
        ...item,
        likelyCause,
        recommendation,
      };
    })
    .sort(
      (a, b) =>
        Number(b.variancePercent || 0) -
        Number(a.variancePercent || 0)
    );
}, [ingredientVarianceData]);

const inventoryTurnoverData = useMemo(() => {
  const ingredients =
    uploadComparison?.activeIngredients ||
    ingredientsData ||
    [];

  return ingredients.map((item) => {
    const name =
      item.name ||
      item.ingredient_name ||
      item.item_name ||
      "Unknown Ingredient";

    const quantity = Number(item.quantity || item.qty || item.stock || 0);

    const usageRate = Number(
      item.usageRate ||
        item.daily_usage ||
        item.dailyUsage ||
        item.usedFromSales ||
        0
    );

    const daysOnHand = usageRate > 0 ? quantity / usageRate : 0;

    let status = "Needs Usage Data";
    let recommendation = "Upload usage or recipe data to calculate turnover.";

    if (daysOnHand > 14) {
      status = "Slow Moving";
      recommendation = "Inventory may be overstocked or at spoilage risk.";
    } else if (daysOnHand > 7) {
      status = "Healthy";
      recommendation = "Inventory turnover looks controlled.";
    } else if (daysOnHand > 0) {
      status = "Fast Moving";
      recommendation = "Monitor this item closely for restock timing.";
    }

    return {
      name,
      quantity,
      usageRate,
      daysOnHand,
      status,
      recommendation,
    };
  });
}, [uploadComparison, ingredientsData]);


const spoilageForecastData = useMemo(() => {
  const ingredients =
    uploadComparison?.activeIngredients ||
    ingredientsData ||
    [];

  const getDefaultShelfLife = (name = "") => {
    const item = String(name).toLowerCase();

    if (
      item.includes("seafood") ||
      item.includes("fish") ||
      item.includes("shrimp") ||
      item.includes("salmon") ||
      item.includes("lobster")
    ) {
      return 2;
    }

    if (
      item.includes("chicken") ||
      item.includes("beef") ||
      item.includes("steak") ||
      item.includes("pork")
    ) {
      return 4;
    }

    if (
      item.includes("lettuce") ||
      item.includes("tomato") ||
      item.includes("produce") ||
      item.includes("fruit") ||
      item.includes("vegetable")
    ) {
      return 5;
    }

    if (
      item.includes("cheese") ||
      item.includes("milk") ||
      item.includes("cream") ||
      item.includes("dairy")
    ) {
      return 7;
    }

    return 10;
  };

  return ingredients.map((item) => {
    const name =
      item.name ||
      item.ingredient_name ||
      item.item_name ||
      "Unknown Ingredient";

    const receivedDateRaw =
      item.received_date ||
      item.receivedDate ||
      item.purchase_date ||
      item["Purchase Date"] ||
      item.created_at ||
      null;

    const receivedDate = receivedDateRaw
      ? new Date(receivedDateRaw)
      : new Date();

    const shelfLifeDays = Number(
      item.shelf_life_days ||
        item.shelfLifeDays ||
        item["Shelf Life Days"] ||
        getDefaultShelfLife(name)
    );

    const expirationDate = new Date(receivedDate);
    expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);

    const today = new Date();
    const daysUntilSpoilage = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let status = "Healthy";
    let recommendation = "Shelf life risk looks controlled.";

    if (daysUntilSpoilage <= 0) {
      status = "Expired Risk";
      recommendation = "Review immediately. This item may already be spoiled.";
    } else if (daysUntilSpoilage <= 2) {
      status = "Spoilage Risk";
      recommendation = "Prioritize this ingredient in specials or prep planning.";
    } else if (daysUntilSpoilage <= 4) {
      status = "Watch";
      recommendation = "Monitor this item and avoid over-prepping.";
    }

    return {
      name,
      receivedDate,
      shelfLifeDays,
      expirationDate,
      daysUntilSpoilage,
      status,
      recommendation,
    };
  });
}, [uploadComparison, ingredientsData]);

const vendorPriceSpikeData = useMemo(() => {
  const invoiceRows =
    invoicesData ||
    invoiceData ||
    [];

  const grouped = {};

  invoiceRows.forEach((invoice) => {
    const itemName =
      invoice.item_name ||
      invoice.item ||
      invoice.ingredient_name ||
      invoice.product ||
      invoice.description ||
      "Unknown Item";

    const vendor =
      invoice.vendor ||
      invoice.vendor_name ||
      invoice.supplier ||
      invoice.supplier_name ||
      "Unknown Vendor";

    const dateRaw =
      invoice.invoice_date ||
      invoice.date ||
      invoice.created_at ||
      invoice.purchase_date ||
      null;

    const date = dateRaw ? new Date(dateRaw) : new Date();

    const unitCost = Number(
      invoice.unit_cost ||
        invoice.cost_per_unit ||
        invoice.price_per_unit ||
        invoice.price ||
        invoice.cost ||
        0
    );

    const key = `${vendor}-${itemName}`;

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push({
      itemName,
      vendor,
      date,
      unitCost,
    });
  });

  return Object.values(grouped)
    .map((rows) => {
      const sorted = rows.sort((a, b) => a.date - b.date);

      const previous = sorted[sorted.length - 2];
      const latest = sorted[sorted.length - 1];

      const priceChange =
        previous?.unitCost > 0
          ? ((latest.unitCost - previous.unitCost) / previous.unitCost) * 100
          : 0;

      let status = "Stable";
      let recommendation = "Vendor pricing looks stable.";

      if (priceChange > 20) {
        status = "Critical Spike";
        recommendation = "Review invoice immediately or renegotiate vendor pricing.";
      } else if (priceChange > 10) {
        status = "Price Spike";
        recommendation = "Compare supplier pricing and monitor next invoice.";
      } else if (priceChange > 5) {
        status = "Watch";
        recommendation = "Small price increase detected. Continue monitoring.";
      }

      return {
        itemName: latest?.itemName || "Unknown Item",
        vendor: latest?.vendor || "Unknown Vendor",
        previousCost: previous?.unitCost || 0,
        latestCost: latest?.unitCost || 0,
        priceChange,
        status,
        recommendation,
      };
    })
    .filter((item) => item.latestCost > 0)
    .sort((a, b) => b.priceChange - a.priceChange);
}, [invoicesData]);

const recipeCostingData = useMemo(() => {
  const rules = recipeUsageRules || [];
  const ingredients =
  uploadComparison?.activeIngredients ||
  locationIngredientsData ||
  [];

const menuItems = locationMenuItemsData || [];
  

  return menuItems.map((menuItem) => {
    const itemName =
      menuItem.name ||
      menuItem.item_name ||
      menuItem["Item Name"] ||
      "Unknown Item";

    const price = Number(
      menuItem.price ||
        menuItem.menu_price ||
        menuItem["Price"] ||
        0
    );

    const linkedRules = rules.filter(
      (rule) =>
        String(rule.menu_item || rule.menuItem || "").toLowerCase().trim() ===
        String(itemName || "").toLowerCase().trim()
    );

    const recipeCost = linkedRules.reduce((sum, rule) => {
      const ingredient = ingredients.find(
        (ing) =>
          String(ing.name || ing.ingredient_name || "").toLowerCase().trim() ===
          String(rule.ingredient || "").toLowerCase().trim()
      );

      const costPerUnit = Number(
        ingredient?.cost_per_unit ||
          ingredient?.costPerUnit ||
          ingredient?.unit_cost ||
          ingredient?.price_per_unit ||
          0
      );

      return sum + Number(rule.quantity_used || rule.amountUsed || 0) * costPerUnit;
    }, 0);

    const profit = price - recipeCost;
    const margin = price > 0 ? (profit / price) * 100 : 0;

    let status = "Needs Price Data";
    let recommendation = "Add menu price and recipe rules to calculate true margin.";

    if (price > 0 && margin >= 70) {
      status = "High Profit";
      recommendation = "Promote this item. It has strong recipe profitability.";
    } else if (price > 0 && margin >= 60) {
      status = "Healthy";
      recommendation = "Margin is healthy. Monitor ingredient cost changes.";
    } else if (price > 0 && margin >= 50) {
      status = "Watch";
      recommendation = "Review pricing or ingredient portions.";
    } else if (price > 0) {
      status = "Low Margin";
      recommendation = "Adjust price, reduce portion cost, or renegotiate ingredients.";
    }

    return {
      itemName,
      price,
      recipeCost,
      profit,
      margin,
      status,
      recommendation,
      ingredientCount: linkedRules.length,
    };
  });
}, [
  recipeUsageRules,
  uploadComparison,
  locationIngredientsData,
  locationMenuItemsData,
]);

const inventoryTrendData = useMemo(() => {
  const items =
    uploadComparison?.activeIngredients ||
    locationIngredientsData ||
    [];

  return items.slice(0, 10).map((item, index) => {
    const name =
      item.name ||
      item.ingredient_name ||
      item.item_name ||
      `Item ${index + 1}`;

    const quantity = Number(item.quantity || item.qty || item.stock || 0);

    const usageRate = Number(
      item.usageRate ||
        item.daily_usage ||
        item.dailyUsage ||
        item.usedFromSales ||
        0
    );

    const value = quantity * Number(item.cost_per_unit || item.unit_cost || 0);

    return {
      name,
      quantity,
      usageRate,
      value,
    };
  });
}, [uploadComparison, ingredientsData]);

const alcoholPourVarianceData = useMemo(() => {
  const salesRows =
    dbSalesRows?.length
      ? dbSalesRows
      : locationSalesData?.length
      ? locationSalesData
      : pendingUploadRows?.length
      ? pendingUploadRows
      : [];
  const inventoryItems =
    uploadComparison?.activeIngredients ||
    ingredientsData ||
    [];

  const alcoholKeywords = [
    "vodka",
    "tequila",
    "bourbon",
    "whiskey",
    "rum",
    "gin",
    "mezcal",
    "liquor",
    "wine",
    "beer",
    "draft",
    "cocktail",
    "margarita",
    "martini",
  ];

  const alcoholSales = salesRows.filter((sale) => {
    const text = Object.values(sale || {}).join(" ").toLowerCase();
    return alcoholKeywords.some((word) => text.includes(word));
  });

  const alcoholInventory = inventoryItems.filter((item) => {
    const name = String(
      item.name ||
        item.ingredient_name ||
        item.item_name ||
        ""
    ).toLowerCase();

    return alcoholKeywords.some((word) => name.includes(word));
  });

  const totalAlcoholRevenue = alcoholSales.reduce(
    (sum, sale) => sum + Number(getSaleRevenue(sale) || 0),
    0
  );

  const estimatedOuncesSold = alcoholSales.reduce((sum, sale) => {
    const quantity = Number(
      sale.quantity ||
        sale.qty ||
        sale.Quantity ||
        sale["Quantity Sold"] ||
        1
    );

    return sum + quantity * 1.5;
  }, 0);

  const actualOuncesDepleted = alcoholInventory.reduce((sum, item) => {
    return (
      sum +
      Number(
        item.actual_usage ||
          item.actualUsage ||
          item.inventory_depletion ||
          item.quantity_used ||
          item.used ||
          0
      )
    );
  }, 0);

  const variance = actualOuncesDepleted - estimatedOuncesSold;

  const variancePercent =
    estimatedOuncesSold > 0 ? (variance / estimatedOuncesSold) * 100 : 0;

  let status = "Needs Data";
  let recommendation =
    "Upload alcohol sales and bottle depletion data to detect pour variance.";

  if (variancePercent > 25) {
    status = "Critical Pour Variance";
    recommendation =
      "Audit bartender pours, comps, spills, and bottle depletion immediately.";
  } else if (variancePercent > 12) {
    status = "Pour Variance Risk";
    recommendation =
      "Review pour control, recipe compliance, and bartender shift activity.";
  } else if (variancePercent > 5) {
    status = "Watch";
    recommendation =
      "Monitor alcohol depletion against cocktail sales over the next shifts.";
  } else if (estimatedOuncesSold > 0) {
    status = "Controlled";
    recommendation = "Alcohol usage appears aligned with sales.";
  }

  return {
    alcoholSalesCount: alcoholSales.length,
    alcoholInventoryCount: alcoholInventory.length,
    totalAlcoholRevenue,
    estimatedOuncesSold,
    actualOuncesDepleted,
    variance,
    variancePercent,
    status,
    recommendation,
  };
}, [dbSalesRows, locationSalesData, pendingUploadRows, uploadComparison, ingredientsData]);
const laborPercentage =
  totalRevenue > 0
    ? (totalLaborCost / totalRevenue) * 100
    : 0;

const aiActionCenter = useMemo(() => {
  const actions = [];

  if (Number(primeCostPercentage || 0) >= 65) {
    actions.push({
      priority: "critical",
      category: "Prime Cost",
      title: "Prime cost is critically elevated",
      description:
        "Food and labor costs are reducing overall profitability.",
      action: "Review Prime Cost",
      targetTab: "financial",
    });
  }

  if ((aiWasteDetection || []).length > 0) {
    actions.push({
      priority: "high",
      category: "Waste Detection",
      title: `${aiWasteDetection.length} operational waste risks detected`,
      description:
        "AI identified ingredient usage patterns above normal tolerance.",
      action: "Review Waste Risks",
      targetTab: "inventory",
      targetView: "usage",
    });
  }

  if ((criticalInventoryItems || []).length > 0) {
    actions.push({
      priority: "high",
      category: "Inventory",
      title: "Critical inventory depletion detected",
      description:
        "One or more ingredients may run out within 48 hours.",
      action: "Review Restock",
      targetTab: "inventory",
      targetView: "restock",
    });
  }

  if ((vendorPriceSpikeData || []).some((v) => v.priceChange > 10)) {
    actions.push({
      priority: "medium",
      category: "Vendors",
      title: "Vendor price spikes detected",
      description:
        "Supplier pricing increased on one or more ingredients.",
      action: "Review Vendors",
      targetTab: "inventory",
      targetView: "vendors",
    });
  }

  if (Number(laborPercentage || 0) > 35) {
    actions.push({
      priority: "high",
      category: "Labor",
      title: "Labor costs are above target",
      description:
        "Labor efficiency may be reducing store profitability.",
      action: "Review Labor",
      targetTab: "labor",
    });
  }

  return actions.sort((a, b) => {
    const priorityRank = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return priorityRank[b.priority] - priorityRank[a.priority];
  });

}, [
  primeCostPercentage,
  aiWasteDetection,
  criticalInventoryItems,
  vendorPriceSpikeData,
  laborPercentage,
]);

const handleRunAIAction = async (action) => {
  if (!action) return;

  setAiToast({
    type: "success",
    message: `AI action started: ${action.title}`,
  });

  pushActivity(`AI action started: ${action.title}`, "ai_action");
if (aiActionAutopilotEnabled) {
  pushActivity(`Autopilot approved action: ${action.title}`, "autopilot");
  setMessage(`Autopilot started: ${action.title}`);
}
  if (action.targetTab) {
    setActiveTab(action.targetTab);
  }

  if (action.targetView) {
    setInventoryView(action.targetView);
  }

  if (action.category === "Inventory" && criticalInventoryItems.length > 0) {
    const topItem = criticalInventoryItems[0];

    setMessage(`AI flagged ${topItem.name || "an ingredient"} for restock review.`);
  }

  if (action.category === "Waste Detection" && aiWasteDetection.length > 0) {
    const topWaste = aiWasteDetection[0];

    setMessage(
      `AI flagged ${topWaste.ingredientName || "an ingredient"} for waste review.`
    );
  }

  if (action.category === "Vendors" && vendorPriceSpikeData.length > 0) {
    const topVendorIssue = vendorPriceSpikeData[0];

    setMessage(
      `AI flagged ${topVendorIssue.itemName || "a vendor item"} price spike.`
    );
  }

  if (action.category === "Labor") {
    setMessage("AI flagged labor efficiency for review.");
  }
};

const aiActionHistory = activityFeed.filter(
  (activity) => activity.type === "ai_action"
);

const aiActionImpact = useMemo(() => {
  return aiActionCenter.reduce((sum, action) => {
    if (action.category === "Prime Cost") {
      return sum + Number(estimatedPrimeCostLoss || 0);
    }

    if (action.category === "Waste Detection") {
      return (
        sum +
        aiWasteDetection.reduce(
          (total, item) => total + Number(item.estimatedLoss || 0),
          0
        )
      );
    }

    if (action.category === "Inventory") {
      return sum + Number(inventoryAISummary?.estimatedRisk || 0);
    }

    if (action.category === "Vendors") {
      return (
        sum +
        vendorPriceSpikeData.reduce((total, item) => {
          const increase =
            Number(item.latestCost || 0) - Number(item.previousCost || 0);

          return total + Math.max(0, increase * 100);
        }, 0)
      );
    }

    if (action.category === "Labor") {
      return sum + Number(monthlyLaborLoss || 0);
    }

    return sum;
  }, 0);
}, [
  aiActionCenter,
  estimatedPrimeCostLoss,
  aiWasteDetection,
  inventoryAISummary,
  vendorPriceSpikeData,
  monthlyLaborLoss,
]);

const aiFixCards = useMemo(() => {
  return aiActionCenter.map((action) => {
    let fix = "Review the recommended section and apply the highest-impact fix.";
    let impact = "Medium";
    let effort = "Low";

    if (action.category === "Waste Detection") {
      fix = "Review the top ingredient variance, audit prep/portioning, and update recipe rules if needed.";
      impact = "High";
      effort = "Medium";
    }

    if (action.category === "Inventory") {
      fix = "Restock critical ingredients and review days-on-hand forecast.";
      impact = "High";
      effort = "Low";
    }

    if (action.category === "Vendors") {
      fix = "Compare recent invoice pricing, request vendor clarification, and review alternate suppliers.";
      impact = "Medium";
      effort = "Medium";
    }

    if (action.category === "Labor") {
      fix = "Review labor percentage by day/shift and adjust next schedule.";
      impact = "High";
      effort = "Medium";
    }

    if (action.category === "Prime Cost") {
      fix = "Review food cost and labor cost together, then prioritize the larger cost driver.";
      impact = "Critical";
      effort = "Medium";
    }

    return {
      ...action,
      fix,
      impact,
      effort,
    };
  });
}, [aiActionCenter]);

const handleApplyAIFix = (fix) => {
  if (!fix?.title) return;

  setAppliedAIFixes((prev) =>
    prev.includes(fix.title) ? prev : [...prev, fix.title]
  );

  pushActivity(`AI fix applied: ${fix.title}`, "ai_fix");

  setMessage(`AI fix applied: ${fix.title}`);
};

const operationalHealthScore = useMemo(() => {
  let score = 100;

  if (Number(primeCostPercentage || 0) > 65) score -= 18;
  else if (Number(primeCostPercentage || 0) > 60) score -= 10;

  if (Number(liveLaborIntelligence?.laborPercent || 0) > 35) score -= 12;
  else if (Number(liveLaborIntelligence?.laborPercent || 0) > 30) score -= 7;

  if ((criticalInventoryItems || []).length > 0) score -= 12;
  if ((aiWasteDetection || []).length > 0) score -= 12;
  if ((vendorPriceSpikeData || []).some((item) => item.priceChange > 10)) score -= 8;
  if ((lowMarginMenuItems || []).length > 0) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}, [
  primeCostPercentage,
  liveLaborIntelligence,
  criticalInventoryItems,
  aiWasteDetection,
  vendorPriceSpikeData,
  lowMarginMenuItems,
]);

const operationalHealthStatus =
  operationalHealthScore >= 85
    ? "Excellent"
    : operationalHealthScore >= 72
    ? "Healthy"
    : operationalHealthScore >= 60
    ? "Watch Closely"
    : "Critical";

const operationalHealthInsight =
  operationalHealthScore >= 85
    ? "Restaurant operations are performing at a strong level."
    : operationalHealthScore >= 72
    ? "Operations are generally healthy with a few areas to monitor."
    : operationalHealthScore >= 60
    ? "AI detected operational pressure across cost, labor, or inventory."
    : "AI detected critical operational risk that may be reducing profitability.";

const previousOperationalScore = Math.max(
  operationalHealthScore -
    (
      (criticalInventoryItems.length > 0 ? 4 : 0) +
      (aiWasteDetection.length > 0 ? 4 : 0) +
      (lowMarginMenuItems.length > 0 ? 3 : 0)
    ),
  0
);
const inventoryData = ingredientsData || [];
const operationalTrendDelta =
  operationalHealthScore - previousOperationalScore;

const operationalTrend =
  operationalTrendDelta > 3
    ? "Improving"
    : operationalTrendDelta < -3
    ? "Declining"
    : "Stable";

const operationalTrendColor =
  operationalTrend === "Improving"
    ? "#86efac"
    : operationalTrend === "Declining"
    ? "#fca5a5"
    : "#cbd5e1";

const hasOperationalData =
  (salesData || []).length > 0 ||
  (laborData || []).length > 0 ||
  (inventoryData || []).length > 0 ||
  (menuItemsData || []).length > 0 ||
  (invoicesData || []).length > 0;
const aiPriorityQueue = [
  {
    title: "Prime Cost Pressure",
    active: primeCostPercentage > 65,
    severity: "critical",
    description:
      "Prime cost is above healthy operating range.",
  },

  {
    title: "Labor Optimization Needed",
    active: laborPercentage > 35,
    severity: "high",
    description:
      "Labor cost is reducing operational efficiency.",
  },

  {
    title: "Inventory Risk Detected",
    active: criticalInventoryItems.length > 0,
    severity: "high",
    description:
      "Critical inventory depletion detected.",
  },

  {
    title: "Waste Detection Active",
    active: aiWasteDetection.length > 0,
    severity: "medium",
    description:
      "AI detected ingredient variance or operational waste.",
  },

  {
    title: "Vendor Cost Spikes",
    active: vendorPriceSpikeData.some(
      (item) => item.priceChange > 10
    ),
    severity: "medium",
    description:
      "Vendor pricing increased on key ingredients.",
  },
].filter((item) => item.active);

const aiDailyFocus =
  aiPriorityQueue[0]?.title ||
  "Maintain operational consistency";

const aiDailyFocusInsight =
  aiPriorityQueue[0]?.description ||
  "Operations are currently stable across major systems.";

const availableLocations = [
  "all",
  ...new Set(
    [
      ...(salesData || []).map((item) => item.location_name),
      ...(menuItemsData || []).map((item) => item.location_name),
      ...(ingredientsData || []).map((item) => item.location_name),
      ...(laborData || []).map((item) => item.location_name),
      ...(invoicesData || []).map((item) => item.location_name),
    ].filter(Boolean)
  ),
];

const multiLocationSalesRows =
  dbSalesRows?.length
    ? dbSalesRows
    : salesData?.length
    ? salesData
    : pendingUploadRows?.length
    ? pendingUploadRows
    : [];

const locationPerformanceData = useMemo(() => {
  const groups = {};

  (multiLocationSalesRows || []).forEach((sale) => {
    const location =
      sale.location ||
      sale.location_name ||
      sale.store ||
      sale.store_name ||
      sale.restaurant_location ||
      "Main Location";

    const cleanLocation = String(location || "Main Location").trim();

    if (!groups[cleanLocation]) {
      groups[cleanLocation] = {
        name: cleanLocation,
        revenue: 0,
        orders: 0,
      };
    }

    groups[cleanLocation].revenue += Number(
      getSaleRevenue(sale) || 0
    );

    groups[cleanLocation].orders += 1;
  });

  return Object.values(groups).map((location) => ({
    ...location,
    health: Math.min(
      100,
      Math.max(
        0,
        Number(score || Math.round(location.revenue / 1000))
      )
    ),
  }));
}, [multiLocationSalesRows, score]);

const locationOptions = useMemo(() => {
  const locations = new Set();

  (multiLocationSalesRows || []).forEach((sale) => {
    const location =
      sale.location ||
      sale.location_name ||
      sale.store ||
      sale.store_name ||
      sale.restaurant_location ||
      "Main Location";

    locations.add(String(location).trim());
  });

  return Array.from(locations);
}, [multiLocationSalesRows]);

const userRole = String(
  userProfile?.role ||
    userProfile?.account_type ||
    userProfile?.business_role ||
    "owner"
).toLowerCase();

const userAllowedLocations = Array.isArray(userProfile?.location_access)
  ? userProfile.location_access
  : [];

const isRestaurantOwner =
  userRole === "owner" ||
  userRole === "restaurant_owner";

const isManager =
  userRole === "manager" ||
  userRole === "store_manager" ||
  userRole === "general_manager" ||
  userRole === "kitchen_manager";

const canSeeAllLocations =
  isOwner ||
  isRestaurantOwner ||
  userAllowedLocations.includes("all");

const canSeeMultiLocation =
  isOwner ||
  isRestaurantOwner ||
  hasProAccess;

const canSeeOwnerDashboard =
  isOwner ||
  isRestaurantOwner;

const canSeeManagerDashboard =
  isManager && !canSeeOwnerDashboard;

const managerLocationOptions = canSeeAllLocations
  ? locationOptions
  : locationOptions.filter((location) =>
      userAllowedLocations.includes(location)
    );

useEffect(() => {
  if (
    !canSeeAllLocations &&
    managerLocationOptions.length > 0
  ) {
    setActiveLocation(managerLocationOptions[0]);
  }
}, [
  canSeeAllLocations,
  managerLocationOptions,
]);

const deleteLead = async (leadId) => {
  if (!leadId) return;

  const confirmed = window.confirm("Delete this lead permanently?");
  if (!confirmed) return;

  const leadsDelete = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId);

  const customDelete = await supabase
    .from("custom_plan_requests")
    .delete()
    .eq("id", leadId);

  if (leadsDelete.error && customDelete.error) {
    console.error("Delete lead failed:", {
      leadsError: leadsDelete.error,
      customError: customDelete.error,
    });

    alert(
      `Delete failed: ${
        leadsDelete.error?.message || customDelete.error?.message
      }`
    );
    return;
  }

  setLeads((prev) => (prev || []).filter((lead) => lead.id !== leadId));
  setCustomPlanLeads((prev) =>
    (prev || []).filter((lead) => lead.id !== leadId)
  );

  
};
const loadClientImports = async () => {
  try {
    setImportsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setClientImports([]);
      return;
    }

    const { data, error } = await supabase
  .from("uploads")
  .select("*")
  .eq("user_id", user.id)
  .eq("archived", false)
  .order("created_at", { ascending: false })
  .limit(10);
    if (error) {
      console.error("Recent imports fetch error:", error);
      setClientImports([]);
      return;
    }

    setClientImports(data || []);
  } catch (error) {
    console.error("Recent imports load failed:", error);
    setClientImports([]);
  } finally {
    setImportsLoading(false);
  }
};

useEffect(() => {
  loadClientImports();
}, []);

const archiveImport = async (uploadId) => {
  if (!uploadId) {
    alert("Missing upload ID.");
    return;
  }

  console.log("ARCHIVING IMPORT:", uploadId);

  const { error } = await supabase
    .from("uploads")
    .update({ archived: true })
    .eq("id", uploadId);

  if (error) {
    console.error("Archive failed:", error);
    alert(`Archive failed: ${error.message}`);
    return;
  }

  setClientImports((prev) =>
    (prev || []).filter((item) => item.id !== uploadId)
  );

  await loadClientImports();
};

const restoreImport = async (uploadId) => {
  if (!uploadId) return;

  const { error } = await supabase
    .from("uploads")
    .update({
      archived: false,
    })
    .eq("id", uploadId);

  if (error) {
    console.error("Restore failed:", error);
    return;
  }

  await loadClientImports();
};



const isServenAdmin =
  userRole === "serven_admin";

const loadRecipeUsageRules = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return;

  const { data, error } = await supabase
    .from("recipe_usage_rules")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Recipe rules load failed:", error);
    return;
  }

  setRecipeUsageRules(data || []);
};

useEffect(() => {
  loadRecipeUsageRules();
}, []);

const expectedVsActualUsageData = useMemo(() => {
  const rules = recipeUsageRules || [];
  const salesRows = locationSalesData || salesData || [];
  const ingredients = locationIngredientsData || ingredientsData || [];

  return rules.map((rule) => {
    const menuItemName = String(rule.menu_item || "").toLowerCase().trim();

    const totalSold = salesRows
      .filter((sale) => {
        const saleItem =
          sale.item_name ||
          sale.menu_item ||
          sale.name ||
          sale["Item Name"] ||
          "";

        return String(saleItem).toLowerCase().trim() === menuItemName;
      })
      .reduce((sum, sale) => {
        return sum + Number(sale.quantity || sale.qty || sale.orders_count || 1);
      }, 0);

    const expectedUsage =
      totalSold * Number(rule.quantity_used || 0);

    const matchingIngredient = ingredients.find((ing) => {
      const ingName =
        ing.name ||
        ing.ingredient_name ||
        ing["Ingredient Name"] ||
        "";

      return (
        String(ingName).toLowerCase().trim() ===
        String(rule.ingredient).toLowerCase().trim()
      );
    });

    const actualUsage = Number(
      matchingIngredient?.quantity_used ||
        matchingIngredient?.used_quantity ||
        matchingIngredient?.quantity ||
        0
    );

    const variance = actualUsage - expectedUsage;

    const variancePercent =
      expectedUsage > 0 ? (variance / expectedUsage) * 100 : 0;

    return {
      menuItem: rule.menu_item,
      ingredient: rule.ingredient,
      totalSold,
      expectedUsage,
      actualUsage,
      variance,
      variancePercent,
      status:
        Math.abs(variancePercent) > Number(rule.variance_tolerance || 5)
          ? "Variance Detected"
          : "Controlled",
    };
  });
}, [
  recipeUsageRules,
  locationSalesData,
  salesData,
  locationIngredientsData,
  ingredientsData,
]);

const saveRecipeRule = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      alert("Login required");
      return;
    }

    const { error } = await supabase
      .from("recipe_usage_rules")
      .insert([
        {
          user_id: user.id,
          menu_item: recipeMenuItem,
          ingredient: recipeIngredient,
          quantity_used: Number(recipeQuantityUsed || 0),
          variance_tolerance: Number(recipeTolerance || 5),
        },
      ]);

    if (error) {
      console.error("Recipe rule save failed:", error);
      alert(error.message);
      return;
    }

    setRecipeMenuItem("");
    setRecipeIngredient("");
    setRecipeQuantityUsed("");
    setRecipeTolerance(5);

    await loadRecipeUsageRules();

    alert("Recipe rule saved");
  } catch (error) {
    console.error(error);
    alert("Failed to save recipe rule");
  }
};
const recentImportActivity = [
  ...(invoiceUploads || []).map((item) => ({
    ...item,
    upload_type: item.upload_type || "invoice",
    file_name: item.file_name || "Invoice upload",
    uploaded_at: item.uploaded_at || item.created_at || item.invoice_date,
  })),

  ...(laborUploads || []).map((item) => ({
    ...item,
    upload_type: item.upload_type || "labor",
    file_name: item.file_name || "Labor upload",
    uploaded_at: item.uploaded_at || item.created_at || item.work_date,
  })),
].sort(
  (a, b) =>
    new Date(b.uploaded_at || b.created_at || 0) -
    new Date(a.uploaded_at || a.created_at || 0)
);
const fetchRecipeUsageRules = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    const { data, error } = await supabase
      .from("recipe_usage_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    setRecipeUsageRules(data || []);
  } catch (error) {
    console.error("Failed to fetch recipe usage rules:", error);
  }
};
useEffect(() => {
  fetchRecipeUsageRules();
}, []);


console.log("RECIPE COSTING DATA:", recipeCostingData);

const usageVarianceData = useMemo(() => {
  const sales = salesData || [];
  const rules = recipeUsageRules || [];
  const ingredients =
    uploadComparison?.activeIngredients ||
    locationIngredientsData ||
    [];

  return ingredients.map((ingredient) => {
    const ingredientName = String(
      ingredient.name ||
        ingredient.ingredient_name ||
        ingredient["Ingredient Name"] ||
        "Unknown Ingredient"
    )
      .trim()
      .toLowerCase();

    const linkedRules = rules.filter(
      (rule) =>
        String(rule.ingredient || "")
          .trim()
          .toLowerCase() === ingredientName
    );

    let expectedUsage = 0;

    linkedRules.forEach((rule) => {
      const linkedMenuItem = String(
        rule.menu_item || rule.menuItem || ""
      )
        .trim()
        .toLowerCase();

      const quantityUsed = Number(
        rule.quantity_used || rule.amountUsed || 0
      );

      const matchingSales = sales.filter((sale) => {
        const saleItem = String(
          sale.item_name ||
            sale.name ||
            sale.menu_item ||
            sale["Item Name"] ||
            ""
        )
          .trim()
          .toLowerCase();

        return saleItem === linkedMenuItem;
      });

      const totalSold = matchingSales.reduce((sum, sale) => {
        return (
          sum +
          Number(
            sale.quantity ||
              sale.qty ||
              sale.quantity_sold ||
              sale.units_sold ||
              1
          )
        );
      }, 0);

      expectedUsage += totalSold * quantityUsed;
    });

    const actualUsage = Number(
      ingredient.quantity_used ||
        ingredient.usage ||
        ingredient.actual_usage ||
        ingredient.current_usage ||
        0
    );

    const variance = actualUsage - expectedUsage;

    const variancePercent =
      expectedUsage > 0
        ? (variance / expectedUsage) * 100
        : 0;

    let status = "Controlled";

    if (variancePercent > 15) {
      status = "Critical Waste Risk";
    } else if (variancePercent > 8) {
      status = "Waste Risk";
    } else if (variancePercent > 5) {
      status = "Minor Variance";
    }

    return {
      ingredientName:
        ingredient.name ||
        ingredient.ingredient_name ||
        "Unknown Ingredient",

      expectedUsage,
      actualUsage,
      variance,
      variancePercent,
      status,
      linkedRecipeCount: linkedRules.length,
    };
  });
}, [
  salesData,
  recipeUsageRules,
  uploadComparison,
  locationIngredientsData,
]);

const vendorCostInsights = useMemo(() => {
  const invoices = invoicesData || [];

  const grouped = {};

  invoices.forEach((invoice) => {
    const vendor =
      invoice.vendor ||
      invoice.vendor_name ||
      invoice.supplier ||
      "Unknown Vendor";

    const ingredient =
      invoice.ingredient_name ||
      invoice.item_name ||
      invoice.product_name ||
      "Unknown Ingredient";

    const unitCost = Number(
      invoice.unit_cost ||
        invoice.cost_per_unit ||
        invoice.price_per_unit ||
        invoice.cost ||
        0
    );

    const key = `${vendor}-${ingredient}`;

    if (!grouped[key]) {
      grouped[key] = {
        vendor,
        ingredient,
        costs: [],
      };
    }

    grouped[key].costs.push(unitCost);
  });

  return Object.values(grouped).map((entry) => {
    const costs = entry.costs.filter((c) => c > 0);

    const avgCost =
      costs.length > 0
        ? costs.reduce((sum, c) => sum + c, 0) / costs.length
        : 0;

    const latestCost = costs[costs.length - 1] || 0;

    const increasePercent =
      avgCost > 0
        ? ((latestCost - avgCost) / avgCost) * 100
        : 0;

    let status = "Stable";

    if (increasePercent > 20) {
      status = "Critical Increase";
    } else if (increasePercent > 10) {
      status = "Rising Costs";
    }

    return {
      vendor: entry.vendor,
      ingredient: entry.ingredient,
      avgCost,
      latestCost,
      increasePercent,
      status,
    };
  });
}, [invoicesData]);

const staffingRecommendations = useMemo(() => {
  return (shiftOperationalData || []).map((shift) => {
    let recommendation =
      "Shift staffing levels are operating efficiently.";

    let priority = "Stable";

    if (shift.laborPercent > 35) {
      recommendation =
        "Reduce staffing levels or shorten low-efficiency labor hours during this shift.";

      priority = "Critical";
    } else if (shift.laborPercent > 28) {
      recommendation =
        "Monitor scheduling closely and optimize labor allocation.";

      priority = "Watch";
    } else if (shift.avgOrderValue > 45) {
      recommendation =
        "High-value shift detected. Consider prioritizing strongest staff during this window.";

      priority = "Opportunity";
    }

    return {
      shift: shift.shift,
      laborPercent: shift.laborPercent,
      revenue: shift.revenue,
      avgOrderValue: shift.avgOrderValue,
      recommendation,
      priority,
    };
  });
}, [shiftOperationalData]);

const operationalAlerts = useMemo(() => {
  const alerts = [];

  // Margin Risks
  (recipeCostingData || []).forEach((item) => {
    if (Number(item.margin || 0) < 55) {
      alerts.push({
        type: "Margin Risk",
        severity:
          Number(item.margin || 0) < 45 ? "Critical" : "Warning",

        title: `${item.itemName} has weak profitability`,
        detail: `Current margin is ${Number(
          item.margin || 0
        ).toFixed(1)}%`,

        recommendation: item.recommendation,
      });
    }
  });

  // Usage Variance
  (usageVarianceData || []).forEach((item) => {
    if (Number(item.variancePercent || 0) > 8) {
      alerts.push({
        type: "Waste Detection",
        severity:
          Number(item.variancePercent || 0) > 15
            ? "Critical"
            : "Warning",

        title: `${item.ingredientName} usage variance detected`,
        detail: `${Number(item.variancePercent || 0).toFixed(
          1
        )}% variance from expected usage`,

        recommendation:
          "Review portioning, waste, and inventory handling procedures.",
      });
    }
  });

  // Vendor Cost Increases
  (vendorCostInsights || []).forEach((item) => {
    if (Number(item.increasePercent || 0) > 10) {
      alerts.push({
        type: "Vendor Cost Increase",
        severity:
          Number(item.increasePercent || 0) > 20
            ? "Critical"
            : "Warning",

        title: `${item.vendor} pricing increased`,
        detail: `${Number(item.increasePercent || 0).toFixed(
          1
        )}% increase detected for ${item.ingredient}`,

        recommendation:
          "Review vendor pricing and consider alternative suppliers.",
      });
    }
  });

  // Labor Risks
  (shiftOperationalData || []).forEach((shift) => {
    if (Number(shift.laborPercent || 0) > 28) {
      alerts.push({
        type: "Labor Efficiency",
        severity:
          Number(shift.laborPercent || 0) > 35
            ? "Critical"
            : "Warning",

        title: `${shift.shift} shift labor inefficiency`,
        detail: `${Number(shift.laborPercent || 0).toFixed(
          1
        )}% labor cost detected`,

        recommendation:
          "Adjust staffing levels or optimize scheduling during this shift.",
      });
    }
  });

  return alerts.slice(0, 12);
}, [
  recipeCostingData,
  usageVarianceData,
  vendorCostInsights,
  shiftOperationalData,
]);

const forecastingInsights = useMemo(() => {
  const sales = salesData || [];

  if (!sales.length) return [];

  const recentSales = sales.slice(-14);

  const totalRevenue = recentSales.reduce((sum, sale) => {
    return (
      sum +
      Number(
        sale.revenue ||
          sale.total ||
          sale.amount ||
          sale.sales ||
          0
      )
    );
  }, 0);

  const avgRevenue =
    recentSales.length > 0
      ? totalRevenue / recentSales.length
      : 0;

  const projectedMonthlyRevenue = avgRevenue * 30;

  const avgLaborPercent =
    shiftOperationalData?.length > 0
      ? shiftOperationalData.reduce(
          (sum, shift) => sum + Number(shift.laborPercent || 0),
          0
        ) / shiftOperationalData.length
      : 0;

  const avgMargin =
    recipeCostingData?.length > 0
      ? recipeCostingData.reduce(
          (sum, item) => sum + Number(item.margin || 0),
          0
        ) / recipeCostingData.length
      : 0;

  let revenueTrend = "Stable";

  if (projectedMonthlyRevenue > avgRevenue * 32) {
    revenueTrend = "Growing";
  } else if (projectedMonthlyRevenue < avgRevenue * 26) {
    revenueTrend = "Declining";
  }

  let operationalRisk = "Controlled";

  if (avgLaborPercent > 35 || avgMargin < 50) {
    operationalRisk = "Critical";
  } else if (avgLaborPercent > 28 || avgMargin < 60) {
    operationalRisk = "Watch Closely";
  }

  return [
    {
      label: "Projected Monthly Revenue",
      value: `$${projectedMonthlyRevenue.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`,
      subtext: "AI revenue forecast",
    },

    {
      label: "Revenue Trend",
      value: revenueTrend,
      subtext: "based on recent sales velocity",
    },

    {
      label: "Operational Risk",
      value: operationalRisk,
      subtext: "AI operational forecast",
    },

    {
      label: "Projected Avg Margin",
      value: `${avgMargin.toFixed(1)}%`,
      subtext: "forecasted profitability health",
    },
  ];
}, [
  salesData,
  shiftOperationalData,
  recipeCostingData,
]);

const topAIAction = useMemo(() => {
  const alerts = operationalAlerts || [];

  if (!alerts.length) {
    return {
      title: "Operations Stable",
      category: "Monitoring",
      impact: "+0/mo",
      recommendation:
        "No critical operational risks detected. Continue monitoring restaurant performance.",
      severity: "Healthy",
    };
  }

  const priorityOrder = {
    Critical: 3,
    Warning: 2,
    Healthy: 1,
  };

  const topAlert = [...alerts].sort(
    (a, b) =>
      (priorityOrder[b.severity] || 0) -
      (priorityOrder[a.severity] || 0)
  )[0];

  let estimatedImpact = "+$500/mo";

  if (topAlert.type === "Margin Risk") {
    estimatedImpact = "+$2,000/mo";
  } else if (topAlert.type === "Waste Detection") {
    estimatedImpact = "+$3,500/mo";
  } else if (topAlert.type === "Labor Efficiency") {
    estimatedImpact = "+$1,800/mo";
  } else if (topAlert.type === "Vendor Cost Increase") {
    estimatedImpact = "+$1,200/mo";
  }

  return {
    title: topAlert.title,
    category: topAlert.type,
    impact: estimatedImpact,
    recommendation: topAlert.recommendation,
    severity: topAlert.severity,
  };
}, [operationalAlerts]);

const autopilotActions = useMemo(() => {
  const actions = [];

  (operationalAlerts || []).forEach((alert) => {
    if (alert.severity === "Critical") {
      actions.push({
        type: "critical_alert",
        title: alert.title,
        action: "Immediate operational review recommended by AI Autopilot.",
        priority: "Critical",
      });
    }
  });

  (staffingRecommendations || []).forEach((item) => {
    if (item.priority === "Critical" || item.priority === "Opportunity") {
      actions.push({
        type: "staffing",
        title: `${item.shift} staffing optimization`,
        action: item.recommendation,
        priority: item.priority,
      });
    }
  });

  (forecastingInsights || []).forEach((forecast) => {
    if (
      forecast.label === "Operational Risk" &&
      forecast.value !== "Controlled"
    ) {
      actions.push({
        type: "forecasting",
        title: "Operational risk forecast detected",
        action: "AI forecasting identified elevated operational risk trends.",
        priority: forecast.value === "Critical" ? "Critical" : "Watch",
      });
    }
  });

  return actions.slice(0, 10);
}, [operationalAlerts, staffingRecommendations, forecastingInsights]);
const aiProfitRecoveryData = useMemo(() => {
  const alerts = operationalAlerts || [];
  const actions = autopilotActions || [];

  let recovered = 0;
  let projected = 0;

  alerts.forEach((alert) => {
    if (alert.type === "Margin Risk") projected += 2000;
    if (alert.type === "Waste Detection") projected += 3500;
    if (alert.type === "Labor Efficiency") projected += 1800;
    if (alert.type === "Vendor Cost Increase") projected += 1200;
  });

  actions.forEach((action) => {
    if (action.priority === "Critical") recovered += 750;
    if (action.priority === "Opportunity") recovered += 500;
    if (action.priority === "Watch") recovered += 250;
  });

  const totalOpportunity = projected + recovered;

  return {
    recovered,
    projected,
    totalOpportunity,
    alertCount: alerts.length,
    actionCount: actions.length,
  };
}, [operationalAlerts, autopilotActions]);

const resolutionTrackingData = useMemo(() => {
  const alerts = operationalAlerts || [];

  const resolved =
    activityFeed?.filter((item) =>
      String(item.message || "")
        .toLowerCase()
        .includes("reviewed")
    ) || [];

  const unresolved = alerts.length - resolved.length;

  const criticalUnresolved = alerts.filter(
    (alert) => alert.severity === "Critical"
  ).length;

  const recurringRisk =
    criticalUnresolved >= 3
      ? "Escalating"
      : criticalUnresolved >= 1
      ? "Monitoring"
      : "Controlled";

  return {
    resolvedCount: resolved.length,
    unresolvedCount:
      unresolved > 0 ? unresolved : 0,
    criticalUnresolved,
    recurringRisk,
  };
}, [operationalAlerts, activityFeed]);

const escalationInsights = useMemo(() => {
  const unresolved =
    resolutionTrackingData?.unresolvedCount || 0;

  const critical =
    resolutionTrackingData?.criticalUnresolved || 0;

  let escalationLevel = "Controlled";
  let escalationMessage =
    "No recurring operational risks detected.";

  if (critical >= 3) {
    escalationLevel = "Critical";
    escalationMessage =
      "Multiple unresolved critical operational risks detected. Immediate intervention recommended.";
  } else if (critical >= 1 || unresolved >= 5) {
    escalationLevel = "Monitoring";
    escalationMessage =
      "Operational risks remain unresolved and should be reviewed.";
  }

  return {
    escalationLevel,
    escalationMessage,
    unresolved,
    critical,
  };
}, [resolutionTrackingData]);

const operationalTimeline = useMemo(() => {
  const timeline = [];

  (operationalAlerts || []).forEach((alert, index) => {
    timeline.push({
      type: "alert",
      title: alert.title,
      detail: alert.detail,
      severity: alert.severity,
      timestamp:
        alert.created_at ||
        alert.date ||
        new Date().toISOString(),
      priority:
        alert.severity === "Critical"
          ? 3
          : 2,
    });
  });

  (activityFeed || []).forEach((activity, index) => {
    timeline.push({
      type: "activity",
      title: activity.message || "Operational activity",
      detail: activity.category || "AI System",
      severity: "Info",
      timestamp:
        activity.created_at ||
        new Date().toISOString(),
      priority: 1,
    });
  });

  return timeline
    .sort(
      (a, b) =>
        new Date(b.timestamp) -
        new Date(a.timestamp)
    )
    .slice(0, 20);
}, [operationalAlerts, activityFeed]);

const operationalMemoryInsights = useMemo(() => {
  const timeline = operationalTimeline || [];

  const grouped = {};

  timeline.forEach((item) => {
    const key =
      item.title ||
      item.type ||
      "Unknown";

    if (!grouped[key]) {
      grouped[key] = 0;
    }

    grouped[key] += 1;
  });

  const recurringIssues = Object.entries(grouped)
    .filter(([_, count]) => count >= 2)
    .map(([title, count]) => ({
      title,
      occurrences: count,
      severity:
        count >= 5
          ? "Critical"
          : count >= 3
          ? "Warning"
          : "Monitoring",
    }))
    .sort((a, b) => b.occurrences - a.occurrences);

  return recurringIssues.slice(0, 10);
}, [operationalTimeline]);
const operationalPatternForecast = useMemo(() => {
  const recurring = operationalMemoryInsights || [];

  const criticalPatterns = recurring.filter(
    (issue) => issue.severity === "Critical"
  ).length;

  const warningPatterns = recurring.filter(
    (issue) => issue.severity === "Warning"
  ).length;

  let forecastStatus = "Stable";
  let forecastMessage =
    "Operational patterns appear controlled with low recurring risk.";

  if (criticalPatterns >= 2) {
    forecastStatus = "High Risk";
    forecastMessage =
      "AI forecasting predicts elevated operational instability based on recurring critical patterns.";
  } else if (warningPatterns >= 2) {
    forecastStatus = "Watch Closely";
    forecastMessage =
      "Recurring warning patterns may develop into larger operational risks.";
  }

  return {
    forecastStatus,
    forecastMessage,
    criticalPatterns,
    warningPatterns,
  };
}, [operationalMemoryInsights]);
const autonomousOperations = useMemo(() => {
  const actions = [];

  // Escalation-driven actions
  if (
    escalationInsights?.escalationLevel === "Critical"
  ) {
    actions.push({
      type: "escalation",
      priority: "Critical",
      title: "Critical operational intervention required",
      action:
        "AI recommends immediate management review of recurring operational failures.",
    });
  }

  // Pattern forecasting actions
  if (
    operationalPatternForecast?.forecastStatus === "High Risk"
  ) {
    actions.push({
      type: "forecast",
      priority: "Critical",
      title: "Operational instability forecasted",
      action:
        "AI forecasting predicts elevated operational instability based on recurring operational behavior.",
    });
  }

  // Autopilot opportunities
  (autopilotActions || []).forEach((item) => {
    if (
      item.priority === "Critical" ||
      item.priority === "Opportunity"
    ) {
      actions.push({
        type: "autopilot",
        priority: item.priority,
        title: item.title,
        action: item.action,
      });
    }
  });

  return actions.slice(0, 10);
}, [
  escalationInsights,
  operationalPatternForecast,
  autopilotActions,
]);

const aiCommandCenter = useMemo(() => {
  const criticalEscalations =
    escalationInsights?.critical || 0;

  const autonomousCount =
    autonomousOperations?.length || 0;

  const recurringCritical =
    (operationalMemoryInsights || []).filter(
      (item) => item.severity === "Critical"
    ).length;

  let commandStatus = "Stable";
  let commandMessage =
    "Restaurant operations appear stable across monitored AI systems.";

  if (
    criticalEscalations >= 2 ||
    recurringCritical >= 2
  ) {
    commandStatus = "Critical";
    commandMessage =
      "AI Command Center detected elevated operational instability requiring immediate review.";
  } else if (
    autonomousCount >= 3 ||
    recurringCritical >= 1
  ) {
    commandStatus = "Monitoring";
    commandMessage =
      "AI systems are actively monitoring recurring operational risks.";
  }

  return {
    commandStatus,
    commandMessage,
    criticalEscalations,
    autonomousCount,
    recurringCritical,
  };
}, [
  escalationInsights,
  autonomousOperations,
  operationalMemoryInsights,
]);

if (!hasPaidAccess) {
  return ( <ErrorBoundary>
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, rgba(109,61,245,0.15), transparent 38%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
        color: "white",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          padding: "34px",
          borderRadius: "24px",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.88))",
          border: "1px solid rgba(148,163,184,0.18)",
          boxShadow: "0 24px 70px rgba(2,6,23,0.45)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "7px 12px",
            borderRadius: "999px",
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.24)",
            color: "#fbbf24",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Access Pending
        </div>

        <h2
          style={{
            fontSize: "30px",
            fontWeight: "950",
            margin: "0 0 10px",
          }}
        >
          Account Under Review
        </h2>

        <p
          style={{
            color: "#94a3b8",
            margin: "0 auto",
            fontSize: "14px",
            lineHeight: 1.7,
            maxWidth: "420px",
          }}
        >
          We’re reviewing your custom plan request. You’ll receive access after
          your plan is finalized and activated.
        </p>

        <div
          style={{
            marginTop: "22px",
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#cbd5e1",
            fontSize: "12px",
          }}
        >
          Signed in as:{" "}
          <strong style={{ color: "white" }}>
            {normalizedEmail || "Unknown user"}
          </strong>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
console.log("ACCESS DEBUG:", {
  normalizedEmail,
  effectivePlan,
  normalizedPlan,
  normalizedStatus,
  hasPaidAccess,
  userProfile,
});
return (
  <ErrorBoundary>
  <div
  style={{
    ...pageStyle,
    width: "100%",
    maxWidth: "100vw",
    overflowX: "hidden",
  }}
>
<style jsx global>{`
  html,
  body {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }

  * {
    box-sizing: border-box;
  }

  #__next {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }

  svg,
  canvas,
  table,
  img {
    max-width: 100%;
  }

  .recharts-wrapper,
  .recharts-surface {
    max-width: 100% !important;
    overflow: hidden !important;
  }

  @media (max-width: 768px) {
    body {
      position: relative;
      touch-action: pan-y;
    }

    div,
    section,
    main,
    aside {
      max-width: 100%;
    }

    button,
    a,
    input,
    select {
      max-width: 100%;
    }

    h1,
    h2,
    h3,
    p,
    span,
    div {
      overflow-wrap: anywhere;
    }

    table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }
  }
`}</style>
    {isOwner && (
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          borderRadius: "12px",
          background: "#111827",
          color: "white",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: "700" }}>
          DEV PLAN:
        </span>


        {["starter", "growth", "pro"].map((plan) => (
          <button
            key={plan}
            onClick={() => setDevPlan(plan)}
            type="button"
            style={{
              padding: "7px 12px",
              fontSize: "12px",
              borderRadius: "999px",
              border: "none",
              background:
                devPlan === plan
                  ? "linear-gradient(135deg, #4f46e5, #6D3DF5)"
                  : "#374151",
              color: "white",
              cursor: "pointer",
              fontWeight: "800",
              boxShadow:
                devPlan === plan
                  ? "0 10px 20px rgba(79,70,229,0.20)"
                  : "none",
            }}
          >
            {plan.toUpperCase()}
          </button>
        ))}

        <div
          style={{
            marginLeft: "8px",
            padding: "6px 10px",
            borderRadius: "999px",
            background: "#1f2937",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          Current Plan: {effectivePlan}
        </div>
      </div>
    )}

    <div style={dashboardShellStyle}>
      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        <div style={sidebarTitleStyle}>SERVEN COMMAND</div>
        {isMobile && (
  <select
    value={activeTab}
    onChange={(e) => setActiveTab(e.target.value)}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "12px",
      background: "#020617",
      color: "white",
      border: "1px solid rgba(255,255,255,0.14)",
      fontWeight: "800",
      marginBottom: "10px",
    }}
  >
    {sidebarTabs.map((tab) => (
      <option key={tab.key} value={tab.key}>
        {tab.icon} {tab.label} {tab.locked ? "🔒" : ""}
      </option>
    ))}
  </select>
)}
<button
  type="button"
  onClick={() => {
    console.log("LOGOUT CLICKED");

    localStorage.clear();
    sessionStorage.clear();

    supabase.auth.signOut();

    window.location.replace("/");
  }}
  style={{
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
  }}
>
  Log Out
</button>

{!isMobile && sidebarTabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={getTabButtonStyle(isActive, tab.locked)}
            >
              <span style={{ display: "flex", gap: "10px" }}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </span>

              <span>{tab.locked ? "🔒" : isActive ? "•" : ""}</span>
            </button>
          );
        })}

        <div style={sidebarFooterStyle}>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.72)" }}>
            Active plan
          </div>
          <div style={{ fontSize: "16px", fontWeight: "800", marginTop: "4px" }}>
            {effectivePlan ? effectivePlan.toUpperCase() : "STARTER"}
          </div>

          {!hasProAccess && (
            <div style={upgradePillStyle}>Upgrade for more AI power</div>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div style={contentAreaStyle}>
{/* ================================ */}
{/* FIRST-TIME CLIENT SETUP CARD */}
{/* ================================ */}
{activeTab === "overview" && (
  <>
  {(canSeeOwnerDashboard || canSeeManagerDashboard) && (
  <>
    {/* WELCOME / UPLOAD SECTION HERE */}
  
    <div
      style={{
        marginBottom: "24px",
        padding: "28px",
        borderRadius: "26px",
        background:
          "radial-gradient(circle at top right, rgba(109,61,245,0.28), transparent 32%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))",
        border: "1px solid rgba(167,139,250,0.24)",
        boxShadow: "0 24px 70px rgba(2,6,23,0.34)",
      }}
    >
      <div
        style={{
          color: "#d4af37",
          fontSize: "12px",
          fontWeight: "900",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        Welcome to SerVen
      </div>
<input
  id="csvUpload"
  type="file"
  accept=".csv,.xlsx,.xls"
  onChange={handleFileUpload}
  style={{ display: "none" }}
/>

<input
  id="invoiceUpload"
  type="file"
  accept=".pdf"
  multiple
  onChange={handleInvoiceUpload}
  style={{ display: "none" }}
/>

{uploadError && (
  <div
    style={{
      marginTop: "12px",
      padding: "12px",
      borderRadius: "12px",
      background: "rgba(239,68,68,0.10)",
      border: "1px solid rgba(239,68,68,0.22)",
      color: "#fca5a5",
      fontSize: "13px",
      fontWeight: "800",
    }}
  >
    {uploadError}
  </div>
)}
      <h2
        style={{
          color: "white",
          fontSize: "30px",
          fontWeight: "950",
          margin: "0 0 10px",
        }}
      >
        Connect your restaurant data to unlock your first AI insights
      </h2>

      <p
        style={{
          color: "#cbd5e1",
          fontSize: "15px",
          lineHeight: 1.7,
          maxWidth: "780px",
          margin: "0 0 22px",
        }}
      >
        Upload your POS sales data, menu items, or ingredients to generate
        revenue trends, profit leaks, food cost alerts, and AI-powered
        recommendations.
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
  <button
    onClick={() => {
      selectedUploadTypeRef.current = "pos";
      setUploadType("pos");
      document.getElementById("csvUpload")?.click();
    }}
    style={setupPrimaryButton}
  >
    Upload POS Data
  </button>
<button
  onClick={() => {
    selectedUploadTypeRef.current = "labor";
    setUploadType("labor");
    document.getElementById("csvUpload")?.click();
  }}
  style={setupPrimaryButton}
>
  Upload Labor Data
</button>

  <button
    onClick={() => {
      selectedUploadTypeRef.current = "menu_items";
      setUploadType("menu_items");
      document.getElementById("csvUpload")?.click();
    }}
    style={setupSecondaryButton}
  >
    Upload Menu Items
  </button>

  <button
    onClick={() => {
      selectedUploadTypeRef.current = "ingredients";
      setUploadType("ingredients");
      document.getElementById("csvUpload")?.click();
    }}
    style={setupGoldButton}
  >
    Upload Ingredients
  </button>

  <button
  onClick={() => {
    selectedUploadTypeRef.current = "invoices";
    setUploadType("invoices");
    document.getElementById("csvUpload")?.click();
  }}
  style={setupSecondaryButton}
>
  Upload Invoices
</button>
</div>
    </div>
</>
)}
{/* UPLOAD SUMMARY + CONFIRM */}
{pendingUploadSummary && (
  <div
    style={{
      marginTop: "14px",
      padding: "14px 16px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(148,163,184,0.16)",
      width: "100%",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        alignItems: "flex-start",
      }}
    >
      <div>
        <div style={{ color: "white", fontWeight: "800", fontSize: "14px" }}>
          {pendingUploadSummary.fileName || "Uploaded file"}
        </div>

        <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
          {Number(pendingUploadSummary.rowCount || 0).toLocaleString()} rows ready
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setPendingUploadSummary(null);
          setMenuItemsData([]);
          setIngredientsData([]);
          setMessage("");
        }}
        style={{
          border: "none",
          background: "rgba(239,68,68,0.12)",
          color: "#f87171",
          borderRadius: "10px",
          padding: "8px 12px",
          fontWeight: "800",
          cursor: "pointer",
        }}
      >
        X
      </button>
    </div>

   <button
  type="button"
  onClick={() => {
    const currentType =
  pendingUploadSummary?.uploadType ||
  selectedUploadTypeRef.current ||
  uploadType;

    if (currentType === "menu_items") {
      handleImportMenuItems();

    } else if (currentType === "ingredients") {
      handleImportIngredients();

    } else if (currentType === "labor") {
      handleImportLabor();

    } else if (currentType === "invoices") {
      handleImportInvoices();

    } else if (currentType === "pos") {
      handleImportSales();

    } else {
      setMessage("No matched upload type.");
    }
  }}
  style={{
    marginTop: "12px",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
  }}
>
  Confirm Import
</button>
  </div>
)}
{/* MESSAGE */}
{message && (
  <div
    style={{
      marginTop: "10px",
      fontSize: "13px",
      color: "#94a3b8",
    }}
  >
    {message}
  </div>
)}
{/* CLIENT RECENT IMPORTS */}

<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 18px 50px rgba(2,6,23,0.22)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "14px",
    }}
  >
    <div>
      <div
        style={{
          color: "#a5b4fc",
          fontSize: "12px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}
      >
        Recent Upload Activity
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: "24px",
          fontWeight: "950",
          color: "white",
        }}
      >
        Recent Imports
      </h3>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(148,163,184,0.12)",
        color: "#cbd5e1",
        fontSize: "12px",
        fontWeight: "900",
      }}
    >
      {clientImports.length} Total Imports
    </div>
  </div>

  <p
    style={{
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.7,
      marginBottom: "18px",
    }}
  >
    AI continuously analyzes uploaded operational data to generate restaurant intelligence.
  </p>

  {importsLoading ? (
    <div
      style={{
        color: "#94a3b8",
        fontSize: "14px",
      }}
    >
      Loading recent imports...
    </div>
  ) : clientImports.length === 0 ? (
    <div
      style={{
        padding: "18px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(148,163,184,0.10)",
        color: "#94a3b8",
        textAlign: "center",
        fontSize: "14px",
      }}
    >
      No restaurant data imports detected yet.
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      {clientImports
        .sort(
          (a, b) =>
            new Date(b.created_at || 0) -
            new Date(a.created_at || 0)
        )
        .slice(0, 6)
        .map((item, index) => (
          <div
            key={item.id || index}
            style={{
              padding: "16px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(148,163,184,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: "900",
                    color: "white",
                    fontSize: "15px",
                    marginBottom: "6px",
                  }}
                >
                  {item.file_name ||
                    item.source_name ||
                    "Imported File"}
                </div>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  Source: {item.source_name || "Unknown"} •{" "}
                  {Number(item.row_count || 0).toLocaleString()} rows
                </div>
              </div>

              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "12px",
                  background: "rgba(99,102,241,0.10)",
                  border: "1px solid rgba(99,102,241,0.20)",
                  color: "#c7d2fe",
                  fontSize: "12px",
                  fontWeight: "900",
                }}
              >
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "Recent"}
              </div>
            </div>

            {canSeeOwnerDashboard && (
              <button
                onClick={() => archiveImport(item.id)}
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(148,163,184,0.16)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: "900",
                  cursor: "pointer",
                }}
              >
                Archive Import
              </button>
            )}
          </div>
        ))}
    </div>
  )}
</div>

   {/* OVERVIEW HERO */}
<div
  style={{
    position: "relative",
    overflow: "hidden",
    padding: "24px",
    borderRadius: "22px",
    background:
      "radial-gradient(circle at top right, rgba(255,255,255,0.14), transparent 30%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #1e1b4b 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 18px 50px rgba(15,23,42,0.18)",
    marginBottom: "20px",
  }}
>
  <div
    style={{
      display: "inline-flex",
      padding: "6px 10px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.08)",
      fontSize: "11px",
      fontWeight: "800",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#c7d2fe",
      marginBottom: "12px",
    }}
  >
    Dashboard Overview
  </div>



 
<input
  id="csvUpload"
  type="file"
  accept=".csv,.xlsx,.xls"
  onChange={handleFileUpload}
  style={{ display: "none" }}
/>

<input
  id="invoiceUpload"
  type="file"
  accept=".pdf"
  multiple
  onChange={handleInvoiceUpload}
  style={{ display: "none" }}
/>

{uploadError && (
  <div
    style={{
      marginTop: "12px",
      padding: "12px",
      borderRadius: "12px",
      background: "rgba(239,68,68,0.10)",
      border: "1px solid rgba(239,68,68,0.22)",
      color: "#fca5a5",
      fontSize: "13px",
      fontWeight: "800",
    }}
  >
    {uploadError}
  </div>
)}


 
  <input
    id="invoiceUpload"
    type="file"
    accept=".pdf"
    multiple
    onChange={handleInvoiceUpload}
    style={{ display: "none" }}
  />

 <WeeklyExecutiveSummary
  weeklyExecutiveSummary={weeklyExecutiveSummary}
  revenueTrend={revenueTrend}
  avgMargin={avgMargin}
  foodCostPercentage={foodCostPercentage}
  restaurantName={userProfile?.restaurant_name}
  revenueChartData={revenueTrend?.chartData || []}

  alcoholRevenue={alcoholRevenue}
  alcoholRevenuePercent={alcoholRevenuePercent}
  topAlcoholItemName={topAlcoholItemName}
  topBeverageCategory={topBeverageCategory}
  alcoholMarginStatus={alcoholMarginStatus}
/>

{/* 🚨 AI RISK ALERTS */}


<AICommandCenter
  activeAiCommandTab={activeAiCommandTab}
  setActiveAiCommandTab={setActiveAiCommandTab}
  filteredAiAlerts={filteredAiAlerts}
  handleViewAlertFix={handleViewAlertFix}
  handleResolveAlert={handleResolveAlert}
  handleIgnoreAlert={handleIgnoreAlert}
  autopilotRecommendation={autopilotRecommendation}
  uploadComparison={uploadComparison}
  handleApplyAiFix={handleApplyAiFix}
  hasGrowthAccess={hasGrowthAccess}
  fetchAIInsights={fetchAIInsights}
  router={router}
  hasProAccess={hasProAccess}
  runRealProfitEngine={runRealProfitEngine}
  realProfitLoading={realProfitLoading}
  realProfitEngine={realProfitEngine}
  appliedFixes={appliedFixes}
  setSimulatedProfit={setSimulatedProfit}
  setMessage={setMessage}
  setAppliedFixes={setAppliedFixes}
/>
{/* 💰 MAIN REVENUE CARD (REAL DATA) */}
<div
  style={{
    padding: "20px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    marginBottom: "16px",
  }}
>
  <div style={{ color: "#94a3b8", fontSize: "12px" }}>
    Total Revenue
  </div>

  <div
    style={{
      color: "white",
      fontSize: "32px",
      fontWeight: "900",
      marginTop: "6px",
    }}
  >
    $
    {Number(realSalesMetrics.totalRevenueFromDb || 0).toLocaleString()}
  </div>

  <div
    style={{
      marginTop: "6px",
      fontSize: "12px",
      color: "#94a3b8",
    }}
  >
    Based on {dbSalesRows.length} sales records
  </div>
</div>{/* 🔴 LIVE PROMO */}
{websitePromo && (
  <div
    style={{
      marginBottom: "22px",
      padding: "22px",
      borderRadius: "20px",
      background:
        "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 30%), linear-gradient(135deg, #10b981, #059669)",
      color: "white",
      boxShadow: "0 18px 50px rgba(5,150,105,0.28)",
      border: "1px solid rgba(255,255,255,0.14)",
    }}
  >
    <div
      style={{
        fontSize: "11px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        padding: "6px 10px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.18)",
        marginBottom: "10px",
        display: "inline-block",
      }}
    >
      🔴 LIVE PROMOTION
    </div>

    <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "900" }}>
      {websitePromo.title}
    </h3>

    <p style={{ fontSize: "14px", margin: "0 0 12px 0", lineHeight: 1.6 }}>
      {websitePromo.body}
    </p>

    <button
      onClick={handleEndCampaign}
      style={{
        padding: "9px 14px",
        borderRadius: "10px",
        border: "none",
        background: "rgba(255,255,255,0.20)",
        color: "white",
        fontWeight: "900",
        cursor: "pointer",
      }}
    >
      End Campaign
    </button>
  </div>
)}
{canSeeOwnerDashboard && (
<OwnerLeadsPanel
  filteredCustomPlanLeads={filteredCustomPlanLeads}
  customPlanLeads={customPlanLeads}
  setLeadStatusFilter={setLeadStatusFilter}
  leadStatusFilter={leadStatusFilter}
  loadingCustomPlanLeads={loadingCustomPlanLeads}
  updateLeadStatus={updateLeadStatus}
  getLeadStatusStyle={getLeadStatusStyle}
  leadMiniBox={leadMiniBox}
  leadMiniLabel={leadMiniLabel}
  leadMiniValue={leadMiniValue}
  dealInputStyle={dealInputStyle}
  updateLeadDealField={updateLeadDealField}
  updateLeadStripeLink={updateLeadStripeLink}
  activateClient={activateClient}
  deleteLead={deleteLead}
/>
)}
{canSeeOwnerDashboard && (
  <RiskPanel
    riskPanelCardStyle={riskPanelCardStyle}
    riskStatCardStyle={riskStatCardStyle}
    sortedRiskClients={sortedRiskClients}
    highRiskClients={highRiskClients}
    watchClients={watchClients}
    healthyClients={healthyClients}
    selectedRiskClient={selectedRiskClient}
    setSelectedRiskClient={setSelectedRiskClient}
    getRiskStatusText={getRiskStatusText}
    getRiskArrow={getRiskArrow}
    openRiskEmailModal={openRiskEmailModal}
    markRiskClientReviewed={markRiskClientReviewed}
    isRiskClientReviewed={isRiskClientReviewed}
  />
)}
</div>

{/* 🧠 OPERATIONAL HEALTH SCORE */}
<div
  style={{
    marginBottom: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(99,102,241,0.18)",
  }}
>
  <div style={{ color: "#a5b4fc", fontSize: "12px", fontWeight: "900" }}>
    OPERATIONAL HEALTH SCORE
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: "18px",
      flexWrap: "wrap",
      marginTop: "10px",
    }}
  >
    <div>
      <div style={{ color: "white", fontSize: "44px", fontWeight: "950" }}>
        {operationalHealthScore}
      </div>

      <div style={{ color: "#cbd5e1", fontSize: "14px", fontWeight: "800" }}>
        {operationalHealthStatus}
        <div
  style={{
    marginTop: "8px",
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(148,163,184,0.14)",
    color: operationalTrendColor,
    fontSize: "12px",
    fontWeight: "900",
  }}
>
  {operationalTrend}
</div>
      </div>
    </div>

    <div style={{ maxWidth: "620px" }}>
      <div style={{ color: "#e2e8f0", fontSize: "15px", lineHeight: 1.7 }}>
        {operationalHealthInsight}
      </div>

      <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "8px" }}>
        Score includes prime cost, labor, inventory risk, waste variance,
        vendor spikes, and menu margin pressure.
      </div>
    </div>
  </div>
</div>
{/* 🧠 AI SETUP INTELLIGENCE */}
{!hasOperationalData && (
  <div
    style={{
      marginBottom: "22px",
      padding: "24px",
      borderRadius: "22px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
      border: "1px solid rgba(148,163,184,0.14)",
      textAlign: "center",
    }}
  >
    <div
      style={{
        color: "#a5b4fc",
        fontSize: "12px",
        fontWeight: "900",
        marginBottom: "10px",
      }}
    >
      AI SETUP INTELLIGENCE
    </div>

    <div
      style={{
        color: "white",
        fontSize: "28px",
        fontWeight: "950",
        marginBottom: "12px",
      }}
    >
      Upload Restaurant Data To Activate AI Intelligence
    </div>

    <div
      style={{
        color: "#94a3b8",
        fontSize: "14px",
        lineHeight: 1.8,
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      Upload POS sales, labor, inventory, invoices, and menu items to
      unlock operational intelligence, AI recommendations, waste detection,
      labor optimization, and profitability analysis.
    </div>

    <div
      style={{
        marginTop: "18px",
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      {[
        "POS Sales",
        "Labor",
        "Inventory",
        "Invoices",
        "Menu Items",
      ].map((item) => (
        <div
          key={item}
          style={{
            padding: "10px 14px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(148,163,184,0.12)",
            color: "#cbd5e1",
            fontSize: "12px",
            fontWeight: "800",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  </div>
)}
{/* ✅ AI ONBOARDING PROGRESS */}
<div
  style={{
    marginBottom: "22px",
    padding: "20px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.14)",
  }}
>
  <div style={{ color: "#86efac", fontSize: "12px", fontWeight: "900" }}>
    AI ONBOARDING PROGRESS
  </div>

  <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
    {[
      
  { label: "POS Sales", complete: (salesData || []).length > 0 },
  { label: "Labor Data", complete: (laborData || []).length > 0 },
  { label: "Inventory Data", complete: (inventoryData || []).length > 0 },
  { label: "Menu Items", complete: (menuItemsData || []).length > 0 },
  { label: "Invoices", complete: (invoicesData || []).length > 0 },

    ].map((item) => (
      <div
        key={item.label}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div style={{ color: "white", fontWeight: "900", fontSize: "13px" }}>
          {item.label}
        </div>

        <div
          style={{
            color: item.complete ? "#86efac" : "#fbbf24",
            fontWeight: "900",
            fontSize: "12px",
          }}
        >
          {item.complete ? "Connected" : "Needed"}
        </div>
      </div>
    ))}
  </div>
</div>


{/* 🚨 AI PRIORITY QUEUE */}
<div
  style={{
    marginBottom: "22px",
    padding: "20px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.14)",
  }}
>
  <div style={{ color: "#fca5a5", fontSize: "12px", fontWeight: "900" }}>
    AI PRIORITY QUEUE
  </div>

  <div style={{ marginTop: "14px", display: "grid", gap: "12px" }}>
    {aiPriorityQueue.length > 0 ? (
      aiPriorityQueue.map((item, index) => (
        <div
          key={index}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                color: "white",
                fontWeight: "900",
                fontSize: "15px",
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                color:
                  item.severity === "critical"
                    ? "#fca5a5"
                    : item.severity === "high"
                    ? "#fde68a"
                    : "#93c5fd",
                fontSize: "11px",
                fontWeight: "900",
                textTransform: "uppercase",
              }}
            >
              {item.severity}
            </div>
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {item.description}
          </div>
        </div>
      ))
    ) : (
      <div
        style={{
          color: "#86efac",
          fontWeight: "800",
          fontSize: "14px",
        }}
      >
        AI currently sees no major operational priorities.
      </div>
    )}
  </div>
</div>
{/* 🎯 AI DAILY FOCUS */}
<div
  style={{
    marginBottom: "22px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(15,23,42,0.92))",
    border: "1px solid rgba(129,140,248,0.18)",
  }}
>
  <div
    style={{
      color: "#c7d2fe",
      fontSize: "12px",
      fontWeight: "900",
      marginBottom: "10px",
    }}
  >
    AI DAILY FOCUS
  </div>

  <div
    style={{
      color: "white",
      fontSize: "28px",
      fontWeight: "950",
      marginBottom: "10px",
    }}
  >
    {aiDailyFocus}
  </div>

  <div
    style={{
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.8,
      maxWidth: "760px",
    }}
  >
    {aiDailyFocusInsight}
  </div>

  <div
    style={{
      marginTop: "16px",
      display: "inline-flex",
      padding: "8px 14px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(129,140,248,0.18)",
      color: "#c7d2fe",
      fontSize: "12px",
      fontWeight: "900",
    }}
  >
    AI Operational Guidance Active
  </div>
</div>
{/* 🧠 EXECUTIVE MODE */}
<div
  style={{
    marginBottom: "22px",
    padding: "20px",
    borderRadius: "22px",
    background:
      executiveModeEnabled
        ? "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(15,23,42,0.92))"
        : "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: executiveModeEnabled
      ? "1px solid rgba(129,140,248,0.22)"
      : "1px solid rgba(148,163,184,0.14)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
  }}
>
  <div>
    <div
      style={{
        color: executiveModeEnabled ? "#c7d2fe" : "#94a3b8",
        fontSize: "12px",
        fontWeight: "900",
        marginBottom: "8px",
      }}
    >
      EXECUTIVE MODE
    </div>

    <div
      style={{
        color: "white",
        fontSize: "22px",
        fontWeight: "900",
        marginBottom: "8px",
      }}
    >
      {executiveModeEnabled
        ? "AI Executive Briefing Active"
        : "Standard Dashboard View"}
    </div>

    <div
      style={{
        color: "#cbd5e1",
        fontSize: "14px",
        lineHeight: 1.7,
        maxWidth: "620px",
      }}
    >
      {executiveModeEnabled
        ? "AI prioritizes operational summaries, profitability drivers, and critical business intelligence."
        : "View standard operational dashboard analytics and performance metrics."}
    </div>
  </div>

  <button
    type="button"
    onClick={() =>
      setExecutiveModeEnabled((prev) => !prev)
    }
    style={{
      padding: "12px 16px",
      borderRadius: "14px",
      border: "none",
      background: executiveModeEnabled
        ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
        : "rgba(255,255,255,0.08)",
      color: "white",
      fontWeight: "900",
      cursor: "pointer",
    }}
  >
    {executiveModeEnabled
      ? "Executive Mode On"
      : "Enable Executive Mode"}
  </button>
</div>
{executiveModeEnabled && (
  <div
    style={{
      marginBottom: "22px",
      padding: "22px",
      borderRadius: "22px",
      background:
        "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(15,23,42,0.94))",
      border: "1px solid rgba(129,140,248,0.2)",
    }}
  >
    <div style={{ color: "#c7d2fe", fontSize: "12px", fontWeight: "900" }}>
      AI EXECUTIVE BRIEFING
    </div>

    <div
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "950",
        marginTop: "10px",
      }}
    >
      Today’s Operational Readout
    </div>

    <div
      style={{
        marginTop: "14px",
        color: "#e2e8f0",
        fontSize: "14px",
        lineHeight: 1.8,
      }}
    >
      Operational health is currently rated{" "}
      <strong>{operationalHealthStatus}</strong> with a score of{" "}
      <strong>{operationalHealthScore}/100</strong>. AI is prioritizing{" "}
      <strong>{aiDailyFocus}</strong>. Current estimated monthly opportunity is{" "}
      <strong>${Number(aiActionImpact || estimatedRecoverableProfit || 0).toLocaleString()}</strong>.
    </div>
  </div>
)}
{executiveModeEnabled && (
  <div
    style={{
      marginBottom: "22px",
      padding: "20px",
      borderRadius: "22px",
      background: "rgba(15,23,42,0.92)",
      border: "1px solid rgba(129,140,248,0.16)",
    }}
  >
    <div style={{ color: "#c7d2fe", fontSize: "12px", fontWeight: "900" }}>
      EXECUTIVE PRIORITIES
    </div>

    <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
      {[
        aiDailyFocus && `Primary focus: ${aiDailyFocus}.`,
        primeCostPercentage > 60 &&
          `Prime cost is at ${Number(primeCostPercentage || 0).toFixed(1)}%.`,
        laborPercentage > 30 &&
          `Labor is running at ${Number(laborPercentage || 0).toFixed(1)}% of revenue.`,
        aiWasteDetection.length > 0 &&
          `${aiWasteDetection.length} waste or usage variance signals detected.`,
        criticalInventoryItems.length > 0 &&
          `${criticalInventoryItems.length} critical inventory items need attention.`,
        vendorPriceSpikeData.some((item) => item.priceChange > 10) &&
          "Vendor price spike risk detected.",
      ]
        .filter(Boolean)
        .map((item, index) => (
          <div
            key={index}
            style={{
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(148,163,184,0.12)",
              color: "#e2e8f0",
              fontSize: "13px",
              fontWeight: "800",
            }}
          >
            • {item}
          </div>
        ))}
    </div>
  </div>
)}
{/* 📊 OPERATIONAL SCORE BREAKDOWN */}
<div
  style={{
    marginBottom: "22px",
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  }}
>
  <GlassCard
    title="Prime Cost"
    value={`${Number(primeCostPercentage || 0).toFixed(1)}%`}
    subtext={primeCostStatus}
  />

  <GlassCard
    title="Labor Efficiency"
    value={
      laborEfficiencyScore > 0
        ? `${laborEfficiencyScore}/100`
        : "Needs labor data"
    }
    subtext={laborEfficiencyStatus}
  />

  <GlassCard
    title="Inventory Risk"
    value={`${criticalInventoryItems.length || 0}`}
    subtext={
      criticalInventoryItems.length > 0
        ? "Critical inventory risks detected"
        : "No critical inventory risk"
    }
  />

  <GlassCard
    title="Waste Detection"
    value={`${aiWasteDetection.length || 0}`}
    subtext={
      aiWasteDetection.length > 0
        ? "Operational waste signals detected"
        : "No major waste detected"
    }
  />

  <GlassCard
    title="Vendor Risk"
    value={`${
      vendorPriceSpikeData.filter((item) => item.priceChange > 10).length
    }`}
    subtext="Vendor spike alerts"
  />

  <GlassCard
    title="Menu Margin Risk"
    value={`${lowMarginMenuItems.length || 0}`}
    subtext="Low margin menu items"
  />
</div>
{/* 🚨 OPERATIONAL RISK DRIVERS */}
<div
  style={{
    marginBottom: "22px",
    padding: "20px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(127,29,29,0.12), rgba(15,23,42,0.92))",
    border: "1px solid rgba(248,113,113,0.16)",
  }}
>
  <div style={{ color: "#fca5a5", fontSize: "12px", fontWeight: "900" }}>
    OPERATIONAL RISK DRIVERS
  </div>

  <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
    {[
      primeCostPercentage > 65 && "Prime cost is above healthy operating range.",
      liveLaborIntelligence?.laborPercent > 35 && "Labor cost is pressuring profitability.",
      criticalInventoryItems.length > 0 && "Critical inventory depletion detected.",
      aiWasteDetection.length > 0 && "Ingredient waste or variance signals detected.",
      vendorPriceSpikeData.some((item) => item.priceChange > 10) &&
        "Vendor price spikes detected.",
      lowMarginMenuItems.length > 0 && "Low-margin menu items are reducing profit.",
    ]
      .filter(Boolean)
      .map((risk, index) => (
        <div
          key={index}
          style={{
            padding: "12px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(248,113,113,0.12)",
            color: "#fecaca",
            fontSize: "13px",
            fontWeight: "800",
          }}
        >
          • {risk}
        </div>
      ))}
  </div>
</div>
{/* ✅ OPERATIONAL OPPORTUNITY DRIVERS */}
<div
  style={{
    marginBottom: "22px",
    padding: "20px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(15,23,42,0.92))",
    border: "1px solid rgba(34,197,94,0.16)",
  }}
>
  <div style={{ color: "#86efac", fontSize: "12px", fontWeight: "900" }}>
    OPERATIONAL OPPORTUNITY DRIVERS
  </div>

  <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
    {[
      estimatedRecoverableProfit > 0 &&
        `AI identified $${Number(estimatedRecoverableProfit || 0).toLocaleString()} in recoverable profit opportunity.`,

      salesPerLaborHour > 0 &&
        `Labor is generating $${Number(salesPerLaborHour || 0).toFixed(2)} per labor hour.`,

      topMarginItem?.name &&
        `${topMarginItem.name} is your strongest margin item.`,

      topShift?.shift &&
        `${topShift.shift} is currently your strongest detected shift.`,

      inventoryProfitRecovered > 0 &&
        `$${Number(inventoryProfitRecovered || 0).toLocaleString()} inventory profit has been recovered.`,

      aiActionImpact > 0 &&
        `AI action center is protecting an estimated $${Number(aiActionImpact || 0).toLocaleString()}/mo.`,
    ]
      .filter(Boolean)
      .map((opportunity, index) => (
        <div
          key={index}
          style={{
            padding: "12px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(34,197,94,0.12)",
            color: "#bbf7d0",
            fontSize: "13px",
            fontWeight: "800",
          }}
        >
          • {opportunity}
        </div>
      ))}
  </div>
</div>
{!executiveModeEnabled && (
  <>
{/* 🔥 KPI STRIP */}
<div
  style={{
  display: "grid",

  gridTemplateColumns: isMobile
    ? "1fr"
    : "repeat(auto-fit, minmax(220px, 1fr))",

  gap: isMobile ? "12px" : "18px",

  marginBottom: "26px",
}}
>
  
 <GlassCard
  title="Revenue Intelligence"
  value={`$${Number(liveTotalRevenue || 0).toLocaleString()}`}
  subtext={
    Number(liveMomentumPercent || 0) > 0
      ? "Revenue trending upward"
      : Number(liveMomentumPercent || 0) < 0
      ? "Revenue needs attention"
      : "Revenue trend stable"
  }
  footer={
    <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Growth Trend</span>

        <span
          style={{
            color: revenueTrendBadge?.color || "#94a3b8",
            fontWeight: "900",
          }}
        >
          {revenueTrendBadge?.symbol || "→"}{" "}
          {Number(liveMomentumPercent || 0).toFixed(1)}%
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Best Sales Day</span>

        <span
          style={{
            color: "#d4af37",
            fontWeight: "900",
          }}
        >
          {revenueTracker?.bestDay?.day || "N/A"}
        </span>
      </div>
    </div>
  }
  featured
/>

<GlassCard
  title="Margin Intelligence"
  value={
    liveAvgMargin > 0
      ? `${Number(liveAvgMargin).toFixed(1)}%`
      : "Needs menu data"
  }
  subtext={
    liveAvgMargin > 0
      ? liveAvgMargin >= 65
        ? "Strong margin position"
        : liveAvgMargin >= 55
        ? "Stable margin range"
        : "Margin needs attention"
      : "Upload menu items with costs to calculate margin"
  }
  footer={
    <div
      style={{
        marginTop: "12px",
        display: "grid",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Target Margin</span>

        <span
          style={{
            color: "#e2e8f0",
            fontWeight: "800",
          }}
        >
          {`${activeBenchmarks.margin.low}–${activeBenchmarks.margin.high}%`}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Profit Health</span>

        <span
          style={{
            color:
              liveAvgMargin <= 0
                ? "#94a3b8"
                : liveAvgMargin >= activeBenchmarks.margin.low
                ? "#86efac"
                : "#fbbf24",
            fontWeight: "900",
          }}
        >
          {liveAvgMargin <= 0
            ? "Waiting for menu costs"
            : liveAvgMargin >= activeBenchmarks.margin.low
            ? "Healthy"
            : "Watch margin"}
        </span>
      </div>
    </div>
  }
/>

  <GlassCard
  title="Food Cost Intelligence"
  value={
    liveFoodCostPercentage > 0
      ? `${Number(liveFoodCostPercentage).toFixed(1)}%`
      : "Needs invoice data"
  }
  subtext={
    liveFoodCostPercentage > 0
      ? liveFoodCostPercentage <= activeBenchmarks.foodCost.high
        ? "Within benchmark range"
        : liveFoodCostPercentage <= 31
        ? "Slightly above benchmark"
        : "Margin pressure detected"
      : "Upload invoices or menu costs to calculate food cost"
  }
  footer={
    <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Benchmark Target</span>
        <span style={{ color: "#e2e8f0", fontWeight: "800" }}>
          {activeBenchmarks.foodCost.low}–{activeBenchmarks.foodCost.high}%
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Margin Impact</span>
        <span
          style={{
            color:
              liveFoodCostPercentage <= 0
                ? "#94a3b8"
                : liveFoodCostPercentage > activeBenchmarks.foodCost.high
                ? "#f87171"
                : "#86efac",
            fontWeight: "900",
          }}
        >
          {liveFoodCostPercentage <= 0
            ? "Waiting for cost data"
            : liveFoodCostPercentage > activeBenchmarks.foodCost.high
            ? "Food cost above target"
            : "Healthy"}
        </span>
      </div>
    </div>
  }
/>
<GlassCard
  title="Prime Cost Intelligence"
  value={
    livePrimeCost > 0
      ? `${Number(livePrimeCost).toFixed(1)}%`
      : "Needs cost data"
  }
  subtext={primeCostInsight}
  footer={
    <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
        <span>Benchmark Target</span>
        <span style={{ color: "#e2e8f0", fontWeight: "800" }}>
          {activeBenchmarks?.primeCost?.low || 55}–{activeBenchmarks?.primeCost?.high || 60}%
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
        <span>Status</span>
        <span style={{ color: primeCostColor, fontWeight: "900" }}>
          {primeCostStatus}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
        <span>Recoverable Profit</span>
        <span style={{ color: "#d4af37", fontWeight: "900" }}>
          ${Number(estimatedRecoverableProfit || 0).toLocaleString()}
        </span>
      </div>
    </div>
  }
/>
<GlassCard
  title="Operational Intelligence"
  value={liveScore > 0 ? `${Number(liveScore)}/100` : "Needs more data"}
  subtext={
    liveScore > 0
      ? liveScore >= 80
        ? "Restaurant operating efficiently"
        : liveScore >= 60
        ? "Operational opportunities detected"
        : "Multiple operational risks detected"
      : "Upload POS, menu, labor, and inventory data to score operations"
  }
  footer={
    <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Benchmark Status</span>

        <span
          style={{
            color:
              liveScore <= 0
                ? "#94a3b8"
                : liveScore >= 80
                ? "#86efac"
                : liveScore >= 60
                ? "#fbbf24"
                : "#f87171",
            fontWeight: "900",
          }}
        >
          {liveScore <= 0
            ? "Waiting for data"
            : liveScore >= 80
            ? "Above benchmark"
            : liveScore >= 60
            ? "Average benchmark"
            : "Below benchmark"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>AI Priority</span>

        <span style={{ color: "#d4af37", fontWeight: "900" }}>
          {liveScore <= 0
            ? "Upload more data"
            : liveScore >= 80
            ? "Maintain performance"
            : "Improve margins"}
        </span>
      </div>
    </div>
  }
/>

</div>
  </>
)}
{!executiveModeEnabled && (
  <>
 {/* SECOND KPI STRIP */}
<div
  style={{
    display: "grid",

    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(220px, 1fr))",

    gap: isMobile ? "12px" : "18px",

    marginBottom: "26px",
  }}
>

  <GlassCard
  title="Check Average Intelligence"
 value={`$${Number(liveAOV || 0).toFixed(2)}`}
  subtext={
    Number(aov || 0) >= 25
      ? "Strong guest spend"
      : Number(aov || 0) >= 15
      ? "Average guest spend"
      : "Upsell opportunity detected"
  }
  footer={
    <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Guest Spend Signal</span>
        <span style={{ color: "#e2e8f0", fontWeight: "800" }}>
          Avg order value
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Opportunity</span>
        <span style={{ color: "#d4af37", fontWeight: "900" }}>
          Bundle / upsell
        </span>
      </div>
    </div>
  }
/>

  <GlassCard
  title="Order Volume Intelligence"
  value={`${Number(liveTotalOrders || 0).toLocaleString()}`}
  subtext={
    Number(totalOrders || 0) > 0
      ? "Guest traffic captured"
      : "Upload sales data to measure volume"
  }
  footer={
    <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Traffic Signal</span>
        <span style={{ color: "#e2e8f0", fontWeight: "800" }}>
          Order count
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Next Opportunity</span>
        <span style={{ color: "#d4af37", fontWeight: "900" }}>
          Increase repeat visits
        </span>
      </div>
    </div>
  }
/>

 <GlassCard
  title="Peak Hour Intelligence"
  value={livePeakHours?.[0]?.label || "Needs time data"}
  subtext={
    livePeakHours?.[0]?.revenue
      ? `$${Number(livePeakHours[0].revenue || 0).toLocaleString()} top-performing window`
      : "Upload POS data with order times to calculate peak hours"
  }
  footer={
    <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Traffic Insight</span>
        <span style={{ color: "#e2e8f0", fontWeight: "800" }}>
          {livePeakHours?.[0]?.revenue ? "High guest volume" : "Waiting for timestamps"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Recommendation</span>
        <span style={{ color: "#d4af37", fontWeight: "900" }}>
          {livePeakHours?.[0]?.revenue ? "Optimize staffing" : "Upload timed sales"}
        </span>
      </div>
    </div>
  }
/>

<GlassCard
  title="Revenue Momentum Intelligence"
  value={`${Number(liveMomentumPercent || 0).toFixed(1)}%`}
  subtext={
    Number(liveMomentumPercent || 0) > 0
      ? "Revenue growth accelerating"
      : Number(liveMomentumPercent || 0) < 0
      ? "Revenue trend slowing"
      : "Revenue trend stable"
  }
  footer={
    <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Growth Signal</span>

        <span
          style={{
            color:
              Number(liveMomentumPercent || 0) > 0
                ? "#86efac"
                : Number(liveMomentumPercent || 0) < 0
                ? "#f87171"
                : "#e2e8f0",
            fontWeight: "900",
          }}
        >
          {Number(liveMomentumPercent || 0) > 0
            ? "Positive"
            : Number(liveMomentumPercent || 0) < 0
            ? "Declining"
            : "Stable"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <span>Suggested Focus</span>

        <span
          style={{
            color: "#d4af37",
            fontWeight: "900",
          }}
        >
          {Number(liveMomentumPercent || 0) > 0
            ? "Scale winning items"
            : Number(liveMomentumPercent || 0) < 0
            ? "Drive repeat traffic"
            : "Monitor sales trends"}
        </span>
      </div>
    </div>
  }
/>
</div>
</>
)}
{!executiveModeEnabled && (
  <>
{/* 🧠 BENCHMARK INTELLIGENCE */}
<div
  style={{
    marginBottom: "26px",
    padding: isMobile ? "20px" : "28px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 50px rgba(2,6,23,0.22)",
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
      <div
        style={{
          color: "#d4af37",
          fontSize: "12px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        Benchmark Intelligence
      </div>

      <h3
        style={{
          color: "white",
          fontSize: isMobile ? "24px" : "30px",
          fontWeight: "950",
          margin: 0,
        }}
      >
        How your operation compares
      </h3>
    </div>

    <div
      style={{
        padding: "10px 14px",
        borderRadius: "999px",
        background: "rgba(212,175,55,0.12)",
        border: "1px solid rgba(212,175,55,0.24)",
        color: "#fbbf24",
        fontWeight: "900",
        fontSize: "13px",
      }}
    >
      Live Data Comparison
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "16px",
    }}
  >
    {[
      {
        label: "Food Cost",
        your:
          liveFoodCostPercentage > 0
            ? `${Number(liveFoodCostPercentage).toFixed(1)}%`
            : "Needs invoice data",

        benchmark: `${activeBenchmarks.foodCost.low}–${activeBenchmarks.foodCost.high}%`,

        status:
          liveFoodCostPercentage <= 0
            ? "Waiting for cost data"
            : liveFoodCostPercentage <= activeBenchmarks.foodCost.high
            ? "Healthy"
            : "Above Benchmark",

        color:
          liveFoodCostPercentage <= 0
            ? "#94a3b8"
            : liveFoodCostPercentage <= activeBenchmarks.foodCost.high
            ? "#86efac"
            : "#fbbf24",
      },

      {
        label: "Margin",
        your:
          liveAvgMargin > 0
            ? `${Number(liveAvgMargin).toFixed(1)}%`
            : "Needs menu data",

        benchmark: `${activeBenchmarks.margin.low}–${activeBenchmarks.margin.high}%`,

        status:
          liveAvgMargin <= 0
            ? "Waiting for menu costs"
            : liveAvgMargin >= activeBenchmarks.margin.low
            ? "Healthy"
            : "Needs Attention",

        color:
          liveAvgMargin <= 0
            ? "#94a3b8"
            : liveAvgMargin >= activeBenchmarks.margin.low
            ? "#86efac"
            : "#f87171",
      },

    {
  label: "Labor Efficiency",

  your:
    liveLaborIntelligence?.laborPercent > 0
      ? `${Number(
          liveLaborIntelligence.laborPercent
        ).toFixed(1)}%`
      : "Needs labor data",

  benchmark: `${activeBenchmarks.labor.low}–${activeBenchmarks.labor.high}%`,

  status:
    Number(liveLaborIntelligence?.laborPercent || 0) <= 0
      ? "Waiting for labor data"
      : Number(liveLaborIntelligence?.laborPercent || 0) <=
        activeBenchmarks.labor.high
      ? "Healthy"
      : "Slightly High",

  color:
    Number(liveLaborIntelligence?.laborPercent || 0) <= 0
      ? "#94a3b8"
      : Number(liveLaborIntelligence?.laborPercent || 0) <=
        activeBenchmarks.labor.high
      ? "#86efac"
      : "#fbbf24",
},

      {
        label: "Operational Score",

        your:
          liveScore > 0
            ? `${Number(liveScore)}/100`
            : "Needs more data",

        benchmark: "80+ Recommended",

        status:
          liveScore <= 0
            ? "Waiting for data"
            : liveScore >= 80
            ? "High Performing"
            : liveScore >= 60
            ? "Optimization Available"
            : "Needs Attention",

        color:
          liveScore <= 0
            ? "#94a3b8"
            : liveScore >= 80
            ? "#86efac"
            : liveScore >= 60
            ? "#d4af37"
            : "#f87171",
      },
    ].map((item) => (
      <div
        key={item.label}
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            fontWeight: "800",
            marginBottom: "12px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {item.label}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ color: "#64748b", fontSize: "12px" }}>
              Your Operation
            </div>

            <div
              style={{
                color: "white",
                fontSize: "24px",
                fontWeight: "900",
              }}
            >
              {item.your}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#64748b", fontSize: "12px" }}>
              Benchmark
            </div>

            <div
              style={{
                color: "#cbd5e1",
                fontSize: "18px",
                fontWeight: "800",
              }}
            >
              {item.benchmark}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            borderRadius: "999px",
            display: "inline-flex",
            alignItems: "center",
            background: `${item.color}18`,
            border: `1px solid ${item.color}35`,
            color: item.color,
            fontSize: "12px",
            fontWeight: "900",
          }}
        >
          {item.status}
        </div>
      </div>
    ))}
  </div>
</div>
</>
)}
{!executiveModeEnabled && (
  <>
{/* ⚡ AI PRIORITIES */}
<div
  style={{
    marginBottom: "26px",
    padding: isMobile ? "20px" : "28px",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top right, rgba(109,61,245,0.20), transparent 30%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))",
    border: "1px solid rgba(167,139,250,0.20)",
    boxShadow: "0 18px 50px rgba(2,6,23,0.24)",
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
      <div
        style={{
          color: "#a78bfa",
          fontSize: "12px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        AI Priorities
      </div>

      <h3
        style={{
          color: "white",
          fontSize: isMobile ? "24px" : "30px",
          fontWeight: "950",
          margin: 0,
        }}
      >
        Highest-impact opportunities detected
      </h3>
    </div>

    <div
      style={{
        padding: "10px 14px",
        borderRadius: "999px",
        background: "rgba(167,139,250,0.12)",
        border: "1px solid rgba(167,139,250,0.24)",
        color: "#c4b5fd",
        fontWeight: "900",
        fontSize: "13px",
      }}
    >
      Live AI Analysis
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gap: "14px",
    }}
  >
    {[
      {
        title: "Reduce food cost variance",
        impact: `+$${Number(estimatedFoodCostImpact || 0).toLocaleString()}/mo`,
        text:
          "Food cost percentage is running above benchmark range compared to similar operations.",
        color: "#fbbf24",
      },

      {
        title:
  topUnderpricedItems.length > 0
    ? "Fix underpriced high-impact menu items"
    : "Increase menu pricing efficiency",
        impact: `+$${Number(estimatedMenuPricingImpact || 0).toLocaleString()}/mo`,
        text:
  topUnderpricedItems.length > 0
    ? `${topUnderpricedItems.length} menu items are below target margin: ${topUnderpricedItems
        .map((item) => item.name)
        .join(", ")}.`
    : "Menu pricing upside is estimated from current revenue until menu item data is uploaded.",
        color: "#86efac",
      },

      {
        title: "Optimize Tuesday labor coverage",
        impact: `+$${Number(estimatedLaborImpact || 0).toLocaleString()}/mo`,
        text:
          "Current staffing trend suggests overcoverage during lower-volume periods.",
        color: "#60a5fa",
      },
    ].map((item) => (
      <div
        key={item.title}
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "14px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          <div>
            <div
              style={{
                color: "white",
                fontWeight: "900",
                fontSize: "17px",
                marginBottom: "6px",
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                color: "#94a3b8",
                lineHeight: 1.7,
                fontSize: "14px",
                maxWidth: "720px",
              }}
            >
              {item.text}
            </div>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "14px",
              background: `${item.color}18`,
              border: `1px solid ${item.color}35`,
              color: item.color,
              fontWeight: "900",
              fontSize: "14px",
            }}
          >
            {item.impact}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
</>
)}
{!executiveModeEnabled && (
  <>
{/* 💰 PROFIT RECOVERY SUMMARY */}
<div
  style={{
    marginBottom: "26px",
    padding: isMobile ? "20px" : "28px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(20,83,45,0.34), rgba(15,23,42,0.96))",
    border: "1px solid rgba(34,197,94,0.20)",
    boxShadow: "0 18px 50px rgba(2,6,23,0.22)",
  }}
>
  <div
    style={{
      color: "#86efac",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "10px",
    }}
  >
    Profit Recovery
  </div>

  <h3
    style={{
      color: "white",
      fontSize: isMobile ? "26px" : "34px",
      fontWeight: "950",
      margin: "0 0 10px",
    }}
  >
    ${Number(4160).toLocaleString()}/mo in estimated opportunities found
  </h3>

  <p
    style={{
      color: "#cbd5e1",
      fontSize: "15px",
      lineHeight: 1.7,
      maxWidth: "780px",
      margin: "0 0 18px",
    }}
  >
    SerVen identified potential savings and revenue recovery across food cost,
    menu pricing, and labor coverage.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    {[
      {
  label: "Food Cost Recovery",
  value: `$${Number(
    estimatedFoodCostImpact || 0
  ).toLocaleString()}/mo`,
},
      {
  label: "Menu Pricing Upside",
  value: `$${Number(
    estimatedMenuPricingImpact || 0
  ).toLocaleString()}/mo`,
},
     {
  label: "Labor Efficiency",
  value: `$${Number(
    estimatedLaborImpact || 0
  ).toLocaleString()}/mo`,
},
    ].map((item) => (
      <div
        key={item.label}
        style={{
          padding: "16px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            fontWeight: "800",
            marginBottom: "8px",
          }}
        >
          {item.label}
        </div>

        <div
          style={{
            color: "#86efac",
            fontSize: "22px",
            fontWeight: "950",
          }}
        >
          {item.value}
        </div>
      </div>
    ))}
  </div>
</div>
</>
)}
{!executiveModeEnabled && (
  <>
{/* 📈 WHAT CHANGED THIS WEEK */}
<div
  style={{
    marginBottom: "26px",
    padding: isMobile ? "20px" : "28px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 50px rgba(2,6,23,0.22)",
  }}
>
  <div
    style={{
      color: "#60a5fa",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "10px",
    }}
  >
    Weekly Intelligence
  </div>

  <h3
    style={{
      color: "white",
      fontSize: isMobile ? "26px" : "32px",
      fontWeight: "950",
      margin: "0 0 18px",
    }}
  >
    What changed this week
  </h3>

  <div
    style={{
      display: "grid",
      gap: "14px",
    }}
  >
    {[
      {
        title: "Food cost increased",
        change: "+2.4%",
        text:
          "Ingredient costs increased faster than menu pricing adjustments.",
        color: "#fbbf24",
      },

      {
        title: "Revenue improved",
        change: "+12.4%",
        text:
          "Weekend sales volume and average ticket size both increased.",
        color: "#86efac",
      },

      {
        title: "Tuesday labor efficiency dropped",
        change: "-6.1%",
        text:
          "Current staffing levels exceeded projected traffic patterns.",
        color: "#f87171",
      },
    ].map((item) => (
      <div
        key={item.title}
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "14px",
            flexWrap: "wrap",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              color: "white",
              fontWeight: "900",
              fontSize: "17px",
            }}
          >
            {item.title}
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: "12px",
              background: `${item.color}18`,
              border: `1px solid ${item.color}35`,
              color: item.color,
              fontWeight: "900",
              fontSize: "13px",
            }}
          >
            {item.change}
          </div>
        </div>

        <div
          style={{
            color: "#94a3b8",
            lineHeight: 1.7,
            fontSize: "14px",
          }}
        >
          {item.text}
        </div>
      </div>
    ))}
  </div>
</div>
</>
)}
{!executiveModeEnabled && (
  <>
{/* ✅ RECOMMENDED NEXT ACTION */}
<div
  style={{
    marginBottom: "26px",
    padding: isMobile ? "20px" : "28px",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top right, rgba(212,175,55,0.18), transparent 30%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))",
    border: "1px solid rgba(212,175,55,0.22)",
    boxShadow: "0 18px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      color: "#d4af37",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "10px",
    }}
  >
    Recommended Next Action
  </div>

  <h3
    style={{
      color: "white",
      fontSize: isMobile ? "24px" : "32px",
      fontWeight: "950",
      margin: "0 0 10px",
    }}
  >
    {recommendedAction.title}
  </h3>

  <p
  style={{
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: 1.7,
    maxWidth: "780px",
    margin: "0 0 18px",
  }}
>
  {recommendedAction.text}
</p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
      gap: "14px",
      marginBottom: "18px",
    }}
  >
    {[
      {
  label: "Potential Impact",
  value: `+$${Number(
    recommendedAction.impact || 0
  ).toLocaleString()}/mo`,
},
      {
  label: "Priority",

  value:
    recommendedAction.impact >= 3000
      ? "Critical"
      : recommendedAction.impact >= 1500
      ? "High"
      : "Medium",
},
      { label: "Action Type", value: recommendedAction.type },
    ].map((item) => (
      <div
        key={item.label}
        style={{
          padding: "16px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            fontWeight: "800",
            marginBottom: "8px",
          }}
        >
          {item.label}
        </div>

        <div
          style={{
            color: "#ffffff",
            fontSize: "20px",
            fontWeight: "950",
          }}
        >
          {item.value}
        </div>
      </div>
    ))}
  </div>

  <button
    type="button"
    onClick={() => setActiveTab("ai")}
    style={{
      padding: "13px 18px",
      borderRadius: "14px",
      border: "none",
      background: "linear-gradient(135deg, #d4af37, #7c3aed)",
      color: "white",
      fontWeight: "900",
      cursor: "pointer",
      width: isMobile ? "100%" : "auto",
    }}
  >
    View AI Recommendation
  </button>
</div>
</>
)}

{/* AI OPERATIONAL SUMMARY ROLLUP */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(212,175,55,0.18)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#d4af37",
      marginBottom: "12px",
    }}
  >
    AI Operational Summary
  </div>

  <div
    style={{
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.8,
    }}
  >
   {primeCostInsight}{" "}
{laborEfficiencyInsight}{" "}
{operationalUsageVarianceInsight}{" "}
{kegInsight}
  </div>
</div>
{/* AI PROFIT RECOVERY INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(21,128,61,0.16), rgba(15,23,42,0.94))",
    border: "1px solid rgba(74,222,128,0.18)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#86efac",
      marginBottom: "14px",
    }}
  >
    AI Profit Recovery Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
      marginBottom: "14px",
    }}
  >
    <GlassCard
      title="Total Recovery Opportunity"
      value={`$${Number(totalAIRecoveryOpportunity || 0).toLocaleString()}`}
      subtext={aiRecoveryInsight}
    />

    <GlassCard
      title="Food Cost Recovery"
      value={`$${Number(estimatedFoodRecovery || 0).toLocaleString()}`}
      subtext="Potential savings from food cost optimization"
    />

    <GlassCard
      title="Labor Recovery"
      value={`$${Number(estimatedLaborRecovery || 0).toLocaleString()}`}
      subtext="Potential savings from labor optimization"
    />

    <GlassCard
      title="Recovery Status"
      value={aiRecoveryStatus}
      subtext="AI operational recovery rating"
    />
  </div>

  <div
    style={{
      padding: "14px 16px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(148,163,184,0.12)",
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.7,
    }}
  >
    {aiRecoveryInsight}
  </div>
</div>
{/* ============================= */}
{/* AI PROFIT RECOVERY TREND */}
{/* ============================= */}
<div
  style={{
    marginBottom: "24px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "radial-gradient(circle at top right, rgba(109,61,245,0.14), transparent 34%), linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.86))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 42px rgba(2,6,23,0.22)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#c4b5fd",
          marginBottom: "6px",
        }}
      >
        AI Profit Intelligence
      </div>

      <h3
        style={{
          margin: 0,
          color: "white",
          fontSize: "22px",
          fontWeight: "950",
        }}
      >
        AI profit recovery trend
      </h3>

      <p
        style={{
          margin: "6px 0 0",
          color: "#94a3b8",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        Compare baseline revenue against projected AI-optimized revenue.
      </p>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(109,61,245,0.12)",
        border: "1px solid rgba(109,61,245,0.22)",
        color: "#d8b4fe",
        fontSize: "12px",
        fontWeight: "900",
      }}
    >
      +${Number(simulatedProfit || 0).toLocaleString()} projected
    </div>
  </div>

  <div style={{ width: "100%", height: "320px" }}>
    {aiProfitTrendData?.length ? (
      <LineChart
  width={700}
  height={300}
          data={aiProfitTrendData}
          margin={{ top: 10, right: 18, left: 0, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148,163,184,0.12)"
          />

          <XAxis
            dataKey="day"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
            tickLine={false}
          />

          <YAxis
            tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
            tickLine={false}
          />

          <Tooltip
            formatter={(value, name) => [
              `$${Number(value || 0).toLocaleString()}`,
              name === "optimized"
                ? "AI Optimized Revenue"
                : "Baseline Revenue",
            ]}
            contentStyle={{
              background: "rgba(15,23,42,0.97)",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: "14px",
              color: "white",
            }}
          />

          <Legend
            wrapperStyle={{
              color: "#94a3b8",
              fontSize: "12px",
              fontWeight: "800",
            }}
          />

          <Line
            type="monotone"
            dataKey="baseline"
            name="Baseline Revenue"
            stroke="#64748b"
            strokeWidth={3}
            strokeDasharray="6 6"
            dot={false}
            connectNulls
          />

          <Line
            type="monotone"
            dataKey="optimized"
            name="AI Optimized Revenue"
            stroke="#8b5cf6"
            strokeWidth={4}
            dot={false}
            activeDot={{
              r: 8,
              fill: "#c4b5fd",
              stroke: "white",
              strokeWidth: 2,
            }}
            connectNulls
          />
        </LineChart>
      
    ) : (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          textAlign: "center",
          borderRadius: "18px",
          border: "1px dashed rgba(148,163,184,0.2)",
          background: "rgba(15,23,42,0.5)",
          fontSize: "13px",
        }}
      >
        Apply AI fixes to generate profit recovery projections.
      </div>
    )}
  </div>
</div>

{/* EXECUTIVE RISK SCORE */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(124,58,237,0.16), rgba(15,23,42,0.94))",
    border: "1px solid rgba(167,139,250,0.18)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#c4b5fd",
      marginBottom: "14px",
    }}
  >
    Executive Risk Score
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Risk Score"
      value={`${Number(executiveRiskScore || 0)}/100`}
      subtext={executiveRiskInsight}
    />

    <GlassCard
      title="Risk Status"
      value={executiveRiskStatus}
      subtext="Owner-level operational risk rating"
    />

    <GlassCard
      title="Recovery Opportunity"
      value={`$${Number(totalAIRecoveryOpportunity || 0).toLocaleString()}`}
      subtext="Potential recovery identified by AI"
    />

    <GlassCard
      title="Priority Focus"
      value={
        executiveRiskScore >= 70
          ? "Immediate Review"
          : executiveRiskScore >= 45
          ? "Cost Control"
          : executiveRiskScore >= 20
          ? "Monitor Trends"
          : "Maintain"
      }
      subtext="Recommended executive action"
    />
  </div>
</div>
{/* 📩 EMAIL MODAL */}
{showRiskEmailModal && (
  <div
    onClick={() => setShowRiskEmailModal(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(2,6,23,0.72)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      zIndex: 9999,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: "760px",
        borderRadius: "24px",
        padding: "24px",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96))",
        border: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 24px 60px rgba(2,6,23,0.35)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "18px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#a78bfa",
              marginBottom: "8px",
            }}
          >
            Client Outreach
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "900",
              color: "white",
            }}
          >
            Draft Client Email
          </h3>
        </div>

        <button
          onClick={() => setShowRiskEmailModal(false)}
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(148,163,184,0.2)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "8px",
            fontWeight: "700",
          }}
        >
          To
        </div>
        <input
          value={riskEmailTo}
          onChange={(e) => setRiskEmailTo(e.target.value)}
          placeholder="client@email.com"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            outline: "none",
            fontSize: "14px",
          }}
        />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "8px",
            fontWeight: "700",
          }}
        >
          Subject
        </div>
        <input
          value={riskEmailSubject}
          onChange={(e) => setRiskEmailSubject(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            outline: "none",
            fontSize: "14px",
          }}
        />
      </div>

      <div style={{ marginBottom: "18px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "8px",
            fontWeight: "700",
          }}
        >
          Message
        </div>
        <textarea
          value={riskEmailBody}
          onChange={(e) => setRiskEmailBody(e.target.value)}
          rows={12}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            lineHeight: 1.6,
            resize: "vertical",
            outline: "none",
            fontSize: "14px",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `Subject: ${riskEmailSubject}\n\n${riskEmailBody}`
              );
              alert("Copied to clipboard");
            } catch (error) {
              console.error("Copy failed:", error);
            }
          }}
          style={{
            padding: "12px 16px",
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Copy Email
        </button>

        <button
          onClick={() => {
            const subject = encodeURIComponent(riskEmailSubject);
            const body = encodeURIComponent(riskEmailBody);
            window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
          }}
          style={{
            padding: "12px 16px",
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Open Email App
        </button>

        <button
          onClick={async () => {
            if (!riskEmailTo.trim()) {
              alert("Add a client email first.");
              return;
            }

            try {
              setSendingRiskEmail(true);

              const res = await fetch("/api/send-risk-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: riskEmailTo.trim(),
                  subject: riskEmailSubject,
                  message: riskEmailBody,
                  clientName: selectedRiskClient?.client_name || "Client",
                }),
              });

              const data = await res.json();

              if (!res.ok) {
                throw new Error(data?.error || "Failed to send email.");
              }

              alert("Email sent successfully.");
              setShowRiskEmailModal(false);
            } catch (error) {
              console.error("Send risk email failed:", error);
              alert(error.message || "Failed to send email.");
            } finally {
              setSendingRiskEmail(false);
            }
          }}
          disabled={sendingRiskEmail}
          style={{
            padding: "12px 16px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "white",
            fontWeight: "800",
            cursor: sendingRiskEmail ? "not-allowed" : "pointer",
            opacity: sendingRiskEmail ? 0.7 : 1,
          }}
        >
          {sendingRiskEmail ? "Sending..." : "Send Email Now"}
        </button>
      </div>
    </div>
  </div>
)}
   

    {/* ALERTS */}
    <div style={liveAlertContainer}>
      {starterAlerts?.map((alert, index) => (
        <div
          key={alert?.id || index}
          style={{
            ...alertCard,
            borderLeft:
              alert?.type === "critical"
                ? "4px solid #ef4444"
                : alert?.type === "warning"
                ? "4px solid #f59e0b"
                : "4px solid #10b981",
          }}
        >
          <span>{typeof alert === "string" ? alert : alert?.text}</span>
        </div>
      ))}
    </div>

   
  </>
)}
  
 
<div
  style={{
    display: "grid",
   gridTemplateColumns:
  isMobile
    ? "1fr"
    : "minmax(0, 1fr) 360px",
    gap: "24px",
    alignItems: "start",
    marginTop: "24px",
  }}
>
  
        {/* LEFT SIDE */}
<div style={{ minWidth: 0 }}>
{canSeeOwnerDashboard && (
  <>
<OwnerLeadsPanel
  fetchLeads={fetchLeads}
  leadStatCard={leadStatCard}
  leadStatLabel={leadStatLabel}
  leadStatValue={leadStatValue}
  leadPipelineValue={leadPipelineValue}
  newLeadCount={newLeadCount}
  contactedLeadCount={contactedLeadCount}
  closedLeadCount={closedLeadCount}
  leadsLoading={leadsLoading}
  leads={leads}
  getLeadValue={getLeadValue}
  leadButtonPurple={leadButtonPurple}
  leadButtonGold={leadButtonGold}
  leadButtonGreen={leadButtonGreen}
  updateLeadStatus={updateLeadStatus}
  deleteLead={deleteLead}
/>


    {/* ========================= */}
    {/* 🚨 DAILY UPLOAD ALERT BAR */}
    {/* ========================= */}
    <div
      style={{
        marginBottom: "20px",
        padding: "18px 20px",
        borderRadius: "18px",
        background:
          overdueClients.length > 0
            ? "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(15,23,42,0.92))"
            : "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(15,23,42,0.92))",
        border:
          overdueClients.length > 0
            ? "1px solid rgba(245,158,11,0.22)"
            : "1px solid rgba(34,197,94,0.18)",
        boxShadow: "0 18px 40px rgba(2,6,23,0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: overdueClients.length > 0 ? "#fcd34d" : "#86efac",
              marginBottom: "6px",
            }}
          >
            Daily Upload Monitor
          </div>

          <div
            style={{
              fontSize: "20px",
              fontWeight: "900",
              color: "white",
              marginBottom: "8px",
            }}
          >
            {overdueClients.length > 0
              ? `${overdueClients.length} clients need upload attention`
              : "All tracked clients are current"}
          </div>

          <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
            {overdueClients.length > 0
              ? "Use this bar to focus on restaurants that have not uploaded fresh POS data yet."
              : "Today’s client uploads are up to date and ready for AI analysis."}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div className="stat-pill">
            Uploaded Today: {uploadedTodayCount}
          </div>
          <div className="stat-pill">
            Needs Upload: {needsUploadCount}
          </div>
          <div className="stat-pill">
            Overdue: {overdueCount}
          </div>

          <button
            onClick={() =>
              setShowOnlyMissingUploads((prev) => !prev)
            }
            style={{
              padding: "10px 14px",
              borderRadius: "14px",
              border: "none",
              background: showOnlyMissingUploads
                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                : "linear-gradient(135deg, #4f46e5, #6D3DF5)",
              color: "white",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            {showOnlyMissingUploads
              ? "Show All Clients"
              : "Show Missing Uploads"}
          </button>
        </div>
      </div>
    </div>

    {/* ========================= */}
    {/* 👥 CLIENT PERFORMANCE TRACKER */}
    {/* ========================= */}
    <div
      style={{
        marginBottom: "20px",
        padding: "20px",
        borderRadius: "20px",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92))",
        border: "1px solid rgba(148,163,184,0.16)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "white" }}>
            Client Performance Tracker
          </div>
          <div style={{ fontSize: "13px", color: "#94a3b8" }}>
            Track uploaded client data and performance
          </div>
        </div>

        <input
          type="text"
          placeholder="Search client..."
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.04)",
            color: "white",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "14px",
        }}
      >
        {(clientUploads || []).length === 0 ? (
          <div style={{ color: "#94a3b8" }}>
            No client uploads found yet.
          </div>
        ) : (
          (activeClientUploads || []).map((client, index) => {
  const isSelectedClient = selectedClient?.id === client.id;

  return (
    <div
      key={client.id || index}
      onClick={() => setSelectedClient(client)}
      style={{
        padding: "16px",
        borderRadius: "16px",
        background: isSelectedClient
          ? "linear-gradient(135deg, rgba(79,70,229,0.25), rgba(15,23,42,0.95))"
          : "rgba(255,255,255,0.04)",
        border: isSelectedClient
          ? "1px solid rgba(99,102,241,0.6)"
          : "1px solid rgba(148,163,184,0.12)",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ fontWeight: "800", color: "white" }}>
        {client.file_name || "Unnamed Upload"}
      </div>

      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
        {client.client_name || "Unknown Client"}
      </div>

      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
        {Number(client.row_count || 0).toLocaleString()} rows
      </div>

      {isSelectedClient && (
        <div
          style={{
            marginTop: "10px",
            padding: "7px 10px",
            borderRadius: "999px",
            background: "rgba(99,102,241,0.18)",
            color: "#c4b5fd",
            fontSize: "11px",
            fontWeight: "900",
            display: "inline-block",
          }}
        >
          Active Client
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          deleteClientUpload(client.id);
        }}
        style={{
          marginTop: "10px",
          width: "100%",
          padding: "8px",
          borderRadius: "10px",
          border: "1px solid rgba(239,68,68,0.18)",
          background: "rgba(239,68,68,0.1)",
          color: "#fca5a5",
          cursor: "pointer",
          fontWeight: "800",
        }}
      >
        Delete
      </button>
    </div>
  );
})
        )}
      </div>
    </div>
  
  {selectedClient && (
  <div
    style={{
      marginTop: "16px",
      padding: "14px 16px",
      borderRadius: "16px",
      background: "rgba(99,102,241,0.12)",
      border: "1px solid rgba(99,102,241,0.28)",
      color: "#c4b5fd",
      fontSize: "13px",
      fontWeight: "900",
    }}
  >
    Active Client:{" "}
    {selectedClient.client_name || selectedClient.file_name || "Selected Client"}
  </div>
)}
</>
)}


  {activeTab === "ai" && (
    <>
      <div
  style={{
    marginTop: "30px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "20px",
    alignItems: "start",
  }}
>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: "14px" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "800",
                color: "#ffffff",
              }}
            >
              AI Recommendations
            </h3>

            <p style={{ fontSize: "13px", color: "#94a3b8" }}>
              Smart actions based on performance and pricing gaps.
            </p>
          </div>
         {/* ========================= */}
{/* 🧠 AI OPERATIONAL COMMAND CENTER */}
{/* ========================= */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "24px",
      borderRadius: "26px",
      background:
        aiCommandCenter?.commandStatus === "Critical"
          ? "linear-gradient(135deg, rgba(239,68,68,0.16), rgba(15,23,42,0.97))"
          : aiCommandCenter?.commandStatus === "Monitoring"
          ? "linear-gradient(135deg, rgba(250,204,21,0.12), rgba(15,23,42,0.97))"
          : "linear-gradient(135deg, rgba(109,61,245,0.16), rgba(15,23,42,0.97))",
      border:
        aiCommandCenter?.commandStatus === "Critical"
          ? "1px solid rgba(239,68,68,0.28)"
          : aiCommandCenter?.commandStatus === "Monitoring"
          ? "1px solid rgba(250,204,21,0.24)"
          : "1px solid rgba(168,85,247,0.26)",
      boxShadow: "0 26px 70px rgba(2,6,23,0.35)",
    }}
  >
    <div
      style={{
        color:
          aiCommandCenter?.commandStatus === "Critical"
            ? "#fca5a5"
            : aiCommandCenter?.commandStatus === "Monitoring"
            ? "#fde68a"
            : "#c4b5fd",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      AI Operational Command Center
    </div>

    <h2
      style={{
        color: "white",
        fontSize: "30px",
        fontWeight: "950",
        margin: "0 0 10px",
      }}
    >
      {aiCommandCenter?.commandStatus || "Stable"} Restaurant AI Status
    </h2>

    <p
      style={{
        color: "#cbd5e1",
        fontSize: "14px",
        lineHeight: 1.7,
        marginBottom: "18px",
      }}
    >
      {aiCommandCenter?.commandMessage}
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
      }}
    >
      {[
        {
          label: "Critical Escalations",
          value: aiCommandCenter?.criticalEscalations || 0,
        },
        {
          label: "Autonomous Actions",
          value: aiCommandCenter?.autonomousCount || 0,
        },
        {
          label: "Recurring Critical",
          value: aiCommandCenter?.recurringCritical || 0,
        },
        {
          label: "Command Status",
          value: aiCommandCenter?.commandStatus || "Stable",
        },
      ].map((metric) => (
        <div
          key={metric.label}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: "900",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            {metric.label}
          </div>

          <div
            style={{
              color:
                metric.value === "Critical"
                  ? "#f87171"
                  : metric.value === "Monitoring"
                  ? "#facc15"
                  : "white",
              fontSize: "24px",
              fontWeight: "950",
            }}
          >
            {metric.value}
          </div>
        </div>
      ))}
    </div>
    {/* ========================= */}
{/* 🧠 COMMAND CENTER ACTION CONTROLS */}
{/* ========================= */}

<div
  style={{
    marginTop: "18px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={() => {
      pushActivity(
        `Command Center reviewed: ${
          aiCommandCenter?.commandStatus || "Stable"
        }`,
        "command"
      );

      setSavedMessage("Command Center reviewed");
      setTimeout(() => setSavedMessage(""), 2000);
    }}
    style={{
      padding: "12px 16px",
      borderRadius: "14px",
      border: "1px solid rgba(168,85,247,0.28)",
      background: "rgba(88,28,135,0.30)",
      color: "#e9d5ff",
      fontWeight: "900",
      cursor: "pointer",
    }}
  >
    Mark Command Reviewed
  </button>

  <button
    type="button"
    onClick={() => {
      setGeneratedCampaignPreview({
        title: "AI Command Center Action Plan",
        sms:
          aiCommandCenter?.commandMessage ||
          "AI Command Center generated an operational plan.",
        emailBody:
          aiCommandCenter?.commandMessage ||
          "AI Command Center generated an operational plan.",
        audience: "Restaurant Operators",
        issue: "AI Command Center",
        reason: aiCommandCenter?.commandStatus || "Stable",
      });

      setSavedMessage("Command action plan generated");
      setTimeout(() => setSavedMessage(""), 2000);
    }}
    style={{
      padding: "12px 16px",
      borderRadius: "14px",
      border: "none",
      background:
        aiCommandCenter?.commandStatus === "Critical"
          ? "linear-gradient(135deg, #ef4444, #f97316)"
          : aiCommandCenter?.commandStatus === "Monitoring"
          ? "linear-gradient(135deg, #facc15, #f97316)"
          : "linear-gradient(135deg, #8b5cf6, #6366f1)",
      color: "white",
      fontWeight: "950",
      cursor: "pointer",
    }}
  >
    Generate Command Plan
  </button>
</div>
  </div>
)}
{/* 🧠 TOP AI RECOMMENDED ACTION */}


{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(109,61,245,0.20), rgba(15,23,42,0.96))",
      border: "1px solid rgba(168,85,247,0.28)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.35)",
    }}
  >
    <div
      style={{
        color: "#c4b5fd",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      Top AI Recommended Action
    </div>

    <h3
      style={{
        color: "white",
        fontSize: "26px",
        fontWeight: "950",
        margin: "0 0 10px",
      }}
    >
      {topAIAction?.title || "Operations Stable"}
    </h3>

    <p
      style={{
        color: "#cbd5e1",
        fontSize: "14px",
        lineHeight: 1.7,
        marginBottom: "18px",
      }}
    >
      {topAIAction?.recommendation}
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
      }}
    >
      <div
        style={{
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "800" }}>
          CATEGORY
        </div>
        <div style={{ color: "white", fontSize: "18px", fontWeight: "950" }}>
          {topAIAction?.category || "Monitoring"}
        </div>
      </div>

      <div
        style={{
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "800" }}>
          EST. IMPACT
        </div>
        <div style={{ color: "#22c55e", fontSize: "18px", fontWeight: "950" }}>
          {topAIAction?.impact || "+$0/mo"}
        </div>
      </div>

      <div
        style={{
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "800" }}>
          SEVERITY
        </div>
        <div
          style={{
            color:
              topAIAction?.severity === "Critical"
                ? "#f87171"
                : topAIAction?.severity === "Warning"
                ? "#facc15"
                : "#22c55e",
            fontSize: "18px",
            fontWeight: "950",
          }}
        >
          {topAIAction?.severity || "Healthy"}
        </div>
      </div>
    </div>
    {/* ⚡ AI ACTION CONTROLS */}
    <div
  style={{
    marginTop: "18px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={() => {
      setGeneratedCampaignPreview({
        title: topAIAction?.title || "AI Operational Action",
        sms:
          topAIAction?.recommendation ||
          "SerVen detected an operational opportunity.",
        emailBody:
          topAIAction?.recommendation ||
          "SerVen detected an operational opportunity.",
        audience: "Restaurant Operators",
        issue: topAIAction?.category || "Operations",
        reason: topAIAction?.severity || "Monitoring",
      });
    }}
    style={{
      padding: "12px 16px",
      borderRadius: "14px",
      border: "none",
      background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
      color: "white",
      fontWeight: "900",
      cursor: "pointer",
    }}
  >
    Generate Action Plan
  </button>

  <button
    type="button"
    onClick={() => {
      pushActivity(
        `Reviewed AI action: ${topAIAction?.title || "Operations Stable"}`,
        "ai"
      );
      setSavedMessage("AI action reviewed");
      setTimeout(() => setSavedMessage(""), 2000);
    }}
    style={{
      padding: "12px 16px",
      borderRadius: "14px",
      border: "1px solid rgba(148,163,184,0.22)",
      background: "rgba(15,23,42,0.85)",
      color: "white",
      fontWeight: "900",
      cursor: "pointer",
    }}
  >
    Mark Reviewed
  </button>
</div>
  </div>
)}
{/* 📋 AI OPERATIONS COMMAND */}
{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(212,175,55,0.14), rgba(15,23,42,0.96))",
      border: "1px solid rgba(212,175,55,0.24)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.28)",
    }}
  >
    <div
      style={{
        color: "#d4af37",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
    AI Operations Command
    </div>

    <h3 style={{ color: "white", margin: "0 0 10px", fontSize: "24px" }}>
      Restaurant Performance Brief
    </h3>

    <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.7 }}>
      {executiveSummary?.summary}
    </p>

{/* 📊 EXECUTIVE KPI STRIP */}


<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "18px",
  }}
>
  {[
    {
      label: "Critical Alerts",
      value: executiveSummary?.criticalAlerts || 0,
    },
    {
      label: "Warnings",
      value: executiveSummary?.warningAlerts || 0,
    },
    {
      label: "Projected Revenue",
      value: executiveSummary?.projectedRevenue || "$0",
    },
    {
      label: "Operational Risk",
      value: executiveSummary?.operationalRisk || "Controlled",
    },
  ].map((metric) => (
    <div
      key={metric.label}
      style={{
        padding: "14px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: "900",
          textTransform: "uppercase",
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
)}
{/* ⚡ AI AUTOPILOT ACTION CENTER */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(6,182,212,0.14), rgba(15,23,42,0.96))",
      border: "1px solid rgba(34,211,238,0.22)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.28)",
    }}
  >
    <div
      style={{
        color: "#67e8f9",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      AI Autopilot
    </div>

    <h3
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "950",
        margin: "0 0 10px",
      }}
    >
      Autopilot Action Center
    </h3>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
        marginBottom: "18px",
      }}
    >
      Automatically prioritizes critical alerts, staffing opportunities, and
      forecasting risks into AI-driven operational actions.
    </p>
{/* ========================= */}
{/* ⚡ AUTOPILOT KPI STRIP */}
{/* ========================= */}

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  }}
>
  {[
    {
      label: "Autopilot Actions",
      value: autopilotActions?.length || 0,
      sub: "AI-prioritized actions",
    },
    {
      label: "Critical Actions",
      value: (autopilotActions || []).filter(
        (action) => action.priority === "Critical"
      ).length,
      sub: "need immediate review",
    },
    {
      label: "Opportunities",
      value: (autopilotActions || []).filter(
        (action) => action.priority === "Opportunity"
      ).length,
      sub: "profit growth signals",
    },
  ].map((metric) => (
    <div
      key={metric.label}
      style={{
        padding: "14px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
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

      <div
        style={{
          color: "#64748b",
          fontSize: "12px",
          marginTop: "4px",
        }}
      >
        {metric.sub}
      </div>
    </div>
  ))}
</div>
    {(!autopilotActions || autopilotActions.length === 0) && (
      <div
        style={{
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#94a3b8",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        No autopilot actions yet. Upload sales, labor, invoice, ingredient, and
        menu data to activate operational automation.
      </div>
    )}

    <div style={{ display: "grid", gap: "12px" }}>
      {(autopilotActions || []).map((action, index) => (
        <div
          key={`${action.type}-${index}`}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background:
              action.priority === "Critical"
                ? "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(15,23,42,0.9))"
                : "rgba(255,255,255,0.04)",
            border:
              action.priority === "Critical"
                ? "1px solid rgba(239,68,68,0.18)"
                : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "8px",
            }}
          >
            <div style={{ color: "white", fontWeight: "900" }}>
              {action.title}
            </div>

            <div
              style={{
                color:
                  action.priority === "Critical"
                    ? "#f87171"
                    : action.priority === "Opportunity"
                    ? "#22c55e"
                    : "#facc15",
                fontSize: "12px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {action.priority}
            </div>
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {action.action}
          </div>

          <button
            type="button"
            onClick={() => {
              pushActivity(
                `Autopilot reviewed: ${action.title}`,
                "autopilot"
              );
              setSavedMessage("Autopilot action reviewed");
              setTimeout(() => setSavedMessage(""), 2000);
            }}
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(34,211,238,0.28)",
              background: "rgba(8,47,73,0.65)",
              color: "#cffafe",
              fontWeight: "900",
              cursor: "pointer",
            }}
          >
            Mark Action Reviewed
          </button>
        </div>
      ))}
    </div>
  </div>
)}

{/* 💰 AI PROFIT RECOVERY TRACKER */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(15,23,42,0.96))",
      border: "1px solid rgba(34,197,94,0.22)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.28)",
    }}
  >
    <div
      style={{
        color: "#86efac",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      AI Profit Recovery
    </div>

    <h3
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "950",
        margin: "0 0 10px",
      }}
    >
      Profit Recovery Tracker
    </h3>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
        marginBottom: "18px",
      }}
    >
      Estimates recovered and projected profit impact from AI alerts,
      operational actions, waste detection, labor optimization, and margin
      recovery.
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
      }}
    >
      {[
        {
          label: "Recovered Profit",
          value: `$${Number(aiProfitRecoveryData?.recovered || 0).toLocaleString()}`,
          sub: "from reviewed AI actions",
        },
        {
          label: "Projected Opportunity",
          value: `$${Number(aiProfitRecoveryData?.projected || 0).toLocaleString()}`,
          sub: "from open alerts",
        },
        {
          label: "Total Opportunity",
          value: `$${Number(aiProfitRecoveryData?.totalOpportunity || 0).toLocaleString()}`,
          sub: "monthly profit potential",
        },
      ].map((metric) => (
        <div
          key={metric.label}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "6px",
            }}
          >
            {metric.label}
          </div>

          <div
            style={{
              color: "#22c55e",
              fontSize: "26px",
              fontWeight: "950",
            }}
          >
            {metric.value}
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              marginTop: "4px",
            }}
          >
            {metric.sub}
          </div>
        </div>
      ))}
    </div>
    {/* ========================= */}
{/* 💸 PROFIT RECOVERY SIGNALS */}
{/* ========================= */}

<div
  style={{
    marginTop: "18px",
    padding: "16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }}
>
  <div
    style={{
      color: "#86efac",
      fontSize: "11px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "10px",
    }}
  >
    Recovery Signals
  </div>

  <div style={{ display: "grid", gap: "10px" }}>
    {[
      {
        label: "Open AI Alerts",
        value: aiProfitRecoveryData?.alertCount || 0,
      },
      {
        label: "Autopilot Actions",
        value: aiProfitRecoveryData?.actionCount || 0,
      },
      {
        label: "Recovery Status",
        value:
          Number(aiProfitRecoveryData?.totalOpportunity || 0) > 0
            ? "Active"
            : "Monitoring",
      },
    ].map((item) => (
      <div
        key={item.label}
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          color: "#cbd5e1",
          fontSize: "13px",
        }}
      >
        <span>{item.label}</span>
        <strong style={{ color: "white" }}>{item.value}</strong>
      </div>
    ))}
  </div>
</div>
  </div>
)}
{/* ========================= */}
{/* 📄 WEEKLY EXECUTIVE REPORT */}
{/* ========================= */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
      border: "1px solid rgba(212,175,55,0.22)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.28)",
    }}
  >
    <div
      style={{
        color: "#d4af37",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      Weekly Executive Report
    </div>

    <h3
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "950",
        margin: "0 0 10px",
      }}
    >
      Boardroom-Style Operational Report
    </h3>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
        marginBottom: "18px",
      }}
    >
      Summarizes weekly revenue forecasts, operational risk, AI alerts,
      autopilot actions, and profit recovery opportunities.
    </p>

   <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  }}
>
  {[
    {
      label: "Projected Revenue",
      value: weeklyExecutiveSummary?.projectedRevenue || "$0",
    },

    {
      label: "Risk Level",
      value:
        weeklyExecutiveSummary?.operationalRisk ||
        "Controlled",
    },

    {
      label: "AI Alerts",

      value:
        Number(
          weeklyExecutiveSummary?.criticalAlerts || 0
        ) +
        Number(
          weeklyExecutiveSummary?.warningAlerts || 0
        ),
    },

    {
      label: "Profit Opportunity",

      value: `$${Number(
        weeklyExecutiveSummary?.totalOpportunity || 0
      ).toLocaleString()}`,
    },
  ].map((metric) => (
    <div
      key={metric.label}
      style={{
        padding: "14px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: "900",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}
      >
        {metric.label}
      </div>

      <div
        style={{
          color: "white",
          fontSize: "22px",
          fontWeight: "950",
        }}
      >
        {metric.value}
      </div>
    </div>
  ))}
</div>

    <div
  style={{
    padding: "16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.7,
    marginBottom: "18px",
  }}
>
  {weeklyExecutiveSummary?.summary}
</div>

    <button
  type="button"
  onClick={() => {
    setGeneratedCampaignPreview({
      title: "Weekly Executive Report",

      sms:
        weeklyExecutiveSummary?.summary ||
        "Weekly executive report unavailable.",

      emailBody:
        weeklyExecutiveSummary?.summary ||
        "Weekly executive report unavailable.",

      audience: "Restaurant Operators",

      issue: "Weekly Executive Report",

      reason:
        weeklyExecutiveSummary?.operationalRisk ||
        "Monitoring",
    });

    pushActivity(
      "Generated weekly executive report draft",
      "report"
    );

    setSavedMessage("Weekly report draft generated");

    setTimeout(() => setSavedMessage(""), 2000);
  }}
  style={{
    padding: "12px 16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #d4af37, #f97316)",
    color: "#020617",
    fontWeight: "950",
    cursor: "pointer",
  }}
>
  Generate Weekly Report Draft
</button>
  </div>
)}
{/* 🚨 AI OPERATIONAL ALERT FEED */}


{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "20px",
      borderRadius: "22px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
      border: "1px solid rgba(239,68,68,0.18)",
    }}
  >
    <div
      style={{
        color: "#fca5a5",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      AI Operational Alert Feed
    </div>

    <h3 style={{ color: "white", margin: "0 0 10px", fontSize: "22px" }}>
      Real-Time Operational Risk Monitoring
    </h3>

    <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
      Aggregates margin risks, waste detection, labor inefficiencies, and
      vendor cost spikes into a unified operational intelligence feed.
    </p>

    {(!operationalAlerts || operationalAlerts.length === 0) && (
      <div
        style={{
          marginTop: "18px",
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#94a3b8",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        No operational alerts detected. Upload operational, invoice, labor,
        and ingredient data to activate AI monitoring.
      </div>
    )}

    <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
      {(operationalAlerts || []).map((alert, index) => (
        <div
          key={`${alert.type}-${index}`}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background:
              alert.severity === "Critical"
                ? "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(15,23,42,0.92))"
                : "linear-gradient(135deg, rgba(250,204,21,0.08), rgba(15,23,42,0.92))",

            border:
              alert.severity === "Critical"
                ? "1px solid rgba(239,68,68,0.18)"
                : "1px solid rgba(250,204,21,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                color: "white",
                fontWeight: "900",
              }}
            >
              {alert.title}
            </div>

            <div
              style={{
                color:
                  alert.severity === "Critical"
                    ? "#f87171"
                    : "#facc15",

                fontWeight: "900",
                fontSize: "12px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {alert.severity}
            </div>
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "13px",
              marginBottom: "8px",
            }}
          >
            {alert.detail}
          </div>

          <div
            style={{
              color: "#94a3b8",
              fontSize: "12px",
              lineHeight: 1.6,
            }}
          >
            {alert.recommendation}
          </div>

          <div
            style={{
              marginTop: "10px",
              color: "#64748b",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: "800",
            }}
          >
            {alert.type}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
          {aiPriceRecommendations.length > 0 ? (
            <>
              <div
                style={{
                  marginBottom: "24px",
                  padding: "18px",
                  borderRadius: "16px",
                  background: "rgba(79,70,229,0.12)",
                  border: "1px solid rgba(79,70,229,0.35)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    color: "#c7d2fe",
                    marginBottom: "10px",
                  }}
                >
                  🤖 AI Profit Recovery Recommendations
                </div>

                {aiPriceRecommendations.map((rec, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "12px",
                      padding: "12px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ fontWeight: "700", color: "white" }}>
                      {rec.item} ↑ {Number(rec.percentChange || 0).toFixed(1)}%
                    </div>

                    <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                      {rec.supplier}
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#e0e7ff",
                        fontSize: "13px",
                      }}
                    >
                      👉 {rec.suggestion}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateCampaignFromRecommendation(rec)}
                      style={{
                        marginTop: "10px",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
                        color: "white",
                        fontWeight: "700",
                        cursor: "pointer",
                        boxShadow: "0 10px 20px rgba(79,70,229,0.22)",
                      }}
                    >
                      Generate Campaign →
                    </button>
                  </div>
                ))}
              </div>

              {generatedCampaignPreview && (
                <div
                  style={{
                    marginTop: "18px",
                    padding: "18px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  }}
>
                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "700",
                          color: "white",
                          marginBottom: "8px",
                        }}
                      >
                        SMS Preview
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#cbd5e1",
                          lineHeight: 1.6,
                        }}
                      >
                        {generatedCampaignPreview.sms}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "700",
                          color: "white",
                          marginBottom: "8px",
                        }}
                      >
                        Email Preview
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#e2e8f0",
                          fontWeight: "700",
                          marginBottom: "6px",
                        }}
                      >
                        {generatedCampaignPreview.emailSubject}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#cbd5e1",
                          lineHeight: 1.6,
                        }}
                      >
                        {generatedCampaignPreview.emailBody}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {/* 🔥 PROFIT-DRIVEN CAMPAIGN BUTTON */}
<button
  type="button"
  onClick={() => {
    const campaign = getProfitDrivenCampaign();

    setGeneratedCampaignPreview({
      title: campaign.title,
      sms: campaign.sms,
      emailBody: campaign.emailBody,
      audience: campaign.audience,
      issue: campaign.issue,
      reason: campaign.reason,
    });

    
  }}
  style={{
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(212,175,55,0.35)",
    background:
      "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(109,61,245,0.18))",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
    marginRight: "10px",
  }}
>
  Generate Profit-Driven Campaign
</button>
                <button
  type="button"
  onClick={async () => {
    if (!generatedCampaignPreview) return;

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setSavedMessage("Session error");
        return;
      }

      const user = session?.user;

      if (!user?.id) {
        setSavedMessage("You must be logged in");
        return;
      }

      const payload = {
        user_id: user.id,

        campaign_name: generatedCampaignPreview.title,
        promotion_title: generatedCampaignPreview.sms,
        business_type: businessType || "restaurant",

        audience:
          generatedCampaignPreview.audience || "Returning Customers",
        timing: "This Week",
        expected_revenue: "+$1,200/mo",

        active: false,
        published_to_website: false,

        sms_title: generatedCampaignPreview.title,
        sms_body: generatedCampaignPreview.sms,

        email_title: generatedCampaignPreview.title,
        email_body:
          generatedCampaignPreview.emailBody ||
          generatedCampaignPreview.sms,

        in_store_title: generatedCampaignPreview.title,
        in_store_body:
          generatedCampaignPreview.emailBody ||
          generatedCampaignPreview.sms,

        social_title: generatedCampaignPreview.title,
        social_body: generatedCampaignPreview.sms,

        generated_sms: generatedCampaignPreview.sms,
        generated_email:
          generatedCampaignPreview.emailBody ||
          generatedCampaignPreview.sms,
        generated_social: generatedCampaignPreview.sms,
        generated_in_store:
          generatedCampaignPreview.emailBody ||
          generatedCampaignPreview.sms,
      };

      const { data, error } = await supabase
        .from("marketing_campaigns")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      const savedCampaign = {
        id: data.id,
        name: data.campaign_name || generatedCampaignPreview.title,
        offer: data.promotion_title || generatedCampaignPreview.sms,
        channel: "SMS / Email",
        audience:
          data.audience ||
          generatedCampaignPreview.audience ||
          "Returning Customers",
        timing: data.timing || "This Week",
        expectedRevenue: data.expected_revenue || "+$1,200/mo",
        impact: "+$1,200/mo",
        status: "draft",
        createdAt: data.created_at || new Date().toISOString(),
      };

      setSavedCampaigns((prev) => [savedCampaign, ...prev]);

      setWebsitePromo({
        title: generatedCampaignPreview.title,
        offer: generatedCampaignPreview.sms,
        body:
          generatedCampaignPreview.emailBody ||
          generatedCampaignPreview.sms,
      });

      setSelectedPromotion({
        title: generatedCampaignPreview.title,
        text: generatedCampaignPreview.sms,
      });

      setSavedMessage("Campaign saved as draft");
      pushActivity(
        `Saved campaign draft: ${generatedCampaignPreview.title}`,
        "save"
      );

      setTimeout(() => setSavedMessage(""), 2000);
    } catch (err) {
      console.error("Campaign save error FULL:", err);
      console.error("Message:", err?.message);
      console.error("Details:", err?.details);
      console.error("Hint:", err?.hint);
      console.error("Code:", err?.code);

      setSavedMessage(err?.message || "Failed to save campaign");
      setTimeout(() => setSavedMessage(""), 3000);
    }
  }}
  style={{
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(79,70,229,0.22)",
  }}
>
  Save Campaign →
</button>

                {(savedMessage === "Campaign launched" ||
                  savedMessage === "Auto campaign launched") && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.30)",
                      color: "#6ee7b7",
                      fontSize: "13px",
                      fontWeight: "700",
                    }}
                  >
                    ✅{" "}
                    {savedMessage === "Auto campaign launched"
                      ? "Auto campaign launched by AI"
                      : "Campaign is now live in your dashboard"}
                  </div>
                )}
              </div>
            </>
          ) : (
           <div
  style={{
    display: "grid",
    gap: "10px",
  }}
>
  {visibleAIActions.map((action, index) => (
    <div
      key={index}
      style={{
        padding: "12px",
        borderRadius: "14px",
        background: "rgba(15,23,42,0.72)",
        border: "1px solid rgba(148,163,184,0.14)",
      }}
    >
      <div style={{ fontSize: "13px", fontWeight: "800", color: "white" }}>
        🤖 {action.title}
      </div>

      <div
        style={{
          marginTop: "6px",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        {action.description || "AI-generated optimization"}
      </div>

      <div
        style={{
          marginTop: "6px",
          fontSize: "12px",
          color: "#22c55e",
          fontWeight: "900",
        }}
      >
        +${Number(action.impact || 0).toLocaleString()}/mo
      </div>
    </div>
  ))}
</div>

          )}
        </div>
       
{/* ✅ AI RESOLUTION TRACKING */}
{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(15,23,42,0.96))",
      border: "1px solid rgba(34,197,94,0.20)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.24)",
    }}
  >
    <div
      style={{
        color: "#86efac",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      AI Resolution Tracking
    </div>

    <h3
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "950",
        margin: "0 0 10px",
      }}
    >
      Operational Issue Resolution
    </h3>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
        marginBottom: "18px",
      }}
    >
      Tracks reviewed, unresolved, and recurring operational risks so SerVen can
      identify issues that need follow-up or escalation.
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
      }}
    >
      {[
        {
          label: "Resolved Issues",
          value: resolutionTrackingData?.resolvedCount || 0,
          sub: "reviewed actions",
        },
        {
          label: "Unresolved Issues",
          value: resolutionTrackingData?.unresolvedCount || 0,
          sub: "open risks",
        },
        {
          label: "Critical Open",
          value: resolutionTrackingData?.criticalUnresolved || 0,
          sub: "needs priority review",
        },
        {
          label: "Risk Trend",
          value: resolutionTrackingData?.recurringRisk || "Controlled",
          sub: "AI escalation status",
        },
      ].map((metric) => (
        <div
          key={metric.label}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: "900",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            {metric.label}
          </div>

          <div
            style={{
              color:
                metric.value === "Escalating"
                  ? "#f87171"
                  : metric.value === "Monitoring"
                  ? "#facc15"
                  : "white",
              fontSize: "24px",
              fontWeight: "950",
            }}
          >
            {metric.value}
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              marginTop: "4px",
            }}
          >
            {metric.sub}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{/* ========================= */}
{/* 🚨 AI ESCALATION INTELLIGENCE */}
{/* ========================= */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        escalationInsights?.escalationLevel === "Critical"
          ? "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(15,23,42,0.96))"
          : "linear-gradient(135deg, rgba(250,204,21,0.10), rgba(15,23,42,0.96))",
      border:
        escalationInsights?.escalationLevel === "Critical"
          ? "1px solid rgba(239,68,68,0.24)"
          : "1px solid rgba(250,204,21,0.20)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.24)",
    }}
  >
    <div
      style={{
        color:
          escalationInsights?.escalationLevel === "Critical"
            ? "#fca5a5"
            : "#fde68a",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      AI Escalation Intelligence
    </div>

    <h3
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "950",
        margin: "0 0 10px",
      }}
    >
      {escalationInsights?.escalationLevel || "Controlled"} Operational Status
    </h3>

    <p
      style={{
        color: "#cbd5e1",
        fontSize: "14px",
        lineHeight: 1.7,
        marginBottom: "18px",
      }}
    >
      {escalationInsights?.escalationMessage}
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
      }}
    >
      {[
        {
          label: "Unresolved",
          value: escalationInsights?.unresolved || 0,
        },
        {
          label: "Critical Open",
          value: escalationInsights?.critical || 0,
        },
        {
          label: "Escalation Level",
          value: escalationInsights?.escalationLevel || "Controlled",
        },
      ].map((metric) => (
        <div
          key={metric.label}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: "900",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            {metric.label}
          </div>

          <div
            style={{
              color:
                metric.value === "Critical"
                  ? "#f87171"
                  : metric.value === "Monitoring"
                  ? "#facc15"
                  : "white",
              fontSize: "24px",
              fontWeight: "950",
            }}
          >
            {metric.value}
          </div>
        </div>
      ))}
    </div>
    {/* ========================= */}
{/* 🚦 ESCALATION ACTION CONTROLS */}
{/* ========================= */}

<div
  style={{
    marginTop: "18px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={() => {
      pushActivity(
        `Escalation reviewed: ${
          escalationInsights?.escalationLevel || "Controlled"
        } status`,
        "escalation"
      );

      setSavedMessage("Escalation reviewed");
      setTimeout(() => setSavedMessage(""), 2000);
    }}
    style={{
      padding: "12px 16px",
      borderRadius: "14px",
      border: "1px solid rgba(250,204,21,0.28)",
      background: "rgba(250,204,21,0.10)",
      color: "#fde68a",
      fontWeight: "900",
      cursor: "pointer",
    }}
  >
    Mark Escalation Reviewed
  </button>

  <button
    type="button"
    onClick={() => {
      setGeneratedCampaignPreview({
        title: "AI Escalation Action Plan",
        sms:
          escalationInsights?.escalationMessage ||
          "AI detected operational escalation signals.",
        emailBody:
          escalationInsights?.escalationMessage ||
          "AI detected operational escalation signals.",
        audience: "Restaurant Operators",
        issue: "Operational Escalation",
        reason: escalationInsights?.escalationLevel || "Monitoring",
      });

      setSavedMessage("Escalation action plan generated");
      setTimeout(() => setSavedMessage(""), 2000);
    }}
    style={{
      padding: "12px 16px",
      borderRadius: "14px",
      border: "none",
      background:
        escalationInsights?.escalationLevel === "Critical"
          ? "linear-gradient(135deg, #ef4444, #f97316)"
          : "linear-gradient(135deg, #facc15, #f97316)",
      color: "#020617",
      fontWeight: "950",
      cursor: "pointer",
    }}
  >
    Generate Escalation Plan
  </button>
</div>
  </div>
)}
{/* ========================= */}
{/* 🤖 AUTONOMOUS OPERATIONS LAYER */}
{/* ========================= */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(15,23,42,0.96))",
      border: "1px solid rgba(56,189,248,0.22)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.24)",
    }}
  >
    <div
      style={{
        color: "#67e8f9",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      Autonomous Operations
    </div>

    <h3 style={{ color: "white", fontSize: "24px", fontWeight: "950" }}>
      AI Operational Execution Layer
    </h3>

    <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
      Converts escalation signals, pattern forecasts, and autopilot priorities
      into autonomous operational recommendations.
    </p>
{/* ========================= */}
{/* 🤖 AUTONOMOUS OPS KPI STRIP */}
{/* ========================= */}

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "18px",
    marginBottom: "18px",
  }}
>
  {[
    {
      label: "Autonomous Actions",
      value: autonomousOperations?.length || 0,
      sub: "AI execution signals",
    },
    {
      label: "Critical Actions",
      value: (autonomousOperations || []).filter(
        (item) => item.priority === "Critical"
      ).length,
      sub: "requires attention",
    },
    {
      label: "Execution Status",
      value:
        (autonomousOperations || []).length > 0 ? "Active" : "Monitoring",
      sub: "AI operating mode",
    },
  ].map((metric) => (
    <div
      key={metric.label}
      style={{
        padding: "14px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: "900",
          textTransform: "uppercase",
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

      <div
        style={{
          color: "#64748b",
          fontSize: "12px",
          marginTop: "4px",
        }}
      >
        {metric.sub}
      </div>
    </div>
  ))}
</div>

{(!autonomousOperations || autonomousOperations.length === 0) && (
  <div
    style={{
      padding: "14px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
      marginBottom: "18px",
    }}
  >
    No autonomous operations yet. As alerts, escalations, and pattern forecasts
    develop, AI execution signals will appear here.
  </div>
)}
    <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
      {(autonomousOperations || []).map((item, index) => (
        <div
          key={`${item.type}-${index}`}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ color: "white", fontWeight: "900" }}>
            {item.title}
          </div>

          <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "6px" }}>
            {item.action}
          </div>

          <div
            style={{
              marginTop: "8px",
              color: item.priority === "Critical" ? "#f87171" : "#22c55e",
              fontSize: "12px",
              fontWeight: "900",
            }}
          >
            {item.priority}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{/* ========================= */}
{/* 🕒 AI OPERATIONAL TIMELINE */}
{/* ========================= */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(15,23,42,0.96))",
      border: "1px solid rgba(96,165,250,0.20)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.24)",
    }}
  >
    <div
      style={{
        color: "#93c5fd",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      AI Operational Timeline
    </div>

    <h3
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "950",
        margin: "0 0 10px",
      }}
    >
      Operational Memory Feed
    </h3>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
        marginBottom: "18px",
      }}
    >
      Tracks AI alerts, reviewed actions, escalations, and operational activity
      so recurring issues can be monitored over time.
    </p>
{/* ========================= */}
{/* 🕒 TIMELINE KPI STRIP */}
{/* ========================= */}

<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  }}
>
  {[
    {
      label: "Timeline Events",
      value: operationalTimeline?.length || 0,
      sub: "recent AI activity",
    },
    {
      label: "Critical Events",
      value: (operationalTimeline || []).filter(
        (item) => item.severity === "Critical"
      ).length,
      sub: "urgent history",
    },
    {
      label: "Reviewed Actions",
      value: (operationalTimeline || []).filter(
        (item) =>
          String(item.title || "").toLowerCase().includes("reviewed")
      ).length,
      sub: "completed reviews",
    },
  ].map((metric) => (
    <div
      key={metric.label}
      style={{
        padding: "14px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: "900",
          textTransform: "uppercase",
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

      <div
        style={{
          color: "#64748b",
          fontSize: "12px",
          marginTop: "4px",
        }}
      >
        {metric.sub}
      </div>
    </div>
  ))}
</div>
    {(!operationalTimeline || operationalTimeline.length === 0) && (
      <div
        style={{
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#94a3b8",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        No operational timeline yet. AI activity, alerts, and reviewed actions
        will appear here as the system monitors restaurant operations.
      </div>
    )}

    <div style={{ display: "grid", gap: "12px" }}>
      {(operationalTimeline || []).map((item, index) => (
        <div
          key={`${item.type}-${index}`}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background:
              item.severity === "Critical"
                ? "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(15,23,42,0.9))"
                : item.severity === "Warning"
                ? "linear-gradient(135deg, rgba(250,204,21,0.08), rgba(15,23,42,0.9))"
                : "rgba(255,255,255,0.04)",
            border:
              item.severity === "Critical"
                ? "1px solid rgba(239,68,68,0.18)"
                : item.severity === "Warning"
                ? "1px solid rgba(250,204,21,0.18)"
                : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "6px",
            }}
          >
            <div style={{ color: "white", fontWeight: "900" }}>
              {item.title}
            </div>

            <div
              style={{
                color:
                  item.severity === "Critical"
                    ? "#f87171"
                    : item.severity === "Warning"
                    ? "#facc15"
                    : "#93c5fd",
                fontSize: "11px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {item.type}
            </div>
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {item.detail}
          </div>

          <div
            style={{
              marginTop: "8px",
              color: "#64748b",
              fontSize: "11px",
            }}
          >
            {new Date(item.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{/* ========================= */}
{/* 🧠 AI OPERATIONAL MEMORY INTELLIGENCE */}
{/* ========================= */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(109,61,245,0.12), rgba(15,23,42,0.96))",
      border: "1px solid rgba(168,85,247,0.22)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.24)",
    }}
  >
    <div
      style={{
        color: "#c4b5fd",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      AI Operational Memory
    </div>

    <h3
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "950",
        margin: "0 0 10px",
      }}
    >
      Recurring Issue Intelligence
    </h3>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
        marginBottom: "18px",
      }}
    >
      Detects repeated operational issues across alerts, reviews, and AI
      activity so chronic problems can be escalated instead of forgotten.
    </p>
{/* ========================= */}
{/* 🧠 MEMORY KPI STRIP */}
{/* ========================= */}

<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  }}
>
  {[
    {
      label: "Recurring Issues",
      value: operationalMemoryInsights?.length || 0,
      sub: "detected patterns",
    },
    {
      label: "Critical Patterns",
      value: (operationalMemoryInsights || []).filter(
        (issue) => issue.severity === "Critical"
      ).length,
      sub: "needs escalation",
    },
    {
      label: "Warning Patterns",
      value: (operationalMemoryInsights || []).filter(
        (issue) => issue.severity === "Warning"
      ).length,
      sub: "watch closely",
    },
  ].map((metric) => (
    <div
      key={metric.label}
      style={{
        padding: "14px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: "900",
          textTransform: "uppercase",
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

      <div
        style={{
          color: "#64748b",
          fontSize: "12px",
          marginTop: "4px",
        }}
      >
        {metric.sub}
      </div>
    </div>
  ))}
</div>
    {(!operationalMemoryInsights || operationalMemoryInsights.length === 0) && (
      <div
        style={{
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#94a3b8",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        No recurring operational patterns detected yet. As alerts and reviewed
        actions build up, repeated issues will appear here.
      </div>
    )}

    <div style={{ display: "grid", gap: "12px" }}>
      {(operationalMemoryInsights || []).map((issue, index) => (
        <div
          key={`${issue.title}-${index}`}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background:
              issue.severity === "Critical"
                ? "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(15,23,42,0.9))"
                : issue.severity === "Warning"
                ? "linear-gradient(135deg, rgba(250,204,21,0.08), rgba(15,23,42,0.9))"
                : "rgba(255,255,255,0.04)",
            border:
              issue.severity === "Critical"
                ? "1px solid rgba(239,68,68,0.18)"
                : issue.severity === "Warning"
                ? "1px solid rgba(250,204,21,0.18)"
                : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "8px",
            }}
          >
            <div style={{ color: "white", fontWeight: "900" }}>
              {issue.title}
            </div>

            <div
              style={{
                color:
                  issue.severity === "Critical"
                    ? "#f87171"
                    : issue.severity === "Warning"
                    ? "#facc15"
                    : "#93c5fd",
                fontSize: "11px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {issue.severity}
            </div>
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            Repeated {issue.occurrences} times in operational history.
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{/* ========================= */}
{/* 🔮 AI OPERATIONAL PATTERN FORECASTING */}
{/* ========================= */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "22px",
      borderRadius: "24px",
      background:
        operationalPatternForecast?.forecastStatus === "High Risk"
          ? "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(15,23,42,0.96))"
          : operationalPatternForecast?.forecastStatus === "Watch Closely"
          ? "linear-gradient(135deg, rgba(250,204,21,0.10), rgba(15,23,42,0.96))"
          : "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(15,23,42,0.96))",
      border:
        operationalPatternForecast?.forecastStatus === "High Risk"
          ? "1px solid rgba(239,68,68,0.24)"
          : operationalPatternForecast?.forecastStatus === "Watch Closely"
          ? "1px solid rgba(250,204,21,0.20)"
          : "1px solid rgba(96,165,250,0.20)",
      boxShadow: "0 22px 60px rgba(2,6,23,0.24)",
    }}
  >
    <div
      style={{
        color:
          operationalPatternForecast?.forecastStatus === "High Risk"
            ? "#fca5a5"
            : operationalPatternForecast?.forecastStatus === "Watch Closely"
            ? "#fde68a"
            : "#93c5fd",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      AI Pattern Forecasting
    </div>

    <h3
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "950",
        margin: "0 0 10px",
      }}
    >
      {operationalPatternForecast?.forecastStatus || "Stable"} Operational Pattern
    </h3>

    <p
      style={{
        color: "#cbd5e1",
        fontSize: "14px",
        lineHeight: 1.7,
        marginBottom: "18px",
      }}
    >
      {operationalPatternForecast?.forecastMessage}
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
      }}
    >
      {[
        {
          label: "Critical Patterns",
          value: operationalPatternForecast?.criticalPatterns || 0,
        },
        {
          label: "Warning Patterns",
          value: operationalPatternForecast?.warningPatterns || 0,
        },
        {
          label: "Forecast Status",
          value: operationalPatternForecast?.forecastStatus || "Stable",
        },
      ].map((metric) => (
        <div
          key={metric.label}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: "900",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            {metric.label}
          </div>

          <div
            style={{
              color:
                metric.value === "High Risk"
                  ? "#f87171"
                  : metric.value === "Watch Closely"
                  ? "#facc15"
                  : "white",
              fontSize: "24px",
              fontWeight: "950",
            }}
          >
            {metric.value}
          </div>
        </div>
      ))}
    </div>
    {/* ========================= */}
{/* 🔮 PATTERN FORECAST ACTION CONTROLS */}
{/* ========================= */}

<div
  style={{
    marginTop: "18px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={() => {
      pushActivity(
        `Reviewed pattern forecast: ${
          operationalPatternForecast?.forecastStatus || "Stable"
        }`,
        "forecast"
      );

      setSavedMessage("Pattern forecast reviewed");
      setTimeout(() => setSavedMessage(""), 2000);
    }}
    style={{
      padding: "12px 16px",
      borderRadius: "14px",
      border: "1px solid rgba(96,165,250,0.28)",
      background: "rgba(30,64,175,0.22)",
      color: "#bfdbfe",
      fontWeight: "900",
      cursor: "pointer",
    }}
  >
    Mark Forecast Reviewed
  </button>

  <button
    type="button"
    onClick={() => {
      setGeneratedCampaignPreview({
        title: "AI Pattern Forecast Action Plan",
        sms:
          operationalPatternForecast?.forecastMessage ||
          "AI detected operational pattern signals.",
        emailBody:
          operationalPatternForecast?.forecastMessage ||
          "AI detected operational pattern signals.",
        audience: "Restaurant Operators",
        issue: "Operational Pattern Forecast",
        reason: operationalPatternForecast?.forecastStatus || "Stable",
      });

      setSavedMessage("Pattern action plan generated");
      setTimeout(() => setSavedMessage(""), 2000);
    }}
    style={{
      padding: "12px 16px",
      borderRadius: "14px",
      border: "none",
      background:
        operationalPatternForecast?.forecastStatus === "High Risk"
          ? "linear-gradient(135deg, #ef4444, #f97316)"
          : operationalPatternForecast?.forecastStatus === "Watch Closely"
          ? "linear-gradient(135deg, #facc15, #f97316)"
          : "linear-gradient(135deg, #3b82f6, #6366f1)",
      color: "white",
      fontWeight: "950",
      cursor: "pointer",
    }}
  >
    Generate Forecast Plan
  </button>
</div>
  </div>
)}
        {/* ========================= */}
{/* 🔮 AI FORECASTING & PREDICTIVE INTELLIGENCE */}
{/* ========================= */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "20px",
      borderRadius: "22px",
      background:
        "linear-gradient(135deg, rgba(30,41,59,0.96), rgba(15,23,42,0.94))",
      border: "1px solid rgba(129,140,248,0.22)",
    }}
  >
    <div
      style={{
        color: "#c4b5fd",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      AI Forecasting
    </div>

    <h3 style={{ color: "white", margin: "0 0 10px", fontSize: "22px" }}>
      Predictive Restaurant Intelligence
    </h3>

    <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
      Projects revenue, profitability health, and operational risk using recent
      sales, labor, and margin signals.
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginTop: "18px",
      }}
    >
      {(forecastingInsights || []).map((item) => (
        <div
          key={item.label}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "6px",
            }}
          >
            {item.label}
          </div>

          <div
            style={{
              color:
                item.value === "Critical"
                  ? "#f87171"
                  : item.value === "Watch Closely"
                  ? "#facc15"
                  : item.value === "Growing"
                  ? "#22c55e"
                  : "white",
              fontSize: "24px",
              fontWeight: "950",
            }}
          >
            {item.value}
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              marginTop: "4px",
            }}
          >
            {item.subtext}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
      </div>
    </>
  )}

  {activeTab === "growth" && (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            padding: "18px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #111827, #1f2937)",
            color: "white",
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "6px" }}>
            AI PROFIT ALERT
          </div>

          <div style={{ fontSize: "18px", fontWeight: "800", marginBottom: "10px" }}>
            You’re missing profit opportunities
          </div>
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "14px",
  }}
>
  <div
    style={{
      fontSize: "13px",
      color: "#94a3b8",
    }}
  >
    Let Serven apply the highest-impact fix first
  </div>

  <button
    onClick={applyTopRecommendedFix}
    disabled={!topAIActions?.length}
    style={{
      padding: "10px 14px",
      borderRadius: "12px",
      border: "none",
      background: topAIActions?.length
        ? "linear-gradient(135deg, #22c55e, #16a34a)"
        : "rgba(148,163,184,0.18)",
      color: "white",
      fontWeight: "800",
      cursor: topAIActions?.length ? "pointer" : "not-allowed",
      opacity: topAIActions?.length ? 1 : 0.6,
    }}
  >
    Auto Apply Top Fix
  </button>
</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
           {topAIActions?.map((item, i) => {
  const isSelectedFix =
    selectedAlertAction &&
    String(item.name || "").toLowerCase() ===
      String(selectedAlertAction || "").toLowerCase();

  return (
    <div
  key={i}
  ref={isSelectedFix ? selectedAiFixRef : null}
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: isSelectedFix
      ? "rgba(79,70,229,0.16)"
      : "rgba(255,255,255,0.05)",
    padding: "12px",
    borderRadius: "12px",
    border: isSelectedFix
      ? "1px solid rgba(79,70,229,0.32)"
      : "1px solid rgba(148,163,184,0.12)",
    boxShadow: isSelectedFix
      ? "0 0 0 1px rgba(99,102,241,0.18), 0 10px 25px rgba(79,70,229,0.18)"
      : "none",
    transition: "0.25s ease",
  }}
>
      {/* 🔥 Highlight badge */}
      {isSelectedFix && (
        <div
          style={{
            fontSize: "10px",
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#c7d2fe",
          }}
        >
          Recommended for active alert
        </div>
      )}

      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  <div style={{ fontSize: "13px", color: "#e2e8f0" }}>
    {item.name}
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <div style={{ fontWeight: "800", color: "#22c55e" }}>
      +${Number(item.estimatedGain || 0).toFixed(0)}/mo
    </div>

    {appliedFixes.includes(item.name) && (
      <div
        style={{
          padding: "4px 8px",
          borderRadius: "999px",
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.18)",
          color: "#86efac",
          fontSize: "10px",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Applied
      </div>
    )}
  </div>
</div>
      {/* ✅ Apply Fix button */}
      <button
  onClick={() => {
    if (appliedFixes.includes(item.name)) return;

    const value = Number(item.estimatedGain || 0);

    setSimulatedProfit((prev) => prev + value);

    setAppliedFixes((prev) =>
      prev.includes(item.name) ? prev : [...prev, item.name]
    );

    setAiLog((prev) =>
      [
        {
          id: Date.now(),
          text: `AI command applied: ${item.name} → +$${value}/mo`,
        },
        ...prev,
      ].slice(0, 6)
    );

    setSelectedAlertAction(null);
  }}
  disabled={appliedFixes.includes(item.name)}
  style={{
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    background: appliedFixes.includes(item.name)
      ? "rgba(148,163,184,0.18)"
      : "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    fontSize: "11px",
    fontWeight: "800",
    cursor: appliedFixes.includes(item.name) ? "not-allowed" : "pointer",
    alignSelf: "flex-start",
    opacity: appliedFixes.includes(item.name) ? 0.7 : 1,
  }}
>
  {appliedFixes.includes(item.name) ? "Applied" : "Apply Fix"}
</button>
    </div>
  );
})}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
            color: "white",
            padding: "20px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "12px", opacity: 0.8 }}>AI Insight</div>

          <div style={{ fontSize: "20px", fontWeight: "700", marginTop: "6px" }}>
            {wowInsight?.title}
          </div>

          <div style={{ fontSize: "28px", fontWeight: "800", marginTop: "6px" }}>
            {wowInsight?.value}
          </div>

          <div style={{ fontSize: "13px", marginTop: "8px", opacity: 0.9 }}>
            {wowInsight?.message}
          </div>
        </div>

       <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  }}
>
          <GlassCard
            title="AI Score"
            value={`${Number(score || 0)}/100`}
            subtext="AI-rated business health"
          />

          <GlassCard
            title="Health Status"
            value={
              Number(score || 0) >= 80
                ? "Strong"
                : Number(score || 0) >= 60
                ? "Stable"
                : "Needs Attention"
            }
            subtext="Overall system performance"
          />
        </div>

        <div style={valueBanner}>
          <h2 style={{ margin: 0, fontSize: "28px", color: "#ffffff" }}>
            You’re losing{" "}
            <span style={{ color: "#ef4444", fontWeight: "800" }}>
              ${Number(profitBoost || 0).toLocaleString()}/month
            </span>
          </h2>

          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginTop: "10px",
              marginBottom: "16px",
            }}
          >
            AI detected pricing, cost, and operational inefficiencies.
          </p>

          <button
            style={{
              background: "#6D3DF5",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Fix This Now →
          </button>
        </div>

        <div>
          <h3 style={sectionTitle}>
            {currentShelfLifeCopy?.title || "Shelf Life Tracking"}
          </h3>

          <p style={sectionSubtle}>
            {currentShelfLifeCopy?.subtitle || "Track inventory freshness"}
          </p>

          <div
            style={{
              position: "relative",
              padding: "20px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
            }}
          >
            <div
              style={{
                filter: hasGrowthAccess ? "none" : "blur(4px)",
                opacity: hasGrowthAccess ? 1 : 0.6,
                pointerEvents: hasGrowthAccess ? "auto" : "none",
              }}
            >
              <div
                style={{
                  marginBottom: "16px",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "rgba(79,70,229,0.12)",
                  border: "1px solid rgba(129,140,248,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#a5b4fc",
                    fontWeight: "700",
                    marginBottom: "6px",
                  }}
                >
                  Shelf life insight
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#e2e8f0",
                    lineHeight: 1.5,
                  }}
                >
                  {shelfLifeInsight}
                </p>
              </div>

{/* ⚡ LIVE AI OPERATIONS FEED */}

              <Section title="📊 AI Activity Feed">
                <div style={{ display: "grid", gap: "10px" }}>
                  {activityFeed.map((item) => {
  const isAutopilot = item.type === "autopilot";

  return (
    <div
      key={item.id}
      style={{
        padding: "14px",
        borderRadius: "14px",
        background: isAutopilot
          ? "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(15,23,42,0.9))"
          : "rgba(255,255,255,0.04)",
        border: isAutopilot
          ? "1px solid rgba(34,197,94,0.25)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isAutopilot
          ? "0 10px 30px rgba(34,197,94,0.12)"
          : "none",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          marginBottom: "6px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "900",
            color: isAutopilot ? "#86efac" : "#a78bfa",
            letterSpacing: "0.5px",
          }}
        >
          {isAutopilot ? "AI AUTOPILOT" : item.type.toUpperCase()}
        </div>

        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
          {item.time}
        </div>
      </div>

      {/* MAIN TEXT */}
      <div
        style={{
          fontSize: "13px",
          color: "#e2e8f0",
          lineHeight: 1.5,
          fontWeight: isAutopilot ? "600" : "500",
        }}
      >
        {item.text}
      </div>
{item.aiReasoning && (
  <div
    style={{
      marginTop: "10px",
      padding: "10px",
      borderRadius: "12px",
      background: "rgba(15,23,42,0.55)",
      border: "1px solid rgba(134,239,172,0.18)",
      color: "#cbd5e1",
      fontSize: "12px",
      lineHeight: 1.5,
    }}
  >
    <span style={{ color: "#86efac", fontWeight: "900" }}>
      AI Reasoning:
    </span>{" "}
    {item.aiReasoning}
  </div>
)}
{item.aiConfidence && (
  <div
    style={{
      marginTop: "8px",
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    }}
  >
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "999px",
        background: "rgba(99,102,241,0.15)",
        color: "#c7d2fe",
        fontSize: "11px",
        fontWeight: "900",
      }}
    >
      Confidence: {item.aiConfidence}%
    </span>

    <span
      style={{
        padding: "4px 8px",
        borderRadius: "999px",
        background: "rgba(34,197,94,0.15)",
        color: "#86efac",
        fontSize: "11px",
        fontWeight: "900",
      }}
    >
      +{item.expectedLift}% Lift
    </span>
  </div>
)}
      {/* EXTRA DETAILS (ONLY FOR AUTOPILOT) */}
      {isAutopilot && (
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {item.campaignName && (
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "999px",
                background: "rgba(99,102,241,0.15)",
                color: "#c7d2fe",
                fontSize: "11px",
                fontWeight: "800",
              }}
            >
              {item.campaignName}
            </span>
          )}

          {item.expectedRevenue && (
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "999px",
                background: "rgba(34,197,94,0.15)",
                color: "#86efac",
                fontSize: "11px",
                fontWeight: "900",
              }}
            >
              {item.expectedRevenue}
            </span>
          )}

          {item.status && (
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "999px",
                background: "rgba(34,197,94,0.18)",
                color: "#86efac",
                fontSize: "11px",
                fontWeight: "900",
              }}
            >
              {item.status.toUpperCase()}
            </span>
          )}
        </div>
      )}
    </div>
  );
})}
                </div>
              </Section>

              {shelfLifeLoss > 0 && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#fbbf24",
                  }}
                >
                  Estimated spoilage exposure: $
                  {Number(shelfLifeLoss || 0).toLocaleString()}
                </div>
              )}

              {shelfLifeRiskItems?.length ? (
                shelfLifeRiskItems.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background:
                        item.shelfStatus === "expired"
                          ? "rgba(239,68,68,0.12)"
                          : item.shelfStatus === "critical"
                          ? "rgba(245,158,11,0.12)"
                          : "rgba(234,179,8,0.12)",
                      marginBottom: "8px",
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
                      <div style={{ fontWeight: "600", color: "#ffffff" }}>
                        {item.name}
                      </div>

                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color:
                            item.shelfStatus === "expired"
                              ? "#fca5a5"
                              : item.shelfStatus === "critical"
                              ? "#fdba74"
                              : "#fde047",
                        }}
                      >
                        {item.shelfStatus.toUpperCase()}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "13px",
                        color: "#94a3b8",
                      }}
                    >
                      Expires on {item.expirationDate}
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "13px",
                        fontWeight: "700",
                        color:
                          item.daysRemaining <= 0
                            ? "#f87171"
                            : item.daysRemaining <= 2
                            ? "#f59e0b"
                            : "#eab308",
                      }}
                    >
                      {item.daysRemaining <= 0
                        ? `${Math.abs(item.daysRemaining)} days overdue`
                        : `${item.daysRemaining} days remaining`}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#f87171",
                        fontWeight: "600",
                      }}
                    >
                      Potential loss: ${Number(item.cost || 0).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                  No shelf life risks detected right now.
                </div>
              )}
            </div>

            {!hasGrowthAccess && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(15,23,42,0.72)",
                  backdropFilter: "blur(3px)",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <h4 style={{ marginBottom: "8px", color: "#ffffff" }}>
                  🔒{" "}
                  {currentShelfLifeCopy?.lockedTitle ||
                    "Unlock Shelf Life Tracking"}
                </h4>

                <p
                  style={{
                    fontSize: "12px",
                    color: "#cbd5e1",
                    marginBottom: "12px",
                    maxWidth: "240px",
                  }}
                >
                  {currentShelfLifeCopy?.lockedText ||
                    "Track ingredients close to expiration."}
                </p>

                <button
                  onClick={() => router.push("/pricing")}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "800",
                    boxShadow: "0 10px 20px rgba(79,70,229,0.25)",
                  }}
                >
                  Upgrade to Pro →
                </button>
              </div>
            )}
          </div>
        </div>

        {growthRecoverableProfit > 0 && (
          <div
            style={{
              marginTop: "6px",
              marginBottom: "4px",
              padding: "18px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #fef2f2, #fff7ed)",
              border: "1px solid #fecaca",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#991b1b",
                fontWeight: "600",
                marginBottom: "6px",
              }}
            >
              AI detected recoverable profit
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "#7f1d1d",
              }}
            >
              ${Number(growthRecoverableProfit || 0).toLocaleString()}/month
            </div>

            <p style={{ marginTop: "6px", fontSize: "12px", color: "#7c2d12" }}>
              Based on item-level diagnosis and margin leakage patterns.
            </p>
          </div>
        )}

        
{/* GROWTH DIAGNOSIS */}

<div
  style={{
    padding: "20px",
    borderRadius: "22px",
    background:
      "radial-gradient(circle at top right, rgba(168,85,247,0.12), transparent 40%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
    marginBottom: "4px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "16px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#c4b5fd",
          marginBottom: "6px",
        }}
      >
        Growth Intelligence
      </div>

      <h3
        style={{
          margin: 0,
          color: "white",
          fontSize: "22px",
          fontWeight: "950",
        }}
      >
        Growth diagnosis
      </h3>

      <p
        style={{
          margin: "6px 0 0",
          color: "#94a3b8",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        AI-ranked issues slowing revenue, margin, or customer growth.
      </p>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(168,85,247,0.12)",
        border: "1px solid rgba(168,85,247,0.22)",
        color: "#d8b4fe",
        fontSize: "12px",
        fontWeight: "900",
      }}
    >
      {growthDiagnosis?.length || 0} findings
    </div>
  </div>

  {growthDiagnosis?.length ? (
    <div style={{ display: "grid", gap: "10px" }}>
      {growthDiagnosis.map((item, i) => {
        const severity = String(item.severity || "low").toLowerCase();

        const tone =
          severity === "high"
            ? {
                bg: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.24)",
                color: "#fca5a5",
              }
            : severity === "medium"
            ? {
                bg: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.24)",
                color: "#fde68a",
              }
            : {
                bg: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.22)",
                color: "#86efac",
              };

        const confidence = String(item.confidence || "low").toLowerCase();

        return (
          <div
            key={`${item.name || "growth"}-${i}`}
            style={{
              padding: "14px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(148,163,184,0.12)",
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
              <div style={{ fontWeight: "900", color: "white" }}>
                #{item.priority || i + 1} {item.name}
              </div>

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "900",
                  background: tone.bg,
                  border: tone.border,
                  color: tone.color,
                  textTransform: "uppercase",
                }}
              >
                {severity}
              </div>
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                marginTop: "8px",
                lineHeight: 1.6,
              }}
            >
              {item.issue}
            </div>

            <div
              style={{
                marginTop: "10px",
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  color: "#fca5a5",
                  fontWeight: "900",
                  fontSize: "13px",
                }}
              >
                ${Number(item.impact || 0).toFixed(0)}/mo leak
              </div>

              <div
                style={{
                  padding: "5px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "900",
                  background:
                    confidence === "high"
                      ? "rgba(34,197,94,0.12)"
                      : confidence === "medium"
                      ? "rgba(245,158,11,0.12)"
                      : "rgba(239,68,68,0.12)",
                  color:
                    confidence === "high"
                      ? "#86efac"
                      : confidence === "medium"
                      ? "#fde68a"
                      : "#fca5a5",
                  textTransform: "uppercase",
                }}
              >
                {confidence} confidence
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <div
      style={{
        height: "150px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        textAlign: "center",
        borderRadius: "18px",
        border: "1px dashed rgba(148,163,184,0.2)",
        background: "rgba(15,23,42,0.5)",
        fontSize: "13px",
      }}
    >
      No growth diagnosis available yet.
    </div>
  )}
</div>

{/* STAFF PLANNING + DEMAND FORECASTING */}

<div
  style={{
    marginTop: "10px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  }}
>
  
  {/* STAFF PLANNING SIGNALS */}
  
  <div
    style={{
      position: "relative",
      padding: "20px",
      borderRadius: "22px",
      background:
        "radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 40%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
      border: "1px solid rgba(148,163,184,0.16)",
      boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        filter: hasProAccess ? "none" : "blur(5px)",
        opacity: hasProAccess ? 1 : 0.6,
        pointerEvents: hasProAccess ? "auto" : "none",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            letterSpacing: "0.08em",
            color: "#93c5fd",
            textTransform: "uppercase",
          }}
        >
          Labor Intelligence
        </div>

        <h3
          style={{
            margin: "6px 0 4px",
            color: "white",
            fontSize: "22px",
            fontWeight: "950",
          }}
        >
          Staff planning signals
        </h3>

        <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
          AI flags overstaffed and understaffed days before margin gets hit.
        </p>
      </div>

      <div
        style={{
          marginBottom: "16px",
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(59,130,246,0.10)",
          border: "1px solid rgba(96,165,250,0.20)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            color: "#93c5fd",
            marginBottom: "6px",
          }}
        >
          Staffing AI insight
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#bfdbfe",
            lineHeight: 1.6,
          }}
        >
          {staffPlanningInsight ||
            "Upload labor and revenue data to generate staff planning signals."}
        </p>
      </div>

      {staffPlanningSignals?.length ? (
        <div style={{ display: "grid", gap: "10px" }}>
          {staffPlanningSignals.slice(0, 5).map((item, i) => {
            const signal = String(item.signal || "monitor").toLowerCase();

            const signalTone =
              signal === "overstaffed"
                ? {
                    bg: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.24)",
                    color: "#fca5a5",
                  }
                : signal === "understaffed"
                ? {
                    bg: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.24)",
                    color: "#fde68a",
                  }
                : {
                    bg: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.22)",
                    color: "#86efac",
                  };

            return (
              <div
                key={`${item.day || "staff"}-${i}`}
                style={{
                  padding: "14px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(148,163,184,0.12)",
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
                  <div style={{ fontWeight: "900", color: "white" }}>
                    {item.day || "Day"}
                  </div>

                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: "900",
                      background: signalTone.bg,
                      border: signalTone.border,
                      color: signalTone.color,
                      textTransform: "uppercase",
                    }}
                  >
                    {signal}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#94a3b8",
                    marginTop: "6px",
                    lineHeight: 1.6,
                  }}
                >
                  {item.insight || "No insight available."}
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      color: "white",
                      fontSize: "13px",
                      fontWeight: "900",
                    }}
                  >
                    Labor: {Number(item.laborPercent || 0).toFixed(1)}%
                  </div>

                  <div
                    style={{
                      color: signalTone.color,
                      fontSize: "13px",
                      fontWeight: "900",
                    }}
                  >
                    ${Number(item.estimatedImpact || 0).toFixed(0)}/day impact
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            height: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            textAlign: "center",
            borderRadius: "18px",
            border: "1px dashed rgba(148,163,184,0.2)",
            background: "rgba(15,23,42,0.5)",
            fontSize: "13px",
          }}
        >
          No staff planning issues detected yet.
        </div>
      )}
    </div>

    {!hasProAccess && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(15,23,42,0.85)",
          backdropFilter: "blur(6px)",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <h4 style={{ color: "white", marginBottom: "8px" }}>
          🔒 Unlock Staff Planning Signals
        </h4>

        <p style={{ fontSize: "12px", color: "#cbd5f5", marginBottom: "12px" }}>
          Let AI identify overstaffed and understaffed days.
        </p>

        <button
          onClick={() => router.push("/pricing")}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
            color: "white",
            fontWeight: "800",
            boxShadow: "0 10px 25px rgba(79,70,229,0.35)",
            cursor: "pointer",
          }}
        >
          Upgrade to Pro →
        </button>
      </div>
    )}
  </div>

  
  {/* DEMAND FORECASTING */}
  
  <div
    style={{
      position: "relative",
      padding: "20px",
      borderRadius: "22px",
      background:
        "radial-gradient(circle at top right, rgba(168,85,247,0.12), transparent 40%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
      border: "1px solid rgba(148,163,184,0.16)",
      boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        filter: hasProAccess ? "none" : "blur(5px)",
        opacity: hasProAccess ? 1 : 0.6,
        pointerEvents: hasProAccess ? "auto" : "none",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            letterSpacing: "0.08em",
            color: "#c4b5fd",
            textTransform: "uppercase",
          }}
        >
          Forecast Intelligence
        </div>

        <h3
          style={{
            margin: "6px 0 4px",
            color: "white",
            fontSize: "22px",
            fontWeight: "950",
          }}
        >
          Demand forecasting
        </h3>

        <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
          Predict future revenue and demand spikes before they happen.
        </p>
      </div>

      <div
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(168,85,247,0.10)",
          border: "1px solid rgba(168,85,247,0.20)",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            color: "#c4b5fd",
          }}
        >
          Forecasted next day revenue
        </div>

        <div
          style={{
            fontSize: "34px",
            fontWeight: "950",
            color: "white",
            marginTop: "6px",
          }}
        >
          ${Number(forecastedNextDayRevenue || 0).toLocaleString()}
        </div>
      </div>

      <div
        style={{
          display: "inline-flex",
          padding: "8px 12px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: "900",
          background:
            forecastConfidence === "high"
              ? "rgba(34,197,94,0.12)"
              : forecastConfidence === "medium"
              ? "rgba(245,158,11,0.12)"
              : "rgba(239,68,68,0.12)",
          border:
            forecastConfidence === "high"
              ? "1px solid rgba(34,197,94,0.22)"
              : forecastConfidence === "medium"
              ? "1px solid rgba(245,158,11,0.22)"
              : "1px solid rgba(239,68,68,0.22)",
          color:
            forecastConfidence === "high"
              ? "#86efac"
              : forecastConfidence === "medium"
              ? "#fde68a"
              : "#fca5a5",
          textTransform: "uppercase",
        }}
      >
        {forecastConfidence || "low"} confidence
      </div>
    </div>

    {!hasProAccess && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(15,23,42,0.85)",
          backdropFilter: "blur(6px)",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <h4 style={{ color: "white", marginBottom: "8px" }}>
          🔒 Unlock Demand Forecasting
        </h4>

        <p style={{ fontSize: "12px", color: "#cbd5f5", marginBottom: "12px" }}>
          Predict future revenue and demand spikes.
        </p>

        <button
          onClick={() => router.push("/pricing")}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
            color: "white",
            fontWeight: "800",
            boxShadow: "0 10px 25px rgba(79,70,229,0.35)",
            cursor: "pointer",
          }}
        >
          Upgrade to Pro →
        </button>
      </div>
    )}
  </div>
</div>

{/* INVENTORY FORECASTING */}

<div
  style={{
    marginTop: "10px",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
  }}
>
  <div
    style={{
      padding: "20px",
      borderRadius: "22px",
      background:
        "radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 40%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
      border: "1px solid rgba(148,163,184,0.16)",
      boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "16px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            letterSpacing: "0.08em",
            color: "#93c5fd",
            textTransform: "uppercase",
          }}
        >
          Inventory Intelligence
        </div>

        <h3
          style={{
            margin: "6px 0 4px",
            color: "white",
            fontSize: "22px",
            fontWeight: "950",
          }}
        >
          Inventory forecasting
        </h3>

        <p
          style={{
            margin: 0,
            color: "#94a3b8",
            fontSize: "13px",
          }}
        >
          Predict shortages, inventory risk, and future restocking pressure.
        </p>
      </div>

      <div
        style={{
          padding: "8px 12px",
          borderRadius: "999px",
          background: "rgba(59,130,246,0.12)",
          border: "1px solid rgba(59,130,246,0.22)",
          color: "#93c5fd",
          fontSize: "12px",
          fontWeight: "900",
        }}
      >
        {inventoryForecast?.length || 0} tracked items
      </div>
    </div>

    <div
      style={{
        filter: hasProAccess ? "none" : "blur(5px)",
        opacity: hasProAccess ? 1 : 0.6,
        pointerEvents: hasProAccess ? "auto" : "none",
      }}
    >
      <div
        style={{
          marginBottom: "16px",
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(59,130,246,0.10)",
          border: "1px solid rgba(96,165,250,0.20)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            color: "#93c5fd",
            marginBottom: "6px",
          }}
        >
          Inventory AI insight
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#bfdbfe",
            lineHeight: 1.6,
          }}
        >
          {inventoryForecastInsight || "Upload ingredient data to generate inventory forecasting insights."}
        </p>
      </div>

      {inventoryForecast?.length ? (
        <div style={{ display: "grid", gap: "10px" }}>
          {inventoryForecast.slice(0, 5).map((item, i) => {
            const risk = String(item.inventoryRisk || "medium").toLowerCase();

            const riskStyle =
              risk === "high"
                ? {
                    bg: "rgba(239,68,68,0.14)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#fca5a5",
                  }
                : risk === "low"
                ? {
                    bg: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.22)",
                    color: "#86efac",
                  }
                : {
                    bg: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.22)",
                    color: "#fde68a",
                  };

            return (
              <div
                key={`${item.name || "inventory"}-${i}`}
                style={{
                  padding: "14px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(148,163,184,0.12)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "900",
                        color: "white",
                        fontSize: "15px",
                      }}
                    >
                      {item.name || "Ingredient"}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        marginTop: "5px",
                      }}
                    >
                      Stock: {Number(item.currentStock || 0).toFixed(0)} • Daily use:{" "}
                      {Number(item.dailyUsage || 0).toFixed(1)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: "900",
                      background: riskStyle.bg,
                      border: riskStyle.border,
                      color: riskStyle.color,
                      textTransform: "uppercase",
                    }}
                  >
                    {risk} risk
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      height: "9px",
                      borderRadius: "999px",
                      background: "rgba(148,163,184,0.14)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(
                          8,
                          Math.min(100, Number(item.daysRemaining || 0) * 12)
                        )}%`,
                        height: "100%",
                        borderRadius: "999px",
                        background: riskStyle.color,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      color: riskStyle.color,
                      fontWeight: "900",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {Number(item.daysRemaining || 0).toFixed(1)} days left
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            height: "220px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            textAlign: "center",
            borderRadius: "18px",
            border: "1px dashed rgba(148,163,184,0.2)",
            background: "rgba(15,23,42,0.5)",
            fontSize: "13px",
          }}
        >
          Upload ingredient data to forecast inventory risk.
        </div>
      )}
    </div>

    {!hasProAccess && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(15,23,42,0.85)",
          backdropFilter: "blur(6px)",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <h4 style={{ color: "white", marginBottom: "8px" }}>
          🔒 Unlock Inventory Forecasting
        </h4>

        <p
          style={{
            fontSize: "12px",
            color: "#cbd5f5",
            marginBottom: "12px",
          }}
        >
          Predict inventory shortages before they happen.
        </p>

        <button
          onClick={() => router.push("/pricing")}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
            color: "white",
            fontWeight: "800",
            boxShadow: "0 10px 25px rgba(79,70,229,0.35)",
            cursor: "pointer",
          }}
        >
          Upgrade to Pro →
        </button>
      </div>
    )}
  </div>
</div>
      </div>
    </>
  )}
{activeTab === "client_alerts" && (
  <div
    style={{
      display: "grid",
      gap: "20px",
    }}
  >
    <div
      style={{
        display: "grid",
       gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px",
      }}
    >
      <div
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(239,68,68,0.10)",
          border: "1px solid rgba(239,68,68,0.18)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#fca5a5",
            fontWeight: "800",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Critical Alerts
        </div>
        <div
          style={{
            fontSize: "26px",
            fontWeight: "900",
            color: "white",
          }}
        >
          {clientRiskSummary?.critical || 0}
        </div>
      </div>

      <div
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(245,158,11,0.10)",
          border: "1px solid rgba(245,158,11,0.18)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#fcd34d",
            fontWeight: "800",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Warning Alerts
        </div>
        <div
          style={{
            fontSize: "26px",
            fontWeight: "900",
            color: "white",
          }}
        >
          {clientRiskSummary?.warning || 0}
        </div>
      </div>

      <div
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(34,197,94,0.10)",
          border: "1px solid rgba(34,197,94,0.18)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#86efac",
            fontWeight: "800",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Good Signals
        </div>
        <div
          style={{
            fontSize: "26px",
            fontWeight: "900",
            color: "white",
          }}
        >
          {clientRiskSummary?.good || 0}
        </div>
      </div>
    </div>

    <div
      style={{
        padding: "20px",
        borderRadius: "20px",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92))",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 18px 40px rgba(2,6,23,0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "900",
              color: "white",
              marginBottom: "6px",
            }}
          >
            Client Alerts
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#94a3b8",
            }}
          >
            Active restaurant issues detected by Serven
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={loadClientAlerts}
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
              color: "white",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Refresh Alerts
          </button>

          <button
            onClick={() => runAutopilotAI("Client alerts scan")}
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Run AI Scan
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            color: "#94a3b8",
          }}
        >
          {filteredClientAlerts.length} active alerts
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          {lastScanTime
            ? `Last scan: ${new Date(lastScanTime).toLocaleTimeString()}`
            : "No scans yet"}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        {[
          { key: "all", label: "All" },
          { key: "critical", label: "Critical" },
          { key: "warning", label: "Warning" },
          { key: "good", label: "Good" },
        ].map((filter) => {
          const isActive = clientAlertFilter === filter.key;

          return (
            <button
              key={filter.key}
              onClick={() => setClientAlertFilter(filter.key)}
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                border: isActive
                  ? "1px solid rgba(79,70,229,0.28)"
                  : "1px solid rgba(148,163,184,0.16)",
                background: isActive
                  ? "rgba(79,70,229,0.16)"
                  : "rgba(255,255,255,0.04)",
                color: isActive ? "#c7d2fe" : "#e2e8f0",
                fontSize: "12px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {alertsLoading ? (
        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          Loading alerts...
        </div>
      ) : !filteredClientAlerts?.length ? (
        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          No alerts found for this filter.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {filteredClientAlerts.map((alert) => {
  const recommendedAction = getRecommendedActionForAlert(alert);

  return (
    <div
      key={alert.id}
      style={{
        padding: "16px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "15px",
              fontWeight: "900",
              color: "white",
              marginBottom: "4px",
            }}
          >
            {alert.rule_name || "Alert Triggered"}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#94a3b8",
              lineHeight: 1.6,
              marginBottom: "8px",
            }}
          >
            {alert.client_name || "Unknown Client"} • {alert.metric_key} ={" "}
            {alert.metric_value}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Threshold: {alert.operator} {alert.threshold}
          </div>
        </div>

        <div
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            background:
              alert.severity === "critical"
                ? "rgba(239,68,68,0.12)"
                : alert.severity === "warning"
                ? "rgba(245,158,11,0.12)"
                : "rgba(34,197,94,0.12)",
            border:
              alert.severity === "critical"
                ? "1px solid rgba(239,68,68,0.18)"
                : alert.severity === "warning"
                ? "1px solid rgba(245,158,11,0.18)"
                : "1px solid rgba(34,197,94,0.18)",
            color:
              alert.severity === "critical"
                ? "#fca5a5"
                : alert.severity === "warning"
                ? "#fcd34d"
                : "#86efac",
            fontSize: "12px",
            fontWeight: "800",
            textTransform: "capitalize",
          }}
        >
          {alert.severity || "warning"}
        </div>
      </div>

      {recommendedAction && (
        <div
          style={{
            marginTop: "14px",
            padding: "14px",
            borderRadius: "14px",
            background: "rgba(79,70,229,0.10)",
            border: "1px solid rgba(79,70,229,0.18)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#c7d2fe",
              marginBottom: "8px",
            }}
          >
            Recommended AI Action
          </div>

          <div
            style={{
              fontSize: "14px",
              fontWeight: "800",
              color: "white",
              marginBottom: "6px",
            }}
          >
            {recommendedAction.title}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#cbd5e1",
              lineHeight: 1.6,
              marginBottom: "10px",
            }}
          >
            {recommendedAction.description}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "800",
                color: "#a5b4fc",
              }}
            >
              {recommendedAction.impact}
            </div>

           <button
  onClick={() => {
    setSelectedAlertAction(recommendedAction?.title || null);
    setActiveTab("ai");
  }}
  style={{
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
    color: "white",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  }}
>
  View AI Fix
</button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "14px",
        }}
      >
        <button
          onClick={() => updateClientAlertStatus(alert.id, "resolved")}
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Mark Resolved
        </button>

        <button
          onClick={() => updateClientAlertStatus(alert.id, "ignored")}
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(148,163,184,0.16)",
            background: "rgba(255,255,255,0.04)",
            color: "#e2e8f0",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Ignore
        </button>
      </div>
    </div>
  );
})}
        </div>
      )}
    </div>
  </div>
)}

{activeTab === "marketing" && hasGrowthAccess && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    }}
  >
    {/* ========================= */}
    {/* MARKETING HERO */}
    {/* ========================= */}
    <div
      style={{
        padding: "24px",
        borderRadius: "24px",
        background:
          "radial-gradient(circle at top right, rgba(109,61,245,0.28), transparent 32%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.88))",
        border: "1px solid rgba(167,139,250,0.22)",
        boxShadow: "0 24px 60px rgba(2,6,23,0.28)",
        overflow: "hidden",
      }}
    >
      <div style={{ color: "#a5b4fc", fontSize: "12px", fontWeight: "900" }}>
        SERVEN MARKETING OS
      </div>

      <h2
        style={{
          color: "white",
          fontSize: "30px",
          fontWeight: "950",
          margin: "8px 0 6px",
          lineHeight: 1.1,
        }}
      >
        AI campaigns that prove revenue impact
      </h2>

      <p
        style={{
          color: "#94a3b8",
          fontSize: "14px",
          margin: 0,
          maxWidth: "720px",
          lineHeight: 1.6,
        }}
      >
        Generate campaigns, track lift, measure ROI, and let Pro Autopilot
        launch revenue recovery campaigns when your restaurant data signals an
        opportunity.
      </p>
    </div>
{(Number(userProfile?.email_usage_percent || 0) >= 80 ||
  Number(userProfile?.sms_usage_percent || 0) >= 80) && (
  <div
    style={{
      padding: "16px",
      borderRadius: "18px",
      background:
        Number(userProfile?.email_usage_percent || 0) >= 100 ||
        Number(userProfile?.sms_usage_percent || 0) >= 100
          ? "linear-gradient(135deg, rgba(239,68,68,0.16), rgba(15,23,42,0.95))"
          : "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(15,23,42,0.95))",
      border:
        Number(userProfile?.email_usage_percent || 0) >= 100 ||
        Number(userProfile?.sms_usage_percent || 0) >= 100
          ? "1px solid rgba(239,68,68,0.30)"
          : "1px solid rgba(245,158,11,0.24)",
    }}
  >
    <div
      style={{
        color:
          Number(userProfile?.email_usage_percent || 0) >= 100 ||
          Number(userProfile?.sms_usage_percent || 0) >= 100
            ? "#fca5a5"
            : "#fde68a",
        fontWeight: "900",
        fontSize: "14px",
      }}
    >
      {Number(userProfile?.email_usage_percent || 0) >= 100 ||
      Number(userProfile?.sms_usage_percent || 0) >= 100
        ? "🚨 Campaign usage limit reached"
        : "⚠️ Campaign usage almost reached"}
    </div>

    <div
      style={{
        color: "#cbd5e1",
        fontSize: "13px",
        marginTop: "6px",
        lineHeight: 1.5,
      }}
    >
      Contact SerVen to unlock additional campaign capacity for your account.
    </div>
  </div>
)}
<div
  style={{
    display: "grid",

    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(220px, 1fr))",

    gap: isMobile ? "10px" : "12px",

    marginTop: "14px",
  }}
>
  <div
    style={{
      padding: "14px",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <div
      style={{
        color: "#94a3b8",
        fontSize: "12px",
        fontWeight: "800",
      }}
    >
      EMAILS REMAINING
    </div>

    <div
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "900",
        marginTop: "6px",
      }}
    >
      {Math.max(
        0,
        (effectivePlan === "pro"
          ? 25000
          : effectivePlan === "growth"
          ? 5000
          : 500) -
          Number(userProfile?.emails_sent_this_month || 0)
      ).toLocaleString()}
    </div>
  </div>

  <div
    style={{
      padding: "14px",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <div
      style={{
        color: "#94a3b8",
        fontSize: "12px",
        fontWeight: "800",
      }}
    >
      SMS REMAINING
    </div>

    <div
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "900",
        marginTop: "6px",
      }}
    >
      {Math.max(
        0,
        (effectivePlan === "pro"
          ? 10000
          : effectivePlan === "growth"
          ? 2500
          : 250) -
          Number(userProfile?.sms_sent_this_month || 0)
      ).toLocaleString()}
    </div>
    <div
  style={{
    marginTop: "10px",
    height: "8px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  }}
>
  <div
    style={{
      width: `${userProfile?.email_usage_percent || 0}%`,
      height: "100%",
      background:
        Number(userProfile?.email_usage_percent || 0) >= 100
          ? "#ef4444"
          : Number(userProfile?.email_usage_percent || 0) >= 80
          ? "#f59e0b"
          : "#22c55e",
      borderRadius: "999px",
    }}
  />
</div>
  </div>
</div>
    {/* ========================= */}
    {/* CAMPAIGN IMPACT */}
    {/* ========================= */}
    {(() => {
      const campaignTotals = getTotalCampaignRevenue();

      return (
        <div
          style={{
            padding: "22px",
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.16), rgba(109,61,245,0.14))",
            border: "1px solid rgba(16,185,129,0.24)",
            boxShadow: "0 18px 45px rgba(2,6,23,0.22)",
            overflow: "hidden",
          }}
        >
          <div style={{ color: "#86efac", fontSize: "12px", fontWeight: "900" }}>
            CAMPAIGN REVENUE IMPACT
          </div>

          <div
            style={{
              color: "white",
              fontSize: "34px",
              fontWeight: "950",
              marginTop: "8px",
            }}
          >
            ${Number(campaignTotals.totalRevenue || 0).toLocaleString()}
          </div>

          <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "6px" }}>
            Revenue tracked across {campaignTotals.campaignCount} campaign
            {campaignTotals.campaignCount === 1 ? "" : "s"}.
          </div>

          <div
            style={{
              marginTop: "12px",
              color: campaignTotals.totalLift >= 0 ? "#86efac" : "#fca5a5",
              fontSize: "14px",
              fontWeight: "900",
            }}
          >
            True Lift: {campaignTotals.totalLift >= 0 ? "+" : "-"}$
            {Math.abs(Number(campaignTotals.totalLift || 0)).toLocaleString()}
          </div>
        </div>
      );
    })()}
{(() => {
  const roiStats = getCampaignROIStats();

  return (
    <div
      style={{
        padding: "22px",
        borderRadius: "22px",
        background:
          "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(15,23,42,0.94))",
        border: "1px solid rgba(34,197,94,0.22)",
        boxShadow: "0 18px 45px rgba(2,6,23,0.22)",
      }}
    >
      <div style={{ color: "#86efac", fontSize: "12px", fontWeight: "900" }}>
        CAMPAIGN ROI
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginTop: "14px",
        }}
      >
        <div style={adminMiniBox}>
          <div style={adminMiniLabel}>Total Spend</div>
          <div style={adminMiniValue}>${roiStats.totalSpend.toLocaleString()}</div>
        </div>

        <div style={adminMiniBox}>
          <div style={adminMiniLabel}>Revenue Generated</div>
          <div style={adminMiniValue}>${roiStats.totalRevenue.toLocaleString()}</div>
        </div>

        <div style={adminMiniBox}>
          <div style={adminMiniLabel}>Net Profit</div>
          <div style={adminMiniValue}>${roiStats.netProfit.toLocaleString()}</div>
        </div>

        <div style={adminMiniBox}>
          <div style={adminMiniLabel}>ROI</div>
          <div style={adminMiniValue}>{roiStats.roiPercent}%</div>
        </div>
      </div>
    </div>
  );
})()}
    {/* ========================= */}
    {/* BEFORE VS AFTER CHART */}
    {/* ========================= */}
    {(() => {
      const data = getBeforeAfterData();

      return (
        <div
          style={{
            padding: "20px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div style={{ color: "white", fontWeight: "900", marginBottom: "12px" }}>
            Before vs After Campaign Performance
          </div>

          <div style={{ height: "260px", minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    })()}

    {/* ========================= */}
    {/* AI RECOMMENDATIONS */}
    {/* ========================= */}
    {(() => {
      const recs = getAIRecommendations();

      return (
        <div
          style={{
            padding: "18px",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(109,61,245,0.12), rgba(15,23,42,0.9))",
            border: "1px solid rgba(109,61,245,0.25)",
            overflow: "hidden",
          }}
        >
          <div style={{ color: "white", fontWeight: "900", marginBottom: "12px" }}>
            🧠 AI Recommendations
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {recs.map((rec, i) => (
              <div
                key={i}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(15,23,42,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  overflowWrap: "break-word",
                }}
              >
                <div
                  style={{
                    color: "#a5b4fc",
                    fontWeight: "800",
                    fontSize: "13px",
                  }}
                >
                  {rec.title}
                </div>

                <div
                  style={{
                    color: "#cbd5e1",
                    fontSize: "13px",
                    marginTop: "4px",
                    lineHeight: 1.5,
                  }}
                >
                  {rec.message}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "8px",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "999px",
                      background: "rgba(34,197,94,0.12)",
                      color: "#86efac",
                      fontSize: "11px",
                      fontWeight: "900",
                    }}
                  >
                    Confidence: {rec.confidence || "88%"}
                  </span>

                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "999px",
                      background: "rgba(250,204,21,0.12)",
                      color: "#fde68a",
                      fontSize: "11px",
                      fontWeight: "900",
                    }}
                  >
                    Impact: {rec.impact || "$400 - $1,200"}
                  </span>
                </div>

                {rec.action && (
                  <button
                    type="button"
                    onClick={buildProfitDrivenCampaign}
                    style={{
                      marginTop: "8px",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "none",
                      background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
                      color: "white",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {rec.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    })()}

    {/* ========================= */}
    {/* MARKETING PROMOTION ENGINE */}
    {/* ========================= */}
    <div>
      <h3 style={sectionTitle}>📣 Marketing Promotion Engine</h3>
      <p style={sectionSubtle}>
        Generate campaigns, save drafts, and launch promotions from one place.
      </p>

      <div
        style={{
          padding: "20px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
            marginBottom: "16px",
            width: "100%",
          }}
        >
          <select
  value={campaignForm.source || "Serven AI"}
  onChange={(e) =>
    setCampaignForm((prev) => ({
      ...prev,
      source: e.target.value,
    }))
  }
  style={{
    ...inputStyle,
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  }}
>
  {[
    "Serven AI",
    "Existing Restaurant Campaign",
  ].map((option) => (
    <option key={option} value={option}>
      {option}
    </option>
  ))}
</select>
          <input
            value={campaignForm.name}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, name: e.target.value }))
            }

            placeholder="Campaign name"
            style={{
              ...inputStyle,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          />

          <input
            value={campaignForm.offer}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, offer: e.target.value }))
            }
            placeholder="Offer"
            style={{
              ...inputStyle,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          />

          <select
            value={campaignForm.audience}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, audience: e.target.value }))
            }
            style={{
              ...inputStyle,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            {[
              "All Customers",
              "Returning Customers",
              "Rewards Members",
              "VIP Guests",
              "Low Traffic Guests",
            ].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={campaignForm.timing}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, timing: e.target.value }))
            }
            style={{
              ...inputStyle,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            {["This Week", "This Weekend", "Next 7 Days", "Next 30 Days"].map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              )
            )}
          </select>

          <select
            value={campaignForm.goal}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, goal: e.target.value }))
            }
            style={{
              ...inputStyle,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            {[
              "Increase Traffic",
              "Increase Repeat Visits",
              "Boost AOV",
              "Promote High-Margin Items",
            ].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <input
            value={campaignForm.expectedRevenue}
            onChange={(e) =>
              setCampaignForm((prev) => ({
                ...prev,
                expectedRevenue: e.target.value,
              }))
            }
            placeholder="Expected revenue impact"
            style={{
              ...inputStyle,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          />

          <input
            value={campaignForm.cost}
            onChange={(e) =>
              setCampaignForm((prev) => ({
                ...prev,
                cost: e.target.value,
              }))
            }
            placeholder="Campaign cost / budget"
            style={{
              ...inputStyle,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          {["SMS", "Email", "Social", "In-Store"].map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => setCampaignForm((prev) => ({ ...prev, channel }))}
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                border: "none",
                background:
                  campaignForm.channel === channel
                    ? "linear-gradient(135deg, #4f46e5, #6D3DF5)"
                    : "#1f2937",
                color: "white",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {channel}
            </button>
          ))}
        </div>

        {hasProAccess && (
          <div
            style={{
              marginBottom: "16px",
              padding: "14px",
              borderRadius: "14px",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.18)",
              color: "#dcfce7",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            <strong>Autopilot Signal:</strong>{" "}
            {unusualDropDetected
              ? "Revenue drop detected — recovery campaign recommended."
              : Number(totalWasteLoss || 0) > 0
              ? "Waste risk detected — recovery campaign recommended."
              : Number(avgMargin || 0) < 60
              ? "Margin pressure detected — high-margin campaign recommended."
              : "No urgent campaign needed right now."}
          </div>
        )}

        {/* PRO AUTOPILOT */}
        <div
          style={{
            marginBottom: "16px",
            padding: "14px",
            borderRadius: "14px",
            background: hasProAccess
              ? "rgba(109,61,245,0.12)"
              : "rgba(15,23,42,0.75)",
            border: hasProAccess
              ? "1px solid rgba(167,139,250,0.28)"
              : "1px solid rgba(148,163,184,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ color: "white", fontWeight: "900", fontSize: "14px" }}>
                Pro Autopilot Campaigns
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  marginTop: "4px",
                  maxWidth: "620px",
                  lineHeight: 1.5,
                }}
              >
                Automatically generates campaigns when revenue, margin, or waste
                signals need action.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
  <div
  style={{
    marginBottom: "12px",
    padding: "12px 14px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, rgba(109,61,245,0.18), rgba(15,23,42,0.9))",
    border: "1px solid rgba(167,139,250,0.25)",
  }}
>
  <div
    style={{
      fontSize: "13px",
      fontWeight: "900",
      color: "#c4b5fd",
    }}
  >
    Let Serven run your growth automatically
  </div>

  <div
    style={{
      fontSize: "12px",
      color: "#94a3b8",
      marginTop: "4px",
    }}
  >
    AI detects profit leaks and launches campaigns without manual work
  </div>
</div>
{autopilotRecoverableRevenue > 0 && (
  <div
    style={{
      marginBottom: "10px",
      padding: "10px 12px",
      borderRadius: "12px",
      background:
        "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(15,23,42,0.9))",
      border: "1px solid rgba(34,197,94,0.3)",
    }}
  >
    <div
      style={{
        fontSize: "12px",
        color: "#86efac",
        fontWeight: "800",
      }}
    >
      💰 Autopilot could recover $
      {autopilotRecoverableRevenue.toLocaleString()}/month
    </div>

    <div
      style={{
        fontSize: "11px",
        color: "#94a3b8",
        marginTop: "2px",
      }}
    >
      Based on detected profit leaks and waste
    </div>
  </div>
)}
  <button
    type="button"
   onClick={() => {
  if (!hasProAccess) {
    setShowPricingModal(true);
    return;
  }

  setAutoCampaignsEnabled((prev) => !prev);
}}
    style={{
      padding: "10px 14px",
      borderRadius: "999px",
      border: "none",
      background: !hasProAccess
  ? "linear-gradient(135deg, #f59e0b, #d97706)" // upgrade color
  : autoCampaignsEnabled
  ? "linear-gradient(135deg, #22c55e, #16a34a)"
  : "linear-gradient(135deg, #4f46e5, #6D3DF5)",
      color: "white",
      fontWeight: "900",
      cursor: hasProAccess ? "pointer" : "not-allowed",
      opacity: hasProAccess ? 1 : 0.6,
    }}
  >
    {!hasProAccess
  ? `Unlock Autopilot (+$${autopilotRecoverableRevenue.toLocaleString()}/mo)`
  : autoCampaignsEnabled
  ? "Turn Off Autopilot"
  : "Turn On Autopilot"}
  </button>

  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
    Status: {autoCampaignsEnabled ? "Autopilot Active" : "Autopilot Off"}
  </div>

</div>
          </div>
        </div>

        {hasProAccess && autoCampaignsEnabled && (
          <div
            style={{
              marginBottom: "16px",
              padding: "14px",
              borderRadius: "14px",
              background: "rgba(109,61,245,0.10)",
              border: "1px solid rgba(167,139,250,0.22)",
            }}
          >
            <div style={{ color: "white", fontWeight: "900", fontSize: "14px" }}>
              Autopilot Active
            </div>

            <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "6px" }}>
              Serven is monitoring revenue drops, margin pressure, and waste risk
              for campaign opportunities.
            </div>
          </div>
        )}
{/* CAMPAIGN COST ESTIMATE */}
<div
  style={{
    marginBottom: "16px",
    padding: "14px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }}
>
  <div style={{ color: "#a5b4fc", fontSize: "12px", fontWeight: "900" }}>
    CAMPAIGN COST ESTIMATE
  </div>

  <div style={{ color: "white", fontSize: "20px", fontWeight: "900", marginTop: "6px" }}>
    ~$
    {(
      (campaignForm.channel === "SMS" ? 50 * 0.015 : 0) +
      (campaignForm.channel === "Email" ? 100 * 0.002 : 0)
    ).toFixed(2)}
  </div>

  <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px", lineHeight: 1.5 }}>
    Estimated usage:{" "}
    {campaignForm.channel === "SMS"
      ? "50 SMS"
      : campaignForm.channel === "Email"
      ? "100 emails"
      : "No direct email/SMS send cost"}{" "}
    before launch.
  </div>
</div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={hasProAccess ? buildProfitDrivenCampaign : undefined}
            style={{
              ...secondaryButtonStyle,
              background: hasProAccess
                ? "linear-gradient(135deg, #16a34a, #22c55e)"
                : "rgba(148,163,184,0.25)",
              color: "white",
              border: "none",
              cursor: hasProAccess ? "pointer" : "not-allowed",
              opacity: hasProAccess ? 1 : 0.6,
            }}
          >
            {hasProAccess ? "🧠 AI Recommended Campaign" : "🔒 Pro Only"}
          </button>

          <button
            type="button"
            onClick={handleGeneratePromotions}
            style={primaryButtonStyle}
          >
            ✨ Generate Campaign Copy
          </button>

         <button
  type="button"
  onClick={() => {
    setSavedMessage("Saving campaign...");
    handleSaveCampaign();
  }}
  style={secondaryButtonStyle}
>
  Save Campaign
</button>
{savedMessage && (
  <div
    style={{
      marginTop: "12px",
      padding: "10px 12px",
      borderRadius: "10px",
      background: "rgba(59,130,246,0.12)",
      border: "1px solid rgba(59,130,246,0.30)",
      color: "#93c5fd",
      fontSize: "13px",
      fontWeight: "700",
    }}
  >
    {savedMessage}
  </div>
)}
        </div>
      </div>
    </div>

    {/* ========================= */}
    {/* GENERATED CAMPAIGN COPY */}
    {/* ========================= */}
    {generatedPromotions && (
      <div
        style={{
          padding: "20px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <h3 style={{ marginBottom: "14px", fontSize: "16px", fontWeight: "700" }}>
          Generated Campaign Copy
        </h3>

        <div style={{ display: "grid", gap: "12px" }}>
          {[
            { label: "SMS", data: generatedPromotions.sms, key: "sms" },
            { label: "Email", data: generatedPromotions.email, key: "email" },
            { label: "Social", data: generatedPromotions.social, key: "social" },
            { label: "In-Store", data: generatedPromotions.inStore, key: "inStore" },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                overflowWrap: "break-word",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#a5b4fc",
                  marginBottom: "6px",
                }}
              >
                {item.label}
              </div>

              <div style={{ fontWeight: "700", color: "#fff", marginBottom: "6px" }}>
                {item.data?.title}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                  lineHeight: 1.5,
                }}
              >
                {item.data?.body}
              </div>

     <button
  type="button"
  onClick={() => {
    setSavedMessage(`Saving ${item.label}...`);

    handleSaveGeneratedCampaign(
      item.label,
      item.data || item
    );

    setTimeout(() => {
      setSavedMessage(`${item.label} saved`);
    }, 300);
  }}
  style={{
    marginTop: "10px",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#6D3DF5",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  }}
>
  Save {item.label}
</button>

            </div>
          ))}
        </div>
     
      </div>
    )}
{(() => {
  const intelligence = getCampaignIntelligence();

  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        background:
          intelligence.tone === "positive"
            ? "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(15,23,42,0.92))"
            : intelligence.tone === "warning"
            ? "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(15,23,42,0.92))"
            : "linear-gradient(135deg, rgba(109,61,245,0.14), rgba(15,23,42,0.92))",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div style={{ color: "#a5b4fc", fontSize: "12px", fontWeight: "900" }}>
        CAMPAIGN INTELLIGENCE
      </div>

      <div
        style={{
          color: "white",
          fontSize: "18px",
          fontWeight: "900",
          marginTop: "6px",
        }}
      >
        {intelligence.title}
      </div>

      <div
        style={{
          color: "#cbd5e1",
          fontSize: "13px",
          lineHeight: 1.5,
          marginTop: "6px",
        }}
      >
        {intelligence.message}
      </div>

      <button
  type="button"
  onClick={handleCampaignIntelligenceAction}
  style={{
    marginTop: "10px",
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "none",
    background:
      intelligence.tone === "positive"
        ? "linear-gradient(135deg, #16a34a, #22c55e)"
        : intelligence.tone === "warning"
        ? "linear-gradient(135deg, #f59e0b, #d97706)"
        : "linear-gradient(135deg, #4f46e5, #6D3DF5)",
    color: "white",
    fontSize: "12px",
    fontWeight: "900",
    cursor: "pointer",
  }}
>
  {intelligence.action}
</button>
    </div>
  );
})()}
    {/* ========================= */}
    {/* SAVED CAMPAIGNS */}
    {/* ========================= */}
    {savedCampaigns?.length > 0 && (
      <>
        <div
          style={{
            padding: "18px",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(109,61,245,0.10))",
            border: "1px solid rgba(16,185,129,0.18)",
          }}
        >
          <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "800" }}>
            Campaign Performance
          </div>

          <div
            style={{
              color: "white",
              fontSize: "26px",
              fontWeight: "900",
              marginTop: "6px",
            }}
          >
            {savedCampaigns.length} Active Campaign
            {savedCampaigns.length === 1 ? "" : "s"}
          </div>

          <div
            style={{
              color: "#86efac",
              fontSize: "13px",
              fontWeight: "800",
              marginTop: "8px",
            }}
          >
            Estimated revenue lift is now tracked per campaign.
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            width: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <h3 style={{ marginBottom: "14px", fontSize: "16px", fontWeight: "700" }}>
            Saved Campaigns
          </h3>

          {(() => {
            const top = getTopCampaign();
            if (!top) return null;

            return (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "16px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, rgba(250,204,21,0.12), rgba(109,61,245,0.10))",
                  border: "1px solid rgba(250,204,21,0.25)",
                }}
              >
                <div style={{ fontSize: "12px", color: "#fde68a", fontWeight: "900" }}>
                  👑 TOP PERFORMING CAMPAIGN
                </div>

                <div
                  style={{
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "900",
                    marginTop: "6px",
                  }}
                >
                  {top.name}
                </div>

                <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "4px" }}>
                  {top.channel} • {top.audience}
                </div>
              </div>
            );
          })()}

          <div
            style={{
              marginBottom: "16px",
              padding: "16px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ color: "white", fontWeight: "900", marginBottom: "10px" }}>
              Campaign Revenue Leaderboard
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              {[...savedCampaigns]
                .sort(
                  (a, b) =>
                    getCampaignLift(b).liftAmount - getCampaignLift(a).liftAmount
                )
                .slice(0, 3)
                .map((campaign, index) => {
                  const lift = getCampaignLift(campaign);

                  return (
                    <div
                      key={campaign.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "10px",
                        borderRadius: "12px",
                        background: "rgba(15,23,42,0.45)",
                      }}
                    >
                      <div style={{ color: "#cbd5e1", fontSize: "13px" }}>
                        #{index + 1} {campaign.name}
                      </div>

                      <div
                        style={{
                          color: "#86efac",
                          fontWeight: "900",
                          fontSize: "13px",
                        }}
                      >
                        ${Number(lift.liftAmount || 0).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {savedCampaigns.map((campaign) => {
              const topCampaign = getTopCampaign();
              const isWinner = topCampaign?.id === campaign.id;
              const performance = getRealCampaignPerformance(campaign);
              const lift = getCampaignLift(campaign);
              const roiData = getCampaignROI(campaign);

              return (
                <div
                  key={campaign.id}
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    background: isWinner
                      ? "linear-gradient(135deg, rgba(250,204,21,0.12), rgba(109,61,245,0.10))"
                      : "rgba(255,255,255,0.03)",
                    border: isWinner
                      ? "1px solid rgba(250,204,21,0.35)"
                      : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: isWinner
                      ? "0 0 0 1px rgba(250,204,21,0.25), 0 10px 30px rgba(250,204,21,0.12)"
                      : "none",
                    overflowWrap: "break-word",
                  }}
                >
                  <div style={{ fontWeight: "700", color: "#fff" }}>
                    {campaign.name}
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      marginTop: "6px",
                      padding: "4px 8px",
                      borderRadius: "999px",
                      background:
                        campaign.status === "live"
                          ? "rgba(34,197,94,0.14)"
                          : campaign.status === "completed"
                          ? "rgba(59,130,246,0.14)"
                          : "rgba(148,163,184,0.14)",
                      color:
                        campaign.status === "live"
                          ? "#86efac"
                          : campaign.status === "completed"
                          ? "#93c5fd"
                          : "#cbd5e1",
                      fontSize: "11px",
                      fontWeight: "900",
                    }}
                  >
                    {(campaign.status || "draft").toUpperCase()}
                  </div>

                  {isWinner && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#fde68a",
                        fontWeight: "900",
                        marginTop: "4px",
                      }}
                    >
                      👑 Top Performer
                    </div>
                  )}

                  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "6px",
  }}
>
  <div
    style={{
      padding: "6px 10px",
      borderRadius: "999px",
      background:
        campaign.channel === "SMS"
          ? "rgba(34,197,94,0.14)"
          : "rgba(96,165,250,0.14)",
      border:
        campaign.channel === "SMS"
          ? "1px solid rgba(34,197,94,0.24)"
          : "1px solid rgba(96,165,250,0.24)",
      color:
        campaign.channel === "SMS"
          ? "#86efac"
          : "#93c5fd",
      fontSize: "11px",
      fontWeight: "900",
    }}
  >
    {campaign.channel}
  </div>

  <div
    style={{
      fontSize: "13px",
      color: "#94a3b8",
    }}
  >
    {campaign.audience} • {campaign.timing}
  </div>
</div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#cbd5e1",
                      marginTop: "6px",
                      lineHeight: 1.5,
                    }}
                  >
                    {campaign.offer}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginTop: "10px",
                    }}
                  >
  <button
  type="button"
  onClick={async () => {
    try {
      const emailUsagePercent = Number(userProfile?.email_usage_percent || 0);
  const smsUsagePercent = Number(userProfile?.sms_usage_percent || 0);

  if (emailUsagePercent >= 100 || smsUsagePercent >= 100) {
    setSavedMessage("Campaign blocked — usage limit reached. Contact SerVen.");
    setTimeout(() => setSavedMessage(""), 3000);
    return;
  }
      // 🚫 Block invalid IDs (autopilot/local)
      if (!isValidUUID(campaign?.id)) {
        setSavedMessage("Save campaign before launching");
        setTimeout(() => setSavedMessage(""), 2500);
        return;
      }

      // 1️⃣ Update Supabase
      const { error } = await supabase
        .from("marketing_campaigns")
        .update({
          active: true,
          published_to_website: true,
        })
        .eq("id", campaign.id);

      if (error) throw error;
// 2️⃣ Launch campaign
const endpoint =
  campaign.channel === "SMS"
    ? "/api/launch-sms-campaign"
    : "/api/launch-campaign";

const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    campaignId: campaign.id,
    userId: user?.id,
  }),
});

let result = {};

try {
  const text = await res.text();
  console.log("AUTOPILOT RAW RESPONSE:", text);
  result = text ? JSON.parse(text) : {};
} catch (error) {
  console.error("Autopilot AI parse error:", error);

  setAiSummary("AI insights are temporarily unavailable.");
  setAiAlerts([
    {
      type: "warning",
      text: "Could not load AI insights.",
    },
  ]);

  return;
}

if (!res.ok) {
  throw new Error(result?.error || "Launch failed");
}
      // 3️⃣ Update UI
      setSavedCampaigns((prev) =>
        prev.map((item) =>
          item.id === campaign.id
            ? { ...item, status: "live" }
            : item
        )
      );

     pushActivity(
  `🚀 ${campaign.name} launched • ${result.sent || 0} ${
    campaign.channel === "SMS" ? "SMS sent" : "emails sent"
  }`,
  "launch"
);


    } catch (error) {
      console.error("Launch error FULL:", error);
      console.error("Launch message:", error?.message);

      setSavedMessage(error?.message || "Failed to launch campaign");
      setTimeout(() => setSavedMessage(""), 3000);
    }
  }}
  style={secondaryButtonStyle}
>
  Mark Live
</button>
<button
  type="button"
  onClick={async () => {
    try {
   
      if (!isValidUUID(campaign?.id)) {
        setSavedMessage("Campaign must be saved first");
        setTimeout(() => setSavedMessage(""), 2500);
        return;
      }

      const { error } = await supabase
        .from("marketing_campaigns")
        .update({
          active: false,
          published_to_website: false,
        })
        .eq("id", campaign.id);

      if (error) throw error;

      setSavedCampaigns((prev) =>
        prev.map((item) =>
          item.id === campaign.id
            ? { ...item, status: "completed" }
            : item
        )
      );

      pushActivity(`✅ ${campaign.name} marked completed`, "complete");

      setSavedMessage("Campaign marked completed");
      
    } 
    
    catch (error) {
      console.error("Complete error:", error);
      setSavedMessage(error?.message || "Failed to update campaign");
      
    }
  }}
  style={secondaryButtonStyle}
>
  Complete
</button>
                  </div>

                  <div
                    style={{
                      marginTop: "10px",
                      padding: "12px",
                      borderRadius: "12px",
                      background: "rgba(59,130,246,0.10)",
                      border: "1px solid rgba(59,130,246,0.18)",
                    }}
                  >
                    <div
                      style={{
                        color: "#93c5fd",
                        fontSize: "11px",
                        fontWeight: "800",
                      }}
                    >
                      REAL PERFORMANCE
                    </div>

                    <div
                      style={{
                        color: "white",
                        fontSize: "18px",
                        fontWeight: "900",
                        marginTop: "4px",
                      }}
                    >
                      ${Number(performance.revenue || 0).toLocaleString()}
                    </div>

                    <div
                      style={{
                        color: "#cbd5e1",
                        fontSize: "12px",
                        marginTop: "2px",
                      }}
                    >
                      {performance.orders} orders • Avg order ${Number(
  performance.avgOrderValue || 0
).toFixed(2)}
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        paddingTop: "10px",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: "11px",
                          fontWeight: "800",
                        }}
                      >
                        TRUE REVENUE LIFT
                      </div>

                      <div
                        style={{
                          color: lift.liftAmount >= 0 ? "#86efac" : "#fca5a5",
                          fontSize: "15px",
                          fontWeight: "900",
                          marginTop: "4px",
                        }}
                      >
                       {lift.liftAmount >= 0 ? "▲" : "▼"}{" "}
{lift.liftAmount >= 0 ? "+" : "-"}$
                        {Math.abs(Number(lift.liftAmount || 0)).toLocaleString()}{" "}
                        ({Number(lift.liftPercent || 0).toFixed(1)}%)
                      </div>
     <div style={{ color: "#cbd5e1", fontSize: "12px", marginTop: "4px" }}>
  Before: ${Number(lift.beforeRevenue || 0).toLocaleString()} • After: $
  {Number(lift.afterRevenue || 0).toLocaleString()}
</div>
                      <div style={{ marginTop: "8px" }}>
                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: "11px",
                            fontWeight: "800",
                          }}
                        >
                          CAMPAIGN ROI
                        </div>

                        <div
                          style={{
                            color: roiData.roi >= 0 ? "#86efac" : "#fca5a5",
                            fontSize: "15px",
                            fontWeight: "900",
                            marginTop: "2px",
                          }}
                        >
                          {roiData.roi.toFixed(1)}% ROI
                        </div>

                       <div
  style={{
    fontSize: "12px",
    marginTop: "3px",
    color:
      roiData.profitAfterCost >= 0 ? "#86efac" : "#fca5a5",
  }}
>
  Est. Cost: ${roiData.estimatedCost.toLocaleString()} • Net Profit: $
  {Number(roiData.profitAfterCost || 0).toLocaleString()}
</div>
                      </div>
                    </div>
               
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    )}
  </div>
)}
{activeTab === "analytics" && (
  <div
    style={{
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      overflowX: "hidden",

      display: "grid",

      gap: isMobile ? "14px" : "20px",
    }}
  >
     {/* PRIMARY CHART */}
    <div
      style={{
        ...sectionCard,
        borderRadius: "20px",
        padding: "22px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#a5b4fc",
          marginBottom: "10px",
        }}
      >
        Revenue Intelligence
      </div>

{/* 📊 REVENUE TREND */}
{!executiveModeEnabled && (
  <div
    style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top right, rgba(109,61,245,0.18), transparent 34%), linear-gradient(135deg, rgba(15,23,42,0.88), rgba(30,41,59,0.82))",
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 24px 70px rgba(2,6,23,0.32)",
    overflow: "hidden",
  }}
>
  {/* HEADER */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "16px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#c4b5fd",
        }}
      >
        Revenue Trend
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          marginTop: "5px",
        }}
      >
        Daily revenue performance, weekly momentum, and projected pacing
      </div>
    </div>

    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <div
        style={{
          padding: "9px 13px",
          borderRadius: "999px",
          background: revenueTrendBadge?.bg || "rgba(100,116,139,0.12)",
          color: revenueTrendBadge?.color || "#94a3b8",
          fontSize: "12px",
          fontWeight: "900",
          border: `1px solid ${revenueTrendBadge?.color || "#94a3b8"}33`,
        }}
      >
        {revenueTrendBadge?.symbol || "→"}{" "}
        {Math.abs(Number(revenueTrend?.growthPercent || 0)).toFixed(1)}% vs last week
      </div>

      <div
        style={{
          padding: "9px 13px",
          borderRadius: "999px",
          background: "rgba(251,191,36,0.12)",
          color: "#fde68a",
          fontSize: "12px",
          fontWeight: "900",
          border: "1px solid rgba(251,191,36,0.22)",
        }}
      >
        Best Day: {revenueTracker?.bestDay?.day || "N/A"}
      </div>
    </div>
  </div>

  {/* SUMMARY STRIP */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
      gap: "12px",
      marginBottom: "18px",
    }}
  >
    {[
      {
        label: "This Week",
        value: `$${Number(revenueTrend?.currentWeekRevenue || 0).toLocaleString()}`,
        color: "#ffffff",
      },
      {
        label: "Last Week",
        value: `$${Number(revenueTrend?.lastWeekRevenue || 0).toLocaleString()}`,
        color: "#ffffff",
      },
      {
        label: "Projected Week",
        value: `$${Math.round(
          Number(weeklyContext?.projectedFullWeekRevenue || 0)
        ).toLocaleString()}`,
        color: "#86efac",
      },
      {
        label: "Best Day Revenue",
        value: `$${Number(revenueTracker?.bestDay?.revenue || 0).toLocaleString()}`,
        color: "#fde68a",
      },
    ].map((item) => (
      <div
        key={item.label}
        style={{
          padding: "15px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: "800",
            marginBottom: "7px",
          }}
        >
          {item.label}
        </div>

        <div
          style={{
            fontSize: "23px",
            fontWeight: "950",
            color: item.color,
          }}
        >
          {item.value}
        </div>
      </div>
    ))}
  </div>

  {/* WEEKLY AI INSIGHT */}
  <div
    style={{
      marginBottom: "18px",
      padding: "15px 17px",
      borderRadius: "18px",
      background: "rgba(79,70,229,0.13)",
      border: "1px solid rgba(129,140,248,0.20)",
    }}
  >
    <div style={{ color: "#c7d2fe", fontWeight: "900", fontSize: "12px" }}>
      Weekly AI Insight
    </div>

    <div
      style={{
        color: "white",
        fontSize: "14px",
        marginTop: "6px",
        lineHeight: 1.65,
      }}
    >
      You are {Number(weeklyContext?.daysPassed || 0)}/7 days into the week. At
      your current pace, you’re projected to hit{" "}
      <b>
        ${Math.round(Number(weeklyContext?.projectedFullWeekRevenue || 0)).toLocaleString()}
      </b>{" "}
      this week. That is{" "}
      <b
        style={{
          color:
            Number(weeklyContext?.weeklyChangePercent || 0) >= 0
              ? "#86efac"
              : "#fca5a5",
        }}
      >
        {Number(weeklyContext?.weeklyChangePercent || 0) >= 0 ? "+" : ""}
        {Number(weeklyContext?.weeklyChangePercent || 0).toFixed(1)}%
      </b>{" "}
      vs last week.
    </div>
  </div>

  {/* INSIGHT BOX */}
  <div
    style={{
      marginBottom: "18px",
      padding: "14px 16px",
      borderRadius: "16px",
      background: revenueInsight?.tone?.bg || "rgba(255,255,255,0.04)",
      border: revenueInsight?.tone?.border || "1px solid rgba(148,163,184,0.12)",
    }}
  >
    <div
      style={{
        fontSize: "13px",
        fontWeight: "900",
        color: revenueInsight?.tone?.accent || "#e2e8f0",
        marginBottom: "6px",
      }}
    >
      {revenueInsight?.headline || "Revenue is holding steady."}
    </div>

    <div
      style={{
        fontSize: "12px",
     color: "#64748b",
        lineHeight: 1.6,
      }}
    >
      {revenueInsight?.message || "Performance is stable compared to last week."}
    </div>
  </div>

{/* CHART RANGE TOGGLE */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
  }}
>
  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
    <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "800" }}>
      Showing {revenueChartData?.length || 0} data points ·{" "}
      {intelligenceRevenueRange}
    </div>

    <div
      style={{
        color:
          intelligenceComparisonPercent >= 0
            ? "#86efac"
            : "#fca5a5",
        fontSize: "12px",
        fontWeight: "900",
      }}
    >
      {intelligenceComparisonLabel}
    </div>
  </div>

  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
    {intelligenceRevenueRangeOptions.map((range) => {
      const active = intelligenceRevenueRange === range;

      return (
        <button
          key={range}
          type="button"
          onClick={() => setIntelligenceRevenueRange(range)}
          style={{
            padding: "8px 11px",
            borderRadius: "999px",
            border: active
              ? "1px solid rgba(139,92,246,0.65)"
              : "1px solid rgba(148,163,184,0.18)",
            background: active
              ? "rgba(139,92,246,0.18)"
              : "rgba(15,23,42,0.72)",
            color: active ? "#c4b5fd" : "#94a3b8",
            fontSize: "12px",
            fontWeight: "900",
            cursor: "pointer",
          }}
        >
          {range}
        </button>
      );
    })}
  </div>
</div>
{/* CHART */}
<div
  style={{
    width: "100%",
    height: "340px",
    marginTop: "10px",
    background: "rgba(255,255,255,0.04)",
    border: "2px solid yellow",
    borderRadius: "16px",
    padding: "12px",
  }}
>
  <LineChart
    width={700}
    height={300}
   data={revenueChartData}
  >
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
    <XAxis dataKey="day" stroke="#94a3b8" />
    <YAxis stroke="#94a3b8" />
    <Tooltip />

    <Line
      type="monotone"
      dataKey="revenue"
      stroke="#8b5cf6"
      strokeWidth={4}
      dot
    />
  </LineChart>
</div>
 


{/* 🤖 AI EXECUTIVE SUMMARY */}
<div
  style={{
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(99,102,241,0.22)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.28)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#a5b4fc",
      marginBottom: "10px",
    }}
  >
    SERVEN AI
  </div>

  <h2
    style={{
      fontSize: "24px",
      fontWeight: "900",
      color: "white",
      marginBottom: "14px",
    }}
  >
   {executiveSummary?.headline}
  </h2>

  <div
    style={{
      color: "#cbd5e1",
      fontSize: "15px",
      lineHeight: 1.8,
      whiteSpace: "pre-line",
    }}
  >
    {executiveSummary?.summary}
  </div>

</div>
{hasProAccess ? (
  <>
{/* 🧠 AI ACTION CENTER */}

<div
  style={{
    marginTop: "20px",
    padding: "20px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(99,102,241,0.18)",
  }}
>
  <div
    style={{
      color: "#a5b4fc",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    AI ACTION CENTER
  </div>

  <div
    style={{
      color: "white",
      fontSize: "24px",
      fontWeight: "900",
      marginBottom: "8px",
    }}
  >
    Recommended Operational Actions
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.7,
      marginBottom: "18px",
    }}
  >
    AI continuously monitors operations, inventory, labor, waste,
    and profitability to recommend the highest-impact actions.
  </div>
<div
  style={{
    marginBottom: "16px",
    padding: "14px",
    borderRadius: "16px",
    background: aiActionAutopilotEnabled
      ? "rgba(34,197,94,0.10)"
      : "rgba(255,255,255,0.04)",
    border: aiActionAutopilotEnabled
      ? "1px solid rgba(34,197,94,0.22)"
      : "1px solid rgba(148,163,184,0.14)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  }}
>
  <div>
    <div style={{ color: "white", fontWeight: "900", fontSize: "14px" }}>
      AI Action Autopilot
    </div>

    <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
      {aiActionAutopilotEnabled
        ? "AI can start recommended operational actions automatically."
        : "AI will recommend actions only. Client approval required."}
    </div>
  </div>

  <button
    type="button"
    onClick={() => setAiActionAutopilotEnabled((prev) => !prev)}
    style={{
      padding: "10px 14px",
      borderRadius: "12px",
      border: "none",
      background: aiActionAutopilotEnabled
        ? "linear-gradient(135deg, #22c55e, #16a34a)"
        : "rgba(255,255,255,0.08)",
      color: "white",
      fontWeight: "900",
      cursor: "pointer",
      fontSize: "12px",
    }}
  >
    {aiActionAutopilotEnabled ? "Autopilot On" : "Turn On"}
  </button>
</div>
  <div style={{ display: "grid", gap: "12px" }}>
    {aiActionCenter.length > 0 ? (
      aiActionCenter.map((action, index) => (
        <div
          key={index}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "8px",
            }}
          >
            <div>
              <div
                style={{
                  color:
                    action.priority === "critical"
                      ? "#fca5a5"
                      : action.priority === "high"
                      ? "#fde68a"
                      : "#93c5fd",
                  fontSize: "11px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                {action.category}
              </div>

              <div
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: "16px",
                }}
              >
                {action.title}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRunAIAction(action)}
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                border: "none",
                background:
                  "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "white",
                fontWeight: "900",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {action.action}
            </button>
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {action.description}
          </div>
        </div>
      ))
    ) : (
      <div
        style={{
          padding: "14px",
          borderRadius: "16px",
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.18)",
          color: "#86efac",
          fontWeight: "800",
        }}
      >
        AI currently sees no major operational risks.
      </div>
    )}
  </div>
</div>

{/* 🧠 AI ACTION HISTORY */}

{aiActionHistory.length > 0 && (
  <div
    style={{
      marginTop: "16px",
      padding: "18px",
      borderRadius: "20px",
      background: "rgba(15,23,42,0.88)",
      border: "1px solid rgba(148,163,184,0.14)",
    }}
  >
    <div
      style={{
        color: "#93c5fd",
        fontSize: "12px",
        fontWeight: "900",
        marginBottom: "10px",
      }}
    >
      AI ACTION HISTORY
    </div>

    <div style={{ display: "grid", gap: "10px" }}>
      {aiActionHistory.slice(0, 5).map((item) => (
        <div
          key={item.id}
          style={{
            padding: "12px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.1)",
          }}
        >
          <div style={{ color: "white", fontWeight: "900", fontSize: "13px" }}>
            {item.text}
          </div>

          <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "4px" }}>
            {item.time}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* 💰 AI ACTION IMPACT TRACKER */}

<div
  style={{
    marginTop: "16px",
    padding: "18px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(15,23,42,0.92))",
    border: "1px solid rgba(34,197,94,0.18)",
  }}
>
  <div
    style={{
      color: "#86efac",
      fontSize: "12px",
      fontWeight: "900",
      marginBottom: "8px",
    }}
  >
    AI ACTION IMPACT TRACKER
  </div>

  <div
    style={{
      color: "white",
      fontSize: "28px",
      fontWeight: "950",
      marginBottom: "6px",
    }}
  >
    ${Number(aiActionImpact || 0).toLocaleString()}/mo
  </div>

  <div
    style={{
      color: "#bbf7d0",
      fontSize: "13px",
      lineHeight: 1.6,
      fontWeight: "800",
    }}
  >
    Estimated monthly profit protection from current AI-recommended actions.
  </div>
</div>

{/* 🛠️ AI FIX CARDS */}

<div
  style={{
    marginTop: "16px",
    padding: "18px",
    borderRadius: "20px",
    background: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(148,163,184,0.14)",
  }}
>
  <div style={{ color: "#fbbf24", fontSize: "12px", fontWeight: "900" }}>
    AI FIX CARDS
  </div>

  <div
    style={{
      color: "white",
      fontSize: "22px",
      fontWeight: "900",
      marginTop: "6px",
    }}
  >
    Recommended Fixes
  </div>

  <div style={{ marginTop: "14px", display: "grid", gap: "12px" }}>
    {aiFixCards.length > 0 ? (
      aiFixCards.slice(0, 5).map((fix, index) => (
        <div
          key={index}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div style={{ color: "white", fontWeight: "900" }}>
            {fix.title}
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "13px",
              marginTop: "6px",
              lineHeight: 1.6,
            }}
          >
            {fix.fix}
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "10px",
            }}
          >
            <span style={miniBadgeStyle}>
              Impact: {fix.impact}
            </span>

            <span style={miniBadgeStyle}>
              Effort: {fix.effort}
            </span>

            <span style={miniBadgeStyle}>
              {fix.category}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleApplyAIFix(fix)}
            disabled={appliedAIFixes.includes(fix.title)}
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "12px",
              border: "none",
              background: appliedAIFixes.includes(fix.title)
                ? "rgba(34,197,94,0.18)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: appliedAIFixes.includes(fix.title)
                ? "#86efac"
                : "white",
              fontWeight: "900",
              cursor: appliedAIFixes.includes(fix.title)
                ? "default"
                : "pointer",
              fontSize: "12px",
            }}
          >
            {appliedAIFixes.includes(fix.title)
              ? "Fix Applied"
              : "Apply Fix"}
          </button>
        </div>
      ))
    ) : (
      <div
        style={{
          color: "#94a3b8",
          fontSize: "14px",
        }}
      >
        No AI fixes needed right now.
      </div>
    )}
  </div>
</div>

{/* ✅ APPLIED FIX SUMMARY */}

<div
  style={{
    marginTop: "16px",
    padding: "18px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(15,23,42,0.92))",
    border: "1px solid rgba(34,197,94,0.18)",
  }}
>
  <div
    style={{
      color: "#86efac",
      fontSize: "12px",
      fontWeight: "900",
      marginBottom: "8px",
    }}
  >
    APPLIED FIX SUMMARY
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
    }}
  >
    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Fixes Applied</div>

      <div style={miniKpiValue}>
        {appliedAIFixes.length}
      </div>
    </div>

    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Open AI Fixes</div>

      <div style={miniKpiValue}>
        {Math.max(aiFixCards.length - appliedAIFixes.length, 0)}
      </div>
    </div>

    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Completion Rate</div>

      <div style={miniKpiValue}>
        {aiFixCards.length > 0
          ? `${Math.round(
              (appliedAIFixes.length / aiFixCards.length) * 100
            )}%`
          : "0%"}
      </div>
    </div>
  </div>

  {appliedAIFixes.length > 0 && (
    <div
      style={{
        marginTop: "16px",
        display: "grid",
        gap: "8px",
      }}
    >
      {appliedAIFixes.slice(0, 5).map((fix, index) => (
        <div
          key={index}
          style={{
            padding: "10px 12px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
            color: "#cbd5e1",
            fontSize: "13px",
          }}
        >
          ✅ {fix}
        </div>
      ))}
    </div>
  )}
</div>
  </>
) : (
  <div
    style={{
      padding: "22px",
      borderRadius: "20px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
      border: "1px solid rgba(168,85,247,0.22)",
      textAlign: "center",
      marginTop: "18px",
    }}
  >
    <div style={{ color: "#c4b5fd", fontSize: "12px", fontWeight: "900" }}>
      PRO AI FEATURE
    </div>

    <div
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "900",
        marginTop: "8px",
      }}
    >
      Unlock AI Action Center
    </div>

    <div
      style={{
        color: "#94a3b8",
        fontSize: "14px",
        lineHeight: 1.7,
        maxWidth: "620px",
        margin: "10px auto 0",
      }}
    >
      Get autonomous AI fixes, action history, profit impact tracking, and
      operational recovery recommendations.
    </div>

    <button
      type="button"
      onClick={() => setActiveTab("pricing")}
      style={{
        marginTop: "16px",
        padding: "12px 16px",
        borderRadius: "14px",
        border: "none",
        background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
        color: "white",
        fontWeight: "900",
        cursor: "pointer",
      }}
    >
      Upgrade to Pro AI
    </button>
  </div>
)}
{/* 📊 AI BENCHMARK INSIGHTS */}

<div
  style={{
    marginTop: "18px",

    display: "grid",

    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(220px, 1fr))",

    gap: isMobile ? "12px" : "16px",
  }}
>
  {(benchmarkInsights || []).map((item, index) => (
  <div
    key={index}
    style={{
      padding: "18px",
      borderRadius: "18px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.86))",
      border: "1px solid rgba(148,163,184,0.14)",
    }}
  >
    <div
      style={{
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#94a3b8",
        marginBottom: "8px",
      }}
    >
      {item?.title || "Benchmark"}
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          fontSize: "28px",
          fontWeight: "900",
          color: "white",
        }}
      >
        {item?.current || "N/A"}
      </div>

      <div
        style={{
          padding: "6px 10px",
          borderRadius: "999px",
          background:
            item?.status === "Healthy" || item?.status === "Strong"
              ? "rgba(34,197,94,0.16)"
              : "rgba(239,68,68,0.16)",
          color:
            item?.status === "Healthy" || item?.status === "Strong"
              ? "#4ade80"
              : "#f87171",
          fontSize: "11px",
          fontWeight: "800",
        }}
      >
        {item?.status || "Needs Data"}
      </div>
    </div>

    <div
      style={{
        fontSize: "13px",
        color: "#94a3b8",
        marginBottom: "8px",
      }}
    >
      Industry benchmark: {item?.benchmark || "N/A"}
    </div>

    <div
      style={{
        fontSize: "13px",
        color: "#cbd5e1",
        lineHeight: 1.6,
      }}
    >
      {item?.impact || "Upload more data to generate benchmark insights."}
    </div>
  </div>
))}
</div>
{/* ================= LABOR VS REVENUE CHART ================= */}
<div style={chartCard}>
  <div style={{ marginBottom: "18px" }}>
    <h3 style={{ color: "white", fontSize: "20px", fontWeight: "800", margin: 0 }}>
      Labor vs Revenue
    </h3>
    <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
      Compares labor cost against total revenue.
    </p>
  </div>

<div
  style={{
    width: "100%",
    minHeight: 260,
    padding: "18px",
    borderRadius: "16px",
    background: "rgba(15,23,42,0.75)",
    border: "1px solid rgba(148,163,184,0.2)",
  }}
>
  {[
    {
      label: "Revenue",
      value: Number(liveTotalRevenue || 0),
      color: "#22c55e",
    },
    {
      label: "Labor Cost",
      value: Number(liveLaborIntelligence?.totalLaborCost || 0),
      color: "#f97316",
    },
  ].map((item) => {
    const maxValue = Math.max(
      Number(liveTotalRevenue || 0),
      Number(liveLaborIntelligence?.totalLaborCost || 0),
      1
    );

    const widthPercent = Math.max(4, (item.value / maxValue) * 100);

    return (
      <div key={item.label} style={{ marginBottom: "22px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "white",
            fontWeight: "800",
            marginBottom: "8px",
          }}
        >
          <span>{item.label}</span>
          <span>${Number(item.value || 0).toLocaleString()}</span>
        </div>

        <div
          style={{
            width: "100%",
            height: "34px",
            borderRadius: "999px",
            background: "rgba(148,163,184,0.16)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${widthPercent}%`,
              height: "100%",
              borderRadius: "999px",
              background: item.color,
            }}
          />
        </div>
      </div>
    );
  })}
</div>

  <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "10px" }}>
    Revenue: ${Number(liveTotalRevenue || 0).toLocaleString()} · Labor cost: $
    {Number(liveLaborIntelligence?.totalLaborCost || 0).toLocaleString()} · Labor %:
    {liveLaborIntelligence?.laborPercent
      ? ` ${liveLaborIntelligence.laborPercent.toFixed(1)}%`
      : " 0%"}
  </p>
</div>
{/* ================= END LABOR VS REVENUE CHART ================= */}

{/* 💰 ROI PROJECTION TIMELINE */}

<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(34,197,94,0.18)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.28)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#86efac",
      marginBottom: "10px",
    }}
  >
    SERVEN ROI ENGINE
  </div>

  <h2
    style={{
      fontSize: "24px",
      fontWeight: "900",
      color: "white",
      marginBottom: "18px",
    }}
  >
    Projected Revenue Recovery
  </h2>

  <div
    style={{
      display: "grid",
     gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    {(revenueLiftTimeline || []).map((item, index) => (
      <div
        key={index}
        style={{
          padding: "18px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "8px",
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {item.label}
        </div>

        <div
          style={{
            fontSize: "30px",
            fontWeight: "900",
            color: "#4ade80",
          }}
        >
          ${Number(item.revenue || 0).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
</div>

{/* 💬 ROI TALKING POINTS */}

<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(212,175,55,0.22)",
  }}
>
  <div style={{ color: "#d4af37", fontSize: "12px", fontWeight: "900" }}>
    SALES SUMMARY
  </div>

  <h2 style={{ color: "white", fontSize: "24px", fontWeight: "900" }}>
    Why This Matters
  </h2>

  <p style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: 1.7 }}>
    SerVen helps restaurants find hidden profit leaks, compare performance
    against healthy operating targets, and turn recommendations into campaigns
    that can recover revenue.
  </p>

  <div style={{ color: "#86efac", fontWeight: "900", marginTop: "12px" }}>
    Goal: help the restaurant recover more profit than the monthly cost of the platform.
  </div>
</div>

{/* 🧠 AI HEALTH SCORE BREAKDOWN */}


<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(168,85,247,0.20)",
  }}
>
  <div style={{ color: "#c084fc", fontSize: "12px", fontWeight: "900" }}>
    SERVEN HEALTH ENGINE
  </div>

  <h2 style={{ color: "white", fontSize: "24px", fontWeight: "900" }}>
    AI Health Score Breakdown
  </h2>

  <div style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: 1.7 }}>
    Current score: <strong>{Number(score || 0)}/100</strong>
    <br />
    {Number(score || 0) >= 80
      ? "Your restaurant is performing strongly overall."
      : Number(score || 0) >= 60
      ? "Your restaurant is stable, but SerVen has found areas to improve."
      : "Your restaurant needs attention. SerVen found multiple profit risks."}
    <br />
    Food cost: {Number(foodCostPercentage || 0).toFixed(1)}% · Margin:{" "}
    {Number(avgMargin || 0).toFixed(1)}% · Revenue momentum:{" "}
    {Number(momentumPercent || 0).toFixed(1)}%
  </div>
</div>
{canSeeMultiLocation && (
  <>
{/* 📍 MULTI-LOCATION PREVIEW */}

<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(14,165,233,0.20)",
  }}
>
  <div style={{ color: "#7dd3fc", fontSize: "12px", fontWeight: "900" }}>
    SERVEN MULTI-LOCATION INTELLIGENCE
  </div>

  <h2 style={{ color: "white", fontSize: "24px", fontWeight: "900" }}>
    Location Performance Preview
  </h2>

  <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>
    Compare revenue, margins, waste, campaigns, and AI opportunities across
    multiple restaurant locations.
  </p>

  {/* LOCATION SWITCHER */}
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginTop: "16px",
      marginBottom: "18px",
    }}
  >
    {[
  ...(canSeeAllLocations ? ["all"] : []),
  ...managerLocationOptions.filter((loc) => loc !== "all"),
].map(
      (location) => (
        <button
          key={location}
          onClick={() => setActiveLocation(location)}
          style={{
            padding: "10px 14px",
            borderRadius: "999px",
            border:
              activeLocation === location
                ? "1px solid rgba(14,165,233,0.65)"
                : "1px solid rgba(148,163,184,0.16)",

            background:
              activeLocation === location
                ? "linear-gradient(135deg, #0ea5e9, #2563eb)"
                : "rgba(255,255,255,0.04)",

            color: "white",
            fontSize: "12px",
            fontWeight: "900",
            cursor: "pointer",
          }}
        >
          {location === "all" ? "All Locations" : location}
        </button>
      )
    )}
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
      marginTop: "16px",
    }}
  >
    {locationPerformanceData.length > 0 ? (
      locationPerformanceData.map((location) => (
        <div
          key={location.name}
          style={{
            padding: "16px",
            borderRadius: "16px",
            background:
              activeLocation === location.name
                ? "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(37,99,235,0.14))"
                : "rgba(255,255,255,0.04)",
            border:
              activeLocation === location.name
                ? "1px solid rgba(14,165,233,0.45)"
                : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "white",
              fontWeight: "900",
              marginBottom: "8px",
            }}
          >
            {location.name}
          </div>

          <div style={{ color: "#94a3b8", fontSize: "12px" }}>Revenue</div>

          <div
            style={{
              color: "#7dd3fc",
              fontSize: "24px",
              fontWeight: "900",
            }}
          >
            ${Number(location.revenue || 0).toLocaleString()}
          </div>

          <div
            style={{
              color: "#94a3b8",
              fontSize: "12px",
              marginTop: "10px",
            }}
          >
            Orders
          </div>

          <div style={{ color: "white", fontSize: "18px", fontWeight: "900" }}>
            {Number(location.orders || 0).toLocaleString()}
          </div>

          <div
            style={{
              color: "#94a3b8",
              fontSize: "12px",
              marginTop: "10px",
            }}
          >
            Health Score
          </div>

          <div style={{ color: "white", fontSize: "18px", fontWeight: "900" }}>
            {Number(location.health || 0).toFixed(0)}/100
          </div>
        </div>
      ))
    ) : (
      <div
        style={{
          gridColumn: "1 / -1",
          padding: "16px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#94a3b8",
          fontSize: "13px",
          fontWeight: "700",
        }}
      >
        Upload POS sales with a location column to compare locations.
      </div>
    )}
  </div>
</div>
</>
)}
</div>
)}
{!executiveModeEnabled && (
  <>
<div
  style={{
    marginTop: "24px",
  }}
>
  <div
    style={{
      color: "#94a3b8",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      marginBottom: "12px",
    }}
  >
    CORE ANALYTICS
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
      gap: "20px",
    }}
  >

{/* ============================= */}
{/* REVENUE BY DAY BAR CHART */}
{/* ============================= */}
<div
  style={{
    marginBottom: "0px",
    padding: "20px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = "0 24px 56px rgba(2,6,23,0.35)";
    e.currentTarget.style.borderColor = "rgba(139,92,246,0.32)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = "0 18px 40px rgba(2,6,23,0.22)";
    e.currentTarget.style.borderColor = "rgba(148,163,184,0.16)";
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "16px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          color: "#a78bfa",
          textTransform: "uppercase",
        }}
      >
        Revenue Pattern
      </div>

      <h3
        style={{
          margin: "6px 0 4px",
          color: "white",
          fontSize: "22px",
          fontWeight: "950",
        }}
      >
        Revenue by day
      </h3>

      <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
        See which days drive the most sales and where revenue drops.
      </p>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(251,191,36,0.12)",
        border: "1px solid rgba(251,191,36,0.22)",
        color: "#fde68a",
        fontSize: "12px",
        fontWeight: "900",
      }}
    >
      Best: {revenueTracker?.bestDay?.day || "N/A"}
    </div>
  </div>

  <div style={{ width: "100%", height: "300px" }}>
    {revenueChartData.length > 0 ? (
      <BarChart
  width={700}
  height={300}
  data={revenueChartData}
>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />

          <XAxis
            dataKey="day"
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />

          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
          />

          <Tooltip
            formatter={(value) => [
              `$${Number(value || 0).toLocaleString()}`,
              "Revenue",
            ]}
            contentStyle={{
              background: "#020617",
              border: "1px solid rgba(148,163,184,0.24)",
              borderRadius: "14px",
              color: "white",
            }}
          />

          <Bar
            dataKey="revenue"
            fill="#8b5cf6"
            radius={[10, 10, 0, 0]}
          />
        </BarChart>
      ) : (
  <div
    style={{
      height: "100%",
      padding: "28px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      borderRadius: "18px",
      border: "1px dashed rgba(148,163,184,0.24)",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.72))",
    }}
  >
    <div
      style={{
        color: "#d4af37",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      Daily Revenue Locked
    </div>

    <div
      style={{
        color: "white",
        fontSize: "20px",
        fontWeight: "900",
        marginBottom: "8px",
      }}
    >
      Upload POS data to reveal your strongest sales days
    </div>

    <div
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
        maxWidth: "520px",
      }}
    >
      SerVen will compare daily revenue patterns so restaurants can spot slow
      days, peak periods, and marketing opportunities.
    </div>
  </div>
)}
  </div>
</div>
{/* ============================= */}
{/* MENU MIX / SALES DISTRIBUTION */}
{/* ============================= */}
<div
  style={{
    marginBottom: "0px",
    padding: "20px",
    borderRadius: "22px",
    background:
      "radial-gradient(circle at top right, rgba(99,102,241,0.12), transparent 40%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
    cursor: "default",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = "0 24px 56px rgba(2,6,23,0.35)";
    e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = "0 18px 40px rgba(2,6,23,0.22)";
    e.currentTarget.style.borderColor = "rgba(148,163,184,0.16)";
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "16px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          color: "#22c55e",
          textTransform: "uppercase",
        }}
      >
        Menu Mix
      </div>

      <h3
        style={{
          margin: "6px 0 4px",
          color: "white",
          fontSize: "22px",
          fontWeight: "950",
        }}
      >
        Sales distribution
      </h3>

      <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
        See which menu items or categories are driving the most revenue.
      </p>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(34,197,94,0.12)",
        border: "1px solid rgba(34,197,94,0.22)",
        color: "#86efac",
        fontSize: "12px",
        fontWeight: "900",
      }}
    >
      {salesDistributionData?.length || 0} segments
    </div>
  </div>

  <div style={{ width: "100%", height: "300px" }}>
    {salesDistributionData && salesDistributionData.length > 0 ? (
      <PieChart width={700} height={300}>
          <Pie
            data={salesDistributionData}
            dataKey="value"
            nameKey="name"
            outerRadius={95}
            innerRadius={48}
            paddingAngle={3}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {(salesDistributionData || []).map((entry, index) => {
              const colors = [
                "#4f46e5",
                "#22c55e",
                "#f59e0b",
                "#ef4444",
                "#06b6d4",
                "#a855f7",
              ];

              return (
                <Cell
                  key={`menu-mix-cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              );
            })}
          </Pie>

          <Tooltip
            formatter={(value) => [
              `$${Number(value || 0).toLocaleString()}`,
              "Revenue",
            ]}
            contentStyle={{
              background: "#020617",
              border: "1px solid rgba(148,163,184,0.24)",
              borderRadius: "14px",
              color: "white",
            }}
          />
        </PieChart>
      
      ) : (
  <div
    style={{
      height: "100%",
      padding: "28px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      borderRadius: "18px",
      border: "1px dashed rgba(148,163,184,0.24)",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.72))",
    }}
  >
    <div
      style={{
        color: "#22c55e",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      Menu Mix Locked
    </div>

    <div
      style={{
        color: "white",
        fontSize: "20px",
        fontWeight: "900",
        marginBottom: "8px",
      }}
    >
      Upload menu item data to reveal your best sellers
    </div>

    <div
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
        maxWidth: "520px",
      }}
    >
      SerVen breaks down which menu items and categories drive the most revenue
      so restaurants can double down on winners and fix weak performers.
    </div>
  </div>
)}
  </div>

  {salesDistributionInsight && (
    <div
      style={{
        marginTop: "14px",
        padding: "12px 14px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
        color: "#e2e8f0",
        fontSize: "13px",
        lineHeight: 1.6,
      }}
    >
      {salesDistributionInsight}
    </div>
  )}
</div>
{/* ============================= */}
{/* FOOD COST % TREND */}
{/* ============================= */}
<div
  style={{
    marginBottom: "0px",
    padding: "20px",
    borderRadius: "22px",
    background:
      "radial-gradient(circle at top right, rgba(239,68,68,0.12), transparent 40%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = "0 24px 56px rgba(2,6,23,0.35)";
    e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = "0 18px 40px rgba(2,6,23,0.22)";
    e.currentTarget.style.borderColor = "rgba(148,163,184,0.16)";
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "16px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          color: "#fca5a5",
          textTransform: "uppercase",
        }}
      >
        Cost Control
      </div>

      <h3
        style={{
          margin: "6px 0 4px",
          color: "white",
          fontSize: "22px",
          fontWeight: "950",
        }}
      >
        Food cost % trend
      </h3>

      <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
        Tracks food cost pressure against your target and danger zones.
      </p>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background:
          Number(foodCostPercentage || 0) >= 35
            ? "rgba(239,68,68,0.14)"
            : Number(foodCostPercentage || 0) >= 30
            ? "rgba(245,158,11,0.14)"
            : "rgba(34,197,94,0.12)",
        border:
          Number(foodCostPercentage || 0) >= 35
            ? "1px solid rgba(239,68,68,0.25)"
            : Number(foodCostPercentage || 0) >= 30
            ? "1px solid rgba(245,158,11,0.25)"
            : "1px solid rgba(34,197,94,0.22)",
        color:
          Number(foodCostPercentage || 0) >= 35
            ? "#fca5a5"
            : Number(foodCostPercentage || 0) >= 30
            ? "#fde68a"
            : "#86efac",
        fontSize: "12px",
        fontWeight: "900",
      }}
    >
      Current: {Number(foodCostPercentage || 0).toFixed(1)}%
    </div>
  </div>

  <div style={{ width: "100%", height: "300px" }}>
    {foodCostTrendData?.length > 0 ? (
      <LineChart
  width={700}
  height={300}
          data={foodCostTrendData}
          margin={{ top: 10, right: 18, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />

          <XAxis
            dataKey="day"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
            tickLine={false}
          />

          <YAxis
            tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
            tickLine={false}
            domain={[0, 45]}
          />

          <Tooltip
            formatter={(value, name) => [
              `${Number(value || 0).toFixed(1)}%`,
              name === "foodCostPercent"
                ? "Food Cost"
                : name === "target"
                ? "Target"
                : "Danger Zone",
            ]}
            contentStyle={{
              background: "#020617",
              border: "1px solid rgba(148,163,184,0.24)",
              borderRadius: "14px",
              color: "white",
            }}
          />

          <Legend
            wrapperStyle={{
              color: "#94a3b8",
              fontSize: "12px",
              fontWeight: "800",
            }}
          />

          <Line
            type="monotone"
            dataKey="target"
            name="Target"
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="danger"
            name="Danger Zone"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="foodCostPercent"
            name="Food Cost"
            stroke="#f59e0b"
            strokeWidth={4}
            dot={false}
            activeDot={{
              r: 7,
              fill: "#fbbf24",
              stroke: "white",
              strokeWidth: 2,
            }}
            connectNulls
          />
        </LineChart>
      
    ) : (
  <div
    style={{
      height: "100%",
      padding: "28px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      borderRadius: "18px",
      border: "1px dashed rgba(148,163,184,0.24)",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.72))",
    }}
  >
    <div
      style={{
        color: "#fca5a5",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      Food Cost Tracking Locked
    </div>

    <div
      style={{
        color: "white",
        fontSize: "20px",
        fontWeight: "900",
        marginBottom: "8px",
      }}
    >
      Upload menu or ingredient costs to monitor margin pressure
    </div>

    <div
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
        maxWidth: "540px",
      }}
    >
      SerVen tracks rising food costs, identifies dangerous margin trends,
      and alerts restaurants before profitability starts slipping.
    </div>
  </div>
)}
  </div>
</div>
{/* ============================= */}
{/* PROFIT LEAKAGE TOP ITEMS */}
{/* ============================= */}
<div
 style={{
  marginBottom: "0px",
  padding: "20px",
  borderRadius: "22px",

  // 🔥 subtle glow upgrade
  background:
    "radial-gradient(circle at top right, rgba(99,102,241,0.12), transparent 40%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",

  border: "1px solid rgba(148,163,184,0.16)",

  boxShadow: "0 18px 40px rgba(2,6,23,0.22)",

  // 🔥 smooth hover animation
  transition: "all 0.25s ease",
  cursor: "default",
}}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-4px)";
  e.currentTarget.style.boxShadow = "0 28px 70px rgba(2,6,23,0.45)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0px)";
  e.currentTarget.style.boxShadow = "0 18px 40px rgba(2,6,23,0.22)";
}}
>
  <div style={{ marginBottom: "16px" }}>
    <div
      style={{
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        color: "#f97316",
        textTransform: "uppercase",
      }}
    >
      Profit Leakage
    </div>

    <h3
      style={{
        margin: "6px 0 4px",
        color: "white",
        fontSize: "22px",
        fontWeight: "950",
      }}
    >
      Top margin leak items
    </h3>

    <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
      Flags items that may be selling but leaking profit through weak margins.
    </p>
  </div>

  <div style={{ width: "100%", height: "300px" }}>
    
    {profitLeakageChartData?.length > 0 ? (
      <BarChart
  width={700}
  height={300}
  data={profitLeakageChartData}
>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />

          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />

          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
          />

          <Tooltip
            formatter={(value) => [
              `$${Number(value || 0).toLocaleString()}`,
              "Estimated Loss",
            ]}
            contentStyle={{
              background: "#020617",
              border: "1px solid rgba(148,163,184,0.24)",
              borderRadius: "14px",
              color: "white",
            }}
          />

          <Bar dataKey="loss" fill="#f97316" radius={[10, 10, 0, 0]} />
        </BarChart>
      
    ) : (
  <div
    style={{
      height: "100%",
      padding: "28px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      borderRadius: "18px",
      border: "1px dashed rgba(148,163,184,0.24)",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.72))",
    }}
  >
    <div
      style={{
        color: "#f97316",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      Profit Leakage Locked
    </div>

    <div
      style={{
        color: "white",
        fontSize: "20px",
        fontWeight: "900",
        marginBottom: "8px",
      }}
    >
      Upload item prices and costs to reveal margin leaks
    </div>

    <div
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
        maxWidth: "540px",
      }}
    >
      SerVen identifies items that sell but quietly lose profit through weak
      margins, high costs, or poor pricing.
    </div>
  </div>
)}
  </div>
  {profitLeakageChartData?.length > 0 && (
  <div
    style={{
      marginTop: "14px",
      padding: "14px 16px",
      borderRadius: "16px",
      background: "rgba(249,115,22,0.10)",
      border: "1px solid rgba(249,115,22,0.22)",
      color: "#fed7aa",
      fontSize: "13px",
      lineHeight: 1.6,
      fontWeight: "800",
    }}
  >
    Highest profit leak:{" "}
    <span style={{ color: "white", fontWeight: "950" }}>
      {profitLeakageChartData?.[0]?.name || "Menu item"}
    </span>{" "}
    is estimated to be leaking{" "}
    <span style={{ color: "#fdba74", fontWeight: "950" }}>
      ${Number(profitLeakageChartData?.[0]?.loss || 0).toLocaleString()}
    </span>{" "}
    in recoverable margin. SerVen recommends reviewing price, cost, or portioning
    for this item first.
  </div>
)}
</div>

{/* 👥 LABOR INTELLIGENCE */}
<div
  style={{
    padding: "20px",
    borderRadius: "20px",
    background:
      "radial-gradient(circle at top right, rgba(99,102,241,0.12), transparent 40%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    marginBottom: "0px",
    boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
    transition: "all 0.25s ease",
    cursor: "default",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = "0 28px 70px rgba(2,6,23,0.45)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.boxShadow = "0 18px 40px rgba(2,6,23,0.22)";
  }}
>
  <div style={{ color: "#93c5fd", fontWeight: "900", fontSize: "12px" }}>
    Labor Intelligence
  </div>

  <div
    style={{
      color: "white",
      fontWeight: "900",
      fontSize: "20px",
      marginTop: "6px",
    }}
  >
    Staffing and labor cost risk
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
      marginTop: "6px",
    }}
  >
    Tracks uploaded labor cost as a percentage of live revenue and flags staffing risk.
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "10px",
      marginTop: "14px",
    }}
  >
    <div
      style={{
        padding: "12px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: "11px" }}>Labor Cost</div>

      <div style={{ color: "white", fontSize: "22px", fontWeight: "900" }}>
        {liveLaborIntelligence?.totalLaborCost > 0
          ? `$${Number(
              liveLaborIntelligence.totalLaborCost
            ).toLocaleString()}`
          : "Needs labor data"}
      </div>
    </div>

    <div
      style={{
        padding: "12px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: "11px" }}>Labor %</div>

      <div
        style={{
          color:
            liveLaborIntelligence?.laborPercent <= 0
              ? "#94a3b8"
              : liveLaborIntelligence.laborPercent >
                activeBenchmarks.labor.high
              ? "#fca5a5"
              : liveLaborIntelligence.laborPercent <
                activeBenchmarks.labor.low
              ? "#fde68a"
              : "#86efac",
          fontSize: "22px",
          fontWeight: "900",
        }}
      >
        {liveLaborIntelligence?.laborPercent > 0
          ? `${Number(liveLaborIntelligence.laborPercent).toFixed(1)}%`
          : "Waiting"}
      </div>
    </div>

    <div
      style={{
        padding: "12px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: "11px" }}>Status</div>

      <div style={{ color: "white", fontSize: "15px", fontWeight: "900" }}>
        {liveLaborIntelligence?.laborPercent <= 0
          ? "Waiting for upload"
          : liveLaborIntelligence.laborPercent > activeBenchmarks.labor.high
          ? "Overstaffed risk"
          : liveLaborIntelligence.laborPercent < activeBenchmarks.labor.low
          ? "Understaffed risk"
          : "Healthy labor range"}
      </div>
    </div>
  </div>

  <div
    style={{
      marginTop: "14px",
      padding: "12px",
      borderRadius: "14px",
      background: "rgba(59,130,246,0.10)",
      border: "1px solid rgba(96,165,250,0.18)",
      color: "#bfdbfe",
      fontSize: "13px",
      lineHeight: 1.6,
      fontWeight: "700",
    }}
  >
    {liveLaborIntelligence?.laborPercent <= 0
      ? "Upload labor data with hours, rates, or labor cost to calculate real labor efficiency."
      : liveLaborIntelligence.laborPercent > activeBenchmarks.labor.high
      ? "Labor cost is above benchmark. Review staffing levels against revenue patterns."
      : liveLaborIntelligence.laborPercent < activeBenchmarks.labor.low
      ? "Labor cost is below benchmark. Watch for service pressure during peak hours."
      : "Labor cost is within benchmark range based on uploaded labor data."}
  </div>
</div>
</div>
</div>
</>
    )}
    {!executiveModeEnabled && (
      <>
{/* 💸 PROJECTED REVENUE LIFT */}
<div
  style={{
    marginTop: "24px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top right, rgba(34,197,94,0.12), transparent 35%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.94))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 24px 60px rgba(2,6,23,0.28)",
    overflow: "hidden",
    position: "relative",
  }}
>
  {/* HEADER */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "20px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#4ade80",
          marginBottom: "8px",
        }}
      >
        Projected Revenue Lift
      </div>

      <div
        style={{
          fontSize: "28px",
          fontWeight: "900",
          color: "white",
          lineHeight: 1.1,
        }}
      >
        <CountUpValue
          value={projectedRevenueLift.aiLift}
          prefix="+$"
          suffix="/mo"
        />
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#4ade80",
          marginTop: "4px",
          fontWeight: "700",
        }}
      >
        AI-optimized revenue potential
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#94a3b8",
          marginTop: "6px",
          lineHeight: 1.6,
          maxWidth: "520px",
        }}
      >
        If your current AI fixes are applied, Serven projects an estimated
        monthly revenue increase based on your active profit opportunities.
      </div>
    </div>

    <div
      style={{
        padding: "10px 14px",
        borderRadius: "999px",
        background: "rgba(34,197,94,0.12)",
        border: "1px solid rgba(34,197,94,0.18)",
        color: "#4ade80",
        fontSize: "13px",
        fontWeight: "800",
      }}
    >
      {projectedRevenueLift.percentLift.toFixed(1)}% lift
    </div>
  </div>

  {/* SCENARIO TOGGLE */}
  <div
    style={{
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginTop: "18px",
      marginBottom: "4px",
    }}
  >
    {[
      { key: "conservative", label: "Conservative" },
      { key: "base", label: "Base Case" },
      { key: "aggressive", label: "Aggressive" },
    ].map((scenario) => {
      const isActive = revenueScenario === scenario.key;

      return (
        <button
          key={scenario.key}
          type="button"
          onClick={() => setRevenueScenario(scenario.key)}
          style={{
            padding: "8px 12px",
            borderRadius: "999px",
            border: isActive
              ? "1px solid rgba(34,197,94,0.24)"
              : "1px solid rgba(148,163,184,0.16)",
            background: isActive
              ? "rgba(34,197,94,0.12)"
              : "rgba(255,255,255,0.04)",
            color: isActive ? "#86efac" : "#cbd5e1",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          {scenario.label}
        </button>
      );
    })}
  </div>

  {/* METRIC BOXES */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "16px",
      marginTop: "22px",
    }}
  >
    <div
      style={{
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        Current Revenue
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: "900",
          color: "white",
        }}
      >
        ${projectedRevenueLift.currentRevenue.toLocaleString()}
      </div>
    </div>

    <div
      style={{
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(34,197,94,0.08)",
        border: "1px solid rgba(34,197,94,0.16)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#4ade80",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        AI Revenue Lift
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: "900",
          color: "#4ade80",
        }}
      >
        +${projectedRevenueLift.aiLift.toLocaleString()}/mo
      </div>
    </div>

    <div
      style={{
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        Projected Revenue
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: "900",
          color: "white",
        }}
      >
        ${projectedRevenueLift.projectedRevenue.toLocaleString()}
      </div>
    </div>
  </div>

  {/* SUMMARY */}
  <div
    style={{
      marginTop: "22px",
      padding: "14px 16px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(148,163,184,0.12)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "4px",
        }}
      >
        Revenue Forecast Summary
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#e2e8f0",
          lineHeight: 1.6,
        }}
      >
        In the{" "}
        <span style={{ color: "#86efac", fontWeight: "800" }}>
          {revenueScenario === "base" ? "base case" : revenueScenario}
        </span>{" "}
        scenario, applying {appliedFixes.length} AI fix
        {appliedFixes.length === 1 ? "" : "es"} could move the business from $
        {projectedRevenueLift.currentRevenue.toLocaleString()} to $
        {projectedRevenueLift.projectedRevenue.toLocaleString()} in estimated
        monthly revenue.
      </div>
    </div>

    <button
      type="button"
      onClick={() => runAutopilotAI("Revenue lift refresh")}
      style={{
        padding: "10px 14px",
        borderRadius: "12px",
        border: "none",
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
        color: "white",
        fontWeight: "800",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      Refresh Projection
    </button>
  </div>
</div>
{/* 🧠 FORECAST CONFIDENCE */}
<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#c4b5fd",
          marginBottom: "8px",
        }}
      >
        Forecast Confidence
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#94a3b8",
          lineHeight: 1.6,
          maxWidth: "560px",
        }}
      >
        AI confidence reflects the number of applied fixes, revenue signal
        quality, and how much optimization data is already confirmed.
      </div>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(168,85,247,0.12)",
        border: "1px solid rgba(168,85,247,0.18)",
        color: "#d8b4fe",
        fontSize: "12px",
        fontWeight: "800",
      }}
    >
      {Number(revenueForecastConfidence || 0)}% confidence
    </div>
  </div>

<div
  style={{
    display: "grid",

    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(220px, 1fr))",

    gap: isMobile ? "10px" : "14px",
  }}
>
    <div
      style={{
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        Assumption 1
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#e2e8f0",
          lineHeight: 1.6,
        }}
      >
        Revenue lift assumes current AI fixes are applied consistently and
        maintained across the month.
      </div>
    </div>

    <div
      style={{
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        Assumption 2
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#e2e8f0",
          lineHeight: 1.6,
        }}
      >
        Forecast assumes current traffic demand remains stable while menu,
        labor, and cost improvements raise efficiency.
      </div>
    </div>

    <div
      style={{
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        Assumption 3
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#e2e8f0",
          lineHeight: 1.6,
        }}
      >
        More applied AI fixes and stronger data quality increase forecast
        confidence over time.
      </div>
    </div>
  </div>

  <div
  style={{
    marginTop: "18px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "rgba(168,85,247,0.08)",
    border: "1px solid rgba(168,85,247,0.16)",
  }}
>
  <div
    style={{
      color: "#d8b4fe",
      fontSize: "12px",
      fontWeight: "900",
      marginBottom: "8px",
    }}
  >
    AI CONFIDENCE LEVEL
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <div
        style={{
          color: "white",
          fontSize: "28px",
          fontWeight: "950",
        }}
      >
        {overallAIConfidence}%
      </div>

      <div
        style={{
          color: "#e9d5ff",
          fontWeight: "800",
          fontSize: "13px",
        }}
      >
        High confidence
      </div>
    </div>

    <div
      style={{
        fontSize: "13px",
        color: "#ddd6fe",
        lineHeight: 1.7,
        maxWidth: "420px",
      }}
    >
      Serven AI becomes more accurate as more inventory, menu,
      and operational data is uploaded into the system.
    </div>
  </div>
</div>
</div>
{/* 🚀 REVENUE DRIVERS */}
<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#fbbf24",
          marginBottom: "8px",
        }}
      >
        Revenue Drivers
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#94a3b8",
          lineHeight: 1.6,
          maxWidth: "560px",
        }}
      >
        This shows which AI actions are contributing most to your projected
        revenue increase.
      </div>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(251,191,36,0.12)",
        border: "1px solid rgba(251,191,36,0.18)",
        color: "#fde68a",
        fontSize: "12px",
        fontWeight: "800",
      }}
    >
      Top Driver: {revenueDrivers?.topDriver || "N/A"}
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gap: "14px",
    }}
  >
   {(revenueDrivers?.rows || []).map((driver) => {
      const width =
        revenueDrivers.total > 0
          ? (driver.value / revenueDrivers.total) * 100
          : 0;

      return (
        <div
          key={driver.label}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "800",
                color: "white",
              }}
            >
              {driver.label}
            </div>

            <div
              style={{
                fontSize: "13px",
                fontWeight: "900",
                color: driver.accent,
              }}
            >
              +${driver.value.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              height: "9px",
              borderRadius: "999px",
              background: "rgba(148,163,184,0.14)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${width}%`,
                height: "100%",
                borderRadius: "999px",
                background: driver.accent,
                transition: "width 0.35s ease",
              }}
            />
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "11px",
              color: "#94a3b8",
              fontWeight: "700",
            }}
          >
            {width.toFixed(1)}% of projected lift
          </div>
        </div>
      );
    })}
  </div>
</div>
{/* 📌 WHAT CHANGED THIS WEEK */}
<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#f472b6",
          marginBottom: "8px",
        }}
      >
        What Changed This Week
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#94a3b8",
          lineHeight: 1.6,
          maxWidth: "560px",
        }}
      >
        A weekly AI summary of the biggest business shifts affecting revenue,
        margin, and food cost.
      </div>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background:
          weeklyChangeSummary.revenueDelta >= 0
            ? "rgba(34,197,94,0.12)"
            : "rgba(239,68,68,0.12)",
        border:
          weeklyChangeSummary.revenueDelta >= 0
            ? "1px solid rgba(34,197,94,0.18)"
            : "1px solid rgba(239,68,68,0.18)",
        color:
          weeklyChangeSummary.revenueDelta >= 0 ? "#86efac" : "#fca5a5",
        fontSize: "12px",
        fontWeight: "800",
      }}
    >
      {weeklyChangeSummary.revenueDelta >= 0 ? "+" : ""}
      {weeklyChangeSummary.revenueDeltaPercent.toFixed(1)}% vs last week
    </div>
  </div>

  <div
    style={{
      padding: "16px",
      borderRadius: "18px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(148,163,184,0.12)",
      marginBottom: "16px",
    }}
  >
    <div
      style={{
        fontSize: "15px",
        fontWeight: "900",
        color: "white",
        marginBottom: "8px",
      }}
    >
      {weeklyChangeSummary.headline}
    </div>

    <div
      style={{
        fontSize: "13px",
        color: "#cbd5e1",
        lineHeight: 1.7,
      }}
    >
      {weeklyChangeSummary.focus}
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <div
      style={{
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        This Week Revenue
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: "900",
          color: "white",
        }}
      >
        ${weeklyChangeSummary.currentWeekRevenue.toLocaleString()}
      </div>
    </div>

    <div
      style={{
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        Last Week Revenue
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: "900",
          color: "white",
        }}
      >
        ${weeklyChangeSummary.lastWeekRevenue.toLocaleString()}
      </div>
    </div>

    <div
      style={{
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        Avg Margin
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: "900",
          color: "white",
        }}
      >
        {weeklyChangeSummary.marginNow.toFixed(1)}%
      </div>
    </div>

    <div
      style={{
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        Food Cost
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: "900",
          color: "white",
        }}
      >
        {weeklyChangeSummary.foodCostNow.toFixed(1)}%
      </div>
    </div>
  </div>
</div>
{/* ⚠️ TOP RISKS THIS WEEK */}
<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#fca5a5",
          marginBottom: "8px",
        }}
      >
        Top Risks This Week
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#94a3b8",
          lineHeight: 1.6,
          maxWidth: "560px",
        }}
      >
        AI-detected risks that may reduce margin, slow revenue growth, or limit
        forecast upside.
      </div>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.18)",
        color: "#fca5a5",
        fontSize: "12px",
        fontWeight: "800",
      }}
    >
      {topRisksThisWeek.length} active risk
      {topRisksThisWeek.length === 1 ? "" : "s"}
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gap: "14px",
    }}
  >
    {topRisksThisWeek.map((risk, index) => {
      const tone = getPriorityTone(risk.severity);
        risk.severity === "high"
          ? {
              bg: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.18)",
              accent: "#fca5a5",
            }
          : risk.severity === "medium"
          ? {
              bg: "rgba(245,158,11,0.10)",
              border: "1px solid rgba(245,158,11,0.18)",
              accent: "#fcd34d",
            }
          : {
              bg: "rgba(34,197,94,0.10)",
              border: "1px solid rgba(34,197,94,0.18)",
              accent: "#86efac",
            };

      return (
        <div
          key={`${risk.title}-${index}`}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background: tone.bg,
            border: tone.border,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "8px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "900",
                color: "white",
              }}
            >
              {risk.title}
            </div>

            <div
  style={{
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  }}
>
  <div
    style={{
      padding: "6px 10px",
      borderRadius: "999px",
      background: tone.pillBg,
      color: tone.accent,
      fontSize: "11px",
      fontWeight: "800",
    }}
  >
    {tone.label}
  </div>

  <div
    style={{
      padding: "6px 10px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.06)",
      color: tone.accent,
      fontSize: "11px",
      fontWeight: "800",
    }}
  >
    {risk.value}
  </div>
</div>
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#e2e8f0",
              lineHeight: 1.6,
            }}
          >
            {risk.description}
          </div>
        </div>
      );
    })}
  </div>
</div>
{/* 🚀 TOP OPPORTUNITIES THIS WEEK */}
<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#86efac",
          marginBottom: "8px",
        }}
      >
        Top Opportunities This Week
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#94a3b8",
          lineHeight: 1.6,
          maxWidth: "560px",
        }}
      >
        AI-detected growth opportunities that could improve revenue, margin, or
        operational efficiency this week.
      </div>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(34,197,94,0.12)",
        border: "1px solid rgba(34,197,94,0.18)",
        color: "#86efac",
        fontSize: "12px",
        fontWeight: "800",
      }}
    >
      {topOpportunitiesThisWeek.length} active opportunit
      {topOpportunitiesThisWeek.length === 1 ? "y" : "ies"}
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gap: "14px",
    }}
  >
    {topOpportunitiesThisWeek.map((opportunity, index) => {
     const normalizedPriority =
  opportunity.priority === "high"
    ? "high"
    : opportunity.priority === "medium"
    ? "medium"
    : "low";

const tone = getPriorityTone(normalizedPriority);

      return (
        <div
          key={`${opportunity.title}-${index}`}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background: tone.bg,
            border: tone.border,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "8px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "900",
                color: "white",
              }}
            >
              {opportunity.title}
            </div>

            <div
  style={{
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  }}
>
  <div
    style={{
      padding: "6px 10px",
      borderRadius: "999px",
      background: tone.pillBg,
      color: tone.accent,
      fontSize: "11px",
      fontWeight: "800",
    }}
  >
    {tone.label}
  </div>

  <div
    style={{
      padding: "6px 10px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.06)",
      color: tone.accent,
      fontSize: "11px",
      fontWeight: "800",
    }}
  >
    {opportunity.value}
  </div>
</div>
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#e2e8f0",
              lineHeight: 1.6,
            }}
          >
            {opportunity.description}
          </div>
        </div>
      );
    })}
  </div>
</div>
{/* ✅ WEEKLY AI ACTION PLAN */}
<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#86efac",
          marginBottom: "8px",
        }}
      >
        Weekly AI Action Plan
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#94a3b8",
          lineHeight: 1.6,
          maxWidth: "560px",
        }}
      >
        A simple AI-prioritized plan for what to fix first, what to improve
        next, and what to monitor this week.
      </div>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(34,197,94,0.12)",
        border: "1px solid rgba(34,197,94,0.18)",
        color: "#86efac",
        fontSize: "12px",
        fontWeight: "800",
      }}
    >
      {weeklyAIActionPlan.length} priority step
      {weeklyAIActionPlan.length === 1 ? "" : "s"}
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gap: "14px",
    }}
  >
    {weeklyAIActionPlan.map((item, index) => {
      const normalizedPriority =
  item.priority === "High"
    ? "high"
    : item.priority === "Medium"
    ? "medium"
    : "low";

const tone = getPriorityTone(normalizedPriority);

      return (
        <div
          key={`${item.step}-${item.title}-${index}`}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background: tone.bg,
            border: tone.border,
            display: "flex",
            gap: "14px",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              minWidth: "46px",
              height: "46px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tone.accent,
              fontWeight: "900",
              fontSize: "14px",
            }}
          >
            {item.step}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "900",
                  color: "white",
                }}
              >
                {item.title}
              </div>

             <div
  style={{
    padding: "6px 10px",
    borderRadius: "999px",
    background: tone.pillBg,
    color: tone.accent,
    fontSize: "11px",
    fontWeight: "800",
  }}
>
  {tone.label}
</div>
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#e2e8f0",
                lineHeight: 1.6,
              }}
            >
              {item.description}
            </div>
          </div>
        </div>
      );
    })}
  </div>
</div>
{/* 📈 REVENUE GROWTH TIMELINE */}
<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.24)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#60a5fa",
          marginBottom: "8px",
        }}
      >
        Revenue Growth Timeline
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#94a3b8",
          lineHeight: 1.6,
          maxWidth: "560px",
        }}
      >
        This shows how revenue could climb over the next few months as AI fixes
        are applied and performance improves.
      </div>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(96,165,250,0.12)",
        border: "1px solid rgba(96,165,250,0.18)",
        color: "#93c5fd",
        fontSize: "12px",
        fontWeight: "800",
      }}
    >
      <CountUpValue
        value={Math.floor(displayProfit)}
prefix="+$"
suffix=" AI-generated upside"
      />
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    {revenueLiftTimeline.map((month, index) => {
      const maxRevenue = Math.max(
        ...revenueLiftTimeline.map((item) => item.revenue),
        1
      );

      const barWidth = `${(month.revenue / maxRevenue) * 100}%`;
      const isFinal = index === revenueLiftTimeline.length - 1;

      return (
        <div
          key={month.label}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background: isFinal
              ? "rgba(34,197,94,0.08)"
              : "rgba(255,255,255,0.04)",
            border: isFinal
              ? "1px solid rgba(34,197,94,0.18)"
              : "1px solid rgba(148,163,184,0.12)",
            transform: timelineAnimated ? "translateY(0px)" : "translateY(8px)",
            opacity: timelineAnimated ? 1 : 0.6,
            transition: `all 0.45s ease ${index * 0.08}s`,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "8px",
            }}
          >
            {month.label}
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "900",
              color: "white",
              marginBottom: "10px",
            }}
          >
            <CountUpValue value={Math.round(month.revenue)} prefix="$" />
          </div>

          <div
            style={{
              height: "8px",
              borderRadius: "999px",
              background: "rgba(148,163,184,0.14)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: timelineAnimated ? barWidth : "0%",
                height: "100%",
                borderRadius: "999px",
                background: isFinal
                  ? "linear-gradient(135deg, #22c55e, #4ade80)"
                  : "linear-gradient(135deg, #3b82f6, #60a5fa)",
                transition: `width 0.9s ease ${index * 0.12}s`,
              }}
            />
          </div>
        </div>
      );
    })}
  </div>
</div>  
</>
    )}
  </div>
</div>
  
)}

  
{activeTab === "financial" && (
  <div
  style={{
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",

    display: "grid",

    gap: isMobile ? "14px" : "20px",
  }}
>
    {/* FINANCIAL INTELLIGENCE HERO */}
<div
  style={{
    marginBottom: "24px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top right, rgba(34,197,94,0.18), transparent 30%), linear-gradient(135deg, #111827, #0f172a)",
    border: "1px solid rgba(74,222,128,0.18)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.22)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#86efac",
      marginBottom: "8px",
    }}
  >
    Financial Intelligence
  </div>

  <h2
    style={{
      margin: 0,
      color: "white",
      fontSize: isMobile ? "26px" : "32px",
      fontWeight: "950",
    }}
  >
    Cost Control & Profit Recovery
  </h2>

  <p
    style={{
      marginTop: "10px",
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.7,
      maxWidth: "760px",
    }}
  >
    Track prime cost, food cost variance, invoice mismatches, usage drift, and
    recoverable profit opportunities using AI-powered financial intelligence.
  </p>
</div>
    {/* PRIME COST BREAKDOWN */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(15,23,42,0.92))",
    border: "1px solid rgba(74,222,128,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#86efac",
      marginBottom: "14px",
    }}
  >
    Prime Cost Breakdown
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Food Cost %"
      value={
        effectiveFoodCostPercent > 0
          ? `${Number(effectiveFoodCostPercent).toFixed(1)}%`
          : "Needs cost data"
      }
      subtext="COGS as a percentage of revenue"
    />

    <GlassCard
      title="Labor Cost %"
      value={
        effectiveLaborCostPercent > 0
          ? `${Number(effectiveLaborCostPercent).toFixed(1)}%`
          : "Needs labor data"
      }
      subtext="Labor cost as a percentage of revenue"
    />

    <GlassCard
      title="Controllable Cost"
      value={
        livePrimeCost > 0
          ? `${Number(livePrimeCost).toFixed(1)}%`
          : "Waiting for data"
      }
      subtext="Food cost plus labor cost"
    />

    <GlassCard
      title="AI Recovery Opportunity"
      value={`$${Number(estimatedRecoverableProfit || 0).toLocaleString()}`}
      subtext={
        estimatedRecoverableProfit > 0
          ? "Estimated monthly recovery opportunity"
          : "No recovery opportunity detected yet"
      }
    />
  </div>
</div>

{/* VENDOR INVOICE MATCHING INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(67,56,202,0.16))",
    border: "1px solid rgba(129,140,248,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#a5b4fc",
      marginBottom: "14px",
    }}
  >
    Vendor Invoice Matching Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Invoice Match Rate"
      value={
        vendorInvoiceData.length > 0
          ? `${Number(invoiceMatchRate || 0).toFixed(1)}%`
          : "Needs invoices"
      }
      subtext="Invoices matching expected cost range"
    />

    <GlassCard
      title="Mismatches"
      value={invoiceMismatchItems.length}
      subtext="Invoices outside expected range"
    />

    <GlassCard
      title="Review Items"
      value={invoiceReviewItems.length}
      subtext="Vendor costs requiring review"
    />

    <GlassCard
      title="Invoices Checked"
      value={vendorInvoiceData.length}
      subtext="Vendor records analyzed"
    />
  </div>
</div> 

{/* 🧾 VENDOR COST INTELLIGENCE */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "20px",
      borderRadius: "22px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
      border: "1px solid rgba(251,191,36,0.18)",
    }}
  >
    <div
      style={{
        color: "#facc15",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      Vendor Cost Intelligence
    </div>

    <h3 style={{ color: "white", margin: "0 0 10px", fontSize: "22px" }}>
      Supplier Price Spike Detection
    </h3>

    <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
      Tracks invoice costs by vendor and ingredient to detect rising supplier
      prices before they erode menu margins.
    </p>
{(!vendorCostInsights || vendorCostInsights.length === 0) && (
  <div
    style={{
      padding: "14px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
    }}
  >
    No vendor invoice trends yet. Upload invoice data with vendor, ingredient,
    and unit cost fields to activate supplier price spike detection.
  </div>
)}
    <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
      {(vendorCostInsights || []).slice(0, 8).map((item, index) => (
        <div
          key={`${item.vendor}-${item.ingredient}-${index}`}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 1fr",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {item.vendor}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>
              {item.ingredient}
            </div>
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px" }}>
              Avg Cost
            </div>
            <div style={{ color: "white", fontWeight: "800" }}>
              ${Number(item.avgCost || 0).toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px" }}>
              Latest
            </div>
            <div style={{ color: "white", fontWeight: "800" }}>
              ${Number(item.latestCost || 0).toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px" }}>
              Change
            </div>
            <div
              style={{
                color:
                  Number(item.increasePercent || 0) > 20
                    ? "#f87171"
                    : Number(item.increasePercent || 0) > 10
                    ? "#facc15"
                    : "#22c55e",
                fontWeight: "950",
              }}
            >
              {Number(item.increasePercent || 0).toFixed(1)}%
            </div>
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px" }}>Status</div>
            <div
              style={{
                color:
                  item.status === "Critical Increase"
                    ? "#f87171"
                    : item.status === "Rising Costs"
                    ? "#facc15"
                    : "#22c55e",
                fontWeight: "900",
              }}
            >
              {item.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
  </div>
)}
{activeTab === "inventory" && (
  <>
  <div
  style={{
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",

    display: "grid",

    gap: isMobile ? "14px" : "20px",
  }}
>
  {[
    { id: "overview", label: "Overview" },
    { id: "usage", label: "Usage & Waste" },
    { id: "restock", label: "Restock" },
    { id: "vendors", label: "Vendors" },
    { id: "alcohol", label: "Alcohol" },
  ].map((tab) => (
    <button
      key={tab.id}
      type="button"
      onClick={() => setInventoryView(tab.id)}
      style={{
        padding: "9px 12px",
        borderRadius: "999px",
        border:
          inventoryView === tab.id
            ? "1px solid rgba(34,197,94,0.35)"
            : "1px solid rgba(148,163,184,0.18)",
        background:
          inventoryView === tab.id
            ? "linear-gradient(135deg, #22c55e, #16a34a)"
            : "rgba(255,255,255,0.04)",
        color: "white",
        fontSize: "12px",
        fontWeight: "900",
        cursor: "pointer",
      }}
    >
      {tab.label}
    </button>
  ))}
</div>
   {/* 🧠 INVENTORY AI SUMMARY BAR */}
{(() => {
  const summaryTone = getInventorySummaryTone(
    inventoryAISummary?.criticalCount || 0
  );

  const criticalInventoryAlerts = inventoryAlerts.filter(
    (alert) => alert.type === "critical" && alert.suggestedQuantity > 0
  );

  return (
    <>
      <div
        style={{
          padding: "18px 20px",
          borderRadius: "20px",
          background: summaryTone.bg,
          border: summaryTone.border,
          marginBottom: "20px",
        }}
      >
        <div style={{ color: "#fbbf24", fontWeight: "900", fontSize: "12px" }}>
          Inventory AI Summary
        </div>

        <div
          style={{
            color: summaryTone.labelColor,
            fontWeight: "900",
            fontSize: "11px",
            marginTop: "4px",
          }}
        >
          {summaryTone.tag}
        </div>

        <div
          style={{
            color: "white",
            fontSize: "20px",
            fontWeight: "950",
            marginTop: "6px",
          }}
        >
          {inventoryAISummary?.message || "Inventory is being reviewed."}
        </div>

        <div
          style={{
            color: "#94a3b8",
            fontSize: "13px",
            marginTop: "6px",
          }}
        >
          Estimated weekly risk: $
          {Number(inventoryAISummary?.estimatedRisk || 0).toLocaleString()}
        </div>

        <div
          style={{
            color: "#fca5a5",
            fontSize: "13px",
            marginTop: "6px",
            fontWeight: "900",
          }}
        >
          Potential revenue impact: $
          {Number(
            inventoryAISummary?.potentialRevenueLoss || 0
          ).toLocaleString()}
        </div>

        <div
          style={{
            marginTop: "10px",
            padding: "10px 12px",
            borderRadius: "12px",
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.18)",
            color: "#86efac",
            fontSize: "13px",
            fontWeight: "900",
          }}
        >
          👉 {inventoryAISummary?.recommendation || "Review inventory alerts."}
        </div>
<div
  style={{
    marginTop: "10px",
    fontSize: "13px",
    fontWeight: "900",
    color: "#86efac",
  }}
>
  💰 Inventory profit recovered: $
  {inventoryProfitRecovered.toLocaleString()}
</div>
        {criticalInventoryAlerts.length > 0 && (
          <button
  type="button"
  onClick={async () => {
    if (!combinedInventoryAlerts.length) {
      setMessage("No inventory or usage issues to fix");
      return;
    }

    const topCriticalAlerts = combinedInventoryAlerts
      .filter((alert) => alert.type === "critical")
      .slice(0, 3);

    if (!topCriticalAlerts.length) {
      setMessage("No critical inventory or usage issues to fix");
      return;
    }

    for (const alert of topCriticalAlerts) {
      const isRestockAlert =
  alert.ingredientName &&
  Number(alert.suggestedQuantity || 0) > 0 &&
  !alert.shiftName &&
  !alert.title?.toLowerCase?.().includes("waste");

      if (isRestockAlert) {
        await handleAutoRestockFromAlert(alert);
      } else {
        console.log(
  alert.shiftName
    ? "Shift waste issue flagged:"
    : "Usage issue flagged:",
  alert.shiftName || alert.title
);
      }
    }

    setMessage(
      `Auto checked ${topCriticalAlerts.length} critical inventory/usage issue${
        topCriticalAlerts.length === 1 ? "" : "s"
      }`
    );
  }}
  style={{
    marginTop: "10px",
    padding: "9px 12px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "12px",
  }}
>
  Auto Fix Top Inventory / Usage Issue
</button>
        )}

        {/* ACTION BUTTONS */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "12px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              quickRestockRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }
            style={{
              padding: "9px 12px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white",
              fontWeight: "900",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Go to Restock
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            style={{
              padding: "9px 12px",
              borderRadius: "12px",
              border: "1px solid rgba(148,163,184,0.2)",
              background: "rgba(255,255,255,0.04)",
              color: "#e2e8f0",
              fontWeight: "900",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Review Inventory
          </button>

          <button
            type="button"
            onClick={() => setInventoryAutopilotEnabled((prev) => !prev)}
            style={{
              padding: "9px 12px",
              borderRadius: "12px",
              border: inventoryAutopilotEnabled
                ? "1px solid rgba(34,197,94,0.35)"
                : "1px solid rgba(148,163,184,0.2)",
              background: inventoryAutopilotEnabled
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : "rgba(255,255,255,0.04)",
              color: "white",
              fontWeight: "900",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            {inventoryAutopilotEnabled
              ? "Inventory Autopilot On"
              : "Turn On Inventory Autopilot"}
          </button>
        </div>

        <div
          style={{
            marginTop: "12px",
            color: inventoryAutopilotEnabled ? "#86efac" : "#94a3b8",
            fontSize: "12px",
            fontWeight: "800",
          }}
        >
          {inventoryAutopilotEnabled ? "🟢 " : "⚪ "}
          {inventoryAutopilotStatus}
        </div>
      </div>

      {inventoryAutopilotActivity.length > 0 && (
        <div
          style={{
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.18)",
            marginBottom: "20px",
          }}
        >
          <div style={{ color: "#86efac", fontSize: "12px", fontWeight: "900" }}>
            Autopilot Activity
          </div>

          <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
            {inventoryAutopilotActivity.map((activity) => (
              <div
                key={activity.id}
                style={{
                  padding: "10px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(148,163,184,0.12)",
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontWeight: "900",
                    fontSize: "13px",
                  }}
                >
                  {activity.message}
                </div>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "11px",
                    marginTop: "4px",
                  }}
                >
                  {activity.impact} ·{" "}
                  {activity.createdAt instanceof Date
                    ? activity.createdAt.toLocaleTimeString()
                    : new Date(activity.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* INVENTORY DEPLETION INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(22,101,52,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(74,222,128,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#86efac",
      marginBottom: "14px",
    }}
  >
    Inventory Depletion Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Critical Items"
      value={criticalInventoryItems.length}
      subtext="Items projected to run out within 2 days"
    />

    <GlassCard
      title="Low Stock Items"
      value={lowInventoryItems.length}
      subtext="Items projected to run low within 5 days"
    />

    <GlassCard
      title="Items Tracked"
      value={inventoryDepletionData.length}
      subtext="Ingredients monitored by AI"
    />

    <GlassCard
      title="Inventory Risk"
      value={
        criticalInventoryItems.length > 0
          ? "Critical"
          : lowInventoryItems.length > 0
          ? "Watch"
          : inventoryDepletionData.length > 0
          ? "Healthy"
          : "Needs data"
      }
      subtext="AI depletion risk rating"
    />
  </div>
</div>
{/* INVENTORY DEPLETION DETAIL LIST */}
<div
  style={{
    marginTop: "16px",
    marginBottom: "26px",
    padding: "18px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(20,83,45,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(74,222,128,0.14)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#86efac",
      marginBottom: "12px",
    }}
  >
    AI Restock Watchlist
  </div>

  <div style={{ display: "grid", gap: "12px" }}>
    {inventoryDepletionData.length > 0 ? (
      inventoryDepletionData.slice(0, 6).map((item, index) => (
        <div
          key={`${item.name || item.ingredient || index}`}
          style={{
            padding: "14px 16px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
            display: "flex",
            justifyContent: "space-between",
            gap: "14px",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {item.name || item.ingredient || item.item_name || "Unknown Item"}
            </div>

            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Qty: {Number(item.quantity || 0).toFixed(1)} • Daily usage:{" "}
              {Number(item.usageRate || 0).toFixed(1)}
            </div>
          </div>

          <div
            style={{
              color:
                item.depletionStatus === "Critical"
                  ? "#f87171"
                  : item.depletionStatus === "Low"
                  ? "#fbbf24"
                  : "#86efac",
              fontWeight: "900",
              fontSize: "13px",
              textAlign: "right",
            }}
          >
            {item.daysRemaining > 0
              ? `${item.daysRemaining} days`
              : "Needs usage"}
            <div style={{ fontSize: "11px", marginTop: "4px" }}>
              {item.depletionStatus}
            </div>
          </div>
        </div>
      ))
    ) : (
      <div
        style={{
          padding: "14px 16px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
          color: "#cbd5e1",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        Upload ingredient inventory with quantity and daily usage to activate
        depletion forecasting.
      </div>
    )}
  </div>
</div>

    </>

  );
})()}




{/* 🧠 SMART INVENTORY ALERTS */}
{inventoryAlerts.length > 0 && (
  <div
    style={{
      marginBottom: "20px",
      padding: "16px",
      borderRadius: "18px",
      background:
        "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(15,23,42,0.92))",
      border: "1px solid rgba(239,68,68,0.25)",
    }}
  >
    <div style={{ color: "#fca5a5", fontWeight: "900", fontSize: "12px" }}>
      Smart Inventory Alerts
    </div>

    <div
      style={{
        color: "white",
        fontWeight: "900",
        fontSize: "18px",
        marginTop: "6px",
      }}
    >
      Immediate attention needed
    </div>

    <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
     {combinedInventoryAlerts.map((alert, index) => {
  const tone = getInventoryAlertTone(alert.type);

  return (
   <div
  key={index}
  style={{
    padding: "10px",
    borderRadius: "12px",
    background: tone.bg,
    border: tone.border,
    color: tone.color,
    fontSize: "13px",
    fontWeight: "800",
    boxShadow: tone.shadow, // 👈 THIS is the new part
    animation: alert.type === "critical" ? "criticalPulse 1.8s ease-in-out infinite" : "none",
  }}
>
    
     <div
  style={{
    fontSize: "10px",
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: "4px",
    opacity: 0.85,
  }}
>
  {tone.icon} {tone.label}
</div>

      <div>{alert.message}</div>

      {alert.suggestion && (
        <div
          style={{
            color: "#fde68a",
            fontSize: "12px",
            marginTop: "4px",
            fontWeight: "900",
          }}
        >
          {alert.suggestion}
        </div>
      )}

      {alert.suggestedQuantity > 0 && (
        <button
          type="button"
          onClick={() => handleAutoRestockFromAlert(alert)}
          style={{
            marginTop: "8px",
            padding: "8px 10px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "white",
            fontWeight: "900",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Restock Now
        </button>
      )}

      {alert.ingredientName && (
        <>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/inventory-alert-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ownerEmail: "antoinemiller@servenai.com",
                  restaurantName: selectedClient?.client_name || "Restaurant",
                  ingredientName: alert.ingredientName,
                  message: alert.message,
                  suggestion: alert.suggestion,
                }),
              });

              setMessage("Inventory alert email sent");
            }}
            style={{
              marginTop: "8px",
              marginLeft: "8px",
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid rgba(239,68,68,0.25)",
              background: "rgba(239,68,68,0.12)",
              color: "#fca5a5",
              fontWeight: "900",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Send Alert Email
          </button>

          <div
            style={{
              marginTop: "6px",
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            Auto-email sends once per ingredient per day.
          </div>
        </>
      )}
    </div>
  );
})}
    </div>
  </div>
)}




  </>
)}
{activeTab === "operations" && (
  <div
  style={{
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",

    display: "grid",

    gap: isMobile ? "14px" : "20px",
  }}
>
    
    {/* EXPECTED VS ACTUAL USAGE */}
<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(245,158,11,0.22)",
  }}
>
  <div style={{ color: "#fbbf24", fontSize: "12px", fontWeight: "900" }}>
    EXPECTED VS ACTUAL USAGE
  </div>

  <h3 style={{ color: "white", fontSize: "22px", fontWeight: "950" }}>
    Ingredient Usage Variance
  </h3>

  {expectedVsActualUsageData.length === 0 ? (
    <div style={{ color: "#94a3b8", fontSize: "14px" }}>
      Add recipe usage rules to compare expected ingredient usage against actual usage.
    </div>
  ) : (
    <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
      {expectedVsActualUsageData.slice(0, 6).map((item, index) => (
        <div
          key={index}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border:
              item.status === "Variance Detected"
                ? "1px solid rgba(239,68,68,0.28)"
                : "1px solid rgba(34,197,94,0.20)",
          }}
        >
          <div style={{ color: "white", fontWeight: "900" }}>
            {item.ingredient}
          </div>

          <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>
            Menu Item: {item.menuItem}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            <div style={{ color: "#cbd5e1", fontSize: "12px" }}>
              Sold: <strong>{item.totalSold}</strong>
            </div>

            <div style={{ color: "#cbd5e1", fontSize: "12px" }}>
              Expected: <strong>{item.expectedUsage.toFixed(2)}</strong>
            </div>

            <div style={{ color: "#cbd5e1", fontSize: "12px" }}>
              Actual: <strong>{item.actualUsage.toFixed(2)}</strong>
            </div>

            <div
              style={{
                color:
                  item.status === "Variance Detected" ? "#fca5a5" : "#86efac",
                fontSize: "12px",
                fontWeight: "900",
              }}
            >
              {item.variancePercent.toFixed(1)}% • {item.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
{/* PREDICTIVE OPERATIONAL ALERTS */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(127,29,29,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(248,113,113,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#fca5a5",
      marginBottom: "14px",
    }}
  >
    Predictive Operational Alerts
  </div>

  <div style={{ display: "grid", gap: "12px" }}>
    {predictiveAlerts.length > 0 ? (
      predictiveAlerts.map((alert, index) => (
        <div
          key={`${alert.title}-${index}`}
          style={{
            padding: "14px 16px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              color:
                alert.type === "critical"
                  ? "#f87171"
                  : alert.type === "warning"
                  ? "#fbbf24"
                  : "#86efac",
              fontWeight: "900",
              marginBottom: "6px",
            }}
          >
            {alert.title}
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            {alert.message}
          </div>
        </div>
      ))
    ) : (
      <div
        style={{
          padding: "14px 16px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
          color: "#cbd5e1",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        No predictive risks detected yet. Upload more POS, labor, invoice, and
        inventory data to improve alert accuracy.
      </div>
    )}
  </div>
</div>
{/* 💸 WASTE RECOVERY INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(5,150,105,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(34,197,94,0.18)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#86efac",
      marginBottom: "14px",
    }}
  >
    Waste Recovery Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Estimated Waste Recovery"
      value={`$${Number(
        estimatedWasteRecovery ||
          totalWasteLoss ||
          Math.abs(
            expectedVsActualUsageData?.reduce(
              (sum, item) =>
                sum +
                (item.status === "Variance Detected"
                  ? Number(item.variance || 0) * 5
                  : 0),
              0
            ) || 0
          )
      ).toLocaleString()}`}
      subtext="Estimated recoverable monthly waste"
      featured
    />

    <GlassCard
      title="High Variance Items"
      value={
        expectedVsActualUsageData?.filter(
          (item) => item.status === "Variance Detected"
        ).length || 0
      }
      subtext="Ingredients outside expected tolerance"
    />

    <GlassCard
      title="Waste Risk Level"
      value={
        expectedVsActualUsageData?.some(
          (item) => Math.abs(Number(item.variancePercent || 0)) > 15
        )
          ? "High"
          : expectedVsActualUsageData?.some(
              (item) => Math.abs(Number(item.variancePercent || 0)) > 5
            )
          ? "Moderate"
          : "Controlled"
      }
      subtext="AI risk based on usage variance"
    />

    <GlassCard
      title="Recovery Confidence"
      value={
        expectedVsActualUsageData?.length >= 5
          ? "High"
          : expectedVsActualUsageData?.length >= 2
          ? "Medium"
          : "Needs Data"
      }
      subtext="Based on recipe and inventory coverage"
    />
  </div>

  <div
    style={{
      marginTop: "16px",
      padding: "14px 16px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(148,163,184,0.12)",
      color: "#cbd5e1",
      fontSize: "14px",
      lineHeight: 1.7,
    }}
  >
    {expectedVsActualUsageData?.some(
      (item) => item.status === "Variance Detected"
    )
      ? "SerVen detected ingredient usage variance that may indicate waste, over-portioning, prep loss, theft risk, or recipe inconsistency."
      : "No major waste recovery opportunities detected yet. Add more recipe rules, ingredient usage data, and invoices to improve detection accuracy."}
  </div>
</div>
{/* 🍽 RECIPE RULE MANAGER */}
<div
  style={{
    marginTop: "18px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(91,33,182,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(167,139,250,0.18)",
  }}
>
  <div
    style={{
      color: "#c4b5fd",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    Recipe Rule Manager
  </div>

  <div
    style={{
      fontSize: "22px",
      fontWeight: "900",
      color: "white",
      marginBottom: "10px",
    }}
  >
    Recipe Usage Intelligence
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.6,
      marginBottom: "18px",
    }}
  >
    Connect menu items to ingredient depletion to power expected vs actual usage analytics.
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(4, minmax(0, 1fr))",
      gap: "12px",
    }}
  >
    <input
      value={recipeMenuItem}
      onChange={(e) => setRecipeMenuItem(e.target.value)}
      placeholder="Menu Item"
      style={inputStyle}
    />

    <input
      value={recipeIngredient}
      onChange={(e) => setRecipeIngredient(e.target.value)}
      placeholder="Ingredient"
      style={inputStyle}
    />

    <input
      type="number"
      value={recipeQuantityUsed}
      onChange={(e) => setRecipeQuantityUsed(e.target.value)}
      placeholder="Qty Used"
      style={inputStyle}
    />

    <input
      type="number"
      value={recipeTolerance}
      onChange={(e) => setRecipeTolerance(e.target.value)}
      placeholder="Tolerance %"
      style={inputStyle}
    />
  </div>

  <button
    onClick={saveRecipeRule}
    style={{
      marginTop: "16px",
      padding: "12px 18px",
      borderRadius: "14px",
      border: "none",
      background: "#8b5cf6",
      color: "white",
      fontWeight: "900",
      cursor: "pointer",
    }}
  >
    Save Recipe Rule
  </button>
  <div style={{ marginTop: "18px", display: "grid", gap: "10px" }}>
  {(recipeUsageRules || []).length === 0 ? (
    <div style={{ color: "#94a3b8", fontSize: "13px" }}>
      No recipe rules saved yet.
    </div>
  ) : (
    recipeUsageRules.map((rule) => (
      <div
        key={rule.id}
        style={{
          padding: "12px",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
          color: "#e2e8f0",
          fontSize: "13px",
        }}
      >
        <strong style={{ color: "white" }}>{rule.menu_item}</strong> uses{" "}
        <strong style={{ color: "#c4b5fd" }}>{rule.quantity_used}</strong>{" "}
        {rule.unit || "unit"} of{" "}
        <strong style={{ color: "white" }}>{rule.ingredient}</strong>
        <div style={{ color: "#94a3b8", marginTop: "4px" }}>
          Tolerance: {Number(rule.variance_tolerance || 5)}%
        </div>
      </div>
    ))
  )}
</div>
</div>
{hasGrowthAccess && (
  <>
{/* 💰 PRIME COST INTELLIGENCE */}
<div
  style={{
    display: "grid",
    gridTemplateColumns:
      typeof window !== "undefined" && window.innerWidth < 768
        ? "1fr"
        : "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginTop: "18px",
  }}
>
  <GlassCard
    title="Prime Cost %"
    value={`${primeCostPercentage.toFixed(1)}%`}
    subtext="Food cost + labor cost combined"
    featured={primeCostPercentage > 65}
  />

  <GlassCard
    title="Prime Cost Status"
    value={primeCostStatus}
    subtext={primeCostInsight}
  />

  <GlassCard
    title="Food Cost %"
    value={`${Number(foodCostPercentage || 0).toFixed(1)}%`}
    subtext="Ingredient and inventory efficiency"
  />

  <GlassCard
    title="Labor Cost %"
    value={`${Number(
      liveLaborIntelligence?.laborPercent || 0
    ).toFixed(1)}%`}
    subtext="Staffing efficiency against revenue"
  />
</div>
{/* ACTUAL VS EXPECTED USAGE INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(120,53,15,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(251,191,36,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#fbbf24",
      marginBottom: "14px",
    }}
  >
    Actual vs Expected Usage Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Expected Usage"
      value={`$${Number(expectedUsageValue || 0).toLocaleString()}`}
      subtext="Projected cost based on current data"
    />

    <GlassCard
      title="Actual Usage"
      value={`$${Number(actualUsageValue || 0).toLocaleString()}`}
      subtext="Detected cost from current data"
    />

    <GlassCard
      title="Usage Variance"
      value={`${Number(operationalUsageVariancePercent || 0).toFixed(1)}%`}
      subtext={operationalUsageVarianceStatus}
    />

    <GlassCard
      title="Waste Risk"
      value={operationalUsageVarianceStatus}
      subtext={operationalUsageVarianceInsight}
    />
  </div>
</div>
</>
)}
{hasGrowthAccess ? (
  <>
{/* 👥 LABOR EFFICIENCY INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(148,163,184,0.18)",
  }}
>
  <div
    style={{
      fontSize: "18px",
      fontWeight: "900",
      color: "white",
      marginBottom: "6px",
    }}
  >
    Daily Labor Efficiency
  </div>

  <div
    style={{
      fontSize: "13px",
      color: "#94a3b8",
      marginBottom: "14px",
    }}
  >
    Compares labor cost against revenue by day so clients can see where they were overstaffed or understaffed.
  </div>

  {dailyLaborEfficiency.length === 0 ? (
    <div style={{ color: "#94a3b8", fontSize: "14px" }}>
      Upload labor and POS sales data to unlock daily labor analysis.
    </div>
  ) : (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          color: "white",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr style={{ color: "#94a3b8", textAlign: "left" }}>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Date
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Revenue
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Labor Cost
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Labor %
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Status
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              AI Recommendation
            </th>
          </tr>
        </thead>

        <tbody>
          {dailyLaborEfficiency.map((day) => (
            <tr key={day.date}>
              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                {day.label}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                ${Number(day.revenue || 0).toLocaleString()}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                ${Number(day.laborCost || 0).toLocaleString()}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                {day.laborPercent ? `${day.laborPercent.toFixed(1)}%` : "N/A"}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: "999px",
                    fontWeight: "800",
                    fontSize: "12px",
                    background:
                      day.status === "Overstaffed"
                        ? "rgba(239,68,68,0.16)"
                        : day.status === "Watch Closely"
                        ? "rgba(245,158,11,0.16)"
                        : day.status === "Possibly Understaffed"
                        ? "rgba(59,130,246,0.16)"
                        : day.status === "Healthy"
                        ? "rgba(34,197,94,0.16)"
                        : "rgba(148,163,184,0.14)",
                    color:
                      day.status === "Overstaffed"
                        ? "#fca5a5"
                        : day.status === "Watch Closely"
                        ? "#facc15"
                        : day.status === "Possibly Understaffed"
                        ? "#93c5fd"
                        : day.status === "Healthy"
                        ? "#86efac"
                        : "#cbd5e1",
                  }}
                >
                  {day.status}
                </span>
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                {day.recommendation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
{/* 👥 SHIFT LABOR INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(148,163,184,0.18)",
  }}
>
  <div
    style={{
      color: "#c4b5fd",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    Shift Labor Intelligence
  </div>

  <div
    style={{
      fontSize: "22px",
      fontWeight: "900",
      color: "white",
      marginBottom: "8px",
    }}
  >
    Shift-Level Labor Performance
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.6,
      marginBottom: "16px",
    }}
  >
    AI compares revenue, labor cost, and labor hours by shift to detect
    overstaffed and understaffed periods.
  </div>

  {shiftLaborIntelligence.length === 0 ? (
    <div style={{ color: "#94a3b8", fontSize: "14px" }}>
      Upload labor and sales data with shift or time fields to unlock shift intelligence.
    </div>
  ) : (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          color: "white",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr style={{ color: "#94a3b8", textAlign: "left" }}>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Shift
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Revenue
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Labor Cost
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Labor Hours
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Labor %
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Sales / Labor Hour
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              Status
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
              AI Recommendation
            </th>
          </tr>
        </thead>

        <tbody>
          {shiftLaborIntelligence.map((shift) => (
            <tr key={shift.shift}>
              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                {shift.shift}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                ${Number(shift.revenue || 0).toLocaleString()}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                ${Number(shift.laborCost || 0).toLocaleString()}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                {Number(shift.laborHours || 0).toFixed(1)}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                {shift.revenue > 0 ? `${shift.laborPercent.toFixed(1)}%` : "Needs sales"}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                {shift.revenue > 0 && shift.laborHours > 0
  ? `$${Number(shift.salesPerLaborHour || 0).toLocaleString()}`
  : "Needs sales"}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: "999px",
                    fontWeight: "800",
                    fontSize: "12px",
                    background:
                      shift.status === "Overstaffed"
                        ? "rgba(239,68,68,0.16)"
                        : shift.status === "Watch Closely"
                        ? "rgba(245,158,11,0.16)"
                        : shift.status === "Possibly Understaffed"
                        ? "rgba(59,130,246,0.16)"
                        : shift.status === "Healthy"
                        ? "rgba(34,197,94,0.16)"
                        : "rgba(148,163,184,0.14)",
                    color:
                      shift.status === "Overstaffed"
                        ? "#fca5a5"
                        : shift.status === "Watch Closely"
                        ? "#facc15"
                        : shift.status === "Possibly Understaffed"
                        ? "#93c5fd"
                        : shift.status === "Healthy"
                        ? "#86efac"
                        : "#cbd5e1",
                  }}
                >
                  {shift.status}
                </span>
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                {shift.recommendation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
{/* AI LABOR ACTION RECOMMENDATIONS */}
<div
  style={{
    marginTop: "16px",
    marginBottom: "26px",
    padding: "18px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(2,132,199,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(56,189,248,0.14)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#7dd3fc",
      marginBottom: "12px",
    }}
  >
    AI Labor Recommendation
  </div>

  <div
    style={{
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.7,
      marginBottom: "12px",
    }}
  >
    {laborEfficiencyInsight}
  </div>

  <div
    style={{
      display: "inline-flex",
      padding: "8px 14px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(125,211,252,0.18)",
      color: laborEfficiencyColor,
      fontSize: "12px",
      fontWeight: "900",
    }}
  >
    {laborEfficiencyStatus}
  </div>
</div>
{/* SHIFT PERFORMANCE INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(30,64,175,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(96,165,250,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#93c5fd",
      marginBottom: "14px",
    }}
  >
    Shift Performance Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    {shiftPerformanceArray.length > 0 ? (
      shiftPerformanceArray.map((shift) => (
        <GlassCard
          key={shift.shift}
          title={shift.shift}
          value={`$${Number(shift.revenue || 0).toLocaleString()}`}
          subtext={`${Number(shift.orders || 0).toLocaleString()} orders detected`}
        />
      ))
    ) : (
      <GlassCard
        title="Shift Data"
        value="Needs time data"
        subtext="Upload POS sales with timestamps to detect shift performance"
      />
    )}

    <GlassCard
      title="Top Shift"
      value={topShift?.shift || "Needs data"}
      subtext={
        topShift?.revenue
          ? `$${Number(topShift.revenue || 0).toLocaleString()} detected revenue`
          : "Waiting for timestamped sales"
      }
    />
  </div>
</div>
  </>
) : (
  <div>
    Growth locked card here
  </div>
)}
  </div>
)}
{activeTab === "labor" && (
  
  <div
  style={{
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",

    display: "grid",

    gap: isMobile ? "14px" : "20px",
  }}
>
    {/* LABOR INTELLIGENCE HERO */}
<div
  style={{
    marginBottom: "24px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 30%), linear-gradient(135deg, #111827, #1e293b)",
    border: "1px solid rgba(96,165,250,0.18)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.22)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#93c5fd",
      marginBottom: "8px",
    }}
  >
    Labor Intelligence
  </div>

  <h2
    style={{
      margin: 0,
      color: "white",
      fontSize: isMobile ? "26px" : "32px",
      fontWeight: "950",
    }}
  >
    Workforce Performance & Labor Optimization
  </h2>

  <p
    style={{
      marginTop: "10px",
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.7,
      maxWidth: "760px",
    }}
  >
    Monitor labor efficiency, staffing performance, shift profitability,
    overtime risk, and AI-driven workforce optimization opportunities using
    operational intelligence.
  </p>
</div>
    {/* LABOR EFFICIENCY INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(15,23,42,0.92))",
    border: "1px solid rgba(56,189,248,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#67e8f9",
      marginBottom: "14px",
    }}
  >
    Labor Efficiency Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Sales Per Labor Hour"
      value={
        salesPerLaborHour > 0
          ? `$${Number(salesPerLaborHour).toFixed(2)}`
          : "Needs labor hours"
      }
      subtext="Revenue generated per labor hour"
    />

    <GlassCard
      title="Labor Efficiency Score"
      value={
        laborEfficiencyScore > 0
          ? `${laborEfficiencyScore}/100`
          : "Waiting for data"
      }
      subtext={laborEfficiencyInsight}
    />

    <GlassCard
      title="Labor Status"
      value={laborEfficiencyStatus}
      subtext="AI productivity rating"
    />

    <GlassCard
      title="Labor Hours"
      value={
        totalLaborHours > 0
          ? `${Number(totalLaborHours).toFixed(1)} hrs`
          : "Needs upload"
      }
      subtext="Total labor hours detected"
    />
  </div>
</div>
{/* LABOR KPI STRIP */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "26px",
  }}
>
  <GlassCard
    title="Labor Cost %"
    value={
      effectiveLaborCostPercent > 0
        ? `${Number(effectiveLaborCostPercent).toFixed(1)}%`
        : "Needs labor data"
    }
    subtext="Labor as a percentage of revenue"
  />

  <GlassCard
    title="Sales Per Labor Hour"
    value={
      salesPerLaborHour > 0
        ? `$${Number(salesPerLaborHour).toFixed(2)}`
        : "Needs labor data"
    }
    subtext="Revenue generated per labor hour"
  />
<GlassCard
  title="Top Performing Shift"
  value={topShift?.shift || "Needs shift data"}
  subtext={
    topShift?.revenue
      ? `$${Number(topShift.revenue).toLocaleString()} shift revenue`
      : "Upload shift-level sales"
  }
/>

  <GlassCard
    title="Overstaffing Risk"
    value={laborRiskStatus || "Stable"}
    subtext={laborEfficiencyInsight}
  />
</div>
{/* 👥 SHIFT-LEVEL OPERATIONAL INTELLIGENCE */}
{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "20px",
      borderRadius: "22px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
      border: "1px solid rgba(59,130,246,0.18)",
    }}
  >
    <div
      style={{
        color: "#93c5fd",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      Shift-Level Operational Intelligence
    </div>

    <h3 style={{ color: "white", margin: "0 0 10px", fontSize: "22px" }}>
      Labor Efficiency by Shift
    </h3>

    <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
      Compares shift revenue against labor cost to identify overstaffed shifts,
      inefficient labor periods, and high-performing service windows.
    </p>
    
{/* 📊 SHIFT PERFORMANCE KPI STRIP */}

<div
  style={{
    display: "grid",
   gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "18px",
    marginBottom: "18px",
  }}
>
  {[
    {
      label: "Top Shift",
      value: topShift?.shift || "No Data",
      sub: topShift
        ? `$${Number(topShift.revenue || 0).toFixed(0)} revenue`
        : "waiting for sales data",
    },
    {
      label: "Avg Labor %",
      value: `${
        shiftOperationalData?.length
          ? (
              shiftOperationalData.reduce(
                (sum, shift) => sum + Number(shift.laborPercent || 0),
                0
              ) / shiftOperationalData.length
            ).toFixed(1)
          : "0.0"
      }%`,
      sub: "across tracked shifts",
    },
    {
      label: "Overstaffed Shifts",
      value: shiftOperationalData.filter(
        (shift) => shift.status === "Overstaffed"
      ).length,
      sub: "need scheduling review",
    },
  ].map((metric) => (
    <div
      key={metric.label}
      style={{
        padding: "14px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
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

      <div
        style={{
          color: "#64748b",
          fontSize: "12px",
          marginTop: "4px",
        }}
      >
        {metric.sub}
      </div>
    </div>
  ))}
</div>
    <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
      {(shiftOperationalData || []).map((shift, index) => (
        <div
          key={`${shift.shift}-${index}`}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            gridTemplateColumns: "1fr 0.8fr 0.8fr 0.8fr 1fr",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {shift.shift}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>
              {shift.orders} orders
            </div>
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px" }}>Revenue</div>
            <div style={{ color: "white", fontWeight: "800" }}>
              ${Number(shift.revenue || 0).toFixed(0)}
            </div>
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px" }}>Labor</div>
            <div style={{ color: "white", fontWeight: "800" }}>
              ${Number(shift.laborCost || 0).toFixed(0)}
            </div>
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px" }}>Labor %</div>
            <div
              style={{
                color:
                  Number(shift.laborPercent || 0) > 35
                    ? "#f87171"
                    : Number(shift.laborPercent || 0) > 28
                    ? "#facc15"
                    : "#22c55e",
                fontWeight: "950",
              }}
            >
              {Number(shift.laborPercent || 0).toFixed(1)}%
            </div>
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px" }}>Status</div>
            <div
              style={{
                color:
                  shift.status === "Overstaffed"
                    ? "#f87171"
                    : shift.status === "Watch Closely"
                    ? "#facc15"
                    : "#22c55e",
                fontWeight: "900",
              }}
            >
              {shift.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{/* 🧠 AI STAFFING RECOMMENDATIONS */}
{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "20px",
      borderRadius: "22px",
      background:
        "linear-gradient(135deg, rgba(88,28,135,0.30), rgba(15,23,42,0.94))",
      border: "1px solid rgba(168,85,247,0.22)",
    }}
  >
    <div
      style={{
        color: "#c4b5fd",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      AI Staffing Recommendations
    </div>

    <h3 style={{ color: "white", margin: "0 0 10px", fontSize: "22px" }}>
      Workforce Optimization Actions
    </h3>

    <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
      Converts labor efficiency by shift into recommended staffing actions for
      reducing labor waste and protecting service quality.
    </p>
{(!staffingRecommendations || staffingRecommendations.length === 0) && (
  <div
    style={{
      padding: "14px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
    }}
  >
    No staffing recommendations yet. Upload both sales and labor data to
    activate shift-level workforce optimization.
  </div>
)}
    <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
      {(staffingRecommendations || []).map((item, index) => (
        <div
          key={`${item.shift}-staffing-${index}`}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "8px",
            }}
          >
            <div style={{ color: "white", fontWeight: "900" }}>
              {item.shift}
            </div>

            <div
              style={{
                color:
                  item.priority === "Critical"
                    ? "#f87171"
                    : item.priority === "Watch"
                    ? "#facc15"
                    : item.priority === "Opportunity"
                    ? "#22c55e"
                    : "#94a3b8",
                fontWeight: "900",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {item.priority}
            </div>
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {item.recommendation}
          </div>

          <div
            style={{
              marginTop: "10px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            Labor: {Number(item.laborPercent || 0).toFixed(1)}% · Revenue: $
            {Number(item.revenue || 0).toFixed(0)} · AOV: $
            {Number(item.avgOrderValue || 0).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
</div>
)}

  

{activeTab === "menu" && (
 <div
  style={{
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",

    display: "grid",

    gap: isMobile ? "14px" : "20px",
  }}
>
    {/* MENU INTELLIGENCE HERO */}
<div
  style={{
    marginBottom: "24px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top right, rgba(249,115,22,0.18), transparent 30%), linear-gradient(135deg, #111827, #1e293b)",
    border: "1px solid rgba(251,146,60,0.18)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.22)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#fdba74",
      marginBottom: "8px",
    }}
  >
    Menu Intelligence
  </div>

  <h2
    style={{
      margin: 0,
      color: "white",
      fontSize: isMobile ? "26px" : "32px",
      fontWeight: "950",
    }}
  >
    Menu Performance & Optimization
  </h2>

  <p
    style={{
      marginTop: "10px",
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.7,
      maxWidth: "760px",
    }}
  >
    Analyze menu profitability, pricing opportunities, item performance,
    contribution margins, and AI-driven menu engineering insights to improve
    restaurant profitability.
  </p>
</div>
{/* MENU KPI STRIP */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "26px",
  }}
>
  <GlassCard
    title="Highest Margin Item"
    value={topMarginItem?.name || "Needs menu data"}
    subtext={
      topMarginItem?.margin
        ? `${Number(topMarginItem.margin).toFixed(1)}% margin`
        : "Upload menu pricing and cost"
    }
  />

  <GlassCard
    title="Lowest Margin Item"
    value={lowestMarginItem?.name || "Needs menu data"}
    subtext={
      lowestMarginItem?.margin
        ? `${Number(lowestMarginItem.margin).toFixed(1)}% margin`
        : "Upload menu pricing and cost"
    }
  />

  <GlassCard
    title="Menu Risk Items"
    value={lowMarginMenuItems?.length || 0}
    subtext="Menu items below target profitability"
  />

  <GlassCard
    title="Optimization Opportunity"
    value={`$${Number(menuOptimizationOpportunity || 0).toLocaleString()}`}
    subtext="Estimated recoverable menu profit"
  />
</div>
{/* ========================= */}
{/* 🚨 AI MARGIN RISK DETECTION */}
{/* ========================= */}

{hasProAccess && (
  <div
    style={{
      marginBottom: "18px",
      padding: "16px",
      borderRadius: "18px",
      background:
        "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(15,23,42,0.88))",
      border: "1px solid rgba(239,68,68,0.16)",
    }}
  >
    <div
      style={{
        color: "#fca5a5",
        fontSize: "11px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      AI Margin Risk Detection
    </div>

    {recipeCostingData.filter(
      (item) => Number(item.margin || 0) < 55
    ).length > 0 ? (
      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        {recipeCostingData
          .filter((item) => Number(item.margin || 0) < 55)
          .slice(0, 3)
          .map((item, index) => (
            <div
              key={`${item.itemName}-risk-${index}`}
              style={{
                padding: "12px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  color: "white",
                  fontWeight: "900",
                  marginBottom: "6px",
                }}
              >
                {item.itemName}
              </div>

              <div
                style={{
                  color: "#fca5a5",
                  fontSize: "13px",
                  marginBottom: "6px",
                }}
              >
                Margin risk detected at{" "}
                {Number(item.margin || 0).toFixed(1)}%
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                {item.recommendation}
              </div>
            </div>
          ))}
      </div>
    ) : (
      <div
        style={{
          color: "#22c55e",
          fontWeight: "800",
        }}
      >
        No critical recipe margin risks detected.
      </div>
    )}
  </div>
)}
{hasGrowthAccess ? (
  <>
    {/* MENU ENGINEERING INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(88,28,135,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(216,180,254,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#d8b4fe",
      marginBottom: "14px",
    }}
  >
    Menu Engineering Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Star Items"
      value={starMenuItems.length}
      subtext="High margin, high volume items"
    />

    <GlassCard
      title="Low Performers"
      value={lowPerformingMenuItems.length}
      subtext="Low margin or low volume items"
    />

    <GlassCard
      title="Items Analyzed"
      value={menuEngineeringData.length}
      subtext="Menu items reviewed by AI"
    />

    <GlassCard
      title="Menu Opportunity"
      value={
        lowPerformingMenuItems.length > 0
          ? "Detected"
          : menuEngineeringData.length > 0
          ? "Healthy"
          : "Needs data"
      }
      subtext="AI menu profitability rating"
    />
  </div>
</div>
{/* MENU ENGINEERING DETAIL LIST */}
<div
  style={{
    marginTop: "16px",
    marginBottom: "26px",
    padding: "18px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(76,29,149,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(216,180,254,0.14)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#d8b4fe",
      marginBottom: "12px",
    }}
  >
    AI Menu Opportunity Watchlist
  </div>

  <div style={{ display: "grid", gap: "12px" }}>
    {menuEngineeringData.length > 0 ? (
      menuEngineeringData.slice(0, 6).map((item, index) => (
        <div
          key={`${item.name || item.item_name || index}`}
          style={{
            padding: "14px 16px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
            display: "flex",
            justifyContent: "space-between",
            gap: "14px",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {item.name || item.item_name || "Unknown Item"}
            </div>

            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Sold: {Number(item.quantitySold || 0).toLocaleString()} • Margin:{" "}
              {Number(item.margin || 0).toFixed(1)}%
            </div>
          </div>

          <div
            style={{
              color:
                item.performanceCategory === "Star"
                  ? "#86efac"
                  : item.performanceCategory === "Puzzle"
                  ? "#fbbf24"
                  : item.performanceCategory === "Plowhorse"
                  ? "#93c5fd"
                  : item.performanceCategory === "Dog"
                  ? "#f87171"
                  : "#94a3b8",
              fontWeight: "900",
              fontSize: "13px",
              textAlign: "right",
            }}
          >
            {item.performanceCategory}
            <div style={{ fontSize: "11px", marginTop: "4px" }}>
              ${Number(item.revenue || 0).toLocaleString()}
            </div>
          </div>
        </div>
      ))
    ) : (
      <div
        style={{
          padding: "14px 16px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
          color: "#cbd5e1",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        Upload menu item data with prices, costs, and quantity sold to activate
        menu engineering.
      </div>
    )}
  </div>
</div>
{/* AI MENU COMMENTARY */}
<div
  style={{
    marginTop: "18px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(249,115,22,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(251,146,60,0.18)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#fdba74",
      marginBottom: "12px",
    }}
  >
    AI Menu Intelligence
  </div>

  <div
    style={{
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.8,
    }}
  >
    {menuEngineeringInsight}
  </div>
</div>
{/* 🍽️ UNDERPRICED MENU ITEMS */}
{(
  <div
    style={{
      marginBottom: "26px",
      padding: isMobile ? "20px" : "28px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
      border: "1px solid rgba(148,163,184,0.16)",
      boxShadow: "0 18px 50px rgba(2,6,23,0.22)",
    }}
  >
    <div
      style={{
        color: "#fbbf24",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "10px",
      }}
    >
      Menu Pricing Intelligence
    </div>

    <h3
      style={{
        color: "white",
        fontSize: isMobile ? "24px" : "30px",
        fontWeight: "950",
        margin: "0 0 18px",
      }}
    >
      Highest-impact pricing opportunities
    </h3>

    <div
      style={{
        display: "grid",
        gap: "14px",
      }}
    >
      {topUnderpricedItems.length > 0 ? (
  topUnderpricedItems.map((item) => (
        <div
          key={item.name}
          style={{
            padding: "18px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <div>
              <div
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: "18px",
                  marginBottom: "6px",
                }}
              >
                {item.name}
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "14px",
                  lineHeight: 1.7,
                }}
              >
                Current margin: {item.marginPercent.toFixed(1)}%
              </div>
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderRadius: "14px",
                background: "rgba(251,191,36,0.12)",
                border: "1px solid rgba(251,191,36,0.24)",
                color: "#fbbf24",
                fontWeight: "900",
                fontSize: "14px",
              }}
            >
              +$
              {Number(item.estimatedMonthlyImpact || 0).toLocaleString()}
              /mo
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            {[
              {
                label: "Current Price",
                value: `$${Number(item.price || 0).toFixed(2)}`,
              },

              {
                label: "Estimated Food Cost",
                value: `$${Number(item.cost || 0).toFixed(2)}`,
              },

              {
                label: "Units Sold",
                value: Number(item.quantitySold || 0).toLocaleString(),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "11px",
                    fontWeight: "800",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </div>

                <div
                  style={{
                    color: "white",
                    fontSize: "16px",
                    fontWeight: "900",
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
            ))
) : (
  <div
    style={{
      padding: "18px",
      borderRadius: "18px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#94a3b8",
      lineHeight: 1.7,
      fontSize: "14px",
    }}
  >
    Upload menu items with price, cost, and quantity sold to unlock real
    menu pricing opportunities.
  </div>
)}
    </div>
  </div>
)}
  </>
) : (
  <div
    style={{
      padding: "22px",
      borderRadius: "20px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
      border: "1px solid rgba(148,163,184,0.14)",
      textAlign: "center",
    }}
  >
    <div
      style={{
        color: "#fbbf24",
        fontSize: "12px",
        fontWeight: "900",
        marginBottom: "8px",
      }}
    >
      GROWTH FEATURE
    </div>

    <div
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "900",
        marginBottom: "10px",
      }}
    >
      Unlock Menu Intelligence
    </div>

    <div
      style={{
        color: "#94a3b8",
        fontSize: "14px",
        lineHeight: 1.7,
        maxWidth: "620px",
        margin: "0 auto",
      }}
    >
      Detect low-margin items, underpriced dishes, menu inefficiencies,
      and AI-powered profitability opportunities.
    </div>

    <button
      type="button"
      onClick={() => setActiveTab("pricing")}
      style={{
        marginTop: "16px",
        padding: "12px 16px",
        borderRadius: "14px",
        border: "none",
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
        color: "white",
        fontWeight: "900",
        cursor: "pointer",
      }}
    >
      Upgrade to Growth
    </button>
  </div>
)}
{/* ========================= */}
{/* 📦 EXPECTED VS ACTUAL USAGE INTELLIGENCE */}
{/* ========================= */}

{hasProAccess && (
  <div
    style={{
      marginTop: "18px",
      padding: "20px",
      borderRadius: "22px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
      border: "1px solid rgba(34,197,94,0.18)",
    }}
  >
    <div
      style={{
        color: "#86efac",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      Expected vs Actual Usage
    </div>

    <h3
      style={{
        color: "white",
        margin: "0 0 10px",
        fontSize: "22px",
        fontWeight: "900",
      }}
    >
      Waste & Overportioning Intelligence
    </h3>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        lineHeight: 1.6,
      }}
    >
      Compares expected ingredient usage from recipe rules against actual usage
      to detect waste, overportioning, inventory leakage, or accounting
      mismatches.
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginTop: "18px",
        marginBottom: "18px",
      }}
    >
      {[
        {
          label: "Critical Risks",
          value: usageVarianceData.filter(
            (item) => item.status === "Critical Waste Risk"
          ).length,
          sub: "high variance ingredients",
        },
        {
          label: "Avg Variance",
          value: `${
            usageVarianceData.length
              ? (
                  usageVarianceData.reduce(
                    (sum, item) =>
                      sum + Math.abs(Number(item.variancePercent || 0)),
                    0
                  ) / usageVarianceData.length
                ).toFixed(1)
              : "0.0"
          }%`,
          sub: "across tracked ingredients",
        },
        {
          label: "Controlled Items",
          value: usageVarianceData.filter(
            (item) => item.status === "Controlled"
          ).length,
          sub: "within expected usage",
        },
      ].map((metric) => (
        <div
          key={metric.label}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
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

          <div
            style={{
              color: "#64748b",
              fontSize: "12px",
              marginTop: "4px",
            }}
          >
            {metric.sub}
          </div>
        </div>
      ))}
    </div>

    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      {(usageVarianceData || []).slice(0, 8).map((item, index) => (
        <div
          key={`${item.ingredientName}-${index}`}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr 1fr",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                color: "white",
                fontWeight: "900",
              }}
            >
              {item.ingredientName}
            </div>

            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              {item.linkedRecipeCount} recipe links
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              Expected
            </div>

            <div
              style={{
                color: "white",
                fontWeight: "800",
              }}
            >
              {Number(item.expectedUsage || 0).toFixed(1)}
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              Actual
            </div>

            <div
              style={{
                color: "white",
                fontWeight: "800",
              }}
            >
              {Number(item.actualUsage || 0).toFixed(1)}
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              Variance
            </div>

            <div
              style={{
                color:
                  Number(item.variancePercent || 0) > 8
                    ? "#f87171"
                    : Number(item.variancePercent || 0) > 5
                    ? "#facc15"
                    : "#22c55e",
                fontWeight: "950",
              }}
            >
              {Number(item.variancePercent || 0).toFixed(1)}%
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              Status
            </div>

            <div
              style={{
                color:
                  item.status === "Critical Waste Risk"
                    ? "#f87171"
                    : item.status === "Waste Risk"
                    ? "#fb923c"
                    : item.status === "Minor Variance"
                    ? "#facc15"
                    : "#22c55e",
                fontWeight: "900",
              }}
            >
              {item.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{/* ========================= */}
{/* 🍽️ CROSS-SYSTEM MENU INTELLIGENCE */}
{/* ========================= */}

{hasProAccess ? (
  <div
    style={{
      padding: "20px",
      borderRadius: "22px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
      border: "1px solid rgba(148,163,184,0.16)",
      marginTop: "18px",
    }}
  >
    <div
      style={{
        color: "#a5b4fc",
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      Cross-System Recipe Costing
    </div>

    <h3
      style={{
        color: "white",
        margin: "0 0 10px",
        fontSize: "22px",
        fontWeight: "900",
      }}
    >
      Menu Profitability Intelligence
    </h3>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "13px",
        marginBottom: "18px",
        lineHeight: 1.6,
      }}
    >
      Connects recipe rules, ingredient costs, and menu pricing to calculate
      true profitability intelligence.
    </p>
<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  }}
>
  {[
    {
      label: "Mapped Items",
      value: recipeCostingData.filter((item) => item.ingredientCount > 0).length,
      sub: "items with recipe rules",
    },
    {
      label: "Avg Recipe Margin",
      value: `${
        recipeCostingData.length
          ? (
              recipeCostingData.reduce(
                (sum, item) => sum + Number(item.margin || 0),
                0
              ) / recipeCostingData.length
            ).toFixed(1)
          : "0.0"
      }%`,
      sub: "based on linked costs",
    },
    {
      label: "Low Margin Items",
      value: recipeCostingData.filter((item) => Number(item.margin || 0) < 55)
        .length,
      sub: "need review",
    },
  ].map((metric) => (
    <div
      key={metric.label}
      style={{
        padding: "14px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
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

      <div
        style={{
          color: "#64748b",
          fontSize: "12px",
          marginTop: "4px",
        }}
      >
        {metric.sub}
      </div>
    </div>
  ))}
</div>
    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      {(recipeCostingData || []).slice(0, 10).map((item, index) => (
        <div
          key={`${item.itemName}-${index}`}
          style={{
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            gridTemplateColumns: "1.4fr 0.7fr 0.8fr 0.8fr 1fr",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                color: "white",
                fontWeight: "900",
                marginBottom: "4px",
              }}
            >
              {item.itemName}
            </div>

            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              {item.ingredientCount} linked ingredients
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "11px",
                marginBottom: "4px",
              }}
            >
              Price
            </div>

            <div
              style={{
                color: "white",
                fontWeight: "800",
              }}
            >
              ${Number(item.price || 0).toFixed(2)}
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "11px",
                marginBottom: "4px",
              }}
            >
              Recipe Cost
            </div>

            <div
              style={{
                color: "white",
                fontWeight: "800",
              }}
            >
              ${Number(item.recipeCost || 0).toFixed(2)}
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "11px",
                marginBottom: "4px",
              }}
            >
              Margin
            </div>

            <div
              style={{
                color:
                  Number(item.margin || 0) >= 70
                    ? "#22c55e"
                    : Number(item.margin || 0) >= 60
                    ? "#facc15"
                    : "#f87171",
                fontWeight: "950",
              }}
            >
              {Number(item.margin || 0).toFixed(1)}%
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "11px",
                marginBottom: "4px",
              }}
            >
              Status
            </div>

            <div
              style={{
                color:
                  item.status === "High Profit"
                    ? "#22c55e"
                    : item.status === "Healthy"
                    ? "#facc15"
                    : item.status === "Watch"
                    ? "#fb923c"
                    : "#f87171",
                fontWeight: "900",
              }}
            >
              {item.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
  
) : (
  <div
    style={{
      padding: "24px",
      borderRadius: "24px",
      marginTop: "18px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
      border: "1px solid rgba(168,85,247,0.22)",
      textAlign: "center",
    }}
  >
    <div
      style={{
        display: "inline-flex",
        padding: "7px 12px",
        borderRadius: "999px",
        background: "rgba(168,85,247,0.12)",
        border: "1px solid rgba(168,85,247,0.24)",
        color: "#c4b5fd",
        fontSize: "11px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "16px",
      }}
    >
      Pro AI Feature
    </div>

    <h3
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "950",
        marginBottom: "10px",
      }}
    >
      Unlock Cross-System Menu Intelligence
    </h3>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "14px",
        lineHeight: 1.7,
        maxWidth: "620px",
        margin: "0 auto 18px",
      }}
    >
      Connect invoices, ingredients, recipe rules, and menu pricing to detect
      hidden margin leaks, food cost issues, and real profitability trends.
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginTop: "20px",
      }}
    >
      {[
        "Recipe Cost Intelligence",
        "Live Margin Tracking",
        "Ingredient Cost Linking",
        "Waste Detection",
        "Vendor Cost Monitoring",
        "Profitability Alerts",
      ].map((feature) => (
        <div
          key={feature}
          style={{
            padding: "12px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            fontWeight: "700",
            fontSize: "13px",
          }}
        >
          ⚡ {feature}
        </div>
      ))}
    </div>
  </div>
)}
  </div>
)}

{inventoryView === "usage" && (
  <>
  {hasGrowthAccess ? (
  
  <>
{/* EXPECTED USAGE ENGINE */}
<div
  style={{
    marginTop: "18px",
    padding: "18px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 18px 45px rgba(2,6,23,0.22)",
  }}
>
  <div style={{ color: "#a5b4fc", fontSize: "12px", fontWeight: "900" }}>
    EXPECTED USAGE ENGINE
  </div>

  <h3 style={{ color: "white", margin: "6px 0 8px", fontSize: "22px" }}>
    Waste & Overuse Detection
  </h3>

  <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "16px" }}>
    Compares expected recipe usage from sales against actual food cost to flag
    possible waste, over-portioning, comps, or untracked loss.
  </p>

  {/* AI LOSS PREVENTION SCORE */}
  <div
    style={{
      marginBottom: "18px",
      padding: "18px",
      borderRadius: "18px",
      background:
        aiLossPreventionScore >= 85
          ? "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(15,23,42,0.92))"
          : aiLossPreventionScore >= 70
          ? "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(15,23,42,0.92))"
          : "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(15,23,42,0.92))",
      border:
        aiLossPreventionScore >= 85
          ? "1px solid rgba(34,197,94,0.22)"
          : aiLossPreventionScore >= 70
          ? "1px solid rgba(245,158,11,0.22)"
          : "1px solid rgba(239,68,68,0.22)",
    }}
  >
    <div style={{ color: "#cbd5e1", fontSize: "12px", fontWeight: "900", marginBottom: "8px" }}>
      AI LOSS PREVENTION SCORE
    </div>

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
      <div>
        <div style={{ color: "white", fontSize: "42px", fontWeight: "950", lineHeight: 1 }}>
          {aiLossPreventionScore}
        </div>

        <div
          style={{
            marginTop: "6px",
            color:
              aiLossPreventionScore >= 85
                ? "#86efac"
                : aiLossPreventionScore >= 70
                ? "#fcd34d"
                : "#fca5a5",
            fontWeight: "900",
          }}
        >
          {aiLossPreventionStatus}
        </div>
      </div>

      <div style={{ maxWidth: "420px", color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>
        AI analysis combines food cost variance, ingredient anomalies,
        suspicious menu items, inventory risk, and shift waste behavior
        to estimate operational loss exposure.
      </div>
    </div>
  </div>

  {/* ESTIMATED RECOVERABLE PROFIT */}
  <div
    style={{
      marginBottom: "18px",
      padding: "16px",
      borderRadius: "18px",
      background: "rgba(34,197,94,0.08)",
      border: "1px solid rgba(34,197,94,0.18)",
    }}
  >
    <div style={{ color: "#86efac", fontSize: "12px", fontWeight: "900", marginBottom: "8px" }}>
      ESTIMATED RECOVERABLE PROFIT
    </div>

    <div style={{ color: "white", fontSize: "34px", fontWeight: "950", marginBottom: "6px" }}>
      ${Number(estimatedTotalRecovery || 0).toLocaleString()}/mo
    </div>

    <div style={{ color: "#bbf7d0", fontSize: "13px", fontWeight: "800" }}>
      Projected yearly protection: $
      {Number(yearlyRecoveryProjection || 0).toLocaleString()}
    </div>
  </div>
<div
  style={{
    marginBottom: "18px",
    padding: "14px",
    borderRadius: "16px",
    background: "rgba(59,130,246,0.08)",
    border: "1px solid rgba(59,130,246,0.18)",
  }}
>
  <div
    style={{
      color: "#93c5fd",
      fontSize: "12px",
      fontWeight: "900",
      marginBottom: "8px",
    }}
  >
    AI OPERATIONAL SUMMARY
  </div>

  <div
    style={{
      color: "#dbeafe",
      fontSize: "13px",
      lineHeight: 1.7,
    }}
  >
    {aiOperationalSummary}
  </div>
</div>
{/* TOP AI ACTION */}
<div
  style={{
    marginBottom: "18px",
    padding: "14px",
    borderRadius: "16px",
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.18)",
  }}
>
  <div
    style={{
      color: "#fde68a",
      fontSize: "12px",
      fontWeight: "900",
      marginBottom: "8px",
    }}
  >
    TOP AI RECOMMENDED ACTION
  </div>

  <div
    style={{
      color: "#fef3c7",
      fontSize: "13px",
      lineHeight: 1.7,
      fontWeight: "800",
    }}
  >
    {topAIRecommendedAction}
  </div>
</div>
<div style={{ marginBottom: "18px" }}>
  <div
    style={{
      color: "#f8fafc",
      fontWeight: "900",
      marginBottom: "12px",
      fontSize: "13px",
    }}
  >
    AI RISK BREAKDOWN
  </div>

  <div style={{ display: "grid", gap: "10px" }}>
    {aiRiskBreakdown.map((risk, index) => (
      <div
        key={index}
        style={{
          padding: "12px",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              color: "#e2e8f0",
              fontWeight: "800",
              fontSize: "13px",
            }}
          >
            {risk.label}
          </div>

          <div
            style={{
              color:
                risk.value >= 70
                  ? "#f87171"
                  : risk.value >= 40
                  ? "#fbbf24"
                  : "#4ade80",
              fontWeight: "900",
              fontSize: "12px",
            }}
          >
            {risk.value.toFixed(0)}%
          </div>
        </div>

        <div
          style={{
            height: "8px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${risk.value}%`,
              height: "100%",
              borderRadius: "999px",
              background:
                risk.value >= 70
                  ? "linear-gradient(90deg, #ef4444, #f87171)"
                  : risk.value >= 40
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : "linear-gradient(90deg, #22c55e, #4ade80)",
            }}
          />
        </div>
      </div>
    ))}
  </div>
</div>
{aiDetectedLossSources.length > 0 && (
  <div style={{ marginBottom: "18px" }}>
    <div
      style={{
        color: "#f8fafc",
        fontWeight: "900",
        marginBottom: "12px",
        fontSize: "13px",
      }}
    >
      AI DETECTED LOSS SOURCES
    </div>

    <div style={{ display: "grid", gap: "10px" }}>
      {aiDetectedLossSources.map((source, index) => (
        <div
          key={index}
          style={{
            padding: "12px",
            borderRadius: "14px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.18)",
            color: "#fecaca",
            fontSize: "13px",
            fontWeight: "700",
          }}
        >
          • {source}
        </div>
      ))}
    </div>
  </div>
)}
  {/* KPI GRID */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
      marginBottom: "16px",
    }}
  >
    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Expected Usage Cost</div>
      <div style={miniKpiValue}>
        ${Number(totalExpectedUsageCost || 0).toLocaleString()}
      </div>
    </div>

    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Actual Food Cost</div>
      <div style={miniKpiValue}>
        ${Number(actualFoodCost || 0).toLocaleString()}
      </div>
    </div>

    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Variance</div>
      <div style={{ ...miniKpiValue, color: usageVariance > 0 ? "#f97316" : "#22c55e" }}>
        ${Number(usageVariance || 0).toLocaleString()}
      </div>
    </div>

    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Waste Risk</div>
      <div
        style={{
          ...miniKpiValue,
          color:
            wasteRiskLevel === "High"
              ? "#ef4444"
              : wasteRiskLevel === "Medium"
              ? "#f59e0b"
              : "#22c55e",
        }}
      >
        {wasteRiskLevel}
      </div>
    </div>
  </div>

  {expectedUsageAlerts.length > 0 ? (
    <div style={{ display: "grid", gap: "10px" }}>
      {expectedUsageAlerts.map((alert, index) => (
        <div
          key={index}
          style={{
            padding: "12px",
            borderRadius: "14px",
            background:
              alert.type === "critical"
                ? "rgba(239,68,68,0.12)"
                : "rgba(245,158,11,0.12)",
            border:
              alert.type === "critical"
                ? "1px solid rgba(239,68,68,0.25)"
                : "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <div style={{ color: "white", fontWeight: "900" }}>{alert.title}</div>
          <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "4px" }}>
            {alert.message}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div
      style={{
        padding: "12px",
        borderRadius: "14px",
        background: "rgba(34,197,94,0.10)",
        border: "1px solid rgba(34,197,94,0.20)",
        color: "#bbf7d0",
        fontWeight: "800",
      }}
    >
      Usage looks stable. No major waste variance detected.
    </div>
  )}

  {possibleWasteSignals.length > 0 && (
    <div style={{ marginTop: "16px" }}>
      <div style={{ color: "#fca5a5", fontWeight: "900", marginBottom: "10px" }}>
        Possible Causes
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {possibleWasteSignals.map((signal, index) => (
          <div
            key={index}
            style={{
              padding: "10px 12px",
              borderRadius: "12px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.18)",
              color: "#fecaca",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            • {signal}
          </div>
        ))}
      </div>
    </div>
  )}

  {suspiciousMenuItems.length > 0 && (
    <div style={{ marginTop: "18px" }}>
      <div style={{ color: "#fde68a", fontWeight: "900", marginBottom: "10px" }}>
        High-Risk Menu Items
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {suspiciousMenuItems.map((item, index) => (
          <div
            key={index}
            style={{
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.18)",
            }}
          >
            <div style={{ color: "white", fontWeight: "900", marginBottom: "4px" }}>
              {item.name}
            </div>
            <div style={{ color: "#cbd5e1", fontSize: "13px" }}>
              Margin: {item.margin.toFixed(1)}% • Sold: {item.quantitySold}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {ingredientUsageAnomalies.length > 0 && (
    <div style={{ marginTop: "18px" }}>
      <div style={{ color: "#93c5fd", fontWeight: "900", marginBottom: "10px" }}>
        Ingredient Usage Watchlist
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {ingredientUsageAnomalies.map((item, index) => (
          <div
            key={index}
            style={{
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.18)",
            }}
          >
            <div style={{ color: "white", fontWeight: "900" }}>
              {item.ingredientName}
            </div>

            <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "4px" }}>
              Expected usage: {Number(item.expectedUsage || 0).toFixed(1)}{" "}
              {item.unit || "units"}
            </div>

            {item.linkedMenuItems?.length > 0 && (
              <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
                Linked items: {item.linkedMenuItems.slice(0, 3).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )}

  {shiftWasteAlerts.length > 0 && (
    <div style={{ marginTop: "18px" }}>
      <div style={{ color: "#c4b5fd", fontWeight: "900", marginBottom: "10px" }}>
        Shift Waste Detection
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {shiftWasteAlerts.map((shift, index) => (
          <div
            key={index}
            style={{
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.18)",
            }}
          >
            <div style={{ color: "white", fontWeight: "900" }}>
              {shift.shift}
            </div>

            <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "4px" }}>
              Voids/comps/refunds risk: $
              {Number(shift.riskAmount || 0).toLocaleString()} •{" "}
              {Number(shift.riskPercent || 0).toFixed(1)}% of revenue
            </div>

            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
              Based on {shift.count} flagged transaction group
              {shift.count === 1 ? "" : "s"}.
            </div>

            <div
              style={{
                marginTop: "8px",
                padding: "10px",
                borderRadius: "12px",
                background: "rgba(124,58,237,0.10)",
                border: "1px solid rgba(196,181,253,0.18)",
                color: "#ddd6fe",
                fontSize: "12px",
                fontWeight: "800",
              }}
            >
              Recommended action:{" "}
              {shift.riskPercent >= 5
                ? "Review voids, comps, refunds, and manager approvals for this shift."
                : "Monitor this shift for unusual waste or comp patterns."}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
{/* 📦 INGREDIENT VARIANCE INTELLIGENCE */}
<div
  style={{
    marginTop: "20px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.18)",
  }}
>
  <div
    style={{
      color: "#c4b5fd",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    Ingredient Variance Intelligence
  </div>

  <div
    style={{
      color: "white",
      fontSize: "24px",
      fontWeight: "900",
      marginBottom: "8px",
    }}
  >
    Expected vs Actual Ingredient Usage
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.7,
      marginBottom: "18px",
    }}
  >
    AI compares projected ingredient usage from menu sales against actual
    inventory depletion to detect waste, over-portioning, prep loss,
    and operational variance.
  </div>

  {ingredientVarianceData.length === 0 ? (
    <div
      style={{
        color: "#94a3b8",
        fontSize: "14px",
      }}
    >
      Upload ingredient inventory and recipe rules to unlock variance intelligence.
    </div>
  ) : (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          color: "white",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr style={{ color: "#94a3b8", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>Ingredient</th>
            <th style={{ padding: "10px" }}>Expected</th>
            <th style={{ padding: "10px" }}>Actual</th>
            <th style={{ padding: "10px" }}>Variance</th>
            <th style={{ padding: "10px" }}>Variance %</th>
            <th style={{ padding: "10px" }}>Estimated Loss</th>
            <th style={{ padding: "10px" }}>Status</th>
          </tr>
        </thead>

        <tbody>
          {ingredientVarianceData.map((item, index) => (
            <tr key={index}>
              <td
                style={{
                  padding: "10px",
                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                }}
              >
                {item.ingredientName}
              </td>

              <td
                style={{
                  padding: "10px",
                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                }}
              >
                {item.expectedUsage.toFixed(1)}
              </td>

              <td
                style={{
                  padding: "10px",
                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                }}
              >
                {item.actualUsage.toFixed(1)}
              </td>

              <td
                style={{
                  padding: "10px",
                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                  color: item.variance > 0 ? "#fca5a5" : "#86efac",
                  fontWeight: "800",
                }}
              >
                {item.variance.toFixed(1)}
              </td>

              <td
                style={{
                  padding: "10px",
                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                }}
              >
                {item.variancePercent.toFixed(1)}%
              </td>

              <td
                style={{
                  padding: "10px",
                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                  color: "#fde68a",
                  fontWeight: "800",
                }}
              >
                ${item.estimatedLoss.toFixed(0)}
              </td>

              <td
                style={{
                  padding: "10px",
                  borderBottom: "1px solid rgba(148,163,184,0.1)",
                }}
              >
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: "999px",
                    fontWeight: "800",
                    fontSize: "12px",
                    background:
                      item.status === "Critical Waste Risk"
                        ? "rgba(239,68,68,0.16)"
                        : item.status === "Waste Risk"
                        ? "rgba(245,158,11,0.16)"
                        : item.status === "Minor Variance"
                        ? "rgba(59,130,246,0.16)"
                        : "rgba(34,197,94,0.16)",

                    color:
                      item.status === "Critical Waste Risk"
                        ? "#fca5a5"
                        : item.status === "Waste Risk"
                        ? "#fde68a"
                        : item.status === "Minor Variance"
                        ? "#93c5fd"
                        : "#86efac",
                  }}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
{/* 🚨 AI WASTE CAUSE DETECTION */}
<div
  style={{
    marginTop: "20px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(127,29,29,0.92), rgba(15,23,42,0.96))",
    border: "1px solid rgba(248,113,113,0.18)",
  }}
>
  <div
    style={{
      color: "#fca5a5",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "8px",
    }}
  >
    AI Waste Cause Detection
  </div>

  <div
    style={{
      color: "white",
      fontSize: "24px",
      fontWeight: "900",
      marginBottom: "8px",
    }}
  >
    Operational Loss Detection
  </div>

  <div
    style={{
      color: "#fecaca",
      fontSize: "14px",
      lineHeight: 1.7,
      marginBottom: "18px",
    }}
  >
    AI analyzes ingredient variance patterns to estimate likely operational
    loss causes including over-portioning, prep waste, spoilage,
    theft exposure, and recipe inconsistency.
  </div>

  {aiWasteDetection.length === 0 ? (
    <div
      style={{
        color: "#cbd5e1",
        fontSize: "14px",
      }}
    >
      No major operational waste patterns detected.
    </div>
  ) : (
    <div style={{ display: "grid", gap: "12px" }}>
      {aiWasteDetection.slice(0, 8).map((item, index) => (
        <div
          key={index}
          style={{
            padding: "16px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(248,113,113,0.14)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                color: "white",
                fontWeight: "900",
                fontSize: "16px",
              }}
            >
              {item.ingredientName}
            </div>

            <div
              style={{
                color: "#fca5a5",
                fontWeight: "900",
                fontSize: "14px",
              }}
            >
              {item.variancePercent.toFixed(1)}% variance
            </div>
          </div>

          <div
            style={{
              color: "#fecaca",
              fontSize: "13px",
              fontWeight: "800",
              marginBottom: "8px",
            }}
          >
            Likely Cause: {item.likelyCause}
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {item.recommendation}
          </div>

          <div
            style={{
              marginTop: "10px",
              color: "#fde68a",
              fontWeight: "900",
              fontSize: "13px",
            }}
          >
            Estimated exposure: $
            {Number(item.estimatedLoss || 0).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
{/* 🔄 INVENTORY TURNOVER INTELLIGENCE */}
<div
  style={{
    marginTop: "20px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(20,83,45,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(74,222,128,0.14)",
  }}
>
  <div style={{ color: "#86efac", fontSize: "12px", fontWeight: "900" }}>
    INVENTORY TURNOVER INTELLIGENCE
  </div>

  <h3 style={{ color: "white", margin: "6px 0 8px", fontSize: "22px" }}>
    Ingredient Movement & Overstock Risk
  </h3>

  <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>
    AI reviews ingredient quantity and usage rate to detect slow-moving stock,
    fast-moving items, and potential over-ordering.
  </p>

  <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
    {inventoryTurnoverData.length > 0 ? (
      inventoryTurnoverData.slice(0, 8).map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {item.name}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
              Qty: {Number(item.quantity || 0).toFixed(1)} • Daily usage:{" "}
              {Number(item.usageRate || 0).toFixed(1)}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color:
                  item.status === "Slow Moving"
                    ? "#fbbf24"
                    : item.status === "Fast Moving"
                    ? "#93c5fd"
                    : item.status === "Healthy"
                    ? "#86efac"
                    : "#cbd5e1",
                fontWeight: "900",
              }}
            >
              {item.daysOnHand > 0
                ? `${Number(item.daysOnHand || 0).toFixed(1)} days`
                : "Needs data"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "4px" }}>
              {item.status}
            </div>
          </div>

          <div style={{ width: "100%", color: "#cbd5e1", fontSize: "13px" }}>
            {item.recommendation}
          </div>
        </div>
      ))
    ) : (
      <div style={{ color: "#94a3b8", fontSize: "14px" }}>
        Upload ingredient inventory to unlock turnover intelligence.
      </div>
    )}
  </div>
</div>
{/* 🧊 SHELF LIFE / SPOILAGE FORECASTING */}
<div
  style={{
    marginTop: "20px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(14,116,144,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(103,232,249,0.14)",
  }}
>
  <div style={{ color: "#67e8f9", fontSize: "12px", fontWeight: "900" }}>
    SHELF LIFE / SPOILAGE FORECASTING
  </div>

  <h3 style={{ color: "white", margin: "6px 0 8px", fontSize: "22px" }}>
    Expiration & Prep Waste Risk
  </h3>

  <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>
    AI estimates how close ingredients are to spoilage so restaurants can
    prioritize specials, prep decisions, and restock timing.
  </p>

  <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
    {spoilageForecastData.length > 0 ? (
      spoilageForecastData.slice(0, 8).map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {item.name}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
              Shelf life: {Number(item.shelfLifeDays || 0)} days • Expires:{" "}
              {item.expirationDate
                ? item.expirationDate.toLocaleDateString()
                : "N/A"}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color:
                  item.status === "Expired Risk"
                    ? "#fca5a5"
                    : item.status === "Spoilage Risk"
                    ? "#fde68a"
                    : item.status === "Watch"
                    ? "#93c5fd"
                    : "#86efac",
                fontWeight: "900",
              }}
            >
              {item.daysUntilSpoilage <= 0
                ? "Expired"
                : `${item.daysUntilSpoilage} days`}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "4px" }}>
              {item.status}
            </div>
          </div>

          <div style={{ width: "100%", color: "#cbd5e1", fontSize: "13px" }}>
            {item.recommendation}
          </div>
        </div>
      ))
    ) : (
      <div style={{ color: "#94a3b8", fontSize: "14px" }}>
        Upload ingredient dates or inventory data to unlock spoilage forecasting.
      </div>
    )}
  </div>
</div>
{/* 📈 INVENTORY TREND CHARTS */}
<div
  style={{
    marginTop: "20px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.18)",
  }}
>
  <div style={{ color: "#93c5fd", fontSize: "12px", fontWeight: "900" }}>
    INVENTORY TREND CHARTS
  </div>

  <h3 style={{ color: "white", margin: "6px 0 8px", fontSize: "22px" }}>
    Ingredient Quantity & Usage Trends
  </h3>

  <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>
    Visualizes inventory quantity, usage speed, and value across tracked ingredients.
  </p>

  {inventoryTrendData.length > 0 ? (
    <div style={{ height: "320px", marginTop: "18px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={inventoryTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: "12px",
              color: "white",
            }}
          />
          <Legend />
          <Bar dataKey="quantity" name="Quantity" fill="#22c55e" />
          <Bar dataKey="usageRate" name="Daily Usage" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <div style={{ color: "#94a3b8", fontSize: "14px", marginTop: "14px" }}>
      Upload ingredient data to unlock inventory trend charts.
    </div>
  )}
</div>
  </>
  
) : (
  <div
    style={{
      padding: "22px",
      borderRadius: "20px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
      border: "1px solid rgba(148,163,184,0.14)",
      textAlign: "center",
    }}
  >
    <div
      style={{
        color: "#fbbf24",
        fontSize: "12px",
        fontWeight: "900",
        marginBottom: "8px",
      }}
    >
      GROWTH FEATURE
    </div>

    <div
      style={{
        color: "white",
        fontSize: "24px",
        fontWeight: "900",
        marginBottom: "10px",
      }}
    >
      Unlock Usage & Waste Intelligence
    </div>

    <div
      style={{
        color: "#94a3b8",
        fontSize: "14px",
        lineHeight: 1.7,
        maxWidth: "620px",
        margin: "0 auto",
      }}
    >
      Detect ingredient waste, variance, spoilage risk, operational loss,
      and inventory inefficiencies with AI-powered operational intelligence.
    </div>

    <button
      type="button"
      onClick={() => setActiveTab("pricing")}
      style={{
        marginTop: "16px",
        padding: "12px 16px",
        borderRadius: "14px",
        border: "none",
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
        color: "white",
        fontWeight: "900",
        cursor: "pointer",
      }}
    >
      Upgrade to Growth
    </button>
  </div>
)}
  </>
  )}
  {inventoryView === "restock" && (
  <>

{/* 📦 INVENTORY RESTOCK AWARENESS */}
<div
  style={{
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    marginBottom: "20px",
  }}
>
  {/* INVENTORY FRESHNESS ALERT */}
  {inventoryFreshness !== null && inventoryFreshness >= 2 && (
    <div
      style={{
        marginBottom: "14px",
        padding: "12px",
        borderRadius: "14px",
        background: "rgba(245,158,11,0.12)",
        border: "1px solid rgba(245,158,11,0.25)",
        color: "#fde68a",
        fontSize: "13px",
        fontWeight: "800",
        lineHeight: 1.5,
      }}
    >
      ⚠️ Inventory has not been updated for {inventoryFreshness} days. Restock
      or upload new ingredient data to keep insights accurate.
    </div>
  )}

  <div style={{ color: "#86efac", fontWeight: "900", fontSize: "12px" }}>
    Inventory Restock Awareness
  </div>

  <div
    style={{
      color: "white",
      fontWeight: "900",
      fontSize: "20px",
      marginTop: "6px",
    }}
  >
    Ingredients that may need attention
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
      marginTop: "6px",
      marginBottom: "14px",
    }}
  >
    Track low-stock ingredients, quick restocks, and items that ran out during
    the week.
  </div>

  {/* TOP INVENTORY STATS */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: "10px",
      marginBottom: "14px",
    }}
  >
    <div style={{ padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
      <div style={{ color: "#94a3b8", fontSize: "11px" }}>Critical</div>
      <div style={{ color: "#fca5a5", fontSize: "22px", fontWeight: "900" }}>
        {inventoryRestockContext.criticalItems.length}
      </div>
    </div>

    <div style={{ padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
      <div style={{ color: "#94a3b8", fontSize: "11px" }}>Watch</div>
      <div style={{ color: "#fde68a", fontSize: "22px", fontWeight: "900" }}>
        {inventoryRestockContext.warningItems.length}
      </div>
    </div>

    <div style={{ padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
      <div style={{ color: "#94a3b8", fontSize: "11px" }}>
        Inventory Value
      </div>
      <div style={{ color: "white", fontSize: "22px", fontWeight: "900" }}>
        ${Math.round(inventoryRestockContext.totalInventoryValue).toLocaleString()}
      </div>
    </div>
  </div>

  {/* LOW STOCK LIST */}
  {inventoryRestockContext.lowestStockItems.length ? (
    <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
      {inventoryRestockContext.lowestStockItems.map((item, index) => {
        const color =
          item.status === "critical"
            ? "#fca5a5"
            : item.status === "warning"
            ? "#fde68a"
            : "#86efac";

        return (
          <div
            key={`${item.name}-${index}`}
            style={{
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(148,163,184,0.12)",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ color: "white", fontWeight: "900" }}>
                {item.name}
              </div>

              <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
                Qty: {item.quantity} {item.unit || ""}
              </div>
              {Number(item.usedFromSales || 0) > 0 && (
  <div
    style={{
      color: "#fbbf24",
      fontSize: "11px",
      marginTop: "4px",
      fontWeight: "800",
    }}
  >
    {item.salesUsageNote}
  </div>
)}
            </div>

            <div style={{ color, fontWeight: "900" }}>
              <div style={{ textAlign: "right" }}>
  <div style={{ color, fontWeight: "900" }}>
    {Number(item.daysOnHand || 0).toFixed(1)} days left
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "11px",
      marginTop: "4px",
      fontWeight: "700",
    }}
  >
    Runs out: {item.runOutDate ? item.runOutDate.toLocaleDateString() : "N/A"}
  </div>
  {Number(item.daysOnHand || 0) <= 2 && (
  <div
    style={{
      color: "#fca5a5",
      fontSize: "11px",
      marginTop: "4px",
      fontWeight: "900",
    }}
  >
    ⚠️ AI Alert: Restock soon
  </div>
)}
</div>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>
      Upload ingredient data to calculate days on hand and restock risk.
    </div>
  )}

  {/* QUICK RESTOCK FORM */}
  <div
  ref={quickRestockRef}
    style={{
      padding: "16px",
      borderRadius: "18px",
      background: "rgba(34,197,94,0.08)",
      border: "1px solid rgba(34,197,94,0.16)",
      marginBottom: "14px",
    }}
  >
    <div style={{ color: "#86efac", fontWeight: "900", fontSize: "13px" }}>
      Quick Restock
    </div>

    <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.6, marginTop: "5px", marginBottom: "12px" }}>
      Use this when a restaurant buys more of an ingredient during the week.
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "10px",
      }}
    >
      <select
        value={restockForm?.ingredientName || ""}
        onChange={(e) =>
          setRestockForm((prev) => ({
            ...prev,
            ingredientName: e.target.value,
          }))
        }
        style={{
          padding: "11px 12px",
          borderRadius: "12px",
          background: "rgba(15,23,42,0.9)",
          color: "white",
          border: "1px solid rgba(148,163,184,0.18)",
          outline: "none",
          fontSize: "12px",
          fontWeight: "800",
        }}
      >
        <option value="">Select ingredient</option>
        {(uploadComparison?.activeIngredients || []).map((item, index) => (
          <option key={`${item.name}-${index}`} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>

      <input
        type="number"
        value={restockForm?.quantityAdded || ""}
        onChange={(e) =>
          setRestockForm((prev) => ({
            ...prev,
            quantityAdded: e.target.value,
          }))
        }
        placeholder="Quantity added"
        style={{
          padding: "11px 12px",
          borderRadius: "12px",
          background: "rgba(15,23,42,0.9)",
          color: "white",
          border: "1px solid rgba(148,163,184,0.18)",
          outline: "none",
          fontSize: "12px",
        }}
      />

      <input
        type="number"
        value={restockForm?.costPerUnit || ""}
        onChange={(e) =>
          setRestockForm((prev) => ({
            ...prev,
            costPerUnit: e.target.value,
          }))
        }
        placeholder="Cost per unit"
        style={{
          padding: "11px 12px",
          borderRadius: "12px",
          background: "rgba(15,23,42,0.9)",
          color: "white",
          border: "1px solid rgba(148,163,184,0.18)",
          outline: "none",
          fontSize: "12px",
        }}
      />

      <button
        type="button"
        onClick={handleRestockIngredient}
        style={{
          padding: "11px 14px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "white",
          fontWeight: "900",
          cursor: "pointer",
        }}
      >
        Mark Restocked
      </button>
      <button
  type="button"
  onClick={handleFullyRestocked}
  style={{
    padding: "11px 14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer",
  }}
>
  Fully Restocked
</button>
    </div>
  </div>

  {/* OUT OF STOCK FORM */}
  <div
    style={{
      padding: "16px",
      borderRadius: "18px",
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.16)",
    }}
  >
    <div style={{ color: "#fca5a5", fontWeight: "900", fontSize: "13px" }}>
      Ran Out During Service?
    </div>

    <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.6, marginTop: "5px", marginBottom: "12px" }}>
      Quickly mark an ingredient as out of stock so the dashboard can flag it.
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: "10px",
      }}
    >
      <input
        value={outOfStockIngredient || ""}
        onChange={(e) => setOutOfStockIngredient(e.target.value)}
        placeholder="Type ingredient name"
        style={{
          padding: "11px 12px",
          borderRadius: "12px",
          background: "rgba(15,23,42,0.9)",
          color: "white",
          border: "1px solid rgba(148,163,184,0.18)",
          outline: "none",
          fontSize: "12px",
        }}
      />

      <button
        type="button"
        onClick={handleMarkIngredientOut}
        style={{
          padding: "11px 14px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "white",
          fontWeight: "900",
          cursor: "pointer",
        }}
      >
        Mark Out
      </button>
    </div>
  </div>
</div>
{/* 📜 RESTOCK HISTORY */}
<div
  style={{
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    marginBottom: "20px",
  }}
>
  <div style={{ color: "#93c5fd", fontWeight: "900", fontSize: "12px" }}>
    Restock History
  </div>

  <div
    style={{
      color: "white",
      fontWeight: "900",
      fontSize: "20px",
      marginTop: "6px",
    }}
  >
    Recent inventory actions
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
      marginTop: "6px",
      marginBottom: "14px",
    }}
  >
    Track partial restocks, full distributor restocks, and out-of-stock events.
  </div>

  {restockLogs.length > 0 ? (
    <div style={{ display: "grid", gap: "10px" }}>
      {restockLogs.map((log) => (
        <div
          key={log.id}
          style={{
            padding: "12px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {log.ingredient_name}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
              {log.restock_type === "full"
                ? "Fully restocked"
                : log.restock_type === "out_of_stock"
                ? "Marked out of stock"
                : `Added ${Number(log.quantity_added || 0)} units`}
            </div>
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "12px",
              fontWeight: "800",
              textAlign: "right",
            }}
          >
            {log.created_at
              ? new Date(log.created_at).toLocaleDateString()
              : "N/A"}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div
      style={{
        padding: "14px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px dashed rgba(148,163,184,0.18)",
        color: "#94a3b8",
        fontSize: "13px",
      }}
    >
      No restock history yet.
    </div>
  )}
</div>
  </>
  )}
  {inventoryView === "vendors" && (
  <>
  {hasGrowthAccess ? (
  <>
{/* 🧾 VENDOR PRICE SPIKE DETECTION */}
<div
  style={{
    marginTop: "20px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(120,53,15,0.18), rgba(15,23,42,0.92))",
    border: "1px solid rgba(251,191,36,0.16)",
  }}
>
  <div style={{ color: "#fde68a", fontSize: "12px", fontWeight: "900" }}>
    VENDOR PRICE SPIKE DETECTION
  </div>

  <h3 style={{ color: "white", margin: "6px 0 8px", fontSize: "22px" }}>
    Supplier Cost Change Intelligence
  </h3>

  <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>
    AI compares recent invoice unit costs against prior vendor pricing to detect
    supplier price spikes before they damage margins.
  </p>

  <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
    {vendorPriceSpikeData.length > 0 ? (
      vendorPriceSpikeData.slice(0, 8).map((item, index) => (
        <div
          key={`${item.vendor}-${item.itemName}-${index}`}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(251,191,36,0.14)",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {item.itemName}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
              Vendor: {item.vendor}
            </div>

            <div style={{ color: "#cbd5e1", fontSize: "12px", marginTop: "4px" }}>
              Previous: ${Number(item.previousCost || 0).toFixed(2)} → Latest: $
              {Number(item.latestCost || 0).toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color:
                  item.status === "Critical Spike"
                    ? "#fca5a5"
                    : item.status === "Price Spike"
                    ? "#fde68a"
                    : item.status === "Watch"
                    ? "#93c5fd"
                    : "#86efac",
                fontWeight: "900",
              }}
            >
              {Number(item.priceChange || 0).toFixed(1)}%
            </div>

            <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "4px" }}>
              {item.status}
            </div>
          </div>

          <div style={{ width: "100%", color: "#cbd5e1", fontSize: "13px" }}>
            {item.recommendation}
          </div>
        </div>
      ))
    ) : (
      <div style={{ color: "#94a3b8", fontSize: "14px" }}>
        Upload at least two invoices for the same vendor item to detect price spikes.
      </div>
    )}
  </div>
</div>
{/* 🍽️ REAL RECIPE COSTING ENGINE */}
<div
  style={{
    marginTop: "20px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(88,28,135,0.18), rgba(15,23,42,0.92))",
    border: "1px solid rgba(216,180,254,0.16)",
  }}
>
  <div style={{ color: "#d8b4fe", fontSize: "12px", fontWeight: "900" }}>
    REAL RECIPE COSTING ENGINE
  </div>

  <h3 style={{ color: "white", margin: "6px 0 8px", fontSize: "22px" }}>
    Dish-Level Profitability
  </h3>

  <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>
    AI calculates true menu item cost by combining recipe rules, ingredient
    unit costs, and menu prices to reveal real dish margins.
  </p>

  <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
    {recipeCostingData.length > 0 ? (
      recipeCostingData.slice(0, 10).map((item, index) => (
        <div
          key={`${item.itemName}-${index}`}
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(216,180,254,0.14)",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {item.itemName}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
              Ingredients linked: {item.ingredientCount}
            </div>

            <div style={{ color: "#cbd5e1", fontSize: "12px", marginTop: "4px" }}>
              Price: ${Number(item.price || 0).toFixed(2)} • Recipe Cost: $
              {Number(item.recipeCost || 0).toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color:
                  item.status === "Low Margin"
                    ? "#fca5a5"
                    : item.status === "Watch"
                    ? "#fde68a"
                    : item.status === "Healthy"
                    ? "#93c5fd"
                    : item.status === "High Profit"
                    ? "#86efac"
                    : "#cbd5e1",
                fontWeight: "900",
              }}
            >
              {item.margin > 0 ? `${Number(item.margin || 0).toFixed(1)}%` : "Needs data"}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "4px" }}>
              {item.status}
            </div>
          </div>

          <div style={{ width: "100%", color: "#cbd5e1", fontSize: "13px" }}>
            {item.recommendation}
          </div>
        </div>
      ))
    ) : (
      <div style={{ color: "#94a3b8", fontSize: "14px" }}>
        Upload menu items and save recipe rules to unlock real recipe costing.
      </div>
    )}
  </div>
</div>
{/* 🍽️ RECIPE USAGE BUILDER */}
<div
  style={{
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.16)",
    marginBottom: "20px",
  }}
>
  <div style={{ color: "#fbbf24", fontWeight: "900", fontSize: "12px" }}>
    Recipe Usage Builder
  </div>

  <div style={{ color: "white", fontWeight: "900", fontSize: "20px", marginTop: "6px" }}>
    Tell Serven what each dish uses
  </div>

  <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, marginTop: "6px", marginBottom: "14px" }}>
    Add ingredient amounts per menu item so Serven can forecast runout risk accurately.
  </div>

  <div
  style={{
    display: "grid",
    gap: "12px",
    width: "100%",
  }}
>
  {/* ROW 1 */}
 <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "10px",
  }}
>
    <input
      value={recipeForm.menuItem}
      onChange={(e) =>
        setRecipeForm((prev) => ({ ...prev, menuItem: e.target.value }))
      }
      placeholder="Menu item"
      style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
    />

    <input
      value={recipeForm.ingredient}
      onChange={(e) =>
        setRecipeForm((prev) => ({ ...prev, ingredient: e.target.value }))
      }
      placeholder="Ingredient"
      style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
    />
  </div>

  {/* ROW 2 */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "0.8fr 0.8fr 1fr",
      gap: "10px",
    }}
  >
    <input
      type="number"
      value={recipeForm.amountUsed}
      onChange={(e) =>
        setRecipeForm((prev) => ({ ...prev, amountUsed: e.target.value }))
      }
      placeholder="Amount"
      style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
    />

    <select
      value={recipeForm.unit}
      onChange={(e) =>
        setRecipeForm((prev) => ({ ...prev, unit: e.target.value }))
      }
      style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
    >
      <option value="oz">oz</option>
      <option value="lb">lb</option>
      <option value="grams">grams</option>
      <option value="kg">kg</option>
      <option value="pieces">pieces</option>
      <option value="cups">cups</option>
      <option value="tbsp">tbsp</option>
      <option value="tsp">tsp</option>
      <option value="gallons">gallons</option>
    </select>

    <button
      type="button"
      onClick={handleSaveRecipeRule}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "none",
        background: "linear-gradient(135deg, #f59e0b, #d97706)",
        color: "white",
        fontWeight: "900",
        cursor: "pointer",
      }}
    >
      Save Recipe Rule
    </button>
  </div>
</div>
  {recipeUsageRules.length > 0 && (
  <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
    {recipeUsageRules.map((rule) => (
      <div
        key={rule.id}
        style={{
          padding: "12px",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
          color: "#e2e8f0",
          fontSize: "13px",
          fontWeight: "800",
        }}
      >
        {rule.menuItem} uses{" "}
        <span style={{ color: "#fbbf24" }}>
          {rule.amountUsed} {rule.unit}
        </span>{" "}
        of {rule.ingredient}
      </div>
    ))}
  </div>
)}
</div>
  </>
) : (
  <div>
    Growth locked card here
  </div>
)}
</>
)}
  




{activeTab === "beverage" && (
  <div>
 {/* BEVERAGE INTELLIGENCE HERO */}
<div
  style={{
    marginBottom: "24px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top right, rgba(236,72,153,0.18), transparent 30%), linear-gradient(135deg, #111827, #1e293b)",
    border: "1px solid rgba(244,114,182,0.18)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.22)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#f9a8d4",
      marginBottom: "8px",
    }}
  >
    Beverage Intelligence
  </div>

  <h2
    style={{
      margin: 0,
      color: "white",
      fontSize: isMobile ? "26px" : "32px",
      fontWeight: "950",
    }}
  >
    Alcohol & Beverage Operations
  </h2>

  <p
    style={{
      marginTop: "10px",
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.7,
      maxWidth: "760px",
    }}
  >
    Monitor pour costs, bartender variance, theft risk, happy hour profitability,
    recipe margins, and beverage performance using AI-powered operational intelligence.
  </p>
</div>
 
{/* BEVERAGE PROFITABILITY KPI STRIP */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "26px",
  }}
>
  <GlassCard
    title="Top Margin Drink"
    value={topMarginCocktails?.[0]?.name || "Needs recipe data"}
    subtext={
      topMarginCocktails?.[0]?.cocktailMargin
        ? `${Number(topMarginCocktails[0].cocktailMargin).toFixed(1)}% cocktail margin`
        : "Upload drink price and cost data"
    }
  />

  <GlassCard
    title="Top Velocity Drink"
    value={beverageLeaderboard?.[0]?.name || "Needs beverage sales"}
    subtext={
      beverageLeaderboard?.[0]?.revenue
        ? `$${Number(beverageLeaderboard[0].revenue || 0).toLocaleString()} beverage revenue`
        : "Upload alcohol sales data"
    }
  />

  <GlassCard
    title="Most Profitable Cocktail"
    value={topMarginCocktails?.[0]?.name || "Needs cocktail data"}
    subtext={
      topMarginCocktails?.[0]?.price && topMarginCocktails?.[0]?.estimatedCost
        ? `$${Number(
            Number(topMarginCocktails[0].price || 0) -
              Number(topMarginCocktails[0].estimatedCost || 0)
          ).toFixed(2)} profit per drink`
        : "Upload cocktail pricing and recipe cost"
    }
  />

  <GlassCard
    title="Most Wasted Beverage"
    value={
      alcoholVariancePercent > 0
        ? topAlcoholItemName || "Variance detected"
        : "No waste detected"
    }
    subtext={
      alcoholVariancePercent > 0
        ? `${Number(alcoholVariancePercent || 0).toFixed(1)}% pour variance risk`
        : "No beverage waste signal yet"
    }
  />
</div>
{/* BEVERAGE THEFT RISK INTELLIGENCE */}
<div
  style={{
    marginTop: "16px",
    marginBottom: "26px",
    padding: "18px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(127,29,29,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(248,113,113,0.14)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#fca5a5",
      marginBottom: "12px",
    }}
  >
    Beverage Theft Risk Intelligence
  </div>

  <div
    style={{
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.7,
      marginBottom: "12px",
    }}
  >
    {alcoholVarianceInsight}
  </div>

  <div
    style={{
      display: "inline-flex",
      padding: "8px 14px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(248,113,113,0.18)",
      color: alcoholVarianceColor,
      fontSize: "12px",
      fontWeight: "900",
    }}
  >
    {alcoholVarianceStatus}
  </div>
</div>







{/* ALCOHOL SALES INTELLIGENCE */}
<div
  style={{
    marginTop: "20px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(124,58,237,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(167,139,250,0.18)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#c4b5fd",
      marginBottom: "16px",
    }}
  >
    Alcohol Sales Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
  title="Alcohol Revenue"
  value={`$${Number(alcoholRevenue || 0).toLocaleString()}`}
  subtext="Revenue generated from detected alcohol sales"
/>

<GlassCard
  title="Alcohol % of Sales"
  value={`${Number(alcoholRevenuePercent || 0).toFixed(1)}%`}
  subtext="Percentage of total revenue from alcohol"
/>

<GlassCard
  title="Top Alcohol Item"
  value={topAlcoholItemName}
  subtext="Highest revenue beverage item"
/>

<GlassCard
  title="Alcohol Items Found"
  value={alcoholSalesRows.length}
  subtext="Detected alcohol-related sales items"
/>
  </div>
</div>
{/* AI ALCOHOL COMMENTARY */}
<div
  style={{
    marginTop: "18px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(91,33,182,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(167,139,250,0.18)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#c4b5fd",
      marginBottom: "12px",
    }}
  >
    AI Beverage Intelligence
  </div>

  <div
    style={{
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.8,
      marginBottom: "14px",
    }}
  >
    {alcoholInsight}
  </div>

  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 14px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.06)",
      color: "#d8b4fe",
      fontSize: "12px",
      fontWeight: "900",
      border: "1px solid rgba(167,139,250,0.18)",
    }}
  >
    {alcoholPerformanceLevel}
  </div>
</div>
{/* ALCOHOL POUR COST INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(22,101,52,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(74,222,128,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#86efac",
      marginBottom: "14px",
    }}
  >
    Alcohol Pour Cost Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Estimated Pour Cost"
      value={
        estimatedAlcoholCostPercent > 0
          ? `${estimatedAlcoholCostPercent}%`
          : "Needs alcohol data"
      }
      subtext="Estimated beverage cost percentage"
    />

    <GlassCard
      title="Estimated Beverage Margin"
      value={
        alcoholMarginPercent > 0
          ? `${alcoholMarginPercent}%`
          : "Needs alcohol data"
      }
      subtext="Estimated margin after pour cost"
    />

    <GlassCard
      title="Margin Status"
      value={alcoholMarginStatus}
      subtext="AI beverage margin rating"
    />
  </div>
</div>
{/* BEVERAGE CATEGORY BREAKDOWN */}
<div
  style={{
    marginTop: "18px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(14,116,144,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(56,189,248,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#67e8f9",
      marginBottom: "14px",
    }}
  >
    Beverage Category Breakdown
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    {Object.entries(beverageCategoryBreakdown).map(([category, revenue]) => (
      <GlassCard
        key={category}
        title={category}
        value={`$${Number(revenue || 0).toLocaleString()}`}
        subtext="Detected beverage revenue"
      />
    ))}

    <GlassCard
      title="Top Beverage Category"
      value={topBeverageCategory}
      subtext="Highest beverage revenue category"
    />
  </div>
</div>
{/* TOP BEVERAGE PERFORMERS */}
<div
  style={{
    marginTop: "18px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(30,64,175,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(96,165,250,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#93c5fd",
      marginBottom: "14px",
    }}
  >
    Top Beverage Performers
  </div>

  <div
    style={{
      display: "grid",
      gap: "12px",
    }}
  >
    {beverageLeaderboard.map((item, index) => (
      <div
        key={`${item.name}-${index}`}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div>
          <div
            style={{
              color: "white",
              fontWeight: "800",
              marginBottom: "4px",
            }}
          >
            {item.name}
          </div>

          <div
            style={{
              color: "#93c5fd",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            {item.category}
          </div>
        </div>

        <div
          style={{
            color: "#86efac",
            fontWeight: "900",
            fontSize: "16px",
          }}
        >
          ${Number(item.revenue || 0).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
</div>
{/* ALCOHOL-AWARE AI INSIGHTS */}
<div
  style={{
    marginTop: "18px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(88,28,135,0.18), rgba(15,23,42,0.92))",
    border: "1px solid rgba(216,180,254,0.18)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#d8b4fe",
      marginBottom: "14px",
    }}
  >
    Alcohol-Aware AI Insights
  </div>

  <div
    style={{
      display: "grid",
      gap: "12px",
    }}
  >
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
        color: "#e2e8f0",
        fontSize: "14px",
        lineHeight: 1.7,
      }}
    >
      {beverageAIInsight}
    </div>

    <div
      style={{
        padding: "14px 16px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
        color: "#e2e8f0",
        fontSize: "14px",
        lineHeight: 1.7,
      }}
    >
      {beverageRiskInsight}
    </div>
  </div>
</div>

{hasProAccess ? (
  <>
{/* 🍸 ALCOHOL THEFT / POUR VARIANCE INTELLIGENCE */}
<div
  style={{
    marginTop: "20px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(76,29,149,0.22), rgba(15,23,42,0.94))",
    border: "1px solid rgba(196,181,253,0.18)",
  }}
>
  <div style={{ color: "#c4b5fd", fontSize: "12px", fontWeight: "900" }}>
    ALCOHOL POUR VARIANCE INTELLIGENCE
  </div>

  <h3 style={{ color: "white", margin: "6px 0 8px", fontSize: "22px" }}>
    Ounce-Level Alcohol Loss Detection
  </h3>

  <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>
    AI compares expected ounces sold from cocktails, beer, and liquor sales
    against actual bottle or keg depletion to detect overpouring, spills,
    comps, theft exposure, or recipe inconsistency.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
      marginTop: "16px",
    }}
  >
    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Alcohol Revenue</div>
      <div style={miniKpiValue}>
        ${Number(alcoholPourVarianceData.totalAlcoholRevenue || 0).toLocaleString()}
      </div>
    </div>

    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Expected Oz Sold</div>
      <div style={miniKpiValue}>
        {Number(alcoholPourVarianceData.estimatedOuncesSold || 0).toFixed(1)}
      </div>
    </div>

    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Actual Oz Depleted</div>
      <div style={miniKpiValue}>
        {Number(alcoholPourVarianceData.actualOuncesDepleted || 0).toFixed(1)}
      </div>
    </div>

    <div style={miniKpiCard}>
      <div style={miniKpiLabel}>Pour Variance</div>
      <div
        style={{
          ...miniKpiValue,
          color:
            alcoholPourVarianceData.variancePercent > 12
              ? "#fca5a5"
              : alcoholPourVarianceData.variancePercent > 5
              ? "#fde68a"
              : "#86efac",
        }}
      >
        {Number(alcoholPourVarianceData.variancePercent || 0).toFixed(1)}%
      </div>
    </div>
  </div>

  <div
    style={{
      marginTop: "16px",
      padding: "14px",
      borderRadius: "16px",
      background:
        alcoholPourVarianceData.status === "Critical Pour Variance"
          ? "rgba(239,68,68,0.12)"
          : alcoholPourVarianceData.status === "Pour Variance Risk"
          ? "rgba(245,158,11,0.12)"
          : "rgba(34,197,94,0.10)",
      border:
        alcoholPourVarianceData.status === "Critical Pour Variance"
          ? "1px solid rgba(239,68,68,0.22)"
          : alcoholPourVarianceData.status === "Pour Variance Risk"
          ? "1px solid rgba(245,158,11,0.22)"
          : "1px solid rgba(34,197,94,0.18)",
    }}
  >
    <div style={{ color: "white", fontWeight: "900", marginBottom: "6px" }}>
      {alcoholPourVarianceData.status}
    </div>

    <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>
      {alcoholPourVarianceData.recommendation}
    </div>
  </div>
</div>
   {/* POUR VARIANCE INTELLIGENCE */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "26px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(88,28,135,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(216,180,254,0.16)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#d8b4fe",
      marginBottom: "14px",
    }}
  >
    Pour Variance Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Expected Alcohol Usage"
      value={`$${Number(expectedAlcoholUsage || 0).toLocaleString()}`}
      subtext="Expected beverage cost from alcohol revenue"
    />

    <GlassCard
      title="Actual Alcohol Usage"
      value={`$${Number(actualAlcoholUsage || 0).toLocaleString()}`}
      subtext="Detected alcohol inventory cost"
    />

    <GlassCard
      title="Pour Variance"
      value={`${Number(alcoholVariancePercent || 0).toFixed(1)}%`}
      subtext={alcoholVarianceInsight}
    />

    <GlassCard
      title="Variance Status"
      value={alcoholVarianceStatus}
      subtext="AI beverage shrink rating"
    />
  </div>
</div>
{/* BARTENDER / SHIFT VARIANCE INTELLIGENCE */}
<div
  style={{
    marginTop: "16px",
    marginBottom: "26px",
    padding: "18px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(88,28,135,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(216,180,254,0.14)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#d8b4fe",
      marginBottom: "12px",
    }}
  >
    Bartender / Shift Variance Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
      marginBottom: "14px",
    }}
  >
    <GlassCard
      title="Top Beverage Seller"
      value={topBartender?.bartender || "Needs staff data"}
      subtext={
        topBartender?.revenue
          ? `$${Number(topBartender.revenue || 0).toLocaleString()} alcohol revenue`
          : "Upload staff/server data"
      }
    />

    <GlassCard
      title="Staff Tracked"
      value={bartenderVarianceArray.length}
      subtext="Bartenders or servers detected"
    />

    <GlassCard
      title="Variance Status"
      value={bartenderRiskStatus}
      subtext={bartenderVarianceInsight}
    />
  </div>

  <div style={{ display: "grid", gap: "12px" }}>
    {bartenderVarianceArray.length > 0 ? (
      bartenderVarianceArray.slice(0, 5).map((person, index) => (
        <div
          key={`${person.bartender}-${index}`}
          style={{
            padding: "14px 16px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
            display: "flex",
            justifyContent: "space-between",
            gap: "14px",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {person.bartender}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
              {Number(person.orders || 0).toLocaleString()} beverage orders
            </div>
          </div>

          <div style={{ color: "#86efac", fontWeight: "900", textAlign: "right" }}>
            ${Number(person.revenue || 0).toLocaleString()}
          </div>
        </div>
      ))
    ) : (
      <div
        style={{
          padding: "14px 16px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
          color: "#cbd5e1",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        Upload alcohol sales with bartender, server, or employee names to activate staff-level variance intelligence.
      </div>
    )}
  </div>
</div>
{/* KEG / DRAFT BEER DEPLETION INTELLIGENCE */}
<div
  style={{
    marginTop: "16px",
    marginBottom: "26px",
    padding: "18px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(20,83,45,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(74,222,128,0.14)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#86efac",
      marginBottom: "12px",
    }}
  >
    Keg / Draft Beer Depletion Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Draft Beer Revenue"
      value={`$${Number(draftBeerRevenue || 0).toLocaleString()}`}
      subtext="Detected beer / draft sales"
    />

    <GlassCard
      title="Draft Orders"
      value={Number(draftBeerOrders || 0).toLocaleString()}
      subtext="Beer orders detected"
    />

    <GlassCard
      title="Estimated Keg Usage"
      value={`${Number(estimatedKegUsageGallons || 0).toFixed(2)} gal`}
      subtext="Estimated gallons depleted"
    />

    <GlassCard
      title="Keg Status"
      value={kegStatus}
      subtext={kegInsight}
    />
  </div>
</div>
{/* COCKTAIL RECIPE COSTING INTELLIGENCE */}
<div
  style={{
    marginTop: "16px",
    marginBottom: "26px",
    padding: "18px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(124,58,237,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(167,139,250,0.14)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#c4b5fd",
      marginBottom: "12px",
    }}
  >
    Cocktail Recipe Costing Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
      marginBottom: "14px",
    }}
  >
    <GlassCard
      title="Cocktails Analyzed"
      value={cocktailRecipeData.length}
      subtext="Alcohol items reviewed for recipe margin"
    />

    <GlassCard
      title="Low Margin Drinks"
      value={lowMarginCocktails.length}
      subtext="Drinks below target beverage margin"
    />

    <GlassCard
      title="Top Cocktail Margin"
      value={
        topMarginCocktails?.[0]?.cocktailMargin
          ? `${Number(topMarginCocktails[0].cocktailMargin).toFixed(1)}%`
          : "Needs data"
      }
      subtext={topMarginCocktails?.[0]?.name || "Upload drink costs"}
    />
  </div>

  <div style={{ display: "grid", gap: "12px" }}>
    {topMarginCocktails.length > 0 ? (
      topMarginCocktails.map((drink, index) => (
        <div
          key={`${drink.name}-${index}`}
          style={{
            padding: "14px 16px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
            display: "flex",
            justifyContent: "space-between",
            gap: "14px",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "white", fontWeight: "900" }}>
              {drink.name}
            </div>

            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Price: ${Number(drink.price || 0).toFixed(2)} • Cost: $
              {Number(drink.estimatedCost || 0).toFixed(2)}
            </div>
          </div>

          <div
            style={{
              color:
                drink.cocktailMargin >= 80
                  ? "#86efac"
                  : drink.cocktailMargin >= 70
                  ? "#22c55e"
                  : drink.cocktailMargin >= 60
                  ? "#fbbf24"
                  : "#f87171",
              fontWeight: "900",
              textAlign: "right",
            }}
          >
            {Number(drink.cocktailMargin || 0).toFixed(1)}%
            <div style={{ fontSize: "11px", marginTop: "4px" }}>
              {drink.cocktailStatus}
            </div>
          </div>
        </div>
      ))
    ) : (
      <div
        style={{
          padding: "14px 16px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
          color: "#cbd5e1",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        Upload alcohol sales with drink prices and recipe costs to activate cocktail costing.
      </div>
    )}
  </div>
</div>
{/* HAPPY HOUR PROFITABILITY INTELLIGENCE */}
<div
  style={{
    marginTop: "16px",
    marginBottom: "26px",
    padding: "18px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(15,23,42,0.92))",
    border: "1px solid rgba(251,191,36,0.14)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#fbbf24",
      marginBottom: "12px",
    }}
  >
    Happy Hour Profitability Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    }}
  >
    <GlassCard
      title="Happy Hour Revenue"
      value={`$${Number(happyHourRevenue || 0).toLocaleString()}`}
      subtext="Revenue detected during happy hour window"
    />

    <GlassCard
      title="Happy Hour Orders"
      value={Number(happyHourOrders || 0).toLocaleString()}
      subtext="Orders during 3 PM – 6 PM"
    />

    <GlassCard
      title="Avg Happy Hour Check"
      value={`$${Number(happyHourAvgOrder || 0).toFixed(2)}`}
      subtext="Average order value during happy hour"
    />

    <GlassCard
      title="Happy Hour Status"
      value={happyHourStatus}
      subtext={happyHourInsight}
    />
  </div>
</div>
  </>
) : (
  <div
  style={{
    padding: "26px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(168,85,247,0.22)",
    textAlign: "center",
  }}
>
  <div
    style={{
      color: "#c4b5fd",
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "10px",
    }}
  >
    PRO AI FEATURE
  </div>

  <div
    style={{
      color: "white",
      fontSize: "28px",
      fontWeight: "950",
      marginBottom: "12px",
    }}
  >
    Unlock Beverage Intelligence
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.8,
      maxWidth: "680px",
      margin: "0 auto",
    }}
  >
    Detect alcohol loss, bartender variance, keg depletion,
    pour inconsistencies, and beverage profitability with
    AI-powered beverage intelligence.
  </div>

  <button
    type="button"
    onClick={() => setActiveTab("pricing")}
    style={{
      marginTop: "18px",
      padding: "12px 18px",
      borderRadius: "14px",
      border: "none",
      background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
      color: "white",
      fontWeight: "900",
      cursor: "pointer",
    }}
  >
    Upgrade to Pro AI
  </button>
</div>
)}
  </div>
)}


{activeTab === "ai_alerts" && (
  <div>
    {/* AI ALERTS HERO */}
<div
  style={{
    marginBottom: "24px",
    padding: "24px",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top right, rgba(239,68,68,0.18), transparent 30%), linear-gradient(135deg, #111827, #1e293b)",
    border: "1px solid rgba(248,113,113,0.18)",
    boxShadow: "0 20px 50px rgba(2,6,23,0.22)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#fca5a5",
      marginBottom: "8px",
    }}
  >
    AI Alerts
  </div>

  <h2
    style={{
      margin: 0,
      color: "white",
      fontSize: isMobile ? "26px" : "32px",
      fontWeight: "950",
    }}
  >
    Predictive Operational Alerts
  </h2>

  <p
    style={{
      marginTop: "10px",
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.7,
      maxWidth: "760px",
    }}
  >
    Detect operational risks before they impact profitability using AI-powered
    alerts for sales drops, margin compression, labor inefficiencies, inventory
    depletion, waste spikes, and unusual business activity.
  </p>
</div>
  {/* AI ALERTS KPI STRIP */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "26px",
  }}
>
  <GlassCard
    title="Critical Alerts"
    value={predictiveAlerts?.filter((a) => a.type === "critical").length || 0}
    subtext="Highest-priority operational risks"
  />

  <GlassCard
    title="Warning Alerts"
    value={predictiveAlerts?.filter((a) => a.type === "warning").length || 0}
    subtext="Issues that need monitoring"
  />

  <GlassCard
    title="Open Alerts"
    value={predictiveAlerts?.length || 0}
    subtext="Active AI-detected risks"
  />

  <GlassCard
    title="Alert Status"
    value={
      predictiveAlerts?.some((a) => a.type === "critical")
        ? "Critical"
        : predictiveAlerts?.length
        ? "Watch"
        : "Stable"
    }
    subtext="AI operational risk rating"
  />
</div>


  </div>
)}

{showUndoDelete && recentlyDeletedUpload && (
  <div
    style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 9999,
      padding: "14px 16px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.94))",
      border: "1px solid rgba(148,163,184,0.16)",
      boxShadow: "0 20px 40px rgba(2,6,23,0.28)",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      maxWidth: "420px",
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: "13px",
          fontWeight: "800",
          color: "white",
          marginBottom: "4px",
        }}
      >
        Import deleted
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {recentlyDeletedUpload.file_name ||
          recentlyDeletedUpload.client_name ||
          "Client upload"}{" "}
        removed.
      </div>
    </div>

    <button
      type="button"
      onClick={undoDeleteClientUpload}
      style={{
        padding: "10px 14px",
        borderRadius: "12px",
        border: "none",
        background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
        color: "white",
        fontWeight: "800",
        cursor: "pointer",
      }}
    >
      Undo
    </button>
  </div>
)}
</div> {/* LEFT SIDE */}
</div>
</div>
</div>
 {activeTab === "pro" && (
  <>
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ================= ELITE HEADER ================= */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "24px",
          borderRadius: "22px",
          background:
            "radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 28%), linear-gradient(135deg, #312e81, #4f46e5 40%, #6D3DF5 100%)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 20px 60px rgba(79,70,229,0.28)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "6px 10px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.12)",
            fontSize: "11px",
            fontWeight: "800",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          Pro AI System
        </div>

        <div
          style={{
            fontSize: "28px",
            fontWeight: "900",
            lineHeight: 1.1,
            marginBottom: "8px",
          }}
        >
          AI Profit Engine
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.86)",
            maxWidth: "680px",
            lineHeight: 1.6,
          }}
        >
          Serven AI is continuously identifying profit leaks, prioritizing the
          highest-impact actions, and simulating how much revenue you can recover
          each month.
        </div>

        <div
          style={{
            marginTop: "18px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.10)",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            {autopilotEnabled ? "Autopilot Active" : "Manual Control"}
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.10)",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            {appliedFixes.length} Fixes Applied
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.10)",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            +${Number(simulatedProfit || 0).toLocaleString()}/mo simulated
          </div>
        </div>
      </div>
{/* ================= AI / AUTOPILOT KPI STRIP ================= */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "18px",
    marginBottom: "26px",
  }}
>
  {[
    {
      label: "SIMULATED GAIN",
      value: `+$${Number(simulatedProfit || 0).toLocaleString()}`,
      subtext: "Estimated monthly upside",
      accent: "#6ee7b7",
      bg: "rgba(16,185,129,0.12)",
      border: "1px solid rgba(16,185,129,0.24)",
    },
    {
      label: "APPLIED FIXES",
      value: appliedFixes.length,
      subtext: "Optimizations executed",
      accent: "#c7d2fe",
      bg: "rgba(79,70,229,0.12)",
      border: "1px solid rgba(79,70,229,0.24)",
    },
    {
      label: "AUTOPILOT",
      value: autopilotEnabled ? "ON" : "OFF",
      subtext: "Automation status",
      accent: autopilotEnabled ? "#6ee7b7" : "#fbbf24",
      bg: autopilotEnabled
        ? "rgba(16,185,129,0.12)"
        : "rgba(245,158,11,0.12)",
      border: autopilotEnabled
        ? "1px solid rgba(16,185,129,0.24)"
        : "1px solid rgba(245,158,11,0.24)",
    },
    {
      label: "PROFIT LIFT",
      value: `+${Number(simulatorProfitLift || 0).toFixed(1)}%`,
      subtext: "Estimated improvement",
      accent: "#f9a8d4",
      bg: "rgba(236,72,153,0.12)",
      border: "1px solid rgba(236,72,153,0.24)",
    },
  ].map((item) => (
    <div
      key={item.label}
      style={{
        padding: "20px",
        borderRadius: "20px",
        background: `radial-gradient(circle at top right, ${item.bg}, transparent 38%), rgba(15,23,42,0.78)`,
        border: item.border,
        boxShadow: "0 18px 42px rgba(2,6,23,0.18)",
      }}
    >
      <div
        style={{
          color: item.accent,
          fontSize: "11px",
          fontWeight: "900",
          letterSpacing: "0.08em",
        }}
      >
        {item.label}
      </div>

      <div
        style={{
          color: "white",
          fontSize: "29px",
          fontWeight: "950",
          marginTop: "8px",
        }}
      >
        {item.value}
      </div>

      <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "8px" }}>
        {item.subtext}
      </div>
    </div>
  ))}
</div>
   {/* ============================= */}
{/* AI PROFIT ENGINE */}
{/* ============================= */}
<div
  style={{
    ...sectionCard,
    borderRadius: "22px",
    padding: "22px",
    marginBottom: "24px",
    background:
      "radial-gradient(circle at top right, rgba(109,61,245,0.14), transparent 34%), linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.86))",
    border: "1px solid rgba(148,163,184,0.16)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "16px",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#c4b5fd",
          marginBottom: "6px",
        }}
      >
        AI Profit Engine
      </div>

      <h3
        style={{
          margin: 0,
          color: "white",
          fontSize: "22px",
          fontWeight: "950",
        }}
      >
        Highest-impact moves right now
      </h3>

      <p
        style={{
          margin: "6px 0 0",
          color: "#94a3b8",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        Apply AI-recommended actions to simulate and track monthly profit lift.
      </p>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: autopilotEnabled
          ? "rgba(16,185,129,0.12)"
          : "rgba(245,158,11,0.12)",
        border: autopilotEnabled
          ? "1px solid rgba(16,185,129,0.24)"
          : "1px solid rgba(245,158,11,0.24)",
        color: autopilotEnabled ? "#6ee7b7" : "#fbbf24",
        fontSize: "12px",
        fontWeight: "900",
      }}
    >
      Autopilot {autopilotEnabled ? "ON" : "OFF"}
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gap: "14px",
    }}
  >
    {top3AIActions.length ? (
      top3AIActions.map((item, index) => {
        const itemId = item.id || index + 1;
        const applied = appliedFixes.includes(itemId);

        return (
          <div
            key={itemId}
            style={{
              padding: "16px",
              borderRadius: "18px",
              background: applied
                ? "rgba(16,185,129,0.08)"
                : "rgba(255,255,255,0.05)",
              border: applied
                ? "1px solid rgba(16,185,129,0.22)"
                : "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "220px" }}>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "8px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "999px",
                    background: applied
                      ? "linear-gradient(135deg, #10b981, #22c55e)"
                      : "linear-gradient(135deg, #4f46e5, #6D3DF5)",
                    color: "white",
                    fontWeight: "900",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                  }}
                >
                  {applied ? "✓" : index + 1}
                </div>

                <div style={{ color: "white", fontWeight: "900" }}>
                  {item.title}
                </div>
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                {item.description}
              </div>
            </div>

            <div style={{ textAlign: "right", minWidth: "150px" }}>
              <div
                style={{
                  color: "#22c55e",
                  fontWeight: "900",
                  fontSize: "15px",
                }}
              >
                +${Number(item.impact || 0).toLocaleString()}/mo
              </div>

              <button
                type="button"
                onClick={() => {
                  if (applied) return;

                  setSimulatedProfit((prev) => prev + Number(item.impact || 0));
                  setAppliedFixes((prev) => [...prev, itemId]);
                }}
                style={{
                  marginTop: "10px",
                  padding: "9px 13px",
                  borderRadius: "11px",
                  border: "none",
                  background: applied
                    ? "#374151"
                    : "linear-gradient(135deg, #4f46e5, #6D3DF5)",
                  color: "white",
                  fontWeight: "900",
                  cursor: applied ? "default" : "pointer",
                }}
              >
                {applied ? "Applied" : "Apply Fix"}
              </button>
            </div>
          </div>
        );
      })
    ) : (
      <div
        style={{
          height: "150px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          textAlign: "center",
          borderRadius: "18px",
          border: "1px dashed rgba(148,163,184,0.2)",
          background: "rgba(15,23,42,0.5)",
          fontSize: "13px",
        }}
      >
        No AI actions available yet.
      </div>
    )}
  </div>
</div>

      {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* ================= LEFT COLUMN ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* ================= AI ENGINE CONTROL ================= */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "24px",
              borderRadius: "22px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 18px 50px rgba(15,23,42,0.18)",
            }}
          >
            <div
              style={{
                filter: hasProAccess ? "none" : "blur(5px)",
                opacity: hasProAccess ? 1 : 0.6,
                pointerEvents: hasProAccess ? "auto" : "none",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 0.7fr",
                  gap: "20px",
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #022c22, #065f46)",
                    border: "1px solid rgba(16,185,129,0.35)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#6ee7b7",
                      fontWeight: "800",
                      letterSpacing: "0.08em",
                    }}
                  >
                    AI PROFIT POTENTIAL
                  </div>

                  <div
                    style={{
                      fontSize: "38px",
                      fontWeight: "900",
                      color: "#ecfdf5",
                      marginTop: "10px",
                      lineHeight: 1,
                    }}
                  >
                    +${Number(simulatedProfit || 0).toLocaleString()}/month
                  </div>

                  <div
                    style={{
                      marginTop: "12px",
                      color: "rgba(236,253,245,0.78)",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    This is the projected recoverable profit from pricing, labor,
                    supplier, and waste optimizations applied through Serven AI.
                  </div>

                  {/* AI CONFIDENCE */}
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#bbf7d0" }}>
                      AI Confidence
                    </div>
                    <div
                      style={{
                        marginTop: "4px",
                        fontWeight: "800",
                        color: "#d1fae5",
                        fontSize: "14px",
                      }}
                    >
                      High Confidence (92%)
                    </div>
                  </div>

                  {/* PROFIT PROGRESS */}
                  <div style={{ marginTop: "18px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        color: "#d1fae5",
                        marginBottom: "8px",
                      }}
                    >
                      <span>Optimization Progress</span>
                      <span>
                        {Math.min(appliedFixes.length, aiProfitOpportunities.length)}/
                        {aiProfitOpportunities.length}
                      </span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "10px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.14)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${
                            aiProfitOpportunities.length
                              ? (appliedFixes.length / aiProfitOpportunities.length) *
                                100
                              : 0
                          }%`,
                          height: "100%",
                          borderRadius: "999px",
                          background: "linear-gradient(135deg, #22c55e, #10b981)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!hasProAccess) return;

                      setAutopilotEnabled(true);

                      const opportunities = aiProfitOpportunities.map((item) => ({
  id: item.id,
  name: item.title,
  impact: Number(item.impact || 0),
}));

                      const unapplied = opportunities.filter(
                        (o) => !appliedFixes.includes(o.id)
                      );

                      const total = unapplied.reduce((sum, o) => sum + o.impact, 0);

                      if (unapplied.length > 0) {
                        setSimulatedProfit((prev) => prev + total);
                        setAppliedFixes((prev) => [
                          ...new Set([...prev, ...unapplied.map((o) => o.id)]),
                        ]);

                        setAiLog((prev) =>
                          [
                            {
                              id: Date.now(),
                              text: `AI applied ${unapplied.length} optimizations → +$${total.toLocaleString()}/mo projected gain`,
                            },
                            ...prev,
                          ].slice(0, 6)
                        );
                      }
                    }}
                    style={{
                      marginTop: "18px",
                      padding: "12px 18px",
                      borderRadius: "14px",
                      border: "none",
                      background: "linear-gradient(135deg, #4338ca, #6D3DF5)",
                      color: "white",
                      fontWeight: "900",
                      fontSize: "14px",
                      cursor: "pointer",
                      boxShadow: "0 10px 24px rgba(79,70,229,0.28)",
                    }}
                  >
                    🚀 Optimize My Restaurant
                  </button>
                </div>

                <div
                  style={{
                    padding: "18px",
                    borderRadius: "18px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        fontWeight: "800",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      AI Autopilot
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        color: "white",
                        fontWeight: "800",
                        fontSize: "18px",
                      }}
                    >
                      Fully automated optimization
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        color: "#94a3b8",
                        fontSize: "13px",
                        lineHeight: 1.6,
                      }}
                    >
                      Let Serven continuously apply high-confidence profit
                      improvements across pricing, waste, and labor.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      SYSTEM STATUS
                    </div>
                    <div
                      style={{
                        marginTop: "6px",
                        color: autopilotEnabled ? "#6ee7b7" : "#e2e8f0",
                        fontWeight: "800",
                      }}
                    >
                      {autopilotEnabled ? "Monitoring & Applying Fixes" : "Standing By"}
                    </div>
                  </div>

                  <button
  type="button"
  onClick={() => {
    const nextValue = !autopilotEnabled;
    setAutopilotEnabled(nextValue);

    setAiLog((prev) =>
      [
        {
          id: Date.now(),
          text: `Autopilot turned ${nextValue ? "on" : "off"}`,
        },
        ...prev,
      ].slice(0, 6)
    );

    if (nextValue) {
      runAutopilotAI("Manual autopilot activation");
    }
  }}
  style={{
    padding: "10px 14px",
    borderRadius: "999px",
    border: "none",
    background: autopilotEnabled
      ? "linear-gradient(135deg, #22c55e, #16a34a)"
      : "#374151",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
    alignSelf: "flex-start",
    boxShadow: autopilotEnabled
      ? "0 10px 24px rgba(34,197,94,0.25)"
      : "none",
    transition: "all 0.2s ease",
  }}
>
  {autopilotEnabled ? "Autopilot ON" : "Autopilot OFF"}
</button>
                </div>
              </div>
            </div>

            {!hasProAccess && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(15,23,42,0.86)",
                  textAlign: "center",
                  padding: "24px",
                }}
              >
                <h4 style={{ color: "white", margin: 0 }}>🔒 Automate Your Profit</h4>

                <p
                  style={{
                    color: "#cbd5e1",
                    fontSize: "13px",
                    maxWidth: "300px",
                    marginTop: "10px",
                    lineHeight: 1.6,
                  }}
                >
                  Unlock Serven Pro to apply AI optimizations automatically and
                  recover profit faster.
                </p>

                <button
                  onClick={() => router.push("/pricing")}
                  style={{
                    marginTop: "12px",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
                    color: "white",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  Upgrade to Pro →
                </button>
              </div>
            )}
          </div>

          {/* ================= SIMULATOR ================= */}
          <div
            style={{
              ...sectionCard,
              borderRadius: "20px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#a5b4fc",
                marginBottom: "10px",
              }}
            >
              Restaurant Simulator
            </div>

            <h3 style={sectionTitle}>Projected Outcome</h3>

            <div style={{ marginTop: "10px" }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  lineHeight: 1.6,
                }}
              >
                {simulatorInsight}
              </div>

              <div
                style={{
                  marginTop: "14px",
                  fontSize: "24px",
                  fontWeight: "900",
                  color: "#10b981",
                }}
              >
                +{Number(simulatorProfitLift || 0).toFixed(1)}% projected lift
              </div>
            </div>
          </div>

          {/* ================= AI OPPORTUNITIES ================= */}
          <div
            style={{
              ...sectionCard,
              borderRadius: "20px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#a5b4fc",
                marginBottom: "10px",
              }}
            >
              AI Profit Opportunities
            </div>

            <h3 style={sectionTitle}>Recommended Actions</h3>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {aiProfitOpportunities.map((item) => {
                const alreadyApplied = appliedFixes.includes(item.id);

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          color: "white",
                          fontWeight: "800",
                          fontSize: "14px",
                          marginBottom: "6px",
                        }}
                      >
                        {item.title}
                      </div>

                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: "13px",
                          lineHeight: 1.5,
                          marginBottom: "10px",
                        }}
                      >
                        {item.description}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "999px",
                            background: "rgba(79,70,229,0.16)",
                            color: "#c7d2fe",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {item.category}
                        </span>

                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "999px",
                            background: "rgba(255,255,255,0.08)",
                            color: "#cbd5e1",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {item.difficulty}
                        </span>

                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "999px",
                            background: "rgba(34,197,94,0.14)",
                            color: "#6ee7b7",
                            fontSize: "11px",
                            fontWeight: "800",
                          }}
                        >
                          +${Number(item.impact || 0).toLocaleString()}/mo
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!hasProAccess || alreadyApplied) return;

                        setSimulatedProfit(
                          (prev) => prev + Number(item.impact || 0)
                        );
                        setAppliedFixes((prev) => [...prev, item.id]);
                        setAiLog((prev) =>
                          [
                            {
                              id: Date.now(),
                              text: `Applied fix: ${item.title} → +$${Number(
                                item.impact || 0
                              ).toLocaleString()}/mo`,
                            },
                            ...prev,
                          ].slice(0, 6)
                        );
                      }}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "12px",
                        border: "none",
                        background: alreadyApplied
                          ? "#374151"
                          : "linear-gradient(135deg, #4f46e5, #6D3DF5)",
                        color: "white",
                        fontWeight: "800",
                        cursor: alreadyApplied ? "default" : "pointer",
                        minWidth: "110px",
                      }}
                    >
                      {alreadyApplied ? "Applied" : "Apply Fix"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* ================= STRATEGIC INSIGHTS ================= */}
          <div
            style={{
              ...sectionCard,
              borderRadius: "20px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#a5b4fc",
                marginBottom: "10px",
              }}
            >
              Strategic Insights
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <div
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontWeight: "800",
                    marginBottom: "6px",
                    fontSize: "14px",
                  }}
                >
                  Pricing & Product Mix
                </div>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  {menuOptimizationInsight}
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    color: "#22c55e",
                    fontSize: "12px",
                    fontWeight: "800",
                  }}
                >
                  Estimated impact: +$2,100/mo
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    color: "#fbbf24",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  High priority
                </div>
              </div>

              <div
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontWeight: "800",
                    marginBottom: "6px",
                    fontSize: "14px",
                  }}
                >
                  Elasticity & Margin Strategy
                </div>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  {elasticityInsight}
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    color: "#22c55e",
                    fontSize: "12px",
                    fontWeight: "800",
                  }}
                >
                  Estimated impact: +$1,600/mo
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    color: "#fbbf24",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  Medium priority
                </div>
              </div>
            </div>
          </div>

          {/* ================= AI ACTIVITY LOG ================= */}
          <div
            style={{
              ...sectionCard,
              borderRadius: "20px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#a5b4fc",
                marginBottom: "10px",
              }}
            >
              AI Activity Log
            </div>

            <h3 style={sectionTitle}>Recent Actions</h3>

            <div
              style={{
                marginTop: "16px",
                display: "grid",
                gap: "10px",
              }}
            >
              {aiLog?.length ? (
                aiLog.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        alignItems: "flex-start",
                        marginBottom: "6px",
                      }}
                    >
                      <div
                        style={{
                          color: "#e2e8f0",
                          fontSize: "13px",
                          lineHeight: 1.5,
                          flex: 1,
                        }}
                      >
                        {log.text}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(log.id).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                >
                  No AI actions applied yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>




      
    
      </>
)}
    {integrationModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(2,6,23,0.55)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 100,
    }}
    onClick={() => {
  setIntegrationModal(null);
  setIntegrationEmail("");
  setIntegrationRequestSent(false);
}}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: "460px",
        padding: "24px",
        borderRadius: "22px",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96))",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 24px 60px rgba(2,6,23,0.32)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c4b5fd",
              marginBottom: "8px",
            }}
          >
            Integration Early Access
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "900",
              color: "white",
              lineHeight: 1.2,
              marginBottom: "8px",
            }}
          >
            Connect {integrationModal}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#94a3b8",
              lineHeight: 1.7,
            }}
          >
            Native {integrationModal} integration is coming soon. Request early
            access and we’ll prioritize this connection for your account.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
  setIntegrationModal(null);
  setIntegrationEmail("");
  setIntegrationRequestSent(false);
}}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.14)",
            background: "rgba(255,255,255,0.04)",
            color: "#cbd5e1",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      {!integrationRequestSent ? (
        <>
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(148,163,184,0.12)",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#e2e8f0",
                lineHeight: 1.6,
              }}
            >
              Tell us where to notify you when {integrationModal} goes live.
            </div>
          </div>

          <input
            type="email"
            placeholder="Enter your email"
            value={integrationEmail}
            onChange={(e) => setIntegrationEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(148,163,184,0.16)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              fontSize: "13px",
              outline: "none",
              marginBottom: "14px",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
             onClick={async () => {
 try {
  if (!integrationEmail.trim()) {
    alert("Please enter your email first.");
    return;
  }

  const res = await fetch("/api/integration-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: integrationEmail.trim(),
      integrationName: integrationModal,
    }),
  });



  let result = {};
  try {
    result = rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    console.error("Invalid JSON from integration request route:", rawText);
    return;
  }

  if (!res.ok) {
    console.error(
      result?.error || "Failed to request integration early access."
    );
    return;
  }

  setIntegrationRequestSent(true);

  setAiLog((prev) =>
    [
      {
        id: Date.now(),
        text: `${integrationModal} early access requested`,
      },
      ...prev,
    ].slice(0, 6)
  );
} catch (error) {
  console.error("Early access request failed:", error);
}
}}
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
                color: "white",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Request Early Access
            </button>

            <button
              type="button"
              onClick={() => {
                setIntegrationModal(null);
                setIntegrationEmail("");
                setIntegrationRequestSent(false);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(148,163,184,0.16)",
                background: "rgba(255,255,255,0.04)",
                color: "#e2e8f0",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Maybe Later
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            padding: "16px",
            borderRadius: "16px",
            background: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.18)",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: "900",
              color: "#86efac",
              marginBottom: "8px",
            }}
          >
            You’re on the list
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#d1fae5",
              lineHeight: 1.6,
            }}
          >
            We’ll notify you when {integrationModal} integration becomes
            available.
          </div>

          <button
            type="button"
            onClick={() => {
              setIntegrationModal(null);
              setIntegrationEmail("");
              setIntegrationRequestSent(false);
            }}
            style={{
              marginTop: "14px",
              padding: "10px 14px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  </div>
)}

{showSourcePicker && (
  <div
    onClick={() => setShowSourcePicker(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(2,6,23,0.55)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 110,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: "520px",
        padding: "24px",
        borderRadius: "22px",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96))",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 24px 60px rgba(2,6,23,0.32)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c4b5fd",
              marginBottom: "8px",
            }}
          >
            Confirm Data Source
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "900",
              color: "white",
              lineHeight: 1.2,
              marginBottom: "8px",
            }}
          >
            Where is this sales data from?
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#94a3b8",
              lineHeight: 1.7,
            }}
          >
            Select the POS or platform this upload came from so Serven can track
            your data source correctly.
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSourcePicker(false)}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.14)",
            background: "rgba(255,255,255,0.04)",
            color: "#cbd5e1",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      {pendingUploadSummary && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#e2e8f0",
              lineHeight: 1.6,
            }}
          >
            File: <b>{pendingUploadSummary.fileName}</b>
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              marginTop: "4px",
            }}
          >
            {pendingUploadSummary.rowCount.toLocaleString()} rows detected
          </div>
        </div>
      )}

      {pendingUploadSummary?.detectedSource && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            borderRadius: "14px",
            background: "rgba(79,70,229,0.10)",
            border: "1px solid rgba(79,70,229,0.18)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#c7d2fe",
              fontWeight: "800",
              marginBottom: "4px",
            }}
          >
            Detected source: {pendingUploadSummary.detectedSource}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            Confirm or change the source before continuing.
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
        }}
      >
        {["Square", "Clover", "Shopify", "Toast", "Other"].map((source) => {
          const isActive = selectedDataSource === source;

          return (
            <button
              key={source}
              type="button"
              onClick={() => setSelectedDataSource(source)}
              style={{
                padding: "14px 12px",
                borderRadius: "14px",
                border: isActive
                  ? "1px solid rgba(79,70,229,0.28)"
                  : "1px solid rgba(148,163,184,0.14)",
                background: isActive
                  ? "rgba(79,70,229,0.16)"
                  : "rgba(255,255,255,0.04)",
                color: isActive ? "#c7d2fe" : "white",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              {source}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "18px",
        }}
      >
        <button
          type="button"
          onClick={async () => {
            try {
              if (!selectedDataSource) {
                console.error("Please choose a data source first.");
                return;
              }
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  router.push("/login");
  return;
}

if (!isOwner && (!userProfile?.plan || userProfile.plan === "free")) {
  router.push("/pricing");
  return;
}
const safeTotalRevenue = Number(totalRevenue ?? 0);
const safePrevMonth = Number(revenueTrend?.previousMonthRevenue ?? 0);
const safeLastWeek = Number(revenueTrend?.lastWeekRevenue ?? 0);
const safeScore = Number(score ?? 0);
const {
  data: uploadedFileRow,
  error: uploadInsertError,
} = await supabase
  .from("uploads")
  .insert([
    {
      user_id: user?.id || null,
      file_name: pendingUploadSummary?.fileName || null,
      source_name: selectedDataSource,
      row_count: Number(pendingUploadSummary?.rowCount ?? 0),
      upload_type: "pos",
      status: "completed",
    },
  ])
  .select()
  .single();

if (uploadInsertError) {
  console.error("Uploads table insert failed:", uploadInsertError);
  return;
}
const res = await fetch("/api/client-upload-summary", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
 body: JSON.stringify({
  userId: user?.id || null,
  clientName: user?.email || "Unknown Client",
  clientEmail: user?.email || null,

  sourceName: selectedDataSource,
  fileName: pendingUploadSummary?.fileName || null,
  rowCount: Number(pendingUploadSummary?.rowCount ?? 0),
  uploadId: uploadedFileRow?.id || null,

  monthRevenue: safeTotalRevenue,
  previousMonthRevenue: safePrevMonth,
  lastWeekRevenue: safeLastWeek,

  monthlyChangePercent:
    safePrevMonth > 0
      ? ((safeTotalRevenue - safePrevMonth) / safePrevMonth) * 100
      : 0,

  weeklyChangePercent:
    safeLastWeek > 0
      ? ((safeTotalRevenue - safeLastWeek) / safeLastWeek) * 100
      : 0,

  avgMargin: Number(avgMargin ?? 0),
  foodCost: Number(foodCostPercentage ?? 0),

  ownerScore: Math.round(safeScore),
  clientScore: Math.round(
    safeScore >= 60 ? safeScore : safeScore + 10
  ),

  profitLeakCount: profitLeakSignals?.length || 0,
  wasteLoss: Number(totalWasteLoss ?? 0),
  laborCost: Number(laborCostPercentage ?? 0),
  alertsTriggered: starterAlerts?.length || 0,
  topIssue: topGrowthProblems?.[0]?.title || null,
}),
});


let result = {};
try {
  result = text ? JSON.parse(text) : {};
} catch (parseError) {
  console.error("API did not return JSON:", text);
  return;
}

if (!res.ok) {
  console.error(
    "Client upload summary failed:",
    result?.error || text || "Request failed."
  );
  return;
}

console.log("Upload summary saved:", result);

const {
  data: { user: currentUser },
} = await supabase.auth.getUser();

console.log("CURRENT LOGGED IN EMAIL:", currentUser?.email);
console.log("CURRENT LOGGED IN USER ID:", currentUser?.id);
await loadClientUploads();
setAiLog((prev) =>
  [
    {
      id: Date.now(),
      text: `Sales data source confirmed: ${selectedDataSource}`,
    },
    ...prev,
  ].slice(0, 6)
);

setShowSourcePicker(false);
setSelectedDataSource("");

            } catch (error) {
              console.error("Source confirmation failed:", error);
            }
          }}
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
            color: "white",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          {pendingUploadSummary?.detectedSource
            ? `Use ${selectedDataSource}`
            : "Confirm Source"}
        </button>

        <button
          type="button"
          onClick={() => setShowSourcePicker(false)}
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(148,163,184,0.16)",
            background: "rgba(255,255,255,0.04)",
            color: "#e2e8f0",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Skip for Now
        </button>
      </div>
    </div>
  </div>
)}
<style jsx>{`
  @keyframes criticalPulse {
    0% {
      box-shadow: 0 18px 45px rgba(239, 68, 68, 0.08);
    }
    50% {
      box-shadow: 0 22px 55px rgba(239, 68, 68, 0.22);
    }
    100% {
      box-shadow: 0 18px 45px rgba(239, 68, 68, 0.08);
    }
  }
`}</style>
</div>
</ErrorBoundary>
);
}


{/* STYLES */}
const layoutWrapper = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 340px",
  gap: "32px",
  alignItems: "start",
};

const dashboardTheme = {
  panel: "rgba(255,255,255,0.04)",
  panelStrong: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  softText: "#94a3b8",
  bodyText: "#e2e8f0",
  heading: "#ffffff",
  accent: "#a78bfa",
  accentBg: "rgba(109,61,245,0.16)",
  green: "#34d399",
};
/* KPI + GRID */
const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: "20px",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(2,1fr)",
  gap: 20,
  marginTop: 30,
};

/* CARDS */
const glassCard = {
  padding: 20,
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  transition: "all 0.3s ease",
  cursor: "pointer",
  border: "1px solid #eef2f7",
  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
  position: "relative",
  overflow: "hidden",
};

const chartCard = {
  marginTop: 30,
  padding: 20,
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
};



const aiCard = {
  background: "rgba(255,255,255,0.04)",
  padding: "18px",
  borderRadius: "16px",
  border: "1px solid #eef2f7",
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

const aiPanel = {
  width: "300px",
  position: "sticky",
  top: "20px",
  alignSelf: "start",
};

const aovCard = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid #eef2f7",
  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
};

const aovHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#ffffff",
  marginBottom: "6px",
};

const aovValue = {
  fontSize: "26px",
  fontWeight: "700",
  color: "#ffffff",
};

const aovSubtext = {
  marginTop: "6px",
  marginBottom: 0,
  fontSize: "12px",
  color: "#64748b",
};

/* ALERTS */

const aiMiniItem = {
  fontSize: "13px",
  padding: "8px 0",
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "1px solid #f1f1f1",
};

const aiInput = {
  marginTop: "10px",
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  fontSize: "13px",
};

const fixButton = {
  marginTop: "10px",
  padding: "12px",
  width: "100%",
  border: "none",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #6D3DF5, #8B5CF6)",
  color: "white",
  cursor: "pointer",
  fontWeight: "600",
  transition: "all 0.2s ease",
};

/* TABS */
const tabsContainer = {
  display: "inline-flex",
  gap: "8px",
  padding: "6px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  marginBottom: "22px",
  flexWrap: "wrap",
};

const tabStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: "700",
  color: "#64748b",
  cursor: "pointer",
  transition: "all 0.22s ease",
  letterSpacing: "0.2px",
};

const activeTabStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: "800",
  color: "white",
  cursor: "pointer",
  letterSpacing: "0.2px",
  background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
  boxShadow: "0 10px 22px rgba(79,70,229,0.22)",
};

/* BANNER */


const aiPanelCard = {
  background: "rgba(255,255,255,0.04)",
  padding: "20px",
  borderRadius: "14px",
  marginBottom: "20px",
  border: "1px solid #f1f5f9",
};

const aiPanelHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
};

const aiTitle = { fontWeight: "600" };

const aiStatusBadge = {
  fontSize: "12px",
  background: "#eef2ff",
  color: "#4f46e5",
  padding: "4px 10px",
  borderRadius: "999px",
};

const aiSummaryText = {
  fontSize: "14px",
  color: "#475569",
};



const aiStatus = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "13px",
  color: "#64748b",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  borderRadius: "999px",
  border: "1px solid #eef2f7",
  width: "fit-content",
};

const pulseDot = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#6D3DF5",
  animation: "pulse 1.5s infinite",
};
const insightCard = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid #eef2f7",
  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
};

const insightHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#ffffff",
  marginBottom: "8px",
};

const insightValue = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#ffffff",
};

const insightSubtext = {
  marginTop: "6px",
  marginBottom: "10px",
  fontSize: "12px",
  color: "#64748b",
};

const insightMiniList = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginTop: "10px",
};

const insightMiniItem = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "12px",
  color: "#334155",
  paddingTop: "8px",
  borderTop: "1px solid #f1f5f9",
};
const healthCard = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid #eef2f7",
  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
};

const healthHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#ffffff",
  marginBottom: "10px",
};

const healthScoreRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};

const healthScoreValue = {
  fontSize: "26px",
  fontWeight: "700",
  color: "#ffffff",
};

const healthBadge = {
  fontSize: "12px",
  fontWeight: "600",
  padding: "6px 10px",
  borderRadius: "999px",
};

const healthSummaryText = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: 0,
  marginBottom: "12px",
  lineHeight: 1.5,
};

const healthMiniGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "12px",
};

const healthMiniCard = {
  padding: "12px",
  borderRadius: "12px",
  background: "#f8fafc",
  border: "1px solid #eef2f7",
};

const healthMiniLabel = {
  fontSize: "11px",
  color: "#64748b",
  marginBottom: "6px",
};

const healthMiniValue = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#ffffff",
};
const momentumCard = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid #eef2f7",
  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
};

const momentumHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#ffffff",
  marginBottom: "8px",
};

const momentumBadge = {
  display: "inline-block",
  fontSize: "12px",
  fontWeight: "600",
  padding: "6px 10px",
  borderRadius: "999px",
  marginBottom: "10px",
};

const momentumText = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: 0,
  marginBottom: "10px",
  lineHeight: 1.5,
};

const momentumValue = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#ffffff",
};
const starterRecoCard = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid #eef2f7",
  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
};

const starterRecoHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#ffffff",
  marginBottom: "10px",
};

const starterRecoList = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const starterRecoItem = {
  display: "flex",
  gap: "10px",
  fontSize: "13px",
  color: "#334155",
  lineHeight: 1.5,
};

const starterRecoBullet = {
  color: "#6D3DF5",
  fontWeight: "700",
};

const starterRecoEmpty = {
  fontSize: "12px",
  color: "#64748b",
  margin: 0,
};

const starterRecoTeaser = {
  marginTop: "12px",
  paddingTop: "12px",
  borderTop: "1px solid #f1f5f9",
  fontSize: "12px",
  color: "#64748b",
};
const dropAlertCard = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid #eef2f7",
  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
};

const dropAlertHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#ffffff",
  marginBottom: "8px",
};

const dropAlertBadge = {
  display: "inline-block",
  fontSize: "12px",
  fontWeight: "600",
  padding: "6px 10px",
  borderRadius: "999px",
  marginBottom: "10px",
};

const dropAlertText = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: 0,
  marginBottom: "10px",
  lineHeight: 1.5,
};

const dropAlertValue = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#991b1b",
};
const pageStyle = {
  minHeight: "100vh",
  padding:
    typeof window !== "undefined" && window.innerWidth < 768
      ? "14px"
      : "40px",
  background:
    "radial-gradient(circle at top left, rgba(109,61,245,0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(79,70,229,0.10), transparent 40%), linear-gradient(180deg, #0B0F1A 0%, #111827 100%)",
  color: "#ffffff",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
};

const titleStyle = {
  fontSize: "34px",
  fontWeight: "900",
  color: "#ffffff",
  margin: 0,
};

const sectionTitle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "800",
  color: "#ffffff",
};

const sectionSubtle = {
  fontSize: "13px",
  color: "#94a3b8",
  lineHeight: 1.6,
};
const sectionCard = {
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 12px 30px rgba(15,23,42,0.14)",
};

const itemStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#e2e8f0",
  fontSize: "14px",
  marginBottom: "10px",
};

const liveAlertContainer = {
  display: "grid",
  gap: "12px",
  marginBottom: "20px",
};

const alertCard = {
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.05)",
  color: "#e2e8f0",
  border: "1px solid rgba(255,255,255,0.06)",
};

const valueBanner = {
  position: "relative",
  overflow: "hidden",
  marginBottom: "24px",
  padding: "24px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 18px 40px rgba(2,6,23,0.20)",
};
const leadStatCard = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const leadStatLabel = {
  fontSize: "11px",
  color: "#94a3b8",
  fontWeight: "800",
  marginBottom: "6px",
  textTransform: "uppercase",
};

const leadStatValue = {
  fontSize: "22px",
  color: "white",
  fontWeight: "950",
};

const leadButtonPurple = {
  padding: "8px 10px",
  borderRadius: "10px",
  border: "none",
  background: "#4f46e5",
  color: "white",
  fontWeight: "800",
  cursor: "pointer",
};

const leadButtonGold = {
  padding: "8px 10px",
  borderRadius: "10px",
  border: "none",
  background: "#f59e0b",
  color: "white",
  fontWeight: "800",
  cursor: "pointer",
};

const leadButtonGreen = {
  padding: "8px 10px",
  borderRadius: "10px",
  border: "none",
  background: "#22c55e",
  color: "white",
  fontWeight: "800",
  cursor: "pointer",
};
const setupPrimaryButton = {
  padding: "13px 18px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #6D3DF5, #9333ea)",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(109,61,245,0.28)",
};

const setupSecondaryButton = {
  padding: "13px 18px",
  borderRadius: "14px",
  border: "1px solid rgba(148,163,184,0.24)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};

const setupGoldButton = {
  padding: "13px 18px",
  borderRadius: "14px",
  border: "1px solid rgba(212,175,55,0.24)",
  background: "rgba(212,175,55,0.08)",
  color: "#fde68a",
  fontWeight: "900",
  cursor: "pointer",
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