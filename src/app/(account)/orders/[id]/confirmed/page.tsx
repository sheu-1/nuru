import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ConfirmedPoller } from "./ConfirmedPoller";
import { getPaystackSecretKey } from "@/lib/paystack";

interface OrderDetail {
  id: string;
  order_no: number;
  status: string;
  total_kes: number;
  payments: Array<{
    channel: string;
  }>;
}

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ reference?: string; simulated?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isSimulated = resolvedSearchParams.simulated === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  let order: OrderDetail | null = null;

  const { data } = await supabase
    .from("orders")
    .select(`
      id,
      order_no,
      status,
      total_kes,
      payments (
        channel
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) {
    order = data as unknown as OrderDetail;
  }

  // If redirected from Paystack with a reference and order is still pending, verify immediately
  const reference = resolvedSearchParams.reference;
  const paystackKey = getPaystackSecretKey();

  if (reference && paystackKey && (!order || order.status === "pending")) {
    try {
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${paystackKey}`,
          },
          cache: "no-store",
        }
      );
      const verifyJson = await verifyRes.json();

      if (verifyJson.status && verifyJson.data?.status === "success") {
        await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", id);

        await supabase.from("payments").insert({
          order_id: id,
          reference,
          amount_kes: Math.round(verifyJson.data.amount / 100),
          channel: verifyJson.data.channel || "card",
          status: "success",
          raw: verifyJson.data,
          paid_at: verifyJson.data.paid_at || new Date().toISOString(),
        });

        await supabase.from("cart_items").delete().eq("user_id", user.id);

        if (order) {
          order.status = "paid";
          order.payments = [{ channel: verifyJson.data.channel || "card" }];
        }
      }
    } catch (e) {
      console.error("Paystack server-side verify error:", e);
    }
  }

  const isPending = !order || order.status === "pending";
  const channel = order?.payments?.[0]?.channel || "mobile_money";
  const paymentMethod = channel === "mobile_money" ? "M-Pesa" : channel.toUpperCase();

  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <header className="max-w-[1280px] mx-auto box-border px-6 md:px-12 py-7 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-[30px] tracking-[-0.01em] text-ink hover:opacity-90"
        >
          nuru
        </Link>
        <Link
          href="/orders"
          className="text-sm text-[#4A4943] hover:text-ink transition-colors"
        >
          My orders
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-[560px] mx-auto box-border px-6 py-12 pb-24 flex flex-col items-center gap-9 text-center">
        {isPending ? (
          <ConfirmedPoller
            orderId={id}
            initialOrderNo={order?.order_no}
            initialTotal={order?.total_kes}
            isSimulated={isSimulated}
          />
        ) : (
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

            <div className="flex flex-col gap-3.5">
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
                <span className="font-medium text-ink">#{order?.order_no ?? "..."}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Paid</span>
                <span className="font-medium text-ink">
                  KES {order ? order.total_kes.toLocaleString() : "..."}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Method</span>
                <span className="font-medium text-ink">{paymentMethod}</span>
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
        )}
      </main>
    </div>
  );
}
