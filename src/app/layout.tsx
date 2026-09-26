import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { MotionConfig } from "framer-motion";
import { siteConfig } from "@/config/site";
import { SmoothScroll } from "@/components/effects/SmoothScroll";
import { IntroLoader } from "@/components/effects/IntroLoader";
import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { Spotlight } from "@/components/effects/Spotlight";
import { CursorAura } from "@/components/effects/CursorAura";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });

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
  themeColor: "#06060c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${grotesk.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body>
        <IntroLoader />
        <MotionConfig reducedMotion="user">
          <SmoothScroll />
          <ScrollProgress />
          <Spotlight />
          <CursorAura />
          {children}
        </MotionConfig>
      </body>
    </html>
  );
}
