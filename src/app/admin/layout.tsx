import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg min-h-screen">
      <header className="border-b border-[#ECEAE3] bg-white sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="font-serif text-[28px] tracking-[-0.01em] text-ink"
            >
              nuru <span className="text-xs uppercase tracking-widest font-sans font-semibold text-brand bg-tint-sage px-2 py-0.5 rounded-md ml-1">Admin</span>
            </Link>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/admin/orders"
              className="text-ink font-semibold"
            >
              Orders
            </Link>
            <Link
              href="/"
              className="text-muted hover:text-ink transition-colors flex items-center gap-1"
            >
              View Shop →
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
