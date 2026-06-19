"use client";

export default function RiskPanel({
  riskPanelCardStyle,
  riskStatCardStyle,
  sortedRiskClients,
  highRiskClients,
  watchClients,
  healthyClients,
  selectedRiskClient,
  setSelectedRiskClient,
  getRiskStatusText,
  getRiskArrow,
  openRiskEmailModal,
  markRiskClientReviewed,
  isRiskClientReviewed,
}) {
  const isOwner = true;
  return (
    <div style={riskPanelCardStyle}>
      {/* 🔥 RISK PANEL */}
{canSeeOwnerDashboard && (
  <div style={riskPanelCardStyle}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        flexWrap: "wrap",
        marginBottom: "22px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#a78bfa",
            marginBottom: "8px",
          }}
        >
          Owner Command
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "900",
            color: "white",
          }}
        >
          At-Risk Clients
        </h2>

        <p
          style={{
            margin: "8px 0 0 0",
            color: "#94a3b8",
            fontSize: "14px",
            maxWidth: "720px",
            lineHeight: 1.6,
          }}
        >
          Serven ranks clients by score weakness, revenue decline, food cost,
          labor pressure, alerts, and waste signals so you can prioritize
          outreach fast.
        </p>
      </div>

      <div
        style={{
          padding: "10px 14px",
          borderRadius: "999px",
          background: "rgba(167,139,250,0.12)",
          border: "1px solid rgba(167,139,250,0.24)",
          color: "#ddd6fe",
          fontWeight: "800",
          fontSize: "13px",
        }}
      >
        {sortedRiskClients.length} tracked clients
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
        marginBottom: "22px",
      }}
    >
      <div style={riskStatCardStyle}>
        <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
          High Risk
        </div>
        <div style={{ fontSize: "28px", fontWeight: "900", color: "#f87171" }}>
          {highRiskClients.length}
        </div>
      </div>

      <div style={riskStatCardStyle}>
        <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
          Watch List
        </div>
        <div style={{ fontSize: "28px", fontWeight: "900", color: "#fbbf24" }}>
          {watchClients.length}
        </div>
      </div>

      <div style={riskStatCardStyle}>
        <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
          Stable Clients
        </div>
        <div style={{ fontSize: "28px", fontWeight: "900", color: "#4ade80" }}>
          {healthyClients.length}
        </div>
      </div>

      <div style={riskStatCardStyle}>
        <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
          Immediate Outreach
        </div>
        <div style={{ fontSize: "28px", fontWeight: "900", color: "white" }}>
          {
            highRiskClients.filter(
              (client) =>
                client.ownerScore < 55 || client.monthlyChange <= -15
            ).length
          }
        </div>
      </div>
    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {sortedRiskClients.length === 0 ? (
        <div
          style={{
            borderRadius: "18px",
            padding: "20px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(148,163,184,0.12)",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          No client uploads yet. Once restaurants upload data, their risk level
          will appear here.
        </div>
      ) : (
        sortedRiskClients.slice(0, 8).map((client, index) => (
          <div
            key={client.id || `${client.client_name}-${index}`}
            onClick={() => setSelectedRiskClient(client)}
            style={{
              borderRadius: "20px",
              padding: "18px",
              background: client.riskBg,
              border: client.riskBorder,
              cursor: "pointer",
              transition: "0.2s ease",
              boxShadow:
                selectedRiskClient?.id === client.id ||
                selectedRiskClient?.client_name === client.client_name
                  ? "0 0 0 1px rgba(167,139,250,0.45), 0 18px 40px rgba(2,6,23,0.18)"
                  : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "900",
                      color: "white",
                    }}
                  >
                    {client.client_name || "Unknown Client"}
                  </div>

                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: client.riskColor,
                      fontWeight: "800",
                      fontSize: "12px",
                    }}
                  >
                    {client.riskLevel}
                  </div>
                </div>

                <div
                  style={{
                    color: "#cbd5e1",
                    fontSize: "13px",
                    marginBottom: "10px",
                  }}
                >
                  {client.source_name || "Unknown Source"} •{" "}
                  {getRiskStatusText(client)}
                </div>

                <div
                  style={{
                    color: client.riskColor,
                    fontSize: "13px",
                    fontWeight: "800",
                  }}
                >
                  Primary issue: {client.topRiskReason}
                </div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "16px",
                  background: "rgba(2,6,23,0.32)",
                  border: "1px solid rgba(148,163,184,0.12)",
                  minWidth: "140px",
                }}
              >
                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
                  Owner Score
                </div>
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: "900",
                    color: client.riskColor,
                  }}
                >
                  {Math.round(client.ownerScore)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  borderRadius: "14px",
                  padding: "12px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "5px" }}>
                  Client Score
                </div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "white" }}>
                  {Math.round(client.clientScore)}
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  padding: "12px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "5px" }}>
                  Monthly Trend
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "800",
                    color: client.monthlyChange < 0 ? "#f87171" : "#4ade80",
                  }}
                >
                  {getRiskArrow(client.monthlyChange)}{" "}
                  {Math.abs(client.monthlyChange).toFixed(1)}%
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  padding: "12px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "5px" }}>
                  Weekly Trend
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "800",
                    color: client.weeklyChange < 0 ? "#f87171" : "#4ade80",
                  }}
                >
                  {getRiskArrow(client.weeklyChange)}{" "}
                  {Math.abs(client.weeklyChange).toFixed(1)}%
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  padding: "12px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "5px" }}>
                  Food Cost
                </div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "white" }}>
                  {client.foodCost.toFixed(1)}%
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  padding: "12px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "5px" }}>
                  Alerts
                </div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "white" }}>
                  {client.alerts}
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  padding: "12px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "5px" }}>
                  Waste Loss
                </div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "white" }}>
                  ${client.wasteLoss.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

     {selectedRiskClient && (
  <div
    style={{
      marginTop: "18px",
      borderRadius: "24px",
      padding: "22px",
      background:
        "linear-gradient(135deg, rgba(2,6,23,0.92), rgba(15,23,42,0.9))",
      border: "1px solid rgba(148,163,184,0.16)",
      boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        flexWrap: "wrap",
        marginBottom: "18px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#a78bfa",
            marginBottom: "8px",
          }}
        >
          Client Detail
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "900",
            color: "white",
          }}
        >
          {selectedRiskClient.client_name || "Unknown Client"}
        </h3>

        <p
          style={{
            margin: "8px 0 0 0",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          {selectedRiskClient.source_name || "Unknown Source"} •{" "}
          {selectedRiskClient.riskLevel}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedRiskClient(null);
        }}
        style={{
          padding: "10px 14px",
          borderRadius: "12px",
          border: "1px solid rgba(148,163,184,0.2)",
          background: "rgba(255,255,255,0.04)",
          color: "white",
          fontWeight: "800",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          borderRadius: "16px",
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
          Owner Score
        </div>
        <div style={{ fontSize: "24px", fontWeight: "900", color: "white" }}>
          {Math.round(selectedRiskClient.ownerScore || 0)}
        </div>
      </div>

      <div
        style={{
          borderRadius: "16px",
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
          Client Score
        </div>
        <div style={{ fontSize: "24px", fontWeight: "900", color: "white" }}>
          {Math.round(selectedRiskClient.clientScore || 0)}
        </div>
      </div>

      <div
        style={{
          borderRadius: "16px",
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
          Monthly Trend
        </div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: "900",
            color:
              Number(selectedRiskClient.monthlyChange || 0) < 0
                ? "#f87171"
                : "#4ade80",
          }}
        >
          {Number(selectedRiskClient.monthlyChange || 0).toFixed(1)}%
        </div>
      </div>

      <div
        style={{
          borderRadius: "16px",
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
          Weekly Trend
        </div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: "900",
            color:
              Number(selectedRiskClient.weeklyChange || 0) < 0
                ? "#f87171"
                : "#4ade80",
          }}
        >
          {Number(selectedRiskClient.weeklyChange || 0).toFixed(1)}%
        </div>
      </div>

      <div
        style={{
          borderRadius: "16px",
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
          Food Cost
        </div>
        <div style={{ fontSize: "24px", fontWeight: "900", color: "white" }}>
          {Number(selectedRiskClient.foodCost || 0).toFixed(1)}%
        </div>
      </div>

      <div
        style={{
          borderRadius: "16px",
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
          Labor Cost
        </div>
        <div style={{ fontSize: "24px", fontWeight: "900", color: "white" }}>
          {Number(selectedRiskClient.laborCost || 0).toFixed(1)}%
        </div>
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "12px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          borderRadius: "16px",
          padding: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "8px",
            fontWeight: "700",
          }}
        >
          Top Issue
        </div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: "800",
            color: "white",
            lineHeight: 1.5,
          }}
        >
          {selectedRiskClient.top_issue ||
            selectedRiskClient.topRiskReason ||
            "No issue detected"}
        </div>
      </div>

      <div
        style={{
          borderRadius: "16px",
          padding: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "8px",
            fontWeight: "700",
          }}
        >
          Alert Summary
        </div>
        <div style={{ color: "white", fontSize: "14px", lineHeight: 1.7 }}>
          <div>Alerts: {Number(selectedRiskClient.alerts || 0)}</div>
          <div>
            Profit Leaks: {Number(selectedRiskClient.profitLeakCount || 0)}
          </div>
          <div>
            Waste Loss: ${Number(selectedRiskClient.wasteLoss || 0).toFixed(0)}
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: "16px",
          padding: "16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "8px",
            fontWeight: "700",
          }}
        >
          Recommended Action
        </div>
        <div
          style={{
            color: "white",
            fontSize: "14px",
            lineHeight: 1.7,
          }}
        >
          {selectedRiskClient.ownerScore < 55
            ? "Reach out immediately and review pricing, waste, and operations."
            : selectedRiskClient.monthlyChange <= -15
            ? "Launch a recovery plan and check campaign performance."
            : selectedRiskClient.foodCost >= 40
            ? "Audit menu mix and supplier pricing right away."
            : selectedRiskClient.alerts >= 3
            ? "Investigate repeated alert patterns and contact the client."
            : "Monitor closely and review next upload for trend confirmation."}
        </div>
      </div>
    </div>

    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
   <button
  onClick={(e) => {
    e.stopPropagation();
    openRiskEmailModal(selectedRiskClient);
  }}
        style={{
          padding: "12px 16px",
          borderRadius: "14px",
          border: "none",
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "white",
          fontWeight: "800",
          cursor: "pointer",
        }}
      >
        Email Client
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          markRiskClientReviewed(selectedRiskClient);
        }}
        style={{
          padding: "12px 16px",
          borderRadius: "14px",
          border: "1px solid rgba(34,197,94,0.28)",
          background: isRiskClientReviewed(selectedRiskClient)
            ? "rgba(34,197,94,0.16)"
            : "rgba(255,255,255,0.04)",
          color: isRiskClientReviewed(selectedRiskClient) ? "#4ade80" : "white",
          fontWeight: "800",
          cursor: "pointer",
        }}
      >
        {isRiskClientReviewed(selectedRiskClient)
          ? "Reviewed"
          : "Mark Reviewed"}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          alert(
            `Recovery plan for ${selectedRiskClient.client_name || "this client"} will be connected next.`
          );
        }}
        style={{
          padding: "12px 16px",
          borderRadius: "14px",
          border: "1px solid rgba(245,158,11,0.28)",
          background: "rgba(245,158,11,0.12)",
          color: "#fbbf24",
          fontWeight: "800",
          cursor: "pointer",
        }}
      >
        Run Recovery Plan
      </button>
    </div>
  </div>
)}
    </div>
  </div>
)}

    </div>
  );
}