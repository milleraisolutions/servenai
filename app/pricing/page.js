"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useRouter } from "next/navigation";
export default function Pricing() {
  const [recommended, setRecommended] = useState("");
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [estimatedMonthlyPrice, setEstimatedMonthlyPrice] = useState(null);
  const router = useRouter();
const calculateEstimate = async () => {
  let basePrice = 149;

  if (monthlyRevenue > 40000) basePrice += 50;
  if (monthlyRevenue > 80000) basePrice += 100;
  if (monthlyRevenue > 150000) basePrice += 200;

  if (staffCount > 10) basePrice += 50;
  if (staffCount > 25) basePrice += 100;

  if (menuItems > 50) basePrice += 50;
  if (menuItems > 100) basePrice += 100;

  if (locations > 1) basePrice += locations * 75;

  const low = Math.round(basePrice * 0.9);
  const high = Math.round(basePrice * 1.2);

  const priceText = `$${low} – $${high}/month`;

  setEstimatedMonthlyPrice(priceText);

  // ONLY save lead IF they entered contact info
  if (leadEmail || leadPhone) {
    await saveLeadToSupabase({
      fullName: leadName || "Calculator Lead",
      email: leadEmail || "",
      restaurantName: leadRestaurant || "Calculator Estimate",
      phone: leadPhone || "",
      businessType: "restaurant",
      monthlyRevenue,
      locations,
      staffCount,
      recommendedPlan: finalRecommended,
      estimatedPriceRange: priceText,
    });
  }
};
// 🔥 PRICING CALCULATOR STATE
const [staffCount, setStaffCount] = useState(10);
const [menuItems, setMenuItems] = useState(80);
const [locations, setLocations] = useState(1);
const [leadName, setLeadName] = useState("");
const [leadEmail, setLeadEmail] = useState("");
const [leadPhone, setLeadPhone] = useState("");
const [leadRestaurant, setLeadRestaurant] = useState("");
// 🔥 PLAN + PRICING LOGIC (CLEAN + UNIFIED)

// Pricing ranges
const pricingBands = {
  starter: { min: 149, max: 249 },
  growth: { min: 299, max: 599 },
  pro: { min: 499, max: 999 },
};

// Smart plan recommendation (single source of truth)
const getRecommendedPlan = () => {
  if (monthlyRevenue >= 120000 || locations >= 2 || staffCount >= 25) {
    return "pro";
  }

  if (monthlyRevenue >= 40000 || staffCount >= 10 || menuItems >= 40) {
    return "growth";
  }

  return "starter";
};

// Final selected plan
const finalRecommended = getRecommendedPlan();

// Pricing range for UI (if you want to use later)
const priceRange = pricingBands[finalRecommended];

// ROI calculation
const lowRecovery = Math.round(monthlyRevenue * 0.04);
const highRecovery = Math.round(monthlyRevenue * 0.12);
  useEffect(() => {
    const getUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          const { data } = await supabase
            .from("users")
            .select("plan")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (data?.plan === "small") setRecommended("starter");
          if (data?.plan === "medium") setRecommended("growth");
          if (data?.plan === "large") setRecommended("pro");
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    getUserData();
  }, []);

  const handleCheckout = async (plan) => {
    try {
      if (!user) {
        alert("Please log in first");
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (!data.url) {
        alert("No checkout URL returned");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
    }
  };
  
const inputStyle = {
  width: "100%",
  minHeight: "46px",
  padding: "12px 14px",
  marginBottom: "0px",
  borderRadius: "12px",
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(15, 23, 42, 0.92)",
  color: "white",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};
const miniInputLabel = {
  fontSize: "11px",
  color: "#94a3b8",
  marginBottom: "6px",
  fontWeight: "700",
};

const compactInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(168,85,247,0.25)",
  background: "rgba(15, 23, 42, 0.85)",
  color: "white",
  fontSize: "13px",
  outline: "none",
};
const compactFieldBox = {
  flex: "1 1 150px",
  minWidth: "140px",
};
const smartBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  fontSize: "11px",
  fontWeight: "900",
  letterSpacing: "0.04em",
  marginBottom: "14px",
  boxShadow: "0 12px 28px rgba(34,197,94,0.25)",
};
const smartRecommendedGlow = {
  transform: "translateY(-6px)",
  border: "1px solid rgba(34,197,94,0.55)",
  boxShadow:
    "0 0 0 1px rgba(34,197,94,0.18), 0 28px 70px rgba(34,197,94,0.22)",
};

const handleCustomPlanRequest = () => {
  router.push("/custom-plan");
};

const saveLeadToSupabase = async (leadPayload) => {
  try {
    const { error } = await supabase.from("leads").insert([
      {
        full_name: leadPayload.fullName,
        email: leadPayload.email,
        restaurant_name: leadPayload.restaurantName,
        phone: leadPayload.phone,
        business_type: leadPayload.businessType,
        monthly_revenue: Number(leadPayload.monthlyRevenue || 0),
        locations: Number(leadPayload.locations || 1),
        staff_count: Number(leadPayload.staffCount || 0),
        recommended_plan: leadPayload.recommendedPlan,
        estimated_price_range: leadPayload.estimatedPriceRange,
        status: "new",
      },
    ]);

    if (error) {
      console.error("Lead save error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Lead save failed:", err);
    return false;
  }
};

const submitCustomPlan = async () => {
  try {
    const res = await fetch("/api/custom-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  name: leadName,
  restaurant: leadRestaurant,
  email: leadEmail,
  phone: leadPhone,
  monthlyRevenue,
  staffCount,
  menuItems,
  locations,
}),
    });

    const data = await res.json();

    console.log("CUSTOM PLAN RESPONSE:", {
      status: res.status,
      ok: res.ok,
      data,
    });

    if (res.ok && data.success) {
      alert("Request submitted!");
    } else {
      alert(data?.error || "Something went wrong");
    }
  } catch (err) {
    console.error("CUSTOM PLAN SUBMIT ERROR:", err);
    alert(err.message || "Something went wrong");
  }
};




  if (loadingUser) {
    return (
      <div style={loadingPage}>
        <div style={loadingCard}>
          <div style={loadingEyebrow}>SERVEN</div>
          <h2 style={loadingTitle}>Loading pricing...</h2>
          <p style={loadingText}>Preparing your recommended plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={backgroundGlowOne} />
      <div style={backgroundGlowTwo} />
      <div style={backgroundGlowThree} />

      <div style={containerStyle}>
        {/* HERO */}
        <div style={heroWrap}>
          <div style={heroEyebrow}>PRICING</div>

          <h1 style={heroTitle}>Stop Guessing. Start Growing Profit.</h1>

          <p style={heroSubtitle}>
            Serven helps restaurants uncover profit leaks, forecast demand,
            improve margins, and automate high-impact decisions with AI.
          </p>

          <div style={heroTrustBar}>
            <span>
              Built for restaurants that want clarity, control, and profit growth
            </span>
          </div>
        </div>

        {/* ROI ESTIMATOR */}
        <div style={estimatorCard}>
          <div style={estimatorTopRow}>
            <div>
              <div style={estimatorEyebrow}>PROFIT RECOVERY ESTIMATOR</div>
              <h2 style={estimatorTitle}>
                How much profit are you leaving on the table?
              </h2>
              <p style={estimatorSubtitle}>
                Most restaurants recover far more than the cost of Serven by
                fixing pricing, waste, labor, and operational inefficiencies.
              </p>
            </div>

           <div style={recommendedPill}>
  Recommended:{" "}
  <strong>
    {finalRecommended === "starter"
      ? "Starter"
      : finalRecommended === "growth"
      ? "Growth"
      : "Pro AI"}
  </strong>
</div>

{/* WHY THIS PLAN */}
<div
  style={{
    marginTop: "12px",
    padding: "14px",
    borderRadius: "16px",
    background: "rgba(168, 85, 247, 0.12)",
    border: "1px solid rgba(168, 85, 247, 0.28)",
    color: "#e9d5ff",
    fontSize: "13px",
    lineHeight: 1.6,
    maxWidth: "340px",
  }}
>
  {finalRecommended === "starter" &&
    "Starter is recommended because your current size fits best with core visibility: revenue, food cost, menu performance, and business health."}

  {finalRecommended === "growth" &&
    "Growth is recommended because your restaurant has enough complexity to benefit from waste detection, labor insights, forecasting, and AI recommendations."}

  {finalRecommended === "pro" &&
    "Pro AI is recommended because your volume, staff, menu size, or locations show a need for deeper forecasting and AI optimization."}
</div>

{/* ESTIMATED PRICE */}
<div
  style={{
    marginTop: "12px",
    padding: "14px",
    borderRadius: "16px",
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      color: "#86efac",
      fontWeight: "800",
      marginBottom: "6px",
    }}
  >
    Estimated Serven Investment
  </div>
{/* ROI COMPARISON */}
<div
  style={{
    marginTop: "12px",
    padding: "16px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.12))",
    border: "1px solid rgba(34,197,94,0.35)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      color: "#86efac",
      fontWeight: "800",
      marginBottom: "6px",
    }}
  >
    Estimated Monthly Impact
  </div>

  <div
    style={{
      fontSize: "18px",
      color: "white",
      fontWeight: "800",
      lineHeight: 1.4,
    }}
  >
    You could recover{" "}
    <span style={{ color: "#4ade80" }}>
      ${lowRecovery.toLocaleString()} – ${highRecovery.toLocaleString()}
    </span>{" "}
    while paying{" "}
    <span style={{ color: "#c084fc" }}>
      ${priceRange.min} – ${priceRange.max}
    </span>
  </div>
<div
  style={{
    marginTop: "6px",
    fontSize: "13px",
    color: "#4ade80",
    fontWeight: "800",
  }}
>
  That’s up to {Math.round(highRecovery / priceRange.min)}x ROI
</div>
  <p
  style={{
    marginTop: "6px",
    fontSize: "12px",
    color: "#bbf7d0",
    fontWeight: "600",
  }}
>
  Most restaurants recover 5–10x the cost within the first few months.
</p>
</div>

<div
  style={{
    marginTop: "10px",
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: 1.5,
    textAlign: "center",
  }}
>
  No long setup. Start with your current data and upgrade as your restaurant grows.
</div>
  <div
    style={{
      fontSize: "24px",
      color: "white",
      fontWeight: "900",
    }}
  >
    ${priceRange.min} – ${priceRange.max}/mo
  </div>

  <p
    style={{
      margin: "6px 0 0",
      fontSize: "12px",
      color: "#94a3b8",
      lineHeight: 1.5,
    }}
  >
    Pricing scales based on your restaurant size and complexity.
  </p>
</div>
          
          </div>

          
<div style={{ marginTop: "18px" }}>
  <div
    style={{
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      alignItems: "center",
    }}
  >
    {/* STAFF */}
    <div style={compactFieldBox}>
      <div style={miniInputLabel}>Staff</div>
      <input
        type="number"
        value={staffCount}
        onChange={(e) => setStaffCount(Number(e.target.value))}
        style={compactInputStyle}
      />
    </div>

    {/* MENU ITEMS */}
    <div style={compactFieldBox}>
      <div style={miniInputLabel}>Menu Items</div>
      <input
        type="number"
        value={menuItems}
        onChange={(e) => setMenuItems(Number(e.target.value))}
        style={compactInputStyle}
      />
    </div>

    {/* LOCATIONS */}
    <div style={compactFieldBox}>
      <div style={miniInputLabel}>Locations</div>
      <input
        type="number"
        value={locations}
        onChange={(e) => setLocations(Number(e.target.value))}
        style={compactInputStyle}
      />
    </div>
  </div>
</div>
    
          <div style={estimatorStats}>
            <div style={estimatorStatCard}>
              <div style={estimatorLabel}>Monthly Revenue</div>
              <div style={estimatorValue}>${monthlyRevenue.toLocaleString()}</div>
            </div>

            <div style={estimatorStatCard}>
              <div style={estimatorLabel}>Estimated Recoverable Profit</div>
              <div style={estimatorValueGreen}>
                ${lowRecovery.toLocaleString()} – ${highRecovery.toLocaleString()}/mo
              </div>
            </div>
          </div>
     {/* 🔥 MONTHLY REVENUE SLIDER WITH VALUE BUBBLE */}
<div style={{ marginTop: "22px" }}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
    }}
  >
    <div style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "800" }}>
      Monthly Revenue
    </div>

    <div style={{ color: "#facc15", fontSize: "14px", fontWeight: "950" }}>
      ${monthlyRevenue.toLocaleString()}
    </div>
  </div>

  <div style={{ position: "relative", paddingTop: "22px" }}>
    <div
      style={{
        position: "absolute",
        left: `calc(${((monthlyRevenue - 10000) / (250000 - 10000)) * 100}% - 34px)`,
        top: "0px",
        padding: "5px 9px",
        borderRadius: "999px",
        background: "#facc15",
        color: "#111827",
        fontSize: "11px",
        fontWeight: "950",
        whiteSpace: "nowrap",
        boxShadow: "0 10px 24px rgba(250,204,21,0.28)",
      }}
    >
      ${monthlyRevenue.toLocaleString()}
    </div>

    <input
      type="range"
      min="10000"
      max="250000"
      step="5000"
      value={monthlyRevenue}
      onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
      style={{
        width: "100%",
        height: "8px",
        borderRadius: "999px",
        outline: "none",
        cursor: "pointer",
        appearance: "none",
        background: `linear-gradient(
          to right,
          #facc15 0%,
          #facc15 ${((monthlyRevenue - 10000) / (250000 - 10000)) * 100}%,
          rgba(255,255,255,0.2) ${((monthlyRevenue - 10000) / (250000 - 10000)) * 100}%,
          rgba(255,255,255,0.2) 100%
        )`,
      }}
    />
  </div>
