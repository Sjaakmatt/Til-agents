"use client";

import { useState, useTransition } from "react";

interface Props {
  initial: { enabled: boolean; reason: string; updatedAt: string };
}

export function KillSwitchControl({ initial }: Props) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !state.enabled;
    const reason = next
      ? prompt("Reason for enabling kill-switch?") ?? "manual"
      : "released by operator";
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch("/api/kill-switch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ enable: next, reason }),
        });
        if (!res.ok) throw new Error(await res.text());
        setState(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${
          state.enabled ? "bg-danger/15 text-danger" : "bg-accent/15 text-accent"
        }`}
      >
        {state.enabled ? "Publishing paused" : "Publishing enabled"}
      </span>
      <button
        onClick={toggle}
        disabled={pending}
        className="rounded-md border border-border bg-bg px-3 py-1.5 text-xs font-medium text-ink hover:border-ink disabled:opacity-50"
      >
        {state.enabled ? "Release" : "Kill-switch"}
      </button>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
