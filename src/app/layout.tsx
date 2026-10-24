import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sell It: your listing, ready in 60 seconds",
  description:
    "Snap a photo of what you're selling. Get the pitch, a fair price from real listings, clean photos and ready-to-post copy for WhatsApp, Instagram, OLX and Marketplace.",
};

export const viewport: Viewport = {
  themeColor: "#faf5e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
