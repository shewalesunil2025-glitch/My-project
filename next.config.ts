import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  experimental: { optimizePackageImports: ["lucide-react", "framer-motion"] },
  // One address for everyone: payments (Razorpay) and Google sign-in only accept www.ibaxai.com.
  // Android (Play Store app): proves the app and www.ibaxai.com belong together, so it opens without a browser bar.
  async rewrites() {
    return [{ source: "/.well-known/assetlinks.json", destination: "/api/assetlinks" }];
  },
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "my-project-98t4.vercel.app" }], destination: "https://www.ibaxai.com/:path*", permanent: true }];
  },
};

export default nextConfig;
