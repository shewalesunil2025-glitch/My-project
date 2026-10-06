import { NextResponse } from "next/server";
import { serviceById } from "@/content/app/services";

/**
 * Hands a newly activated service to the automation backend (n8n).
 *
 * Set N8N_ACTIVATE_WEBHOOK_URL (and N8N_WEBHOOK_SECRET, sent as `x-ibax-secret`) to
 * forward every activation to the master n8n workflow, which routes it by `serviceId`.
 * Without it the app runs in preview mode and reports that nothing was forwarded.
 */

const MAX_BODY = 20_000;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, reason: "too_large" }, { status: 413 });

  let body: { workspaceId?: unknown; serviceId?: unknown; business?: unknown; config?: unknown; accounts?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  const svc = typeof body.serviceId === "string" ? serviceById(body.serviceId) : undefined;
  if (!svc || typeof body.workspaceId !== "string") return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });

  const url = process.env.N8N_ACTIVATE_WEBHOOK_URL;
  if (!url) return NextResponse.json({ ok: true, mode: "preview" });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ibax-secret": process.env.N8N_WEBHOOK_SECRET ?? "" },
      body: JSON.stringify({
        event: "service.activated",
        at: new Date().toISOString(),
        workspaceId: body.workspaceId,
        serviceId: svc.id,
        business: body.business ?? null,
        config: body.config ?? {},
        accounts: body.accounts ?? {},
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[activate] automation server answered ${res.status}`);
      return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, mode: "sent" });
  } catch (error) {
    console.error("[activate] automation server unreachable", error);
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
