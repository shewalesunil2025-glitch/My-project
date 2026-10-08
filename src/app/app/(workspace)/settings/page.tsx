"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Download, Laptop, Trash2, UserPlus } from "lucide-react";
import { product } from "@/config/product";
import { businessCategories, providerInfo } from "@/content/app/services";
import { audit, changePassword, deleteAccount, uid, updateWorkspace, useSession } from "@/lib/app/store";
import type { AssistantProfile, Business, NotificationKind, ProviderId, TeamRole } from "@/lib/app/types";
import { ConnectAccount } from "@/components/app/ConnectAccount";
import { Btn, Card, Field, Input, Notice, PageHeader, Pill, Select, TextArea, Toggle, fmtDateTime } from "@/components/app/ui";

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20">
      <h2 id={`${id}-h`} className="text-lg font-semibold">
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
      <Card className="mt-4 space-y-4">{children}</Card>
    </section>
  );
}

const notifLabels: Record<NotificationKind, string> = {
  lead: "New lead",
  review: "New review",
  message: "Important message",
  automation_failed: "Failed automation",
  published: "Published content",
  upcoming: "Upcoming scheduled content",
  payment: "Payments",
  expiry: "Service expiry",
  connection: "Account connection issue",
};

const roleText: Record<TeamRole, string> = {
  owner: "Everything, including billing and deleting the workspace",
  manager: "Services, content, leads and messages — no billing",
  viewer: "Can view dashboards and activity only",
};

