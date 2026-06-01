"use client";

import DashboardHeader from "./DashboardHeader";
import DashboardTabs from "./DashboardTabs";
import KPISection from "./KPISection";
import RevenueChart from "./RevenueChart";
import AIInsightsPanel from "./AIInsightsPanel";
import FilterBar from "./FilterBar";
import SectionCard from "./SectionCard";

export default function DashboardLayout({ data }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "3fr 1fr",
      gap: "30px",
      padding: "20px",
      background: "#f9fafb",
      minHeight: "100vh"
    }}>
      
      {/* LEFT SIDE */}
      <div>
        <DashboardHeader />

   <DashboardTabs
  data={{
    ...data,
    isKitchenManagerRole: data.isKitchenManagerRole,
    isGMRole: data.isGMRole,
  }}
/>

        <FilterBar data={data} />

        {/* OVERVIEW TAB */}
        {data.activeTab === "overview" && (
          <>
            <KPISection data={data} />

            <SectionCard title="📈 Revenue Insights">
              <p>
                Best Day: <strong>{data.bestDay.day}</strong>
              </p>
              <p>
                Avg Revenue: ${data.avgRevenue.toLocaleString()}
              </p>
            </SectionCard>

            <RevenueChart data={data} />
          </>
        )}

        {/* LABOR TAB */}
        {data.activeTab === "labor" && (
          <SectionCard title="👨‍🍳 Labor Optimization">
            {data.laborByDay.map((d, i) => (
              <div key={i} style={{
                padding: "10px",
                borderRadius: "10px",
                marginBottom: "8px",
                background:
                  d.percent > 30
                    ? "#fee2e2"
                    : d.percent < 20
                    ? "#fef9c3"
                    : "#dcfce7"
              }}>
                {d.day} — {d.percent.toFixed(1)}% ({d.status})
              </div>
            ))}
          </SectionCard>
        )}

        {/* AI TAB */}
        {data.activeTab === "ai" && (
          <SectionCard title="🧠 AI Intelligence">
            <p>Score: {data.score}/100</p>

            {data.aiRecommendations.map((r, i) => (
              <p key={i}>• {r}</p>
            ))}
          </SectionCard>
        )}
      </div>

      {/* RIGHT PANEL */}
      <AIInsightsPanel data={data} />
    </div>
  );
}