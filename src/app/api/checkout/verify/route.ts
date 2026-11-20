import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendOrderNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    const orderId = searchParams.get("orderId");

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const rawKey =
      process.env.PAYSTACK_SECRET_KEY ||
      process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY ||
      "";
    const paystackKey = rawKey.trim().replace(/^["']|["']$/g, "");
    if (!paystackKey) {
      return NextResponse.json({ error: "Paystack secret key not configured" }, { status: 500 });
    }

    // Call Paystack verify API
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackKey}`,
        },
        cache: "no-store",
      }
    );

    const verifyJson = await verifyRes.json();

    if (!verifyJson.status) {
      return NextResponse.json({ status: "failed", message: verifyJson.message }, { status: 400 });
    }

    const paystackData = verifyJson.data;

    if (paystackData.status === "success") {
      const supabase = await createClient();

      // Find the order
      const { data: order } = await supabase
        .from("orders")
        .select("id, user_id, order_no, status, total_kes, ship_name, ship_phone, ship_address, order_items(name, quantity, unit_price_kes)")
        .or(`paystack_reference.eq.${reference},id.eq.${orderId || "00000000-0000-0000-0000-000000000000"}`)
        .maybeSingle();

      if (order && order.status !== "paid") {
        // Mark order as paid
        await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", order.id);

        // Record payment
        await supabase.from("payments").insert({
          order_id: order.id,
          reference: reference,
          amount_kes: Math.round(paystackData.amount / 100),
          channel: paystackData.channel || "card",
          status: "success",
          raw: paystackData,
          paid_at: paystackData.paid_at || new Date().toISOString(),
        });

        // Clear cart
        await supabase.from("cart_items").delete().eq("user_id", order.user_id);

        // Notify admin
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
          paystackReference: reference,
          channel: paystackData.channel || "card",
          status: "paid",
        }).catch(console.error);
      }

      return NextResponse.json({
        status: "paid",
        channel: paystackData.channel,
        amount_kes: Math.round(paystackData.amount / 100),
        order_no: order?.order_no,
      });
    }

    return NextResponse.json({
      status: paystackData.status,
      message: paystackData.gateway_response || "Payment pending",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
