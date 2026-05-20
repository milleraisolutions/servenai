"use client";

import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { supabase } from "../lib/supabaseClient";
import useDashboardData from "@/hooks/useDashboardData";

export default function Dashboard() {

const [showModal, setShowModal] = useState(false);
 
const [agreed, setAgreed] = useState(false);
const [showUpgrade, setShowUpgrade] = useState(false);
const [openSection, setOpenSection] = useState(null);
const [showPerformance, setShowPerformance] = useState(false);
const businessType = "restaurant"; // or "coffee"
const [categoryFilter, setCategoryFilter] = useState("all");
const [timeFilter, setTimeFilter] = useState("today");

  const {
  menuItems,
  salesData,
  plan,
  activeTab,
  setActiveTab,
  loading
} = useDashboardData();

 const items = menuItems || [];

const filteredData = salesData.filter((item) => {
  if (categoryFilter !== "all" && item.category !== categoryFilter) {
    return false;
  }

  const itemDate = new Date(item.date);
  const now = new Date();

  if (timeFilter === "today") {
    return itemDate.toDateString() === now.toDateString();
  }

  if (timeFilter === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return itemDate >= weekAgo;
  }

  if (timeFilter === "month") {
    return (
      itemDate.getMonth() === now.getMonth() &&
      itemDate.getFullYear() === now.getFullYear()
    );
  }

  return true;
});

/* ===============================
   🔥 STEP 3: CONNECT DATA TO MENU
================================= */

// Filter menu items by category
const filteredItems =
  categoryFilter === "all"
    ? items
    : items.filter(
        (item) =>
          item.category?.toLowerCase() === categoryFilter.toLowerCase()
      );

// 🔥 Match sales to menu items
const enrichedItems = filteredItems.map((menuItem) => {
  const itemSales = filteredData.filter(
    (sale) => sale.name === menuItem.name
  );

  const totalSold = itemSales.reduce(
    (sum, sale) => sum + (sale.quantity || 0),
    0
  );

  const revenue = totalSold * menuItem.price;
  const cost = totalSold * menuItem.ingredient_cost;
  const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;

  return {
    ...menuItem,
    totalSold,
    revenue,
    cost,
    margin,
  };
});

// 🔥 KPIs (now REAL data-driven)
const totalRevenue = enrichedItems.reduce((sum, i) => sum + i.revenue, 0);

const profitability = enrichedItems;
/* ===============================
   📊 REVENUE DATA (WEEKLY BY DAY)
================================= */

const revenueData = (() => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const totals = {
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
  };

  (salesData || []).forEach((s) => {
    if (!s?.date) return;

    const day = new Date(s.date).toLocaleDateString("en-US", {
      weekday: "short",
    });

    totals[day] += Number(s.revenue || 0);
  });

  return days.map((day) => ({
    day,
    revenue: totals[day],
  }));
})();

/* ===============================
   🧠 SMART INSIGHTS ENGINE
================================= */

// safe guard
const safeRevenueData = Array.isArray(revenueData) ? revenueData : [];

// BEST DAY
const bestDay = safeRevenueData.length
  ? safeRevenueData.reduce(
      (best, curr) =>
        (curr?.revenue || 0) > (best?.revenue || 0) ? curr : best,
      { day: "-", revenue: 0 }
    )
  : { day: "-", revenue: 0 };

// AVERAGE REVENUE (clean + safe)
const avgRevenue =
  safeRevenueData.reduce((sum, d) => sum + (d?.revenue || 0), 0) /
  (safeRevenueData.length || 1);

// PERFORMANCE RATIO (🔥 upgrade)
const performanceRatio =
  avgRevenue > 0 ? (bestDay?.revenue || 0) / avgRevenue : 0;

// STRONG DAY (dynamic + safe)
const isStrongDay = performanceRatio > 1.3;


/* ===============================
   👨‍🍳 LABOR COST AI ENGINE
================================= */

const laborByDay = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => {
  const filtered = (filteredData || []).map((s) => ({
    date: s.date,
    revenue: Number(s.revenue || 0),
    labor: Number(s.labor || 0),
  })).filter((d) => {
    if (!d.date) return false;
    const dName = new Date(d.date).toLocaleDateString("en-US", {
      weekday: "short",
    });
    return dName === day;
  });

  const revenue = filtered.reduce((t, d) => t + d.revenue, 0);
  const labor = filtered.reduce((t, d) => t + d.labor, 0);

  const percent = revenue ? (labor / revenue) * 100 : 0;

  let status = "OPTIMAL ✅";
  if (percent > 30) status = "OVERSTAFFED ❌";
  else if (percent < 20) status = "UNDERSTAFFED ⚠️";

  return { day, revenue, labor, percent, status };
});
const laborRecommendations = laborByDay.map((d) => {
  if (d.percent > 30) {
    return `${d.day}: Reduce staff (overstaffed)`;
  }
  if (d.percent < 20) {
    return `${d.day}: Add staff (understaffed)`;
  }
  return `${d.day}: Staffing is optimal`;
});

const laborChartData = laborByDay.map((d) => ({
  day: d.day,
  percent: Number(d.percent),
}));

  /* ===============================
     FOOD COST ANALYSIS
  =============================== */

  const totalCost = items.reduce(
    (t, i) => t + (i.ingredient_cost || 0) * (i.weekly_sales || 0),
    0
  );

const foodCostPercentage = totalRevenue
  ? (totalCost / totalRevenue) * 100
  : 0;

const foodCostStatus =
  foodCostPercentage <= 30
    ? "Healthy ✅"
    : foodCostPercentage <= 40
    ? "Warning ⚠️"
    : "Critical 🚨";

  /* ===============================
     PROFITABILITY ENGINE
  =============================== */


  const profitLeaks = profitability.filter((i) => i.margin < 60);
const avgMargin =
  profitability.length > 0
    ? profitability.reduce((sum, i) => sum + Number(i.margin || 0), 0) / profitability.length
    : 0;
      /* ===============================
     PROFIT LEAK DETECTION
  =============================== */
  const profitLeakAlerts = profitLeaks.map((i) => ({
    name: i.name,
    severity: i.margin < 40 ? "HIGH 🚨" : "MEDIUM ⚠️",
  }));
  /* ===============================
   🚨 LOSS RISK AI
================================= */

let riskLevel = "LOW ✅";

if (foodCostPercentage > 40 || profitLeaks.length > 3) {
  riskLevel = "HIGH 🚨";
} else if (foodCostPercentage > 30 || profitLeaks.length > 1) {
  riskLevel = "MEDIUM ⚠️";
}
    /* ===============================
   🔮 REVENUE PREDICTION ENGINE
================================= */

// last 7 days (or available data)
const recentData = (salesData || []).slice(-7);

