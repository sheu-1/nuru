import { Header } from "@/components/Header";
import { CartLine } from "@/components/CartLine";
import { SummaryCard } from "@/components/SummaryCard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface CartProduct {
  id: string;
  name: string;
  price_kes: number;
  image_url?: string | null;
  tint?: string | null;
}

interface CartItemRow {
  id: string;
  size: string;
  quantity: number;
  product: CartProduct | null;
}

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirectTo=/cart");
  }

  let cartItems: CartItemRow[] = [];

  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      size,
      quantity,
      product:products (
        id,
        name,
        price_kes,
        image_url,
        tint
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!error && data) {
    cartItems = data as unknown as CartItemRow[];
  }

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product?.price_kes || 0;
    return acc + price * item.quantity;
  }, 0);

  return (
    <div className="bg-bg min-h-screen">
      <Header activePage="cart" />

      <main className="max-w-[1280px] mx-auto box-border px-6 md:px-12 py-4 pb-24 flex flex-col gap-10">
        <h1 className="m-0 font-serif font-normal text-4xl md:text-[56px] tracking-[-0.02em] text-ink">
          Your cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <p className="text-xl text-muted">Your cart is currently empty.</p>
            <Link
              href="/"
              className="h-14 px-9 rounded-full bg-brand text-white text-base font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-12 lg:gap-16 items-start">
            {/* Items list */}
            <div className="flex-[2_1_480px] flex flex-col gap-6">
              {cartItems.map((item, index) => (
                <div key={item.id} className="flex flex-col gap-6">
                  <CartLine
                    id={item.id}
                    name={item.product?.name || "Product"}
                    size={item.size !== "One size" ? `Size ${item.size}` : undefined}
                    price_kes={item.product?.price_kes || 0}
                    quantity={item.quantity}
                    image_url={item.product?.image_url}
                    tint={item.product?.tint}
                  />
                  {index < cartItems.length - 1 && (
                    <div className="h-px bg-line-light" />
                  )}
                </div>
              ))}
            </div>

            {/* Order summary sidebar */}
            <SummaryCard subtotal={subtotal} delivery={250}>
              <Link
                href="/checkout"
                className="h-14 rounded-full bg-brand text-white text-base font-medium flex items-center justify-center hover:opacity-90 transition-opacity text-center shadow-sm"
              >
                Checkout
              </Link>
            </SummaryCard>
          </div>
        )}
      </main>
    </div>
  );
}
