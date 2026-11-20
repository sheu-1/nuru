import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendOrderNotification } from "@/lib/notifications";

const DELIVERY_KES = 250;
const DEFAULT_USER_PHONE = "0799608845";

/** Normalise phone to international E.164 format with '+' for Paystack (+254XXXXXXXXX) */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return "+" + digits;
  if (digits.startsWith("0") && digits.length === 10) return "+254" + digits.slice(1);
  if (digits.length === 9) return "+254" + digits;
  return "+" + digits;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, address, channel } = await req.json();
    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: "Please provide all delivery details (name, phone, address)." },
        { status: 400 }
      );
    }

    // 1. Fetch user's cart items
    const { data: lines, error: cartError } = await supabase
      .from("cart_items")
      .select("quantity, size, product:products(id, name, price_kes, stock, is_active)")
      .eq("user_id", user.id);

    if (cartError || !lines || lines.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    for (const line of lines as any[]) {
      if (!line.product || !line.product.is_active || line.product.stock < line.quantity) {
        return NextResponse.json(
          { error: `${line.product?.name || "An item"} is unavailable or out of stock.` },
          { status: 409 }
        );
      }
    }

    const subtotal = (lines as any[]).reduce(
      (acc: number, l: any) => acc + l.product.price_kes * l.quantity,
      0
    );
    const total = subtotal + DELIVERY_KES;
    const reference = crypto.randomUUID();

    // 2. Insert pending order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        subtotal_kes: subtotal,
        delivery_kes: DELIVERY_KES,
        total_kes: total,
        ship_name: name,
        ship_phone: phone,
        ship_address: address,
        paystack_reference: reference,
        status: "pending",
      })
      .select("id, order_no")
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message || "Failed to create order" },
        { status: 500 }
      );
    }

    // Insert order items
    const orderItems = (lines as any[]).map((l: any) => ({
      order_id: order.id,
      product_id: l.product.id,
      name: l.product.name,
      unit_price_kes: l.product.price_kes,
      size: l.size,
      quantity: l.quantity,
    }));
    await supabase.from("order_items").insert(orderItems);

    // Notify admin asynchronously
    sendOrderNotification({
      orderId: order.id,
      orderNo: order.order_no,
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      items: orderItems,
      totalKes: total,
      paystackReference: reference,
      channel,
      status: "pending",
    }).catch(console.error);

    const rawKey = process.env.PAYSTACK_SECRET_KEY || "";
    const paystackKey = rawKey.trim().replace(/^["']|["']$/g, "");

    // Dynamically derive siteUrl from request headers so wrong env vars never cause 404
    const originHeader = req.headers.get("origin");
    const hostHeader = req.headers.get("host");
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
    let siteUrl = "";

    if (originHeader && !originHeader.includes("your-project.vercel.app")) {
      siteUrl = originHeader;
    } else if (hostHeader && !hostHeader.includes("your-project.vercel.app")) {
      const proto = req.headers.get("x-forwarded-proto") || (hostHeader.includes("localhost") ? "http" : "https");
      siteUrl = `${proto}://${hostHeader}`;
    } else if (envUrl && !envUrl.includes("your-project.vercel.app")) {
      siteUrl = envUrl;
    } else {
      siteUrl = "https://nuru-weld.vercel.app";
    }

    const callbackUrl = `${siteUrl}/orders/${order.id}/confirmed`;

    if (paystackKey.startsWith("pk_")) {
      return NextResponse.json(
        {
          error:
            "Configuration Error: A Public Key ('pk_...') was set for PAYSTACK_SECRET_KEY. In Vercel Environment Variables, set PAYSTACK_SECRET_KEY to your Secret Key (starts with 'sk_live_' or 'sk_test_').",
        },
        { status: 500 }
      );
    }

    if (paystackKey.includes("REPLACE_WITH_YOUR_LIVE_SECRET_KEY")) {
      return NextResponse.json(
        {
          error:
            "Incomplete Paystack Setup: Please replace the placeholder PAYSTACK_SECRET_KEY in Vercel with your actual Secret Key (e.g. sk_test_17ff0ab99b62dae88fab936ca29c13ddaecc6fd7 or your sk_live_... key).",
        },
        { status: 400 }
      );
    }

    if (!paystackKey || paystackKey.includes("sk_test_xxx") || paystackKey === "your_paystack_secret_key") {
      // Dev fallback only when no key at all
      return NextResponse.json({
        authorization_url: `${callbackUrl}?reference=${reference}&simulated=true`,
        reference,
        order_id: order.id,
        note: "Simulated checkout (PAYSTACK_SECRET_KEY not set)",
      });
    }

    // ── M-Pesa STK Push via Paystack Charge endpoint ──────────────────────────
    if (channel === "mobile_money") {
      const targetPhone = phone || DEFAULT_USER_PHONE;
      let intlPhone = normalisePhone(targetPhone);

      // Attempt charging with user's phone number
      let chargeRes = await fetch("https://api.paystack.co/charge", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: total * 100, // smallest currency unit (cents)
          currency: "KES",
          reference,
          mobile_money: {
            phone: intlPhone,
            provider: "mpesa",
          },
          metadata: {
            order_id: order.id,
            user_id: user.id,
            ship_name: name,
            ship_phone: targetPhone,
          },
        }),
      });

      let chargeJson = await chargeRes.json();

      // If in Paystack Test Mode and Paystack requires the test number for simulation:
      if (
        !chargeJson.status &&
        paystackKey.startsWith("sk_test_") &&
        (chargeJson.message?.includes("test mobile money number") ||
          chargeJson.data?.message?.includes("test mobile money number"))
      ) {
        intlPhone = "+254710000000";
        chargeRes = await fetch("https://api.paystack.co/charge", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            amount: total * 100,
            currency: "KES",
            reference,
            mobile_money: {
              phone: intlPhone,
              provider: "mpesa",
            },
            metadata: {
              order_id: order.id,
              user_id: user.id,
              ship_name: name,
              ship_phone: targetPhone,
            },
          }),
        });
        chargeJson = await chargeRes.json();
      }

      if (!chargeJson.status) {
        const errorMsg =
          chargeJson.message === "Invalid key"
            ? "Paystack rejected your key ('Invalid key'). In Vercel, ensure PAYSTACK_SECRET_KEY is your Secret Key (starts with 'sk_live_' or 'sk_test_'), not the Public Key ('pk_...')."
            : chargeJson.message || "M-Pesa charge initialisation failed.";
        return NextResponse.json({ error: errorMsg }, { status: 502 });
      }

      const chargeStatus: string = chargeJson.data?.status || "";

      // If transaction was immediately approved (test mode simulation or instant STK)
      if (chargeStatus === "success") {
        await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", order.id);

        await supabase.from("payments").insert({
          order_id: order.id,
          reference,
          amount_kes: total,
          channel: "mobile_money",
          status: "success",
          raw: chargeJson,
          paid_at: new Date().toISOString(),
        });

        await supabase.from("cart_items").delete().eq("user_id", user.id);
      }

      return NextResponse.json({
        order_id: order.id,
        reference,
        charge_status: chargeStatus,
        authorization_url: `${callbackUrl}?reference=${reference}&method=mpesa&status=${chargeStatus}`,
        display_text:
          chargeJson.data?.display_text ||
          `Check your phone (${targetPhone}) for the M-Pesa prompt.`,
      });
    }

    // ── Card payment: standard Paystack redirect ───────────────────────────────
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: total * 100,
        currency: "KES",
        reference,
        callback_url: callbackUrl,
        channels: ["card"],
        metadata: {
          order_id: order.id,
          user_id: user.id,
          ship_name: name,
          ship_phone: phone,
        },
      }),
    });

    const paystackJson = await paystackRes.json();
    if (!paystackJson.status) {
      const errorMsg =
        paystackJson.message === "Invalid key"
          ? "Paystack rejected your key ('Invalid key'). In Vercel, ensure PAYSTACK_SECRET_KEY is your Secret Key (starts with 'sk_live_' or 'sk_test_'), not the Public Key ('pk_...')."
          : paystackJson.message || "Paystack initialization error";
      return NextResponse.json(
        { error: errorMsg },
        { status: 502 }
      );
    }

    return NextResponse.json({
      authorization_url: paystackJson.data.authorization_url,
      reference,
      order_id: order.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