// average daily revenue
const avgDailyRevenue =
  recentData.reduce((sum, d) => sum + Number(d.revenue || 0), 0) /
  (recentData.length || 1);

// growth trend (simple momentum)
const trendMultiplier = performanceRatio > 1 ? 1.05 : 0.95;

// predicted next week revenue
const predictedWeeklyRevenue = Math.round(
  avgDailyRevenue * 7 * trendMultiplier
);

// predicted profit
const predictedProfit = Math.round(
  predictedWeeklyRevenue * (avgMargin / 100)
);

const inventoryInsights = (items || []).map((i) => {
  // ===============================
  // 📅 EXPIRATION
  // ===============================
  const received = new Date(i.received_date || new Date());

  const shelfLife =
    i.shelf_life_days ||
    (i.storage_type === "fridge" ? 5 :
     i.storage_type === "freezer" ? 30 :
     i.storage_type === "dry" ? 90 :
     i.storage_type === "prepared" ? 2 :
     3);

  const expiration = new Date(received);
  expiration.setDate(received.getDate() + shelfLife);

  const daysLeft = Math.ceil(
    (expiration - new Date()) / (1000 * 60 * 60 * 24)
  );

  let expiryStatus = "FRESH ✅";
  if (daysLeft <= 2) expiryStatus = "EXPIRING SOON ⚠️";
  if (daysLeft <= 0) expiryStatus = "EXPIRED 🚨";

  // ===============================
  // 📦 INVENTORY LEVEL
  // ===============================
  const usage =
    (Number(i?.weekly_sales) || 0) *
    (Number(i?.portion_size_oz) || 0);

  const inventory = (Number(i?.inventory_lbs) || 0) * 16;
  const weeks = usage ? inventory / usage : 0;

  let stockStatus = "STABLE ✅";
  if (weeks < 1) stockStatus = "CRITICAL 🚨";
  else if (weeks < 2) stockStatus = "LOW ⚠️";

  // ===============================
  // 🎯 FINAL OUTPUT
  // ===============================
  return {
    name: i?.name || "Unknown Item",
    daysLeft,
    expiryStatus,
    status: stockStatus
  };
});


  // ===============================
  // 📦 INVENTORY LEVEL (ADD BACK)
  // ===============================
 

  /* ===============================
     WASTE DETECTION
  =============================== */
  const wasteWithCost = items.map((i) => {
    const ideal = (i.weekly_sales || 0) * (i.portion_size_oz || 0);
    const waste = ideal * 0.15;

    const cost =
      (i.ingredient_cost || 0) * (waste / (i.portion_size_oz || 1));

    return { name: i.name, cost: cost.toFixed(2) };
  });



  /* ===============================
     MENU OPTIMIZATION
  =============================== */
  const avgSales =
    items.reduce((s, i) => s + (i.weekly_sales || 0), 0) /
    (items.length || 1);

  const menuActions = profitability.map((i) => {
    const demand = i.weekly_sales >= avgSales ? "high" : "low";
    const profit = i.margin >= 60 ? "high" : "low";

    if (profit === "high" && demand === "high")
      return { name: i.name, action: "KEEP ⭐" };
    if (profit === "low" && demand === "high")
      return { name: i.name, action: "RAISE PRICE 💰" };
    if (profit === "high" && demand === "low")
      return { name: i.name, action: "PROMOTE 📢" };
    return { name: i.name, action: "REMOVE ❌" };
  });

  /* ===============================
     SUPPLIER MONITORING
  =============================== */
  const supplierTrends = items
    .map((i) => {
      if (!i.previous_cost) return null;

      const change =
        ((i.ingredient_cost - i.previous_cost) / i.previous_cost) * 100;

      return {
        name: i.name,
        change: change.toFixed(1),
        status: change > 5 ? "SPIKE 📈" : "STABLE",
      };
    })
    .filter(Boolean);

  /* ===============================
     DEMAND FORECASTING
  =============================== */
  const demandAI = items.map((i) => ({
    name: i.name,
    forecast: Math.round((i.weekly_sales || 0) * 1.1),
  }));
/* ===============================
   💰 PROFIT TREND DATA (NEW)
================================= */
const profitData = (salesData || []).map((s) => {
  const revenue = Number(s.revenue || 0);
  const estimatedProfit = revenue * ((avgMargin || 0) / 100);

  return {
    date: s.date,
    profit: Math.round(estimatedProfit),
  };
});
  /* ===============================
     AI INSIGHTS ENGINE
  =============================== */
  const aiAlerts = [];
  const aiRecommendations = [];



// EXISTING ALERTS (if you have them)
profitLeakAlerts.forEach((i) => {
  if (i.severity.includes("HIGH")) {
    aiAlerts.unshift(`🚨 ${i.name} severe margin issue`);
  }
});

  profitLeakAlerts.forEach((i) => {
    if (i.severity.includes("HIGH")) {
      aiAlerts.unshift(`🚨 ${i.name} severe margin issue`);
      aiRecommendations.push(`Increase price of ${i.name}`);
    }
  });

  inventoryInsights.forEach((i) => {
  // 🚨 Expiring soon
  if (i.expiryStatus === "EXPIRING SOON ⚠️") {
    aiAlerts.unshift(`⚠️ ${i.name} is about to expire`);
    aiRecommendations.push(`Use or discount ${i.name} immediately`);
  }

  // 🚨 Already expired
  if (i.expiryStatus === "EXPIRED 🚨") {
    aiAlerts.unshift(`🚨 ${i.name} has expired`);
    aiRecommendations.push(`Remove ${i.name} from inventory`);
  }

  // 🚨 Low stock
  if (i.status === "LOW ⚠️") {
    aiRecommendations.push(`Restock ${i.name} soon`);
  }

  // 🚨 Critical stock
  if (i.status === "CRITICAL 🚨") {
    aiAlerts.unshift(`🚨 ${i.name} is about to run out`);
    aiRecommendations.push(`Order more ${i.name} immediately`);
  }

  // 🔥 POWER COMBO (this is the selling feature)
  if (
    i.expiryStatus === "EXPIRING SOON ⚠️" &&
    i.status === "LOW ⚠️"
  ) {
    aiAlerts.unshift(`🔥 ${i.name} risk: waste + shortage`);
    aiRecommendations.push(
      `Adjust ordering for ${i.name} to prevent loss`
    );
  }
});


// profit leaks (keep this)
profitLeakAlerts.forEach((i) => {
  if (i.severity.includes("HIGH")) {
    aiAlerts.unshift(`🚨 ${i.name} severe margin issue`);
    aiRecommendations.push(`Increase price of ${i.name}`);
  }
});

// 🔥 NEW upgraded inventory AI
inventoryInsights.forEach((i) => {
  // (new logic here)
});

const topActions = aiRecommendations.slice(0, 3);

/* ===============================
   🤖 AI SCORE ENGINE
================================= */
let score = 100;

