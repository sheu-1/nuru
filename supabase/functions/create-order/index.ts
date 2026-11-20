import { createClient } from "npm:@supabase/supabase-js@2";

const DELIVERY_KES = 250; // standard delivery

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { name, phone, address, channel } = await req.json();
  if (!name || !phone || !address) {
    return new Response(JSON.stringify({ error: "Missing delivery details" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // 1. Fetch user's cart with prices from the database
  const { data: lines } = await admin
    .from("cart_items")
    .select("quantity, size, product:products(id, name, price_kes, stock, is_active)")
    .eq("user_id", user.id);

  if (!lines?.length) {
    return new Response(JSON.stringify({ error: "Cart is empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  for (const l of lines as any[]) {
    if (!l.product?.is_active || l.product?.stock < l.quantity) {
      return new Response(
        JSON.stringify({ error: `${l.product?.name || "Product"} is unavailable` }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const subtotal = (lines as any[]).reduce(
    (s, l) => s + l.product.price_kes * l.quantity,
    0
  );
  const total = subtotal + DELIVERY_KES;

  // 2. Create the pending order and its items
  const reference = crypto.randomUUID();
  const { data: order, error } = await admin
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
    .select("id")
    .single();

  if (error || !order) {
    return new Response(JSON.stringify({ error: error?.message || "Order creation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  await admin.from("order_items").insert(
    (lines as any[]).map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      name: l.product.name,
      unit_price_kes: l.product.price_kes,
      size: l.size,
      quantity: l.quantity,
    }))
  );

  // 3. Initialise the Paystack transaction
  const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:3000";
  const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: total * 100, // Paystack amount is in KES cents
      currency: "KES",
      reference,
      callback_url: `${siteUrl}/orders/${order.id}/confirmed`,
      channels: channel === "card" ? ["card"] : ["mobile_money", "card"],
      metadata: { order_id: order.id },
    }),
  });

  const json = await res.json();
  if (!json.status) {
    return new Response(
      JSON.stringify({ error: json.message || "Paystack error" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ authorization_url: json.data.authorization_url, reference, order_id: order.id }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
