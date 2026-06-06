import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: "700",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Carrusel — AI Carousel Builder",
  description:
    "Open-source AI-powered Instagram carousel builder. Create beautiful carousels with natural language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="h-full notranslate" suppressHydrationWarning>
        <nav className="flex items-center gap-4 px-6 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
          <span
            className="font-bold text-orange-400 text-lg mr-2"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
          >
            Tiduin Carousel
          </span>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/new-post" className="text-sm text-gray-400 hover:text-white transition-colors">
            Neuer Post
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
