export default function BrandVoicePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Brand voice</h1>
        <p className="mt-1 text-sm text-muted">
          Editor lands here in Sprint 2. The underlying prompt file lives at
          <code className="ml-1 rounded bg-surface px-1 font-mono text-xs text-ink">
            apps/web/lib/prompts/brand-voice.md
          </code>
          once the Analyst Agent ships.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
        Brand voice editor arrives in Sprint 2.
      </div>
    </div>
  );
}
