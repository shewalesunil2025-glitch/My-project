import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteConfig.url, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${siteConfig.url}/app`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteConfig.url}/app/demo`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteConfig.url}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteConfig.url}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteConfig.url}/refund-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteConfig.url}/shipping-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteConfig.url}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  ];
}
