export default function ContentHistoryPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Content history</h1>
        <p className="mt-1 text-sm text-muted">
          Arrives in Sprint 2 when the Editor Agent begins publishing.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
        Nothing published yet. Sprint 1 is triggers-only.
      </div>
    </div>
  );
}
