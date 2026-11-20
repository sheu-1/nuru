"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ProductInput } from "./actions";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_kes: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  tint: string | null;
  category_id: number | null;
  sizes: string[] | null;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductInput, id?: string) => Promise<{ success: boolean; error?: string }>;
  productToEdit?: ProductItem | null;
  categories: Category[];
}

const TINT_OPTIONS = [
  { value: "sage", label: "Sage Green", color: "#1F5E4A", bg: "#E7EDE6" },
  { value: "sand", label: "Sand Beige", color: "#8E7958", bg: "#EFE9DD" },
  { value: "sky", label: "Sky Blue", color: "#2E4765", bg: "#E4E8EF" },
  { value: "rose", label: "Rose Dust", color: "#7B4638", bg: "#EDE3E0" },
];

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
}: ProductModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [priceKes, setPriceKes] = useState(10);
  const [stock, setStock] = useState(50);
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState<number | "">(2);
  const [tint, setTint] = useState("sage");
  const [imageUrl, setImageUrl] = useState("");
  const [sizesStr, setSizesStr] = useState("One size");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || "");
      setSlug(productToEdit.slug || "");
      setDescription(productToEdit.description || "");
      setPriceKes(productToEdit.price_kes || 0);
      setStock(productToEdit.stock ?? 50);
      setIsActive(productToEdit.is_active ?? true);
      setCategoryId(productToEdit.category_id || (categories[0]?.id ?? ""));
      setTint(productToEdit.tint || "sage");
      setImageUrl(productToEdit.image_url || "");
      setSizesStr((productToEdit.sizes || ["One size"]).join(", "));
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setPriceKes(10);
      setStock(50);
      setIsActive(true);
      setCategoryId(categories.find((c) => c.slug !== "all")?.id || categories[0]?.id || "");
      setTint("sage");
      setImageUrl("");
      setSizesStr("One size");
    }
    setError(null);
  }, [productToEdit, categories, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (priceKes < 0) {
      setError("Price cannot be negative.");
      return;
    }

    setSubmitting(true);

    const sizes = sizesStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const input: ProductInput = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      price_kes: Number(priceKes),
      stock: Number(stock),
      is_active: isActive,
      category_id: categoryId ? Number(categoryId) : null,
      tint,
      image_url: imageUrl.trim() || undefined,
      sizes: sizes.length > 0 ? sizes : ["One size"],
    };

    const res = await onSave(input, productToEdit?.id);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error || "Failed to save product.");
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white w-full max-w-[620px] rounded-[28px] border border-[#ECEAE3] shadow-2xl p-6 sm:p-8 flex flex-col gap-6 my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#ECEAE3] pb-4">
          <div>
            <h2 className="m-0 font-serif text-2xl sm:text-3xl font-normal text-ink">
              {productToEdit ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="m-0 text-xs sm:text-sm text-muted mt-1">
              {productToEdit
                ? `Update details and inventory for ${productToEdit.name}`
                : "Add a new item to your online shop catalogue"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface hover:bg-[#E5E2DA] flex items-center justify-center text-muted hover:text-ink text-lg font-bold border-none cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-tint-rose/50 border border-[#E5D5D0] text-[#7A3028] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Product Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!productToEdit && !slug) {
                  // auto-generate slug hint
                }
              }}
              placeholder="e.g. Wireless Noise-Cancelling Headphones"
              className="h-11 px-4 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:border-brand"
            />
          </div>

          {/* Slug & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                URL Slug (Optional)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-name"
                className="h-11 px-4 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:border-brand font-mono text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                className="h-11 px-3 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:border-brand"
              >
                {categories
                  .filter((c) => c.slug !== "all")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                Price (KES) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={priceKes}
                onChange={(e) => setPriceKes(Number(e.target.value))}
                className="h-11 px-4 rounded-xl border border-line bg-bg text-ink text-sm font-semibold focus:outline-none focus:border-brand"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="h-11 px-4 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Quick Status Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-surface/60 border border-[#ECEAE3]">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={stock > 0}
                onChange={(e) => setStock(e.target.checked ? 50 : 0)}
                className="w-4 h-4 accent-[#1F5E4A] cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-ink">In Stock</span>
                <span className="text-[11px] text-muted">
                  {stock > 0 ? `${stock} units available` : "Marked as Out of Stock"}
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[#1F5E4A] cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-ink">Active in Store</span>
                <span className="text-[11px] text-muted">
                  {isActive ? "Visible on shop front" : "Hidden from catalogue"}
                </span>
              </div>
            </label>
          </div>

          {/* Tint Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider">
              Background Tint
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TINT_OPTIONS.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setTint(t.value)}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-left ${
                    tint === t.value
                      ? "border-ink ring-1 ring-ink font-semibold"
                      : "border-line bg-white hover:bg-surface"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: t.bg }}
                  />
                  <span className="text-xs truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image URL with live preview */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider">
              Image URL
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 h-11 px-4 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:border-brand"
              />
              {imageUrl && (
                <div className="w-11 h-11 rounded-xl border border-line bg-surface relative overflow-hidden shrink-0">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    unoptimized
                    className="object-cover"
                    onError={() => setImageUrl("")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short product overview and materials..."
              className="p-3 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:border-brand resize-none"
            />
          </div>

          {/* Sizes / Options */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider">
              Sizes / Variants (comma-separated)
            </label>
            <input
              type="text"
              value={sizesStr}
              onChange={(e) => setSizesStr(e.target.value)}
              placeholder="e.g. S, M, L, XL or 64GB, 128GB, 256GB"
              className="h-11 px-4 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:border-brand"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEAE3]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-11 px-5 rounded-full border border-line bg-transparent hover:bg-surface text-ink text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-11 px-6 rounded-full bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
              style={{ background: "#1F5E4A" }}
            >
              {submitting ? "Saving…" : productToEdit ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