export default function SettingsPage() {
  const { user, workspace: ws } = useSession();
  const router = useRouter();
  const [biz, setBiz] = useState<Business | null>(ws?.business ?? null);
  const [asst, setAsst] = useState<AssistantProfile | null>(ws?.assistant ?? null);
  const [saved, setSaved] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleteError, setDeleteError] = useState("");

  if (!ws || !user || !biz || !asst) return null;

  const flash = (s: string) => {
    setSaved(s);
    setTimeout(() => setSaved(""), 2500);
  };
  const setB = (k: keyof Business) => (e: { target: { value: string } }) => setBiz({ ...biz, [k]: e.target.value });
  const setA = (k: keyof AssistantProfile) => (e: { target: { value: string } }) => setAsst({ ...asst, [k]: e.target.value });

  async function onPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const next = String(f.get("next"));
    if (next.length < 8) return setPwMsg({ ok: false, text: "Use at least 8 characters." });
    const res = await changePassword(String(f.get("current")), next);
    setPwMsg(res.ok ? { ok: true, text: "Password changed." } : { ok: false, text: res.error });
    if (res.ok) form.reset();
  }

  function addMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const email = String(f.get("email")).trim();
    if (!email) return;
    updateWorkspace((w) => {
      w.team.push({ id: uid(), name: email.split("@")[0], email, role: f.get("role") as TeamRole });
      audit(w, `Invited ${email} as ${f.get("role")}`);
    });
    form.reset();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ account: { name: user!.name, email: user!.email, phone: user!.phone, country: user!.country }, workspace: ws }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${product.name.toLowerCase()}-${biz!.name.toLowerCase().replace(/\W+/g, "-")}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    updateWorkspace((w) => audit(w, "Exported workspace data"));
  }

  const providers = Object.keys(providerInfo) as ProviderId[];

  return (
    <div className="space-y-10">
      <PageHeader title="Settings" subtitle="Business, assistant, connected accounts, notifications, security and privacy." />
      {saved && (
        <div role="status" className="fixed inset-x-0 top-16 z-50 mx-auto w-fit rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {saved}
        </div>
      )}

      <Section id="business" title="Business settings">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" htmlFor="s-name">
            <Input id="s-name" value={biz.name} onChange={setB("name")} />
          </Field>
          <Field label="Business type" htmlFor="s-cat">
            <Select id="s-cat" value={biz.category} onChange={setB("category")}>
              {businessCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Phone" htmlFor="s-phone">
            <Input id="s-phone" value={biz.phone} onChange={setB("phone")} />
          </Field>
          <Field label="Email" htmlFor="s-email">
            <Input id="s-email" value={biz.email} onChange={setB("email")} />
          </Field>
          <Field label="Address" htmlFor="s-addr">
            <Input id="s-addr" value={biz.address} onChange={setB("address")} />
          </Field>
          <Field label="City" htmlFor="s-city">
            <Input id="s-city" value={biz.city} onChange={setB("city")} />
          </Field>
          <Field label="Working hours" htmlFor="s-hours">
            <Input id="s-hours" value={biz.hours} onChange={setB("hours")} />
          </Field>
          <Field label="Logo" htmlFor="s-logo" help="PNG or JPG, shown on your website and invoices.">
            <Input
              id="s-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-fg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 300_000) return flash("Please pick a logo under 300 KB");
                const r = new FileReader();
                r.onload = () => setBiz({ ...biz, logo: String(r.result) });
                r.readAsDataURL(file);
              }}
            />
          </Field>
        </div>
        {biz.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={biz.logo} alt={`${biz.name} logo`} className="size-16 rounded-xl bg-white object-contain p-1" />
        )}
        <Field label="Description" htmlFor="s-desc">
          <TextArea id="s-desc" value={biz.description} onChange={setB("description")} />
        </Field>
        <Field label="Services / products" htmlFor="s-services">
          <TextArea id="s-services" value={biz.services} onChange={setB("services")} />
        </Field>
        <Btn
          onClick={() => {
            updateWorkspace((w) => {
              w.business = biz;
              audit(w, "Business settings updated");
            });
            flash("Business settings saved");
          }}
        >
          Save business settings
        </Btn>
      </Section>

      <Section id="assistant" title={`${product.assistantName} settings`} subtitle={`How ${product.assistantName} talks — language, tone and personality.`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Language" htmlFor="s-alang">
            <Input id="s-alang" value={asst.language} onChange={setA("language")} />
          </Field>
          <Field label="Tone" htmlFor="s-atone">
            <Input id="s-atone" value={asst.tone} onChange={setA("tone")} />
          </Field>
          <Field label="Personality" htmlFor="s-apers">
            <Input id="s-apers" value={asst.personality} onChange={setA("personality")} />
          </Field>
        </div>
        <Field label="Welcome message" htmlFor="s-awel">
          <TextArea id="s-awel" value={asst.welcome} onChange={setA("welcome")} />
        </Field>
        <Btn
          onClick={() => {
            updateWorkspace((w) => {
              w.assistant = { ...asst, name: product.assistantName };
              audit(w, "Assistant settings updated");
            });
            flash("Assistant settings saved");
          }}
        >
          Save assistant settings
        </Btn>
      </Section>

      <Section id="accounts" title="Connected accounts" subtitle={`${product.name} only uses the permissions you grant. Disconnect any time.`}>
        {product.previewMode && <Notice tone="amber">Preview mode: connections are simulated. In the live app each one opens the platform&apos;s own secure sign-in.</Notice>}
        <div className="space-y-3">
          {providers.map((p) => (
            <ConnectAccount key={p} ws={ws} provider={p} />
          ))}
        </div>
      </Section>

      <Section id="notifications" title="Notifications" subtitle="Choose what you want to be told about.">
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(notifLabels) as NotificationKind[]).map((k) => (
            <Toggle
              key={k}
              label={notifLabels[k]}
              checked={ws.notificationPrefs[k]}
              onChange={(v) => updateWorkspace((w) => void (w.notificationPrefs[k] = v))}
            />
          ))}
        </div>
      </Section>

      <Section id="security" title="Security">
        <form onSubmit={onPassword} className="space-y-3">
          <p className="text-sm font-semibold">Change password</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Current password" htmlFor="pw-cur">
              <Input id="pw-cur" name="current" type="password" autoComplete="current-password" required />
            </Field>
            <Field label="New password" htmlFor="pw-new">
              <Input id="pw-new" name="next" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
          </div>
          {pwMsg && <Notice tone={pwMsg.ok ? "blue" : "amber"}>{pwMsg.text}</Notice>}
          <Btn type="submit" size="sm" variant="ghost" disabled={ws.sample}>
            Update password
          </Btn>
          {ws.security.lastPasswordChange && <p className="text-xs text-fg-subtle">Last changed {fmtDateTime(ws.security.lastPasswordChange)}</p>}
        </form>

        <div className="border-t border-white/[0.06] pt-4">
          <Toggle
            label="Two-factor authentication (code by SMS or authenticator app)"
            checked={ws.security.twoFactor}
            onChange={(v) =>
              updateWorkspace((w) => {
                w.security.twoFactor = v;
                audit(w, v ? "Two-factor authentication turned on" : "Two-factor authentication turned off");
              })
            }
          />
          {product.previewMode && ws.security.twoFactor && <p className="mt-2 text-xs text-fg-subtle">Codes are sent once the app is connected to its backend.</p>}
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <p className="mb-2 text-sm font-semibold">Active sessions</p>
          <div className="flex items-center gap-3 rounded-xl bg-ink-900 p-3 text-sm">
            <Laptop className="size-5 text-fg-muted" aria-hidden />
            <span className="flex-1">This device</span>
            <Pill tone="green">Current</Pill>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <p className="mb-2 text-sm font-semibold">Team & permissions</p>
          <ul className="space-y-2">
            {ws.team.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-900 p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-fg-subtle">
                    {m.email} · {roleText[m.role]}
                  </p>
                </div>
                {m.role === "owner" ? (
                  <Pill tone="ember">Owner</Pill>
                ) : (
                  <>
                    <label htmlFor={`role-${m.id}`} className="sr-only">
                      Role for {m.email}
                    </label>
                    <Select
                      id={`role-${m.id}`}
                      value={m.role}
                      className="w-auto py-1.5 text-xs"
                      onChange={(e) => updateWorkspace((w) => void (w.team.find((x) => x.id === m.id)!.role = e.target.value as TeamRole))}
                    >
                      <option value="manager">Manager</option>
                      <option value="viewer">Viewer</option>
                    </Select>
                    <Btn size="sm" variant="subtle" aria-label={`Remove ${m.email}`} onClick={() => updateWorkspace((w) => void (w.team = w.team.filter((x) => x.id !== m.id)))}>
                      <Trash2 className="size-3.5" aria-hidden />
                    </Btn>
                  </>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={addMember} className="mt-3 flex flex-wrap gap-2">
            <label htmlFor="inv-email" className="sr-only">
              Team member email
            </label>
            <Input id="inv-email" name="email" type="email" placeholder="colleague@business.com" className="min-w-0 flex-1" required />
            <label htmlFor="inv-role" className="sr-only">
              Role
            </label>
            <Select id="inv-role" name="role" className="w-auto">
              <option value="manager">Manager</option>
              <option value="viewer">Viewer</option>
            </Select>
            <Btn type="submit" variant="ghost">
              <UserPlus className="size-4" aria-hidden /> Invite
            </Btn>
          </form>
        </div>
      </Section>

      <Section id="privacy" title="Privacy & data">
        <p className="text-sm text-fg-muted">Your business data belongs to you. It is kept separate from every other {product.name} customer and is never used to train shared models.</p>
        <div className="flex flex-wrap gap-2">
          <Btn variant="ghost" onClick={exportData}>
            <Download className="size-4" aria-hidden /> Export my data
          </Btn>
        </div>
        <div className="rounded-xl border border-red-400/20 p-4">
          <p className="text-sm font-semibold text-red-200">Delete account</p>
          <p className="mt-1 text-xs text-fg-muted">Deletes your account, workspace and every connection. This can&apos;t be undone. Type DELETE to confirm.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label htmlFor="del" className="sr-only">
              Type DELETE to confirm
            </label>
            <Input id="del" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} className="max-w-40" />
            <Btn
              variant="danger"
              disabled={confirmDelete !== "DELETE"}
              onClick={async () => {
                setDeleteError("");
                if (await deleteAccount()) router.replace("/app");
                else setDeleteError("Couldn't delete your account. Check your connection and try again.");
              }}
            >
              Delete everything
            </Btn>
          </div>
          {deleteError && (
            <Notice tone="amber" className="mt-3">
              {deleteError}
            </Notice>
          )}
        </div>
      </Section>

      <Section id="audit" title="Audit log" subtitle="Who changed what in this workspace.">
        <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
          {ws.audit.slice(0, 50).map((a, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>{a.action}</span>
              <span className="shrink-0 text-xs text-fg-subtle">{fmtDateTime(a.at)}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
