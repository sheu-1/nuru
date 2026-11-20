"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/Field";
import { z } from "zod";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(9, "Valid phone number is required (e.g. 0712345678)"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const result = signUpSchema.safeParse({ fullName, email, phone, password });
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) {
        setServerError(error.message);
        setIsLoading(false);
        return;
      }

      // If email confirmation is disabled or session exists immediately
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setIsSuccess(true);
        setIsLoading(false);
      }
    } catch (err: any) {
      setServerError(err.message || "Failed to create account");
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4 p-7 rounded-3xl bg-surface border border-line-light text-center">
        <div className="w-12 h-12 rounded-full bg-tint-sage text-brand flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-serif text-ink m-0">Check your inbox</h2>
        <p className="text-muted text-sm m-0">
          We&apos;ve sent an activation link to <strong>{email}</strong>. Click the link to complete registration.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        id="name"
        label="Full name"
        type="text"
        placeholder="Your name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        required
      />

      <Field
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
      />

      <Field
        id="phone"
        label="Phone (for M-Pesa and delivery)"
        type="tel"
        placeholder="07XX XXX XXX"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
        required
      />

      <Field
        id="pw"
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        required
      />

      {serverError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="h-14 rounded-full bg-brand text-white text-base font-medium flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer shadow-sm w-full mt-2"
      >
        {isLoading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
