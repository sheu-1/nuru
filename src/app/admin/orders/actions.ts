"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(
  orderId: string,
  newStatus: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
) {
  try {
    const admin = createAdminClient();

    const { error } = await admin
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/admin/orders");
    revalidatePath("/orders");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update status" };
  }
}
