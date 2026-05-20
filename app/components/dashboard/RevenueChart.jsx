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

export default function RevenueChart({ data, isMobile = false }) {
  const chartData = Array.isArray(data)
    ? data
    : Array.isArray(data?.revenueData)
    ? data.revenueData
    : [];

  return (
    <div
      style={{
        marginTop: isMobile ? "20px" : "40px",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflowX: "hidden",
      }}
    >
      <h2
        style={{
          color: "white",
          marginBottom: "16px",
          fontSize: isMobile ? "20px" : "26px",
        }}
      >
        📈 Weekly Revenue
      </h2>

      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          height: isMobile ? "240px" : "320px",
          overflow: "hidden",
        }}
      >
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: isMobile ? 8 : 18,
                left: isMobile ? -18 : 0,
                bottom: isMobile ? 18 : 8,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.18)"
              />

              <XAxis
                dataKey="day"
                tick={{
                  fill: "#94a3b8",
                  fontSize: isMobile ? 9 : 12,
                }}
                interval={isMobile ? 1 : 0}
                angle={isMobile ? -20 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fill: "#94a3b8",
                  fontSize: isMobile ? 9 : 12,
                }}
                width={isMobile ? 42 : 60}
                axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
                tickLine={false}
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
                  borderRadius: "14px",
                  color: "white",
                }}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#8b5cf6"
                strokeWidth={isMobile ? 3 : 4}
                dot={false}
                activeDot={{
                  r: isMobile ? 5 : 7,
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