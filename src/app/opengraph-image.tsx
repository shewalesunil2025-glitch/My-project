import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#f1eee6",
          background:
            "radial-gradient(60% 60% at 75% 40%, rgba(255,90,31,0.4), transparent 70%), #06060c",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, color: "#a3aba6" }}>{siteConfig.wordmark}</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 96, fontWeight: 700, letterSpacing: -4, lineHeight: 0.95 }}>
          <span>THE BUSINESS THAT</span>
          <span style={{ color: "#8b5cf6" }}>NEVER SLEEPS.</span>
        </div>
        <div style={{ fontSize: 28, color: "#a3aba6" }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
