import { NextResponse } from "next/server";
import { founderFromRequest } from "@/lib/server/founder";
import { cloudLink } from "@/lib/server/waCloud";
import { deleteInstance } from "@/lib/server/waRelease";
import { instanceFor, waFullDigits } from "@/lib/server/whatsapp";

/**
 * Founder only: frees a WhatsApp number that is stuck as "linked to another ibaxai account"
 * (its owner is gone, or linked it by mistake). Deletes its Evolution instance and its ownership
 * row. Numbers linked through Meta's official API are not touched here.
 */
export async function POST(request: Request) {
  const f = await founderFromRequest(request);
  if (!f) return NextResponse.json({ ok: false }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as { number?: string };
  const digits = waFullDigits(String(b.number ?? ""));
  if (!digits) return NextResponse.json({ ok: false, reason: "invalid_number", message: "Enter the full number with the country code, e.g. 917499414443." }, { status: 400 });
  const instance = instanceFor(digits);
  if (await cloudLink(instance)) return NextResponse.json({ ok: false, reason: "official", message: "This number is linked through Meta's official API. Disconnect it from its owner's account." }, { status: 409 });
  const { data: owner } = await f.db.from("wa_instances").select("owner_id").eq("instance", instance).maybeSingle();
  const gone = await deleteInstance(instance);
  if (!gone) return NextResponse.json({ ok: false, reason: "server_error", message: "The WhatsApp server didn't remove it. Try again in a minute." }, { status: 502 });
  await f.db.from("wa_instances").delete().eq("instance", instance);
  return NextResponse.json({ ok: true, hadOwner: Boolean(owner) });
}
