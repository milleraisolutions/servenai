"use client";

import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard crashed:", error);
    console.error("Dashboard crash details:", errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "32px",
            background:
              "linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "720px",
              padding: "28px",
              borderRadius: "24px",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
              border: "1px solid rgba(248,113,113,0.28)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                color: "#fca5a5",
                fontSize: "12px",
                fontWeight: "900",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Dashboard Protection
            </div>

            <h1
              style={{
                fontSize: "28px",
                fontWeight: "950",
                margin: "0 0 10px",
              }}
            >
              Something went wrong, but your app is still protected.
            </h1>

            <p
              style={{
                color: "#cbd5e1",
                fontSize: "15px",
                lineHeight: "1.6",
                marginBottom: "18px",
              }}
            >
              The dashboard hit an error, but this safety layer stopped the
              whole page from crashing.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "rgba(15,23,42,0.85)",
                  border: "1px solid rgba(148,163,184,0.18)",
                  color: "#fecaca",
                  fontSize: "13px",
                  marginBottom: "18px",
                  overflowX: "auto",
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={this.handleReset}
                style={{
                  border: "none",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  fontWeight: "900",
                  cursor: "pointer",
                  color: "#020617",
                  background:
                    "linear-gradient(135deg, #facc15, #f97316)",
                }}
              >
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  border: "1px solid rgba(148,163,184,0.22)",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  fontWeight: "900",
                  cursor: "pointer",
                  color: "white",
                  background: "rgba(15,23,42,0.85)",
                }}
              >
                Reload Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}