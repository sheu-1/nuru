import { Header } from "@/components/Header";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AddToCartForm } from "./AddToCartForm";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_kes: number;
  stock: number;
  sizes: string[];
  tint?: string | null;
  image_url?: string | null;
  categories?: { name: string; slug: string } | null;
}

const STATIC_PRODUCTS: Record<string, Product> = {
  "smartphone": {
    id: "00000000-0000-0000-0000-000000000005",
    name: "Pro 5G Smartphone",
    slug: "smartphone",
    description:
      "6.7-inch Super AMOLED 120Hz display, triple 8K camera system, flagship processor, 5000mAh battery with 65W fast charging, 256GB storage.",
    price_kes: 10,
    stock: 25,
    sizes: ["128GB", "256GB", "512GB"],
    tint: "sky",
    image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
    categories: { name: "Phone", slug: "phone" },
  },
  "smart-tv": {
    id: "00000000-0000-0000-0000-000000000006",
    name: "55\" 4K Smart OLED TV",
    slug: "smart-tv",
    description:
      "Ultra-slim 4K UHD smart television featuring self-lit OLED pixels, Dolby Vision IQ, Dolby Atmos sound, and hands-free voice assistant.",
    price_kes: 10,
    stock: 12,
    sizes: ["50-inch", "55-inch", "65-inch"],
    tint: "sage",
    image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80",
    categories: { name: "TV", slug: "tv" },
  },
  "bluetooth-speaker": {
    id: "00000000-0000-0000-0000-000000000007",
    name: "Portable Bluetooth Speaker",
    slug: "bluetooth-speaker",
    description:
      "360-degree immersive acoustic bass, IPX7 rugged waterproof exterior, PartyBoost pairing, and up to 20 hours battery life.",
    price_kes: 10,
    stock: 40,
    sizes: ["Standard", "Plus with Strap"],
    tint: "sand",
    image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80",
    categories: { name: "Speaker", slug: "speaker" },
  },
  "wireless-headphones": {
    id: "00000000-0000-0000-0000-000000000008",
    name: "Studio Wireless Headphones",
    slug: "wireless-headphones",
    description:
      "High-precision active noise cancellation, custom acoustic drivers, 30-hour battery life with quick fuel charging, and plush leatherette ear cushions.",
    price_kes: 10,
    stock: 35,
    sizes: ["Midnight Black", "Sand Dune"],
    tint: "rose",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    categories: { name: "Speaker", slug: "speaker" },
  },
  "linen-shirt": {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Linen shirt",
    slug: "linen-shirt",
    description:
      "A breathable everyday shirt in washed linen. Relaxed fit, easy to layer.",
    price_kes: 10,
    stock: 50,
    sizes: ["S", "M", "L", "XL"],
    tint: "sage",
    image_url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80",
    categories: { name: "Wear", slug: "wear" },
  },
  "ceramic-mug": {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Ceramic mug",
    slug: "ceramic-mug",
    description: "Hand-thrown ceramic mug. Holds 300ml. Dishwasher safe.",
    price_kes: 10,
    stock: 100,
    sizes: ["One size"],
    tint: "sand",
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    categories: { name: "Home", slug: "home" },
  },
  "canvas-tote": {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Canvas tote",
    slug: "canvas-tote",
    description: "Heavy-duty canvas tote bag. 15L capacity. Inside zip pocket.",
    price_kes: 10,
    stock: 75,
    sizes: ["One size"],
    tint: "sky",
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    categories: { name: "Bags", slug: "bags" },
  },
  "desk-lamp": {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Desk lamp",
    slug: "desk-lamp",
    description:
      "Minimalist LED desk lamp with 3 colour temperatures. USB-C powered.",
    price_kes: 10,
    stock: 30,
    sizes: ["One size"],
    tint: "rose",
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
    categories: { name: "Home", slug: "home" },
  },
};

const TINTS: Record<string, { bg: string; shapeBg: string; accentBg: string }> = {
  sage: { bg: "#E7EDE6", shapeBg: "#1F5E4A", accentBg: "#D9C7A8" },
  sand: { bg: "#EFE9DD", shapeBg: "#D9C7A8", accentBg: "#1F5E4A" },
  sky: { bg: "#E4E8EF", shapeBg: "#6C7A99", accentBg: "#D9C7A8" },
  rose: { bg: "#EDE3E0", shapeBg: "#B98676", accentBg: "#E7EDE6" },
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: Product | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, description, price_kes, stock, sizes, tint, image_url, categories(name, slug)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (data) {
        product = data as unknown as Product;
      }
    } catch {
      // Database connection fallback
    }
  }

  if (!product && STATIC_PRODUCTS[slug]) {
    product = STATIC_PRODUCTS[slug];
  }

  if (!product) {
    notFound();
  }

  const tintKey = product.tint || "sage";
  const tint = TINTS[tintKey] || TINTS.sage;
  const categoryName = product.categories?.name || "Shop";
  const categorySlug = product.categories?.slug || "all";

  return (
    <div className="bg-bg min-h-screen">
      <Header activePage="shop" />

      <main className="max-w-[1280px] mx-auto box-border px-6 md:px-12 py-4 pb-24 flex flex-col gap-7">
        {/* Breadcrumb */}
        <div className="text-sm text-muted">
          <Link href="/" className="hover:text-ink transition-colors">
            Shop
          </Link>
          {" / "}
          <Link
            href={`/?category=${categorySlug}#new`}
            className="hover:text-ink transition-colors"
          >
            {categoryName}
          </Link>
          {" / "}
          <span className="text-ink">{product.name}</span>
        </div>

        <div className="flex flex-wrap gap-12 lg:gap-16 items-center">
          {/* Product Image / Abstract Artwork */}
          <div
            className="flex-[1_1_420px] relative min-h-[460px] md:min-h-[560px] rounded-hero overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: tint.bg }}
          >
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <>
                <div
                  className="absolute w-[260px] h-[260px] rounded-full left-[22%] top-[24%]"
                  style={{ backgroundColor: tint.shapeBg }}
                />
                <div
                  className="absolute w-[90px] h-[90px] rounded-full right-[12%] top-[10%]"
                  style={{ backgroundColor: tint.accentBg }}
                />
              </>
            )}
          </div>

          {/* Details & Add to Cart */}
          <div className="flex-[1_1_380px] flex flex-col justify-center gap-7">
            <div className="flex flex-col gap-3.5">
              <h1 className="m-0 font-serif font-normal text-5xl md:text-[60px] leading-[1.02] tracking-[-0.02em] text-ink">
                {product.name}
              </h1>
              <span className="text-2xl font-semibold text-ink">
                KES {product.price_kes.toLocaleString()}
              </span>
              {product.description && (
                <p className="m-0 max-w-[440px] text-base leading-relaxed text-muted">
                  {product.description}
                </p>
              )}
            </div>

            <AddToCartForm
              productId={product.id}
              sizes={product.sizes || ["One size"]}
              stock={product.stock}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