</div>
          {/* 🔥 PREMIUM LEAD CAPTURE */}
<div
  style={{
    marginTop: "22px",
    padding: "18px",
    borderRadius: "20px",
    background: "rgba(2,6,23,0.42)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#fde68a",
      marginBottom: "10px",
    }}
  >
   Optional: Save Your Estimate
  </div>

 <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  }}
>
    <input
      type="text"
      placeholder="Your Name"
      value={leadName}
      onChange={(e) => setLeadName(e.target.value)}
      style={inputStyle}
    />

    <input
      type="text"
      placeholder="Restaurant Name"
      value={leadRestaurant}
      onChange={(e) => setLeadRestaurant(e.target.value)}
      style={inputStyle}
    />

    <input
      type="email"
      placeholder="Email"
      value={leadEmail}
      onChange={(e) => setLeadEmail(e.target.value)}
      style={inputStyle}
    />

    <input
      type="tel"
      placeholder="Phone Number"
      value={leadPhone}
      onChange={(e) => setLeadPhone(e.target.value)}
      style={inputStyle}
    />
  </div>

  <p
    style={{
      margin: "10px 0 0",
      fontSize: "12px",
      color: "#94a3b8",
      lineHeight: 1.5,
    }}
  >
    Optional: enter your info to save your estimate and receive a custom onboarding recommendation.
  </p>
