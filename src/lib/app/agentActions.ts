import { formatPrice, product } from "@/config/product";
import { annualPrice, isLive, providerInfo, serviceById, services, type FieldDef, type ServiceDef } from "@/content/app/services";
import { activate, missingConnections, runTest, setAutomationStatus } from "./automation";
import { cloudAuthHeader } from "./cloud";
import { audit, currentWorkspace, logActivity, notify, nowIso, uid, updateWorkspace } from "./store";
import type { Automation, PlanPeriod, ProviderId, Workspace } from "./types";

/**
 * What IBAX can do for the owner from the chat: buy a service, save the details it
 * needs, connect an account and switch it on. The Services pages and the activation
 * wizard use the same functions, so a service set up by talking is identical to one
 * set up by tapping through the screens.
 */

export const purchasable = services.filter((s) => s.price !== null);

export function periodFor(svc: ServiceDef, requested?: string): PlanPeriod {
  if (svc.billing === "one-time") return "one-time";
  return requested === "annual" ? "annual" : "monthly";
}

export function priceFor(svc: ServiceDef, period: PlanPeriod) {
  return period === "annual" ? annualPrice(svc.price ?? 0) : (svc.price ?? 0);
}

export function priceLabel(svc: ServiceDef, period: PlanPeriod) {
  const amount = formatPrice(priceFor(svc, period));
  return period === "one-time" ? `${amount} one-time` : `${amount}/${period === "annual" ? "year" : "month"}`;
}

export const automationFor = (ws: Workspace, serviceId: string) => ws.automations.find((a) => a.serviceId === serviceId);

/** Business-profile values and defaults, so nobody is asked for what the app already knows. */
function prefill(ws: Workspace, svc: ServiceDef): Automation["config"] {
  const config: Automation["config"] = {};
  for (const f of [...svc.info, ...svc.configure]) {
    const fromProfile = f.fromBusiness && ws.business ? ws.business[f.fromBusiness] : undefined;
    const value = fromProfile || f.default;
    if (value !== undefined && value !== "") config[f.key] = value;
  }
  return config;
}

/**
 * Takes payment for a service and creates its automation, waiting for setup.
 * Preview mode: the payment is simulated. In production this is the payment
 * provider's webhook (Stripe / Razorpay), never the browser.
 */
export function buyService(serviceId: string, requested?: string): string | null {
  const svc = serviceById(serviceId);
  const ws = currentWorkspace();
  if (!svc || svc.price === null || !ws || !isLive(svc.id)) return null;
  const existing = automationFor(ws, svc.id);
  if (existing) return existing.id;

  const period = periodFor(svc, requested);
  const amount = priceFor(svc, period);
  const renews = new Date();
  if (period === "monthly") renews.setMonth(renews.getMonth() + 1);
  else if (period === "annual") renews.setFullYear(renews.getFullYear() + 1);
  const automationId = uid();

  updateWorkspace((w) => {
    const subId = uid();
    w.subscriptions.push({ id: subId, serviceId: svc.id, period, price: amount, status: "active", startedAt: nowIso(), renewsAt: renews.toISOString() });
    w.invoices.unshift({
      id: uid(),
      number: `LUMI-${1000 + w.invoices.length + 1}`,
      serviceId: svc.id,
      period,
      amount,
      date: nowIso(),
      status: product.previewMode ? "test" : "paid",
    });
    w.automations.push({
      id: automationId,
      serviceId: svc.id,
      subscriptionId: subId,
      status: "setup",
      config: prefill(w, svc),
      setupStep: 0,
      tested: false,
      createdAt: nowIso(),
      logs: [{ at: nowIso(), level: "info", message: "Payment confirmed — waiting for setup" }],
    });
    logActivity(w, { kind: "payment", title: `Payment confirmed — ${svc.name}`, detail: `${formatPrice(amount)} · ${period}`, href: "/app/billing" });
    notify(w, { kind: "payment", title: "Payment confirmed", detail: `${svc.name} — ${formatPrice(amount)}. Let's activate it.`, href: `/app/automations/${automationId}` });
    audit(w, `Purchased ${svc.name} (${period})`);
  });
  return automationId;
}

const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === "string" && !v.trim());

/** Information fields a service still needs before it can go live. */
export function missingDetails(svc: ServiceDef, a: Automation | undefined, include: "required" | "all" = "required"): FieldDef[] {
  return svc.info.filter((f) => (include === "all" || f.required) && f.type !== "toggle" && isEmpty(a?.config[f.key]));
}

/** Saves answers the owner gave in the chat. Unknown keys are ignored. */
export function saveServiceDetails(serviceId: string, fields: { key: string; value: string }[]) {
  const svc = serviceById(serviceId);
  if (!svc) return { ok: false as const, error: "unknown_service" };
  const ws = currentWorkspace();
  if (!ws || !automationFor(ws, svc.id)) return { ok: false as const, error: "not_paid" };
  const defs = new Map([...svc.info, ...svc.configure].map((f) => [f.key, f]));
  const saved: string[] = [];
  updateWorkspace((w) => {
    const a = automationFor(w, svc.id);
    if (!a) return;
    for (const { key, value } of fields) {
      const def = defs.get(key);
      if (!def) continue;
      const text = value.trim().slice(0, 2000);
      if (def.type === "toggle") a.config[key] = /^(y|yes|true|on|haan|ha|han|ho)\b|^(हाँ|हां|हो)(?=\s|[.!,।]|$)/i.test(text);
      else if (def.type === "select" && def.options) a.config[key] = def.options.find((o) => o.toLowerCase() === text.toLowerCase()) ?? def.options.find((o) => o.toLowerCase().includes(text.toLowerCase())) ?? a.config[key] ?? def.options[0];
      else a.config[key] = text;
      saved.push(key);
    }
    if (saved.length) a.logs.unshift({ at: nowIso(), level: "info", message: `Details saved: ${saved.map((k) => defs.get(k)!.label).join(", ")}` });
  });
  return { ok: true as const, saved, missing: missingDetails(svc, automationFor(currentWorkspace()!, svc.id)).map((f) => f.key) };
}

