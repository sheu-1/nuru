"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SPLASH_KEY = "nuru_splash_seen";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only show on first visit
    if (!sessionStorage.getItem(SPLASH_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setExiting(true);
    setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      setVisible(false);
    }, 600);
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
        @keyframes float-up {
          0%   { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50%  { transform: translateY(-24px) rotate(6deg); opacity: 1; }
          100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
        }
        @keyframes float-down {
          0%   { transform: translateY(0px) rotate(0deg); opacity: 0.5; }
          50%  { transform: translateY(18px) rotate(-8deg); opacity: 0.9; }
          100% { transform: translateY(0px) rotate(0deg); opacity: 0.5; }
        }
        @keyframes drift-left {
          0%   { transform: translateX(0px) scale(1); }
          50%  { transform: translateX(-16px) scale(1.06); }
          100% { transform: translateX(0px) scale(1); }
        }
        @keyframes drift-right {
          0%   { transform: translateX(0px) scale(1); }
          50%  { transform: translateX(14px) scale(0.95); }
          100% { transform: translateX(0px) scale(1); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.6; }
          50%  { transform: scale(1.08); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hero-slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes hero-slide-up-delay {
          0%,40%  { transform: translateY(40px); opacity: 0; }
          100%    { transform: translateY(0); opacity: 1; }
        }
        @keyframes hero-slide-up-delay2 {
          0%,65%  { transform: translateY(40px); opacity: 0; }
          100%    { transform: translateY(0); opacity: 1; }
        }

        .splash-overlay {
          animation: splash-fade-in 0.5s ease both;
        }
        .splash-overlay.exiting {
          animation: splash-fade-out 0.6s ease both;
        }
        .splash-title {
          animation: hero-slide-up 0.7s 0.2s cubic-bezier(.22,.68,0,1.2) both;
        }
        .splash-sub {
          animation: hero-slide-up-delay 0.9s 0s cubic-bezier(.22,.68,0,1.2) both;
        }
        .splash-cta {
          animation: hero-slide-up-delay2 1.0s 0s cubic-bezier(.22,.68,0,1.2) both;
        }

        .s-float-1 { animation: float-up  5.4s ease-in-out infinite; }
        .s-float-2 { animation: float-down 6.2s 1.1s ease-in-out infinite; }
        .s-float-3 { animation: drift-left 7.0s 0.6s ease-in-out infinite; }
        .s-float-4 { animation: drift-right 4.8s 0.3s ease-in-out infinite; }
        .s-float-5 { animation: float-up  8.0s 2.0s ease-in-out infinite; }
        .s-float-6 { animation: pulse-ring 4.0s 0.8s ease-in-out infinite; }
        .s-spin    { animation: spin-slow  18s linear infinite; }
      `}</style>

      <div
        className={`splash-overlay${exiting ? " exiting" : ""}`}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#0F3A2C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* ── Animated Background Shapes ── */}

        {/* Large pulsing ring */}
        <div
          className="s-float-6"
          style={{
            position: "absolute",
            width: 480,
            height: 480,
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.08)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="s-spin"
          style={{
            position: "absolute",
            width: 640,
            height: 640,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.04)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        />

        {/* Top-left blob */}
        <div
          className="s-float-1"
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(167,208,181,0.14)",
            top: "-60px",
            left: "-60px",
            pointerEvents: "none",
          }}
        />

        {/* Bottom-right blob */}
        <div
          className="s-float-2"
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(167,208,181,0.1)",
            bottom: "-80px",
            right: "-80px",
            pointerEvents: "none",
          }}
        />

        {/* Mid-left pill */}
        <div
          className="s-float-3"
          style={{
            position: "absolute",
            width: 90,
            height: 180,
            borderRadius: "45px",
            background: "rgba(255,255,255,0.06)",
            left: "8%",
            top: "30%",
            pointerEvents: "none",
          }}
        />

        {/* Top-right square */}
        <div
          className="s-float-4"
          style={{
            position: "absolute",
            width: 70,
            height: 70,
            borderRadius: "18px",
            background: "rgba(255,255,255,0.07)",
            right: "12%",
            top: "16%",
            pointerEvents: "none",
          }}
        />

        {/* Bottom-left circle */}
        <div
          className="s-float-5"
          style={{
            position: "absolute",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(167,208,181,0.2)",
            left: "22%",
            bottom: "20%",
            pointerEvents: "none",
          }}
        />

        {/* Small dot cluster top-right */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="s-float-1"
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              right: `${18 + i * 14}%`,
              bottom: `${28 + i * 7}%`,
              animationDelay: `${i * 0.5}s`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* ── Content ── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "2rem",
            padding: "2rem",
            maxWidth: "560px",
          }}
        >
          {/* Logo mark */}
          <div
            className="splash-title"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "24px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
              }}
            >
              <span style={{ fontSize: 32, lineHeight: 1 }}>✦</span>
            </div>
            <span
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 48,
                fontWeight: 400,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              nuru
            </span>
          </div>

          {/* Tagline */}
          <div className="splash-sub" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
                fontWeight: 400,
                color: "#FFFFFF",
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
              }}
            >
              Things you&apos;ll love,
              <br />
              delivered to your door.
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "1rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.65)",
                maxWidth: "400px",
              }}
            >
              Electronics, phones, TVs &amp; home essentials.
              <br />
              Pay with M-Pesa or card. Fast delivery across Kenya.
            </p>
          </div>

          {/* CTAs */}
          <div
            className="splash-cta"
            style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}
          >
            <button
              onClick={dismiss}
              style={{
                height: 56,
                padding: "0 2.25rem",
                borderRadius: 28,
                background: "#FFFFFF",
                color: "#0F3A2C",
                fontSize: "1rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>Start shopping</span>
              <span style={{ fontSize: "1.1rem" }}>→</span>
            </button>
            <Link
              href="/contact"
              onClick={dismiss}
              style={{
                height: 56,
                padding: "0 2.25rem",
                borderRadius: 28,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#FFFFFF",
                fontSize: "1rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                backdropFilter: "blur(4px)",
              }}
            >
              Contact support
            </Link>
          </div>

          {/* Badge row */}
          <div
            className="splash-cta"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
              justifyContent: "center",
              marginTop: "-0.5rem",
            }}
          >
            {["📱 M-Pesa payments", "🚚 Kenya-wide delivery", "🔒 Secure checkout"].map((badge) => (
              <span
                key={badge}
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 20,
                  padding: "0.3rem 0.9rem",
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
