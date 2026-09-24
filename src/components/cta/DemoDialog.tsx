"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { X } from "lucide-react";
import { DemoRequestForm } from "./DemoRequestForm";

/**
 * Native <dialog> gives us focus trapping, Esc-to-close and inert background
 * for free — no custom focus management needed.
 */
export const DemoDialog = forwardRef<HTMLDialogElement>(function DemoDialog(_, ref) {
  const innerRef = useRef<HTMLDialogElement>(null);
  const [interest, setInterest] = useState("");
  const [formKey, setFormKey] = useState(0);

  useImperativeHandle(ref, () => innerRef.current as HTMLDialogElement);

  useEffect(() => {
    const dialog = innerRef.current;
    if (!dialog) return;
    const onInterest = (e: Event) => {
      setInterest((e as CustomEvent<string>).detail);
      setFormKey((k) => k + 1);
    };
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener("nexa:interest", onInterest);
    dialog.addEventListener("click", onClick);
    return () => {
      dialog.removeEventListener("nexa:interest", onInterest);
      dialog.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <dialog
      ref={innerRef}
      aria-labelledby="demo-dialog-title"
      className="m-auto w-[min(34rem,calc(100vw-2rem))] max-h-[calc(100svh-2rem)] overflow-y-auto rounded-3xl border border-white/10 bg-ink-850/95 p-0 text-fg shadow-2xl backdrop:bg-ink-950/70 backdrop:backdrop-blur-sm open:animate-[dialog-in_0.5s_var(--ease-out-expo)]"
    >
      <div className="relative p-6 sm:p-9">
        <button
          type="button"
          onClick={() => innerRef.current?.close()}
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
          aria-label="Close"
        >
          <X className="size-5" aria-hidden />
        </button>
        <p className="eyebrow mb-3">Free 30-minute demo</p>
        <h2 id="demo-dialog-title" className="display text-3xl sm:text-4xl">
          See your business, <span className="text-flow">automated.</span>
        </h2>
        <p className="mt-3 text-fg-muted">
          Tell us a little about your business. We&apos;ll show you exactly what we would build.
        </p>
        <DemoRequestForm key={formKey} defaultInterest={interest} className="mt-7" />
      </div>
    </dialog>
  );
});