</div>
<button
onClick={async () => {
  calculateEstimate();

  if (leadEmail || leadPhone || leadName || leadRestaurant) {
    await submitCustomPlan();
  }
}}
  style={{
    marginTop: "20px",
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    fontWeight: "800",
    fontSize: "14px",
    background: "linear-gradient(135deg, #a855f7, #6366f1)",
    color: "white",
    cursor: "pointer",
  }}
>
  Estimate My ROI
</button>
{estimatedMonthlyPrice && (
  <div
    style={{
      marginTop: "18px",
      padding: "18px",
      borderRadius: "18px",
      background: "rgba(15, 23, 42, 0.9)",
      border: "1px solid rgba(168, 85, 247, 0.35)",
      boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
    }}
  >
    <div
      style={{
        fontSize: "13px",
        color: "#a78bfa",
        fontWeight: "800",
        marginBottom: "8px",
      }}
    >
      Estimated Monthly Investment
    </div>
<div
  style={{
    marginTop: "10px",
    fontSize: "12px",
    color: "#86efac",
    fontWeight: "700",
  }}
>
  Recommended Plan:{" "}
  {finalRecommended === "starter"
    ? "Starter"
    : finalRecommended === "growth"
    ? "Growth"
    : "Pro AI"}
</div>
    <div
      style={{
        fontSize: "30px",
        fontWeight: "900",
        color: "white",
        marginBottom: "8px",
      }}
    >
      {estimatedMonthlyPrice}
    </div>

    <p
      style={{
        color: "#cbd5e1",
        fontSize: "14px",
        lineHeight: 1.6,
        margin: 0,
      }}
    >
      Pricing starts at $149/month. Final pricing depends on your size,
      complexity, and growth goals.
    </p>
  </div>
)}
          <div style={estimatorBottomText}>
            A single pricing fix or margin improvement can often cover your
            subscription.
          </div>
        </div>

        {/* PLAN EXPLANATION */}
        <div style={sectionIntro}>
          <div style={sectionEyebrow}>CHOOSE YOUR OPERATING LEVEL</div>
          <h2 style={sectionTitle}>Three plans. One clear path to more profit.</h2>
          <p style={sectionSubtitle}>
            Start with visibility, move into diagnosis, and unlock full AI-driven
            optimization when you’re ready to automate growth.
          </p>
        </div>

        {/* PRICING CARDS */}
        <div style={plansGrid}>
          {/* STARTER */}
          <div
  id="plan-starter"
  style={{
    ...planCard,
              ...(finalRecommended === "starter"
  ? { ...recommendedCard, ...smartRecommendedGlow }
  : {}),
            }}
          >
           {finalRecommended === "starter" && (
  <div style={smartBadgeStyle}>🔥 BEST MATCH BASED ON YOUR ESTIMATE</div>
)}

            <div style={planHeader}>
              <div>
                <div style={planName}>Starter</div>
                <div style={planTagline}>See your numbers clearly</div>
              </div>
            </div>

            <div style={priceBlock}>
              <div style={priceMain}>$149</div>
              <div style={priceSub}>/month</div>
            </div>

            <p style={planDescription}>
              Perfect for restaurant owners who need clean visibility into revenue,
              costs, menu performance, and core business health.
            </p>

            <div style={planUseCase}>
              Best for: owners who want to stop flying blind and finally understand
              where the business stands.
            </div>

            <div style={impactText}>
              Typical value: identify + recover $800–$2,000/mo
            </div>

            <ul style={featureList}>
              <li>Revenue & KPI dashboard</li>
              <li>Food cost monitoring</li>
              <li>Menu profitability tracking</li>
              <li>Best & worst item analysis</li>
              <li>Average order value</li>
              <li>Peak hour insights</li>
              <li>Basic alerts & performance overview</li>
            </ul>

            <button
              onClick={handleCustomPlanRequest}
              style={starterButton}
            >
             Request Starter Pricing
            </button>
  
          </div>

          {/* GROWTH */}
          <div
  id="plan-growth"
  style={{
    ...planCard,
    ...growthCard,
              ...(finalRecommended === "growth"
  ? { ...recommendedGrowthCard, ...smartRecommendedGlow }
  : {}),
            }}
          >
            <div style={finalRecommended === "growth" ? smartBadgeStyle : badgeStyle}>
  {finalRecommended === "growth"
    ? "🔥 BEST MATCH BASED ON YOUR ESTIMATE"
    : "MOST POPULAR"}
