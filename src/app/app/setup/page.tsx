"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Globe } from "lucide-react";
import { product } from "@/config/product";
import { businessCategories } from "@/content/app/services";
import { countries } from "@/content/app/countries";
import { audit, logActivity, nowIso, updateWorkspace, useSession } from "@/lib/app/store";
import type { AssistantProfile, Business, User } from "@/lib/app/types";
import { BrandLogo, Btn, Field, FullScreenLoader, Input, Notice, Select, TextArea } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const tones = ["Warm & friendly", "Professional", "Short & direct", "Fun & playful", "Luxury & elegant"];
const personalities = ["Helpful host", "Expert advisor", "Caring receptionist", "Energetic salesperson", "Calm concierge"];

const steps = ["Business type", "Business details", "What you offer"];

export default function SetupPage() {
  const { ready, user, workspace } = useSession();
  const router = useRouter();
  // Set when the wizard finishes, so this guard doesn't override the wizard's own redirect.
  const finished = useRef(false);

  useEffect(() => {
    if (!ready || finished.current) return;
    if (!user) router.replace("/app/login");
    else if (workspace?.business && workspace.assistant) router.replace("/app/home");
  }, [ready, user, workspace, router]);

  if (!ready || !user) return <FullScreenLoader />;
  return <SetupWizard user={user} onFinish={() => (finished.current = true)} />;
}

