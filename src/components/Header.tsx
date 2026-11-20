import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

interface HeaderProps {
  activePage?: "shop" | "orders" | "cart";
}

export async function Header({ activePage }: HeaderProps) {
  let user = null;
  let cartCount = 0;
  let isAdmin = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;

      if (user) {
        const [cartData, profileData] = await Promise.all([
          supabase.from("cart_items").select("quantity").eq("user_id", user.id),
          supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle(),
        ]);
        cartCount = cartData.data?.reduce((acc, curr) => acc + curr.quantity, 0) ?? 0;
        isAdmin = profileData.data?.is_admin === true;
      }
    } catch {
      // Fallback if supabase connection is not configured yet
    }
  }

  const isCartActive = activePage === "cart";

  return (
    <header className="max-w-[1280px] mx-auto box-border px-6 md:px-12 py-7 flex flex-wrap items-center justify-between gap-4">
      <Link
        href="/"
        className="font-serif text-[30px] tracking-[-0.01em] text-ink hover:opacity-90"
      >
        nuru
      </Link>
      <nav className="flex flex-wrap items-center gap-8 text-[15px] text-[#4A4943]">
        <Link
          href="/"
          className={
            activePage === "shop"
              ? "text-ink font-medium"
              : "hover:text-ink transition-colors"
          }
        >
          Shop
        </Link>
        <Link
          href="/contact"
          className="hover:text-ink transition-colors"
        >
          Contact
        </Link>
        {user ? (
          <>
            <Link
              href="/orders"
              className={
                activePage === "orders"
                  ? "text-ink font-medium"
                  : "hover:text-ink transition-colors"
              }
            >
              Orders
            </Link>
            {isAdmin && (
              <Link
                href="/admin/orders"
                className="text-xs uppercase tracking-wider font-semibold bg-surface hover:bg-[#E7EDE6] text-brand px-2.5 py-1 rounded-full transition-colors"
              >
                Admin
              </Link>
            )}
            <form action="/auth/signout" method="post" className="inline">
              <button
                type="submit"
                className="text-[15px] text-[#4A4943] hover:text-ink transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link href="/sign-in" className="hover:text-ink transition-colors">
            Sign in
          </Link>
        )}
      </nav>
      <Link
        href="/cart"
        className={`h-11 px-5 rounded-full flex items-center gap-2.5 text-sm font-medium transition-colors ${
          isCartActive
            ? "border border-brand text-brand font-semibold"
            : "border border-line text-ink hover:border-brand"
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8h12l-1 12H7L6 8z" />
          <path d="M9 8a3 3 0 016 0" />
        </svg>
        Cart ({cartCount})
      </Link>
    </header>
  );
}
