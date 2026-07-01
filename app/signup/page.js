"use client";

import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();

  // Step state (1: Business Details, 2: Account Details)
  const [step, setStep] = useState(1);

  // Form states
  const [restaurantName, setRestaurantName] = useState("");
  const [size, setSize] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [businessType, setBusinessType] = useState("restaurant");
  const [errorMessage, setErrorMessage] = useState("");

  const getRecommendedPlan = (selectedSize) => {
    if (selectedSize === "large") return "pro";
    if (selectedSize === "medium") return "growth";
    return "starter";
  };

  const getEstimatedPriceRange = (selectedSize) => {
    if (selectedSize === "large") return "$499-$999/mo";
    if (selectedSize === "medium") return "$299-$599/mo";
    return "$149-$249/mo";
  };

  // Step 1 Validation
  const handleNextStep = () => {
    setErrorMessage("");
    if (!restaurantName.trim()) {
      setErrorMessage("Please enter your restaurant name.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Please enter your phone number.");
      return;
    }
    if (!businessType) {
      setErrorMessage("Please select a business type.");
      return;
    }
    if (!size) {
      setErrorMessage("Please select your business size.");
      return;
    }
    setStep(2);
  };

  const saveLeadToSupabase = async ({ userId, cleanEmail, cleanPhone }) => {
    const recommendedPlan = getRecommendedPlan(size);
    const estimatedPriceRange = getEstimatedPriceRange(size);

    const { error } = await supabase.from("leads").insert([
      {
        user_id: userId,
        full_name: restaurantName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        restaurant_name: restaurantName.trim(),
        business_type: businessType,
        recommended_plan: recommendedPlan,
        estimated_price_range: estimatedPriceRange,
        status: "new",
        notes: `Signup lead. Restaurant size: ${size}`,
      },
    ]);

    if (error) {
      console.error("LEAD SAVE ERROR:", error);
    }
  };

  const handleSignup = async (e) => {
  if (e) e.preventDefault();
  
  // Basic validation checks
  if (!email || !password) {
    alert("Please fill in all credentials.");
    return;
  }
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  setLoading(true);

  // 1. Gather the payload using your existing form states
  const demoPayload = {
    restaurant_name: restaurantName,
    contact_name: "New Sign Up Operator", // Since they sign up directly, you can map this or add a state for their name
    email: email,
    phone: phone,
    city: "Form Sign Up", // Fallback text, or use businessType/size metadata if preferred
  };

  try {
    // 2. Insert into your Supabase demo_leads tracking table first
    const { error: dbError } = await supabase
      .from("demo_leads")
      .insert([demoPayload]);

    if (dbError) {
      console.error("Failed to log tracking lead:", dbError);
      // We don't return here so the actual user signup flow isn't blocked if a logging table has an error
    }

    // 3. Fire your Resend Owner Email Alert
    await fetch("/api/send-client-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        restaurantName: restaurantName,
        contactName: "Inbound Sign Up",
        phone: phone,
        city: `Plan Recommendation: ${getRecommendedPlan(size || "small").toUpperCase()}`,
        type: "demo_notification", // Route trigger for your custom Resend layout
      }),
    });

   const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      restaurant_name: restaurantName,
      phone,
      business_type: businessType,
    },
  },
});

if (error) throw error;

const newUser = data?.user;

if (newUser) {
  const { error: userInsertError } = await supabase
    .from("users")
    .upsert(
      [
        {
          id: newUser.id,
          email: email,
          restaurant_name: restaurantName,
          business_type: businessType,
          size: size,
          plan: getRecommendedPlan(size),
          role: "executive",
          status: "lead",
        },
      ],
      { onConflict: "id" }
    );

  if (userInsertError) {
    console.error("USER INSERT ERROR:", userInsertError);
  }

  await saveLeadToSupabase({
    userId: newUser.id,
    cleanEmail: email,
    cleanPhone: phone,
  });
}

alert("Profile created successfully!");

