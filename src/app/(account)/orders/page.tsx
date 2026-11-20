import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  name: string;
  quantity: number;
  unit_price_kes: number;
}

interface OrderRecord {
  id: string;
  order_no: number;
  status: string;
  total_kes: number;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: "bg-tint-sage", text: "text-brand", label: "Paid" },
  shipped: { bg: "bg-tint-sky", text: "text-[#2A4A6B]", label: "Shipped" },
  delivered: { bg: "bg-surface", text: "text-[#4A4943]", label: "Delivered" },
  pending: { bg: "bg-surface", text: "text-muted", label: "Pending" },
  cancelled: { bg: "bg-tint-rose", text: "text-[#7A3028]", label: "Cancelled" },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirectTo=/orders");
  }

  let orders: OrderRecord[] = [];

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_no,
      status,
      total_kes,
      created_at,
      order_items (
        name,
        quantity,
        unit_price_kes
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!error && data) {
    orders = data as unknown as OrderRecord[];
  }

  return (
    <div className="bg-bg min-h-screen">
      <Header activePage="orders" />

      <main className="max-w-[1280px] mx-auto box-border px-6 md:px-12 py-4 pb-24 flex flex-col gap-10">
        <h1 className="m-0 font-serif font-normal text-4xl md:text-[56px] tracking-[-0.02em] text-ink">
          Your orders
        </h1>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <p className="text-xl text-muted">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/"
              className="h-14 px-9 rounded-full bg-brand text-white text-base font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {orders.map((order) => {
              const badge = STATUS_BADGES[order.status] || STATUS_BADGES.pending;
              const dateStr = new Date(order.created_at).toLocaleDateString("en-KE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              const itemsSummary = (order.order_items || [])
                .map((i) => `${i.name}${i.quantity > 1 ? ` × ${i.quantity}` : ""}`)
                .join(", ");

              return (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center gap-6 p-6 md:p-7 rounded-[28px] bg-white border border-[#ECEAE3]"
                >
                  {/* Thumbnails */}
                  <div className="flex gap-2 flex-none">
                    <div className="w-[72px] h-[72px] rounded-[18px] bg-tint-sage" />
                    {order.order_items && order.order_items.length > 1 && (
                      <div className="w-[72px] h-[72px] rounded-[18px] bg-tint-sand" />
                    )}
                  </div>

                  {/* Order info */}
                  <div className="flex-[1_1_220px] flex flex-col gap-1.5">
                    <span className="text-[17px] font-medium text-ink">
                      Order #{order.order_no}
                    </span>
                    <span className="text-sm text-muted">
                      {itemsSummary ? `${itemsSummary} · ` : ""}
                      {dateStr}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`h-8 px-3.5 rounded-2xl text-[13px] font-semibold flex items-center ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>

                  {/* Total */}
                  <span className="text-[17px] font-semibold text-ink min-w-[110px] text-right">
                    KES {order.total_kes.toLocaleString()}
                  </span>

                  {/* View action */}
                  <Link
                    href={`/orders/${order.id}/confirmed`}
                    className="h-11 px-[22px] rounded-full border border-line text-sm font-medium text-ink hover:bg-surface flex items-center justify-center transition-colors"
                  >
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
