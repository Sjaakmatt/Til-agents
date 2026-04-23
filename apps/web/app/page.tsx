import Link from "next/link";

const links = [
  {
    href: "/dashboard/queue",
    title: "Approval queue",
    body: "Pending drafts awaiting review. Approve, reject, or edit in bulk.",
  },
  {
    href: "/dashboard/insights",
    title: "Signal events",
    body: "Live stream of Signal Agent triggers ranked by viral score.",
  },
  {
    href: "/dashboard/content-history",
    title: "Content history",
    body: "Everything the platform has published, grouped by channel.",
  },
  {
    href: "/dashboard/brand-voice",
    title: "Brand voice",
    body: "The prompt injected into every publishing path. Update with care.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">The Insiders Lab</p>
        <h1 className="text-4xl font-semibold">Agent platform</h1>
        <p className="max-w-2xl text-muted">
          Sprint 1 scaffold. Signal Agent produces ranked triggers for downstream agents. No
          publishing yet.
        </p>
      </header>

      <section className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group rounded-lg border border-border bg-surface p-6 transition hover:border-accent"
          >
            <h2 className="text-lg font-medium group-hover:text-accent">{l.title}</h2>
            <p className="mt-2 text-sm text-muted">{l.body}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
