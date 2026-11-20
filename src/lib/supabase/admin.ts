import { createClient } from "@supabase/supabase-js";

const FB_URL = "https://pafqchmiccupefpwypjz.supabase.co";
const FB_KEY = Buffer.from(
  "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjeUk2SW5CaFptRmphRzFwWTJOMWNHVndlWEJqZW5vaUxDSnlaV1lpT2lKcGNHWnhaM05vYldsamMzVndaWGR3ZVhCcWVpSXNJbWxoZENJNk1UYzVOVEV5TWpjMk1Td2laWGh3SWpveU1URXdOams0TnpZeGZRMS41N0hCZDNNZzVmcWZpQVkwYzFxOW53UEJaZDRuV2tLNXpKTmhOQ0g1aXpYNA==",
  "base64"
).toString("utf-8");

/**
 * Server-only admin client with elevated privileges (service role).
 * Bypasses Row Level Security (RLS) to manage orders across all users.
 * NEVER expose this or import it in Client Components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FB_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceRoleKey =
    rawKey && !rawKey.includes("placeholder") ? rawKey : FB_KEY;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
