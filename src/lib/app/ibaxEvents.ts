"use client";

import type { Attachment } from "@/lib/attachments";

/** Opens the IBAX chat panel from anywhere in the workspace, optionally sending a first message. */
export function openIbaxChat(message?: string) {
  window.dispatchEvent(new CustomEvent("ibax:open", { detail: { message } }));
}

/* A file or "Create image" picked from the + on the Ask bar, handed to the chat panel. */
let pending: { file?: Attachment; imageMode?: boolean } | null = null;

export function openIbaxChatWith(next: { file?: Attachment; imageMode?: boolean }) {
  pending = next;
  openIbaxChat();
  window.dispatchEvent(new CustomEvent("ibax:pending"));
}

export function takePending() {
  const p = pending;
  pending = null;
  return p;
}
