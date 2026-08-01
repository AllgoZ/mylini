import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Wordmark-only serif — used exclusively by <Logo />, kept separate from the
// body/heading sans fonts so the brand wordmark reads distinctly premium.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mylini | Premium Indian Children's Ethnic Wear",
  description: "Crafting timeless ethnic luxury for little ones. Specializing in Pattupavadai, silk dresses, and traditional outfits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${inter.variable} ${cormorant.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Open the connection to the image CDN before the first product image is requested */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col font-body" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
