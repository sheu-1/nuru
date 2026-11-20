"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/Field";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send reset link");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between p-6 md:p-12">
      <Link
        href="/"
        className="font-serif text-[30px] tracking-[-0.01em] text-ink hover:opacity-90 w-fit"
      >
        nuru
      </Link>

      <div className="w-full max-w-[400px] mx-auto flex flex-col gap-8 my-auto">
        <div className="flex flex-col gap-2.5">
          <h1 className="m-0 font-serif font-normal text-4xl md:text-[44px] tracking-[-0.02em] text-ink">
            Reset password
          </h1>
          <p className="m-0 text-base leading-relaxed text-muted">
            We&apos;ll send a password recovery link to your email.
          </p>
        </div>

        {isSent ? (
          <div className="flex flex-col gap-5 p-6 rounded-3xl bg-surface border border-line-light text-center">
            <p className="text-sm text-ink m-0">
              We&apos;ve sent instructions to <strong>{email}</strong>. Please check your inbox.
            </p>
            <Link
              href="/sign-in"
              className="text-sm text-brand font-semibold hover:underline"
            >
              Return to sign in
            </Link>
          </div>
        ) : (
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

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-14 rounded-full bg-brand text-white text-base font-medium flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer shadow-sm w-full"
            >
              {isLoading ? "Sending…" : "Send reset link"}
            </button>

            <Link
              href="/sign-in"
              className="text-center text-sm text-muted hover:text-ink transition-colors"
            >
              ← Back to sign in
            </Link>
          </form>
        )}
      </div>

      <div className="text-xs text-[#9E9C94] text-center">
        &copy; 2026 nuru. All rights reserved.
      </div>
    </div>
  );
}
