"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { product } from "@/config/product";
import { sendToAgent } from "@/lib/app/agentClient";
import { useWorkspace } from "@/components/app/AppShell";
import { IbaxChat } from "@/components/app/IbaxChat";

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
    <div className="mx-auto flex h-[calc(100dvh-12rem)] max-w-3xl flex-col overflow-hidden rounded-[1.6rem] border border-flow/25 shadow-[0_40px_100px_-30px_rgb(0_0_0/0.95),0_0_60px_-30px_rgb(102_211_76/0.6)] [background:linear-gradient(180deg,rgb(102_211_76/0.1),transparent_30%),var(--color-ink-900)] lg:h-[calc(100dvh-8rem)]">
      <h1 className="sr-only">Ask {product.assistantName}</h1>
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
