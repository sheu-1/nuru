import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Splash from "@/components/Splash/Splash";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "nuru — Things you'll love, delivered to your door",
  description: "Browse calmly. Pay with M-Pesa or card. Track every order.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("nuru:splash-seen")||localStorage.getItem("nuru:splash-seen"))document.documentElement.dataset.splash="skip"}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-bg text-ink min-h-screen">
        <Splash />
        {children}
      </body>
    </html>
  );
}
