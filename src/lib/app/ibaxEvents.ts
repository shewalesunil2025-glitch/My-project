"use client";

/** Opens the IBAX chat panel from anywhere in the workspace, optionally sending a first message. */
export function openIbaxChat(message?: string) {
  window.dispatchEvent(new CustomEvent("ibax:open", { detail: { message } }));
}
