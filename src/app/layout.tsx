import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter_Tight, Poppins } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { MotionConfig } from "framer-motion";
import { siteConfig } from "@/config/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", weight: ["500", "700"], display: "swap" });
const tight = Inter_Tight({ subsets: ["latin"], variable: "--font-tight", weight: ["300", "400", "500"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.title, template: `%s — ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "AI automation agency",
    "AI WhatsApp automation",
    "AI voice receptionist",
    "AI voice agent",
    "AI chatbot",
    "booking automation",
    "Google review automation",
    "business workflow automation",
    "AI-powered website",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: siteConfig.title, description: siteConfig.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#030703",
  colorScheme: "dark",
  // Phones: the on-screen keyboard shrinks the layout, so the IBAXAI chat input stays visible.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${tight.variable} ${poppins.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body>
        <MotionConfig reducedMotion="never">
          {children}
        </MotionConfig>
      </body>
    </html>
  );
}
