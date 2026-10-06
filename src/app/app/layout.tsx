import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { product } from "@/config/product";
import { AppSplash } from "@/components/app/AppSplash";

const tight = Inter_Tight({ subsets: ["latin"], variable: "--font-tight", display: "swap" });

export const metadata: Metadata = {
  title: { absolute: `${product.name} — ${product.tagline}`, template: `%s · ${product.name}` },
  description: product.description,
  applicationName: product.name,
  robots: { index: true, follow: true },
  manifest: "/lumi.webmanifest",
  // iPhone: "Add to Home Screen" opens IBAX AI full screen, like a native app.
  appleWebApp: { capable: true, title: product.name, statusBarStyle: "black" },
  icons: {
    icon: [{ url: "/lumi/icon-192.png?v=3", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/lumi/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#030703",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`theme-lumi ${tight.variable}`}>
      <AppSplash />
      {children}
    </div>
  );
}
