import { listPendingApprovalItems } from "@/lib/storage/repository";
import { ApprovalActions } from "@/components/approval-actions";

export const dynamic = "force-dynamic";

export default async function ApprovalQueuePage() {
  const items = await listPendingApprovalItems();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Approval queue</h1>
        <p className="mt-1 text-sm text-muted">
          Drafts awaiting review. Sprint 1 ships with the queue empty — writing agents arrive in
          Sprint 2.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
          No pending items. Once the Analyst and Historian agents land, their drafts will appear
          here.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Draft</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ approval, draft }) => (
                <tr key={approval.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 font-mono text-xs">{approval.kanaal}</td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-3 text-sm text-ink">{draft.text}</p>
                    <p className="mt-1 text-xs text-muted">agent: {draft.agentId}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {(draft.confidenceScore * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(approval.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ApprovalActions id={approval.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
