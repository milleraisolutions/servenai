
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
const [restaurantName, setRestaurantName] = useState("");
const [contactName, setContactName] = useState("");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");
const [city, setCity] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleDemoSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  const demoPayload = {
    restaurant_name: restaurantName,
    contact_name: contactName,
    email: email,
    phone: phone,
    city: city,
  };

  try {
    // 1. Inbound row update directly to your Supabase demo_leads table
    const { error: supabaseError } = await supabase
      .from("demo_leads")
      .insert([demoPayload]);

    if (supabaseError) {
      console.error("Supabase Save Error:", supabaseError);
      alert("There was an issue saving your request. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // 2. Instant alert to your inbox using your unified API route
    await fetch("/api/send-client-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        restaurantName: restaurantName,
        contactName: contactName,
        phone: phone,
        city: city,
        type: "demo_notification", // Hits the custom Resend code block we just added
      }),
    });

    alert("Demo booked successfully! The SerVen team will reach out shortly.");
    
    // Clear inputs on success
    setRestaurantName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setCity("");

  } catch (error) {
    console.error("Form Submission Flow Error:", error);
    alert("Something went wrong, but your data may have been logged.");
  } finally {
    setIsSubmitting(false);
  }
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
    padding: isMobile ? "60px 0 40px" : "120px 0 80px",
    overflow: "hidden"
  }}
>
  <div style={containerStyle}>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
        gap: isMobile ? "48px" : "64px",
        alignItems: "center",
      }}
    >
      {/* Left Column: Copy & CTAs */}
      <div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            borderRadius: "999px",
            background: "rgba(212, 175, 55, 0.08)",
            border: "1px solid rgba(212, 175, 55, 0.2)",
            color: "#d4af37",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "0.05em",
            marginBottom: "24px",
          }}
        >
          <span>●</span> AI-POWERED RESTAURANT OPERATIONS
        </div>

        <h1
          style={{
            fontSize: isMobile ? "40px" : "64px",
            lineHeight: isMobile ? "1.1" : "1.05",
            letterSpacing: "-0.04em",
            fontWeight: "900",
            marginBottom: "20px",
            color: "#ffffff"
          }}
        >
          Stop Profit Leaks. <br />
          <span
            style={{
              background: "linear-gradient(90deg, #d4af37 0%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Maximize Margins.
          </span>
        </h1>

        <p
          style={{
            fontSize: isMobile ? "17px" : "19px",
            lineHeight: "1.6",
            color: "#94a3b8",
            maxWidth: "580px",
            marginBottom: "36px",
          }}
        >
          SerVen turns your chaotic restaurant data into clear operational blueprints. 
          Uncover hidden margin leakage across labor, food costs, and menu performance 
          with real-time intelligence built for full-service venues.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexDirection: isMobile ? "column" : "row",
            marginBottom: "40px",
          }}
        >
          <Link href="/signup" style={{ ...primaryButton, textAlign: "center" }}>
            Request Profit Analysis
          </Link>
          <a href="#demo" style={{ ...secondaryButton, textAlign: "center" }}>
            Explore the Platform
          </a>
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {[
            "Food Cost Monitoring",
            "Labor Optimization",
            "Menu Profitability",
            "Predictive Staffing",
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#cbd5e1",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Dashboard Card View */}
      <div id="demo" style={{ width: "100%", overflow: "hidden" }}>
        <div style={{ ...dashboardCard, position: "relative", padding: isMobile ? "16px" : "24px" }}>
          
          {/* Background Glows */}
          <div
            style={{
              position: "absolute",
              top: "-20px",
              right: "-20px",
              width: "140px",
              height: "140px",
              borderRadius: "999px",
              background: "rgba(124, 58, 237, 0.25)",
              filter: "blur(40px)",
              pointerEvents: "none"
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-20px",
              left: "-20px",
              width: "140px",
              height: "140px",
              borderRadius: "999px",
              background: "rgba(212, 175, 55, 0.15)",
              filter: "blur(40px)",
              pointerEvents: "none"
            }}
          />

          {/* Card Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", letterSpacing: "0.05em" }}>
                COMMAND CENTER
              </div>
              <div style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: "800", color: "#ffffff" }}>
                Live Operations
              </div>
            </div>

            <div
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                background: "rgba(34,197,94,0.1)",
                color: "#4ade80",
                border: "1px solid rgba(34,197,94,0.15)",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.05em"
              }}
            >
              ● AI LIVE
            </div>
          </div>

          {/* Stats Row - Adaptive Grid for Mobile */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr", 
              gap: "12px",
              marginBottom: "16px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ ...statCard, padding: isMobile ? "12px" : "16px" }}>
              <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700" }}>
                WEEKLY REVENUE
              </div>
              <div style={{ color: "#ffffff", fontSize: isMobile ? "22px" : "28px", fontWeight: "900", marginTop: "6px" }}>
                $24,860
              </div>
              <div style={{ color: "#4ade80", fontSize: "12px", marginTop: "4px", fontWeight: "600" }}>
                ↑ 12.4%
              </div>
            </div>

            <div style={{ ...statCard, padding: isMobile ? "12px" : "16px" }}>
              <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700" }}>
                FOOD COST %
              </div>
              <div style={{ color: "#ffffff", fontSize: isMobile ? "22px" : "28px", fontWeight: "900", marginTop: "6px" }}>
                31.2%
              </div>
              <div style={{ color: "#f59e0b", fontSize: "12px", marginTop: "4px", fontWeight: "600" }}>
                High Alert
              </div>
            </div>
          </div>

          {/* Main Profit Highlight Banner */}
          <div
            style={{
              ...glassCard,
              padding: "16px",
              marginBottom: "16px",
              position: "relative",
              zIndex: 1,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)"
            }}
          >
            <div style={{ color: "#a78bfa", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "4px" }}>
              MARGIN RECOVERY OPPORTUNITY
            </div>
            <div style={{ fontSize: "26px", fontWeight: "900", color: "#ffffff", marginBottom: "4px" }}>
              +$3,240<span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>/mo</span>
            </div>
            <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: "1.5" }}>
              Optimizing Tuesday labor schedules and adjusting 3 underpriced menu items detected.
            </div>
          </div>

          {/* Actionable Alerts Stack */}
          <div style={{ display: "grid", gap: "8px", position: "relative", zIndex: 1 }}>
            {[
              { title: "Menu Pricing Alert", text: "2 top sellers are performing under target margins." },
              { title: "Labor Optimization", text: "Tuesday dinner shifts are currently overstaffed by 1.5 hrs." }
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ fontWeight: "700", fontSize: "13px", color: "#ffffff", marginBottom: "2px" }}>
                  {item.title}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: "1.4" }}>
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

