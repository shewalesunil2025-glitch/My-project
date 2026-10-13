import { NextResponse } from "next/server";

/** The visitor's country (from Vercel), so the website can show ₹ in India and $ elsewhere. */
export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country") ?? "";
  return NextResponse.json({ country }, { headers: { "cache-control": "private, max-age=3600" } });
}
