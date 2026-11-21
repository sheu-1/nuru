"use client";

import { useState } from "react";
import {
  createProductAction,
  updateProductAction,
  toggleStockAction,
  toggleActiveAction,
  deleteProductAction,
  ProductInput,
} from "./actions";
import { ProductModal } from "./ProductModal";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price_kes: number;
  stock: number;
  is_active: boolean;
  image_url?: string | null;
  tint?: string | null;
  category_id?: number | null;
  sizes?: string[] | null;
  created_at: string;
  is_featured?: boolean;
}

// Matches ProductItem in ProductModal.tsx (description must be string|null, not undefined)
type ProductItemForModal = {
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
};

interface CategoryRow {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  initialProducts: ProductRow[];
  categories: CategoryRow[];
}

const TINT_COLORS: Record<string, string> = {
  sage: "#e7ede6",
  sand: "#f0ead9",
  sky: "#dce8f0",
  rose: "#f0dce2",
};

function getCategoryName(categories: CategoryRow[], id?: number | null) {
  if (!id) return "—";
  return categories.find((c) => c.id === id)?.name ?? "—";
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 1000,
        padding: "14px 22px",
        borderRadius: 10,
        background: type === "success" ? "#1f5e4a" : "#c0392b",
        color: "#fff",
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        maxWidth: 320,
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
}

