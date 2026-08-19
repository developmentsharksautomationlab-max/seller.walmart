import type { Metadata } from "next";
import { Lato, Geist_Mono } from "next/font/google";
import "./globals.css";

// Walmart's real UI face is "Everyday Sans UI" (Bogle before 2025) — both are
// proprietary, commissioned exclusively for Walmart, so they aren't
// obtainable for a third-party project. Lato is the closest freely-licensed
// match: same humanist classification as Antique Olive (which Everyday Sans
// is based on) and, unlike more display-y alternatives (Raleway, Josefin
// Sans), it stays legible at the small sizes a dense dashboard needs.
const lato = Lato({
  variable: "--font-lato-sans",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Walmart Seller Center",
  description: "Seller analytics dashboard — practice/demo project.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lato.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full font-sans text-slate-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
