"use client";

export default function AICommandCenter({
  activeAiCommandTab,
  setActiveAiCommandTab,
  filteredAiAlerts,
  handleViewAlertFix,
  handleResolveAlert,
  handleIgnoreAlert,
  autopilotRecommendation,
  uploadComparison,
  handleApplyAiFix,
  hasGrowthAccess,
  fetchAIInsights,
  router,
  hasProAccess,
  runRealProfitEngine,
  realProfitLoading,
  realProfitEngine,
  appliedFixes,
  setSimulatedProfit,
  setMessage,
  setAppliedFixes,
  restaurantHealthScore,
restaurantHealthGrade,
restaurantHealthTrend,
restaurantHealthProjectedScore,
restaurantHealthPrimaryRisk,
topHealthAction,
topHealthRecommendation,
}) {
  return (
    <>
      {/* 🧠 AI COMMAND CENTER */}
<div
  style={{
    padding: "22px",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 32%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))",
    border: "1px solid rgba(167,139,250,0.18)",
    boxShadow: "0 24px 60px rgba(2,6,23,0.28)",
    marginBottom: "24px",
  }}
>
  <div style={{ color: "#c4b5fd", fontWeight: "900", fontSize: "12px" }}>
    AI Command Center
  </div>
{/* 🧠 AI HEALTH STATUS */}
<div
  style={{
    marginTop: "18px",
    marginBottom: "18px",
    padding: "18px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(15,23,42,0.92))",
    border: "1px solid rgba(129,140,248,0.18)",
  }}
>
  <div
    style={{
      color: "#c7d2fe",
      fontSize: "12px",
      fontWeight: "950",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "10px",
    }}
  >
    Restaurant AI Health
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: "18px",
      flexWrap: "wrap",
      alignItems: "center",
    }}
  >
    <div>
      <div
        style={{
          color: "white",
          fontSize: "42px",
          fontWeight: "1000",
          lineHeight: 1,
        }}
      >
        {restaurantHealthScore}/100
      </div>

      <div
        style={{
          marginTop: "6px",
          color: "#c7d2fe",
          fontSize: "14px",
          fontWeight: "900",
        }}
      >
        {restaurantHealthGrade}
      </div>
    </div>

    <div style={{ flex: 1, minWidth: "260px" }}>
      <div
        style={{
          color: "#e2e8f0",
          fontSize: "14px",
          lineHeight: 1.7,
        }}
      >
        Primary operational risk detected:{" "}
        <strong>{restaurantHealthPrimaryRisk}</strong>.
        Forecast trend is{" "}
        <strong>{restaurantHealthTrend}</strong> with a projected score of{" "}
        <strong>{restaurantHealthProjectedScore}/100</strong>.
      </div>

      {topHealthRecommendation && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px 12px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(148,163,184,0.12)",
            color: "#cbd5e1",
            fontSize: "13px",
            fontWeight: "800",
          }}
        >
          Recommended Action: {topHealthRecommendation}
        </div>
      )}
    </div>
  </div>
</div>
{/* ⚡ EXECUTIVE AI SUMMARY */}
<div
  style={{
    marginBottom: "20px",
    padding: "18px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
    border: "1px solid rgba(148,163,184,0.14)",
  }}
>
  <div
    style={{
      color: "#d4af37",
      fontSize: "12px",
      fontWeight: "950",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "10px",
    }}
  >
    Executive AI Summary
  </div>

  <div
    style={{
      color: "white",
      fontSize: "20px",
      fontWeight: "950",
      marginBottom: "10px",
    }}
  >
    AI Operational Readout
  </div>

  <div
    style={{
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.8,
    }}
  >
    Restaurant operations are currently rated{" "}
    <strong>{restaurantHealthGrade}</strong> with a health score of{" "}
    <strong>{restaurantHealthScore}/100</strong>. AI forecasting is currently{" "}
    <strong>{restaurantHealthTrend}</strong> with a projected 30-day score of{" "}
    <strong>{restaurantHealthProjectedScore}/100</strong>. Primary operational
    focus is{" "}
    <strong>
      {topHealthAction?.text || restaurantHealthPrimaryRisk}
    </strong>
    .
  </div>
