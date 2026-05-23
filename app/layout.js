"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "./lib/supabaseClient";

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user || null);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navWrap = {
    position: "sticky",
    top: 0,
    zIndex: 100,
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
    backdropFilter: "blur(18px)",
    background: "rgba(2,6,23,0.72)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const containerStyle = {
    width: "100%",
    maxWidth: isMobile ? "100%" : "1200px",
    margin: "0 auto",
    padding: isMobile ? "12px 14px" : "0 20px",
    boxSizing: "border-box",
    overflowX: "hidden",
    minWidth: 0,
  };

  const navLink = {
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: isMobile ? "13px" : "14px",
    fontWeight: "600",
    transition: "0.2s ease",
    whiteSpace: "nowrap",
  };

  return (
    <html lang="en">
      <head>
        <title>SerVen AI</title>
        <meta name="description" content="AI profit intelligence for restaurants." />
        <meta name="application-name" content="SerVen AI" />
        <meta name="theme-color" content="#020617" />

        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png?v=3" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=3" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />

        <meta property="og:title" content="SerVen AI" />
        <meta property="og:description" content="AI profit intelligence for restaurants." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://servenai.com" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SerVen AI" />
        <meta name="twitter:description" content="AI profit intelligence for restaurants." />
        <meta name="twitter:image" content="/og-image.png" />
      </head>

      <body
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          overflowX: "hidden",
          minHeight: "100vh",
          background: "#020617",
          color: "white",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <header style={navWrap}>
          <div
            style={{
              ...containerStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: isMobile ? "12px" : "20px",
              paddingTop: isMobile ? "12px" : "16px",
              paddingBottom: isMobile ? "12px" : "16px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                color: "white",
                flexShrink: 0,
              }}
            >
              <Image
                src="/logo-serven.png"
                alt="SerVen AI logo"
                width={42}
                height={42}
                priority
                style={{
                  width: "42px",
                  height: "42px",
                  objectFit: "contain",
                  borderRadius: "10px",
                  display: "block",
                  flexShrink: 0,
                }}
              />

              <span
                style={{
                  fontSize: "22px",
                  fontWeight: "900",
                  letterSpacing: "-0.5px",
                  whiteSpace: "nowrap",
                  lineHeight: "1",
                }}
              >
                SerVen
              </span>
            </Link>

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isMobile ? "flex-start" : "flex-end",
                gap: isMobile ? "14px" : "22px",
                flexWrap: "wrap",
                minWidth: 0,
                width: isMobile ? "100%" : "auto",
              }}
            >
              <Link href="/#features" style={navLink}>Features</Link>
              <Link href="/#why" style={navLink}>Why SerVen</Link>
              <Link href="/pricing" style={navLink}>Pricing</Link>
              <Link href="/profit-reveal" style={navLink}>Profit Reveal</Link>

              {user ? (
                <Link href="/dashboard" style={navLink}>Dashboard</Link>
              ) : (
                <Link href="/login" style={navLink}>Login</Link>
              )}
            </nav>
          </div>
        </header>

       <main
  style={{
    width: "100%",
    minHeight: "calc(100vh - 74px)", // Pushes content down nicely relative to your navbar height
    // overflowX: "hidden" <-- REMOVED: This prevents your tab panels from getting cut off!
  }}
>
  {children}
</main>
      </body>
    </html>
  );
}