import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** The seats a user has picked but not yet held. Survives a page refresh. */
interface Draft {
  showId: string;
  seats: string[];
}

interface BookingDraftState {
  draft: Draft | null;
  setDraft: (d: Draft | null) => void;
  clear: () => void;
}

const KEY = 'vc:draft';
const Ctx = createContext<BookingDraftState | null>(null);

function read(): Draft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<Draft | null>(read);

  useEffect(() => {
    try {
      if (draft) sessionStorage.setItem(KEY, JSON.stringify(draft));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }, [draft]);

  const setDraft = useCallback((d: Draft | null) => setDraftState(d), []);
  const clear = useCallback(() => setDraftState(null), []);
  const value = useMemo(() => ({ draft, setDraft, clear }), [draft, setDraft, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBookingDraft(): BookingDraftState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBookingDraft must be used inside BookingProvider');
  return ctx;
}
