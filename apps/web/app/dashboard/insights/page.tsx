import { listRecentAgentRuns, listRecentSignalEvents } from "@/lib/storage/repository";
import { TriggerSignalButton } from "@/components/trigger-signal-button";

export const dynamic = "force-dynamic";

function scoreBadge(score: number): string {
  if (score >= 0.7) return "bg-accent/15 text-accent";
  if (score >= 0.5) return "bg-warn/15 text-warn";
  return "bg-border text-muted";
}

export default async function InsightsPage() {
  const [events, runs] = await Promise.all([
    listRecentSignalEvents(50),
    listRecentAgentRuns(10),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Signal events</h1>
          <p className="mt-1 text-sm text-muted">
            Ranked triggers from the Signal Agent. No publishing — downstream agents consume these.
          </p>
        </div>
        <TriggerSignalButton />
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Recent agent runs
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-bg/60 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2">Agent</th>
                <th className="px-4 py-2">Trigger</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Summary</th>
                <th className="px-4 py-2">Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={5}>
                    No runs yet. Trigger a scan above.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs">{r.agentId}</td>
                    <td className="px-4 py-2 text-xs text-muted">{r.triggeredBy}</td>
                    <td className="px-4 py-2 text-xs">{r.status}</td>
                    <td className="px-4 py-2 text-xs text-muted">{r.outputSummary ?? ""}</td>
                    <td className="px-4 py-2 text-xs text-muted">
                      {new Date(r.startedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Signal events ({events.length})
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {events.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
              No events yet. Trigger a signal scan to populate the queue.
            </div>
          ) : (
            events.map((e) => (
              <article
                key={e.id}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <header className="flex items-center gap-2 text-xs text-muted">
                  <span
                    className={`rounded px-2 py-0.5 font-medium ${scoreBadge(e.viralScore)}`}
                  >
                    {e.viralScore.toFixed(2)}
                  </span>
                  <span className="font-mono">{e.triggerType}</span>
                  <span>·</span>
                  <span>{e.suggestedAngle.replace(/_/g, " ")}</span>
                  {e.hasBeenCoveredRecently ? (
                    <span className="ml-auto rounded bg-warn/15 px-2 py-0.5 text-warn">
                      covered recently
                    </span>
                  ) : null}
                </header>
                <p className="mt-2 text-sm text-ink">{e.analysisBrief}</p>
                <footer className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  <span>tickers: {e.relatedTickers.join(", ") || "—"}</span>
                  <span>insiders: {e.relatedInsiders.join(", ") || "—"}</span>
                  <span>filings: {e.relatedTrades.length}</span>
                </footer>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
