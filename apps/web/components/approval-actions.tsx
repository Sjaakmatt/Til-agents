"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ApprovalActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function decide(action: "approve" | "reject") {
    startTransition(async () => {
      const res = await fetch(`/api/approval-queue/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, approver: "dashboard" }),
      });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="inline-flex gap-2">
      <button
        onClick={() => decide("approve")}
        disabled={pending}
        className="rounded-md border border-accent bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => decide("reject")}
        disabled={pending}
        className="rounded-md border border-danger bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
