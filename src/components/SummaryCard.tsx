import React from "react";

interface OrderLineItem {
  name: string;
  quantity: number;
  unit_price_kes: number;
}

interface SummaryCardProps {
  subtotal: number;
  delivery?: number;
  items?: OrderLineItem[];
  children?: React.ReactNode;
}

export function SummaryCard({
  subtotal,
  delivery = 250,
  items,
  children,
}: SummaryCardProps) {
  const total = subtotal + delivery;

  return (
    <aside className="w-full lg:w-[360px] lg:flex-[1_1_340px] box-border rounded-[28px] bg-surface p-8 flex flex-col gap-5">
      <h2 className="m-0 font-serif font-normal text-[30px] leading-tight text-ink">
        Order summary
      </h2>
      <div className="flex flex-col gap-3 text-[15px] text-muted">
        {items && items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>KES {(item.unit_price_kes * item.quantity).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between items-center">
            <span>Subtotal</span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span>Delivery</span>
          <span>KES {delivery.toLocaleString()}</span>
        </div>
        <div className="h-px bg-line my-1" />
        <div className="flex justify-between items-center text-ink text-lg font-semibold">
          <span>Total</span>
          <span>KES {total.toLocaleString()}</span>
        </div>
      </div>
      {children}
    </aside>
  );
}
