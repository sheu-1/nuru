"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ConfirmedPollerProps {
  orderId: string;
  initialOrderNo?: number;
  initialTotal?: number;
  isSimulated?: boolean;
}

export function ConfirmedPoller({
  orderId,
  initialOrderNo,
  initialTotal,
  isSimulated,
}: ConfirmedPollerProps) {
  const [status, setStatus] = useState<string>("pending");
  const [orderNo, setOrderNo] = useState<number | undefined>(initialOrderNo);
  const [total, setTotal] = useState<number | undefined>(initialTotal);
  const [method, setMethod] = useState<string>("M-Pesa");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // If simulated checkout in development, automatically fulfill after 2 seconds
    if (isSimulated) {
      const timer = setTimeout(async () => {
        try {
          await fetch("/api/checkout/simulate-fulfill", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
          setStatus("paid");
          router.refresh();
        } catch {
          // Ignore
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Normal flow: poll every 2 seconds
    let isSubscribed = true;

    async function checkStatus() {
      const { data } = await supabase
        .from("orders")
        .select(`
          status,
          order_no,
          total_kes,
          payments (
            channel
          )
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (data && isSubscribed) {
        setStatus(data.status);
        if (data.order_no) setOrderNo(data.order_no);
        if (data.total_kes) setTotal(data.total_kes);
        const payments = (data as any).payments;
        if (payments && payments.length > 0 && payments[0].channel) {
          const ch = payments[0].channel;
          setMethod(ch === "mobile_money" ? "M-Pesa" : ch.toUpperCase());
        }

        if (data.status === "paid") {
          router.refresh();
        }
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [orderId, isSimulated, router]);

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="w-16 h-16 rounded-full border-4 border-brand border-t-transparent animate-spin" />
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-serif text-ink m-0">Confirming your payment…</h2>
          <p className="text-muted text-sm max-w-sm m-0">
            Waiting for confirmation from Paystack. This usually takes just a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-[120px] h-[120px] rounded-full bg-tint-sage flex items-center justify-center">
        <div className="w-[72px] h-[72px] rounded-full bg-brand flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 text-center">
        <h1 className="m-0 font-serif font-normal text-4xl md:text-[56px] leading-[1.02] tracking-[-0.02em] text-ink">
          Thank you, your order is in
        </h1>
        <p className="m-0 text-[17px] leading-relaxed text-muted">
          Payment received. We&apos;ll email you as soon as it ships.
        </p>
      </div>

      <div className="w-full box-border rounded-3xl bg-surface p-6 md:p-7 flex flex-col gap-3.5 text-[15px] text-left">
        <div className="flex justify-between items-center">
          <span className="text-muted">Order</span>
          <span className="font-medium text-ink">#{orderNo || "..."}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted">Paid</span>
          <span className="font-medium text-ink">
            KES {total ? total.toLocaleString() : "..."}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted">Method</span>
          <span className="font-medium text-ink">{method}</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 w-full">
        <Link
          href="/orders"
          className="h-14 px-10 rounded-full bg-brand text-white text-base font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          View order
        </Link>
        <Link
          href="/"
          className="h-14 px-10 rounded-full border border-line bg-transparent text-ink text-base font-medium flex items-center justify-center hover:bg-surface transition-colors"
        >
          Keep shopping
        </Link>
      </div>
    </>
  );
}
