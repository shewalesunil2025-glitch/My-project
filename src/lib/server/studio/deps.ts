import type { SupabaseClient } from "@supabase/supabase-js";
import { founderEmails } from "@/lib/server/founder";
import { mailReady, sendMail } from "@/lib/server/mail";
import { notifyOwner } from "@/lib/server/wa/service";
import { picture, research, thumbnailPrompt, voice, writePlan } from "./generate";
import type { Deps, Storage } from "./jobs";
import { publishers } from "./publish";

/** The real wiring: Supabase storage (private "studio" bucket), Gemini, the founder's notifications. */

const BUCKET = "studio";

export function supabaseStorage(db: SupabaseClient): Storage {
  const b = () => db.storage.from(BUCKET);
  return {
    async upload(path, data, type) {
      const { error } = await b().upload(path, data, { contentType: type, upsert: true });
      if (error) throw new Error(`storage: ${error.message}`);
    },
    async signedUrl(path, seconds) {
      const { data, error } = await b().createSignedUrl(path, seconds);
      if (error || !data?.signedUrl) throw new Error(`storage: ${error?.message ?? "no link"}`);
      return data.signedUrl;
    },
    async signedUpload(path) {
      const { data, error } = await b().createSignedUploadUrl(path, { upsert: true });
      if (error || !data?.signedUrl) throw new Error(`storage: ${error?.message ?? "no upload link"}`);
      return data.signedUrl;
    },
    async exists(path) {
      const dir = path.split("/").slice(0, -1).join("/");
      const name = path.split("/").pop();
      const { data } = await b().list(dir, { search: name });
      return (data ?? []).some((f) => f.name === name);
    },
  };
}

let founderId: string | null = null;
async function founderUserId(db: SupabaseClient) {
  if (founderId) return founderId;
  const emails = founderEmails();
  for (let page = 1; page <= 10; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    const u = data?.users.find((x) => emails.includes((x.email ?? "").toLowerCase()));
    if (u) return (founderId = u.id);
    if (!data || data.users.length < 1000) break;
  }
  return null;
}

export function studioDeps(db: SupabaseClient): Deps {
  return {
    db,
    storage: supabaseStorage(db),
    ai: { research, writePlan, picture, voice, thumbnailPrompt },
    publishers: [publishers.instagram, publishers.youtube],
    async notify(title, detail) {
      const id = await founderUserId(db).catch(() => null);
      if (id) await notifyOwner(db, id, "message", title, detail, "/app/founder/studio");
      const to = process.env.STUDIO_NOTIFY_EMAIL || founderEmails()[0];
      if (mailReady() && to) await sendMail({ to, subject: title, text: `${detail}\n\nOpen: https://www.ibaxai.com/app/founder/studio` }).catch(() => undefined);
    },
  };
}
