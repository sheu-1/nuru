"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addToCart(productId: string, size: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "REDIRECT_SIGNIN" };
  }

  // Check if item exists in cart already
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("size", size)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("cart_items").insert({
      user_id: user.id,
      product_id: productId,
      size,
      quantity: 1,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}
