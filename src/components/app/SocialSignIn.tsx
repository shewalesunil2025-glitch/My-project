"use client";

import { useState } from "react";
import { cloudEnabled, cloudOAuth, type OAuthProvider } from "@/lib/app/cloud";
import { Notice, Spinner } from "@/components/app/ui";

const providers: { id: OAuthProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
];

/** Google / Apple sign-in through Supabase. Disabled in preview mode (no backend). */
export function SocialSignIn() {
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState("");

  async function go(provider: OAuthProvider) {
    setError("");
    setBusy(provider);
    const res = await cloudOAuth(provider);
    // On success the browser is already leaving for Google / Apple.
    if (!res.ok) {
      setError(res.error);
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={!cloudEnabled || busy !== null}
            onClick={() => go(p.id)}
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] text-sm font-medium text-fg transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:text-fg-muted"
          >
            {busy === p.id ? <Spinner /> : `Continue with ${p.label}`}
          </button>
        ))}
      </div>
      {!cloudEnabled && <p className="text-center text-xs text-fg-subtle">Google and Apple sign-in switch on when the app is connected to its backend.</p>}
      {error && <Notice tone="amber">{error}</Notice>}
      <div className="flex items-center gap-3 py-2 text-xs text-fg-subtle">
        <span className="h-px flex-1 bg-white/10" /> or with email <span className="h-px flex-1 bg-white/10" />
      </div>
    </div>
  );
}
