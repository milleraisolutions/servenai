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

  const handleSignup = async () => {
    try {
      setErrorMessage("");

      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanPassword = String(password || "");
      const cleanConfirmPassword = String(confirmPassword || "");
      const cleanPhone = String(phone || "").trim();

      if (!cleanEmail || !cleanPassword) {
        setErrorMessage("Please enter your email and password.");
        return;
      }

      if (cleanPassword.length < 6) {
        setErrorMessage("Password must be at least 6 characters.");
        return;
      }

      if (cleanPassword !== cleanConfirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        setErrorMessage(error.message || "Signup failed.");
        return;
      }

      const userId = data?.user?.id;

      if (!userId) {
        setErrorMessage("Account created, but user profile was not returned.");
        return;
      }

      const { error: profileError } = await supabase
        .from("users")
        .upsert(
          {
            id: userId,
            email: cleanEmail,
            phone: cleanPhone || null,
            restaurant_name: restaurantName.trim(),
            business_type: businessType || "",
            size: size || "",
            plan: "none",
            customer_status: "lead",
            subscription_status: "pending",
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profileError) {
        console.error("PROFILE SAVE ERROR:", profileError);
        setErrorMessage(profileError.message || "Profile save failed.");
        return;
      }

      await saveLeadToSupabase({ userId, cleanEmail, cleanPhone });

      router.push("/dashboard");
    } catch (err) {
      console.error("SIGNUP FAILED:", err);
      setErrorMessage(err?.message || "Something went wrong during signup.");
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
          {step === 1 ? "Tell us about your business" : "Create your credentials"}
        </h2>

        <p style={{ ...subText, textAlign: "center" }}>
          {step === 1 
            ? "We'll customize your dashboard experiences based on your setup." 
            : "Almost there! Protect your account with a secure login."}
        </p>

        {errorMessage && <div style={errorBox}>{errorMessage}</div>}

        {/* STEP 1: BUSINESS DETAILS */}
        {step === 1 && (
          <div>
            <label style={labelStyle}>Business Name</label>
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

            <label style={labelStyle}>Business Type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              style={{ ...selectStyle, marginBottom: "14px" }}
            >
              <option value="restaurant">Full-Service Restaurant</option>
              <option value="coffee">Coffee Shop</option>
              <option value="smoothie">Smoothie / Juice Bar</option>
            </select>

            <label style={labelStyle}>Establishment Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select Capacity</option>
              <option value="small">Small (0–50 seats)</option>
              <option value="medium">Medium (50–150 seats)</option>
              <option value="large">Large (150+ seats)</option>
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
                ✨ <strong>Tailored Plan:</strong> {getRecommendedPlan(size).toUpperCase()} ({getEstimatedPriceRange(size)})
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
                {loading ? "Creating profile..." : "Create My Demo Profile"}
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