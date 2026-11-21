import { createAdminClient } from "@/lib/supabase/admin";
import { OrderStatusSelector } from "./OrderStatusSelector";
import { LiveOrderAlert } from "./LiveOrderAlert";
import Link from "next/link";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price_kes: number;
  size?: string;
}

interface PaymentRecord {
  channel?: string;
  reference?: string;
  status?: string;
}

interface AdminOrder {
  id: string;
  order_no: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  subtotal_kes: number;
  delivery_kes: number;
  total_kes: number;
  ship_name: string;
  ship_phone: string;
  ship_address: string;
  paystack_reference: string;
  created_at: string;
  order_items: OrderItem[];
  payments: PaymentRecord[];
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: "bg-tint-sage", text: "text-brand", label: "Paid" },
  shipped: { bg: "bg-tint-sky", text: "text-[#2A4A6B]", label: "Shipped" },
  delivered: { bg: "bg-surface", text: "text-[#4A4943]", label: "Delivered" },
  pending: { bg: "bg-surface", text: "text-muted", label: "Pending" },
  cancelled: { bg: "bg-tint-rose", text: "text-[#7A3028]", label: "Cancelled" },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeStatus = resolvedParams?.status || "all";

  let orders: AdminOrder[] = [];
  let fetchError: string | null = null;

  try {
    const admin = createAdminClient();
    let query = admin
      .from("orders")
      .select(`
        id,
        order_no,
        status,
        subtotal_kes,
        delivery_kes,
        total_kes,
        ship_name,
        ship_phone,
        ship_address,
        paystack_reference,
        created_at,
        order_items (
          id,
          name,
          quantity,
          unit_price_kes,
          size
        ),
        payments (
          channel,
          reference,
          status
        )
      `)
      .order("created_at", { ascending: false });

    if (activeStatus !== "all") {
      query = query.eq("status", activeStatus);
    }

    const { data, error } = await query;
    if (error) {
      fetchError = error.message;
    } else if (data) {
      orders = data as unknown as AdminOrder[];
    }
  } catch (err: any) {
    fetchError = err.message || "Failed to load admin orders";
  }

  // Calculate metrics
  const totalRevenue = orders
    .filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "delivered")
    .reduce((acc, curr) => acc + curr.total_kes, 0);

  const pendingShipments = orders.filter((o) => o.status === "paid").length;
  const totalPaidCount = orders.filter((o) => o.status !== "pending" && o.status !== "cancelled").length;

  const STATUS_TABS = [
    { label: "All Orders", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Paid", value: "paid" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <main className="max-w-[1280px] mx-auto px-6 md:px-12 py-8 pb-24 flex flex-col gap-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="m-0 font-serif font-normal text-4xl md:text-[44px] text-ink">
            Order Management
          </h1>
          <p className="m-0 text-sm text-muted mt-1">
            Track customer orders, verify Paystack payments, and manage shipping fulfillment.
          </p>
        </div>
        <LiveOrderAlert />
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-[22px] bg-white border border-[#ECEAE3] flex flex-col gap-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Total Revenue
          </span>
          <span className="text-2xl font-serif text-ink font-semibold">
            KES {totalRevenue.toLocaleString()}
          </span>
          <span className="text-xs text-brand font-medium">From verified payments</span>
        </div>

        <div className="p-6 rounded-[22px] bg-white border border-[#ECEAE3] flex flex-col gap-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Total Orders
          </span>
          <span className="text-2xl font-serif text-ink font-semibold">
            {orders.length}
          </span>
          <span className="text-xs text-muted">All-time placed</span>
        </div>

        <div className="p-6 rounded-[22px] bg-white border border-[#ECEAE3] flex flex-col gap-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Awaiting Shipment
          </span>
          <span className="text-2xl font-serif text-ink font-semibold">
            {pendingShipments}
          </span>
          <span className="text-xs text-brand font-medium">Ready to fulfill</span>
        </div>

        <div className="p-6 rounded-[22px] bg-white border border-[#ECEAE3] flex flex-col gap-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Completed / Paid
          </span>
          <span className="text-2xl font-serif text-ink font-semibold">
            {totalPaidCount}
          </span>
          <span className="text-xs text-muted">Successful checkouts</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#ECEAE3] pb-3">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          const href = tab.value === "all" ? "/admin/orders" : `/admin/orders?status=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              style={isActive ? { background: "#1f5e4a", color: "#ffffff" } : {}}
              className={`h-9 px-4 rounded-full text-xs font-medium flex items-center transition-colors ${
                isActive
                  ? ""
                  : "bg-surface text-ink hover:bg-[#EAE7DC]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {fetchError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          Database note: {fetchError}. Make sure the schema has been executed in the Supabase SQL Editor.
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="p-16 rounded-[28px] bg-white border border-[#ECEAE3] text-center flex flex-col items-center justify-center gap-3">
          <span className="text-3xl">📦</span>
          <h3 className="m-0 text-lg font-medium text-ink">No orders found</h3>
          <p className="m-0 text-sm text-muted">
            {activeStatus === "all"
              ? "When customers place orders, they will appear here in real-time."
              : `There are currently no orders with status "${activeStatus}".`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const badge = STATUS_BADGES[order.status] || STATUS_BADGES.pending;
            const channel = order.payments?.[0]?.channel || "Paystack";
            const dateStr = new Date(order.created_at).toLocaleString("en-KE", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order.id}
                className="p-6 md:p-7 rounded-[28px] bg-white border border-[#ECEAE3] flex flex-col gap-5 hover:border-line transition-colors shadow-sm"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ECEAE3] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-2xl text-ink">
                      Order #{order.order_no}
                    </span>
                    <span
                      className={`h-7 px-3 rounded-full text-xs font-semibold flex items-center capitalize ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>{dateStr}</span>
                    <OrderStatusSelector
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  {/* Customer & Shipping */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted">
                      Customer & Shipping
                    </span>
                    <span className="font-medium text-ink">{order.ship_name || "N/A"}</span>
                    <span className="text-muted">📞 {order.ship_phone || "N/A"}</span>
                    <span className="text-muted">📍 {order.ship_address || "N/A"}</span>
                  </div>

                  {/* Items list */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted">
                      Items Ordered ({(order.order_items || []).length})
                    </span>
                    <ul className="m-0 p-0 list-none flex flex-col gap-1">
                      {(order.order_items || []).map((item) => (
                        <li key={item.id} className="flex justify-between text-ink">
                          <span>
                            {item.name} {item.size && item.size !== "One size" ? `(${item.size})` : ""} × {item.quantity}
                          </span>
                          <span className="text-muted font-medium">
                            KES {(item.unit_price_kes * item.quantity).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Payment Details */}
                  <div className="flex flex-col gap-1.5 md:items-end md:text-right">
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted">
                      Payment Details
                    </span>
                    <span className="text-xl font-semibold text-ink">
                      KES {order.total_kes.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted">
                      Subtotal: KES {order.subtotal_kes.toLocaleString()} + Delivery: KES {order.delivery_kes}
                    </span>
                    <span className="text-xs text-[#4A4943] capitalize">
                      Method: {channel.replace("_", " ")}
                    </span>
                    {order.paystack_reference && (
                      <span className="text-[11px] text-muted font-mono bg-surface px-2 py-0.5 rounded">
                        Ref: {order.paystack_reference.slice(0, 16)}…
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
