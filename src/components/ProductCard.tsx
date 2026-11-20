import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  slug: string;
  name: string;
  price_kes: number;
  description?: string | null;
  image_url?: string | null;
  tint?: string | null;
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
}: ProductCardProps) {
  const tintConfig = (tint && TINTS[tint]) || TINTS.sage;

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
            className="object-cover transition-transform group-hover:scale-105 duration-300"
          />
        ) : (
          <div
            className={`absolute ${tintConfig.shapeClass}`}
            style={{ backgroundColor: tintConfig.shapeBg }}
          />
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
      </div>
    </Link>
  );
}