// penalize high food cost
if (foodCostPercentage > 40) score -= 25;
else if (foodCostPercentage > 30) score -= 10;

// penalize profit leaks
score -= profitLeaks.length * 5;

// ✅ SAFE strong day penalty
if (!isStrongDay && avgRevenue > 0 && bestDay) {
  const penalty = Math.round(
    ((avgRevenue - (bestDay.revenue || 0)) / avgRevenue) * 15
  );
  score -= Math.max(0, penalty); // prevent negative weirdness
}

// clamp score
score = Math.max(0, Math.min(100, score));

/* ===============================
   💰 PROFIT LOSS ESTIMATION
================================= */

// estimate loss from profit leaks
const estimatedLoss = profitLeaks.reduce((total, item) => {
  const weeklyLoss = (item.price || 0) * 0.2 * (item.weekly_sales || 0);
  return total + weeklyLoss;
}, 0);

// monthly projection
const monthlyLoss = Math.round(estimatedLoss * 4);



/* ===============================
   💸 LABOR LOSS ESTIMATION (ADDED)
================================= */

const laborLoss = laborByDay.reduce((total, d) => {
  if (d.percent > 30) {
    const excess = d.labor - (d.revenue * 0.30);
    return total + (excess > 0 ? excess : 0);
  }
  return total;
}, 0);
const monthlyLaborLoss = Math.round(laborLoss * 4.33); // average weeks per month
const worstDay = laborByDay.reduce(
  (worst, curr) => (curr.percent > worst.percent ? curr : worst),
  { percent: 0 }
);

 const handleUpgrade = () => {
  window.location.href = "/pricing";
};
/* ===============================
   📅 TIME FILTER ENGINE
================================= */

const now = new Date();

// THIS WEEK
const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay());
startOfWeek.setHours(0, 0, 0, 0);

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 7);

// LAST WEEK
const lastWeekStart = new Date(startOfWeek);
lastWeekStart.setDate(startOfWeek.getDate() - 7);

const lastWeekEnd = new Date(startOfWeek);

// FILTER DATA
const thisWeekData = (salesData || []).filter((s) => {
  if (!s?.date) return false;

  const d = new Date(s.date);
  if (isNaN(d)) return false;

  return d >= startOfWeek && d < endOfWeek;
});

const lastWeekData = (salesData || []).filter((s) => {
  if (!s?.date) return false;

  const d = new Date(s.date);
  if (isNaN(d)) return false;

  return d >= lastWeekStart && d < lastWeekEnd;
});

// REVENUE CALCULATOR
const getRevenue = (data) =>
  data.reduce((sum, d) => sum + Number(d.revenue || 0), 0);

// TOTALS
const thisWeekRevenue = getRevenue(thisWeekData);
const lastWeekRevenue = getRevenue(lastWeekData);

