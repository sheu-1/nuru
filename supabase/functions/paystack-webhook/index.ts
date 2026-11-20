import { createClient } from "npm:@supabase/supabase-js@2";

const enc = new TextEncoder();

async function hmacSha512Hex(key: string, data: string) {
  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(data));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  const raw = await req.text(); // must be the exact raw body
  const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;
  const expected = await hmacSha512Hex(secretKey, raw);
  const signature = req.headers.get("x-paystack-signature");

  if (expected !== signature) {
    return new Response("Bad signature", { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.event !== "charge.success") {
    return new Response("ignored", { status: 200 });
  }

  const d = event.data;
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await admin.rpc("fulfil_order", {
    p_reference: d.reference,
    p_amount_kes: Math.round(d.amount / 100),
    p_currency: d.currency,
    p_channel: d.channel,
    p_paid_at: d.paid_at,
    p_raw: event,
  });

  if (error) {
    return new Response(error.message, { status: 500 }); // Paystack will retry
  }

  return new Response("ok", { status: 200 });
});