function SetupWizard({ user, onFinish }: { user: User; onFinish: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [hasSite, setHasSite] = useState<"yes" | "no" | "">("");
  const [biz, setBiz] = useState<Business>({
    category: "",
    name: "",
    ownerName: user.name,
    phone: user.phone,
    email: user.email,
    address: "",
    city: "",
    country: user.country,
    websiteUrl: "",
    description: "",
    hours: "",
    services: "",
    targetCustomers: "",
    socialLinks: "",
  });
  // IBAX is set up with sensible defaults; the owner can change them any time in Settings.
  const assistant: AssistantProfile = { name: product.assistantName, language: "English", tone: tones[0], personality: personalities[0], welcome: "" };

  const set = (k: keyof Business) => (e: { target: { value: string } }) => setBiz((b) => ({ ...b, [k]: e.target.value }));
  const welcome = assistant.welcome || `Hi! I'm ${product.assistantName} from ${biz.name || "our business"}. How can I help you today?`;

  function next() {
    setError("");
    if (step === 0 && !biz.category) return setError("Choose the type of business you run.");
    if (step === 1 && (!biz.name || !biz.phone || !biz.city)) return setError("Add your business name, phone and city.");
    if (step === 2 && (!biz.description || !biz.services)) return setError("Add a short description and what you offer — your assistant answers customers from this.");
    if (step === 2 && !hasSite) return setError("Tell us whether you already have a website.");
    if (step < steps.length - 1) return setStep(step + 1);
    finish();
  }

  function finish() {
    onFinish();
    updateWorkspace((ws) => {
      ws.business = { ...biz, websiteUrl: hasSite === "yes" ? biz.websiteUrl : "" };
      ws.assistant = { ...assistant, name: product.assistantName, welcome };
      if (hasSite === "yes" && biz.websiteUrl) {
        ws.connections.website = { provider: "website", account: biz.websiteUrl, status: "connected", connectedAt: nowIso(), simulated: true };
        ws.website = { status: "live", template: "classic", pages: [], headline: "", about: "", accent: "#15803d", connectedUrl: biz.websiteUrl, updatedAt: nowIso() };
      }
      logActivity(ws, { kind: "system", title: `${product.assistantName} is ready for ${biz.name}` });
      audit(ws, "Business profile and assistant created");
    });
    router.push(hasSite === "no" ? "/app/home?welcome=website" : "/app/home?welcome=1");
  }

  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="flex items-center gap-2">
          <BrandLogo size="sm" />
          <span className="ml-auto text-xs text-fg-subtle">
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <span key={s} className={cn("h-1 rounded-full", i <= step ? "bg-flow" : "bg-white/10")} />
          ))}
        </div>

        <div className="mt-8">
          {step === 0 && (
            <section>
              <h1 className="display text-3xl">What type of business do you run?</h1>
              <p className="mt-2 text-sm text-fg-muted">{product.name} tailors its assistants and content to your industry.</p>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {businessCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={biz.category === c}
                    onClick={() => setBiz((b) => ({ ...b, category: c }))}
                    className={cn(
                      "flex h-12 items-center justify-between rounded-xl border px-3.5 text-left text-sm transition-colors",
                      biz.category === c ? "border-flow/60 bg-flow/12 text-fg" : "border-white/10 bg-ink-900 text-fg-muted hover:border-white/20 hover:text-fg",
                    )}
                  >
                    {c}
                    {biz.category === c && <Check className="size-4 text-flow" aria-hidden />}
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-4">
              <h1 className="display text-3xl">Your business details</h1>
              <Field label="Business name" htmlFor="b-name" required>
                <Input id="b-name" value={biz.name} onChange={set("name")} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Owner name" htmlFor="b-owner">
                  <Input id="b-owner" value={biz.ownerName} onChange={set("ownerName")} />
                </Field>
                <Field label="Business phone" htmlFor="b-phone" required>
                  <Input id="b-phone" type="tel" value={biz.phone} onChange={set("phone")} />
                </Field>
              </div>
              <Field label="Business email" htmlFor="b-email">
                <Input id="b-email" type="email" value={biz.email} onChange={set("email")} />
              </Field>
              <Field label="Address" htmlFor="b-address">
                <Input id="b-address" value={biz.address} onChange={set("address")} autoComplete="street-address" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City" htmlFor="b-city" required>
                  <Input id="b-city" value={biz.city} onChange={set("city")} />
                </Field>
                <Field label="Country" htmlFor="b-country">
                  <Select id="b-country" value={biz.country} onChange={set("country")}>
                    {countries.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Working hours" htmlFor="b-hours">
                <Input id="b-hours" value={biz.hours} onChange={set("hours")} placeholder="Mon–Sat, 9 AM – 7 PM" />
              </Field>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <h1 className="display text-3xl">What you offer</h1>
              <Field label="Describe your business" htmlFor="b-desc" required help="Two or three sentences, the way you'd describe it to a new customer.">
                <TextArea id="b-desc" value={biz.description} onChange={set("description")} />
              </Field>
              <Field label="Services / products" htmlFor="b-services" required>
                <TextArea id="b-services" value={biz.services} onChange={set("services")} placeholder="Haircuts, colouring, bridal makeup…" />
              </Field>
              <Field label="Target customers" htmlFor="b-target">
                <Input id="b-target" value={biz.targetCustomers} onChange={set("targetCustomers")} placeholder="Working professionals within 5 km" />
              </Field>
              <Field label="Social media links" htmlFor="b-social">
                <Input id="b-social" value={biz.socialLinks} onChange={set("socialLinks")} placeholder="instagram.com/yourbusiness" />
              </Field>

              <fieldset className="space-y-2">
                <legend className="text-[0.8rem] font-medium">Do you have a website?</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={hasSite === v}
                      onClick={() => setHasSite(v)}
                      className={cn("h-11 rounded-xl border text-sm", hasSite === v ? "border-flow/60 bg-flow/12" : "border-white/10 bg-ink-900 text-fg-muted")}
                    >
                      {v === "yes" ? "Yes, I have one" : "No, not yet"}
                    </button>
                  ))}
                </div>
              </fieldset>
              {hasSite === "yes" && (
                <Field label="Website URL" htmlFor="b-url" help={`${product.name} connects it so website enquiries arrive in your Leads.`}>
                  <Input id="b-url" type="url" value={biz.websiteUrl} onChange={set("websiteUrl")} placeholder="https://" />
                </Field>
              )}
              {hasSite === "no" && (
                <Notice>
                  <Globe className="mr-1.5 inline size-4" aria-hidden />
                  Don&apos;t have a website? No problem — {product.name} can build one from these details. We&apos;ll show you how after setup.
                </Notice>
              )}
            </section>
          )}
        </div>

        {error && (
          <Notice tone="amber" className="mt-6">
            {error}
          </Notice>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Btn variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Btn>
          <Btn onClick={next}>
            {step === steps.length - 1 ? `Start ${product.assistantName}` : "Continue"} <ArrowRight className="size-4" aria-hidden />
          </Btn>
        </div>
      </div>
    </div>
  );
}