// GROWTH %
// GROWTH %
const weeklyGrowth = lastWeekRevenue
  ? (((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(1)
  : 0;

// SAFE growth fallback
const growthRate =
  typeof weeklyGrowth !== "undefined" ? weeklyGrowth : 0;
/* ===============================
   ☕ COFFEE SHOP AI ENGINE
================================= */

// Example coffee menu data
const coffeeData = [
  { name: "Latte", price: 6, cost: 1.8, sold: 320 },
  { name: "Cappuccino", price: 5, cost: 1.5, sold: 210 },
  { name: "Cold Brew", price: 6.5, cost: 1.2, sold: 180 },
  { name: "Mocha", price: 6.5, cost: 2.5, sold: 90 },
];

// Calculate margins
const coffeeMetrics = coffeeData.map((item) => {
  const profit = item.price - item.cost;
  const margin = (profit / item.price) * 100;

  return {
    ...item,
    profit,
    margin,
  };
});

// Best & worst items
const bestCoffee = [...coffeeMetrics].sort((a, b) => b.margin - a.margin)[0];
const worstCoffee = [...coffeeMetrics].sort((a, b) => a.margin - b.margin)[0];

// Waste estimate (simple version)
const estimatedMilkWaste = 120; // replace later with real data

// AI Alerts
const coffeeAlerts = [];

if (worstCoffee.margin < 60) {
  coffeeAlerts.push(`🚨 ${worstCoffee.name} has low margin (${worstCoffee.margin.toFixed(1)}%)`);
}

if (estimatedMilkWaste > 100) {
  coffeeAlerts.push(`🥛 High milk waste detected ($${estimatedMilkWaste}/month)`);
}

// AI Recommendations
const coffeeRecommendations = [];

coffeeRecommendations.push(`Promote ${bestCoffee.name} (highest margin item)`);

if (worstCoffee.margin < 60) {
  coffeeRecommendations.push(`Increase price of ${worstCoffee.name}`);
  if (peakHour.sales > 500) {
  coffeeRecommendations.push(
    `Increase staffing during ${peakHour.hour} to handle demand`
  );
}

if (slowHour.sales < 250) {
  coffeeRecommendations.push(
    `Run a promotion during ${slowHour.hour} to boost traffic`
  );
}
}
/* ===============================
   ☕ COFFEE SALES TREND
================================= */

// Example hourly sales data (replace later with real data)
 const coffeeHourlyData = [
  { hour: "6AM", sales: 120 },
  { hour: "7AM", sales: 340 },
  { hour: "8AM", sales: 520 },
  { hour: "9AM", sales: 610 },
  { hour: "10AM", sales: 450 },
  { hour: "11AM", sales: 300 },
  { hour: "12PM", sales: 280 },
  { hour: "1PM", sales: 260 },
  { hour: "2PM", sales: 200 },
  { hour: "3PM", sales: 180 },
  { hour: "4PM", sales: 160 },
  { hour: "5PM", sales: 140 },
  { hour: "6PM", sales: 120 },
  { hour: "7PM", sales: 100 },
  { hour: "8PM", sales: 80 },
  { hour: "9PM", sales: 60 },
];
/* ===============================
   ⏰ PEAK HOURS AI
================================= */

const peakHour = [...coffeeHourlyData].sort((a, b) => b.sales - a.sales)[0];
const slowHour = [...coffeeHourlyData].sort((a, b) => a.sales - b.sales)[0];

// AI insights
const peakHourInsights = [];

peakHourInsights.push(
  `🚀 Peak hour is ${peakHour.hour} with $${peakHour.sales} in sales`
);

if (peakHour.sales > 500) {
  peakHourInsights.push(
    `💡 Add 1 extra barista during ${peakHour.hour} to increase speed + revenue`
  );
}

peakHourInsights.push(
  `🐢 Slowest hour is ${slowHour.hour} — consider promotions or reducing staff`
);
/* ===============================
   👨‍🍳 COFFEE LABOR vs SALES AI
================================= */

// hourly labor cost (example)
const laborHourlyData = [
  { hour: "6AM", labor: 40 },
  { hour: "7AM", labor: 60 },
  { hour: "8AM", labor: 80 },
  { hour: "9AM", labor: 80 },
  { hour: "10AM", labor: 70 },
  { hour: "11AM", labor: 60 },
  { hour: "12PM", labor: 60 },
  { hour: "1PM", labor: 55 },
  { hour: "2PM", labor: 50 },
  { hour: "3PM", labor: 50 },
  { hour: "4PM", labor: 45 },
  { hour: "5PM", labor: 45 },
  { hour: "6PM", labor: 40 },
  { hour: "7PM", labor: 35 },
  { hour: "8PM", labor: 30 },
  { hour: "9PM", labor: 30 },
];



// 1. DATA
const laborVsSales = (coffeeHourlyData || []).map((s) => {
  const laborMatch = (laborHourlyData || []).find(l => l.hour === s.hour);

  const labor = laborMatch ? laborMatch.labor : 0;
  const revenue = Number(s.sales || 0);

  const percent = revenue > 0 ? (labor / revenue) * 100 : 0;

  return {
    hour: s.hour,
    revenue,
    labor,
    percent: Number(percent.toFixed(1))
  };
});
const worstLaborHour = [...laborVsSales].sort(
  (a, b) => b.percent - a.percent
)[0];

const bestLaborHour = [...laborVsSales].sort(
  (a, b) => a.percent - b.percent
)[0];
// 2. AI
const laborAI = [];

laborVsSales.forEach((h) => {
  if (h.percent > 35) {
    laborAI.push(`🚨 ${h.hour}: Labor too high (${h.percent}%) → cut staff`);
  }

  if (h.percent < 20 && h.revenue > 400) {
    laborAI.push(`⚡ ${h.hour}: Understaffed → add worker`);
  }
});

/* ===============================
   👨‍🍳 AI STAFFING SCORE (NEW)
================================= */

let staffingScore = 100;

laborVsSales.forEach((h) => {
  if (h.percent > 35) staffingScore -= 10; // overstaffed
  if (h.percent < 20 && h.revenue > 400) staffingScore -= 8; // understaffed
});

// clamp
staffingScore = Math.max(0, Math.min(100, staffingScore));
/* ===============================
   💰 MONEY LOST CALCULATOR
================================= */

let totalMoneyLost = 0;

const lossBreakdown = laborVsSales.map((h) => {
  let loss = 0;

  if (h.percent > 35) {
    loss = h.labor * 0.25;
  }

  if (h.percent < 20 && h.revenue > 400) {
    loss = h.revenue * 0.15;
  }

  totalMoneyLost += loss;

  return {
    hour: h.hour,
    loss: Number(loss.toFixed(0)),
  };
});
const Section = ({ title, id, children }) => {
  const isOpen = openSection === id;

  return (
    <div style={{ marginTop: "20px" }}>
      <div
        onClick={() => setOpenSection(isOpen ? null : id)}
        style={{
          cursor: "pointer",
          background: "#111",
          color: "white",
          padding: "12px 16px",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <strong>{title}</strong>
        <span>{isOpen ? "−" : "+"}</span>
      </div>

      {isOpen && (
        <div style={{
          padding: "15px",
          background: "#f3f4f6",
          borderRadius: "10px",
          marginTop: "8px"
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "3fr 1fr",
        gap: "30px",
        padding: "20px",
        background: "#f9fafb",
      }}
    >
    
      {/* LEFT SIDE */}
      <div>
        <div style={{ marginBottom: "10px" }}>
 
</div>
  {/* NAME */}
  <h1 style={{ marginBottom: "5px" }}>Serven Dashboard</h1>
  <div style={{
  display: "flex",
  gap: "10px",
  marginTop: "20px",
  marginBottom: "20px"
}}>
  
  {["Overview", "AI", "Labor", "Inventory", ...(businessType === "Coffee" ? ["Coffee"] : [])].map((tab) => (
  <button
    key={tab}
    onClick={() => setActiveTab(tab)}
    style={{
      padding: "8px 16px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      background: activeTab === tab ? "#4f46e5" : "#e5e7eb",
      color: activeTab === tab ? "white" : "black",
      fontWeight: "600"
    }}
  >
    {tab}
  </button>
))}
</div>
  <p style={{ color: "#297c3b", marginTop: 0}}> AI Restaurant Intelligence </p>
 {/* ===============================
   🤖 AI INTELLIGENCE DROPDOWN (PRO)
================================= */}

<div style={{
  marginTop: "25px",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
}}>
  {/* HEADER */}
  <div
    onClick={() =>
      setOpenSection(openSection === "ai-intel" ? null : "ai-intel")
    }
    style={{
      background: "#e5e7eb00",
      color: "black",
      padding: "16px 20px",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}
  >
    <strong>🤖 AI Intelligence</strong>
    <span>{openSection === "ai-intel" ? "−" : "+"}</span>
  </div>

  {/* CONTENT */}
  {openSection === "ai-intel" && (
    <div style={{
      background: "#f9fafb",
      padding: "20px"
    }}>
      
      {/* SCORE */}
      <div style={{
        marginBottom: "20px"
      }}>
        <h3>Overall Score</h3>
        <p style={{ fontSize: "32px", fontWeight: "700" }}>
          {score}/100
        </p>
      </div>

      {/* STAFFING */}
      <div style={{ marginBottom: "15px" }}>
        👨‍🍳 Staffing Score: <strong>{staffingScore}</strong>
      </div>

      {/* FOOD COST */}
      <div style={{ marginBottom: "15px" }}>
        💰 Food Cost: <strong>{foodCostPercentage.toFixed(1)}%</strong>
      </div>

      {/* PROFIT LEAKS */}
      <div style={{ marginBottom: "15px" }}>
        🚨 Profit Leaks: <strong>{profitLeaks.length}</strong>
      </div>

      {/* MONEY LOST */}
      <div style={{
        marginTop: "20px",
        padding: "15px",
        borderRadius: "12px",
        background: totalMoneyLost > 0 ? "#fee2e2" : "#dcfce7"
      }}>
        💸 Losing: <strong>${Number(totalMoneyLost).toLocaleString()}</strong>
      </div>

    </div>
  )}
</div>
{activeTab === "coffee" && (
  <>
    <h2 style={{ marginTop: "30px" }}>☕ Coffee Shop Intelligence</h2>

    {/* KPI CARDS */}
    <div style={{
      display: "flex",
      gap: "20px",
      marginTop: "20px",
      flexWrap: "wrap"
    }}>
      <div style={{
        flex: "1",
        minWidth: "180px",
        background: "#111",
        color: "white",
        padding: "20px",
        borderRadius: "16px"
      }}>
        <h4>Top Drink</h4>
        <p>{bestCoffee.name}</p>
      </div>

      <div style={{
        flex: "1",
        minWidth: "180px",
        background: "#16a34a",
        color: "white",
        padding: "20px",
        borderRadius: "16px"
      }}>
        <h4>Best Margin</h4>
        <p>{bestCoffee.margin.toFixed(1)}%</p>
      </div>

      <div style={{
        flex: "1",
        minWidth: "180px",
        background: "#ef4444",
        color: "white",
        padding: "20px",
        borderRadius: "16px"
      }}>
        <h4>Worst Item</h4>
        <p>{worstCoffee.name}</p>
      </div>
    </div>
    <div style={{
  background: totalMoneyLost > 0 ? "#7f1d1d" : "#065f46",
  color: "white",
  padding: "25px",
  borderRadius: "16px",
  marginTop: "25px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
}}>
  <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>
    💸 Money Lost Today
  </h3>

  <p style={{
    fontSize: "36px",
    fontWeight: "700",
    margin: "10px 0"
  }}>
    ${Number(totalMoneyLost || 0).toLocaleString()}
  </p>

  <p style={{ opacity: 0.8 }}>
    {totalMoneyLost > 0
      ? "From staffing inefficiencies"
      : "You're fully optimized ✅"}
  </p>
</div>


{lossBreakdown
  .sort((a, b) => b.loss - a.loss)
  .slice(0, 3)
  .map((h, i) => (
    <div key={i} style={{
      padding: "10px",
      marginBottom: "8px",
      borderRadius: "10px",
      background: "#fee2e2"
    }}>
      ⏰ {h.hour} → Losing ${h.loss}
    </div>
))}
<Section title="📈 Coffee Sales" id="coffee-sales">
  <LineChart width={700} height={300} data={coffeeHourlyData}>
    <XAxis dataKey="hour" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="sales" stroke="#16a34a" />
  </LineChart>
</Section>

<Section title="⏰ Peak Hour Intelligence" id="coffee-peak">
  {peakHourInsights.map((insight, i) => (
    <p key={i}>{insight}</p>
  ))}
</Section>

<Section title="💸 Labor vs Sales" id="coffee-labor">
  {laborVsSales.map((h, i) => (
    <p key={i}>
      {h.hour} — {h.percent}%
    </p>
  ))}
</Section>
{/* KPI */}
<div style={{
  display: "flex",
  gap: "20px",
  marginTop: "15px",
  flexWrap: "wrap"
}}>
  <div style={{
    background: "#ef4444",
    color: "white",
    padding: "15px",
    borderRadius: "12px"
  }}>
    <h4>Worst Hour</h4>
    <p>{worstLaborHour.hour} ({worstLaborHour.percent}%)</p>
  </div>

  <div style={{
    background: "#16a34a",
    color: "white",
    padding: "15px",
    borderRadius: "12px"
  }}>
    <h4>Best Hour</h4>
    <p>{bestLaborHour.hour} ({bestLaborHour.percent}%)</p>
  </div>
</div>

{/* BREAKDOWN */}
<h4 style={{ marginTop: "20px" }}>Hourly Efficiency</h4>

{laborVsSales.map((h, i) => (
  <div key={i} style={{
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "10px",
    background:
      h.percent > 35
        ? "#fee2e2"
        : h.percent < 20
        ? "#dcfce7"
        : "#fef9c3",
  }}>
    <strong>{h.hour}</strong> — ${h.revenue} revenue  
    <br />
    👨‍🍳 Labor: ${h.labor} | {h.percent}%
  </div>
))}

{/* AI INSIGHTS */}
<h4 style={{ marginTop: "20px" }}>🧠 AI Insights</h4>

{laborAI.length === 0 && <p>Everything optimized ✅</p>}
{laborAI.map((a, i) => (
  <div key={i} style={{
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "10px",
    background: "#eef2ff"
  }}>
    {a}
  </div>
))}
    {/* MENU PERFORMANCE */}
    <h3 style={{ marginTop: "30px" }}>📊 Drink Performance</h3>

    {coffeeMetrics.map((item, idx) => (
      <div key={idx} style={{
        padding: "10px",
        marginBottom: "8px",
        borderRadius: "10px",
        background:
          item.margin > 70
            ? "#dcfce7"
            : item.margin < 60
            ? "#fee2e2"
            : "#fef9c3",
      }}>
        <strong>{item.name}</strong> — {item.margin.toFixed(1)}% margin  
        <br />
        💰 Profit: ${item.profit.toFixed(2)} | Sold: {item.sold}
      </div>
    ))}

    {/* AI ALERTS */}
    <h3 style={{ marginTop: "30px" }}>🚨 AI Alerts</h3>
    {coffeeAlerts.length === 0 && <p>No issues detected ✅</p>}
    {coffeeAlerts.map((a, i) => <p key={i}>{a}</p>)}

    {/* AI RECOMMENDATIONS */}
    <h3 style={{ marginTop: "20px" }}>💡 Recommendations</h3>
    {coffeeRecommendations.map((r, i) => <p key={i}>{r}</p>)}
  </>
)}
{activeTab === "ai" && (
  <>
    <h2 style={{ marginTop: "30px" }}>🧠 AI Intelligence</h2>

    <Section title="🔥 Pro AI Insights" id="ai-pro">

     {/* ===============================
   📊 PERFORMANCE INSIGHTS DROPDOWN
================================= */}

<div style={{ marginTop: "30px" }}>
  {aiPriceRecommendations.length > 0 && (
  <div
    style={{
      marginBottom: "20px",
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

        <div style={{ marginTop: "6px", color: "#e0e7ff", fontSize: "13px" }}>
          👉 {rec.suggestion}
        </div>
      </div>
    ))}
  </div>
)}
  {/* PREMIUM WHITE TAB */}
  <div
    onClick={() => setShowPerformance(!showPerformance)}
    style={{
      cursor: "pointer",
      background: "linear-gradient(white, #f9fafb)", // 🔥 premium white
      color: "#111",
      padding: "15px",
      borderRadius: "12px",
      fontWeight: "600",
      border: "1px solid #e5e7eb",
      boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
      transition: "all 0.2s ease"
    }}
  >
    📊 Performance Insights {showPerformance ? "▲" : "▼"}
  </div>

  {/* DROPDOWN CONTENT */}
  {showPerformance && (
    <div style={{ marginTop: "15px" }}>

      {/* PERFORMANCE TEXT */}
      <p>🔥 Best Day: {bestDay.day} (${bestDay.revenue.toLocaleString()})</p>

      <p>
        📈 Weekly Growth: 
        <span style={{ color: growthRate >= 0 ? "green" : "red" }}>
          {growthRate}%
        </span>
      </p>

      <p>
        {isStrongDay
          ? "🚀 You had a strong sales day!"
          : "⚠️ No strong sales days detected"}
      </p>

      {/* WEEKLY REVENUE */}
      <h2 style={{ marginTop: "40px" }}>Weekly Revenue</h2>

      <div style={{ marginTop: "30px"}}>
        <p>🔥 Best Day: {bestDay.day}</p>
        <p>📈 Growth: {growthRate}%</p>
      </div>

      {/* YOUR ORIGINAL GRAPH (UNCHANGED) */}
      <LineChart width={700} height={300} data={revenueData}>
        <XAxis dataKey="day" />
        <YAxis domain={[0, 25000]} />
        <Tooltip />

        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#4f46e5"
          strokeWidth={3}
          dot={{ r: 4 }}
        />
      </LineChart>

    </div>
  )}

        <h3>AI Score</h3>
        <p style={{ fontSize: "32px", fontWeight: "700" }}>
          {score}/100
        </p>
      </div>

      {/* STAFFING SCORE */}
      <div style={{
        background: "#1e3a8a",
        color: "white",
        padding: "20px",
        borderRadius: "16px",
        marginBottom: "15px"
      }}>
        <h3>Staffing Efficiency</h3>
        <p style={{ fontSize: "28px", fontWeight: "700" }}>
          {staffingScore}/100
        </p>
      </div>

      {/* RISK */}
      <div style={{
        background: "#7f1d1d",
        color: "white",
        padding: "20px",
        borderRadius: "16px",
        marginBottom: "15px"
      }}>
        <h3>Risk Level</h3>
        <p>{riskLevel}</p>
      </div>

      {/* ACTIONS */}
      <div style={{
        background: "#065f46",
        color: "white",
        padding: "20px",
        borderRadius: "16px"
      }}>
        <h3>Top Actions</h3>
        {topActions.map((a, i) => (
          <p key={i}>• {a}</p>
        ))}
      </div>

    </Section>
  </>
)}
  <>
      {/* KPI */}
<div style={{
  display: "flex",
  gap: "20px",
  marginTop: "25px",
  flexWrap: "wrap"
}}>
  
  {/* CARD */}
  <div style={{
    flex: "1",
    minWidth: "180px",
    background: "#1c9e18",
    color: "white",
    padding: "20px",
    borderRadius: "16px"
  }}>
    <h4>Total Revenue</h4>
    <p>${totalRevenue.toLocaleString()}</p>
  </div>

  {/* CARD */}
  <div style={{
    flex: "1",
    minWidth: "180px",
    background: "#5097da",
    color: "black",
    padding: "20px",
    borderRadius: "16px"
  }}>
    <h4>Food Cost %</h4>
    <p>{foodCostPercentage.toFixed(1)}%</p>
  </div>

  {/* CARD */}
  <div style={{
    flex: "1",
    minWidth: "180px",
    background: "#ef4444",
    color: "white",
    padding: "20px",
    borderRadius: "16px"
  }}>
    <h4>Profit Leaks</h4>
    <p>{profitLeaks.length}</p>
  </div>
</div>
   
{/* ===============================
   📊 SMART INSIGHTS UI
================================= */}

<h2 style={{ marginTop: "30px" }}>📊 Performance Insights</h2>

<p>🔥 Best Day: {bestDay.day} (${bestDay.revenue.toLocaleString()})</p>

<p>
  📈 Weekly Growth: 
  <span style={{ color: growthRate >= 0 ? "green" : "red" }}>
    {growthRate}%
  </span>
</p>

<p>
  {isStrongDay
    ? "🚀 You had a strong sales day!"
    : "⚠️ No strong sales days detected"}
</p>

{/* ===============================
   📈 WEEKLY REVENUE GRAPH
   PUT INSIDE return()
================================= */}

<h2 style={{ marginTop: "40px" }}>Weekly Revenue</h2>

<div style={{ marginTop: "30px"}}>
  <p>🔥 Best Day: {bestDay.day}</p>
  <p>📈 Growth: {growthRate}%</p>
</div>

<LineChart width={700} height={300} data={revenueData}>
  <XAxis dataKey="day" />
  <YAxis domain={[0, 25000]} />
  <Tooltip />

  <Line
    type="monotone"
    dataKey="revenue"
    stroke="#4f46e5"
    strokeWidth={3}
    dot={{ r: 4 }}
  />
</LineChart>
</> 
{activeTab === "labor" && (
  <div>
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
        Monitor labor cost, staffing efficiency, shift performance, overstaffing risk,
        and AI-powered schedule recommendations.
      </p>
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
        title="Monthly Labor Loss"
        value={`$${Number(monthlyLaborLoss || 0).toLocaleString()}`}
        subtext="Estimated profit lost from overstaffing"
      />

      <GlassCard
        title="Worst Labor Day"
        value={worstDay?.day || "Needs data"}
        subtext={
          worstDay?.percent
            ? `${Number(worstDay.percent).toFixed(1)}% labor cost`
            : "Upload labor data"
        }
      />

      <GlassCard
        title="Labor Cost Risk"
        value={
          worstDay?.percent > 30
            ? "High"
            : worstDay?.percent > 25
            ? "Watch"
            : "Stable"
        }
        subtext="AI staffing risk rating"
      />

      <GlassCard
        title="Schedule Suggestions"
        value={laborRecommendations?.length || 0}
        subtext="AI labor recommendations detected"
      />
    </div>

    {plan === "pro" ? (
      <>
        {/* LABOR COST TREND */}
        <div
          style={{
            marginBottom: "26px",
            padding: "22px",
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
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
            Labor Cost % by Day
          </div>

          <LineChart width={700} height={300} data={laborChartData}>
            <XAxis dataKey="day" />
            <YAxis domain={[0, 50]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="percent"
              stroke="#ef4444"
              strokeWidth={3}
            />
          </LineChart>
        </div>

        {/* DAILY STAFFING STATUS */}
        <div
          style={{
            marginBottom: "26px",
            padding: "22px",
            borderRadius: "22px",
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
            Daily Staffing Status
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {laborByDay.map((d, idx) => (
              <div
                key={idx}
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
                <div style={{ color: "white", fontWeight: "900" }}>
                  {d.day}
                </div>

                <div
                  style={{
                    color:
                      d.percent > 30
                        ? "#f87171"
                        : d.percent < 20
                        ? "#fbbf24"
                        : "#86efac",
                    fontWeight: "900",
                  }}
                >
                  {d.percent}% — {d.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SMART SCHEDULE SUGGESTIONS */}
        <div
          style={{
            marginBottom: "26px",
            padding: "22px",
            borderRadius: "22px",
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
            Smart Schedule Suggestions
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {laborRecommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(148,163,184,0.12)",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      </>
    ) : (
      <div
        style={{
          marginTop: "20px",
          padding: "25px",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
          color: "white",
          borderRadius: "22px",
          border: "1px solid rgba(96,165,250,0.16)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>🚨 You're Losing Money on Labor</h3>

        <p style={{ fontSize: "28px", fontWeight: "900" }}>
          ${Number(monthlyLaborLoss || 0).toLocaleString()}/month
        </p>

        <p style={{ color: "#9ca3af" }}>
          Most restaurants overspend 15–30% on labor without realizing it.
        </p>

        <button
          onClick={() => (window.location.href = "/pricing")}
          style={{
            marginTop: "15px",
            width: "100%",
            background: "#d4af37",
            color: "black",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            fontWeight: "900",
            cursor: "pointer",
          }}
        >
          Unlock Labor AI →
        </button>
      </div>
    )}
  </div>
)}
{/* ================= STARTER (VISIBLE TO ALL USERS) ================= */}
  <div style={{ marginTop: "40px" }}>
  <h2 style={{ marginBottom: "20px" }}>📊 Core Dashboard</h2>
{/* FILTER BAR (VISIBLE UI) */}
<div style={{
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
  background: "white",
  padding: "12px",
  borderRadius: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
}}>

  <select
  value={timeFilter}
  onChange={(e) => setTimeFilter(e.target.value)}
  style={{
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    fontWeight: "500",
    cursor: "pointer"
  }}
>
  <option value="today">Today</option>
  <option value="week">This Week</option>
  <option value="month">This Month</option>
</select>
  <select
  value={categoryFilter}
  onChange={(e) => setCategoryFilter(e.target.value)}
  style={{
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    fontWeight: "500",
    cursor: "pointer"
  }}
>
  <option value="all">All Items</option>
  <option value="coffee">Coffee</option>
  <option value="alcohol">Alcohol</option>
  <option value="food">Food</option>
</select>

</div>
  {/* KPI */}
  <Section title="📊 KPI Dashboard" id="kpi">
    <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
      
      <div style={{
        flex: "1",
        minWidth: "150px",
        background: "white",
        padding: "15px",
        borderRadius: "14px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
      }}>
        <p style={{ fontSize: "12px", color: "#6b7280" }}>Revenue</p>
        <h3>${totalRevenue.toLocaleString()}</h3>
      </div>

      <div style={{
        flex: "1",
        minWidth: "150px",
        background: "white",
        padding: "15px",
        borderRadius: "14px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
      }}>
        <p style={{ fontSize: "12px", color: "#6b7280" }}>Food Cost</p>
        <h3>{foodCostPercentage.toFixed(1)}%</h3>
      </div>

      <div style={{
        flex: "1",
        minWidth: "150px",
        background: "white",
        padding: "15px",
        borderRadius: "14px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
      }}>
        <p style={{ fontSize: "12px", color: "#6b7280" }}>Profit Leaks</p>
        <h3>{profitLeaks.length}</h3>
      </div>

    </div>
  </Section>


  {/* Revenue */}
  <Section title="📈 Revenue Analytics" id="revenue">
    <div style={{
      background: "white",
      padding: "15px",
      borderRadius: "14px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
    }}>
      <p>Weekly revenue trends shown above</p>
    </div>
  </Section>

  {/* Food Cost */}
  <Section title="🥗 Food Cost Monitoring" id="food">
    <div style={{
      background: "white",
      padding: "15px",
      borderRadius: "14px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
    }}>
      <p>
        {foodCostPercentage.toFixed(1)}% — {foodCostStatus}
      </p>
    </div>
  </Section>

  {/* Profitability */}
  <Section title="💰 Menu Profitability" id="profit">
    <div style={{
      background: "white",
      padding: "15px",
      borderRadius: "14px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
    }}>
      {profitability.map((i, idx) => (
        <p key={idx}>
          {i.name} — {(Number(i.margin) || 0).toFixed(1)}%
        </p>
      ))}
    </div>
  </Section>

  {/* Forecast */}
  <Section title="🔮 Weekly Forecasting" id="forecast">
    <div style={{
      background: "white",
      padding: "15px",
      borderRadius: "14px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
    }}>
      {demandAI.map((i, idx) => (
        <p key={idx}>{i.name} → {i.forecast}</p>
      ))}

      {plan === "starter" && (
        <button
          onClick={() => setShowUpgrade(true)}
          style={{
            background: "#4f46e5",
            color: "white",
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            marginTop: "15px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          🚀 Unlock Profit Insights
        </button>
      )}
    </div>
  </Section>

  {/* AI Preview */}
  <Section title="🤖 AI Recommendations (Preview)" id="ai-preview">
    <div style={{
      background: "#f9fafb",
      padding: "15px",
      borderRadius: "14px",
      border: "1px dashed #d1d5db"
    }}>
      <p style={{ color: "#6b7280" }}>
        Optimize pricing, reduce waste, maximize profit
      </p>
    </div>
  </Section>

<Section title="💸 Money Loss Detection" id="money-loss">

  {plan !== "pro" ? (
    <div style={{
      padding: "15px",
      borderRadius: "10px",
      background: "#fee2e2"
    }}>
      <p>Upgrade to unlock daily profit loss insights</p>

      <button
        onClick={handleUpgrade}
        style={{
          marginTop: "10px",
          background: "#4f46e5",
          color: "white",
          padding: "8px 14px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer"
        }}
      >
        Upgrade Now
      </button>
    </div>
  ) : (
    <>
      {/* REAL MONEY LOST CARD */}
      <div style={{
        background: totalMoneyLost > 0 ? "#7f1d1d" : "#065f46",
        color: "white",
        padding: "25px",
        borderRadius: "16px",
        marginTop: "25px"
      }}>
        <h3>💸 Money Lost Today</h3>

        <p style={{
          fontSize: "36px",
          fontWeight: "700"
        }}>
          ${Number(totalMoneyLost || 0).toLocaleString()}
        </p>

        <p>
          {totalMoneyLost > 0
            ? "From staffing inefficiencies"
            : "You're fully optimized ✅"}
        </p>
      </div>

      {/* WORST HOURS */}
      <h4 style={{ marginTop: "20px" }}>
        Worst Hours Losing Money
      </h4>

      {lossBreakdown
        .sort((a, b) => b.loss - a.loss)
        .slice(0, 3)
        .map((h, i) => (
          <div key={i} style={{
            padding: "10px",
            marginBottom: "8px",
            borderRadius: "10px",
            background: "#fee2e2"
          }}>
            ⏰ {h.hour} → Losing ${h.loss}
          </div>
        ))}
    </>
  
  )}


</Section>
</div>

{/*========= LOCKED FEATURES ================= */}

{plan !== "starter"&& (
  <>
    <h2 style={{ marginTop: "40px" }}>🚀 Advanced AI (Locked)</h2>

    {/* Growth */}
    <h3>Inventory + Expiration AI</h3>
{inventoryInsights.map((i, idx) => (
  <div key={idx} style={{
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "10px",
    background:
      i.expiryStatus === "EXPIRED 🚨"
        ? "#fee2e2"
        : i.expiryStatus === "EXPIRING SOON ⚠️"
        ? "#fef9c3"
        : "#dcfce7"
  }}>
    <strong>{i.name}</strong> — {i.status} <br />
    ⏳ {i.expiryStatus}
  </div>
))}

    <h3>Menu Engineering Matrix</h3>
    {menuActions.map((i, idx) => (
      <p key={idx}>{i.name} — {i.action}</p>
    ))}

    <h3>Profit Leak Detection</h3>
    {profitLeakAlerts.map((i, idx) => (
      <p key={idx}>{i.name} — {i.severity}</p>
    ))}

    <h3>AI Alerts</h3>
    {aiAlerts.map((alert, idx) => (
      <p key={idx}>{alert}</p>
    ))}

    {/* Pro */}
    <h3>AI Recommendations</h3>
    {aiRecommendations.map((rec, idx) => (
      <p key={idx}>{rec}</p>
    ))}

    <h3>Supplier Monitoring</h3>
    {supplierTrends.map((i, idx) => (
      <p key={idx}>{i.name} — {i.status}</p>
    ))}

    <h3>Advanced Forecasting</h3>
    {demandAI.map((i, idx) => (
      <p key={idx}>{i.name} → {(i.forecast * 1.2).toFixed(0)}</p>
    ))}
  </>
)}
        {/* AI MODULES */}
        {(plan === "growth" || plan === "pro") && (
          <>
            <h2 style={{ marginTop: "40px" }}>🧠 AI Modules</h2>

            <h3>Food Cost Percentage Analysis</h3>
            <p>{foodCostPercentage}% ({foodCostStatus})</p>

            <h3>Menu Item Profitability Engine</h3>
            {profitability.map((i, idx) => (
              <p key={idx}>{i.name} — {(Number(i.margin) || 0).toFixed(1)}%</p>
            ))}

            <h3>Inventory + Expiration AI</h3>
{inventoryInsights.map((i, idx) => (
  <div key={idx} style={{
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "10px",
    background:
      i.expiryStatus === "EXPIRED 🚨"
        ? "#fee2e2"
        : i.expiryStatus === "EXPIRING SOON ⚠️"
        ? "#fef9c3"
        : "#dcfce7"
  }}>
    <strong>{i.name}</strong> — {i.status} <br />
    ⏳ {i.expiryStatus}
  </div>
))}

            <h3>Waste Detection System</h3>
            {wasteWithCost.map((i, idx) => (
              <p key={idx}>{i.name} — ${i.cost}</p>
            ))}

            <h3>Profit Leak Detection</h3>
            {profitLeakAlerts.map((i, idx) => (
              <p key={idx}>{i.name} — {i.severity}</p>
            ))}

            <h3>Menu Optimization Engine</h3>
            {menuActions.map((i, idx) => (
              <p key={idx}>{i.name} — {i.action}</p>
            ))}

            <h3>Supplier Price Monitoring</h3>
            {supplierTrends.map((i, idx) => (
              <p key={idx}>{i.name} — {i.status}</p>
            ))}

           
          </>
        )}

</div>
      {/* RIGHT PANEL */}
      <div style={{
        background: "#111",
        color: "white",
        padding: "25px",
        borderRadius: "20px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        height: "fit-content",
        position: "sticky",
        top: "20px"
      }}>
        <h2>🧠 AI Insights</h2>
        {plan === "starter" && (
  <div style={{
    marginTop: "15px",
    padding: "15px",
    background: "#fee2e2",
    borderRadius: "12px",
    border: "1px solid #fecaca"
  
  }}>
  
    <h4 style={{ marginBottom: "5px", color: "#991b1b" }}>
      🚨 Estimated Profit Loss
    </h4>

    <p style={{ fontSize: "18px", fontWeight: "600" }}>
      ${monthlyLoss.toLocaleString()}/month
    </p>

    <p style={{ fontSize: "13px", color: "#7f1d1d" }}>
      Hidden inefficiencies are costing you money
    </p>

    <button
      onClick={() => window.location.href = "/pricing"}
      style={{
        marginTop: "10px",
        width: "100%",
        background: "#d4af37",
        color: "black",
        padding: "10px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer"
      }}
    >
      Unlock AI 
    </button>
  </div>
)}
{plan === "starter" && (
  <div style={{
    marginTop: "15px",
    padding: "15px",
    background: "#4962b2a6",
    borderRadius: "12px",
    border: "1px solid #c7d2fe"
  }}>
    <h4 style={{ marginBottom: "5px" }}>🚀 You're missing AI profit insights</h4>

    <p style={{ fontSize: "13px", color: "#38c5db79" }}>
      Restaurants using AI typically increase profit by 12–25%
    </p>

    <button
      onClick={() => window.location.href = "/pricing"}
      style={{
        marginTop: "10px",
        width: "100%",
        background: "#4f46e5",
        color: "white",
        padding: "8px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer"
      }}
    >
      Unlock Full AI
    </button>
  </div>
)}
        <h3>🔥 Top Actions</h3>
        {topActions.length === 0 && <p>Everything optimized ✅</p>}
        {topActions.map((a, i) => <p key={i}>{a}</p>)}
{plan === "starter" && (
  <p style={{ fontSize: "12px", color: "#6b7280" }}>
    🔒 Upgrade to see full profit optimization actions
  </p>
)}
        <h3>🚨 Alerts</h3>
        {aiAlerts.length === 0 && <p>No issues detected ✅</p>}
        {aiAlerts.map((a, i) => <p key={i}>{a}</p>)}

        <h3>💡 Recommendations</h3>
        {aiRecommendations.map((r, i) => <p key={i}>{r}</p>)}
      </div>
           {/* ================= UPGRADE MODAL ================= */}
      {showUpgrade && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            width: "320px",
            textAlign: "center"
          }}>
            <h2>Upgrade Plan 🚀</h2>
            <p>Unlock AI insights, forecasting, and automation</p>

            <button>Upgrade Now</button>

            <label style={{
              display: "flex",
              gap: "8px",
              marginTop: "15px",
              textAlign: "left"
            }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              I agree to the Terms & Conditions
            </label>

            <button
              onClick={handleUpgrade}
              disabled={!agreed}
              style={{
                background: agreed ? "#22c55e" : "#999",
                color: "white",
                padding: "10px 20px",
                borderRadius: "10px",
                border: "none",
                marginTop: "15px",
                cursor: agreed ? "pointer" : "not-allowed"
              }}
            >
              Agree & Upgrade
            </button>

            <br />

            <button
              onClick={() => {
                setShowUpgrade(false);
                setAgreed(false);
              }}
              style={{ marginTop: "10px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div> 


); 
}