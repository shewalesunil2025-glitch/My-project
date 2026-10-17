import { NextResponse } from "next/server";

/**
 * Digital Asset Links for the Android app (served at /.well-known/assetlinks.json via a rewrite).
 * ANDROID_SHA256_FINGERPRINTS: comma-separated SHA-256 certificate fingerprints from Play Console →
 * Setup → App signing (the app signing key, and the upload key for testing). They are public values.
 */
const ANDROID_PACKAGE = "com.ibaxai.app";

export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter((f) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));
  const body = fingerprints.length
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: fingerprints } }]
    : [];
  return NextResponse.json(body, { headers: { "cache-control": "public, max-age=3600" } });
}
