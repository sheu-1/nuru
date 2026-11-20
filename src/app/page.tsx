import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ShopFilters } from "@/components/ShopFilters";
import { SplashScreen } from "@/components/SplashScreen";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_kes: number;
  image_url?: string | null;
  tint?: string | null;
  category_slug?: string;
  category_id?: number | null;
  is_active?: boolean;
}

const DEFAULT_CATEGORIES = [
  { name: "All", slug: "all" },
  { name: "Phone", slug: "phone" },
  { name: "TV", slug: "tv" },
  { name: "Speaker", slug: "speaker" },
  { name: "Home", slug: "home" },
  { name: "Wear", slug: "wear" },
  { name: "Bags", slug: "bags" },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Pro 5G Smartphone",
    slug: "smartphone",
    description: "6.7-inch OLED display, triple 8K camera, fast charging, and all-day battery life.",
    price_kes: 48000,
    image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
    tint: "sky",
    category_slug: "phone",
  },
  {
    id: "p2",
    name: "55\" 4K Smart OLED TV",
    slug: "smart-tv",
    description: "Ultra-slim 4K UHD smart television with Dolby Vision, HDR10+, and built-in apps.",
    price_kes: 68000,
    image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80",
    tint: "sage",
    category_slug: "tv",
  },
  {
    id: "p3",
    name: "Portable Bluetooth Speaker",
    slug: "bluetooth-speaker",
    description: "360-degree deep acoustic bass, IPX7 waterproof casing, and 20 hours battery.",
    price_kes: 6500,
    image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80",
    tint: "sand",
    category_slug: "speaker",
  },
  {
    id: "p4",
    name: "Studio Wireless Headphones",
    slug: "wireless-headphones",
    description: "Active noise cancellation with high-fidelity studio acoustics and memory-foam earcups.",
    price_kes: 14500,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    tint: "rose",
    category_slug: "speaker",
  },
  {
    id: "p5",
    name: "Linen shirt",
    slug: "linen-shirt",
    description: "A breathable everyday shirt in washed pure linen. Relaxed fit, easy to layer.",
    price_kes: 3200,
    image_url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80",
    tint: "sage",
    category_slug: "wear",
  },
  {
    id: "p6",
    name: "Ceramic mug",
    slug: "ceramic-mug",
    description: "Hand-thrown artisan ceramic mug with matte glaze. Dishwasher & microwave safe.",
    price_kes: 950,
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    tint: "sand",
    category_slug: "home",
  },
  {
    id: "p7",
    name: "Canvas tote",
    slug: "canvas-tote",
    description: "Heavy-duty organic cotton canvas tote. 15L capacity with inside zip pocket.",
    price_kes: 1800,
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    tint: "sky",
    category_slug: "bags",
  },
  {
    id: "p8",
    name: "Minimalist Desk lamp",
    slug: "desk-lamp",
    description: "Adjustable warm-white LED lamp with touch brightness controls and USB-C power.",
    price_kes: 4500,
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
    tint: "rose",
    category_slug: "home",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const currentCategory = resolvedParams?.category || "all";
  const searchQuery = (resolvedParams?.q || "").trim().toLowerCase();

  let products: Product[] = [];
  let categories = DEFAULT_CATEGORIES;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: dbCategories } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("id");

      if (dbCategories && dbCategories.length > 0) {
        // Merge default and DB categories
        const slugs = new Set(dbCategories.map((c) => c.slug));
        const merged = [
          ...dbCategories,
          ...DEFAULT_CATEGORIES.filter((c) => !slugs.has(c.slug)),
        ];
        categories = merged;
      }

      let query = supabase
        .from("products")
        .select("id, name, slug, description, price_kes, image_url, tint, category_id, is_active, categories(slug)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (currentCategory && currentCategory !== "all") {
        const activeCat = categories.find((c) => c.slug === currentCategory);
        if (activeCat && "id" in activeCat) {
          query = query.eq("category_id", (activeCat as any).id);
        }
      }

      const { data: dbProducts } = await query;
      if (dbProducts && dbProducts.length > 0) {
        products = dbProducts.map((p: any) => ({
          ...p,
          category_slug: p.categories?.slug || "all",
        }));
      }
    } catch {
      // Database not yet seeded; use default products
    }
  }

  // Fallback to rich seed products if DB is empty
  if (products.length === 0) {
    if (currentCategory === "all") {
      products = DEFAULT_PRODUCTS;
    } else {
      products = DEFAULT_PRODUCTS.filter((p) => p.category_slug === currentCategory);
    }
  }

  // Apply search query filter if user typed in search input
  if (searchQuery) {
    products = products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(searchQuery);
      const descMatch = (p.description || "").toLowerCase().includes(searchQuery);
      return nameMatch || descMatch;
    });
  }

  return (
    <div className="bg-bg min-h-screen">
      <SplashScreen />
      <Header activePage="shop" />

      {/* Products & Filters Section */}
      <section
        id="new"
        className="max-w-[1280px] mx-auto box-border px-6 md:px-12 pb-24 flex flex-col gap-8 scroll-mt-6"
      >
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-serif font-normal text-4xl md:text-[44px] tracking-[-0.02em] text-ink">
            Explore Collection
          </h2>
          <p className="m-0 text-sm text-muted">
            Filter by product category or search for gadgets, phones, speakers and apparel.
          </p>
        </div>

        {/* Filter & Search Bar with Pill Category Navigation */}
        <Suspense fallback={<div className="h-12 bg-surface rounded-full animate-pulse" />}>
          <ShopFilters
            categories={categories}
            currentCategory={currentCategory}
            initialSearch={resolvedParams?.q || ""}
            totalResults={products.length}
          />
        </Suspense>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="p-16 rounded-[28px] bg-white border border-[#ECEAE3] text-center flex flex-col items-center justify-center gap-3">
            <span className="text-3xl">🔍</span>
            <h3 className="m-0 text-lg font-medium text-ink">No matching products found</h3>
            <p className="m-0 text-sm text-muted max-w-sm">
              We couldn&apos;t find anything matching &ldquo;{searchQuery}&rdquo;. Try another keyword or browse all categories.
            </p>
            <Link
              href="/#new"
              className="mt-2 h-11 px-6 rounded-full bg-brand text-white text-sm font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              Reset filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7 gap-y-10">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                description={product.description}
                price_kes={product.price_kes}
                image_url={product.image_url}
                tint={product.tint}
              />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
