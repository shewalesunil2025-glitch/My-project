"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { DemoDialog } from "./DemoDialog";

type DemoContextValue = { openDemo: (interest?: string) => void };

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openDemo = useCallback((interest?: string) => {
    if (siteConfig.bookingUrl) {
      window.open(siteConfig.bookingUrl, "_blank", "noopener,noreferrer");
      return;
    }
    dialogRef.current?.dispatchEvent(new CustomEvent("nexa:interest", { detail: interest ?? "" }));
    dialogRef.current?.showModal();
  }, []);

  const value = useMemo(() => ({ openDemo }), [openDemo]);

  return (
    <DemoContext.Provider value={value}>
      {children}
      <DemoDialog ref={dialogRef} />
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
