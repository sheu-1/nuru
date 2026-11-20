import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendOrderNotification } from "@/lib/notifications";
import { getPaystackSecretKey } from "@/lib/paystack";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secretKey = getPaystackSecretKey();

    if (secretKey) {
      const hash = crypto
        .createHmac("sha512", secretKey)
        .update(rawBody)
        .digest("hex");

      if (hash !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    if (event.event !== "charge.success") {
      return NextResponse.json({ message: "Ignored event" }, { status: 200 });
    }

    const data = event.data;
    const supabase = await createClient();

    // Call atomic fulfil_order database function
    const { error } = await supabase.rpc("fulfil_order", {
      p_reference: data.reference,
      p_amount_kes: Math.round(data.amount / 100),
      p_currency: data.currency,
      p_channel: data.channel,
      p_paid_at: data.paid_at,
      p_raw: event,
    });

    if (error) {
      // If RPC fails (e.g. not created yet), perform manual update
      const { data: order } = await supabase
        .from("orders")
        .select("id, user_id, total_kes, order_no, ship_name, ship_phone, ship_address, order_items(name, quantity, unit_price_kes)")
        .eq("paystack_reference", data.reference)
        .single();

      if (order) {
        await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", order.id);

        await supabase.from("payments").insert({
          order_id: order.id,
          reference: data.reference,
          amount_kes: Math.round(data.amount / 100),
          channel: data.channel,
          status: "success",
          raw: event,
          paid_at: data.paid_at,
        });

        await supabase.from("cart_items").delete().eq("user_id", order.user_id);

        sendOrderNotification({
          orderId: order.id,
          orderNo: (order as any).order_no,
          customerName: (order as any).ship_name || "Customer",
          customerPhone: (order as any).ship_phone || "",
          customerAddress: (order as any).ship_address || "",
          items: ((order as any).order_items as any[]) || [],
          totalKes: order.total_kes,
          paystackReference: data.reference,
          channel: data.channel,
          status: "paid",
        }).catch(console.error);
      }
    } else {
      // RPC succeeded: fetch order details to send notification
      const { data: order } = await supabase
        .from("orders")
        .select("id, order_no, total_kes, ship_name, ship_phone, ship_address, order_items(name, quantity, unit_price_kes)")
        .eq("paystack_reference", data.reference)
        .maybeSingle();

      if (order) {
        sendOrderNotification({
          orderId: order.id,
          orderNo: order.order_no,
          customerName: order.ship_name || "Customer",
          customerPhone: order.ship_phone || "",
          customerAddress: order.ship_address || "",
          items: ((order.order_items as any[]) || []).map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit_price_kes: i.unit_price_kes,
          })),
          totalKes: order.total_kes,
          paystackReference: data.reference,
          channel: data.channel,
          status: "paid",
        }).catch(console.error);
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
