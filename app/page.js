
"use client";

import Link from "next/link";
import * as XLSX from "xlsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";

import { supabase } from "./lib/supabaseClient";
export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);
const [currentUser, setCurrentUser] = useState(null);
const [demoResult, setDemoResult] = useState(null);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  checkMobile();

  window.addEventListener("resize", checkMobile);

  return () => window.removeEventListener("resize", checkMobile);
}, []);
useEffect(() => {
  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setCurrentUser(session?.user || null);
  };

  checkUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setCurrentUser(session?.user || null);
  });

  return () => subscription.unsubscribe();
}, []);
  const pageStyle = {
    minHeight: "100vh",
    backgroundColor: "#020617",
    backgroundImage: `
      radial-gradient(circle at top left, rgba(79,70,229,0.28), transparent 28%),
      radial-gradient(circle at top right, rgba(212,175,55,0.18), transparent 30%),
      linear-gradient(180deg, #020617 0%, #0f172a 45%, #111827 100%)
    `,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    color: "white",
    width: "100%",
maxWidth: "100vw",
overflowX: "hidden",
boxSizing: "border-box",
  };

 const containerStyle = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: isMobile ? "0 14px" : "0 20px",
  boxSizing: "border-box",
  overflowX: isMobile ? "auto" : "hidden",
};

  const primaryButton = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 22px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(90deg, #d4af37, #4f46e5)",
    color: "white",
    fontSize: "15px",
    fontWeight: "700",
    textDecoration: "none",
    boxShadow: "0 16px 40px rgba(79,70,229,0.35)",
    cursor: "pointer",
    width: isMobile ? "100%" : "auto",
boxSizing: "border-box",
textAlign: "center",
  };

  const secondaryButton = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 22px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: "15px",
    fontWeight: "600",
    textDecoration: "none",
    backdropFilter: "blur(12px)",
    cursor: "pointer",
    width: isMobile ? "100%" : "auto",
