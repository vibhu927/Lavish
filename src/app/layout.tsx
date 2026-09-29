import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Leaf Organic — Pure Beauty, Naturally",
    template: "%s | Leaf Organic",
  },
  description:
    "Discover Leaf Organic — handcrafted beauty and cosmetics made with organic, cruelty-free ingredients. Pure, natural, and sustainably made.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Leaf Organic — Pure Beauty, Naturally",
    description: "Handcrafted beauty and cosmetics, organic & cruelty-free.",
    images: ["/og-image.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable} antialiased`}>
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
