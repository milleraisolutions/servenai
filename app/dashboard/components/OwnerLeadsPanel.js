"use client";

export default function OwnerLeadsPanel({
  fetchLeads,
  leadStatCard,
  leadStatLabel,
  leadStatValue,
  leadPipelineValue,
  newLeadCount,
  contactedLeadCount,
  closedLeadCount,
  leadsLoading,
  leads,
  getLeadValue,
  leadButtonPurple,
  leadButtonGold,
  leadButtonGreen,
  updateLeadStatus,
  deleteLead,
}) {
  return (
    <div
      style={{
        marginBottom: "20px",
        padding: "20px",
        borderRadius: "22px",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.97), rgba(30,41,59,0.94))",
        border: "1px solid rgba(212,175,55,0.24)",
        boxShadow: "0 22px 55px rgba(2,6,23,0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "14px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div>
          <div
            style={{
              color: "#d4af37",
              fontSize: "12px",
              fontWeight: "900",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Owner Sales Pipeline
          </div>

          <div style={{ fontSize: "24px", fontWeight: "950", color: "white" }}>
            Leads CRM
          </div>

          <div style={{ fontSize: "13px", color: "#94a3b8" }}>
            Track signup and pricing leads from one place.
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLeads}
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(212,175,55,0.28)",
            background: "rgba(212,175,55,0.12)",
            color: "#fde68a",
            fontWeight: "900",
            cursor: "pointer",
          }}
        >
          Refresh Leads
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div style={leadStatCard}>
          <div style={leadStatLabel}>Pipeline Value</div>
          <div style={leadStatValue}>
            ${Number(leadPipelineValue || 0).toLocaleString()}/mo
          </div>
        </div>

        <div style={leadStatCard}>
          <div style={leadStatLabel}>New Leads</div>
          <div style={leadStatValue}>{newLeadCount || 0}</div>
        </div>

        <div style={leadStatCard}>
          <div style={leadStatLabel}>Contacted</div>
          <div style={leadStatValue}>{contactedLeadCount || 0}</div>
        </div>

        <div style={leadStatCard}>
          <div style={leadStatLabel}>Closed</div>
          <div style={leadStatValue}>{closedLeadCount || 0}</div>
        </div>
      </div>

      {leadsLoading ? (
        <div style={{ color: "#94a3b8", fontSize: "14px" }}>
          Loading leads...
        </div>
      ) : !leads || leads.length === 0 ? (
        <div
          style={{
            padding: "16px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          No leads yet. Signup and pricing calculator leads will appear here.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {leads.map((lead) => {
            const leadValue = getLeadValue ? getLeadValue(lead) : 0;
            const leadStatus = lead.status || "new";

            return (
              <div
                key={lead.id}
                style={{
                  padding: "16px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, rgba(2,6,23,0.72), rgba(15,23,42,0.94))",
                  border: "1px solid rgba(148,163,184,0.16)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "flex-start",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "900", color: "white" }}>
                      {lead.restaurant_name ||
                        lead.restaurant ||
                        "Unnamed Restaurant"}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        marginTop: "3px",
                      }}
                    >
                      {lead.full_name || lead.name || "No name"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "5px 9px",
                      borderRadius: "999px",
                      background:
                        leadStatus === "closed"
                          ? "rgba(34,197,94,0.14)"
                          : leadStatus === "contacted"
                          ? "rgba(245,158,11,0.14)"
                          : "rgba(56,189,248,0.14)",
                      color:
                        leadStatus === "closed"
                          ? "#86efac"
                          : leadStatus === "contacted"
                          ? "#fcd34d"
                          : "#7dd3fc",
                      fontSize: "10px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                    }}
                  >
                    {leadStatus}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "7px",
                    fontSize: "12px",
                    color: "#cbd5e1",
                  }}
                >
                  <div>
                    <strong style={{ color: "white" }}>Email:</strong>{" "}
                    {lead.email || "Not provided"}
                  </div>

                  <div>
                    <strong style={{ color: "white" }}>Phone:</strong>{" "}
                    {lead.phone || "Not provided"}
                  </div>

                  <div>
                    <strong style={{ color: "white" }}>Revenue:</strong>{" "}
                    {lead.monthly_revenue
                      ? `$${Number(lead.monthly_revenue).toLocaleString()}/mo`
                      : "Not provided"}
                  </div>

                  <div>
                    <strong style={{ color: "white" }}>Recommended:</strong>{" "}
                    {lead.recommended_plan || "Needs quote"}
                  </div>

                  <div>
                    <strong style={{ color: "white" }}>Price:</strong>{" "}
                    {lead.estimated_price_range || "Needs quote"}
                  </div>

                  <div>
                    <strong style={{ color: "white" }}>Est. Lead Value:</strong>{" "}
                    ${Number(leadValue || 0).toLocaleString()}/mo
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "14px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (lead.email) {
                        window.location.href = `mailto:${lead.email}`;
                      }
                    }}
                    style={leadButtonPurple}
                  >
                    Email
                  </button>

                  <button
                    type="button"
                    onClick={() => updateLeadStatus(lead.id, "contacted")}
                    style={leadButtonGold}
                  >
                    Contacted
                  </button>

                  <button
                    type="button"
                    onClick={() => updateLeadStatus(lead.id, "closed")}
                    style={leadButtonGreen}
                  >
                    Closed
                  </button>
                  <button
  type="button"
  onClick={() => deleteLead?.(lead.id)}
  style={{
    padding: "8px 10px",
    borderRadius: "10px",
    border: "1px solid rgba(239,68,68,0.22)",
    background: "rgba(239,68,68,0.12)",
    color: "#fca5a5",
    cursor: "pointer",
    fontWeight: "900",
  }}
>
  ✕
</button>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "10px",
                    borderTop: "1px solid rgba(148,163,184,0.12)",
                    color: "#64748b",
                    fontSize: "11px",
                  }}
                >
                  Added{" "}
                  {lead.created_at
                    ? new Date(lead.created_at).toLocaleString()
                    : "recently"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}