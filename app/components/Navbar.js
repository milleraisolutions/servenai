import Link from "next/link";

export default function Navbar() {
  const navLinkStyle = {
    color: "white",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100vw",
        background: "#020617",
        color: "white",
        padding: "14px 18px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "14px",
        overflowX: "hidden",
      }}
    >
      <h2 style={{ margin: 0, whiteSpace: "nowrap", fontSize: "22px" }}>
        SerVen
      </h2>

      <div
        style={{
          display: "flex",
          gap: "14px",
          alignItems: "center",
          justifyContent: "flex-end",
          flexWrap: "nowrap",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Link href="/" style={navLinkStyle}>Home</Link>
        <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
        <Link href="/menu-intelligence" style={navLinkStyle}>Menu</Link>
        <Link href="/inventory-ai" style={navLinkStyle}>Inventory</Link>
        <Link href="/forecasting" style={navLinkStyle}>Forecasting</Link>
        <Link href="/profit-reveal" style={navLinkStyle}>Profit Reveal</Link>
        <Link href="/login" style={navLinkStyle}>Login</Link>
      </div>
    </div>
  );
}