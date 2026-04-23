import Link from "next/link";
import { getKillSwitchState } from "@/lib/storage/repository";
import { KillSwitchControl } from "@/components/kill-switch-control";

const nav = [
  { href: "/dashboard/queue", label: "Approval queue" },
  { href: "/dashboard/insights", label: "Signal events" },
  { href: "/dashboard/content-history", label: "Content history" },
  { href: "/dashboard/brand-voice", label: "Brand voice" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const killSwitch = await getKillSwitchState();
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-ink">
            Insiders Lab — Agent Platform
          </Link>
          <nav className="flex gap-4 text-sm text-muted">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-ink">
                {n.label}
              </Link>
            ))}
          </nav>
          <KillSwitchControl initial={killSwitch} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
