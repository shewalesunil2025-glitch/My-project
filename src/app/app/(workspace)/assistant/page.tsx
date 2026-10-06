"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { product } from "@/config/product";
import { sendToAgent } from "@/lib/app/agentClient";
import { useWorkspace } from "@/components/app/AppShell";
import { IbaxChat } from "@/components/app/IbaxChat";
import { LumiMark } from "@/components/app/ui";

function Chat() {
  const ws = useWorkspace();
  const params = useSearchParams();
  const router = useRouter();
  const sentFromUrl = useRef(false);

  useEffect(() => {
    const initial = params.get("q");
    if (initial && ws && !sentFromUrl.current) {
      sentFromUrl.current = true;
      router.replace("/app/assistant");
      void sendToAgent(initial);
    }
  }, [params, ws, router]);

  if (!ws?.assistant) return null;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <LumiMark className="size-11" />
        <div>
          <h1 className="text-lg font-semibold">Ask {product.assistantName}</h1>
          <p className="text-xs text-fg-muted">Ask anything · activate any service just by chatting · {ws.assistant.language}</p>
        </div>
      </div>
      <IbaxChat ws={ws} />
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense>
      <Chat />
    </Suspense>
  );
}
