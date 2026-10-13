"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, Paperclip, Plus, Sparkles, X } from "lucide-react";
import { acceptFiles, readAttachment, type Attachment } from "@/lib/attachments";
import { cn } from "@/lib/cn";

/**
 * The "+" in the IBAX chats, like ChatGPT and Gemini: attach a photo, PDF or document for
 * IBAX to read, or (in the app) switch to "Create image" mode.
 */
export function AttachMenu({
  onFile,
  onError,
  onImageMode,
  imageMode = false,
  disabled,
}: {
  onFile: (file: Attachment) => void;
  onError: (message: string) => void;
  /** Shown only where image creation is available (the app). */
  onImageMode?: (on: boolean) => void;
  imageMode?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  async function pick(files: FileList | null) {
    const file = files?.[0];
    if (input.current) input.current.value = "";
    if (!file) return;
    setReading(true);
    const result = await readAttachment(file);
    setReading(false);
    if ("error" in result) onError(result.error);
    else onFile(result);
  }

  return (
    <div ref={box} className="relative shrink-0">
      <input ref={input} type="file" accept={acceptFiles} className="hidden" onChange={(e) => void pick(e.target.files)} />
      <button
        type="button"
        disabled={disabled || reading}
        onClick={() => (onImageMode ? setOpen((o) => !o) : input.current?.click())}
        aria-label={onImageMode ? "Attach a file or create an image" : "Attach a photo or document"}
        aria-expanded={onImageMode ? open : undefined}
        className={cn(
          "grid size-11 place-items-center rounded-full border transition-colors disabled:opacity-40",
          imageMode ? "border-flow bg-flow text-ink-950" : "border-white/10 text-fg-muted hover:border-flow/40 hover:text-flow",
        )}
      >
        {reading ? <Paperclip className="size-5 animate-pulse" aria-hidden /> : imageMode ? <Sparkles className="size-5" aria-hidden /> : <Plus className={cn("size-5 transition-transform", open && "rotate-45")} aria-hidden />}
      </button>
      {open && onImageMode && (
        <div role="menu" className="absolute bottom-full left-0 z-30 mb-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-ink-900 p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)]">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              input.current?.click();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/[0.06]"
          >
            <ImagePlus className="size-4 text-flow" aria-hidden />
            <span>
              <span className="block font-medium">Photo or document</span>
              <span className="block text-xs text-fg-subtle">Photo, PDF or text file — IBAX reads it</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onImageMode(!imageMode);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/[0.06]"
          >
            <Sparkles className="size-4 text-flow" aria-hidden />
            <span>
              <span className="block font-medium">{imageMode ? "Stop creating images" : "Create image"}</span>
              <span className="block text-xs text-fg-subtle">Posters, cartoons, posts — free</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/** The attached file above the input, with a remove button. */
export function AttachmentChip({ file, onRemove }: { file: Attachment; onRemove: () => void }) {
  return (
    <div className="mx-3 mb-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 pr-2 text-xs">
      {file.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.thumb} alt="" className="size-10 rounded-lg object-cover" />
      ) : (
        <span className="grid size-10 place-items-center rounded-lg bg-white/[0.06]">
          <FileText className="size-5 text-flow" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{file.name}</span>
      <button type="button" onClick={onRemove} aria-label="Remove file" className="grid size-7 place-items-center rounded-full hover:bg-white/10">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/** A file shown inside a sent message. */
export function SentFile({ file }: { file: { name: string; kind: string; thumb?: string } }) {
  return file.thumb ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={file.thumb} alt={file.name} className="mb-1.5 max-h-44 rounded-xl object-cover" />
  ) : (
    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium opacity-80">
      <FileText className="size-4" aria-hidden /> {file.name}
    </span>
  );
}
