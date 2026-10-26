import { json, ownerCall } from "@/lib/server/wa/http";
import { cloudLinksOf, cloudReady, graph } from "@/lib/server/waCloud";

/**
 * WhatsApp message templates for an owner's Cloud number (Meta approves each one; only approved
 * templates can start a chat or follow up after 24 hours):
 *  - "list": the account's templates and their review status
 *  - "create": a new template (name, language, category, body text with {{1}}, {{2}} … for details)
 *  - "send": sends an approved template to a number, with the details filled in
 */

const CATEGORIES = ["UTILITY", "MARKETING"] as const;
const LANGUAGES = ["en", "en_US", "hi", "mr", "gu", "ta", "te", "kn", "ml", "bn", "pa"] as const;

const vars = (text: string) => [...new Set([...text.matchAll(/\{\{(\d{1,2})\}\}/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);

export async function POST(request: Request) {
  if (!cloudReady()) return json({ ok: false, reason: "not_configured" }, 503);
  const c = await ownerCall(request);
  if ("error" in c) return c.error;
  const { body: b, user } = c;
  const links = await cloudLinksOf(user.id);
  const link = links.find((l) => l.instance === b.instance) ?? links[0];
  if (!link) return json({ ok: false, reason: "not_linked" }, 404);

  if (b.action === "list") {
    const r = await graph(`/${link.wabaId}/message_templates?fields=name,status,category,language,components&limit=50`, link.token);
    if (!r.ok) return json({ ok: false, reason: "meta_error", message: (r.data?.error as { message?: string } | undefined)?.message ?? "" }, 502);
    const list = ((r.data?.data as Record<string, unknown>[] | undefined) ?? []).map((t) => ({
      name: String(t.name ?? ""),
      status: String(t.status ?? ""),
      category: String(t.category ?? ""),
      language: String(t.language ?? ""),
      body: String(((t.components as { type?: string; text?: string }[] | undefined) ?? []).find((x) => x.type === "BODY")?.text ?? ""),
    }));
    return json({ ok: true, templates: list });
  }

  if (b.action === "create") {
    const name = String(b.name ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60);
    const text = String(b.text ?? "").trim().slice(0, 1024);
    const category = CATEGORIES.find((x) => x === b.category) ?? "UTILITY";
    const language = LANGUAGES.find((x) => x === b.language) ?? "en";
    if (!name || !text) return json({ ok: false, reason: "bad_request" }, 400);
    const n = vars(text);
    if (n.some((v, i) => v !== i + 1)) return json({ ok: false, reason: "bad_variables", message: "Number the details {{1}}, {{2}}, {{3}} in order." }, 400);
    const examples = Array.isArray(b.examples) ? b.examples.map((x) => String(x).slice(0, 60)) : [];
    const body: Record<string, unknown> = { type: "BODY", text };
    if (n.length) body.example = { body_text: [n.map((v, i) => examples[i] || `Sample ${v}`)] };
    const r = await graph(`/${link.wabaId}/message_templates`, link.token, { method: "POST", body: JSON.stringify({ name, language, category, components: [body] }) });
    if (!r.ok) return json({ ok: false, reason: "meta_error", message: (r.data?.error as { error_user_msg?: string; message?: string } | undefined)?.error_user_msg ?? (r.data?.error as { message?: string } | undefined)?.message ?? "" }, 502);
    return json({ ok: true, id: r.data?.id ?? null, status: String(r.data?.status ?? "PENDING"), name });
  }

  if (b.action === "send") {
    const to = String(b.to ?? "").replace(/\D/g, "");
    const name = String(b.name ?? "");
    const language = String(b.language ?? "en");
    if (to.length < 8 || to.length > 15 || !/^[a-z0-9_]{1,512}$/.test(name) || !/^[a-zA-Z_]{2,8}$/.test(language)) return json({ ok: false, reason: "bad_request" }, 400);
    const params = Array.isArray(b.params) ? b.params.slice(0, 10).map((x) => ({ type: "text", text: String(x).slice(0, 200) })) : [];
    const template: Record<string, unknown> = { name, language: { code: language } };
    if (params.length) template.components = [{ type: "body", parameters: params }];
    const r = await graph(`/${link.phoneNumberId}/messages`, link.token, { method: "POST", body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template }) });
    if (!r.ok) return json({ ok: false, reason: "meta_error", message: (r.data?.error as { message?: string } | undefined)?.message ?? "" }, 502);
    return json({ ok: true });
  }

  return json({ ok: false, reason: "bad_request" }, 400);
}
