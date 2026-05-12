"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "./lib/supabaseClient";

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);

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
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
    boxSizing: "border-box",
  };

  const navLink = {
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    transition: "0.2s ease",
    whiteSpace: "nowrap",
  };

  return (
    <html
      lang="en"
      style={{
        margin: 0,
        padding: 0,
        width: "100%",
        overflowX: "hidden",
        background: "#020617",
      }}
    >
      <head>
        <title>SerVen</title>
        <meta
          name="description"
          content="Restaurant intelligence served daily."
        />
        <meta name="application-name" content="SerVen" />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="icon" type="image/png" href="/icon.png" />
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
        {/* NAVBAR */}
        <header style={navWrap}>
          <div
            style={{
              ...containerStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              paddingTop: "16px",
              paddingBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            {/* LOGO */}
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                color: "white",
                minWidth: "fit-content",
              }}
            >
              <Image
                src="/logo-serven.jpg"
                alt="SerVen logo"
                width={42}
                height={42}
                style={{ objectFit: "contain", flexShrink: 0 }}
              />

              <span
                style={{
                  fontSize: "22px",
                  fontWeight: "900",
                  letterSpacing: "-0.5px",
                  marginLeft: "-6px",
                  whiteSpace: "nowrap",
                }}
              >
                SerVen
              </span>
            </Link>

            {/* NAV LINKS */}
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "22px",
                flexWrap: "wrap",
                minWidth: 0,
              }}
            >
              <Link href="/#features" style={navLink}>
                Features
              </Link>

              <Link href="/#why" style={navLink}>
                Why SerVen
              </Link>

              <Link href="/pricing" style={navLink}>
                Pricing
              </Link>

              <Link href="/profit-reveal" style={navLink}>
                Profit Reveal
              </Link>

              {user ? (
                <Link href="/dashboard" style={navLink}>
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" style={navLink}>
                  Login
                </Link>
              )}
            </nav>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          style={{
            width: "100%",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}