</div>

            <div style={planHeader}>
              <div>
                <div style={planName}>Growth</div>
                <div style={planTagline}>Find and fix profit leaks</div>
              </div>
            </div>

            <div style={priceBlock}>
              <div style={dualPriceWrap}>
                <div style={termCard}>
                  <div style={termLabel}>6 Months</div>
                  <div style={termPrice}>$349</div>
                  <div style={termSub}>/month</div>
                </div>

                <div style={{ ...termCard, ...termCardFeatured }}>
                  <div style={termLabel}>12 Months</div>
                  <div style={termPrice}>$299</div>
                  <div style={termSub}>/month</div>
                  <div style={bestValueText}>BEST VALUE</div>
                </div>
              </div>
            </div>

            <p style={planDescription}>
              Built for operators who already know the basics and now want to
              identify what’s hurting profit, margins, and operational efficiency.
            </p>

            <div style={planUseCase}>
              Best for: restaurants that want to reduce waste, improve labor
              performance, and make better decisions every week.
            </div>

            <div style={impactText}>
              Typical value: identify + recover $3,000–$6,000/mo
            </div>

            <ul style={featureList}>
              <li>Everything in Starter</li>
              <li>Waste detection</li>
              <li>Shelf life tracking</li>
              <li>Inventory forecasting</li>
              <li>Demand forecasting</li>
              <li>Labor cost insights</li>
              <li>Staff planning signals</li>
              <li>AI recommendations engine</li>
              <li>Marketing promotion engine</li>
            </ul>

           <button
  onClick={handleCustomPlanRequest}
  style={primaryGrowthButton}
>
  Request Growth Pricing
</button>

<p
  style={{
    fontSize: "12px",
    color: "#64748b",
    marginTop: "10px",
    lineHeight: 1.5,
  }}
>
  We’ll review your restaurant profile and recommend the best Growth plan,
  pricing, and next steps.
</p>
  
          </div>

          {/* PRO */}
          <div
  id="plan-pro"
  style={{
    ...planCard,
    ...proCard,
              ...(finalRecommended === "pro"
  ? { ...recommendedProCard, ...smartRecommendedGlow }
  : {}),
            }}
          >
         <div
  style={
    finalRecommended === "pro"
      ? { ...smartBadgeStyle, ...proBadgeStyle }
      : { ...badgeStyle, ...proBadgeStyle }
  }
>
  {finalRecommended === "pro"
    ? "🔥 BEST MATCH BASED ON YOUR ESTIMATE"
    : "PREMIUM AI"}
</div>

            <div style={planHeader}>
              <div>
                <div style={{ ...planName, color: "white" }}>Pro AI</div>
                <div style={{ ...planTagline, color: "rgba(255,255,255,0.82)" }}>
                  Let AI optimize your restaurant
                </div>
              </div>
            </div>

            <div style={priceBlock}>
              <div style={dualPriceWrap}>
                <div style={darkTermCard}>
                  <div style={termLabelDark}>6 Months</div>
                  <div style={termPriceDark}>$549</div>
                  <div style={termSubDark}>/month</div>
                </div>

                <div style={{ ...darkTermCard, ...darkTermCardFeatured }}>
                  <div style={termLabelDark}>12 Months</div>
                  <div style={termPriceDark}>$499</div>
                  <div style={termSubDark}>/month</div>
                  <div style={bestValueTextDark}>BEST VALUE</div>
                </div>
              </div>
            </div>

            <p style={{ ...planDescription, color: "rgba(255,255,255,0.86)" }}>
              For serious operators who want more than insights. Pro AI adds
              automation, decision support, and AI-driven profit optimization.
            </p>

            <div style={planUseCaseDark}>
              Best for: multi-unit or growth-focused operators who want AI to
              actively improve pricing, forecasting, and profit performance.
            </div>

            <div style={impactTextDark}>
              Typical value: identify + recover $8,000+/mo
            </div>

            <ul style={featureListDark}>
              <li>Everything in Growth</li>
              <li>AI Profit Opportunities</li>
              <li>Autopilot optimization</li>
              <li>AI activity log</li>
              <li>Real-time profit simulation</li>
              <li>Advanced forecasting</li>
              <li>Price elasticity detection</li>
              <li>AI sales analyzer</li>
              <li>Restaurant simulator</li>
              <li>Priority support</li>
            </ul>

           <button
  onClick={handleCustomPlanRequest}
  style={proPrimaryButton}
