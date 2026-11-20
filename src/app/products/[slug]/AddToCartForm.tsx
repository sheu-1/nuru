"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart } from "./actions";

interface AddToCartFormProps {
  productId: string;
  sizes: string[];
  stock: number;
}

export function AddToCartForm({ productId, sizes, stock }: AddToCartFormProps) {
  const [selectedSize, setSelectedSize] = useState<string>(
    sizes.length > 0 ? sizes[0] : "One size"
  );
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  function handleAddToCart() {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await addToCart(productId, selectedSize);
      if (res?.error) {
        if (res.error === "REDIRECT_SIGNIN") {
          router.push(`/sign-in?redirectTo=/products/${productId}`);
        } else {
          setErrorMsg(res.error);
        }
      } else {
        router.push("/cart");
      }
    });
  }

  if (stock <= 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted font-medium">Currently out of stock</p>
        <Link
          href="/"
          className="h-14 px-9 rounded-full border border-line text-ink text-base font-medium flex items-center justify-center hover:bg-surface transition-colors w-fit"
        >
          Keep browsing
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {sizes && sizes.length > 0 && sizes[0] !== "One size" && (
        <div className="flex flex-col gap-3">
          <span className="text-[13px] font-medium text-[#4A4943]">Size</span>
          <div className="flex flex-wrap gap-2.5">
            {sizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-14 h-12 px-3 rounded-2xl text-sm transition-colors cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? "bg-ink text-white font-medium"
                      : "border border-line bg-transparent text-ink hover:bg-surface"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {errorMsg && <p className="text-sm text-red-600 m-0">{errorMsg}</p>}

      <div className="flex flex-wrap gap-3 max-w-[440px]">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isPending}
          className="flex-[1_1_200px] h-14 rounded-full bg-brand text-white text-base font-medium flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer shadow-sm"
        >
          {isPending ? "Adding…" : "Add to cart"}
        </button>
        <Link
          href="/"
          className="flex-[1_1_140px] h-14 rounded-full border border-line bg-transparent text-ink text-base font-medium flex items-center justify-center hover:bg-surface transition-colors text-center"
        >
          Keep browsing
        </Link>
      </div>
    </div>
  );
}
