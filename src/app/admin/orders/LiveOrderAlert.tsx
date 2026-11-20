"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface LiveAlert {
  id: string;
  orderNo?: number;
  customerName?: string;
  totalKes: number;
  status: string;
}

export function LiveOrderAlert() {
  const [activeAlert, setActiveAlert] = useState<LiveAlert | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const router = useRouter();

  // Web Audio chime generator (no external mp3 files required)
  function playChime() {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // Audio not permitted without user gesture or unsupported
    }
  }

  useEffect(() => {
    const supabase = createClient();

    // Listen to real-time order events
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as any;
          playChime();
          setActiveAlert({
            id: newOrder.id,
            orderNo: newOrder.order_no,
            customerName: newOrder.ship_name || "New Customer",
            totalKes: newOrder.total_kes,
            status: newOrder.status,
          });
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, soundEnabled]);

  return (
    <>
      {/* Sound toggle button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`h-9 px-3.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
            soundEnabled
              ? "bg-tint-sage border-[#C8D6C6] text-brand"
              : "bg-surface border-line text-muted"
          }`}
          title={soundEnabled ? "Audio chimes enabled" : "Audio chimes muted"}
        >
          {soundEnabled ? "🔔 Live alerts: On" : "🔕 Live alerts: Muted"}
        </button>
      </div>

      {/* Pop-up alert banner */}
      {activeAlert && (
        <div className="fixed top-6 right-6 z-50 max-w-md w-full bg-white border-2 border-brand rounded-2xl p-5 shadow-xl flex items-start justify-between gap-4 animate-bounce">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-tint-sage text-brand flex items-center justify-center flex-none">
              🛍️
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink">
                New Order Received! (#{activeAlert.orderNo || activeAlert.id.slice(0, 6)})
              </span>
              <span className="text-xs text-muted">
                {activeAlert.customerName} · KES {activeAlert.totalKes.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-brand capitalize">
                Status: {activeAlert.status}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            className="text-muted hover:text-ink text-sm p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
