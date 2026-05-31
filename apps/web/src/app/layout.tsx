import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "SummerMate — Discover Activities & Meet People",
    template: "%s | SummerMate",
  },
  description:
    "Discover summer activities, meet like-minded people, organize events and create unforgettable memories.",
  keywords: ["activities", "events", "social", "summer", "outdoor", "community"],
  authors: [{ name: "SummerMate" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://summermate.app",
    title: "SummerMate",
    description: "Discover activities. Meet people. Make memories.",
    siteName: "SummerMate",
  },
  twitter: {
    card: "summary_large_image",
    title: "SummerMate",
    description: "Discover activities. Meet people. Make memories.",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ff7c0a" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
