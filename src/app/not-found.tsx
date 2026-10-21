import Link from "next/link";
import { siteConfig } from "@/config/site";

/** A wrong or old address: say so plainly and offer the two places people want. */
export default function NotFound() {
  return (
    <main className="grid min-h-[100svh] place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="display text-metal mt-4 text-5xl sm:text-6xl">This page doesn&apos;t exist.</h1>
        <p className="mx-auto mt-4 max-w-md text-fg-muted">
          The address may be mistyped or old. Check the link, or go to {siteConfig.name} from here.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-3d inline-flex h-12 items-center rounded-full px-6 font-semibold">
            Go to {siteConfig.name}
          </Link>
          <Link href="/app" className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 font-semibold text-fg hover:border-white/30">
            Open the app
          </Link>
        </div>
      </div>
    </main>
  );
}
