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
            "radial-gradient(60% 60% at 75% 40%, rgba(22,179,140,0.35), transparent 70%), #030807",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, color: "#a3aba6" }}>{siteConfig.wordmark}</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 96, fontWeight: 700, letterSpacing: -4, lineHeight: 0.95 }}>
          <span>BUILD THE BUSINESS</span>
          <span style={{ color: "#45d6b0" }}>OF 2035.</span>
        </div>
        <div style={{ fontSize: 28, color: "#a3aba6" }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
