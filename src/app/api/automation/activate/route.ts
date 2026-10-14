import { NextResponse } from "next/server";
import { serviceById } from "@/content/app/services";
import { sendActivation } from "@/lib/server/billing";
import { evolutionReady, instanceFor, ownership, userFromRequest, waDigits } from "@/lib/server/whatsapp";

/**
 * Hands a newly activated service to the automation backend (n8n).
 *
 * Set N8N_ACTIVATE_WEBHOOK_URL (and N8N_WEBHOOK_SECRET, sent as `x-ibax-secret`) to
 * forward every activation to the master n8n workflow, which routes it by `serviceId`.
 * Without it the app runs in preview mode and reports that nothing was forwarded.
 */

// Room for a logo from older app versions (dropped below); the automation server gets ~20 KB at most.
const MAX_BODY = 600_000;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, reason: "too_large" }, { status: 413 });

  let body: { workspaceId?: unknown; serviceId?: unknown; business?: unknown; config?: unknown; accounts?: unknown; trialEndsAt?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  const svc = typeof body.serviceId === "string" ? serviceById(body.serviceId) : undefined;
  if (!svc || typeof body.workspaceId !== "string") return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });

  // WhatsApp replies and Lead Follow-up send from the owner's number: only the account that linked it may switch them on.
  if ((svc.id === "whatsapp" || svc.id === "followup") && evolutionReady()) {
    const user = await userFromRequest(request);
    if (!user) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    const accounts = (body.accounts ?? {}) as Record<string, unknown>;
    const digits = waDigits(String(accounts.whatsapp ?? ""));
    if (!digits || (await ownership(user.id, instanceFor(digits))) !== "mine") {
      return NextResponse.json({ ok: false, reason: "not_linked" }, { status: 403 });
    }
  }

  const mode = await sendActivation({
    workspaceId: body.workspaceId,
    serviceId: svc.id,
    business: body.business,
    config: body.config,
    accounts: body.accounts,
    trialEndsAt: body.trialEndsAt,
  });
  if (mode === "failed") return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  return NextResponse.json({ ok: true, mode });
}