>
  Request Pro AI Pricing
</button>

<p
  style={{
    fontSize: "12px",
    color: "#64748b",
    marginTop: "10px",
    lineHeight: 1.5,
  }}
>
  We’ll review your restaurant profile and recommend the best Pro AI setup,
  pricing, and next steps.
</p>
  
          </div>
        </div>

        {/* WHICH PLAN IS RIGHT */}
        <div style={comparisonCallout}>
          <div style={sectionEyebrow}>WHICH PLAN IS RIGHT FOR YOU?</div>

          <div style={comparisonGrid}>
            <div style={comparisonCard}>
              <h3 style={comparisonTitle}>Starter</h3>
              <p style={comparisonText}>
                You need clarity first. If you’re unsure where your profit is
                going, Starter gives you visibility into food cost, menu
                performance, and overall business health so you can stop guessing.
              </p>
            </div>

            <div style={comparisonCard}>
              <h3 style={comparisonTitle}>Growth</h3>
              <p style={comparisonText}>
                You know your numbers — now you need to fix what’s hurting profit.
                Growth helps you detect waste, optimize labor, forecast demand,
                and make smarter weekly decisions that directly impact margins.
              </p>
            </div>

            <div style={comparisonCard}>
              <h3 style={comparisonTitle}>Pro AI</h3>
              <p style={comparisonText}>
                You want automation and smarter decisions at scale. Pro AI
                actively recommends, simulates, and optimizes pricing,
                forecasting, and profit so you can grow faster without relying on
                guesswork.
              </p>
            </div>
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div style={tableSection}>
          <div style={sectionEyebrow}>COMPARE PLANS</div>
          <h2 style={sectionTitle}>See exactly what you unlock at each level</h2>
          <p style={sectionSubtitle}>
            Choose the level of intelligence your restaurant needs today, then
            upgrade as your operation gets more complex.
          </p>

          <div style={tableWrap}>
            <div style={tableHeaderRow}>
              <div style={tableFeatureHeader}>Feature</div>
              <div style={tablePlanHeader}>Starter</div>
              <div style={{ ...tablePlanHeader, color: "#6D3DF5" }}>Growth</div>
              <div style={tablePlanHeader}>Pro AI</div>
            </div>

            {[
              [
                "Revenue & KPI Dashboard",
                "Track sales and business health",
                true,
                true,
                true,
              ],
              [
                "Food Cost Monitoring",
                "Catch margin pressure early",
                true,
                true,
                true,
              ],
              [
                "Menu Profitability",
                "See what makes or loses money",
                true,
                true,
                true,
              ],
              [
                "Best / Worst Item Analysis",
                "Find top and weak performers",
                true,
                true,
                true,
              ],
              [
                "Profit Leak Detection",
                "Spot hidden losses faster",
                true,
                true,
                true,
              ],
              [
                "Waste Detection",
                "Catch avoidable ingredient loss",
                false,
                true,
                true,
              ],
              [
                "Shelf Life Tracking",
                "Reduce spoilage and waste",
                false,
                true,
                true,
              ],
              [
                "Inventory Forecasting",
                "Order with more confidence",
                false,
                true,
                true,
              ],
              [
                "Demand Forecasting",
                "Plan ahead before volume changes",
                false,
                true,
                true,
              ],
              [
                "Labor Cost Insights",
                "See when labor is hurting profit",
                false,
                true,
                true,
              ],
              [
                "Staff Planning Signals",
                "Schedule smarter each week",
                false,
                true,
                true,
              ],
              [
                "AI Recommendations Engine",
                "Get action-focused guidance",
                false,
                true,
                true,
              ],
              [
                "Marketing Promotion Engine",
                "Launch better offers faster",
                false,
                true,
                true,
              ],
              [
                "AI Profit Opportunities",
                "See where AI can drive gain",
                false,
                false,
                true,
              ],
              [
                "Autopilot Optimization",
                "Let AI assist ongoing decisions",
                false,
                false,
                true,
              ],
              [
                "Real-Time Profit Simulation",
                "Model impact before changes",
                false,
                false,
                true,
              ],
              [
                "Advanced Forecasting",
                "Deeper predictive planning",
                false,
                false,
                true,
              ],
              [
                "Price Elasticity Detection",
                "Understand price sensitivity",
                false,
                false,
                true,
              ],
              [
                "AI Sales Analyzer",
                "Break down sales patterns faster",
                false,
                false,
                true,
              ],
              [
                "Restaurant Simulator",
                "Test strategies before rollout",
                false,
                false,
                true,
              ],
              [
                "Priority Support",
                "Faster help when needed",
                false,
                false,
                true,
              ],
            ].map((row, index) => (
              <div key={index} style={tableRow}>
                <div style={tableFeatureCell}>
                  <div style={tableFeatureTitle}>{row[0]}</div>
                  <div style={tableFeatureSub}>{row[1]}</div>
                </div>
                <div style={tableCell}>{row[2] ? "✔" : "—"}</div>
                <div style={tableCell}>{row[3] ? "✔" : "—"}</div>
                <div style={tableCell}>{row[4] ? "✔" : "—"}</div>
              </div>
            ))}
          </div>
        </div>

                {/* ROI CLOSE */}
        <div style={roiSection}>
          <div style={sectionEyebrow}>ROI</div>
          <h2 style={roiTitle}>One strong optimization can pay for the platform.</h2>
          <p style={roiText}>
            Whether it’s a pricing adjustment, waste reduction, labor improvement,
            or demand forecast, most restaurants recover multiples of their
            subscription cost quickly.
          </p>
        </div>

        {/* FAQ SECTION */}
        <div style={faqSection}>
          <div style={sectionEyebrow}>FAQ</div>
          <h2 style={sectionTitle}>
            Questions restaurant operators usually ask before starting
          </h2>
          <p style={sectionSubtitle}>
            Clear answers remove hesitation and help buyers choose faster.
          </p>

          <div style={faqGrid}>
            <div style={faqCard}>
              <h3 style={faqQuestion}>How quickly can I start using Serven?</h3>
              <p style={faqAnswer}>
                You can get started quickly. Upload your restaurant data, connect your
                numbers, and begin seeing insights without a long implementation process.
              </p>
            </div>

            <div style={faqCard}>
              <h3 style={faqQuestion}>Do I need a specific POS system?</h3>
              <p style={faqAnswer}>
                No. Serven is designed to work with common restaurant workflows and
                supports CSV-based data imports, making it easier to start without a
                complicated integration setup.
              </p>
            </div>

            <div style={faqCard}>
              <h3 style={faqQuestion}>What’s the difference between Starter and Growth?</h3>
              <p style={faqAnswer}>
                Starter helps you understand what is happening in your restaurant.
                Growth helps you diagnose what is hurting profit and gives you tools to
                improve labor, inventory, demand planning, and promotions.
              </p>
            </div>

            <div style={faqCard}>
              <h3 style={faqQuestion}>When should I choose Pro AI?</h3>
              <p style={faqAnswer}>
                Choose Pro AI when you want more than visibility and recommendations.
                It is built for operators who want deeper forecasting, simulations,
                pricing intelligence, and AI-assisted decision-making.
              </p>
            </div>

            <div style={faqCard}>
              <h3 style={faqQuestion}>Will this be worth the cost?</h3>
              <p style={faqAnswer}>
                For most restaurants, one strong improvement in pricing, waste, labor,
                or demand planning can cover the subscription. The goal is not more
                reports — it is better decisions that improve profit.
              </p>
            </div>

            <div style={faqCard}>
              <h3 style={faqQuestion}>Can I upgrade later?</h3>
              <p style={faqAnswer}>
                Yes. You can start with the level that fits your restaurant now and move
                up as your operation grows or as you want more AI-driven features.
              </p>
            </div>
          </div>
        </div>
                {/* FINAL CTA */}
        <div style={finalCtaSection}>
          <div style={finalCtaGlow} />

          <div style={finalCtaInner}>
            <div style={finalCtaEyebrow}>READY TO GROW PROFIT WITH MORE CLARITY?</div>

            <h2 style={finalCtaTitle}>
              Stop guessing where your money is going.
            </h2>

            <p style={finalCtaText}>
              Serven helps restaurant operators uncover profit leaks, improve
              margins, forecast smarter, and make better decisions with confidence.
            </p>

            <div style={finalCtaButtonRow}>
  <button
    onClick={handleCustomPlanRequest}
    style={finalCtaPrimary}
  >
    Request Starter Pricing
  </button>

  <button
    onClick={handleCustomPlanRequest}
    style={finalCtaSecondary}
  >
    Request Growth Pricing
  </button>

  <button
    onClick={handleCustomPlanRequest}
    style={finalCtaDark}
  >
    Request Pro AI Pricing
  </button>