router.push("/dashboard");

  } catch (err) {
    console.error("Signup Flow Error:", err);
    alert(err.message || "An unexpected error occurred.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <div style={accentBar} />

        {/* Progress Tracker */}
        <div style={progressContainer}>
          <span style={{ ...stepBadge, backgroundColor: step >= 1 ? "#6D3DF5" : "#e5e7eb", color: step >= 1 ? "white" : "#6b7280" }}>1</span>
          <div style={{ ...progressLine, backgroundColor: step === 2 ? "#6D3DF5" : "#e5e7eb" }} />
          <span style={{ ...stepBadge, backgroundColor: step === 2 ? "#6D3DF5" : "#e5e7eb", color: step === 2 ? "white" : "#6b7280" }}>2</span>
        </div>

        <h2 style={{ marginBottom: "6px", fontSize: "20px", textAlign: "center" }}>
          {step === 1 ? "Tell us about your business" : "Create Your Serven Account"}
        </h2>

        <p style={{ ...subText, textAlign: "center" }}>
          {step === 1 
            ? "Tell us about your restaurant so we can personalize your Profit Recovery Dashboard and benchmark your operation." 
            : "Almost there! Protect your account with a secure login."}
        </p>

        {errorMessage && <div style={errorBox}>{errorMessage}</div>}

        {/* STEP 1: BUSINESS DETAILS */}
        {step === 1 && (
          <div>
            <label style={labelStyle}>Restaurant / Restaurant Group</label>
            <input
              type="text"
              placeholder="e.g. Mama's Pizzeria"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              placeholder="(555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Restaurant Type</label>
           <select
  value={businessType}
  onChange={(e) => setBusinessType(e.target.value)}
  style={{ ...selectStyle, marginBottom: "14px" }}
>
  <option value="">Select Restaurant Type</option>

  <option value="fine_dining">Fine Dining</option>

  <option value="steakhouse">Steakhouse</option>

  <option value="seafood">Seafood Restaurant</option>

  <option value="full_service">Full-Service Restaurant</option>

  <option value="casual_dining">Casual Dining</option>

  <option value="fast_casual">Fast Casual</option>

  <option value="breakfast_brunch">Breakfast / Brunch</option>

  <option value="sports_bar">Sports Bar</option>

  <option value="bar_grill">Bar & Grill</option>

  <option value="hotel_restaurant">Hotel Restaurant</option>

  <option value="coffee">Coffee Shop / Café</option>

  <option value="bakery">Bakery</option>

  <option value="juice">Juice / Smoothie Bar</option>

  <option value="food_hall">Food Hall Vendor</option>

  <option value="multi_location">Multi-Location Restaurant Group</option>

  <option value="franchise">Franchise Operator</option>

  <option value="other">Other</option>
</select>

            <label style={labelStyle}>Establishment Size</label>
            <select
  value={size}
  onChange={(e) => setSize(e.target.value)}
  style={selectStyle}
>
  <option value="">Select Number of Locations</option>

  <option value="single">Single Location</option>

  <option value="small_group">2–5 Locations</option>

  <option value="regional">6–15 Locations</option>

  <option value="enterprise">16–50 Locations</option>

  <option value="national">50+ Locations</option>
</select>

            <button onClick={handleNextStep} style={{ ...buttonStyle, marginTop: "20px" }}>
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: CREDENTIALS & SUMMARY */}
        {step === 2 && (
          <div>
           {size && (
  <div style={summaryBox}>
    <div
      style={{
        fontSize: "12px",
        color: "#6b21a8",
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "8px",
      }}
    >
      Recommended Plan
    </div>

    <div
      style={{
        fontSize: "24px",
        fontWeight: "900",
        color: "#4c1d95",
        marginBottom: "8px",
      }}
    >
      {getRecommendedPlan(size).toUpperCase()}
    </div>

    <div
      style={{
        fontSize: "13px",
        color: "#6b7280",
        lineHeight: 1.6,
      }}
    >
      Designed for restaurants focused on recovering profit,
      improving operations, and scaling with confidence.
    </div>

    <div
      style={{
        marginTop: "12px",
        fontSize: "13px",
        fontWeight: "700",
        color: "#16a34a",
      }}
    >
      Estimated Investment: {getEstimatedPriceRange(size)}
    </div>
  </div>
)}

            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              placeholder="name@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
              <span onClick={() => setShowPassword(!showPassword)} style={toggleStyle}>
                {showPassword ? "Hide" : "Show"}
              </span>
            </div>

            <label style={labelStyle}>Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button 
                onClick={() => setStep(1)} 
                style={{ ...buttonStyle, background: "#f3f4f6", color: "#4b5563", boxShadow: "none" }}
              >
                Back
              </button>
              <button
                onClick={handleSignup}
                disabled={loading}
                style={{
                  ...buttonStyle,
                  flex: 2,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Creating profile..." : "Launch My Dashboard"}
              </button>
            </div>
          </div>
        )}

        <p style={footerText}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#6D3DF5", fontWeight: "600" }}>
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const pageWrapper = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
  fontFamily: "sans-serif",
  padding: "20px",
};

const cardStyle = {
  width: "440px",
  padding: "32px",
  borderRadius: "16px",
  background: "white",
  border: "1px solid #e5e7eb",
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
};

const accentBar = {
  height: "4px",
  width: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #6D3DF5, #9333ea)",
  marginBottom: "20px",
};

const progressContainer = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "24px",
};

const stepBadge = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: "bold",
  transition: "all 0.3s ease",
};

const progressLine = {
  height: "3px",
  width: "60px",
  transition: "all 0.3s ease",
};

const subText = {
  color: "#6b7280",
  fontSize: "13px",
  marginBottom: "24px",
  lineHeight: "1.4",
};

const errorBox = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  padding: "12px",
  borderRadius: "10px",
  fontSize: "13px",
  marginBottom: "14px",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  marginBottom: "6px",
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "14px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
};

const summaryBox = {
  background: "#f5f3ff",
  border: "1px solid #ddd6fe",
  color: "#5b21b6",
  padding: "12px",
  borderRadius: "10px",
  fontSize: "13px",
  marginBottom: "18px",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  color: "white",
  fontSize: "15px",
  fontWeight: "600",
  transition: "0.2s",
  background: "#6D3DF5",
  boxShadow: "0 10px 20px rgba(109,61,245,0.15)",
};

const toggleStyle = {
  position: "absolute",
  right: "12px",
  top: "14px",
  cursor: "pointer",
  fontSize: "12px",
  color: "#6D3DF5",
  fontWeight: "600",
};

const footerText = {
  marginTop: "20px",
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center",
};