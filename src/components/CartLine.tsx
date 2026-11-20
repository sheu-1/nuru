"use client";

import { useTransition } from "react";
import Image from "next/image";
import { updateCartItem, removeCartItem } from "@/app/(account)/cart/actions";

interface CartLineProps {
  id: string;
  name: string;
  size?: string;
  price_kes: number;
  quantity: number;
  image_url?: string | null;
  tint?: string | null;
}

const TINTS: Record<string, { bg: string; shapeBg: string }> = {
  sage: { bg: "#E7EDE6", shapeBg: "#1F5E4A" },
  sand: { bg: "#EFE9DD", shapeBg: "#D9C7A8" },
  sky: { bg: "#E4E8EF", shapeBg: "#6C7A99" },
  rose: { bg: "#EDE3E0", shapeBg: "#B98676" },
};

export function CartLine({
  id,
  name,
  size,
  price_kes,
  quantity,
  image_url,
  tint = "sage",
}: CartLineProps) {
  const [isPending, startTransition] = useTransition();
  const tintConfig = (tint && TINTS[tint]) || TINTS.sage;

  function handleDecrement() {
    startTransition(async () => {
      if (quantity <= 1) {
        await removeCartItem(id);
      } else {
        await updateCartItem(id, quantity - 1);
      }
    });
  }

  function handleIncrement() {
    startTransition(async () => {
      await updateCartItem(id, quantity + 1);
    });
  }

  return (
    <div
      className={`flex flex-wrap gap-5 items-center transition-opacity ${
        isPending ? "opacity-50 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className="w-28 h-28 rounded-[24px] relative overflow-hidden flex-none flex items-center justify-center"
        style={{ backgroundColor: tintConfig.bg }}
      >
        {image_url ? (
          <Image src={image_url} alt={name} fill className="object-cover" />
        ) : (
          <div
            className="w-11 h-11 rounded-full"
            style={{ backgroundColor: tintConfig.shapeBg }}
          />
        )}
      </div>
      <div className="flex-[1_1_160px] flex flex-col gap-1.5">
        <span className="text-[17px] font-medium text-ink">{name}</span>
        {size && <span className="text-sm text-muted">{size}</span>}
        <span className="text-[15px] font-semibold text-ink">
          KES {price_kes.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleDecrement}
          aria-label="Decrease quantity"
          className="w-11 h-11 rounded-full border border-line bg-transparent text-lg text-ink hover:bg-surface flex items-center justify-center transition-colors cursor-pointer"
        >
          −
        </button>
        <span className="min-w-7 text-center text-[15px] font-medium text-ink">
          {quantity}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          aria-label="Increase quantity"
          className="w-11 h-11 rounded-full border border-line bg-transparent text-lg text-ink hover:bg-surface flex items-center justify-center transition-colors cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}
