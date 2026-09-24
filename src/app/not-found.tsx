import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[100svh] place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="display text-metal mt-4 text-6xl">This flow doesn&apos;t exist.</h1>
        <Link href="/" className="link-underline mt-8 inline-block text-fg-muted hover:text-fg">
          Back to Nexa Flow AI
        </Link>
      </div>
    </main>
  );
}