</div>

            <div style={finalCtaTrust}>
              Built for restaurants that want stronger margins, smarter decisions,
              and faster growth.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ---------- STYLES ---------- */

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  background:
    "radial-gradient(circle at top left, rgba(109,61,245,0.18), transparent 34%), radial-gradient(circle at top right, rgba(212,175,55,0.10), transparent 30%), linear-gradient(180deg, #020617 0%, #0f172a 45%, #020617 100%)",
  color: "white",
  position: "relative",
  overflowX: "hidden",
};

const backgroundGlowOne = {
  position: "absolute",
  top: "-120px",
  left: "-120px",
  width: "420px",
  height: "420px",
  borderRadius: "999px",
  background: "rgba(79,70,229,0.15)",
  filter: "blur(90px)",
  pointerEvents: "none",
};

const backgroundGlowTwo = {
  position: "absolute",
  top: "60px",
  right: "-100px",
  width: "360px",
  height: "360px",
  borderRadius: "999px",
  background: "rgba(168,85,247,0.16)",
  filter: "blur(90px)",
  pointerEvents: "none",
};

const backgroundGlowThree = {
  position: "absolute",
  bottom: "-120px",
  left: "30%",
  width: "420px",
  height: "420px",
  borderRadius: "999px",
  background: "rgba(212,175,55,0.10)",
  filter: "blur(95px)",
  pointerEvents: "none",
};

const containerStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
  position: "relative",
  zIndex: 1,
  padding: "54px 20px 80px",
};
const heroWrap = {
  maxWidth: "920px",
  margin: "0 auto 40px",
  textAlign: "center",
};

const heroEyebrow = {
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "0.08em",
  color: "#6D3DF5",
  marginBottom: "12px",
};

const heroTitle = {
  fontSize: "48px",
  lineHeight: 1.05,
  fontWeight: "900",
  margin: "0 0 16px 0",
  color: "white",
};

const heroSubtitle = {
  fontSize: "18px",
  lineHeight: 1.7,
  color: "#cbd5e1",
  margin: "0 auto",
  maxWidth: "760px",
};

const heroTrustBar = {
  marginTop: "20px",
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(226,232,240,0.9)",
  color: "#475569",
  fontSize: "13px",
  fontWeight: "600",
  boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
};

const estimatorCard = {
  marginTop: "26px",
  marginBottom: "46px",
  padding: "30px",
  borderRadius: "26px",
  background: "linear-gradient(135deg, #4338ca 0%, #6D3DF5 55%, #7c3aed 100%)",
  color: "white",
  boxShadow: "0 26px 60px rgba(79,70,229,0.28)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const estimatorTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap",
};

const estimatorEyebrow = {
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "0.08em",
  opacity: 0.85,
  marginBottom: "10px",
};

const estimatorTitle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: "900",
};

