"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface ProductInput {
  name: string;
  slug?: string;
  description?: string;
  price_kes: number;
  stock: number;
  is_active: boolean;
  category_id?: number | null;
  tint?: string;
  image_url?: string;
  sizes?: string[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createProductAction(input: ProductInput) {
  try {
    const admin = createAdminClient();

    let slug = input.slug ? slugify(input.slug) : slugify(input.name);
    if (!slug) slug = `product-${Date.now()}`;

    // Ensure slug uniqueness
    const { data: existing } = await admin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const { data, error } = await admin
      .from("products")
      .insert({
        name: input.name.trim(),
        slug,
        description: (input.description || "").trim(),
        price_kes: Math.max(0, Number(input.price_kes)),
        stock: Math.max(0, Number(input.stock)),
        is_active: Boolean(input.is_active),
        category_id: input.category_id ? Number(input.category_id) : null,
        tint: input.tint || "sage",
        image_url: (input.image_url || "").trim() || null,
        sizes: input.sizes && input.sizes.length > 0 ? input.sizes : ["One size"],
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create product" };
  }
}

export async function updateProductAction(id: string, input: Partial<ProductInput>) {
  try {
    const admin = createAdminClient();

    const updates: Record<string, any> = {};

    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.slug !== undefined) updates.slug = slugify(input.slug);
    if (input.description !== undefined) updates.description = input.description.trim();
    if (input.price_kes !== undefined) updates.price_kes = Math.max(0, Number(input.price_kes));
    if (input.stock !== undefined) updates.stock = Math.max(0, Number(input.stock));
    if (input.is_active !== undefined) updates.is_active = Boolean(input.is_active);
    if (input.category_id !== undefined) updates.category_id = input.category_id ? Number(input.category_id) : null;
    if (input.tint !== undefined) updates.tint = input.tint;
    if (input.image_url !== undefined) updates.image_url = input.image_url.trim() || null;
    if (input.sizes !== undefined) updates.sizes = input.sizes;

    const { error } = await admin
      .from("products")
      .update(updates)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
    if (updates.slug) {
      revalidatePath(`/products/${updates.slug}`);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update product" };
  }
}

export async function toggleStockAction(id: string, currentlyInStock: boolean) {
  try {
    const admin = createAdminClient();
    // If currently in stock, mark out of stock (stock = 0).
    // If out of stock, set stock back to 50.
    const newStock = currentlyInStock ? 0 : 50;

    const { error } = await admin
      .from("products")
      .update({ stock: newStock })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true, newStock };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle stock status" };
  }
}

export async function toggleActiveAction(id: string, currentIsActive: boolean) {
  try {
    const admin = createAdminClient();
    const newActive = !currentIsActive;

    const { error } = await admin
      .from("products")
      .update({ is_active: newActive })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true, newActive };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle product visibility" };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const admin = createAdminClient();

    // 1. Remove from active shopping carts first
    await admin.from("cart_items").delete().eq("product_id", id);

    // 2. Attempt hard deletion
    const { error } = await admin.from("products").delete().eq("id", id);

    if (error) {
      // Postgres code 23503 = foreign key violation (e.g. past orders exist)
      if (error.code === "23503") {
        await admin
          .from("products")
          .update({ is_active: false, stock: 0 })
          .eq("id", id);

        revalidatePath("/admin/products");
        revalidatePath("/");
        return {
          success: true,
          archived: true,
          message: "Product has previous customer order records, so it was archived and hidden from the shop.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete product" };
  }
}
