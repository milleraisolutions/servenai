export function calculateDashboardAI({
  menuItems = [],
  salesData = [],
  inventoryItems = [],
  categoryFilter = "all",
  timeFilter = "today",
  businessType = "restaurant"
}) {
  /* ===============================
     SAFETY
  =============================== */
  const items = Array.isArray(menuItems) ? menuItems : [];
  const sales = Array.isArray(salesData) ? salesData : [];
  const now = new Date();

  /* ===============================
     FILTER DATA
  =============================== */
  const filteredData = sales.filter((item) => {
    if (!item?.date) return false;

    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }

    const itemDate = new Date(item.date);

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
     ENRICH ITEMS
  =============================== */
  const enrichedItems = items.map((menuItem) => {
    const itemSales = filteredData.filter(
      (sale) => sale.name === menuItem.name
    );

    const totalSold = itemSales.reduce(
      (sum, sale) => sum + Number(sale.quantity || 0),
      0
    );

    const revenue = totalSold * Number(menuItem.price || 0);
    const cost = totalSold * Number(menuItem.ingredient_cost || 0);

    const margin =
      revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;

    return {
      ...menuItem,
      totalSold,
      revenue,
      cost,
      margin,
    };
  });

  /* ===============================
     KPIs
  =============================== */
  const totalRevenue = enrichedItems.reduce((sum, i) => sum + i.revenue, 0);
  const totalCost = enrichedItems.reduce((sum, i) => sum + i.cost, 0);

  const foodCostPercentage =
    totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

  /* ===============================
     FOOD COST INTELLIGENCE ENGINE
  =============================== */
  let foodCostStatus = "healthy";
  let foodCostInsight = "Food cost is operating efficiently.";

  if (foodCostPercentage >= 36) {
    foodCostStatus = "critical";
    foodCostInsight =
      "Food cost is critically high. Immediate pricing or supplier optimization recommended.";
  } else if (foodCostPercentage >= 29) {
    foodCostStatus = "warning";
    foodCostInsight =
      "Food cost is trending above optimal range. Monitor margins and review portions or vendors.";
  }

  const profitLeaks = enrichedItems.filter((i) => i.margin < 60);

  const avgMargin =
    enrichedItems.length > 0
      ? enrichedItems.reduce((sum, i) => sum + i.margin, 0) /
        enrichedItems.length
      : 0;

/* ===============================
   AOV (Average Order Value)
=============================== */

const totalOrders = filteredData.length;

const aov =
  totalOrders > 0
    ? totalRevenue / totalOrders
    : 0;
    let aovStatus = "good";
let aovInsight = "AOV is performing well";

if (aov < 15) {
  aovStatus = "low";
  aovInsight = "AOV is low. Consider upselling or bundling items.";
} else if (aov < 22) {
  aovStatus = "medium";
  aovInsight = "AOV is average. Small pricing or combo adjustments could help.";
}

  /* ===============================
     REVENUE BY DAY
  =============================== */
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totals = Object.fromEntries(days.map((d) => [d, 0]));

  filteredData.forEach((s) => {
    const day = new Date(s.date).toLocaleDateString("en-US", {
      weekday: "short",
    });

    totals[day] += Number(s.revenue || 0);
  });

  const revenueData = days.map((day) => ({
    day,
    revenue: totals[day],
  }));

  /* ===============================
     PERFORMANCE INSIGHTS
  =============================== */
  const bestDay = revenueData.reduce(
    (best, curr) => (curr.revenue > best.revenue ? curr : best),
    { day: "-", revenue: 0 }
  );

  const avgRevenue =
    revenueData.reduce((sum, d) => sum + d.revenue, 0) /
    (revenueData.length || 1);

  const performanceRatio =
    avgRevenue > 0 ? bestDay.revenue / avgRevenue : 0;

  const isStrongDay = performanceRatio > 1.3;

  /* ===============================
     LABOR ANALYSIS
  =============================== */
  const laborByDay = days.map((day) => {
    const filtered = filteredData.filter((d) => {
      const dName = new Date(d.date).toLocaleDateString("en-US", {
        weekday: "short",
      });
      return dName === day;
    });

    const revenue = filtered.reduce((t, d) => t + Number(d.revenue || 0), 0);
    const labor = filtered.reduce((t, d) => t + Number(d.labor || 0), 0);

    const percent = revenue ? (labor / revenue) * 100 : 0;

    let status = "OPTIMAL";
    if (percent > 30) status = "OVERSTAFFED";
    else if (percent < 20) status = "UNDERSTAFFED";

    return { day, revenue, labor, percent, status };
  });

  /* ===============================
     LABOR LOSS
  =============================== */
  const laborLoss = laborByDay.reduce((total, d) => {
    if (d.percent > 30) {
      const excess = d.labor - d.revenue * 0.3;
      return total + (excess > 0 ? excess : 0);
    }
    return total;
  }, 0);

 const periodLaborLoss = Math.round(laborLoss);

  /* ===============================
     PREDICTIONS
  =============================== */
  const recentData = filteredData.slice(-7);

  const avgDailyRevenue =
    recentData.reduce((sum, d) => sum + Number(d.revenue || 0), 0) /
    (recentData.length || 1);

  const trendMultiplier = performanceRatio > 1 ? 1.05 : 0.95;

  const predictedWeeklyRevenue = Math.round(
    avgDailyRevenue * 7 * trendMultiplier
  );

  const predictedProfit = Math.round(
    predictedWeeklyRevenue * (avgMargin / 100)
  );

  /* ===============================
     REVENUE MOMENTUM SIGNAL
  =============================== */
  const firstHalf = revenueData.slice(0, Math.ceil(revenueData.length / 2));
  const secondHalf = revenueData.slice(Math.ceil(revenueData.length / 2));

  const firstHalfAvg =
    firstHalf.reduce((sum, d) => sum + Number(d.revenue || 0), 0) /
    (firstHalf.length || 1);

  const secondHalfAvg =
    secondHalf.reduce((sum, d) => sum + Number(d.revenue || 0), 0) /
    (secondHalf.length || 1);

  const momentumDelta = secondHalfAvg - firstHalfAvg;
  const momentumPercent =
    firstHalfAvg > 0 ? (momentumDelta / firstHalfAvg) * 100 : 0;

  let revenueMomentum = "stable";
  let revenueMomentumInsight = "Revenue is holding steady.";

  if (momentumPercent >= 8) {
    revenueMomentum = "up";
    revenueMomentumInsight =
      "Revenue is trending upward. Sales momentum is improving.";
  } else if (momentumPercent <= -8) {
    revenueMomentum = "down";
    revenueMomentumInsight =
      "Revenue is trending downward. Performance may need attention.";
  }
/* ===============================
   UNUSUAL DROP DETECTION
=============================== */

const recentRevenueValues = revenueData
  .map((d) => Number(d.revenue || 0))
  .filter((v) => v > 0);

const averageRevenueBaseline =
  recentRevenueValues.reduce((sum, v) => sum + v, 0) /
  (recentRevenueValues.length || 1);

const latestRevenueValue =
  recentRevenueValues.length > 0
    ? recentRevenueValues[recentRevenueValues.length - 1]
    : 0;

const revenueDropPercent =
  averageRevenueBaseline > 0
    ? ((averageRevenueBaseline - latestRevenueValue) / averageRevenueBaseline) * 100
    : 0;

let unusualDropDetected = false;
let unusualDropInsight = "Revenue is tracking normally.";

if (latestRevenueValue > 0 && revenueDropPercent >= 20) {
  unusualDropDetected = true;
  unusualDropInsight =
    "Revenue is noticeably below recent average performance.";
}
 /* ===============================
   TOP ITEMS / SMART RANKING
=============================== */

const topSellingItems = [...enrichedItems]
  .sort((a, b) => b.totalSold - a.totalSold)
  .slice(0, 5);

const mostProfitableItems = [...enrichedItems]
  .sort((a, b) => {
    const aProfit = Number(a.revenue || 0) - Number(a.cost || 0);
    const bProfit = Number(b.revenue || 0) - Number(b.cost || 0);
    return bProfit - aProfit;
  })
  .slice(0, 5);

const worstItems = [...enrichedItems]
  .filter(i => i.totalSold > 3) // ignore dead menu items
  .map(i => {
    let severity = 0;

    if (i.margin < 40) severity += 50;
    else if (i.margin < 55) severity += 30;

    if (i.totalSold > 20 && i.margin < 60) severity += 25;

    if (i.totalSold < 8) severity += 10;

    const estimatedLoss = Math.round(i.cost * (severity / 100));

    return {
      ...i,
      severity,
      estimatedLoss,
    };
  })
  .sort((a, b) => b.severity - a.severity)
  .slice(0, 5);

/* ===============================
   GROWTH ITEM DIAGNOSIS
=============================== */

const growthDiagnosis = [...enrichedItems]
  .filter((i) => i.totalSold > 5)
  .map((i) => {
    let issue = null;
    let confidence = "low";
    let severity = "low";

    if (i.margin < 40) {
      issue = "Low margin and high ingredient cost";
      confidence = i.totalSold > 20 ? "high" : "medium";
      severity = "high";
    } else if (i.margin < 55) {
      issue = "Food cost above target range";
      confidence = i.totalSold > 15 ? "medium" : "low";
      severity = "medium";
    } else if (i.totalSold > 20 && i.margin < 60) {
      issue = "High demand but weak profitability";
      confidence = "high";
      severity = "low";
    }

    if (!issue) return null;

    return {
      name: i.name,
      issue,
      margin: Number(i.margin || 0),
      totalSold: Number(i.totalSold || 0),
      confidence,
      severity,
    };
  })
  .filter(Boolean)
  .sort(
    (a, b) =>
      a.margin - b.margin ||
      b.totalSold - a.totalSold
  )
  .map((item, index) => ({
    ...item,
    priority: index + 1,
  }))
  .slice(0, 5);

/* ===============================
   TOP 3 GROWTH PROBLEMS
=============================== */

const topGrowthProblems = growthDiagnosis
  .slice(0, 3)
  .map((item) => ({
    name: item.name,
    severity: item.severity,
    priority: item.priority,
    margin: item.margin,
    totalSold: item.totalSold,
  }));

/* ===============================
   AI FIX SUGGESTIONS
=============================== */

const fixSuggestions = growthDiagnosis
  .map((item) => {
    let action = "Review pricing and cost structure";

    if (item.issue === "Low margin and high ingredient cost") {
      action = "Review menu price and ingredient costs";
    } else if (item.issue === "Food cost above target range") {
      action = "Review portions and supplier pricing";
    } else if (item.issue === "High demand but weak profitability") {
      action = "Review pricing for this high-demand item";
    }

    return {
      name: item.name,
      action,
      confidence: item.confidence,
      severity: item.severity,
      margin: item.margin,
      totalSold: item.totalSold,
      priority: item.priority,
    };
  })
  .slice(0, 5);
  /* ===============================
   STARTER PROFIT LEAK SIGNALS
=============================== */
const profitLeakSignals = [];

const signalPrefix =
  businessType === "coffee"
    ? "Revenue Opportunity"
    : businessType === "smoothie"
    ? "Ingredient Loss"
    : "Profit Leak";

if (foodCostPercentage > 30) {
  profitLeakSignals.push(
    `🚨 ${signalPrefix}: Food cost is ${Number(
      foodCostPercentage || 0
    ).toFixed(1)}% and needs review`
  );
}

if (profitLeaks.length > 2) {
  profitLeakSignals.push(
    `🚨 ${signalPrefix}: ${profitLeaks.length} low-margin items hurting profitability`
  );
}

if (periodLaborLoss > 0) {
  profitLeakSignals.push(
    `🚨 ${signalPrefix}: Labor inefficiency costing about $${periodLaborLoss} in the selected data period`
  );
}

/* ===============================
   AI ALERTS + RECOMMENDATIONS
=============================== */
const aiAlerts = [];
const aiRecommendations = [];

/* BASE LOGIC */
profitLeaks.forEach((i) => {
  if (i.margin < 40) {
    aiAlerts.unshift(`🚨 ${i.name} severe margin issue`);
    aiRecommendations.push(`Increase price of ${i.name}`);
  }
});

laborByDay.forEach((d) => {
  if (d.percent > 30) {
    aiAlerts.unshift(`🚨 ${d.day} overstaffed`);
    aiRecommendations.push(`Reduce staff on ${d.day}`);
  }

  if (d.percent < 20) {
    aiRecommendations.push(`Add staff on ${d.day}`);
  }
});

const promoteItem = topSellingItems.find((i) => i.margin > 60);

if (promoteItem) {
  aiRecommendations.unshift(
    `🔥 Promote ${promoteItem.name} — high demand & strong margin`
  );
}

/* BUSINESS-SPECIFIC INTELLIGENCE */
if (businessType === "coffee") {
  aiAlerts.unshift("☕ Missed upsell opportunities detected");

  aiRecommendations.unshift(
    "Bundle coffee + pastry combos to increase average ticket value"
  );

  aiRecommendations.push(
    "Promote high-margin add-ons like extra shots and flavors"
  );

  aiRecommendations.push(
    "Optimize staffing during morning rush hours"
  );
}

if (businessType === "smoothie") {
  aiAlerts.unshift("🥤 Ingredient waste risk detected");

  aiRecommendations.unshift(
    "Reduce ingredient waste by adjusting prep quantities"
  );

  aiRecommendations.push(
    "Promote high-margin add-ons like protein or supplements"
  );

  aiRecommendations.push(
    "Review low-margin smoothies and adjust pricing"
  );
}

if (businessType === "restaurant") {
  aiAlerts.unshift("🍽️ Menu margin inefficiencies detected");

  aiRecommendations.unshift(
    "Adjust pricing on low-margin menu items"
  );

  aiRecommendations.push(
    "Highlight high-margin dishes to improve profitability"
  );
}
  /* ===============================
     STARTER ALERT ENGINE
  =============================== */
  const starterAlerts = [];

  if (foodCostPercentage >= 35) {
    starterAlerts.push({
      id: "food_cost_high",
      text: "Food cost is above optimal range",
      type: "critical",
    });
  }

  if (avgMargin <= 15) {
    starterAlerts.push({
      id: "margin_low",
      text: "Profit margin is below healthy target",
      type: "warning",
    });
  }

  if (bestDay.revenue >= avgRevenue * 1.4 && bestDay.revenue > 0) {
    starterAlerts.push({
      id: "strong_day",
      text: `Strong revenue performance on ${bestDay.day}`,
      type: "success",
    });
  }

  if (momentumPercent <= -10) {
    starterAlerts.push({
      id: "sales_drop",
      text: "Revenue trend is declining vs recent period",
      type: "critical",
    });
  }

  /* ===============================
     SCORE
  =============================== */
 let score = 100;

/* ===============================
   BUSINESS-TYPE SCORING
=============================== */

if (businessType === "coffee") {
  // Coffee = AOV + upsell + speed

  if (foodCostPercentage > 35) score -= 15;

  if (aov < 6) score -= 15; // low ticket size

  if (profitLeaks.length > 0) score -= profitLeaks.length * 4;

  if (!isStrongDay) score -= 10;
}

else if (businessType === "smoothie") {
  // Smoothie = food cost + margin

  if (foodCostPercentage > 30) score -= 20;

  if (profitLeaks.length > 0) {
    score -= profitLeaks.length * 5;
  }
}

else {
  // Restaurant (default)

  if (foodCostPercentage > 40) score -= 25;
  else if (foodCostPercentage > 30) score -= 10;

  score -= profitLeaks.length * 5;

  if (!isStrongDay) score -= 10;
}

score = Math.max(0, Math.min(100, score));
let scoreLabel = "Healthy";

if (score < 50) scoreLabel = "Critical";
else if (score < 70) scoreLabel = "At Risk";
else if (score < 85) scoreLabel = "Stable";

  /* ===============================
     CATEGORY BREAKDOWN
  =============================== */
  const categoryMap = {};

  enrichedItems.forEach((item) => {
    const cat = item.category || "other";

    if (!categoryMap[cat]) {
      categoryMap[cat] = { revenue: 0, items: 0 };
    }

    categoryMap[cat].revenue += item.revenue;
    categoryMap[cat].items += 1;
  });

  const categoryBreakdown = Object.entries(categoryMap).map(([name, val]) => ({
    name,
    revenue: val.revenue,
    items: val.items,
  }));

/* ===============================
   AI SUMMARY
=============================== */
let summary =
  businessType === "coffee"
    ? "Your coffee shop performance is stable."
    : businessType === "smoothie"
    ? "Your smoothie operation is running steadily."
    : "Your restaurant is operating normally.";

if (score > 85) {
  summary =
    businessType === "coffee"
      ? "🚀 Excellent performance. Strong ticket value, healthy margins, and efficient rush-hour operations."
      : businessType === "smoothie"
      ? "🚀 Excellent performance. Strong margins, low waste, and efficient operations."
      : "🚀 Excellent performance. Strong margins and efficient operations.";
} else if (score > 70) {
  summary =
    businessType === "coffee"
      ? "👍 Good performance, with opportunities to increase revenue per customer."
      : businessType === "smoothie"
      ? "👍 Good performance, with opportunities to reduce waste and improve margins."
      : "👍 Good performance, but there are opportunities to increase profit.";
} else if (score > 50) {
  summary =
    businessType === "coffee"
      ? "⚠️ Moderate performance. Missed upsells and inefficient periods may be limiting revenue."
      : businessType === "smoothie"
      ? "⚠️ Moderate performance. Waste and low-margin items may be reducing profitability."
      : "⚠️ Moderate performance. Some inefficiencies are reducing profit.";
} else {
  summary =
    businessType === "coffee"
      ? "🚨 Critical issues detected. Revenue opportunities and margin performance need immediate attention."
      : businessType === "smoothie"
      ? "🚨 Critical issues detected. Waste, pricing, or ingredient costs need immediate attention."
      : "🚨 Critical issues detected. Immediate action recommended.";
}

if (profitLeaks.length > 0) {
  summary += ` You have ${profitLeaks.length} low-margin items hurting performance.`;
}

if (periodLaborLoss > 0) {
  summary += ` Labor inefficiency is costing about $${periodLaborLoss} in the selected data period.`;
}
  /* ===============================
     PRICE SUGGESTIONS
  =============================== */
  const priceSuggestions = enrichedItems
    .filter((i) => i.margin < 50 && i.totalSold > 5)
    .map((i) => ({
      name: i.name,
      currentPrice: i.price,
      suggestedPrice: Math.round(i.price * 1.15 * 100) / 100,
    }))
    .slice(0, 5);

  /* ===============================
     PEAK HOURS
  =============================== */
  const hourMap = {};

  filteredData.forEach((sale) => {
    const date = new Date(sale.date);
    const hour = date.getHours();

    if (!hourMap[hour]) {
      hourMap[hour] = {
        hour,
        revenue: 0,
        orders: 0,
      };
    }

    hourMap[hour].revenue += Number(sale.revenue || 0);
    hourMap[hour].orders += Number(
      sale.quantity ||
        sale.orders ||
        sale.order_count ||
        sale.total_orders ||
        sale.transactions ||
        sale.tickets ||
        0
    );
  });

  const peakHours = Object.values(hourMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
    .map((slot) => {
      const formatHour = (h) => {
        const suffix = h >= 12 ? "PM" : "AM";
        const normalized = h % 12 === 0 ? 12 : h % 12;
        return `${normalized}:00 ${suffix}`;
      };

      return {
        ...slot,
        label: `${formatHour(slot.hour)} - ${formatHour(
          (slot.hour + 1) % 24
        )}`,
      };
    });
/* ===============================
   RESTAURANT AI PANEL SUMMARY
=============================== */

const aiPanelSummaryParts = [];

if (foodCostStatus === "critical") {
  aiPanelSummaryParts.push(
    "Food cost is critically high and needs immediate attention."
  );
} else if (foodCostStatus === "warning") {
  aiPanelSummaryParts.push(
    "Food cost is trending above target and should be monitored closely."
  );
} else {
  aiPanelSummaryParts.push(
    "Food cost is operating in a healthy range."
  );
}

if (revenueMomentum === "up") {
  aiPanelSummaryParts.push(
    "Revenue momentum is improving compared with the recent period."
  );
} else if (revenueMomentum === "down") {
  aiPanelSummaryParts.push(
    "Revenue momentum is weakening and may need attention."
  );
} else {
  aiPanelSummaryParts.push(
    "Revenue trend is stable right now."
  );
}

if (peakHours?.length) {
  aiPanelSummaryParts.push(
    `Your strongest revenue window is ${peakHours[0].label}.`
  );
}

if (worstItems?.length) {
  aiPanelSummaryParts.push(
    `${worstItems.length} low-performing items may be dragging profitability.`
  );
}

const restaurantAISummary = aiPanelSummaryParts.join(" ");
/* ===============================
   RESTAURANT AI BRAIN SUMMARY
=============================== */

let restaurantSummary = [];

if (foodCostPercentage > 30) {
  restaurantSummary.push(
    "Food cost is above optimal range and reducing profitability."
  );
}

if (worstItems.length > 0) {
  restaurantSummary.push(
    `${worstItems[0].name} is a major profit leak.`
  );
}

if (peakHours?.length) {
  restaurantSummary.push(
    `Strongest revenue period is ${peakHours[0].label}.`
  );
}

if (aov < 20) {
  restaurantSummary.push(
    "Average order value is below ideal target."
  );
}

if (restaurantSummary.length === 0) {
  restaurantSummary.push(
    "Operations look stable with no major risks detected."
  );
}
/* ===============================
   STARTER AI RECOMMENDATIONS
=============================== */

const starterRecommendations = [];

if (foodCostStatus === "critical") {
  starterRecommendations.push(
    "Review pricing or supplier costs immediately to reduce food cost pressure."
  );
} else if (foodCostStatus === "warning") {
  starterRecommendations.push(
    "Monitor ingredient spend and review portion sizing this week."
  );
}

if (revenueMomentum === "down") {
  starterRecommendations.push(
    "Revenue is trending down. Focus on promotions or menu visibility during slower periods."
  );
}

if (peakHours?.length) {
  starterRecommendations.push(
    `Maximize performance during ${peakHours[0].label}, your strongest revenue window.`
  );
}

if (worstItems?.length) {
  starterRecommendations.push(
    "Review low-performing menu items to protect margin and simplify your menu."
  );
}

const finalStarterRecommendations = starterRecommendations.slice(0, 3);
/* ===============================
   DEMAND FORECASTING
=============================== */

const recentRevenueSeries = revenueData
  .map((d) => Number(d.revenue || 0))
  .filter((v) => v > 0);

const recentAverageRevenue =
  recentRevenueSeries.reduce((sum, v) => sum + v, 0) /
  (recentRevenueSeries.length || 1);

const momentumMultiplier =
  revenueMomentum === "up"
    ? 1.08
    : revenueMomentum === "down"
    ? 0.92
    : 1.0;

const forecastedNextDayRevenue = Math.round(
  recentAverageRevenue * momentumMultiplier
);

const forecastedNextWeekRevenue = Math.round(
  forecastedNextDayRevenue * 7
);

let forecastConfidence = "medium";

if (recentRevenueSeries.length >= 5) {
  forecastConfidence = "high";
} else if (recentRevenueSeries.length <= 2) {
  forecastConfidence = "low";
}

const forecastPeakPeriod =
  peakHours?.length > 0 ? peakHours[0].label : "No forecast period yet";
 /* ===============================
   WASTE RISK DETECTION
=============================== */

const wasteRiskItems = [...enrichedItems]
  .filter(
    (item) =>
      Number(item.totalSold || 0) > 0 &&
      Number(item.cost || 0) > 0
  )
  .map((item) => {
    const margin = Number(item.margin || 0);
    const totalSold = Number(item.totalSold || 0);

    let wasteRisk = "low";

    if (margin < 40 && totalSold < 12) {
      wasteRisk = "high";
    } else if (margin < 55 || totalSold < 8) {
      wasteRisk = "medium";
    }

    return {
      name: item.name,
      wasteRisk,
      margin,
      totalSold,
    };
  })
  .filter((item) => item.wasteRisk !== "low")
  .sort((a, b) => {
    const riskRank = {
      high: 2,
      medium: 1,
      low: 0,
    };

    return (
      Number(riskRank[b.wasteRisk] || 0) -
        Number(riskRank[a.wasteRisk] || 0) ||
      Number(a.margin || 0) - Number(b.margin || 0) ||
      Number(a.totalSold || 0) - Number(b.totalSold || 0)
    );
  })
  .slice(0, 5);



let wasteDetectionInsight = "Waste risk appears under control.";

if (wasteRiskItems.some((item) => item.wasteRisk === "high")) {
  wasteDetectionInsight =
    "Menu performance indicates elevated waste risk that should be reviewed against ingredient usage data.";
} else if (wasteRiskItems.length > 0) {
  wasteDetectionInsight =
    "Menu performance indicates potential waste risk that should be reviewed against ingredient usage data.";
}
/* ===============================
   LABOR COST INSIGHT
=============================== */

const totalLabor = filteredData.reduce(
  (sum, item) => sum + Number(item.labor || 0),
  0
);

const laborCostPercentage =
  totalRevenue > 0 ? (totalLabor / totalRevenue) * 100 : 0;

let laborCostStatus = "healthy";
let laborCostInsight = "Labor cost is operating in a healthy range.";

if (laborCostPercentage >= 35) {
  laborCostStatus = "critical";
  laborCostInsight =
    "Labor cost is significantly above target and may be reducing profitability.";
} else if (laborCostPercentage >= 28) {
  laborCostStatus = "warning";
  laborCostInsight =
    "Labor cost is slightly above ideal range and should be monitored.";
}
/* ===============================
   INVENTORY FORECASTING
=============================== */

const inventoryForecast = [...enrichedItems]
  .filter((item) => Number(item.totalSold || 0) > 0)
  .map((item) => {
    const currentStock = Number(
      item.stock ||
      item.inventory ||
      item.current_stock ||
      item.qty_on_hand ||
      0
    );

    const dailyUsage =
      timeFilter === "today"
        ? Number(item.totalSold || 0)
        : Number(item.totalSold || 0) / 7;

    const daysRemaining =
      dailyUsage > 0 ? currentStock / dailyUsage : 999;

    let inventoryRisk = "low";

    if (daysRemaining <= 3) {
      inventoryRisk = "high";
    } else if (daysRemaining <= 7) {
      inventoryRisk = "medium";
    }

    return {
      name: item.name,
      currentStock,
      dailyUsage: Math.round(dailyUsage * 10) / 10,
      daysRemaining: Math.round(daysRemaining * 10) / 10,
      inventoryRisk,
    };
  })
  .filter(
    (item) =>
      item.currentStock > 0 &&
      item.inventoryRisk !== "low" &&
      item.daysRemaining < 999
  )
  .sort((a, b) => a.daysRemaining - b.daysRemaining)
  .slice(0, 5);

let inventoryForecastInsight = "Inventory levels appear stable.";

if (inventoryForecast.some((item) => item.inventoryRisk === "high")) {
  inventoryForecastInsight =
    "Some items may run out soon based on recent sales velocity.";
} else if (inventoryForecast.length > 0) {
  inventoryForecastInsight =
    "A few items may need restocking attention soon.";
}
/* ===============================
   AI MENU OPTIMIZATION
=============================== */

const menuOptimization = [...enrichedItems]
  .filter((item) => Number(item.totalSold || 0) > 0)
  .map((item) => {
    const totalSold = Number(item.totalSold || 0);
    const margin = Number(item.margin || 0);
    const revenue = Number(item.revenue || 0);

    let strategy = "maintain";
    let label = "Stable Item";
    let estimatedUpside = 0;
    let confidence = "medium";

    if (totalSold >= 20 && margin >= 65) {
      strategy = "promote";
      label = "High demand + strong margin";
      estimatedUpside = Math.round(revenue * 0.12);
      confidence = "high";
    } else if (totalSold >= 20 && margin < 55) {
      strategy = "reprice";
      label = "High demand + weak margin";
      estimatedUpside = Math.round(revenue * 0.1);
      confidence = "high";
    } else if (totalSold < 10 && margin < 50) {
      strategy = "review";
      label = "Low demand + low profitability";
      estimatedUpside = Math.round(revenue * 0.08);
      confidence = "medium";
    } else if (margin >= 60 && totalSold >= 10) {
      strategy = "feature";
      label = "Strong profit driver";
      estimatedUpside = Math.round(revenue * 0.09);
      confidence = "medium";
    }

    return {
      name: item.name,
      strategy,
      label,
      estimatedUpside,
      confidence,
      margin: Math.round(margin),
      totalSold,
    };
  })
  .filter((item) => item.strategy !== "maintain")
  .sort((a, b) => b.estimatedUpside - a.estimatedUpside)
  .slice(0, 5);

const menuOptimizationInsight =
  menuOptimization.length > 0
    ? "AI found menu items that can be promoted, repriced, or reviewed for stronger profitability."
    : "Menu performance appears balanced with no major optimization targets right now.";
    /* ===============================
   RESTAURANT SIMULATOR
=============================== */

const simulatorProjectedRevenue =
  totalRevenue + fixSuggestions.reduce(
    (sum, fix) => sum + Number(fix.estimatedGain || 0),
    0
  );

const simulatorProjectedProfit =
  predictedProfit + fixSuggestions.reduce(
    (sum, fix) => sum + Math.round(Number(fix.estimatedGain || 0) * 0.6),
    0
  );

const simulatorProfitLift =
  totalRevenue > 0
    ? ((simulatorProjectedRevenue - totalRevenue) / totalRevenue) * 100
    : 0;

const simulatorMarginLift =
  avgMargin > 0
    ? avgMargin + Math.min(12, fixSuggestions.length * 2)
    : fixSuggestions.length * 2;

const simulatorInsight =
  fixSuggestions.length > 0
    ? "Applying these AI recommendations could significantly improve revenue and margin performance."
    : "No major simulation opportunities detected yet.";
    /* ===============================
   PRICE ELASTICITY DETECTION
=============================== */

const priceElasticitySignals = [...enrichedItems]
  .filter((item) => Number(item.totalSold || 0) > 0 && Number(item.price || 0) > 0)
  .map((item) => {
    const totalSold = Number(item.totalSold || 0);
    const margin = Number(item.margin || 0);
    const price = Number(item.price || 0);
    const revenue = Number(item.revenue || 0);

    let elasticity = "stable";
    let recommendation = "Hold current price";
    let suggestedPrice = price;
    let estimatedUpside = 0;
    let confidence = "medium";

    if (totalSold >= 20 && margin < 55) {
      elasticity = "low sensitivity";
      recommendation = "Customers may tolerate a moderate price increase";
      suggestedPrice = Math.round(price * 1.08 * 100) / 100;
      estimatedUpside = Math.round(revenue * 0.08);
      confidence = "high";
    } else if (totalSold >= 12 && margin < 60) {
      elasticity = "moderate sensitivity";
      recommendation = "A small price increase may improve margin";
      suggestedPrice = Math.round(price * 1.05 * 100) / 100;
      estimatedUpside = Math.round(revenue * 0.05);
      confidence = "medium";
    } else if (totalSold < 8 && margin < 50) {
      elasticity = "high sensitivity";
      recommendation = "Avoid aggressive pricing changes";
      suggestedPrice = price;
      estimatedUpside = 0;
      confidence = "low";
    }

    return {
      name: item.name,
      elasticity,
      recommendation,
      currentPrice: price,
      suggestedPrice,
      estimatedUpside,
      confidence,
    };
  })
  .filter(
    (item) =>
      item.elasticity !== "stable" || item.estimatedUpside > 0
  )
  .sort((a, b) => b.estimatedUpside - a.estimatedUpside)
  .slice(0, 5);

const elasticityInsight =
  priceElasticitySignals.length > 0
    ? "AI identified menu items where pricing changes may improve profit without significantly hurting demand."
    : "No strong pricing opportunities detected right now.";
    /* ===============================
   AI SALES ANALYZER
=============================== */

const sortedRevenueDays = [...revenueData]
  .map((day) => ({
    ...day,
    revenue: Number(day.revenue || 0),
  }))
  .sort((a, b) => b.revenue - a.revenue);

const strongestSalesDay =
  sortedRevenueDays.length > 0 ? sortedRevenueDays[0] : null;

const weakestSalesDay =
  sortedRevenueDays.length > 0
    ? sortedRevenueDays[sortedRevenueDays.length - 1]
    : null;

let salesAnalyzerInsight = "Sales performance is stable overall.";
let salesAnalyzerSignal = "stable";

if (
  strongestSalesDay &&
  weakestSalesDay &&
  strongestSalesDay.revenue > 0 &&
  weakestSalesDay.revenue > 0
) {
  const gapPercent =
    ((strongestSalesDay.revenue - weakestSalesDay.revenue) /
      strongestSalesDay.revenue) *
    100;

  if (gapPercent >= 40) {
    salesAnalyzerSignal = "volatile";
    salesAnalyzerInsight =
      `${weakestSalesDay.day} is significantly underperforming compared with ${strongestSalesDay.day}.`;
  } else if (revenueMomentum === "up") {
    salesAnalyzerSignal = "improving";
    salesAnalyzerInsight =
      `Sales momentum is improving, led by stronger performance on ${strongestSalesDay.day}.`;
  } else if (revenueMomentum === "down") {
    salesAnalyzerSignal = "declining";
    salesAnalyzerInsight =
      `Sales momentum is weakening, with ${weakestSalesDay.day} showing the softest demand.`;
  }
}

const salesAnalyzerHighlights = [];

if (strongestSalesDay) {
  salesAnalyzerHighlights.push({
    label: "Strongest Day",
    value: `${strongestSalesDay.day} • $${Number(
      strongestSalesDay.revenue || 0
    ).toFixed(0)}`,
  });
}

if (weakestSalesDay) {
  salesAnalyzerHighlights.push({
    label: "Weakest Day",
    value: `${weakestSalesDay.day} • $${Number(
      weakestSalesDay.revenue || 0
    ).toFixed(0)}`,
  });
}

if (peakHours?.length > 0) {
  salesAnalyzerHighlights.push({
    label: "Best Time Block",
    value: peakHours[0].label,
  });
}
/* ===============================
   STAFF PLANNING SIGNALS
=============================== */

const staffPlanningSignals = laborByDay
  .filter((day) => Number(day.revenue || 0) > 0)
  .map((day) => {
    let signal = "balanced";
    let insight = "Staffing looks aligned with revenue.";
    let severity = "low";
    let estimatedImpact = 0;

    if (day.percent > 32) {
      signal = "overstaffed";
      insight = "Labor appears too high for sales volume.";
      severity = day.percent > 38 ? "high" : "medium";
      estimatedImpact = Math.round(
        Math.max(0, Number(day.labor || 0) - Number(day.revenue || 0) * 0.3)
      );
    } else if (day.percent < 18) {
      signal = "understaffed";
      insight = "Staffing may be too low for revenue demand.";
      severity = day.percent < 14 ? "high" : "medium";
      estimatedImpact = Math.round(Number(day.revenue || 0) * 0.05);
    }

    return {
      day: day.day,
      laborPercent: Math.round(Number(day.percent || 0) * 10) / 10,
      signal,
      insight,
      severity,
      estimatedImpact,
    };
  })
  .filter((day) => day.signal !== "balanced")
  .sort((a, b) => {
    const severityRank = { high: 3, medium: 2, low: 1 };
    return severityRank[b.severity] - severityRank[a.severity];
  })
  .slice(0, 5);

let staffPlanningInsight = "Staffing levels look stable overall.";

if (staffPlanningSignals.some((d) => d.signal === "overstaffed")) {
  staffPlanningInsight =
    "AI detected staffing inefficiency on certain days based on labor-to-revenue patterns.";
} else if (staffPlanningSignals.some((d) => d.signal === "understaffed")) {
  staffPlanningInsight =
    "AI detected potential understaffing on certain days based on revenue demand.";
}
/* ===============================
   SHELF LIFE ENGINE
=============================== */

const shelfLifeItems = (inventoryItems || [])
  .filter((item) => item.received_date && item.shelf_life)
  .map((item) => {
    const received = new Date(item.received_date);

    const expiration = new Date(received);
    expiration.setDate(
      received.getDate() + Number(item.shelf_life || 0)
    );

    const now = new Date();

    const daysRemaining = Math.ceil(
      (expiration - now) / (1000 * 60 * 60 * 24)
    );

    let shelfStatus = "healthy";

    if (daysRemaining <= 0) shelfStatus = "expired";
    else if (daysRemaining <= 2) shelfStatus = "critical";
    else if (daysRemaining <= 5) shelfStatus = "warning";

    return {
      name: item.name,
      receivedDate: item.received_date,
      purchaseDate: item.purchase_date || null,
      shelfLife: Number(item.shelf_life || 0),
      expirationDate: expiration.toISOString().split("T")[0],
      daysRemaining,
      shelfStatus,
      cost: Number(item.cost || 0),
      quantity: Number(item.quantity || 0),
    };
  });

const shelfLifeRiskItems = shelfLifeItems
  .filter((item) => item.shelfStatus !== "healthy")
  .sort((a, b) => a.daysRemaining - b.daysRemaining)
  .slice(0, 5);

const shelfLifeLoss = shelfLifeRiskItems.reduce((sum, item) => {
  return sum + Number(item.cost || 0);
}, 0);

let shelfLifeInsight = "Shelf life risk appears under control.";

if (shelfLifeRiskItems.some((item) => item.shelfStatus === "expired")) {
  shelfLifeInsight =
    "Some inventory items may already be expired and creating spoilage risk.";
} else if (
  shelfLifeRiskItems.some((item) => item.shelfStatus === "critical")
) {
  shelfLifeInsight =
    "Some inventory items are close to expiration and need immediate attention.";
} else if (shelfLifeRiskItems.length > 0) {
  shelfLifeInsight =
    "A few inventory items may expire soon and should be monitored.";
}
  /* ===============================
     RETURN EVERYTHING
  =============================== */
  return {
    enrichedItems,

    totalRevenue,
    totalCost,
    foodCostPercentage,
    foodCostStatus,
    foodCostInsight,

    revenueData,
    bestDay,
    avgRevenue,
    performanceRatio,
    isStrongDay,

    profitLeaks,
    profitLeakSignals,

    avgMargin,
aov,
    laborByDay,
    laborLoss,
   periodLaborLoss,

    predictedWeeklyRevenue,
    predictedProfit,

    revenueMomentum,
    revenueMomentumInsight,
    momentumPercent,

    topSellingItems,
    mostProfitableItems,
    worstItems,
    peakHours,

    aiAlerts,
    aiRecommendations,
    starterAlerts,

    score,
    categoryBreakdown,
    summary,
    restaurantAISummary,
  finalStarterRecommendations,
    priceSuggestions,
    restaurantSummary,
    growthDiagnosis,
   
    fixSuggestions, 
    aov,
aovStatus,
aovInsight,

unusualDropDetected,
unusualDropInsight,
revenueDropPercent,
topGrowthProblems,
forecastedNextDayRevenue,
forecastedNextWeekRevenue,
forecastConfidence,
forecastPeakPeriod,
wasteRiskItems,
wasteDetectionInsight,
laborCostPercentage,
laborCostStatus,
laborCostInsight,
periodLaborLoss,
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
scoreLabel,
score,
scoreLabel,
shelfLifeItems,
shelfLifeRiskItems,
shelfLifeLoss,
shelfLifeInsight,
  };
}