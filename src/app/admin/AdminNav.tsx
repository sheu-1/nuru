"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav() {
  const pathname = usePathname();

  const isOrders = pathname.startsWith("/admin/orders");
  const isProducts = pathname.startsWith("/admin/products");

  return (
    <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
      <Link
        href="/admin/orders"
        className={`px-3.5 py-1.5 rounded-full transition-colors ${
          isOrders
            ? "bg-ink text-white font-semibold"
            : "text-muted hover:text-ink hover:bg-surface"
        }`}
      >
        Orders
      </Link>
      <Link
        href="/admin/products"
        className={`px-3.5 py-1.5 rounded-full transition-colors ${
          isProducts
            ? "bg-ink text-white font-semibold"
            : "text-muted hover:text-ink hover:bg-surface"
        }`}
      >
        Products
      </Link>
      <div className="w-[1px] h-4 bg-line mx-1" />
      <Link
        href="/"
        className="text-muted hover:text-ink transition-colors flex items-center gap-1 py-1.5 px-2"
      >
        View Shop <span aria-hidden="true">→</span>
      </Link>
    </nav>
  );
}
