import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendOrderNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ success: true, message: "Already paid" });
    }

    // Call fulfil_order RPC or direct update
    const { error: rpcError } = await supabase.rpc("fulfil_order", {
      p_reference: order.paystack_reference || `sim_${order.id}`,
      p_amount_kes: order.total_kes,
      p_currency: "KES",
      p_channel: "mobile_money",
      p_paid_at: new Date().toISOString(),
      p_raw: { simulated: true },
    });

    if (rpcError) {
      // If RPC is restricted or not yet defined, update orders directly
      await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", order.id);

      await supabase.from("payments").insert({
        order_id: order.id,
        reference: order.paystack_reference || `sim_${order.id}`,
        amount_kes: order.total_kes,
        channel: "mobile_money",
        status: "success",
        raw: { simulated: true },
        paid_at: new Date().toISOString(),
      });

      await supabase.from("cart_items").delete().eq("user_id", user.id);
    }

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("name, quantity, unit_price_kes")
      .eq("order_id", order.id);

    sendOrderNotification({
      orderId: order.id,
      orderNo: order.order_no,
      customerName: order.ship_name || "Customer",
      customerPhone: order.ship_phone || "",
      customerAddress: order.ship_address || "",
      items: (orderItems as any[]) || [],
      totalKes: order.total_kes,
      paystackReference: order.paystack_reference,
      channel: "mobile_money",
      status: "paid",
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