const estimatorSubtitle = {
  marginTop: "10px",
  maxWidth: "700px",
  lineHeight: 1.6,
  fontSize: "14px",
  opacity: 0.92,
};

const recommendedPill = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontSize: "13px",
  fontWeight: "600",
};


const estimatorStats = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
  marginTop: "24px",
};

const estimatorStatCard = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const estimatorLabel = {
  fontSize: "12px",
  opacity: 0.8,
  marginBottom: "8px",
  fontWeight: "700",
};

const estimatorValue = {
  fontSize: "28px",
  fontWeight: "900",
};

const estimatorValueGreen = {
  fontSize: "24px",
  fontWeight: "900",
  color: "#bbf7d0",
};

const estimatorBottomText = {
  marginTop: "18px",
  fontSize: "13px",
  opacity: 0.88,
};

const sectionIntro = {
  textAlign: "center",
  maxWidth: "780px",
  margin: "0 auto 32px",
};

const sectionEyebrow = {
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "0.08em",
  color: "#6D3DF5",
  marginBottom: "10px",
};

const sectionTitle = {
  fontSize: "34px",
  fontWeight: "900",
  color: "white",
  margin: "0 0 12px 0",
};

const sectionSubtitle = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "16px",
  lineHeight: 1.7,
};

const plansGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "32px",
  alignItems: "stretch",
};

const planCard = {
  position: "relative",
  padding: "30px",
  borderRadius: "24px",
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 24px 50px rgba(2,6,23,0.35)",
  backdropFilter: "blur(10px)",
  color: "white",
  overflow: "hidden",
};

const growthCard = {
  border: "2px solid #a855f7",
  boxShadow: "0 20px 50px rgba(168,85,247,0.25)",
};

const proCard = {
  background: "linear-gradient(135deg, #111827 0%, #1e1b4b 50%, #312e81 100%)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 28px 70px rgba(49,46,129,0.3)",
};

const recommendedCard = {
  border: "2px solid #6D3DF5",
  boxShadow: "0 24px 50px rgba(109,61,245,0.16)",
};

const recommendedGrowthCard = {
  border: "2px solid #6D3DF5",
  boxShadow: "0 26px 55px rgba(109,61,245,0.18)",
};

const recommendedProCard = {
  transform: "translateY(-6px) scale(1.02)",
};

const badgeStyle = {
  position: "absolute",
  top: "-12px",
  right: "18px",
  background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
  color: "white",
  fontSize: "11px",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: "800",
  boxShadow: "0 10px 20px rgba(79,70,229,0.22)",
};

const proBadgeStyle = {
  background: "linear-gradient(135deg, #111827, #000000)",
};

const planHeader = {
  marginBottom: "18px",
};


const planTagline = {
  marginTop: "6px",
  fontSize: "14px",
  fontWeight: "700",
  color: "#6D3DF5",
};

const priceBlock = {
  marginBottom: "18px",
};

const priceMain = {
  fontSize: "52px",
  lineHeight: 1,
  fontWeight: "900",
  color: "white",
};

const priceSub = {
  marginTop: "6px",
  fontSize: "14px",
  color: "#94a3b8",
  fontWeight: "600",
};

const dualPriceWrap = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const termCard = {
  padding: "16px",
  borderRadius: "18px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const termCardFeatured = {
  border: "2px solid #6D3DF5",
  background: "linear-gradient(180deg, #f5f3ff 0%, #ffffff 100%)",
  boxShadow: "0 16px 28px rgba(109,61,245,0.10)",
};

const termLabel = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#64748b",
  marginBottom: "8px",
};

const termPrice = {
  fontSize: "34px",
  lineHeight: 1,
  fontWeight: "900",
  color: "#0f172a",
};

const termSub = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: "6px",
  fontWeight: "600",
};

const bestValueText = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#10b981",
  marginTop: "6px",
};

const darkTermCard = {
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const darkTermCardFeatured = {
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.18)",
};

const termLabelDark = {
  fontSize: "12px",
  fontWeight: "800",
  color: "rgba(255,255,255,0.72)",
  marginBottom: "8px",
};

const termPriceDark = {
  fontSize: "34px",
  lineHeight: 1,
  fontWeight: "900",
  color: "white",
};

const termSubDark = {
  fontSize: "12px",
  color: "rgba(255,255,255,0.72)",
  marginTop: "6px",
  fontWeight: "600",
};

const bestValueTextDark = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#86efac",
  marginTop: "6px",
};




const planUseCaseDark = {
  padding: "12px 14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.84)",
  fontSize: "13px",
  lineHeight: 1.6,
  marginBottom: "14px",
};

const impactText = {
  marginBottom: "16px",
  fontSize: "14px",
  fontWeight: "800",
  color: "#10b981",
};

const impactTextDark = {
  marginBottom: "16px",
  fontSize: "14px",
  fontWeight: "800",
  color: "#86efac",
};


const featureListDark = {
  margin: "0 0 22px 0",
  paddingLeft: "18px",
  color: "rgba(255,255,255,0.86)",
  fontSize: "14px",
  lineHeight: 1.9,
};

const starterButton = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "800",
  color: "white",
  background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
  boxShadow: "0 14px 28px rgba(79,70,229,0.22)",
};

const secondaryButton = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "800",
  color: "#111827",
  background: "white",
  marginBottom: "10px",
};

const primaryGrowthButton = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "800",
  color: "white",
  background: "linear-gradient(135deg, #4f46e5, #6D3DF5)",
  boxShadow: "0 14px 28px rgba(79,70,229,0.22)",
};

const proSecondaryButton = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "800",
  color: "white",
  background: "rgba(255,255,255,0.08)",
  marginBottom: "10px",
};

const proPrimaryButton = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "900",
  color: "#111827",
  background: "linear-gradient(135deg, #ffffff, #e9d5ff)",
  boxShadow: "0 18px 36px rgba(255,255,255,0.16)",
};

