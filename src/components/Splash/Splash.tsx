"use client";

import { useEffect, useState } from "react";
import styles from "./Splash.module.css";

const SEEN_KEY = "nuru:splash-seen";
const MIN_MS = 2600; // full animation
const MIN_MS_REDUCED = 800; // reduced-motion users
const FADE_MS = 400; // must match the CSS transition

export default function Splash() {
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");

  useEffect(() => {
    // Already seen: the inline script hid it, so just unmount.
    try {
      if (
        sessionStorage.getItem(SEEN_KEY) ||
        localStorage.getItem(SEEN_KEY)
      ) {
        setPhase("gone");
        return;
      }
    } catch {
      /* storage blocked: fall through and play once per page load */
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimum = new Promise((r) =>
      setTimeout(r, reduced ? MIN_MS_REDUCED : MIN_MS)
    );
    const fonts = document.fonts?.ready ?? Promise.resolve();

    let cancelled = false;
    Promise.all([minimum, fonts]).then(() => {
      if (cancelled) return;
      setPhase("leaving");
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
      setTimeout(() => !cancelled && setPhase("gone"), FADE_MS);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Stop the page behind from scrolling while the splash is up
  useEffect(() => {
    if (phase !== "show") return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      data-splash-overlay="true"
      className={`${styles.splash} ${phase === "leaving" ? styles.leaving : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading nuru</span>
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.art}>
          <div className={styles.disc} />
          <div className={styles.core} />
          <div className={styles.dot}>
            <span className={styles.dotInner} />
          </div>
          <div className={styles.pill} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h1 className={styles.word}>
            <span>n</span>
            <span>u</span>
            <span>r</span>
            <span>u</span>
          </h1>
          <span className={styles.tag}>Things you&apos;ll love</span>
        </div>
        <div className={styles.track}>
          <div className={styles.fill} />
        </div>
      </div>
    </div>
  );
}
