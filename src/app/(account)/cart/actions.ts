"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateCartItem(id: string, quantity: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", id).eq("user_id", user.id);
  } else {
    await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}

export async function removeCartItem(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await supabase.from("cart_items").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}
