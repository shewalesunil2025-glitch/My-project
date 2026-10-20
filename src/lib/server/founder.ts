import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { siteConfig } from "@/config/site";

/**
 * The founder console: the owner of ibaxai sees every client's account to help them.
 * Who counts as the founder: the emails in FOUNDER_EMAILS (comma-separated, Vercel env),
 * else the business email. Every check runs on the server; the browser never decides.
 */
export const founderEmails = () =>
  (process.env.FOUNDER_EMAILS || siteConfig.email)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export type Founder = { id: string; email: string; db: SupabaseClient };

/** The signed-in founder behind a request's bearer token, or null for anyone else. */
export async function founderFromRequest(request: Request): Promise<Founder | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !secret || !token) return null;
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !data.user || !email || !data.user.email_confirmed_at || !founderEmails().includes(email)) return null;
  return { id: data.user.id, email, db };
}