{/* TRY YOUR DATA */}
<section style={{ padding: isMobile ? "40px 0" : "80px 0" }}>
  <div style={containerStyle}>
    <div
      style={{
        ...glassCard,
        padding: isMobile ? "24px 16px" : "48px 40px",
        borderRadius: "24px",
        textAlign: "center",
        background: "rgba(15, 23, 42, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}
    >
      <div
        style={{
          color: "#d4af37",
          fontWeight: "800",
          fontSize: "12px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        Interactive Simulator
      </div>

      <h2 style={{ fontSize: isMobile ? "28px" : "42px", fontWeight: "900", marginBottom: "12px", color: "#ffffff", letterSpacing: "-0.03em" }}>
        See What SerVen Finds in Your Data
      </h2>

      <p
        style={{
          color: "#94a3b8",
          fontSize: isMobile ? "15px" : "17px",
          lineHeight: 1.6,
          maxWidth: "680px",
          margin: "0 auto 32px",
        }}
      >
        Upload a standard sales export or sample report below. SerVen will securely scan it to instantly map out margin leaks and operational inefficiencies.
      </p>

      {/* Upload Zone Drop Box */}
      <label
        style={{
          display: "block",
          maxWidth: "620px",
          margin: "0 auto 32px",
          padding: isMobile ? "32px 16px" : "44px 24px",
          borderRadius: "20px",
          background: "radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent 50%), rgba(255,255,255,0.02)",
          border: "1px dashed rgba(212,175,55,0.4)",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.border = "1px dashed rgba(212,175,55,0.7)";
          e.currentTarget.style.background = "radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 50%), rgba(255,255,255,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.border = "1px dashed rgba(212,175,55,0.4)";
          e.currentTarget.style.background = "radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent 50%), rgba(255,255,255,0.02)";
        }}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const { data: { session } } = await supabase.auth.getSession();
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
                const value = Number(row.total || row.Total || row.sales || row.Sales || row.amount || row.Amount || row.revenue || row.Revenue || 0) || 0;
                return sum + value;
              }, 0);

              const foodCost = rows.reduce((sum, row) => {
                const value = Number(row.foodCost || row.FoodCost || row.food_cost || row["Food Cost"] || 0) || 0;
                return sum + value;
              }, 0);

              const laborCost = rows.reduce((sum, row) => {
                const value = Number(row.laborCost || row.LaborCost || row.labor_cost || row["Labor Cost"] || 0) || 0;
                return sum + value;
              }, 0);

              const averageSale = revenue / Math.max(rows.length, 1);
              const foodCostPercent = revenue > 0 ? (foodCost / revenue) * 100 : 0;
              const laborCostPercent = revenue > 0 ? (laborCost / revenue) * 100 : 0;
              const primeCost = foodCost + laborCost;
              const primeCostPercent = revenue > 0 ? (primeCost / revenue) * 100 : 0;
              
              let primeCostStatus = "Healthy";
              let primeCostMessage = "Prime cost is within healthy operational range.";
              let operationalRecommendations = [];

              if (foodCostPercent >= 32) operationalRecommendations.push("Review high-cost menu items and ingredient waste assets.");
              if (laborCostPercent >= 30) operationalRecommendations.push("Evaluate staffing efficiency during slower operating mid-week periods.");
              if (primeCostPercent >= 65) operationalRecommendations.push("Prime cost is critically elevated and requires immediate operational menu tier restructuring.");
              if (operationalRecommendations.length === 0) operationalRecommendations.push("Operations are performing cleanly within target baseline metric benchmarks.");

              if (primeCostPercent >= 65) {
                primeCostStatus = "Critical";
                primeCostMessage = "Prime cost is significantly above target operational thresholds.";
              } else if (primeCostPercent >= 55) {
                primeCostStatus = "Warning";
                primeCostMessage = "Prime cost is approaching unhealthy operational levels.";
              }

              const estimatedProfitLeak = Math.max(0, foodCostPercent > 32 ? revenue * 0.08 : revenue * 0.04);

              const primeCostTrendData = rows.slice(0, 14).map((row, index) => {
                const rowRevenue = Number(row.total || row.Total || row.sales || row.Sales || row.amount || row.Amount || row.revenue || row.Revenue || 0) || 0;
                const rowFoodCost = Number(row.foodCost || row.FoodCost || row.food_cost || row["Food Cost"] || 0) || 0;
                const rowLaborCost = Number(row.laborCost || row.LaborCost || row.labor_cost || row["Labor Cost"] || 0) || 0;
                const rowPrimeCostPercent = rowRevenue > 0 ? ((rowFoodCost + rowLaborCost) / rowRevenue) * 100 : 0;
                const rawDate = row.date || row.Date || row.day || row.Day;
                
                let formattedLabel;
                if (typeof rawDate === "number") {
                  const excelDate = XLSX.SSF.parse_date_code(rawDate);
                  formattedLabel = `${excelDate.m}/${excelDate.d}`;
                } else {
                  formattedLabel = rawDate || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index % 7];
                }

                return {
                  label: formattedLabel,
                  primeCostPercent: Number(rowPrimeCostPercent.toFixed(1)),
                };
              });

              const menuEngineeringData = rows.slice(0, 5).map((row, index) => {
                const itemName = row.item || row.Item || row.name || row.Name || row.menuItem || row["Menu Item"] || `Item ${index + 1}`;
                const itemRevenue = Number(row.total || row.Total || row.sales || row.Sales || row.revenue || row.Revenue || 0) || 0;
                const itemFoodCost = Number(row.foodCost || row.FoodCost || row.food_cost || row["Food Cost"] || 0) || 0;
                const itemMargin = itemRevenue > 0 ? ((itemRevenue - itemFoodCost) / itemRevenue) * 100 : 0;

                return { itemName, margin: Number(itemMargin.toFixed(1)), revenue: itemRevenue };
              }).sort((a, b) => b.margin - a.margin);

              const shiftIntelligenceData = [
                { shift: "Lunch", revenue: revenue * 0.32, laborCost: laborCost * 0.28 },
                { shift: "Dinner", revenue: revenue * 0.68, laborCost: laborCost * 0.72 },
              ].map((shift) => {
                const salesPerLaborHour = shift.laborCost > 0 ? shift.revenue / (shift.laborCost / 18) : 0;
                return { ...shift, salesPerLaborHour: Number(salesPerLaborHour.toFixed(1)) };
              });

              const bestShift = [...shiftIntelligenceData].sort((a, b) => b.salesPerLaborHour - a.salesPerLaborHour)[0];
              const weakestShift = [...shiftIntelligenceData].sort((a, b) => a.salesPerLaborHour - b.salesPerLaborHour)[0];

              const executiveSummary = `Prime Cost is currently ${primeCostPercent.toFixed(1)}%, displaying ${primeCostStatus === "Critical" ? "high financial compression metrics" : primeCostStatus === "Warning" ? "moderate operational strain patterns" : "excellent target threshold pacing"}.\n\nPrimary Optimization Route: ${operationalRecommendations[0]}\n\nTop Yielding Window: ${bestShift?.shift || "Dinner System"} returning $${Number(bestShift?.salesPerLaborHour || 0).toLocaleString()} transactional rate per active labor hour.`;

              setDemoResult({
                rows: rows.length, revenue, foodCost, laborCost, primeCost, averageSale,
                foodCostPercent, laborCostPercent, primeCostPercent, primeCostStatus, primeCostMessage,
                operationalRecommendations, primeCostTrendData, menuEngineeringData, shiftIntelligenceData,
                bestShift, weakestShift, executiveSummary, estimatedProfitLeak,
              });

            } catch (err) {
              console.error(err);
              alert("Unable to interpret this file layout configuration.");
            }
          }}
        />

        <div style={{ fontSize: "36px", marginBottom: "16px" }}>📊</div>
        <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>
          Drop your operations file here
        </div>
        <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "14px" }}>
          Supports standard .CSV, .XLSX sales metrics sheets
        </div>
        <div
          style={{
            display: "inline-flex",
            padding: "8px 18px",
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#e2e8f0",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          Select File From Local Device
        </div>
      </label>

      {/* DYNAMIC RESULT DASHBOARD DISPLAY */}
      {demoResult && (
        <div
          style={{
            marginTop: "32px",
            padding: isMobile ? "16px" : "28px",
            borderRadius: "20px",
            background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(2, 6, 23, 0.95))",
            border: "1px solid rgba(212, 175, 55, 0.15)",
            color: "white",
            textAlign: "left",
            marginBottom: "32px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <div style={{ color: "#4ade80", fontSize: "11px", fontWeight: "800", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                SIMULATION CONCLUDED
              </div>
              <h3 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>
                SerVen Live Diagnostic Run
              </h3>
            </div>
            <div style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "700",
              background: demoResult.primeCostStatus === "Critical" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
              color: demoResult.primeCostStatus === "Critical" ? "#fca5a5" : "#86efac"
            }}>
              {demoResult.primeCostStatus} State
            </div>
          </div>

          {/* Metric Stats Adaptive Matrix */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            {[
              { label: "Lines Parsed", value: demoResult.rows },
              { label: "Gross Revenue", value: `$${Math.round(demoResult.revenue).toLocaleString()}` },
              { label: "Food Cost Margin", value: `${demoResult.foodCostPercent.toFixed(1)}%` },
              { label: "Labor Allocation", value: `${demoResult.laborCostPercent.toFixed(1)}%` },
              { label: "Combined Prime Cost", value: `${demoResult.primeCostPercent.toFixed(1)}%`, highlight: true },
              { label: "Annualized Leakage Projection", value: `$${Math.round(demoResult.estimatedProfitLeak).toLocaleString()}`, leak: true },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "16px 14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.02)",
                  border: item.highlight ? "1px solid rgba(212,175,55,0.3)" : item.leak ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.05)",
                  gridColumn: isMobile && idx >= 4 ? "span 2" : "auto"
                }}
              >
                <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", marginBottom: "6px", textTransform: "uppercase" }}>
                  {item.label}
                </div>
                <div style={{ color: item.leak ? "#fca5a5" : item.highlight ? "#d4af37" : "#ffffff", fontSize: "20px", fontWeight: "900" }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Fixed Recharts Mobile Graph Container */}
          <div
            style={{
              marginTop: "24px",
              padding: "20px 14px 10px",
              borderRadius: "16px",
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "800", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px" }}>
              Dynamic Prime Cost Tracking Vector
            </div>

            {/* CRITICAL: Set explicit minHeight to protect against mobile height collapsing */}
            <div style={{ width: "100%", height: "260px", minHeight: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demoResult.primeCostTrendData || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(val) => `${val}%`} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`${Number(val).toFixed(1)}%`, "Prime Cost"]}
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  
                  {/* CRITICAL REMOVAL: Outer fragment layer stripped to prevent Recharts rendering breaks */}
                  <Line type="monotone" dataKey="primeCostPercent" name="Your Run %" stroke="#d4af37" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey={() => 55} name="Target Threshold" stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey={() => 65} name="Danger Threshold" stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Strategy Overview Card */}
          <div style={{ marginTop: "20px", padding: "16px", borderRadius: "14px", background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
            <div style={{ color: "#c4b5fd", fontSize: "11px", fontWeight: "800", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "6px" }}>
              AI Analytical Assessment
            </div>
            <p style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
              {demoResult.primeCostPercent >= 65
                ? "Warning: Your combined operating metrics track past industry critical danger limits. System logic recommends immediate auditing of current variable work timetables and supplier unit scales."
                : demoResult.primeCostPercent >= 55
                ? "Notice: Financial lines display high susceptibility to mid-tier operating friction. Active monitoring of inventory tracking pipelines is advised."
                : "Optimal: Structural cost pacing tracks cleanly within standard premium performance thresholds. Scale pathways look structurally secure."}
            </p>
          </div>

          {/* Executive Summary Block Layout */}
          <div style={{ marginTop: "12px", padding: "16px", borderRadius: "14px", background: "rgba(212, 175, 55, 0.05)", border: "1px solid rgba(212, 175, 55, 0.15)" }}>
            <div style={{ color: "#fcd34d", fontSize: "11px", fontWeight: "800", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
              Executive Brief Blueprint Preview
            </div>
            <p style={{ color: "#e2e8f0", fontSize: "13px", lineHeight: "1.6", margin: 0, whiteSpace: "pre-line" }}>
              {demoResult.executiveSummary}
            </p>
          </div>

          {/* Menu Performance Pricing Tiers */}
          <div style={{ marginTop: "12px", padding: "16px", borderRadius: "14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "800", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "12px" }}>
              Target Menu Engineering Insights
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              {demoResult.menuEngineeringData?.map((item, idx) => (
                <div key={idx} style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ color: "#ffffff", fontWeight: "700", fontSize: "14px" }}>{item.itemName}</div>
                    <div style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>Gross: ${Math.round(item.revenue).toLocaleString()}</div>
                  </div>
                  <div style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    background: item.margin >= 65 ? "rgba(34,197,94,0.1)" : item.margin >= 45 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                    color: item.margin >= 65 ? "#4ade80" : item.margin >= 45 ? "#fbbf24" : "#f87171"
                  }}>
                    {item.margin.toFixed(1)}% Margin
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Form Call To Action Anchor */}
      <button
        style={{
          width: isMobile ? "100%" : "auto",
          padding: "14px 28px",
          borderRadius: "12px",
          background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
          color: "white",
          fontWeight: "800",
          fontSize: "15px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
          transition: "transform 0.15s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        onClick={() => { window.location.href = "/signup?intent=demo"; }}
      >
        Lock In Full Profit Assessment Profile
      </button>
    </div>
  </div>
</section>


{/* PLATFORM DEMO */}
<section style={{ padding: isMobile ? "45px 0" : "80px 0", position: "relative", overflow: "hidden" }}>
  <div style={containerStyle}>
    <div
  style={{
    ...glassCard,
    padding: isMobile ? "24px 16px" : "48px 40px",
    position: "relative",
    overflow: "hidden",
    background: "rgba(15, 23, 42, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.05)"
  }}
>
      {/* Decorative Blur Vectors */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: "rgba(99, 102, 241, 0.12)",
          filter: "blur(44px)",
          pointerEvents: "none"
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-50px",
          left: "-50px",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: "rgba(212, 175, 55, 0.08)",
          filter: "blur(44px)",
          pointerEvents: "none"
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            color: "#d4af37",
            fontWeight: "800",
            fontSize: "12px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          System Interface
        </div>

        <h2
          style={{
            fontSize: isMobile ? "28px" : "42px",
            fontWeight: "900",
            lineHeight: isMobile ? "1.2" : "1.1",
            textAlign: "center",
            marginBottom: "14px",
            color: "#ffffff",
            letterSpacing: "-0.02em"
          }}
        >
          See How SerVen Uncovers Hidden Operational Profit Leaks
        </h2>

        <p
          style={{
            color: "#94a3b8",
            fontSize: isMobile ? "15px" : "17px",
            lineHeight: 1.6,
            maxWidth: "720px",
            margin: "0 auto 40px",
            textAlign: "center",
          }}
        >
          Explore the dashboard architecture management teams track to isolate margin compression, stabilize staffing schedules, and reveal immediate cost recovery pipelines.
        </p>

        {/* Unified Responsive Application Matrix */}
        <div
          style={{
            ...glassCard,
            padding: isMobile ? "12px" : "24px",
            maxWidth: "1040px",
            margin: "0 auto",
            width: "100%",
            background: "rgba(2, 6, 23, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.03)"
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr",
              gap: isMobile ? "16px" : "24px",
              alignItems: "stretch",
            }}
          >
            {/* Left Console Workspace Card */}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                padding: isMobile ? "16px 12px" : "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      fontWeight: "800",
                      letterSpacing: "0.05em",
                      marginBottom: "4px",
                    }}
                  >
                    ANALYTICS ENGINE PREVIEW
                  </div>
                  <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: "900", color: "#ffffff" }}>
                    Performance Overview
                  </div>
                </div>

                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "999px",
                    background: "rgba(34, 197, 94, 0.1)",
                    color: "#4ade80",
                    border: "1px solid rgba(34, 197, 94, 0.15)",
                    fontSize: "11px",
                    fontWeight: "800",
                    letterSpacing: "0.03em"
                  }}
                >
                  ● SIMULATOR ACTIVE
                </div>
              </div>

              {/* Internal KPI Block Matrix */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                {[
                  { label: "Detected Receipts", value: "$24,860", sub: "+12.4% Pacing", color: "#4ade80" },
                  { label: "Target Cost Threshold", value: "31.2%", sub: "Action Advised", color: "#f87171" },
                  { label: "System Health Vector", value: "84/100", sub: "Stable Baseline", color: "#38bdf8" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.02em" }}>
                      {item.value}
                    </div>
                    <div style={{ color: item.color, fontSize: "12px", fontWeight: "600", marginTop: "4px" }}>
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* CSS Decorative Analytics Bar Vector wrapper */}
              <div
                style={{
                  height: "140px",
                  borderRadius: "12px",
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.03)",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: isMobile ? "6px" : "12px",
                  padding: "16px",
                }}
              >
                {[45, 76, 62, 90, 68, 115, 82].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      borderRadius: "6px 6px 3px 3px",
                      background: "linear-gradient(180deg, #d4af37 0%, #4f46e5 100%)",
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Right Feed Panel Workspace Card */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  {
                    title: "Product Valuation Discrepancy",
                    text: "Two high-volume inventory assets are scaling below primary margin targets.",
                    badge: "Pricing Alert",
                    color: "rgba(212, 175, 55, 0.1)",
                    textColor: "#fcd34d"
                  },
                  {
                    title: "Labor Allocation Overages",
                    text: "Mid-week floor schedule variables exceed historical targets by 4.2%.",
                    badge: "Staffing Pressure",
                    color: "rgba(239, 68, 68, 0.1)",
                    textColor: "#fca5a5"
                  },
                  {
                    title: "Inventory Exhaustion Matrix",
                    text: "Primary operational ingredient consumption tracking patterns show rapid utilization increase.",
                    badge: "Supply Signal",
                    color: "rgba(56, 189, 248, 0.1)",
                    textColor: "#7dd3fc"
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "14px",
                      padding: "16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", gap: "10px" }}>
                      <div style={{ fontWeight: "800", fontSize: "15px", color: "#ffffff" }}>
                        {item.title}
                      </div>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: item.color, color: item.textColor, fontWeight: "700", whiteSpace: "nowrap", textTransform: "uppercase" }}>
                        {item.badge}
                      </span>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5" }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Global Functional Controls Wrapper */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexDirection: isMobile ? "column" : "row",
                  marginTop: "12px",
                }}
              >
                <Link 
                  href="/signup" 
                  style={{ 
                    ...primaryButton, 
                    width: isMobile ? "100%" : "auto",
                    textAlign: "center"
                  }}
                >
                  Generate Private Diagnostic Run
                </Link>
                <Link 
                  href="/dashboard" 
                  style={{ 
                    ...secondaryButton, 
                    width: isMobile ? "100%" : "auto",
                    textAlign: "center"
                  }}
                >
                  Explore Control Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* BOOK / REQUEST DEMO CTA */}
<section style={{ padding: isMobile ? "32px 0 64px" : "60px 0 100px", position: "relative" }}>
  <div style={containerStyle}>
    <div
      style={{
        ...glassCard,
        padding: isMobile ? "32px 18px" : "56px 40px",
        textAlign: "center",
        borderRadius: "24px",
        background: "linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(30, 41, 59, 0.25) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      <div
        style={{
          color: "#d4af37",
          fontWeight: "900",
          fontSize: "12px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}
      >
        Built For Real Restaurant Numbers
      </div>

      <h2
        style={{
          fontSize: isMobile ? "28px" : "44px",
          fontWeight: "950",
          marginBottom: "16px",
          lineHeight: isMobile ? "1.2" : "1.1",
          color: "#ffffff",
          letterSpacing: "-0.02em"
        }}
      >
        See what SerVen would find in your business.
      </h2>

      <p
        style={{
          color: "#94a3b8",
          fontSize: isMobile ? "15px" : "18px",
          lineHeight: isMobile ? 1.6 : 1.7,
          maxWidth: "720px",
          margin: "0 auto 36px",
        }}
      >
        Create a demo profile, upload sample sales data, or request custom
        pricing so we can estimate where your restaurant may be leaking profit.
      </p>

      {/* Responsive Interactive Control Array */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
          flexDirection: isMobile ? "column" : "row",
          maxWidth: isMobile ? "100%" : "none",
          margin: "0 auto",
        }}
      >
        <Link 
          href="/signup" 
          style={{
            ...primaryButton,
            width: isMobile ? "100%" : "auto",
            minWidth: isMobile ? "none" : "200px",
            textAlign: "center"
          }}
        >
          Create Demo Profile
        </Link>

        <Link 
          href="/pricing" 
          style={{
            ...secondaryButton,
            width: isMobile ? "100%" : "auto",
            minWidth: isMobile ? "none" : "200px",
            textAlign: "center"
          }}
        >
          Request Custom Pricing
        </Link>
      </div>
    </div>
  </div>
</section>

     {/* TRUST BAR */}
<section style={{ padding: isMobile ? "12px 0 24px" : "16px 0 32px" }}>
  <div style={containerStyle}>
    <div
      style={{
        ...glassCard,
        padding: isMobile ? "14px 16px" : "18px 32px",
        display: "flex",
        justifyContent: isMobile ? "center" : "space-between",
        alignItems: "center",
        gap: isMobile ? "12px 24px" : "20px",
        flexWrap: "wrap",
        color: "#94a3b8",
        fontWeight: "700",
        fontSize: isMobile ? "11px" : "13px",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        background: "rgba(15, 23, 42, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.03)",
        textAlign: "center"
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
        Restaurant-First AI
      </span>
      {!isMobile && <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>}
      
      <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
        Profit Leak Detection
      </span>
      {!isMobile && <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>}
      
      <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
        Food Cost Visibility
      </span>
      {!isMobile && <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>}
      
      <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", color: "#cbd5e1" }}>
        ● Fast Data Setup
      </span>
    </div>
  </div>
</section>
     {/* WHY IT MATTERS */}
<section
  id="why"
  style={{
    padding: isMobile ? "60px 0 30px" : "100px 0 60px",
    position: "relative",
    overflow: "hidden"
  }}
>
  <div style={{ ...containerStyle, paddingLeft: isMobile ? "0" : undefined, paddingRight: isMobile ? "0" : undefined }}>
    {/* Header Block Grouping */}
    <div style={{ paddingLeft: isMobile ? "16px" : "0", paddingRight: isMobile ? "16px" : "0" }}>
      <h2 
        style={{
          ...sectionTitle,
          fontSize: isMobile ? "32px" : "42px",
          fontWeight: "950",
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          color: "#ffffff"
        }}
      >
        Stop guessing where your profit is going.
      </h2>
      <p 
        style={{
          ...sectionSubtext,
          color: "#94a3b8",
          fontSize: isMobile ? "16px" : "18px",
          lineHeight: 1.6,
          maxWidth: "680px",
          marginTop: "12px"
        }}
      >
        Most restaurant owners know revenue. Very few know exactly where they
        are losing margin every week. SerVen surfaces the numbers that
        actually move profit.
      </p>
    </div>

    {/* Responsive Feature Matrix Carousel Frame */}
    <div
      className="mobile-horizontal-card"
      style={{
        display: isMobile ? "flex" : "grid",
        flexDirection: isMobile ? "row" : "row",
        flexWrap: isMobile ? "nowrap" : "nowrap",
        gridTemplateColumns: isMobile ? "none" : "repeat(3, 1fr)",
        gap: isMobile ? "16px" : "24px",
        marginTop: "40px",
        overflowX: isMobile ? "auto" : "visible",
        overflowY: "hidden",
        paddingBottom: isMobile ? "20px" : "0",
        paddingLeft: isMobile ? "16px" : "0",
        paddingRight: isMobile ? "16px" : "0",
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
      ].map((item, idx) => (
        <div
          className="mobile-horizontal-card"
          key={idx}
          style={{
            ...featureCard,
            minWidth: isMobile ? "290px" : "auto",
            maxWidth: isMobile ? "290px" : "none",
            flexShrink: 0,
            flex: isMobile ? "0 0 auto" : "1",
            scrollSnapAlign: isMobile ? "start" : "none",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.04)",
            borderRadius: "20px",
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Feature Badge Vector Icon */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(79,70,229,0.12) 100%)",
              border: "1px solid rgba(212,175,55,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "#d4af37",
              marginBottom: "20px",
            }}
          >
            ✦
          </div>
          
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "#ffffff",
              marginBottom: "10px",
              letterSpacing: "-0.01em"
            }}
          >
            {item.title}
          </h3>
          
          <p
            style={{
              color: "#94a3b8",
              lineHeight: 1.6,
              fontSize: "14px",
              margin: 0
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
    padding: isMobile ? "60px 0 30px" : "110px 0 50px",
    position: "relative",
  }}
>
  <div style={containerStyle}>
    <h2 
      style={{
        ...sectionTitle,
        fontSize: isMobile ? "32px" : "42px",
        fontWeight: "950",
        letterSpacing: "-0.02em",
        lineHeight: 1.15,
        color: "#ffffff"
      }}
    >
      Operational intelligence built for modern restaurant operators.
    </h2>
    <p 
      style={{
        ...sectionSubtext,
        color: "#94a3b8",
        fontSize: isMobile ? "16px" : "18px",
        lineHeight: 1.6,
        maxWidth: "720px",
        marginTop: "12px"
      }}
    >
      From food cost monitoring to AI recommendations, SerVen gives you the
      visibility and action plan to improve margins without adding more
      complexity.
    </p>

    {/* Bento Feature Grid Interface */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: isMobile ? "16px" : "24px",
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
      ].map((item, idx) => (
        <div 
          key={idx} 
          style={{
            ...featureCard,
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.04)",
            borderRadius: "20px",
            padding: isMobile ? "24px 20px" : "32px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#d4af37",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            SerVen Engine Focus
          </div>
          <h3
            style={{
              fontSize: isMobile ? "20px" : "24px",
              fontWeight: "900",
              color: "#ffffff",
              marginBottom: "12px",
              letterSpacing: "-0.01em"
            }}
          >
            {item.title}
          </h3>
          <p
            style={{
              color: "#94a3b8",
              lineHeight: 1.5,
              fontSize: "14px",
              margin: 0
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
<section style={{ padding: isMobile ? "30px 0 50px" : "50px 0 60px" }}>
  <div style={containerStyle}>
    <div
      style={{
        ...glassCard,
        padding: isMobile ? "20px 16px" : "40px",
        background: "linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(2, 6, 23, 0.5) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.04)",
        borderRadius: "24px"
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: isMobile ? "12px" : "20px",
        }}
      >
        {[
          { value: "8–18%", label: "Potential profit improvement", color: "#d4af37" },
          { value: "Hours", label: "Saved weekly on manual sheets", color: "#ffffff" },
          { value: "Real-Time", label: "Visibility into variable costs", color: "#ffffff" },
          { value: "1 View", label: "Unifies revenue, labor, and costs", color: "#ffffff" },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: isMobile ? "20px 14px" : "24px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div
              style={{
                fontSize: isMobile ? "24px" : "32px",
                fontWeight: "950",
                marginBottom: "8px",
                color: item.color,
                letterSpacing: "-0.03em",
                lineHeight: 1.1
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                color: "#94a3b8",
                lineHeight: 1.4,
                fontSize: isMobile ? "12px" : "14px",
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

    overflow: "hidden",
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