boxSizing: "border-box",
textAlign: "center",
  };

  const glassCard = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "22px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 20px 60px rgba(2,6,23,0.45)",
  };

  const sectionTitle = {
  fontSize: isMobile ? "30px" : "42px",
    fontWeight: "800",
    lineHeight: 1.1,
    marginBottom: "14px",
    textAlign: "center",
  };

  const sectionSubtext = {
    fontSize: "17px",
    color: "#94a3b8",
    maxWidth: "760px",
    margin: "0 auto",
    textAlign: "center",
    lineHeight: 1.7,
  };

  const featureCard = {
    ...glassCard,
    padding: "28px",
    height: "100%",
  };

  const statCard = {
    ...glassCard,
    padding: "20px",
    minHeight: "120px",
  };

  const dashboardCard = {
  ...glassCard,
  padding: isMobile ? "16px" : "22px",
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

  





  return (
    <div
  style={{
    ...pageStyle,
    width: "100%",
    maxWidth: "100vw",
    overflowX: "hidden",
     position: "relative",
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

  img,
  video,
  canvas,
  svg {
    max-width: 100%;
    height: auto;
  }

  @media (max-width: 768px) {
    body {
      touch-action: pan-y;
    }

    section {
      width: 100%;
      overflow-x: hidden;
    }

    h1 {
      font-size: 34px !important;
      line-height: 1.05 !important;
    }

    h2 {
      font-size: 30px !important;
      line-height: 1.12 !important;
    }

    p {
      font-size: 15px !important;
    }

    a,
    button {
      width: 100% !important;
      justify-content: center !important;
      text-align: center !important;
      white-space: normal !important;
    }
  }
`}</style>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          padding: isMobile ? "56px 0 44px" : "110px 0 70px",
        }}
      >
        <div style={containerStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
  ? "1fr"
  : "1.05fr 0.95fr",
              gap: "40px",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#e2e8f0",
                  fontSize: "13px",
                  fontWeight: "700",
                  marginBottom: "22px",
                }}
              >
                <span style={{ color: "#d4af37" }}>●</span>
               OPERATIONAL PROFIT INTELLIGENCE FOR FULL-SERVICE RESTAURANTS
              </div>

             <h1
  style={{
    fontSize: isMobile ? "34px" : "72px",
    lineHeight: 1,
    letterSpacing: "-0.05em",
    fontWeight: "900",
    marginBottom: "22px",
    maxWidth: "820px",
    wordBreak: "break-word",
  }}
>
  Operational
  <span
    style={{
      background:
        "linear-gradient(90deg, #d4af37, #ffffff, #7c3aed)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }}
  >
    {" "}
    Profit Intelligence{" "}
  </span>
  for Full-Service Restaurants
</h1>

              <p
                style={{
                  fontSize: "20px",
                  lineHeight: 1.7,
                  color: "#cbd5e1",
                  maxWidth: "650px",
                  marginBottom: "18px",
                }}
              >
               SerVen helps full-service restaurants uncover hidden margin leakage across labor, food cost, menu performance, and operational trends using AI-powered intelligence.

              </p>

              <p
                style={{
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: "#94a3b8",
                  maxWidth: "620px",
                  marginBottom: "34px",
                }}
              >
                Spot profit leaks, improve margins, optimize staffing,
and uncover growth opportunities without spreadsheet chaos.
              </p>

             <div
  style={{
    display: "flex",
    gap: "14px",
    flexDirection: isMobile ? "column" : "row",
    flexWrap: "wrap",
    marginBottom: "30px",
  }}
>
                <Link href="/signup" style={primaryButton}>
  Request Profit Analysis
</Link>
                <a href="#demo" style={secondaryButton}>
  Explore Operational Intelligence
</a>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  flexDirection: isMobile ? "column" : "row",
flexWrap: "wrap",
                }}
              >
                {[
                  "Food Cost Monitoring",
                  "AI Recommendations",
                  "Labor Optimization",
                  "Menu Profitability",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e2e8f0",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div id="demo">
              <div style={dashboardCard}>
                <div
                  style={{
                    position: "absolute",
                    top: "-60px",
                    right: "-60px",
                    width: "180px",
                    height: "180px",
                    borderRadius: "999px",
                    background: "rgba(79,70,229,0.22)",
                    filter: "blur(30px)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "-60px",
                    left: "-60px",
                    width: "180px",
                    height: "180px",
                    borderRadius: "999px",
                    background: "rgba(212,175,55,0.18)",
                    filter: "blur(34px)",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        fontWeight: "700",
                        marginBottom: "6px",
                      }}
                    >
                     LIVE OPERATIONAL OVERVIEW
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: "800" }}>
                      Restaurant Command Center
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "999px",
                      background: "rgba(34,197,94,0.12)",
                      color: "#86efac",
                      border: "1px solid rgba(34,197,94,0.2)",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    ● AI LIVE
                  </div>
                </div>

              <div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
    marginBottom: "16px",
    position: "relative",
    zIndex: 1,
  }}
>
  <div style={statCard}>
    <div
      style={{
        color: "#cbd5e1",
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "0.06em",
      }}
    >
      WEEKLY REVENUE
    </div>

    <div
      style={{
        color: "#ffffff",
        fontSize: "30px",
        fontWeight: "950",
        marginTop: "10px",
      }}
    >
      $24,860
    </div>

    <div
      style={{
        color: "#86efac",
        fontSize: "13px",
        marginTop: "8px",
        fontWeight: "700",
      }}
    >
      +12.4% vs last week
    </div>
  </div>

  <div style={statCard}>
    <div
      style={{
        color: "#cbd5e1",
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "0.06em",
      }}
    >
      FOOD COST %
    </div>

    <div
      style={{
        color: "#ffffff",
        fontSize: "30px",
        fontWeight: "950",
        marginTop: "10px",
      }}
    >
      31.2%
    </div>

    <div
      style={{
        color: "#fbbf24",
        fontSize: "13px",
        marginTop: "8px",
        fontWeight: "700",
      }}
    >
      Margin pressure detected
    </div>
  </div>
</div>

                <div
                  style={{
                    ...glassCard,
                    padding: "18px",
                    marginBottom: "16px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "12px",
                    }}
                  >
                    PROFIT OPPORTUNITY DETECTEDMARGIN RECOVERY OPPORTUNITY
                  </div>
                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: "900",
                      marginBottom: "8px",
                    }}
                  >
                    +$3,240/mo
                  </div>
                  <div
                    style={{
                      color: "#cbd5e1",
                      lineHeight: 1.6,
                      fontSize: "14px",
                    }}
                  >
                    Raise price on 3 underpriced menu items, reduce prep waste on
                    high-cost ingredients, and rebalance Tuesday labor coverage.
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {[
                    {
                      title: "Menu Pricing Alert",
                      text: "2 best-selling items are underpriced compared to margin targets.",
                    },
                    {
                      title: "Labor Optimization",
                      text: "Friday lunch staffing is efficient, but Tuesday dinner is overstaffed.",
                    },
                    {
                      title: "Inventory Insight",
                      text: "One high-usage ingredient may run low within 6 days at current volume.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div style={{ fontWeight: "700", marginBottom: "6px" }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: "14px",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
{/* ============================= */}
{/* TRY YOUR DATA */}
{/* ============================= */}
<section style={{ padding: "20px 0 70px" }}>
  <div style={containerStyle}>
    <div
      style={{
        ...glassCard,
        padding: isMobile ? "18px" : "32px",
        borderRadius: "24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#d4af37",
          fontWeight: "800",
          fontSize: "13px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        Try Your Data
      </div>

      <h2 style={{ fontSize: "36px", fontWeight: "900", marginBottom: "10px" }}>
        See what SerVen finds in your data.
      </h2>

      <p
        style={{
          color: "#94a3b8",
          fontSize: "16px",
          lineHeight: 1.7,
          maxWidth: "720px",
          margin: "0 auto 24px",
        }}
      >
        Upload a sales export or sample report and preview how SerVen detects
profit leaks, tracks margins, and surfaces operational opportunities.
      </p>

      <label
        style={{
          display: "block",
          maxWidth: "620px",
          margin: "0 auto 18px",
          padding: "30px 24px",
          borderRadius: "22px",
          background:
            "radial-gradient(circle at top right, rgba(79,70,229,0.18), transparent 38%), rgba(255,255,255,0.04)",
          border: "1px dashed rgba(212,175,55,0.45)",
          cursor: "pointer",
          transition: "all 0.25s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 22px 60px rgba(2,6,23,0.35)";
          e.currentTarget.style.border = "1px dashed rgba(212,175,55,0.75)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.border = "1px dashed rgba(212,175,55,0.45)";
        }}
      >
        <input
  type="file"
  accept=".csv,.xlsx,.xls"
  style={{ display: "none" }}
 onChange={async (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

const {
  data: { session },
} = await supabase.auth.getSession();

if (!session?.user) {
  alert("Please log in first, then upload your sales file.");

  window.location.href = "/login?intent=demo";

  return;
}

setCurrentUser(session.user);

  try {
    const data = await file.arrayBuffer();

    const workbook = XLSX.read(data);

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet);

    const revenue = rows.reduce((sum, row) => {
      const value =
        Number(
          row.total ||
            row.Total ||
            row.sales ||
            row.Sales ||
            row.amount ||
            row.Amount ||
            row.revenue ||
            row.Revenue ||
            0
        ) || 0;

      return sum + value;
    }, 0);

   const foodCost = rows.reduce((sum, row) => {
  const value =
    Number(
      row.foodCost ||
        row.FoodCost ||
        row.food_cost ||
        row["Food Cost"] ||
        0
    ) || 0;

  return sum + value;
}, 0);

const laborCost = rows.reduce((sum, row) => {
  const value =
    Number(
      row.laborCost ||
        row.LaborCost ||
        row.labor_cost ||
        row["Labor Cost"] ||
        0
    ) || 0;

  return sum + value;
}, 0);

const averageSale = revenue / Math.max(rows.length, 1);

const foodCostPercent = revenue > 0 ? (foodCost / revenue) * 100 : 0;

const laborCostPercent = revenue > 0 ? (laborCost / revenue) * 100 : 0;
const primeCost = foodCost + laborCost;

const primeCostPercent =
  revenue > 0 ? (primeCost / revenue) * 100 : 0;
  let primeCostStatus = "Healthy";
let primeCostMessage = "Prime cost is within healthy operational range.";
let operationalRecommendations = [];

if (foodCostPercent >= 32) {
  operationalRecommendations.push(
    "Review high-cost menu items and ingredient waste."
  );
}

if (laborCostPercent >= 30) {
  operationalRecommendations.push(
    "Evaluate staffing efficiency during slower operating periods."
  );
}

if (primeCostPercent >= 65) {
  operationalRecommendations.push(
    "Prime cost is critically elevated and requires immediate operational review."
  );
}

if (operationalRecommendations.length === 0) {
  operationalRecommendations.push(
    "Operations are performing within healthy benchmark ranges."
  );
}
if (primeCostPercent >= 65) {
  primeCostStatus = "Critical";
  primeCostMessage =
    "Prime cost is significantly above target operational thresholds.";
} else if (primeCostPercent >= 55) {
  primeCostStatus = "Warning";
  primeCostMessage =
    "Prime cost is approaching unhealthy operational levels.";
}
const estimatedProfitLeak = Math.max(
  0,
  foodCostPercent > 32 ? revenue * 0.08 : revenue * 0.04
);
const primeCostTrendData = rows.slice(0, 14).map((row, index) => {
  const rowRevenue =
    Number(
      row.total ||
        row.Total ||
        row.sales ||
        row.Sales ||
        row.amount ||
        row.Amount ||
        row.revenue ||
        row.Revenue ||
        0
    ) || 0;

  const rowFoodCost =
    Number(
      row.foodCost ||
        row.FoodCost ||
        row.food_cost ||
        row["Food Cost"] ||
        0
    ) || 0;

  const rowLaborCost =
    Number(
      row.laborCost ||
        row.LaborCost ||
        row.labor_cost ||
        row["Labor Cost"] ||
        0
    ) || 0;

  const rowPrimeCostPercent =
    rowRevenue > 0 ? ((rowFoodCost + rowLaborCost) / rowRevenue) * 100 : 0;

 const rawDate =
  row.date ||
  row.Date ||
  row.day ||
  row.Day;

let formattedLabel;

if (typeof rawDate === "number") {
  const excelDate = XLSX.SSF.parse_date_code(rawDate);

  formattedLabel = `${excelDate.m}/${excelDate.d}`;
} else {
  formattedLabel =
    rawDate ||
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index % 7];
}

return {
  label: formattedLabel,
    primeCostPercent: Number(rowPrimeCostPercent.toFixed(1)),
  };
});
const menuEngineeringData = rows
  .slice(0, 5)
  .map((row, index) => {
    const itemName =
      row.item ||
      row.Item ||
      row.name ||
      row.Name ||
      row.menuItem ||
      row["Menu Item"] ||
      `Menu Item ${index + 1}`;

    const itemRevenue =
      Number(
        row.total ||
          row.Total ||
          row.sales ||
          row.Sales ||
          row.revenue ||
          row.Revenue ||
          0
      ) || 0;

    const itemFoodCost =
      Number(
        row.foodCost ||
          row.FoodCost ||
          row.food_cost ||
          row["Food Cost"] ||
          0
      ) || 0;

    const itemMargin =
      itemRevenue > 0
        ? ((itemRevenue - itemFoodCost) / itemRevenue) * 100
        : 0;

    return {
      itemName,
      margin: Number(itemMargin.toFixed(1)),
      revenue: itemRevenue,
    };
  })
  .sort((a, b) => b.margin - a.margin);
  const shiftIntelligenceData = [
  {
    shift: "Lunch",
    revenue: revenue * 0.32,
    laborCost: laborCost * 0.28,
  },
  {
    shift: "Dinner",
    revenue: revenue * 0.68,
    laborCost: laborCost * 0.72,
  },
].map((shift) => {
  const salesPerLaborHour =
    shift.laborCost > 0
      ? shift.revenue / (shift.laborCost / 18)
      : 0;

  return {
    ...shift,
    salesPerLaborHour: Number(salesPerLaborHour.toFixed(1)),
  };
});

const bestShift = [...shiftIntelligenceData].sort(
  (a, b) => b.salesPerLaborHour - a.salesPerLaborHour
)[0];
const executiveSummary = `
Prime Cost is currently ${primeCostPercent.toFixed(1)}%, with ${
  primeCostStatus === "Critical"
    ? "significant operational pressure detected."
    : primeCostStatus === "Warning"
    ? "moderate operational pressure detected."
    : "operations currently performing within healthy benchmarks."
}

Top operational opportunity:
${operationalRecommendations[0]}

Strongest shift:
${bestShift?.shift || "Dinner"} generating approximately $${Number(
  bestShift?.salesPerLaborHour || 0
).toLocaleString()} per labor hour.

Menu highlight:
${
  menuEngineeringData?.[0]?.itemName || "Top menu item"
} is currently one of the strongest margin performers.
`;
const weakestShift = [...shiftIntelligenceData].sort(
  (a, b) => a.salesPerLaborHour - b.salesPerLaborHour
)[0];
setDemoResult({
  rows: rows.length,
  revenue,
  foodCost,
  laborCost,
  primeCost,
  averageSale,
  foodCostPercent,
  laborCostPercent,
  primeCostPercent,
  primeCostStatus,
  primeCostMessage,
  operationalRecommendations,
  primeCostTrendData,
  menuEngineeringData,
  shiftIntelligenceData,
  bestShift,
  weakestShift,
  executiveSummary,
  estimatedProfitLeak,
});
alert("Demo result saved");
    console.log(rows);

  } catch (err) {
    console.error(err);

    alert("Unable to read file.");
  }
}}
/>

        <div style={{ fontSize: "34px", marginBottom: "10px" }}>📊</div>

        <div
          style={{
            color: "white",
            fontSize: "18px",
            fontWeight: "900",
            marginBottom: "6px",
          }}
        >
          Drop your sales CSV here
        </div>

        <div
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          Or click to choose a file from your computer
        </div>
<p
  style={{
    color: "#64748b",
    fontSize: "12px",
    marginTop: "10px",
    lineHeight: 1.6,
  }}
>
  Recommended: 30–90 days of sales data for more accurate operational insights.
</p>
        <div
          style={{
            display: "inline-flex",
            marginTop: "16px",
            padding: "10px 14px",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
            color: "white",
            fontSize: "13px",
            fontWeight: "900",
          }}
        >
          Upload Sales Report
        </div>
      </label>
{demoResult && (
  <div
    style={{
      marginTop: "18px",
      padding: "20px",
      borderRadius: "18px",
      background:
        "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(15,23,42,0.92))",
      border: "1px solid rgba(34,197,94,0.25)",
      color: "white",
      textAlign: "left",
    }}
  >
    <div
      style={{
        color: "#86efac",
        fontSize: "13px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}
    >
      Demo Import Complete
    </div>

    <h3
      style={{
        fontSize: "24px",
        fontWeight: "950",
        marginBottom: "14px",
      }}
    >
      SerVen found a profit opportunity in your data.
    </h3>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: "12px",
        marginBottom: "16px",
      }}
    >
      {[
        {
          label: "Rows Analyzed",
          value: demoResult.rows,
        },
        {
          label: "Revenue Detected",
          value: `$${demoResult.revenue.toLocaleString()}`,
        },
        {
          label: "Avg Sale",
          value: `$${demoResult.averageSale.toFixed(2)}`,
        },
        {
          label: "Food Cost %",
          value: `${demoResult.foodCostPercent.toFixed(1)}%`,
        },
        {
          label: "Labor Cost %",
          value: `${demoResult.laborCostPercent.toFixed(1)}%`,
        },
        {
  label: "Prime Cost %",
  value: `${demoResult.primeCostPercent.toFixed(1)}%`,
},
        {
          label: "Estimated Opportunity",
          value: `$${Math.round(
            demoResult.estimatedProfitLeak
          ).toLocaleString()}`,
        },
      ].map((item) => (
        <div
          key={item.label}
          style={{
            padding: "14px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: "12px",
              fontWeight: "800",
              marginBottom: "6px",
              textTransform: "uppercase",
            }}
          >
            {item.label}
          </div>

          <div
            style={{
              color: "white",
              fontSize: "22px",
              fontWeight: "950",
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
<div
  style={{
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  }}
>
  <div
    style={{
      color: "#d4af37",
      fontSize: "13px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "12px",
    }}
  >
    Prime Cost Trend
  </div>

  <div style={{ width: "100%", height: "240px" }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={demoResult.primeCostTrendData || []}>
        <Legend
  wrapperStyle={{
    paddingBottom: "12px",
    fontSize: "12px",
    color: "#cbd5e1",
  }}
/>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />

        <XAxis
          dataKey="label"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
          tickLine={false}
        />

        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
          tickLine={false}
          tickFormatter={(value) => `${value}%`}
        />

        <Tooltip
          formatter={(value) => [`${Number(value).toFixed(1)}%`, "Prime Cost"]}
          contentStyle={{
            background: "#020617",
            border: "1px solid rgba(148,163,184,0.24)",
            borderRadius: "12px",
            color: "white",
          }}
        />

       <>
  <Line
  type="monotone"
  dataKey="primeCostPercent"
  name="Prime Cost %"
    stroke="#d4af37"
    strokeWidth={3}
    dot={{ r: 4 }}
    activeDot={{ r: 6 }}
  />

  <Line
  type="monotone"
  dataKey={() => 55}
  name="Healthy Benchmark"
  stroke="#22c55e"
  strokeDasharray="6 6"
  strokeWidth={2}
  dot={false}
/>

  <Line
  type="monotone"
  dataKey={() => 65}
  name="Critical Threshold"
  stroke="#ef4444"
  strokeDasharray="6 6"
  strokeWidth={2}
  dot={false}
/>
</>
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>
<div
  style={{
    marginTop: "12px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "rgba(79,70,229,0.10)",
    border: "1px solid rgba(124,58,237,0.22)",
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
    AI Operational Commentary
  </div>
  <p
    style={{
      color: "#cbd5e1",
      fontSize: "14px",
      lineHeight: 1.7,
      margin: 0,
    }}
  >
    {demoResult.primeCostPercent >= 65
      ? "Prime cost is above critical operating range. SerVen would prioritize labor control, food cost review, and margin recovery opportunities."
      : demoResult.primeCostPercent >= 55
      ? "Prime cost is approaching the warning range. SerVen would monitor labor efficiency, menu margins, and ingredient cost pressure closely."
      : "Prime cost is currently within a healthy range. SerVen would continue tracking margin trends and watch for early cost pressure signals."}
  </p>
</div>

{/* EXECUTIVE SUMMARY PREVIEW */}
<div
  style={{
    marginTop: "14px",
    padding: "16px",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(15,23,42,0.92))",
    border: "1px solid rgba(212,175,55,0.22)",
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
    Executive Summary Preview
  </div>

  <p
    style={{
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.8,
      margin: 0,
      whiteSpace: "pre-line",
    }}
  >
    {demoResult.executiveSummary}
  </p>
</div>
<button
  onClick={generateExecutivePDF}
  style={{
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "800",
    background:
      "linear-gradient(135deg, #d4af37, #facc15)",
    color: "#020617",
    marginTop: "14px",
  }}
>
  Generate Executive PDF
</button>


<div
  style={{
    marginTop: "14px",
    padding: "16px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
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
    Menu Engineering Preview
  </div>

  <div style={{ display: "grid", gap: "10px" }}>
    {demoResult.menuEngineeringData?.map((item, index) => (
      <div
        key={`${item.itemName}-${index}`}
        style={{
          padding: "12px 14px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ color: "white", fontWeight: "900" }}>
            {item.itemName}
          </div>

          <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
  Revenue: ${Number(item.revenue || 0).toLocaleString()}
</div>

<div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "6px" }}>
  {item.margin >= 65
    ? "Strong margin performer. Consider featuring this item more often."
    : item.margin >= 45
    ? "Moderate margin item. Monitor ingredient cost and pricing."
    : "Margin risk detected. Review portioning, pricing, or supplier cost."}
</div>
        </div>

        <div
          style={{
            padding: "8px 10px",
            borderRadius: "999px",
            background:
              item.margin >= 65
                ? "rgba(34,197,94,0.14)"
                : item.margin >= 45
                ? "rgba(245,158,11,0.14)"
                : "rgba(239,68,68,0.14)",
            color:
              item.margin >= 65
                ? "#86efac"
                : item.margin >= 45
                ? "#fcd34d"
                : "#fca5a5",
            fontSize: "12px",
            fontWeight: "900",
          }}
        >
          {item.margin.toFixed(1)}% Margin •{" "}
{item.margin >= 65
  ? "High Profit Item"
  : item.margin >= 45
  ? "Moderate Margin"
  : "Margin Risk"}
        </div>
      </div>
    ))}
  </div>
</div>
{/* SHIFT INTELLIGENCE PREVIEW */}
<div
  style={{
    marginTop: "14px",
    padding: "16px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
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
    Shift Intelligence Preview
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
      gap: "12px",
      marginBottom: "12px",
    }}
  >
    <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
      <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "800" }}>
        Best Performing Shift
      </div>
      <div style={{ color: "white", fontSize: "22px", fontWeight: "950", marginTop: "6px" }}>
        {demoResult.bestShift?.shift}
      </div>
      <div style={{ color: "#86efac", fontSize: "13px", marginTop: "6px", fontWeight: "800" }}>
        ${Number(demoResult.bestShift?.salesPerLaborHour || 0).toLocaleString()} / labor hour
      </div>
    </div>

    <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
      <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "800" }}>
        Weakest Shift
      </div>
      <div style={{ color: "white", fontSize: "22px", fontWeight: "950", marginTop: "6px" }}>
        {demoResult.weakestShift?.shift}
      </div>
      <div style={{ color: "#fcd34d", fontSize: "13px", marginTop: "6px", fontWeight: "800" }}>
        ${Number(demoResult.weakestShift?.salesPerLaborHour || 0).toLocaleString()} / labor hour
      </div>
    </div>
  </div>

  <p
    style={{
      color: "#cbd5e1",
      fontSize: "14px",
      lineHeight: 1.7,
      margin: 0,
    }}
  >
    SerVen compares revenue against labor pressure by shift to identify where staffing efficiency may be helping or hurting profitability.
  </p>
</div>
<div
  style={{
    marginTop: "14px",
    padding: "16px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
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
    Recommended Operational Actions
  </div>

  <div style={{ display: "grid", gap: "10px" }}>
    {demoResult.operationalRecommendations?.map((item, index) => (
      <div
        key={index}
        style={{
          padding: "12px 14px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
          color: "#cbd5e1",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        • {item}
      </div>
    ))}
  </div>
</div>
    <div
  style={{
    marginTop: "14px",
    padding: "16px",
    borderRadius: "16px",
    background:
      demoResult.primeCostStatus === "Critical"
        ? "rgba(239,68,68,0.12)"
        : demoResult.primeCostStatus === "Warning"
        ? "rgba(245,158,11,0.12)"
        : "rgba(34,197,94,0.12)",
    border:
      demoResult.primeCostStatus === "Critical"
        ? "1px solid rgba(239,68,68,0.25)"
        : demoResult.primeCostStatus === "Warning"
        ? "1px solid rgba(245,158,11,0.25)"
        : "1px solid rgba(34,197,94,0.25)",
  }}
>
  <div
    style={{
      fontSize: "13px",
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color:
        demoResult.primeCostStatus === "Critical"
          ? "#fca5a5"
          : demoResult.primeCostStatus === "Warning"
          ? "#fcd34d"
          : "#86efac",
      marginBottom: "8px",
    }}
  >
    Prime Cost Status: {demoResult.primeCostStatus}
  </div>

  <p
    style={{
      color: "#cbd5e1",
      lineHeight: 1.7,
      margin: 0,
      fontSize: "14px",
    }}
  >
    {demoResult.primeCostMessage}
  </p>
</div>
  </div>
)}
      <button
        style={{
          padding: "13px 20px",
          borderRadius: "12px",
          background: "linear-gradient(90deg, #4f46e5, #d4af37)",
          color: "white",
          fontWeight: "800",
          border: "none",
          cursor: "pointer",
        }}
       onClick={() => {
  window.location.href = "/signup?intent=demo";
}}
      >
        Create My Demo Profile
      </button>
    </div>
  </div>
</section>

{/* ============================= */}
{/* PLATFORM DEMO */}
{/* ============================= */}
<section className="desktop-only" style={{ padding: "20px 0 70px" }}>
  <div style={containerStyle}>
    <div
      style={{
        ...glassCard,
        padding: isMobile ? "18px" : "32px",
        position: "relative",
        overflow: "visible",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "180px",
          height: "180px",
          borderRadius: "999px",
          background: "rgba(79,70,229,0.16)",
          filter: "blur(36px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-60px",
          left: "-50px",
          width: "180px",
          height: "180px",
          borderRadius: "999px",
          background: "rgba(212,175,55,0.12)",
          filter: "blur(36px)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            color: "#d4af37",
            fontWeight: "800",
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          Platform Demo
        </div>

        <h2
          style={{
            fontSize: isMobile ? "30px" : "42px",
            fontWeight: "900",
            lineHeight: 1.1,
            textAlign: "center",
            marginBottom: "14px",
          }}
        >
          See how SerVen uncovers hidden operational profit leaks
        </h2>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "17px",
            lineHeight: 1.7,
            maxWidth: "760px",
            margin: "0 auto 30px",
            textAlign: "center",
          }}
        >
          Explore the dashboard experience restaurants use to track revenue,
          control food costs, spot labor inefficiencies, and uncover AI-driven
          profit opportunities.
        </p>

        <div
          style={{
            ...glassCard,
            padding: isMobile ? "12px" : "22px",
maxWidth: "980px",
margin: "0 auto",
width: "100%",
overflow: "visible",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
  ? "1fr"
  : "1.1fr 0.9fr",
              gap: "18px",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "18px",
                padding: isMobile ? "12px" : "20px",
minHeight: isMobile ? "auto" : "320px",
overflow: "visible",
width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      fontWeight: "700",
                      marginBottom: "6px",
                    }}
                  >
                    LIVE DASHBOARD PREVIEW
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "800" }}>
                    Weekly Performance Snapshot
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "rgba(34,197,94,0.12)",
                    color: "#86efac",
                    border: "1px solid rgba(34,197,94,0.2)",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  ● Live Demo
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
  ? "1fr"
  : "1fr 1fr 1fr",
                  gap: "14px",
                  marginBottom: "18px",
                }}
              >
                {[
                  { label: "Revenue", value: "$24,860", sub: "+12.4%" },
                  {
                    label: "Food Cost",
                    value: "31.2%",
                    sub: "Needs attention",
                  },
                  { label: "AI Score", value: "84/100", sub: "Healthy" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "16px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: "12px",
                        fontWeight: "700",
                        marginBottom: "8px",
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: "900" }}>
                      {item.value}
                    </div>
                    <div
                      style={{
                        color: "#cbd5e1",
                        fontSize: "13px",
                        marginTop: "8px",
                      }}
                    >
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  height: "130px",
                  borderRadius: "18px",
                  background:
                    "linear-gradient(180deg, rgba(79,70,229,0.16), rgba(212,175,55,0.08))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "10px",
                  padding: "18px",
                }}
              >
                {[50, 82, 68, 96, 72, 110, 88].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}px`,
                      borderRadius: "10px 10px 4px 4px",
                      background:
                        "linear-gradient(180deg, #d4af37, #4f46e5)",
                      opacity: 0.95,
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              {[
                {
                  title: "Pricing opportunity",
                  text: "Two best sellers are underpriced relative to margin targets.",
                },
                {
                  title: "Labor alert",
                  text: "Tuesday dinner staffing is above target labor percentage.",
                },
                {
                  title: "Inventory risk",
                  text: "One core ingredient may run low within 6 days.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "18px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "800",
                      marginBottom: "8px",
                      fontSize: "16px",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "14px",
                      lineHeight: 1.7,
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "6px",
                }}
              >
                <Link href="/signup" style={primaryButton}>
                  See Your Demo
                </Link>
                <Link href="/dashboard" style={secondaryButton}>
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
<div className="mobile-only">
  <section style={{ padding: "20px 0 50px" }}>
    <div style={containerStyle}>
      <div
        style={{
          ...glassCard,
          padding: "22px",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#d4af37", fontWeight: "900", marginBottom: "10px" }}>
          PLATFORM DEMO
        </div>

        <h2 style={{ fontSize: "28px", fontWeight: "900", marginBottom: "12px" }}>
          See SerVen in action on desktop
        </h2>

        <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: "18px" }}>
          The full dashboard preview is best viewed on a larger screen. Create a demo profile to see your numbers inside SerVen.
        </p>

        <Link href="/signup" style={primaryButton}>
          Create My Demo Profile
        </Link>
      </div>
    </div>
  </section>
</div>
{/* ============================= */}
{/* BOOK / REQUEST DEMO CTA */}
{/* ============================= */}
<section style={{ padding: isMobile ? "24px 0 56px" : "40px 0 80px" }}>
  <div style={containerStyle}>
    <div
      style={{
        ...glassCard,
        padding: isMobile ? "22px" : "36px",
        textAlign: "center",
        borderRadius: "24px",
      }}
    >
      <div
        style={{
          color: "#d4af37",
          fontWeight: "900",
          fontSize: "13px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        Built For Real Restaurant Numbers
      </div>

      <h2
        style={{
          fontSize: isMobile ? "30px" : "42px",
          fontWeight: "950",
          marginBottom: "14px",
          lineHeight: 1.1,
        }}
      >
        See what SerVen would find in your business.
      </h2>

      <p
        style={{
          color: "#94a3b8",
          fontSize: isMobile ? "15px" : "17px",
          lineHeight: 1.7,
          maxWidth: "760px",
          margin: "0 auto 26px",
        }}
      >
        Create a demo profile, upload sample sales data, or request custom
        pricing so we can estimate where your restaurant may be leaking profit.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "14px",
          flexWrap: "wrap",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <Link href="/signup" style={primaryButton}>
          Create Demo Profile
        </Link>

        <Link href="/pricing" style={secondaryButton}>
          Request Custom Pricing
        </Link>
      </div>
    </div>
  </div>
</section>

      {/* TRUST BAR */}
      <section style={{ padding: "16px 0 30px" }}>
        <div style={containerStyle}>
          <div
            style={{
              ...glassCard,
              padding: "18px 24px",
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
              color: "#94a3b8",
              fontWeight: "700",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            <span>Restaurant-first AI</span>
<span>Profit leak detection</span>
<span>Food cost visibility</span>
<span>Fast setup with your data</span>
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section
  id="why"
  style={{
    padding: isMobile ? "56px 0 20px" : "100px 0 40px",
  }}
>
        <div style={containerStyle}>
          <h2 style={sectionTitle}>Stop guessing where your profit is going.</h2>
          <p style={sectionSubtext}>
            Most restaurant owners know revenue. Very few know exactly where they
            are losing margin every week. SerVen surfaces the numbers that
            actually move profit.
          </p>

        <div
  className="mobile-horizontal-card"
 style={{
  display: isMobile ? "flex" : "grid",
  flexDirection: isMobile ? "row" : undefined,
  flexWrap: isMobile ? "nowrap" : undefined,
  gridTemplateColumns: isMobile
    ? undefined
    : "repeat(3, 1fr)",
  gap: "20px",
  marginTop: "46px",
  overflowX: isMobile ? "scroll" : "visible",
  overflowY: "hidden",
  paddingBottom: isMobile ? "12px" : "0",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: isMobile ? "x mandatory" : "none",
}}
>
            {[
              {
                title: "Find Profit Leaks Fast",
                text: "Catch overpriced labor, hidden food cost issues, and weak menu pricing before they quietly drain cash.",
              },
              {
                title: "Get AI-Driven Clarity",
                text: "See exactly what needs attention first with prioritized recommendations built for restaurant operators.",
              },
              {
                title: "Make Better Weekly Decisions",
                text: "Use your own business data to plan staffing, pricing, promotions, and inventory with more confidence.",
              },
            ].map((item) => (
             <div
  className="mobile-horizontal-card"
  key={item.title}
  style={{
    ...featureCard,
   minWidth: isMobile ? "330px" : "auto",
    maxWidth: isMobile ? "330px" : "none",
    flexShrink: 0,
    flex: isMobile ? "0 0 auto" : "initial",
    scrollSnapAlign: isMobile ? "start" : "none",
  }}
>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "16px",
                    background:
                      "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(79,70,229,0.22))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    marginBottom: "18px",
                  }}
                >
                  ✦
                </div>
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    marginBottom: "12px",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    color: "#94a3b8",
                    lineHeight: 1.7,
                    fontSize: "15px",
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
     <section
  id="features"
  style={{
    padding: isMobile ? "56px 0 20px" : "110px 0 40px",
  }}
>
        <div style={containerStyle}>
          <h2 style={sectionTitle}>
            Operational intelligence built for modern restaurant operators.
          </h2>
          <p style={sectionSubtext}>
            From food cost monitoring to AI recommendations, SerVen gives you the
            visibility and action plan to improve margins without adding more
            complexity.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(2, 1fr)",
              gap: "20px",
              marginTop: "46px",
            }}
          >
            {[
              {
                title: "Revenue & KPI Tracking",
                text: "Monitor sales trends, average order value, peak hours, and business performance from one clean dashboard.",
              },
              {
                title: "Food Cost Monitoring",
                text: "Catch rising ingredient costs, weak margins, and menu items that are eating into your profitability.",
              },
              {
                title: "Labor Intelligence",
                text: "Spot overstaffing and understaffing patterns so labor dollars are better aligned with real demand.",
              },
              {
                title: "Inventory & Demand Signals",
                text: "Forecast inventory needs, reduce waste risk, and stay ahead of ingredient shortages before they hurt service.",
              },
              {
                title: "Operational Profit Recommendations",
                text: "Receive practical suggestions on pricing, menu changes, labor adjustments, and opportunities to grow profit.",
              },
              {
                title: "Revenue Recovery Intelligence",
                text: "Understand what to promote, what to fix, and where your biggest upside lives this week.",
              },
            ].map((item) => (
              <div key={item.title} style={featureCard}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "800",
                    color: "#d4af37",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  SerVen Feature
                </div>
                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: "800",
                    marginBottom: "12px",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    color: "#94a3b8",
                    lineHeight: 1.8,
                    fontSize: "15px",
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section style={{ padding: "90px 0 30px" }}>
        <div style={containerStyle}>
          <div
            style={{
              ...glassCard,
              padding: "34px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
  ? "1fr"
  : "repeat(4, 1fr)",
                gap: "18px",
              }}
            >
              {[
                { value: "8–18%", label: "Potential profit improvement" },
                {
                  value: "Hours saved",
                  label: "Less spreadsheet digging every week",
                },
                { value: "Real-time", label: "Clearer business visibility" },
                {
                  value: "1 dashboard",
                  label: "Revenue, labor, costs, and AI insights",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "18px",
                    borderRadius: "18px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: "900",
                      marginBottom: "8px",
                    }}
                  >
                    {item.value}
                  </div>
                  <div
                    style={{
                      color: "#94a3b8",
                      lineHeight: 1.6,
                      fontSize: "14px",
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
<section id="pricing" style={{ padding: "90px 0 40px" }}>
  <div style={containerStyle}>
    <h2 style={sectionTitle}>Pricing tailored to your restaurant operation.</h2>

    <p style={sectionSubtext}>
      Every restaurant operates differently. Pricing is customized based on
revenue volume, operational complexity, locations, and reporting needs.
    </p>

    <div
  className="mobile-horizontal-card"
  style={{
  display: isMobile ? "flex" : "grid",
  flexDirection: isMobile ? "row" : undefined,
  flexWrap: isMobile ? "nowrap" : undefined,
  gridTemplateColumns: isMobile ? undefined : "repeat(3, 1fr)",
  gap: "20px",
  marginTop: "46px",
  overflowX: isMobile ? "scroll" : "visible",
  overflowY: "hidden",
  paddingBottom: isMobile ? "12px" : "0",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: isMobile ? "x mandatory" : "none",
}}
>
      {[
        {
          name: "Starter",
          price: "Plans starting at $149/mo",
          badge: "Best for getting control",
          note: "For restaurants that want visibility into revenue, food cost, and profit leaks.",
          features: [
            "Core KPI dashboard",
            "Revenue analytics",
            "Food cost monitoring",
            "Profit leak detection",
            "Best & worst selling items",
          ],
        },
        {
          name: "Growth",
          price: "Starting at $299/mo",
          badge: "Most Popular",
          featured: true,
          note: "For growing restaurants that need forecasting, labor visibility, and operational insights.",
          features: [
            "Everything in Starter",
            "Demand forecasting",
            "Inventory forecasting",
            "Waste detection",
            "Labor cost insights",
            "Menu optimization signals",
          ],
        },
        {
          name: "Pro",
          price: "Starting at $499/mo",
          badge: "Advanced AI advantage",
          note: "For operators who want deeper AI recommendations, forecasting, and profit automation.",
          features: [
            "Everything in Growth",
            "AI recommendations engine",
            "Advanced forecasting",
            "Price elasticity signals",
            "AI sales analyzer",
            "Restaurant simulator tools",
          ],
        },
      ].map((plan) => (
        <div
          key={plan.name}
   style={{
  ...glassCard,
  padding: "28px",
  minWidth: isMobile ? "330px" : "auto",
  maxWidth: isMobile ? "330px" : "none",
  flexShrink: 0,
  flex: isMobile ? "0 0 auto" : "initial",
  scrollSnapAlign: isMobile ? "start" : "none",
  position: "relative",
  border: plan.featured
    ? "1px solid rgba(212,175,55,0.35)"
    : "1px solid rgba(255,255,255,0.08)",
  boxShadow: plan.featured
    ? "0 22px 70px rgba(212,175,55,0.12)"
    : "0 20px 60px rgba(2,6,23,0.35)",
}}
        >
          {plan.featured && (
            <div
              style={{
                position: "absolute",
                top: "-12px",
                right: "20px",
                padding: "8px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "800",
                background: "linear-gradient(90deg, #d4af37, #7c3aed)",
                color: "#fff",
              }}
            >
              MOST POPULAR
            </div>
          )}

          <div
            style={{
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: plan.featured ? "#facc15" : "#94a3b8",
              marginBottom: "12px",
            }}
          >
            {plan.badge}
          </div>

          <h3
            style={{
              fontSize: "28px",
              fontWeight: "800",
              marginBottom: "8px",
            }}
          >
            {plan.name}
          </h3>

          <div
            style={{
              fontSize: "30px",
              fontWeight: "900",
              marginBottom: "8px",
              lineHeight: 1.1,
            }}
          >
            {plan.price}
          </div>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "13px",
              lineHeight: 1.6,
              marginBottom: "18px",
            }}
          >
            Final pricing depends on restaurant size, revenue, number of
            locations, and data needs.
          </p>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: "14px",
              lineHeight: 1.6,
              marginBottom: "22px",
            }}
          >
            {plan.note}
          </p>

          <div style={{ display: "grid", gap: "12px", marginBottom: "26px" }}>
            {plan.features.map((feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#cbd5e1",
                  fontSize: "15px",
                }}
              >
                <span style={{ color: "#d4af37", fontWeight: "900" }}>✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Link
            href="/pricing"
            style={plan.featured ? primaryButton : secondaryButton}
          >
            See Custom Pricing
          </Link>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* FINAL CTA */}
      <section style={{ padding: isMobile ? "70px 0" : "120px 0" }}>
        <div style={containerStyle}>
          <div
            style={{
              ...glassCard,
              padding: isMobile ? "22px" : "44px",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "220px",
                height: "220px",
                borderRadius: "999px",
                background: "rgba(79,70,229,0.18)",
                filter: "blur(40px)",
                top: "-50px",
                left: "-60px",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "220px",
                height: "220px",
                borderRadius: "999px",
                background: "rgba(212,175,55,0.14)",
                filter: "blur(40px)",
                bottom: "-60px",
                right: "-40px",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  color: "#d4af37",
                  fontWeight: "800",
                  fontSize: "13px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "14px",
                }}
              >
                Start Running Smarter
              </div>

              <h2
                style={{
                fontSize: isMobile ? "32px" : "48px",
                  fontWeight: "900",
                  lineHeight: 1.1,
                  maxWidth: "760px",
                  margin: "0 auto 16px",
                }}
              >
                Your numbers already tell the story.
                <br />
                SerVen helps you act on it.
              </h2>

              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "17px",
                  lineHeight: 1.7,
                  maxWidth: "700px",
                  margin: "0 auto 28px",
                }}
              >
                Stop flying blind. Start making faster, sharper, more profitable
                decisions with AI built for restaurant operators.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <Link href="/signup" style={primaryButton}>
                  Get Started
                </Link>
                <Link href="/dashboard" style={secondaryButton}>
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "26px 0 34px",
        }}
      >
        <div
  style={{
    ...containerStyle,
    display: "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    flexDirection: isMobile ? "column" : "row",
    gap: "20px",
    flexWrap: "wrap",
    color: "#64748b",
    fontSize: "14px",
  }}
>
  <div>
  <div
    style={{
      color: "white",
      fontWeight: "900",
      fontSize: "18px",
      marginBottom: "8px",
      letterSpacing: "-0.02em",
    }}
  >
    SerVen
  </div>

  <div
    style={{
      color: "#94a3b8",
      lineHeight: 1.7,
      maxWidth: "420px",
      fontSize: "14px",
    }}
  >
    Restaurant intelligence software built to uncover profit leaks,
    improve margins, optimize labor, and help operators make sharper
    weekly decisions.
  </div>

  <div
    style={{
      marginTop: "12px",
      color: "#475569",
      fontSize: "13px",
    }}
  >
    © 2026 SerVen. Restaurant Intelligence Served Daily.
  </div>
</div>

<div
  style={{
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
    alignItems: "center",
  }}
>
  <Link
    href="/pricing"
    style={{
      color: "#94a3b8",
      textDecoration: "none",
      fontWeight: "600",
    }}
  >
    Pricing
  </Link>

  <Link
    href="/login"
    style={{
      color: "#94a3b8",
      textDecoration: "none",
      fontWeight: "600",
    }}
  >
    Login
  </Link>

  <Link
    href="/signup"
    style={{
      color: "#d4af37",
      textDecoration: "none",
      fontWeight: "800",
    }}
  >
    Create Demo Profile
  </Link>
</div>
</div>
      </footer>
    </div>
  );
}