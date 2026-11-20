import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#ECEAE3] bg-white mt-16">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12 flex flex-col gap-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <Link
              href="/"
              className="font-serif text-[28px] tracking-[-0.01em] text-ink hover:opacity-90 inline-block"
            >
              nuru
            </Link>
            <p className="text-sm text-muted max-w-sm m-0 leading-relaxed">
              Curated electronics, phones, TVs &amp; home essentials with fast, secure delivery across Kenya.
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted">
              <span className="px-2.5 py-1 rounded-full bg-surface">📱 M-Pesa</span>
              <span className="px-2.5 py-1 rounded-full bg-surface">💳 Card</span>
              <span className="px-2.5 py-1 rounded-full bg-surface">🔒 Paystack Secured</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted">
              Contact &amp; Store
            </span>
            <div className="flex flex-col gap-1.5 text-sm">
              <a
                href="mailto:iannjore@gmail.com"
                className="text-ink hover:text-brand transition-colors font-medium"
              >
                iannjore@gmail.com
              </a>
              <a
                href="tel:0799482396"
                className="text-ink hover:text-brand transition-colors"
              >
                0799 482 396
              </a>
              <span className="text-muted">
                Donholm, Nairobi, Kenya
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted">
              Quick Links
            </span>
            <div className="flex flex-col gap-2 text-sm text-[#4A4943]">
              <Link href="/#new" className="hover:text-ink transition-colors">
                Shop all products
              </Link>
              <Link href="/contact" className="hover:text-ink transition-colors">
                Contact &amp; Support
              </Link>
              <Link href="/cart" className="hover:text-ink transition-colors">
                Shopping Cart
              </Link>
              <Link href="/orders" className="hover:text-ink transition-colors">
                Track Order
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#ECEAE3] pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <span>© 2026 nuru. All rights reserved.</span>
          <span>Donholm, Nairobi, Kenya</span>
        </div>
      </div>
    </footer>
  );
}
