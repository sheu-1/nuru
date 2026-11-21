import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  slug: string;
  name: string;
  price_kes: number;
  description?: string | null;
  image_url?: string | null;
  tint?: string | null;
  stock?: number;
}

const TINTS: Record<string, { bg: string; shapeBg: string; shapeClass: string }> = {
  sage: {
    bg: "#E7EDE6",
    shapeBg: "#1F5E4A",
    shapeClass: "w-[110px] h-[110px] rounded-full left-[50px] top-[80px]",
  },
  sand: {
    bg: "#EFE9DD",
    shapeBg: "#D9C7A8",
    shapeClass: "w-[90px] h-[130px] rounded-[45px] left-[60px] top-[70px]",
  },
  sky: {
    bg: "#E4E8EF",
    shapeBg: "#6C7A99",
    shapeClass: "w-[130px] h-[100px] rounded-[24px] left-[50px] top-[100px]",
  },
  rose: {
    bg: "#EDE3E0",
    shapeBg: "#B98676",
    shapeClass: "w-[80px] h-[150px] rounded-[40px] left-[64px] top-[60px]",
  },
};

export function ProductCard({
  slug,
  name,
  price_kes,
  description,
  image_url,
  tint = "sage",
  stock,
}: ProductCardProps) {
  const tintConfig = (tint && TINTS[tint]) || TINTS.sage;
  const isOOS = typeof stock === "number" && stock === 0;

  return (
    <Link
      href={`/products/${slug}`}
      className="group flex flex-col gap-3.5 transition-transform hover:-translate-y-1 duration-200"
    >
      <div
        className="h-[300px] rounded-[28px] relative overflow-hidden flex items-center justify-center bg-surface"
        style={{ backgroundColor: tintConfig.bg }}
      >
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className={`object-cover transition-transform group-hover:scale-105 duration-300 ${isOOS ? "opacity-50 grayscale" : ""}`}
          />
        ) : (
          <div
            className={`absolute ${tintConfig.shapeClass} ${isOOS ? "opacity-40" : ""}`}
            style={{ backgroundColor: tintConfig.shapeBg }}
          />
        )}
        {isOOS && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              style={{
                background: "rgba(23,22,15,0.75)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                padding: "6px 16px",
                borderRadius: 20,
                textTransform: "uppercase",
              }}
            >
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-baseline text-[15px] gap-2">
          <span className="font-medium text-ink group-hover:text-brand transition-colors">
            {name}
          </span>
          <span className="text-muted font-medium flex-none">
            KES {price_kes.toLocaleString()}
          </span>
        </div>
        {description && (
          <p className="m-0 text-xs text-muted leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
        <div className="mt-2 pt-1 flex items-center justify-between">
          {isOOS ? (
            <span className="text-xs font-medium text-muted">Currently unavailable</span>
          ) : (
            <span className="text-xs font-semibold text-brand group-hover:underline flex items-center gap-1">
              Proceed to checkout →
            </span>
          )}
          <span
            className={`h-8 px-3.5 rounded-full text-xs font-medium flex items-center border transition-colors ${
              isOOS
                ? "bg-surface text-muted border-line cursor-not-allowed"
                : "bg-surface text-ink border-line group-hover:bg-brand group-hover:text-white"
            }`}
          >
            {isOOS ? "Unavailable" : "Order"}
          </span>
        </div>
      </div>
    </Link>
  );
}
