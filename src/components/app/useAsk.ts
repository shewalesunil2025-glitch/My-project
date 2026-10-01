"use client";

import { useCallback, useState } from "react";
import { localAnswer, workspaceContext } from "@/lib/app/assistant";
import { nowIso, uid, updateWorkspace } from "@/lib/app/store";
import type { ChatMessage, Workspace } from "@/lib/app/types";

/**
 * Sends a question to the assistant. Workspace questions and actions are answered
 * locally from the owner's own data; anything else goes to /api/assistant (Claude)
 * when it is configured, and falls back to the built-in answer when it isn't.
 */
export function useAsk(ws: Workspace | null) {
  const [thinking, setThinking] = useState(false);

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!ws || !text || thinking) return;
      const userMsg: ChatMessage = { id: uid(), role: "user", text, at: nowIso() };
      updateWorkspace((w) => {
        w.chat.push(userMsg);
      });

      const local = localAnswer(ws, text);
      let reply: Pick<ChatMessage, "text" | "links"> = { text: local.text, links: local.links };

      if (!local.matched) {
        setThinking(true);
        try {
          const res = await fetch("/api/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: text,
              context: workspaceContext(ws),
              assistantName: ws.assistant?.name,
              history: ws.chat.slice(-8).map((m) => ({ role: m.role, text: m.text })),
            }),
          });
          const data = (await res.json().catch(() => null)) as { ok?: boolean; text?: string } | null;
          if (res.ok && data?.ok && data.text) reply = { text: data.text };
        } catch {
          /* offline or not configured — keep the built-in answer */
        } finally {
          setThinking(false);
        }
      }

      updateWorkspace((w) => {
        local.apply?.(w);
        w.chat.push({ id: uid(), role: "assistant", at: nowIso(), ...reply });
        w.chat = w.chat.slice(-100);
      });
    },
    [ws, thinking],
  );

  return { ask, thinking };
}
