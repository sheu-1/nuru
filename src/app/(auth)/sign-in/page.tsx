import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <div className="flex flex-wrap min-h-screen bg-bg">
      {/* Left Column: Form */}
      <div className="flex-[1_1_480px] box-border p-6 md:p-10 lg:p-12 flex flex-col justify-between">
        <Link
          href="/"
          className="font-serif text-[30px] tracking-[-0.01em] text-ink hover:opacity-90 w-fit"
        >
          nuru
        </Link>

        <div className="flex-1 flex items-center justify-center py-10 md:py-12">
          <div className="w-full max-w-[400px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5">
              <h1 className="m-0 font-serif font-normal text-4xl md:text-[52px] leading-[1.05] tracking-[-0.02em] text-ink">
                Welcome back
              </h1>
              <p className="m-0 text-base leading-relaxed text-muted">
                Sign in to see your cart and orders.
              </p>
            </div>

            <Suspense fallback={<div className="h-40 flex items-center justify-center text-muted">Loading…</div>}>
              <SignInForm />
            </Suspense>

            <div className="text-center text-sm text-muted">
              New here?{" "}
              <Link
                href="/sign-up"
                className="text-brand font-semibold hover:underline"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#9E9C94] text-center md:text-left">
          &copy; 2026 nuru. All rights reserved.
        </div>
      </div>

      {/* Right Column: Hero Shapes */}
      <div className="flex-[1_1_480px] min-h-[360px] relative bg-tint-sage overflow-hidden hidden md:block">
        <div className="absolute w-[420px] h-[420px] rounded-full bg-brand right-[-80px] bottom-[-90px]" />
        <div className="absolute w-[200px] h-[300px] rounded-[100px] bg-tint-sand left-[18%] top-[14%]" />
        <div className="absolute w-[96px] h-[96px] rounded-full bg-[#D9C7A8] right-[22%] top-[18%]" />
        <div className="absolute w-[170px] h-[70px] rounded-[35px] bg-bg left-[28%] bottom-[16%]" />
      </div>
    </div>
  );
}
