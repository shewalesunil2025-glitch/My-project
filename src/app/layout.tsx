import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { MotionConfig } from "framer-motion";
import { siteConfig } from "@/config/site";
import { SmoothScroll } from "@/components/effects/SmoothScroll";
import "./globals.css";

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
  themeColor: "#030807",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <MotionConfig reducedMotion="user">
          <SmoothScroll />
          {children}
        </MotionConfig>
      </body>
    </html>
  );
}