</div>
  <div
    style={{
      color: "white",
      fontSize: "22px",
      fontWeight: "900",
      marginTop: "6px",
      marginBottom: "14px",
    }}
  >
    Serven intelligence layer
  </div>

  <div
    style={{
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    {[
      { key: "alerts", label: "Alerts" },
      { key: "autopilot", label: "Autopilot" },
      { key: "growth", label: "Growth AI" },
      { key: "profit", label: "Profit Engine" },
    ].map((tab) => {
      const isActive = activeAiCommandTab === tab.key;

      return (
        <button
          key={tab.key}
          type="button"
          onClick={() => setActiveAiCommandTab(tab.key)}
          style={{
            padding: "9px 12px",
            borderRadius: "999px",
            border: isActive
              ? "1px solid rgba(167,139,250,0.35)"
              : "1px solid rgba(148,163,184,0.16)",
            background: isActive
              ? "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(79,70,229,0.24))"
              : "rgba(255,255,255,0.04)",
            color: isActive ? "white" : "#cbd5e1",
            fontWeight: "900",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {tab.label}
        </button>
      );
    })}
  </div>

  {activeAiCommandTab === "alerts" && (
    <>
      {/* 🚨 AI ALERTS FROM UPLOAD + REVENUE INTELLIGENCE */}
<div
  style={{
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.94))",
    border: "1px solid rgba(148,163,184,0.16)",
    marginBottom: "20px",
  }}
>
  <div style={{ color: "#fca5a5", fontWeight: "900", fontSize: "12px" }}>
    AI Alerts
  </div>

  <div
    style={{
      color: "white",
      fontWeight: "900",
      fontSize: "20px",
      marginTop: "6px",
      marginBottom: "12px",
    }}
  >
    Smart alerts from uploaded data
  </div>

  {filteredAiAlerts.length ? (
    <div style={{ display: "grid", gap: "10px" }}>
     {filteredAiAlerts.map((alert, index) => {
  const tone =
    alert.type === "critical"
      ? {
          bg: "rgba(239,68,68,0.10)",
          border: "1px solid rgba(239,68,68,0.18)",
          color: "#fca5a5",
        }
      : alert.type === "warning"
      ? {
          bg: "rgba(245,158,11,0.10)",
          border: "1px solid rgba(245,158,11,0.18)",
          color: "#fde68a",
        }
      : {
          bg: "rgba(59,130,246,0.10)",
          border: "1px solid rgba(59,130,246,0.18)",
          color: "#93c5fd",
        };

  return (
    <div
      key={`${alert.title}-${index}`}
      style={{
        padding: "14px",
        borderRadius: "16px",
        background: tone.bg,
        border: tone.border,
      }}
    >
      {/* ALERT TITLE */}
      <div
        style={{
          color: tone.color,
          fontWeight: "900",
          marginBottom: "5px",
        }}
      >
        {alert.title}
      </div>

      {/* ALERT MESSAGE */}
      <div
        style={{
          color: "#e2e8f0",
          fontSize: "13px",
          lineHeight: 1.6,
          marginBottom: "10px",
        }}
      >
        {alert.message}
      </div>

      {/* ACTION BUTTONS */}
      <div
        style={{
          marginTop: "10px",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {/* VIEW AI FIX */}
        <button
          type="button"
          onClick={() => handleViewAlertFix(alert)}
          style={{
            padding: "7px 10px",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            color: "white",
            fontWeight: "800",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          View AI Fix
        </button>

        {/* RESOLVE */}
        <button
          type="button"
          onClick={() => handleResolveAlert(alert)}
          style={{
            padding: "7px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(34,197,94,0.25)",
            background: "rgba(34,197,94,0.12)",
            color: "#86efac",
            fontWeight: "800",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          Resolve
        </button>

        {/* IGNORE */}
        <button
          type="button"
          onClick={() => handleIgnoreAlert(alert)}
          style={{
            padding: "7px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(148,163,184,0.25)",
            background: "rgba(148,163,184,0.12)",
            color: "#cbd5e1",
            fontWeight: "800",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          Ignore
        </button>
      </div>
    </div>
  );
})}
    </div>
  ) : (
    <div style={{ color: "#94a3b8", fontSize: "13px" }}>
      No AI alerts yet. Upload menu items, ingredients, or sales data to detect risks.
    </div>
  )}
</div>
    </>
  )}

{activeAiCommandTab === "autopilot" && (
  <>
    {/* 🤖 AUTOPILOT RECOMMENDATION */}
    <div
      style={{
        padding: "20px",
        borderRadius: "20px",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(79,70,229,0.16))",
        border: "1px solid rgba(129,140,248,0.18)",
        marginBottom: "20px",
      }}
    >
      <div style={{ color: "#c7d2fe", fontWeight: "900", fontSize: "12px" }}>
        Autopilot Recommendation
      </div>

      <div
        style={{
          color: "white",
          fontWeight: "900",
          fontSize: "20px",
          marginTop: "6px",
          marginBottom: "12px",
        }}
      >
        What Serven would do next
      </div>

      {autopilotRecommendation ? (
        <div
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              color: "#fca5a5",
              fontWeight: "900",
              marginBottom: "6px",
            }}
          >
            {autopilotRecommendation.alert?.title || "AI Recommendation"}
          </div>

          <div
            style={{
              color: "#e2e8f0",
              fontSize: "13px",
              lineHeight: 1.6,
              marginBottom: "10px",
            }}
          >
            {autopilotRecommendation.alert?.message ||
              "Serven found an action worth reviewing."}
          </div>

          <div
            style={{
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(79,70,229,0.12)",
              border: "1px solid rgba(129,140,248,0.18)",
              color: "#c7d2fe",
              fontSize: "13px",
              fontWeight: "800",
              lineHeight: 1.6,
            }}
          >
            Recommended next move:{" "}
            {autopilotRecommendation.action ||
              "Review the highest-impact issue first."}
          </div>
          <div
  style={{
    marginTop: "12px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={handleApplyAiFix}
    style={{
      padding: "9px 12px",
      borderRadius: "10px",
      border: "none",
      background: "linear-gradient(135deg, #22c55e, #16a34a)",
      color: "white",
      fontWeight: "900",
      fontSize: "12px",
      cursor: "pointer",
    }}
  >
    Apply Fix
  </button>
</div>
        </div>
      ) : (uploadComparison?.changedMenuItems || []).length ? (
        <div
          style={{
            padding: "14px",
            borderRadius: "16px",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.18)",
          }}
        >
          <div style={{ color: "#fde68a", fontWeight: "900", marginBottom: "6px" }}>
            Upload changes detected
          </div>

          <div
            style={{
              color: "#e2e8f0",
              fontSize: "13px",
              lineHeight: 1.6,
              marginBottom: "10px",
            }}
          >
            {(uploadComparison?.changedMenuItems || []).length} menu item change
            {(uploadComparison?.changedMenuItems || []).length === 1 ? "" : "s"} detected.
          </div>

          <div
            style={{
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(79,70,229,0.12)",
              border: "1px solid rgba(129,140,248,0.18)",
              color: "#c7d2fe",
              fontSize: "13px",
              fontWeight: "800",
              lineHeight: 1.6,
            }}
          >
            Recommended next move: Review changed items and protect margins on
            cost increases first.
          </div>
        </div>
      ) : (
        <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
          No autopilot recommendation yet. Click Refresh Comparison after
          uploading changed menu files.
        </div>
      )}
    </div>
  </>
)}

  {activeAiCommandTab === "growth" && (
    <>
      {/* 🧠 GROWTH AI INSIGHTS — GROWTH + PRO */}
<div
  style={{
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.94), rgba(37,99,235,0.14))",
    border: "1px solid rgba(96,165,250,0.18)",
    marginBottom: "20px",
  }}
>
  <div style={{ color: "#93c5fd", fontWeight: "900", fontSize: "12px" }}>
    Growth AI Insights
  </div>

  <div
    style={{
      color: "white",
      fontWeight: "900",
      fontSize: "20px",
      marginTop: "6px",
    }}
  >
    Run a general AI business scan
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
      marginTop: "6px",
    }}
  >
    Uses revenue, margin, food cost, and uploaded data signals to generate AI
    insights.
  </div>

  {hasGrowthAccess ? (
    <button
      type="button"
      onClick={fetchAIInsights}
      style={{
        marginTop: "14px",
        padding: "10px 14px",
        borderRadius: "12px",
        border: "none",
        background: "linear-gradient(135deg, #2563eb, #4f46e5)",
        color: "white",
        fontWeight: "900",
        cursor: "pointer",
      }}
    >
      Run AI Insights
    </button>
  ) : (
    <div style={{ marginTop: "14px" }}>
      <div
        style={{
          color: "#bfdbfe",
          fontSize: "12px",
          fontWeight: "800",
          marginBottom: "10px",
        }}
      >
        {uploadComparison?.inactiveMenuItems?.length
          ? `${uploadComparison.inactiveMenuItems.length} issues detected`
          : "3 issues detected"}
      </div>

      <button
        type="button"
        onClick={() => router.push("/pricing")}
        style={{
          padding: "10px 14px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #64748b, #475569)",
          color: "white",
          fontWeight: "900",
          cursor: "pointer",
        }}
      >
        Unlock Growth AI →
      </button>
    </div>
  )}
</div>
    </>
  )}

  {activeAiCommandTab === "profit" && (
  <>
    {hasProAccess ? (
      <>
        {/* 🧠 REAL AI PROFIT ENGINE */}
        <div
          style={{
            padding: "22px",
            borderRadius: "22px",
            background:
              "radial-gradient(circle at top right, rgba(124,58,237,0.16), transparent 34%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
            border: "1px solid rgba(148,163,184,0.16)",
            marginBottom: "22px",
            boxShadow: "0 22px 60px rgba(2,6,23,0.28)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "900",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c4b5fd",
              marginBottom: "8px",
            }}
          >
            AI Profit Engine
          </div>

          <div style={{ color: "white", fontWeight: "900", fontSize: "20px" }}>
            Live profit opportunities from your data
          </div>

          <div
            style={{
              color: "#94a3b8",
              fontSize: "13px",
              marginTop: "6px",
              lineHeight: 1.6,
            }}
          >
            Serven analyzes menu performance, pricing, cost spikes, and demand
            signals to surface the highest-impact profit moves.
          </div>

          <button
  type="button"
  onClick={runRealProfitEngine}
  disabled={realProfitLoading}
  style={{
    marginTop: "14px",
    padding: "11px 16px",
    borderRadius: "999px",
    border: "1px solid rgba(167,139,250,0.28)",
    background: realProfitLoading
      ? "rgba(148,163,184,0.18)"
      : "linear-gradient(135deg, #7c3aed, #4f46e5)",
    color: "white",
    fontWeight: "900",
    cursor: realProfitLoading ? "not-allowed" : "pointer",
    boxShadow: realProfitLoading
      ? "none"
      : "0 14px 34px rgba(124,58,237,0.24)",
  }}
>
  {realProfitLoading ? "AI scanning..." : "Run AI Profit Scan →"}
</button>

          {realProfitEngine?.actions?.length ? (
            <div style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
              {realProfitEngine.actions.slice(0, 5).map((action, index) => {
                const impact = Number(
                  action.estimatedMonthlyImpact || action.impact || 0
                );

                return (
                  <div
                    key={`${action.type || "profit-action"}-${index}`}
                    style={{
                      padding: "16px",
                      borderRadius: "18px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(148,163,184,0.12)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "14px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          color: "white",
                          fontWeight: "900",
                          fontSize: "14px",
                        }}
                      >
                        {action.title || `Profit Opportunity ${index + 1}`}
                      </div>

                      <div
                        style={{
                          color: "#cbd5e1",
                          fontSize: "13px",
                          marginTop: "6px",
                          lineHeight: 1.5,
                        }}
                      >
                        {action.issue ||
                          action.description ||
                          "AI found a profit opportunity from uploaded data."}
                      </div>

                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: "12px",
                          marginTop: "6px",
                          lineHeight: 1.6,
                        }}
                      >
                        {action.recommendation ||
                          "Review this opportunity and apply the recommended profit fix."}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", minWidth: "120px" }}>
                      <div
                        style={{
                          color: "#22c55e",
                          fontWeight: "900",
                          fontSize: "15px",
                        }}
                      >
                        +${impact.toLocaleString()}/mo
                      </div>
<button
  type="button"
  onClick={() => {
    const actionTitle = action?.title || `Profit Action ${index + 1}`;
    const actionImpact = Number(impact || 0);

    if (appliedFixes.includes(actionTitle)) return;

    setSimulatedProfit((prev) => Number(prev || 0) + actionImpact);

    // ✅ polished message
    setMessage(`✅ ${actionTitle} applied successfully`);

    setAppliedFixes((prev) => [...prev, actionTitle]);
  }}
  style={{
    marginTop: "12px",
    padding: "10px 14px",
    borderRadius: "999px",
    border: appliedFixes.includes(action?.title)
      ? "1px solid rgba(34,197,94,0.5)"
      : "1px solid rgba(34,197,94,0.35)",
    background: appliedFixes.includes(action?.title)
      ? "rgba(34,197,94,0.25)"
      : "rgba(34,197,94,0.18)",
    color: appliedFixes.includes(action?.title)
      ? "#4ade80"
      : "#bbf7d0",
    fontWeight: "900",
    fontSize: "12px",
    cursor: appliedFixes.includes(action?.title)
      ? "not-allowed"
      : "pointer",
    opacity: appliedFixes.includes(action?.title) ? 0.7 : 1,
  }}
>
  {appliedFixes.includes(action?.title) ? "Applied ✓" : "Apply Fix →"}
</button>

                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                marginTop: "16px",
                padding: "14px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(148,163,184,0.12)",
                color: "#94a3b8",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              Run the AI Profit Engine to uncover real revenue opportunities
              from your data.
            </div>
          )}
        </div>
      </>
    ) : (
      <>
        {/* 🔒 LOCKED REAL AI PROFIT ENGINE */}
        <div
          style={{
            position: "relative",
            padding: "22px",
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.94))",
            border: "1px solid rgba(148,163,184,0.16)",
            marginBottom: "22px",
            overflow: "hidden",
          }}
        >
          <div style={{ filter: "blur(6px)", opacity: 0.6 }}>
            <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>
              AI Profit Engine
            </div>

            <div style={{ color: "#94a3b8", marginTop: "6px" }}>
              {uploadComparison?.activeMenuItems?.length
                ? `$${(
                    uploadComparison.activeMenuItems.length * 120
                  ).toLocaleString()}/month opportunity detected`
                : "$2,800/month opportunity detected"}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(79,70,229,0.25))",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "900",
                  color: "white",
                  marginBottom: "8px",
                }}
              >
                Unlock AI Profit Engine
              </div>

              <button
                type="button"
                onClick={() => router.push("/pricing")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  color: "white",
                  fontWeight: "900",
                  cursor: "pointer",
                }}
              >
                Upgrade to Pro →
              </button>
            </div>
          </div>
        </div>
      </>
    )}
  </>
)}
</div>
    </>
  );
}