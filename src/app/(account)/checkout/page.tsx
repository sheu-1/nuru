import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckoutForm } from "./CheckoutForm";

interface CartLineRow {
  quantity: number;
  product: {
    id: string;
    name: string;
    price_kes: number;
  } | null;
}

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirectTo=/checkout");
  }

  // 1. Fetch user's profile for pre-filling name & phone
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  // 2. Fetch cart items
  const { data: cartData } = await supabase
    .from("cart_items")
    .select("quantity, product:products(id, name, price_kes)")
    .eq("user_id", user.id);

  const cartLines = (cartData as unknown as CartLineRow[]) || [];

  if (cartLines.length === 0) {
    redirect("/cart");
  }

  const items = cartLines.map((line) => ({
    name: line.product?.name || "Product",
    quantity: line.quantity,
    unit_price_kes: line.product?.price_kes || 0,
  }));

  const subtotal = items.reduce(
    (acc, curr) => acc + curr.unit_price_kes * curr.quantity,
    0
  );

  return (
    <div className="bg-bg min-h-screen">
      {/* Checkout Header */}
      <header className="max-w-[1280px] mx-auto box-border px-6 md:px-12 py-7 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="font-serif text-[30px] tracking-[-0.01em] text-ink hover:opacity-90"
        >
          nuru
        </Link>
        <Link
          href="/cart"
          className="text-sm text-muted hover:text-ink transition-colors"
        >
          ← Back to cart
        </Link>
      </header>

      <main className="max-w-[1280px] mx-auto box-border px-6 md:px-12 py-4 pb-24 flex flex-col gap-10">
        <h1 className="m-0 font-serif font-normal text-4xl md:text-[56px] tracking-[-0.02em] text-ink">
          Checkout
        </h1>

        <CheckoutForm
          initialName={profile?.full_name || ""}
          initialPhone={profile?.phone || ""}
          items={items}
          subtotal={subtotal}
          delivery={0}
        />
      </main>
    </div>
  );
}
