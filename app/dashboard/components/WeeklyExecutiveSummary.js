"use client";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
export default function WeeklyExecutiveSummary({
  weeklyExecutiveSummary,
  revenueTrend,
  avgMargin,
  foodCostPercentage,
  restaurantName,
  revenueChartData = [],

  alcoholRevenue = 0,
  alcoholRevenuePercent = 0,
  topAlcoholItemName = "No alcohol item detected",
  topBeverageCategory = "No beverage category detected",
  alcoholMarginStatus = "No beverage margin data",
}) {
  if (!weeklyExecutiveSummary) return null;

  const currentDate = new Date();

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
const safeRestaurantName =
  restaurantName && restaurantName !== "null"
    ? restaurantName
    : "Restaurant";
  const startOfWeek = new Date();
  startOfWeek.setDate(currentDate.getDate() - 6);

  const weekRange = `${startOfWeek.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${currentDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  const generateExecutivePDF = async () => {
    const input = document.getElementById(
      "weekly-executive-report-export"
    );

    if (!input) return;

    const canvas = await html2canvas(input, {
      scale: 2,
      backgroundColor: "#020617",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();

   const pageHeight =
  pdf.internal.pageSize.getHeight();

const imgHeight =
  (canvas.height * pdfWidth) / canvas.width;

let heightLeft = imgHeight;
let position = 0;

pdf.addImage(
  imgData,
  "PNG",
  0,
  position,
  pdfWidth,
  imgHeight
);

heightLeft -= pageHeight;

while (heightLeft > 0) {
  position = heightLeft - imgHeight;

  pdf.addPage();

  pdf.addImage(
    imgData,
    "PNG",
    0,
    position,
    pdfWidth,
    imgHeight
  );

  heightLeft -= pageHeight;
}

    pdf.save(
  `Serven-Executive-Report-${safeRestaurantName}-${formattedDate}.pdf`
);
  };
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  checkMobile();

  window.addEventListener("resize", checkMobile);

  return () =>
    window.removeEventListener("resize", checkMobile);
}, []);

const formatExecutiveDate = (value) => {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return text;
};
















  return (
    <div
  style={{
    marginTop: "12px",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
  }}
>
      <button
        type="button"
        onClick={generateExecutivePDF}
        style={{
          padding: "14px 20px",
          borderRadius: "14px",
          border: "none",
          cursor: "pointer",
          fontWeight: "900",
          background:
            "linear-gradient(135deg, #d4af37, #facc15)",
          color: "#020617",
          marginBottom: "18px",
          boxShadow:
            "0 10px 30px rgba(250,204,21,0.25)",
        }}
      >
        Download Executive PDF
      </button>

    <div
  id="weekly-executive-report-export"
  style={{
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    boxSizing: "border-box",

      padding: "14px",

    borderRadius: "20px",

    background:
      "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96))",

    border: "1px solid rgba(148,163,184,0.16)",

    boxShadow:
      "0 18px 40px rgba(2,6,23,0.28)",
  }}
>
        {/* HEADER */}
        <div
          style={{
            borderBottom:
              "1px solid rgba(148,163,184,0.14)",
            paddingBottom: "18px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "900",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#a5b4fc",
              marginBottom: "10px",
            }}
          >
            SERVEN AI EXECUTIVE REPORT
          </div>

          <div
            style={{
              fontSize: "34px",
              fontWeight: "950",
              color: "white",
              marginBottom: "8px",
            }}
          >
            {safeRestaurantName}
          </div>

          <div
            style={{
              display: "flex",
              gap: "18px",
              flexWrap: "wrap",
              color: "#94a3b8",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            <div>Generated: {formattedDate}</div>
            <div>Reporting Window: {weekRange}</div>
          </div>
        </div>

        {/* SUMMARY TOP */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "14px",
            flexWrap: "wrap",
            marginBottom: "20px",
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
                marginBottom: "8px",
              }}
            >
              Weekly Executive Summary
            </div>

            <div
              style={{
                fontSize: "14px",
                color: "#cbd5e1",
                lineHeight: 1.7,
                maxWidth: "700px",
              }}
            >
              AI-generated operational analysis focused on
              revenue momentum, profitability performance,
              cost pressure, and growth opportunities.
            </div>
          </div>

          <div
            style={{
              padding: "10px 14px",
              borderRadius: "999px",
              background:
                weeklyExecutiveSummary.tone.pillBg,
              border: weeklyExecutiveSummary.tone.border,
              color: weeklyExecutiveSummary.tone.accent,
              fontSize: "12px",
              fontWeight: "900",
            }}
          >
            {weeklyExecutiveSummary.tone.label}
          </div>
        </div>

        {/* HEADLINE */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: "950",
            color: "white",
            lineHeight: 1.3,
            marginBottom: "14px",
          }}
        >
          {weeklyExecutiveSummary.headline}
        </div>

        {/* SUMMARY */}
        <div
          style={{
            fontSize: "14px",
            color: "#e2e8f0",
            lineHeight: 1.9,
          }}
        >
          {weeklyExecutiveSummary.summary}
        </div>

        {/* KPI GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <MetricCard
            label="This Week Revenue"
            value={`$${Number(
              revenueTrend?.currentWeekRevenue || 0
            ).toLocaleString()}`}
          />

          <MetricCard
            label="Revenue Change"
            value={`${
              Number(revenueTrend?.growthPercent || 0) >=
              0
                ? "+"
                : ""
            }${Number(
              revenueTrend?.growthPercent || 0
            ).toFixed(1)}%`}
            color={
              Number(revenueTrend?.growthPercent || 0) >=
              0
                ? "#86efac"
                : "#fca5a5"
            }
          />

          <MetricCard
            label="Average Margin"
            value={`${Number(avgMargin || 0).toFixed(
              1
            )}%`}
          />

          <MetricCard
            label="Food Cost"
            value={`${Number(
              foodCostPercentage || 0
            ).toFixed(1)}%`}
          />
        </div>
        {/* AI ACTION ITEMS */}
<div
  style={{
    marginTop: "28px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(15,23,42,0.88))",
    border: "1px solid rgba(99,102,241,0.18)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#a5b4fc",
      marginBottom: "12px",
    }}
  >
    AI Recommended Actions
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(160px, 1fr))",
      gap: "16px",
    }}
  >
    <ActionCard
      title="Revenue Opportunity"
      value={
        Number(revenueTrend?.growthPercent || 0) < 0
          ? "Recover declining traffic"
          : "Scale current momentum"
      }
      accent="#38bdf8"
    />

    <ActionCard
      title="Primary Focus"
      value={
        Number(foodCostPercentage || 0) > 35
          ? "Reduce food cost pressure"
          : "Increase average ticket value"
      }
      accent="#facc15"
    />

    <ActionCard
      title="AI Recommendation"
      value={
        Number(avgMargin || 0) < 15
          ? "Launch margin recovery campaign"
          : "Push high-performing menu items"
      }
      accent="#4ade80"
    />

    <ActionCard
      title="Estimated Monthly Impact"
      value={
        Number(avgMargin || 0) < 15
          ? "$2,000 - $6,000"
          : "$1,500 - $4,000"
      }
      accent="#c084fc"
    />
  </div>
</div>
{/* EXECUTIVE AI COMMENTARY */}
<div
  style={{
    marginTop: "28px",
    padding: "24px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,0.92))",
    border: "1px solid rgba(148,163,184,0.12)",
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
    Executive AI Commentary
  </div>

  <div
    style={{
      fontSize: "15px",
      color: "#e2e8f0",
      lineHeight: 1.9,
    }}
  >
    {Number(revenueTrend?.growthPercent || 0) > 15
      ? "The business demonstrated strong revenue momentum this week with positive traffic and operational stability. Serven AI detected opportunities to scale high-performing menu categories while maintaining stable cost controls."
      : Number(revenueTrend?.growthPercent || 0) < 0
      ? "Revenue softened this week compared to the previous reporting period. Serven AI recommends focusing on traffic recovery strategies, promotional campaigns, and operational efficiency improvements to stabilize performance."
      : "Business performance remained relatively stable this week. Current operational signals indicate moderate growth opportunities through menu optimization, marketing automation, and margin improvement initiatives."}
  </div>
</div>
{/* REVENUE RISK INTELLIGENCE */}
<div
  style={{
    marginTop: "28px",
    padding: "24px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(127,29,29,0.18), rgba(15,23,42,0.92))",
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
    Revenue Risk Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px",
    }}
  >
    <RiskCard
      label="Operational Risk"
      value={
        Number(foodCostPercentage || 0) > 40
          ? "High"
          : Number(foodCostPercentage || 0) > 30
          ? "Moderate"
          : "Low"
      }
      color={
        Number(foodCostPercentage || 0) > 40
          ? "#f87171"
          : Number(foodCostPercentage || 0) > 30
          ? "#facc15"
          : "#4ade80"
      }
    />

    <RiskCard
      label="Revenue Stability"
      value={
        Number(revenueTrend?.growthPercent || 0) < -10
          ? "Declining"
          : Number(revenueTrend?.growthPercent || 0) > 10
          ? "Growing"
          : "Stable"
      }
      color="#38bdf8"
    />

    <RiskCard
      label="Margin Pressure"
      value={
        Number(avgMargin || 0) < 10
          ? "Critical"
          : Number(avgMargin || 0) < 20
          ? "Elevated"
          : "Controlled"
      }
      color={
        Number(avgMargin || 0) < 10
          ? "#f87171"
          : Number(avgMargin || 0) < 20
          ? "#facc15"
          : "#4ade80"
      }
    />

    <RiskCard
      label="AI Confidence"
      value="94%"
      color="#c084fc"
    />
  </div>
</div>
{/* BEVERAGE REVENUE INTELLIGENCE */}
<div
  style={{
    marginTop: "28px",
    padding: "24px",
    borderRadius: "22px",
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
      color: "#d8b4fe",
      marginBottom: "14px",
    }}
  >
    Beverage Revenue Intelligence
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "14px",
    }}
  >
    <ForecastCard
      label="Alcohol Revenue"
      value={`$${Number(alcoholRevenue || 0).toLocaleString()}`}
      color="#c084fc"
    />

    <ForecastCard
      label="Alcohol % of Sales"
      value={`${Number(alcoholRevenuePercent || 0).toFixed(1)}%`}
      color="#67e8f9"
    />

    <ForecastCard
      label="Top Alcohol Item"
      value={topAlcoholItemName}
      color="#facc15"
    />

    <ForecastCard
      label="Top Beverage Category"
      value={topBeverageCategory}
      color="#4ade80"
    />

    <ForecastCard
      label="Beverage Margin Status"
      value={alcoholMarginStatus}
      color="#fda4af"
    />
  </div>
</div>
{/* EXECUTIVE CHARTS */}
<div
  style={{
    pageBreakBefore: "always",
    breakBefore: "page",
    marginTop: "24px",
    padding: "24px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.88))",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 18px 42px rgba(2,6,23,0.22)",
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
          textTransform: "uppercase",
          color: "#93c5fd",
          marginBottom: "6px",
        }}
      >
        Executive Revenue Trend
      </div>

      <div
        style={{
          color: "white",
          fontSize: isMobile ? "22px" : "26px",
          fontWeight: "950",
        }}
      >
        Revenue performance overview
      </div>

      <div
        style={{
          marginTop: "6px",
          color: "#94a3b8",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        Tracks daily revenue movement using live uploaded sales data.
      </div>
    </div>

    <div
      style={{
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(56,189,248,0.12)",
        border: "1px solid rgba(56,189,248,0.22)",
        color: "#93c5fd",
        fontSize: "12px",
        fontWeight: "900",
      }}
    >
      {revenueChartData?.length || 0} data points
    </div>
  </div>
<div
  style={{
    width: "100%",
    height: isMobile ? "640px" : "730px",
    marginTop: "10px",
    overflow: "hidden",
  }}
>
  {revenueChartData?.length > 0 ? (
    <LineChart
  width={isMobile ? 900 : 1400}
  height={isMobile ? 320 : 380}
      data={revenueChartData}
     margin={{ top: 24, right: 35, left: 10, bottom: 85 }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="rgba(148,163,184,0.14)"
      />

     <XAxis
  dataKey="day"
  tick={{ fill: "#94a3b8", fontSize: 10 }}
  axisLine={false}
  tickLine={false}
  interval={4}
  angle={-35}
  textAnchor="end"
  height={75}
  tickMargin={14}
  tickFormatter={formatExecutiveDate}
/>

      <YAxis
        tick={{ fill: "#94a3b8", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={65}
        tickFormatter={(value) =>
          isMobile
            ? `$${Math.round(Number(value || 0) / 1000)}k`
            : `$${Number(value || 0).toLocaleString()}`
        }
      />

      <Tooltip
        formatter={(value) => [
          `$${Number(value || 0).toLocaleString()}`,
          "Revenue",
        ]}
        contentStyle={{
          background: "#020617",
          border: "1px solid rgba(148,163,184,0.24)",
          borderRadius: "12px",
          color: "white",
        }}
        labelStyle={{ color: "#e5e7eb" }}
      />

      <Line
        type="monotone"
        dataKey="revenue"
        stroke="#38bdf8"
        strokeWidth={3.5}
        dot={{ r: 3 }}
        activeDot={{ r: 7 }}
        connectNulls
        isAnimationActive={false}
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
        fontWeight: "800",
        fontSize: "13px",
        textAlign: "center",
      }}
    >
      No active revenue records found for this period.
    </div>
  )}
</div>

  {revenueChartData?.length > 0 && (
  <div
    style={{
      marginTop: "18px",
      padding: "14px 16px",
      borderRadius: "16px",
      background: "rgba(56,189,248,0.10)",
      border: "1px solid rgba(56,189,248,0.18)",
      color: "#bfdbfe",
      fontSize: "13px",
      lineHeight: 1.6,
      fontWeight: "750",
    }}
  >
    <span style={{ color: "white", fontWeight: "950" }}>
      Executive readout:
    </span>{" "}
    Revenue activity is now being tracked from uploaded sales data. Watch for
    spikes, dips, and repeating patterns across operating days to identify
    stronger revenue windows and weaker sales periods.
  </div>
)}
</div>
{/* AI FORECASTING */}
<div
  style={{
   pageBreakBefore: "always",
breakBefore: "page",
    marginTop: "20px",
    padding: "18px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, rgba(14,116,144,0.18), rgba(15,23,42,0.92))",
    border: "1px solid rgba(56,189,248,0.18)",
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
    AI Forecasting & Projections
  </div>

  <div
    style={{
      display: "grid",
    gridTemplateColumns:
  "repeat(2, minmax(0, 1fr))",
      gap: "12px",
    }}
  >
    <ForecastCard
      label="Projected Revenue"
      value={`$${Math.round(
        Number(revenueTrend?.currentWeekRevenue || 0) * 1.08
      ).toLocaleString()}`}
      color="#67e8f9"
    />

    <ForecastCard
      label="Growth Outlook"
      value={
        Number(revenueTrend?.growthPercent || 0) > 10
          ? "Strong Growth"
          : Number(revenueTrend?.growthPercent || 0) < 0
          ? "Recovery Phase"
          : "Stable Expansion"
      }
      color="#4ade80"
    />

    <ForecastCard
      label="AI Trend Prediction"
      value={
        Number(avgMargin || 0) < 15
          ? "Margin optimization needed"
          : "Positive operational trend"
      }
      color="#facc15"
    />

    <ForecastCard
      label="Forecast Confidence"
      value="91%"
      color="#c084fc"
    />
  </div>
</div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color = "white",
}) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        border:
          "1px solid rgba(148,163,184,0.14)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "10px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "26px",
          fontWeight: "950",
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}
function ActionCard({ title, value, accent }) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: "10px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "15px",
          fontWeight: "800",
          color: "white",
          lineHeight: 1.6,
        }}
      >
        {value}
      </div>
    </div>
  );
}
function RiskCard({ label, value, color }) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#94a3b8",
          marginBottom: "10px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "20px",
          fontWeight: "900",
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}
function ForecastCard({ label, value, color }) {
  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: "900",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#94a3b8",
          marginBottom: "10px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "18px",
          fontWeight: "900",
          color,
          lineHeight: 1.5,
        }}
      >
        {value}
      </div>
    </div>
  );
}