import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export default function SignUpPage() {
  return (
    <div className="flex flex-wrap min-h-screen bg-bg">
      {/* Left Column: Abstract Art */}
      <div className="flex-[1_1_360px] min-h-[360px] relative bg-tint-sand overflow-hidden hidden md:block">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#D9C7A8] left-[-90px] bottom-[-80px]" />
        <div className="absolute w-[190px] h-[280px] rounded-[95px] bg-brand right-[16%] top-[14%]" />
        <div className="absolute w-[90px] h-[90px] rounded-full bg-tint-sage left-[18%] top-[18%]" />
        <div className="absolute w-[160px] h-[66px] rounded-[33px] bg-bg right-[20%] bottom-[18%]" />
      </div>

      {/* Right Column: Form */}
      <div className="flex-[1_1_480px] box-border p-6 md:p-10 lg:p-12 flex flex-col justify-between">
        <Link
          href="/"
          className="self-start md:self-end font-serif text-[30px] tracking-[-0.01em] text-ink hover:opacity-90"
        >
          nuru
        </Link>

        <div className="flex-1 flex items-center justify-center py-8 md:py-10">
          <div className="w-full max-w-[400px] flex flex-col gap-7">
            <div className="flex flex-col gap-2.5">
              <h1 className="m-0 font-serif font-normal text-4xl md:text-[52px] leading-[1.05] tracking-[-0.02em] text-ink">
                Create your account
              </h1>
              <p className="m-0 text-base leading-relaxed text-muted">
                It takes under a minute.
              </p>
            </div>

            <SignUpForm />

            <div className="text-center text-sm text-muted">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-brand font-semibold hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#9E9C94] text-center md:text-right">
          &copy; 2026 nuru. All rights reserved.
        </div>
      </div>
    </div>
  );
}
