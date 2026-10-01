import { product } from "@/config/product";

/** Google / Apple sign-in. Shown but disabled until OAuth is configured on the backend. */
export function SocialSignIn() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {["Google", "Apple"].map((p) => (
          <button
            key={p}
            type="button"
            disabled
            aria-describedby="social-note"
            className="h-11 rounded-full border border-white/10 bg-white/[0.03] text-sm font-medium text-fg-muted disabled:cursor-not-allowed"
          >
            Continue with {p}
          </button>
        ))}
      </div>
      {product.previewMode && (
        <p id="social-note" className="text-center text-xs text-fg-subtle">
          Google and Apple sign-in switch on when the app is connected to its backend.
        </p>
      )}
      <div className="flex items-center gap-3 py-2 text-xs text-fg-subtle">
        <span className="h-px flex-1 bg-white/10" /> or with email <span className="h-px flex-1 bg-white/10" />
      </div>
    </div>
  );
}
