import type { SupabaseClient } from "@supabase/supabase-js";
import { evo } from "./whatsapp";

/**
 * Freeing a WhatsApp number on the Evolution server. A deleted account's rows go away on their own
 * (on delete cascade), but its Evolution instance used to stay, so the number looked "linked to
 * another ibaxai account" forever. These helpers remove such left-over instances.
 */

/** No account owns this number in our database (the owner is gone), whatever the Evolution server still holds. */
export async function isOrphan(db: SupabaseClient, instance: string) {
  const [{ data: i }, { data: c }] = await Promise.all([
    db.from("wa_instances").select("instance").eq("instance", instance).maybeSingle(),
    db.from("wa_cloud").select("instance").eq("instance", instance).maybeSingle(),
  ]);
  return !i && !c;
}

/** Logs the number out and deletes its Evolution instance. True when it is gone (or never was there). */
export async function deleteInstance(instance: string) {
  const name = encodeURIComponent(instance);
  await evo(`/instance/logout/${name}`, { method: "DELETE" }).catch(() => null);
  const r = await evo(`/instance/delete/${name}`, { method: "DELETE" }).catch(() => null);
  return Boolean(r && (r.ok || r.status === 404));
}