export function ProductsClientPage({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function openAdd() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEdit(product: ProductRow) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  async function handleSave(input: ProductInput, id?: string): Promise<{ success: boolean; error?: string }> {
    if (id) {
      const res = await updateProductAction(id, input);
      if (res.success) {
        // updateProductAction doesn't return .data, so patch with our input
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...input } : p))
        );
        showToast("Product updated ✓");
      } else {
        showToast(res.error ?? "Update failed", "error");
      }
      return { success: res.success, error: res.error };
    } else {
      const res = await createProductAction(input);
      if (res.success && "data" in res && res.data) {
        setProducts((prev) => [res.data as ProductRow, ...prev]);
        showToast("Product created ✓");
      } else if (!res.success) {
        showToast(res.error ?? "Create failed", "error");
      }
      return { success: res.success, error: "error" in res ? res.error : undefined };
    }
  }

  async function handleToggleStock(product: ProductRow) {
    setLoadingId(product.id);
    const res = await toggleStockAction(product.id, product.stock > 0);
    if (res.success && "newStock" in res) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: res.newStock! } : p))
      );
    } else if (!res.success) {
      showToast(res.error ?? "Stock update failed", "error");
    }
    setLoadingId(null);
  }

  async function handleToggleActive(product: ProductRow) {
    setLoadingId(product.id + "_active");
    const res = await toggleActiveAction(product.id, product.is_active);
    if (res.success && "newActive" in res) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: res.newActive! } : p
        )
      );
    } else if (!res.success) {
      showToast(res.error ?? "Visibility update failed", "error");
    }
    setLoadingId(null);
  }

  async function handleDelete(id: string) {
    setLoadingId(id + "_delete");
    const res = await deleteProductAction(id);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Product deleted ✓");
    } else {
      showToast(res.error ?? "Delete failed", "error");
    }
    setConfirmDeleteId(null);
    setLoadingId(null);
  }

  const totalCount = products.length;
  const activeCount = products.filter((p) => p.is_active).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#17160f" }}>Products</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b6a63" }}>{totalCount} total</p>
        </div>
        <button
          onClick={openAdd}
          style={{
            background: "#1f5e4a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          + Add Product
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total", value: totalCount, color: "#1f5e4a" },
          { label: "Active", value: activeCount, color: "#2563eb" },
          { label: "Out of Stock", value: outOfStockCount, color: "#dc2626" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#fff",
              border: "1px solid #e8e6df",
              borderRadius: 10,
              padding: "14px 22px",
              minWidth: 110,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#6b6a63", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Products table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e6df",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {products.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#6b6a63" }}>
            No products yet. Click &ldquo;Add Product&rdquo; to get started.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8f7f4", borderBottom: "1px solid #e8e6df" }}>
                  {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#6b6a63",
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product, i) => {
                  const isOOS = product.stock === 0;
                  const tintBg = TINT_COLORS[product.tint ?? ""] ?? "#e8e6df";
                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: i < products.length - 1 ? "1px solid #f0ede7" : "none",
                        background: "transparent",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "#fdfcfa")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                    >
                      {/* Product */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              overflow: "hidden",
                              flexShrink: 0,
                              background: tintBg,
                            }}
                          >
                            {product.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image_url}
                                alt={product.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : null}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#17160f", lineHeight: 1.3 }}>{product.name}</div>
                            <div style={{ color: "#a09e96", fontSize: 11, marginTop: 1 }}>/{product.slug}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "12px 14px", color: "#6b6a63", whiteSpace: "nowrap" }}>
                        {getCategoryName(categories, product.category_id)}
                      </td>

                      {/* Price */}
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#17160f", whiteSpace: "nowrap" }}>
                        KES {product.price_kes.toLocaleString()}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            background: isOOS ? "#fee2e2" : "#dcfce7",
                            color: isOOS ? "#dc2626" : "#15803d",
                          }}
                        >
                          {isOOS ? "Out of Stock" : product.stock}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            background: product.is_active ? "#dbeafe" : "#f3f4f6",
                            color: product.is_active ? "#1d4ed8" : "#6b7280",
                          }}
                        >
                          {product.is_active ? "Active" : "Hidden"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {/* Edit */}
                          <ActionBtn
                            onClick={() => openEdit(product)}
                            color="#fff"
                            border="#374151"
                            bg="#374151"
                          >
                            ✏ Edit
                          </ActionBtn>

                          {/* Toggle stock */}
                          <ActionBtn
                            onClick={() => handleToggleStock(product)}
                            loading={loadingId === product.id}
                            color="#fff"
                            border={isOOS ? "#16a34a" : "#d97706"}
                            bg={isOOS ? "#16a34a" : "#d97706"}
                          >
                            {loadingId === product.id ? "…" : isOOS ? "✓ Restock" : "⊘ OOS"}
                          </ActionBtn>

                          {/* Toggle visibility */}
                          <ActionBtn
                            onClick={() => handleToggleActive(product)}
                            loading={loadingId === product.id + "_active"}
                            color="#fff"
                            border={product.is_active ? "#6b7280" : "#2563eb"}
                            bg={product.is_active ? "#6b7280" : "#2563eb"}
                          >
                            {loadingId === product.id + "_active" ? "…" : product.is_active ? "◉ Hide" : "◎ Show"}
                          </ActionBtn>

                          {/* Delete */}
                          {confirmDeleteId === product.id ? (
                            <>
                              <ActionBtn
                                onClick={() => handleDelete(product.id)}
                                loading={loadingId === product.id + "_delete"}
                                color="#fff"
                                border="#dc2626"
                                bg="#dc2626"
                              >
                                {loadingId === product.id + "_delete" ? "…" : "⚠ Confirm"}
                              </ActionBtn>
                              <ActionBtn
                                onClick={() => setConfirmDeleteId(null)}
                                color="#374151"
                                border="#d1d5db"
                                bg="#f3f4f6"
                              >
                                Cancel
                              </ActionBtn>
                            </>
                          ) : (
                            <ActionBtn
                              onClick={() => setConfirmDeleteId(product.id)}
                              color="#fff"
                              border="#dc2626"
                              bg="#dc2626"
                            >
                              🗑 Delete
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <ProductModal
        isOpen={modalOpen}
        productToEdit={
          editingProduct
            ? {
                ...editingProduct,
                description: editingProduct.description ?? null,
                image_url: editingProduct.image_url ?? null,
                tint: editingProduct.tint ?? null,
                category_id: editingProduct.category_id ?? null,
                sizes: editingProduct.sizes ?? null,
              }
            : null
        }
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  color,
  border,
  bg,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  color: string;
  border: string;
  bg: string;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "5px 11px",
        borderRadius: 6,
        border: `1px solid ${border}`,
        background: bg,
        color: color,
        fontSize: 12,
        fontWeight: 600,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.6 : 1,
        whiteSpace: "nowrap",
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </button>
  );
}
