import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validSlug } from "@/lib/sites/site";

/** After the owner publishes, refresh the cached page at /s/<slug> right away. */
export async function POST(request: Request) {
  const { slug } = (await request.json().catch(() => ({}))) as { slug?: string };
  if (!slug || !validSlug(slug)) return NextResponse.json({ ok: false }, { status: 400 });
  revalidatePath(`/s/${slug}`);
  return NextResponse.json({ ok: true });
}
