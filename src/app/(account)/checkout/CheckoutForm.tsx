"use client";

import { useState, useEffect } from "react";
import { Field } from "@/components/Field";

interface CheckoutItem {
  name: string;
  quantity: number;
  unit_price_kes: number;
}

interface CheckoutFormProps {
  initialName: string;
  initialPhone: string;
  items: CheckoutItem[];
  subtotal: number;
  delivery?: number;
}

type PayStep =
  | "idle"
  | "submitting"
  | "mpesa_pending"   // STK push sent, waiting for user to approve on phone
  | "redirecting";   // Redirecting to Paystack card page

export function CheckoutForm({
  initialName,
  initialPhone,
  items,
  subtotal,
  delivery = 0,
}: CheckoutFormProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone || "0799608845");
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<"mobile_money" | "card">("mobile_money");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<PayStep>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [mpesaMsg, setMpesaMsg] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [orderRef, setOrderRef] = useState("");
  const [orderId, setOrderId] = useState("");

  const total = subtotal + delivery;

  // Countdown timer while waiting for M-Pesa approval
  useEffect(() => {
    if (step !== "mpesa_pending") return;
    if (countdown <= 0) {
      setStep("idle");
      setServerError("M-Pesa prompt timed out. Please try again or switch to card payment.");
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [step, countdown]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name || name.trim().length < 2) e.name = "Full name is required";
    if (!phone || phone.replace(/\D/g, "").length < 9) e.phone = "Valid phone number required (e.g. 0712 345 678)";
    if (!address || address.trim().length < 5) e.address = "Delivery address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePay() {
    if (!validate()) return;
    setServerError(null);
    setStep("submitting");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, channel: method }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Payment initialisation failed.");
      }

      setOrderRef(data.reference || "");
      setOrderId(data.order_id || "");

      // M-Pesa STK Push path
      if (method === "mobile_money" && data.charge_status !== undefined) {
        setMpesaMsg(data.display_text || "An M-Pesa prompt has been sent to your phone. Enter your PIN to complete payment.");
        setCountdown(90);
        setStep("mpesa_pending");
        // After confirming STK received, we redirect to the confirmation/polling page
        // The webhook will update the order status
        return;
      }

      // Card or simulated path: redirect to Paystack / confirmation
      if (data.authorization_url) {
        setStep("redirecting");
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment URL received.");
      }
    } catch (err: any) {
      setServerError(err.message || "Something went wrong. Please try again.");
      setStep("idle");
    }
  }

  function goToOrderStatus() {
    if (orderId) {
      window.location.href = `/orders/${orderId}/confirmed?reference=${orderRef}&method=mpesa`;
    }
  }

  // ── M-Pesa pending screen ────────────────────────────────────────────────
  if (step === "mpesa_pending") {
    return (
      <div className="flex flex-col items-center gap-8 py-10 max-w-md mx-auto text-center">
        {/* Animated phone icon */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "#E7F2EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            animation: "mpesa-pulse 1.6s ease-in-out infinite",
          }}
        >
          📱
        </div>
        <style>{`
          @keyframes mpesa-pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(31,94,74,0.25); }
            50%       { transform: scale(1.06); box-shadow: 0 0 0 16px rgba(31,94,74,0); }
          }
        `}</style>

        <div className="flex flex-col gap-3">
          <h2 className="m-0 font-serif font-normal text-3xl text-ink">M-Pesa prompt sent</h2>
          <p className="m-0 text-base leading-relaxed" style={{ color: "#4A4940" }}>
            {mpesaMsg}
          </p>
        </div>

        {/* Countdown ring */}
        <div className="flex flex-col items-center gap-1">
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: "3px solid #E5E2DA",
              borderTopColor: "#1F5E4A",
              animation: "spin 1s linear infinite",
              marginBottom: 4,
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "0.85rem", color: "#4A4940" }}>
            Waiting {countdown}s…
          </span>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={goToOrderStatus}
            className="h-14 rounded-full bg-brand text-white text-base font-medium flex items-center justify-center hover:opacity-90 transition-opacity w-full"
            style={{ background: "#1F5E4A", color: "#fff", border: "none", cursor: "pointer" }}
          >
            I&apos;ve paid — check my order status
          </button>
          <button
            onClick={() => { setStep("idle"); setServerError(null); }}
            style={{
              height: 44,
              borderRadius: 28,
              background: "transparent",
              border: "1px solid #C8C5BB",
              color: "#4A4940",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Cancel / try again
          </button>
        </div>

        <p style={{ fontSize: "0.78rem", color: "#6B6A70", marginTop: -8 }}>
          Your order is saved. If the prompt doesn&apos;t arrive within 90 seconds,
          tap &ldquo;Cancel&rdquo; and try again.
        </p>
      </div>
    );
  }

  // ── Normal checkout form ─────────────────────────────────────────────────
  const isLoading = step === "submitting" || step === "redirecting";

  return (
    <div className="flex flex-wrap gap-12 lg:gap-16 items-start w-full">
      {/* Form */}
      <div className="flex-[2_1_480px] flex flex-col gap-10">

        {/* Delivery details */}
        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-xl font-semibold" style={{ color: "#100F09" }}>Delivery details</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex-[1_1_220px]">
              <Field
                id="fn"
                label="Full name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
            </div>
            <div className="flex-[1_1_220px]">
              <Field
                id="ph"
                label="Phone"
                type="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
              />
            </div>
          </div>
          <Field
            id="ad"
            label="Delivery address"
            type="text"
            placeholder="Street, estate, town — e.g. Westlands, Nairobi"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={errors.address}
          />
        </section>

        {/* Payment method */}
        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-xl font-semibold" style={{ color: "#100F09" }}>Payment method</h2>

          {/* M-Pesa */}
          <button
            type="button"
            onClick={() => setMethod("mobile_money")}
            className={`flex items-center gap-4 p-5 rounded-[22px] bg-white w-full text-left cursor-pointer transition-all ${
              method === "mobile_money"
                ? "border-[1.5px] border-brand shadow-sm"
                : "border border-line hover:border-[#9B9890]"
            }`}
            style={{ border: method === "mobile_money" ? "1.5px solid #1F5E4A" : "1px solid #C8C5BB" }}
          >
            <div
              style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                border: method === "mobile_money" ? "6px solid #1F5E4A" : "1.5px solid #9B9890",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
              <span style={{ fontSize: 28 }}>📱</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "1rem", color: "#100F09" }}>M-Pesa</div>
                <div style={{ fontSize: "0.85rem", color: "#4A4940" }}>
                  Enter your phone above — an STK push will be sent instantly
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
                background: "#E7F2EE", color: "#1F5E4A", padding: "3px 10px",
                borderRadius: 20, flexShrink: 0,
              }}
            >
              RECOMMENDED
            </span>
          </button>

          {/* Card */}
          <button
            type="button"
            onClick={() => setMethod("card")}
            className={`flex items-center gap-4 p-5 rounded-[22px] bg-white w-full text-left cursor-pointer transition-all`}
            style={{ border: method === "card" ? "1.5px solid #1F5E4A" : "1px solid #C8C5BB" }}
          >
            <div
              style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                border: method === "card" ? "6px solid #1F5E4A" : "1.5px solid #9B9890",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
              <span style={{ fontSize: 28 }}>💳</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "1rem", color: "#100F09" }}>Card</div>
                <div style={{ fontSize: "0.85rem", color: "#4A4940" }}>Visa or Mastercard — secure redirect to Paystack</div>
              </div>
            </div>
          </button>
        </section>

        {serverError && (
          <div
            style={{
              padding: "1rem 1.25rem", borderRadius: 14,
              background: "#FEF2F2", border: "1px solid #FCA5A5",
              color: "#B91C1C", fontSize: "0.9rem",
            }}
          >
            ⚠️ {serverError}
          </div>
        )}
      </div>

      {/* Order summary sidebar */}
      <aside
        className="w-full lg:flex-[1_1_340px] rounded-[28px] p-8 flex flex-col gap-5"
        style={{ background: "#EDEAE2" }}
      >
        <h2 className="m-0 font-serif font-normal text-[30px] leading-tight" style={{ color: "#100F09" }}>
          Order summary
        </h2>

        <div className="flex flex-col gap-3" style={{ fontSize: "0.92rem", color: "#4A4940" }}>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span style={{ color: "#100F09", fontWeight: 500 }}>
                KES {(item.unit_price_kes * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center">
            <span>Delivery</span>
            <span>{delivery === 0 ? "FREE (Testing)" : `KES ${delivery.toLocaleString()}`}</span>
          </div>
          <div style={{ height: 1, background: "#C8C5BB", margin: "4px 0" }} />
          <div className="flex justify-between items-center" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#100F09" }}>
            <span>Total</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePay}
          disabled={isLoading}
          style={{
            height: 56, borderRadius: 28, background: isLoading ? "#6B9E8E" : "#1F5E4A",
            color: "#fff", fontSize: "1rem", fontWeight: 600, border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            transition: "background 0.2s",
          }}
        >
          {step === "submitting" && (
            <span style={{ display: "inline-block", width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          )}
          {step === "submitting"
            ? method === "mobile_money" ? "Sending M-Pesa prompt…" : "Redirecting to Paystack…"
            : step === "redirecting"
            ? "Opening payment page…"
            : method === "mobile_money"
            ? `Pay KES ${total.toLocaleString()} via M-Pesa`
            : `Pay KES ${total.toLocaleString()} via Card`}
        </button>

        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#4A4940" }}>
          🔒 Payments secured by Paystack
        </div>
      </aside>
    </div>
  );
}
