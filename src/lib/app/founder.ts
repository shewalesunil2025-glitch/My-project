import { useEffect, useState } from "react";
import { cloudAuthHeader } from "./cloud";

/** WhatsApp chat link for a client's phone (a bare 10-digit number is taken as Indian). */
export const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^0+/, "").replace(/^(\d{10})$/, "91$1")}`;

/* ── Is the signed-in account the founder? The server decides; this only shows the links. ── */

const known = new Map<string, Promise<boolean>>();

function checkFounder(userId: string) {
  let answer = known.get(userId);
  if (!answer) {
    answer = cloudAuthHeader()
      .then((headers) => fetch("/api/founder?check=1", { headers }))
      .then((res) => res.ok)
      .catch(() => false);
    known.set(userId, answer);
  }
  return answer;
}

/** True when this account may open the Founder Console (asked once per account per visit). */
export function useIsFounder(userId: string | undefined) {
  const [founder, setFounder] = useState(false);
  useEffect(() => {
    if (!userId) return;
    let live = true;
    void checkFounder(userId).then((ok) => live && setFounder(ok));
    return () => {
      live = false;
    };
  }, [userId]);
  return founder;
}
