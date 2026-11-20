import Link from "next/link";
import { AdminNav } from "./AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg min-h-screen">
      <header className="border-b border-[#ECEAE3] bg-white sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="font-serif text-[28px] tracking-[-0.01em] text-ink hover:opacity-90"
            >
              nuru <span className="text-xs uppercase tracking-widest font-sans font-semibold text-brand bg-tint-sage px-2.5 py-0.5 rounded-full ml-1">Admin</span>
            </Link>
          </div>
          <AdminNav />
        </div>
      </header>
      {children}
    </div>
  );
}
