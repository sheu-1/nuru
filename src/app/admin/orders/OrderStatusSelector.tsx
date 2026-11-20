"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "./actions";

interface OrderStatusSelectorProps {
  orderId: string;
  currentStatus: string;
}

const STATUS_OPTIONS: Array<"pending" | "paid" | "shipped" | "delivered" | "cancelled"> = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

export function OrderStatusSelector({
  orderId,
  currentStatus,
}: OrderStatusSelectorProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextStatus = e.target.value as any;
    startTransition(async () => {
      await updateOrderStatus(orderId, nextStatus);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`status-${orderId}`} className="text-xs text-muted font-medium">
        Status:
      </label>
      <select
        id={`status-${orderId}`}
        value={currentStatus}
        disabled={isPending}
        onChange={handleChange}
        className={`text-xs font-semibold px-3 py-1.5 rounded-full border border-line bg-white transition-opacity cursor-pointer focus:outline-none focus:border-brand ${
          isPending ? "opacity-50" : "opacity-100"
        }`}
      >
        {STATUS_OPTIONS.map((st) => (
          <option key={st} value={st}>
            {st.charAt(0).toUpperCase() + st.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
