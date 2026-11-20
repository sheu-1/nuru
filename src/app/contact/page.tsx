import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "./ContactForm";

export default function ContactPage() {
  return (
    <div className="bg-bg min-h-screen">
      <Header />

      <main className="max-w-[1280px] mx-auto box-border px-6 md:px-12 py-8 pb-24 flex flex-col gap-12">
        {/* Page Title */}
        <div className="max-w-xl flex flex-col gap-3">
          <h1 className="m-0 font-serif font-normal text-5xl md:text-[60px] tracking-[-0.02em] text-ink leading-tight">
            Get in touch
          </h1>
          <p className="m-0 text-base md:text-lg text-muted leading-relaxed">
            Have a question about an order, delivery in Kenya, or looking for specific electronics and home goods? We&apos;d love to hear from you.
          </p>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Quick Cards */}
            <div className="p-8 rounded-[28px] bg-white border border-[#ECEAE3] flex flex-col gap-6 shadow-sm">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wider font-semibold text-muted">
                  Customer Support
                </span>
                <a
                  href="mailto:iannjore@gmail.com"
                  className="text-lg font-medium text-ink hover:text-brand transition-colors"
                >
                  iannjore@gmail.com
                </a>
                <span className="text-sm text-muted">
                  We typically reply within 2 hours.
                </span>
              </div>

              <div className="h-px bg-[#ECEAE3]" />

              <div className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wider font-semibold text-muted">
                  Phone & WhatsApp
                </span>
                <a
                  href="tel:0799482396"
                  className="text-lg font-medium text-ink hover:text-brand transition-colors"
                >
                  +254 799 482 396
                </a>
                <span className="text-sm text-muted">
                  Call or WhatsApp: Mon – Sat, 9:00 AM – 6:00 PM EAT
                </span>
              </div>

              <div className="h-px bg-[#ECEAE3]" />

              <div className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wider font-semibold text-muted">
                  Store & Fulfillment Center
                </span>
                <span className="text-lg font-medium text-ink">
                  Donholm
                </span>
                <span className="text-sm text-muted">
                  Donholm, Nairobi, Kenya
                </span>
              </div>
            </div>

            {/* Delivery Guarantee Card */}
            <div className="p-7 rounded-[28px] bg-tint-sage border border-[#C8D6C6] flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center flex-none font-bold text-sm">
                KES
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink">
                  Fast Delivery Across Kenya
                </span>
                <p className="text-xs text-muted m-0 leading-relaxed">
                  Fast courier delivery within Nairobi, Donholm, and nationwide to Mombasa, Kisumu, Nakuru, and all major towns.
                </p>
              </div>
            </div>
          </div>

          {/* Inquiry Form Column */}
          <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-[32px] border border-[#ECEAE3] shadow-sm">
            <h2 className="font-serif font-normal text-3xl text-ink m-0 mb-6">
              Send us a message
            </h2>
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
