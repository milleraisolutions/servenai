"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function RevenueChart({ data }) {
  const chartData = Array.isArray(data)
    ? data
    : Array.isArray(data?.revenueData)
    ? data.revenueData
    : [];

  return (
    <div
      style={{
        marginTop: "40px",
        width: "100%",
        minWidth: 0,
      }}
    >
      <h2 style={{ color: "white", marginBottom: "16px" }}>
        📈 Weekly Revenue
      </h2>

      <div
        style={{
          width: "100%",
          height: "320px",
          minWidth: 0,
        }}
      >
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 18, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.18)"
              />

              <XAxis
                dataKey="day"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
                tickLine={false}
                tickFormatter={(value) =>
                  `$${Number(value || 0).toLocaleString()}`
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
                  borderRadius: "14px",
                  color: "white",
                }}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#8b5cf6"
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
          </ResponsiveContainer>
        ) : (
          <div style={{ color: "#94a3b8", padding: "24px" }}>
            No revenue data yet.
          </div>
        )}
      </div>
    </div>
  );
}