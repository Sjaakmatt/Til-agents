"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function TriggerSignalButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    startTransition(async () => {
      setMessage(null);
      try {
        const res = await fetch("/api/agents/signal/run", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "failed");
        setMessage(
          data.skipped
            ? "Skipped: kill-switch active"
            : `Produced ${data.events?.length ?? 0} events`,
        );
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {message ? <span className="text-xs text-muted">{message}</span> : null}
      <button
        onClick={run}
        disabled={pending}
        className="rounded-md border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
      >
        {pending ? "Running…" : "Run Signal scan"}
      </button>
    </div>
  );
}
