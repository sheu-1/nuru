import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseUrl.includes("your-project") &&
    !supabaseUrl.includes("YOUR_SUPABASE")
  );

  if (!isConfigured) return supabaseResponse;

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

    // ── Protected user routes ───────────────────────────────────────────────
    const protectedPaths = ["/cart", "/checkout", "/orders"];
    const isProtected = protectedPaths.some((p) => path === p || path.startsWith(`${p}/`));

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("redirectTo", path);
      return NextResponse.redirect(url);
    }

    // ── Admin-only routes ───────────────────────────────────────────────────
    if (path.startsWith("/admin")) {
      if (!user) {
        // Not logged in → sign in page
        const url = request.nextUrl.clone();
        url.pathname = "/sign-in";
        url.searchParams.set("redirectTo", path);
        return NextResponse.redirect(url);
      }

      // Check is_admin flag on profiles using service role key
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const adminSupabase = createServerClient(supabaseUrl!, serviceKey, {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll() {},
          },
        });

        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.is_admin) {
          // Not an admin → redirect to home with a message
          const url = request.nextUrl.clone();
          url.pathname = "/";
          url.searchParams.set("error", "admin_required");
          return NextResponse.redirect(url);
        }
      }
    }
  } catch {
    // Silently continue if network/auth fails
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
