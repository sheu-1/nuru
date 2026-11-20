"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/Field";
import Link from "next/link";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in");
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start Google sign in");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Field
        id="pw"
        label="Password"
        type="password"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        right={
          <Link
            href="/reset-password"
            className="text-[13px] text-brand font-medium hover:underline"
          >
            Forgot password?
          </Link>
        }
      />

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-4 mt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="h-14 rounded-full bg-brand text-white text-base font-medium flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer shadow-sm w-full"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex items-center gap-3 text-muted text-[13px]">
          <div className="flex-1 h-px bg-[#ECEAE3]" />
          <span>or</span>
          <div className="flex-1 h-px bg-[#ECEAE3]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="h-14 rounded-full border border-line bg-white text-[15px] font-medium text-ink flex items-center justify-center gap-3 hover:bg-surface transition-colors cursor-pointer w-full"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
            />
            <path
              fill="#34A853"
              d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
            />
            <path
              fill="#EA4335"
              d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </form>
  );
}