/**
 * Connects a platform account.
 * Preview mode: the account name/number is recorded on this device. In production this is
 * the platform's own sign-in (for WhatsApp, Meta's Embedded Signup) and the backend keeps the token.
 */
export function connectProvider(provider: ProviderId, account: string, simulated: boolean = product.previewMode) {
  const name = providerInfo[provider].name;
  updateWorkspace((w) => {
    w.connections[provider] = { provider, account: account.trim(), status: "connected", connectedAt: nowIso(), simulated };
    logActivity(w, { kind: "system", title: `${name} connected`, detail: account.trim(), href: "/app/settings#accounts" });
    audit(w, `Connected ${name}`);
  });
}

export type ActivationResult =
  | { ok: true; automationId: string; note?: string; approvalNote?: string; backend: "preview" | "sent" | "failed" }
  | { ok: false; reason: "unknown_service" | "not_paid" | "missing_details" | "not_connected"; missing: string[] };

/** Runs the test and switches the service on, then hands it to the automation backend. */
export async function activateService(serviceId: string): Promise<ActivationResult> {
  const svc = serviceById(serviceId);
  if (!svc) return { ok: false, reason: "unknown_service", missing: [] };
  const ws = currentWorkspace();
  const a = ws && automationFor(ws, svc.id);
  if (!ws || !a) return { ok: false, reason: "not_paid", missing: [] };
  const details = missingDetails(svc, a);
  if (details.length) return { ok: false, reason: "missing_details", missing: details.map((f) => f.key) };
  const accounts = missingConnections(ws, svc);
  if (accounts.length) return { ok: false, reason: "not_connected", missing: accounts };

  if (a.status !== "active") {
    runTest(a.id);
    activate(a.id);
  }
  const after = automationFor(currentWorkspace()!, svc.id)!;

  let backend: "preview" | "sent" | "failed" = "failed";
  try {
    const res = await fetch("/api/automation/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await cloudAuthHeader()) },
      body: JSON.stringify({
        workspaceId: ws.id,
        serviceId: svc.id,
        business: ws.business,
        config: after.config,
        accounts: Object.fromEntries(svc.connect.map((p) => [p, ws.connections[p]?.account ?? ""])),
      }),
    });
    const data = (await res.json().catch(() => null)) as { mode?: "preview" | "sent" } | null;
    if (res.ok && data?.mode) backend = data.mode;
  } catch {
    /* offline — the automation is on in the app; the backend picks it up on the next sync */
  }
  updateWorkspace((w) => {
    const x = automationFor(w, svc.id);
    if (!x) return;
    x.logs.unshift({
      at: nowIso(),
      level: backend === "failed" ? "warning" : "success",
      message: backend === "sent" ? "Sent to the automation server" : backend === "preview" ? "Preview mode — automation server not connected yet" : "Couldn't reach the automation server — will retry",
    });
  });
  return { ok: true, automationId: after.id, note: after.note, approvalNote: svc.approvalNote, backend };
}

export const onWaitlist = (ws: Workspace, serviceId: string) => !!ws.waitlist?.some((w) => w.serviceId === serviceId);

/** Adds the owner to the waitlist of a service that hasn't launched yet. */
export function joinWaitlist(serviceId: string) {
  const svc = serviceById(serviceId);
  const ws = currentWorkspace();
  if (!svc || !ws) return false;
  if (onWaitlist(ws, svc.id)) return true;
  updateWorkspace((w) => {
    w.waitlist = [...(w.waitlist ?? []), { serviceId: svc.id, at: nowIso() }];
    notify(w, { kind: "upcoming", title: `You're on the ${svc.name} waitlist`, detail: "We'll tell you here the day it launches.", href: `/app/services/${svc.id}` });
    audit(w, `Joined the ${svc.name} waitlist`);
  });
  return true;
}

export function setServiceState(serviceId: string, state: "pause" | "resume") {
  const ws = currentWorkspace();
  const a = ws && automationFor(ws, serviceId);
  if (!a) return false;
  setAutomationStatus(a.id, state === "pause" ? "paused" : "active", state === "pause" ? "Paused" : "Resumed");
  return true;
}

/** One line per service the owner has, for the assistant to see where each one is up to. */
export function servicesSnapshot(ws: Workspace) {
  if (!ws.automations.length) return "Services bought: none yet.";
  return ws.automations
    .map((a) => {
      const svc = serviceById(a.serviceId);
      if (!svc) return "";
      const missing = missingDetails(svc, a, "all").map((f) => f.key);
      const accounts = missingConnections(ws, svc);
      return `- ${svc.id} (${svc.name}): paid; status ${a.status}; missing details: ${missing.join(", ") || "none"}; accounts to connect: ${accounts.join(", ") || "none"}.`;
    })
    .filter(Boolean)
    .join("\n");
}
