import { product } from "@/config/product";
import { serviceById, type ServiceDef } from "@/content/app/services";
import { contentIdea } from "./assistant";
import { audit, logActivity, notify, nowIso, uid, updateWorkspace } from "./store";
import type { Automation, AutomationStatus, ContentItem, Workspace } from "./types";

export function setAutomationStatus(id: string, status: AutomationStatus, message: string) {
  updateWorkspace((ws) => {
    const a = ws.automations.find((x) => x.id === id);
    if (!a) return;
    a.status = status;
    a.note = status === "paused" ? `Paused by you on ${new Date().toLocaleDateString()}` : undefined;
    a.logs.unshift({ at: nowIso(), level: status === "active" ? "success" : "info", message });
    const name = serviceById(a.serviceId)?.name ?? "Automation";
    logActivity(ws, { kind: "automation", title: `${name} ${message.toLowerCase()}`, href: "/app/automations" });
    audit(ws, `${name}: ${message}`);
  });
}

export function runTest(id: string) {
  updateWorkspace((ws) => {
    const a = ws.automations.find((x) => x.id === id);
    if (!a) return;
    a.tested = true;
    a.lastRunAt = nowIso();
    a.logs.unshift({ at: nowIso(), level: "success", message: "Test run passed" });
  });
}

/** Missing connections for a service. */
export function missingConnections(ws: Workspace, svc: ServiceDef) {
  return svc.connect.filter((p) => ws.connections[p]?.status !== "connected");
}

/** Final step of the wizard: switch the automation on and create its first output. */
export function activate(id: string) {
  updateWorkspace((ws) => {
    const a = ws.automations.find((x) => x.id === id);
    if (!a) return;
    const svc = serviceById(a.serviceId)!;
    const blocked = missingConnections(ws, svc);
    if (blocked.length) {
      a.status = "attention";
      a.note = "An account connection is missing — reconnect it to continue.";
      return;
    }
    a.status = "active";
    a.setupStep = 99;
    a.activatedAt = nowIso();
    a.lastRunAt = nowIso();
    a.logs.unshift({ at: nowIso(), level: "success", message: "Activated" });
    firstRun(ws, a, svc);
    logActivity(ws, { kind: "automation", title: `${svc.name} activated`, href: `/app/automations/${a.id}` });
    notify(ws, { kind: "published", title: `${svc.name} is live`, detail: "You can pause, edit or test it any time.", href: `/app/automations/${a.id}` });
    audit(ws, `Activated ${svc.name}`);
  });
}

function nextSlot(time: string | boolean | undefined) {
  const [h, m] = (typeof time === "string" && /^\d{2}:\d{2}$/.test(time) ? time : "19:00").split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() < Date.now() + 15 * 60_000) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function firstRun(ws: Workspace, a: Automation, svc: ServiceDef) {
  const platforms: Partial<Record<string, ContentItem["platform"][]>> = {
    youtube: ["youtube"],
    instagram: ["instagram"],
    facebook: ["facebook"],
    "digital-marketing": ["instagram", "facebook", "youtube"],
  };
  const needsApproval = a.config.approval !== "Publish automatically";
  for (const platform of platforms[svc.id] ?? []) {
    const idea = contentIdea(ws, platform);
    ws.content.unshift({
      id: uid(),
      type: platform === "youtube" ? "short" : "post",
      platform,
      title: idea.title,
      body: idea.body,
      hashtags: idea.hashtags,
      status: needsApproval ? "approval" : "scheduled",
      scheduledAt: nextSlot(a.config.time),
      createdAt: nowIso(),
    });
    logActivity(ws, {
      kind: platform,
      title: needsApproval ? `First ${platform === "youtube" ? "YouTube Short" : "post"} ready for your approval` : `First ${platform === "youtube" ? "YouTube Short" : "post"} scheduled`,
      detail: idea.title,
      href: "/app/content",
    });
  }
  if (svc.id === "website") {
    ws.website = {
      status: "requested",
      template: ws.website?.template ?? "classic",
      pages: ws.website?.pages ?? ["Home", "About", "Services", "Gallery", "Reviews", "Contact"],
      headline: ws.website?.headline ?? ws.business?.name ?? "",
      about: ws.website?.about ?? ws.business?.description ?? "",
      accent: ws.website?.accent ?? "#ff5a1f",
      updatedAt: nowIso(),
    };
    a.note = "Our team is building your website — first version within 3–5 working days.";
  }
  if (svc.id === "digital-marketing") a.note = "Your marketing specialist will book a kick-off call within 2 working days.";
  if (svc.id === "voice") a.note = `Forward your business calls to your ${product.name} number to start receiving calls.`;
}