const comparisonCallout = {
  marginTop: "54px",
  padding: "32px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.88)",
  border: "1px solid #e2e8f0",
  boxShadow: "0 20px 45px rgba(15,23,42,0.06)",
};

const comparisonGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "18px",
  marginTop: "18px",
};

const comparisonCard = {
  padding: "20px",
  borderRadius: "18px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const comparisonTitle = {
  margin: "0 0 10px 0",
  fontSize: "20px",
  fontWeight: "800",
  color: "#0f172a",
};

const comparisonText = {
  margin: 0,
  fontSize: "14px",
  lineHeight: 1.7,
  color: "#64748b",
};

const tableSection = {
  marginTop: "56px",
  textAlign: "center",
};

const tableWrap = {
  marginTop: "22px",
  borderRadius: "22px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 20px 45px rgba(15,23,42,0.06)",
};

const tableHeaderRow = {
  display: "grid",
  gridTemplateColumns: "2.2fr 1fr 1fr 1fr",
  gap: "0px",
  padding: "18px 20px",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
};

const tableFeatureHeader = {
  textAlign: "left",
  fontSize: "13px",
  fontWeight: "800",
  color: "#475569",
  letterSpacing: "0.02em",
};

const tablePlanHeader = {
  textAlign: "center",
  fontSize: "13px",
  fontWeight: "800",
  color: "#0f172a",
  letterSpacing: "0.02em",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "2.2fr 1fr 1fr 1fr",
  gap: "0px",
  padding: "18px 20px",
  borderBottom: "1px solid #f1f5f9",
  alignItems: "center",
};

const tableFeatureCell = {
  textAlign: "left",
  paddingRight: "16px",
};

const tableFeatureTitle = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#0f172a",
};

const tableFeatureSub = {
  marginTop: "4px",
  fontSize: "13px",
  color: "#64748b",
  lineHeight: 1.5,
};

const tableCell = {
  textAlign: "center",
  fontSize: "20px",
  fontWeight: "800",
  color: "#6D3DF5",
};

const roiSection = {
  marginTop: "42px",
  textAlign: "center",
  maxWidth: "760px",
  marginInline: "auto",
};

const roiTitle = {
  margin: "0 0 12px 0",
  fontSize: "30px",
  fontWeight: "900",
  color: "white",
};

const roiText = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "16px",
  lineHeight: 1.7,
};

const loadingPage = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  padding: "40px",
};

const loadingCard = {
  background: "white",
  padding: "30px",
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
  textAlign: "center",
  maxWidth: "420px",
  width: "100%",
};

const loadingEyebrow = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#6D3DF5",
  letterSpacing: "0.08em",
  marginBottom: "8px",
};

const loadingTitle = {
  margin: "0 0 10px 0",
  fontSize: "24px",
  color: "#0f172a",
};

const loadingText = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
};
const faqSection = {
  marginTop: "64px",
  textAlign: "center",
};

const faqGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "18px",
  marginTop: "24px",
};

const faqCard = {
  textAlign: "left",
  padding: "22px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid #e2e8f0",
  boxShadow: "0 16px 36px rgba(15,23,42,0.05)",
};

const faqQuestion = {
  margin: "0 0 10px 0",
  fontSize: "17px",
  fontWeight: "800",
  color: "#0f172a",
  lineHeight: 1.4,
};

const faqAnswer = {
  margin: 0,
  fontSize: "14px",
  lineHeight: 1.75,
  color: "#64748b",
};
const finalCtaSection = {
  position: "relative",
  marginTop: "70px",
  borderRadius: "28px",
  background: "linear-gradient(135deg, #0f172a 0%, #312e81 55%, #6D3DF5 100%)",
  boxShadow: "0 30px 70px rgba(49,46,129,0.28)",
};

const finalCtaGlow = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 35%), radial-gradient(circle at bottom left, rgba(212,175,55,0.16), transparent 30%)",
  pointerEvents: "none",
};

const finalCtaInner = {
  position: "relative",
  zIndex: 1,
  padding: "48px 28px",
  textAlign: "center",
  color: "white",
};

const finalCtaEyebrow = {
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "0.08em",
  color: "rgba(255,255,255,0.75)",
  marginBottom: "12px",
};

const finalCtaTitle = {
  margin: "0 0 14px 0",
  fontSize: "38px",
  lineHeight: 1.1,
  fontWeight: "900",
};

const finalCtaText = {
  margin: "0 auto",
  maxWidth: "760px",
  fontSize: "17px",
  lineHeight: 1.75,
  color: "rgba(255,255,255,0.82)",
};

const finalCtaButtonRow = {
  display: "flex",
  gap: "14px",
  justifyContent: "center",
  flexWrap: "wrap",
  marginTop: "28px",
};

const finalCtaPrimary = {
  padding: "14px 18px",
  borderRadius: "14px",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "800",
  color: "#111827",
  background: "linear-gradient(135deg, #ffffff, #e9d5ff)",
  boxShadow: "0 18px 36px rgba(255,255,255,0.16)",
};

const finalCtaSecondary = {
  padding: "14px 18px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.18)",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "800",
  color: "white",
  background: "rgba(255,255,255,0.08)",
};

const finalCtaDark = {
  padding: "14px 18px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.18)",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "800",
  color: "white",
  background: "rgba(15,23,42,0.65)",
};

const finalCtaTrust = {
  marginTop: "18px",
  fontSize: "13px",
  fontWeight: "600",
  color: "rgba(255,255,255,0.72)",
};
const planName = {
  fontSize: "28px",
  fontWeight: "900",
  color: "white",
};

const planDescription = {
  fontSize: "14px",
  lineHeight: 1.7,
  color: "#cbd5e1",
  marginBottom: "14px",
};

const planUseCase = {
  padding: "12px 14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#cbd5e1",
  fontSize: "13px",
  lineHeight: 1.6,
  marginBottom: "14px",
};

const featureList = {
  margin: "0 0 22px 0",
  paddingLeft: "18px",
  color: "#e2e8f0",
  fontSize: "14px",
  lineHeight: 1.9,
};