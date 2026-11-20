"use client";

import { useEffect, useState } from "react";

const SPLASH_KEY = "nuru_splash_seen";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only show on the very first visit across all sessions (persisted in localStorage)
    try {
      const seen = localStorage.getItem(SPLASH_KEY);
      if (!seen) {
        setVisible(true);
      }
    } catch {
      // In case localStorage is restricted
    }
  }, []);

  function dismiss() {
    setExiting(true);
    try {
      localStorage.setItem(SPLASH_KEY, "true");
    } catch {
      // Ignore
    }
    setTimeout(() => {
      setVisible(false);
    }, 450);
  }

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes splash-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes splash-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes splash-card-enter {
          from { transform: scale(0.96) translateY(12px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        .splash-overlay {
          animation: splash-fade-in 0.35s ease-out both;
        }
        .splash-overlay.exiting {
          animation: splash-fade-out 0.4s ease-in both;
          pointer-events: none;
        }
        .splash-card {
          animation: splash-card-enter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      <div
        className={`splash-overlay${exiting ? " exiting" : ""}`}
        onClick={dismiss}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(15, 58, 44, 0.98)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          backdropFilter: "blur(8px)",
          cursor: "pointer",
        }}
      >
        <div
          className="splash-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "380px",
            width: "100%",
            padding: "2.75rem 2rem",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "24px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.28)",
            gap: "1.25rem",
            cursor: "default",
          }}
        >
          {/* Minimal Brand Mark */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "20px",
            }}
          >
            ✦
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "2.5rem",
                fontWeight: 400,
                color: "#FFFFFF",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              nuru
            </span>
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                color: "rgba(255, 255, 255, 0.72)",
                lineHeight: 1.5,
              }}
            >
              Curated living &amp; essentials, delivered across Kenya.
            </p>
          </div>

          <button
            onClick={dismiss}
            style={{
              marginTop: "0.5rem",
              width: "100%",
              maxWidth: "220px",
              height: "46px",
              borderRadius: "23px",
              background: "#FFFFFF",
              color: "#0F3A2C",
              fontSize: "0.95rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "transform 0.15s ease, opacity 0.15s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.92")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <span>Enter store</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </>
  );
}
