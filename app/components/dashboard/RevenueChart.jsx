"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function RevenueChart({ data, isMobile = false, revenueTracker }) {
  // Safe data extraction parsing layer
  const revenueChartData = Array.isArray(data)
    ? data
    : Array.isArray(data?.revenueData)
    ? data.revenueData
    : [];

  return (
    <div
      style={{
        marginBottom: "0px",
        padding: "24px",
        borderRadius: "22px",
        minHeight: "520px",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at top right, rgba(99,102,241,0.12), transparent 40%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
      }}
    >
      {/* Header Section */}
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

      {/* Chart Canvas Area */}
      <div
        style={{
          width: "100%",
          marginTop: "12px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {revenueChartData?.length > 0 ? (
          <AreaChart
            width={isMobile ? 310 : 500} 
            height={isMobile ? 300 : 380}
            data={revenueChartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            {/* Glowing Area Fill Definition */}
            <defs>
              <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.12)"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={15}
            />

            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={65}
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
              labelStyle={{ color: "#e5e7eb" }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#8b5cf6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#revenueGlow)"
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <div style={{ color: "#94a3b8", padding: "24px" }}>
            No daily revenue data available yet.
          </div>
        )}
      </div>

      {/* Insights Banner */}
      {revenueChartData?.length > 0 && (
        <div
          style={{
            marginTop: "auto",
            padding: "14px 16px",
            borderRadius: "16px",
            background: "rgba(139,92,246,0.10)",
            border: "1px solid rgba(139,92,246,0.22)",
            color: "#ddd6fe",
            fontSize: "13px",
            lineHeight: 1.6,
            fontWeight: "750",
          }}
        >
          <span style={{ color: "white", fontWeight: "950" }}>
            Revenue insight:
          </span>{" "}
          {revenueTracker?.bestDay?.day || "Your strongest day"} is currently your
          top-performing sales day, generating{" "}
          <span style={{ color: "#c4b5fd", fontWeight: "950" }}>
            ${Number(revenueTracker?.bestDay?.revenue || 0).toLocaleString()}
          </span>
          . Review slower days for promo, staffing, or menu opportunities.
        </div>
      )}
    </div>
  );
}