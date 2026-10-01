import type { Metadata } from "next";
import { product } from "@/config/product";

export const metadata: Metadata = {
  title: { default: `${product.name} — ${product.tagline}`, template: `%s · ${product.name}` },
  description: product.description,
  applicationName: product.name,
  robots: { index: true, follow: true },
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
