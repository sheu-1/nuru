"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";

interface Category {
  name: string;
  slug: string;
}

interface ShopFiltersProps {
  categories: Category[];
  currentCategory: string;
  initialSearch?: string;
  totalResults: number;
}

export function ShopFilters({
  categories,
  currentCategory,
  initialSearch = "",
  totalResults,
}: ShopFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  function updateQuery(nextQuery: string, nextCat: string = currentCategory) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    if (nextCat && nextCat !== "all") {
      params.set("category", nextCat);
    } else {
      params.delete("category");
    }

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `/?${qs}#new` : "/#new", { scroll: false });
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery(query);
  }

  function handleClear() {
    setQuery("");
    updateQuery("", currentCategory);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Controls: Search Bar and Result Count */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search input field */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateQuery(e.target.value);
            }}
            placeholder="Search phones, TVs, speakers, fashion..."
            className="w-full h-12 pl-11 pr-10 rounded-full border border-line bg-white text-sm text-ink placeholder:text-[#9E9C94] focus:outline-none focus:border-brand shadow-sm transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs w-5 h-5 rounded-full bg-surface flex items-center justify-center cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </form>

        <span className="text-xs text-muted font-medium">
          {isPending ? "Filtering…" : `${totalResults} ${totalResults === 1 ? "product" : "products"} available`}
        </span>
      </div>

      {/* Pill Nav Bar for Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.slug;
          const params = new URLSearchParams(searchParams.toString());
          if (cat.slug === "all") {
            params.delete("category");
          } else {
            params.set("category", cat.slug);
          }
          const href = params.toString() ? `/?${params.toString()}#new` : "/#new";

          return (
            <Link
              key={cat.slug}
              href={href}
              style={
                isActive
                  ? { background: "#100F09", color: "#FFFFFF", fontWeight: 600 }
                  : {}
              }
              className={`h-10 px-5 rounded-full text-sm font-medium flex items-center flex-none transition-all cursor-pointer ${
                isActive
                  ? "shadow-sm"
                  : "border border-line bg-white text-ink hover:bg-surface hover:border-brand"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
