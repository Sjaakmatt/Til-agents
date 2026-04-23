import { randomUUID } from "node:crypto";
import type { InsiderProfile, SignalEvent, SuggestedAngle, TradeFiling, TriggerType } from "@insiders-lab/shared";
import { ContentMemoryClient } from "../mcp-clients/content-memory.js";
import { TradesClient } from "../mcp-clients/trades.js";
import { ToolCallTrace } from "../mcp-clients/trace.js";
import { scoreTrade, type ScoringBreakdown } from "./signal-scoring.js";

export interface SignalRunOptions {
  lookbackHours?: number;
  minViralScore?: number;
  maxEvents?: number;
}

export interface SignalRunResult {
  events: SignalEvent[];
  trace: ToolCallTrace;
  stats: {
    tradesScanned: number;
    eventsProduced: number;
    skippedCoveredRecently: number;
  };
}

function pickTriggerAndAngle(
  breakdown: ScoringBreakdown,
  clusterSize: number,
): { triggerType: TriggerType; suggestedAngle: SuggestedAngle } {
  // Rank components — the strongest one drives the headline angle.
  const entries: Array<[keyof ScoringBreakdown, number]> = [
    ["cluster", breakdown.cluster],
    ["committee", breakdown.committee],
    ["timing", breakdown.timing],
    ["bigDollar", breakdown.bigDollar],
    ["notability", breakdown.notability],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  const [top] = entries;
  switch (top?.[0]) {
    case "cluster":
      return {
        triggerType: "cluster",
        suggestedAngle: clusterSize >= 3 ? "cross_filing" : "sector_rotation",
      };
    case "committee":
      return { triggerType: "committee_match", suggestedAngle: "track_record" };
    case "timing":
      return { triggerType: "timing_anomaly", suggestedAngle: "timing" };
    case "bigDollar":
      return { triggerType: "big_dollar", suggestedAngle: "track_record" };
    case "notability":
      return { triggerType: "big_dollar", suggestedAngle: "track_record" };
    default:
      return { triggerType: "big_dollar", suggestedAngle: "track_record" };
  }
}

function formatUsdRange(low: number, high: number): string {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
  };
  return `${fmt(low)}-${fmt(high)}`;
}

function buildAnalysisBrief(args: {
  trade: TradeFiling;
  profile: InsiderProfile | null;
  breakdown: ScoringBreakdown;
  clusterSize: number;
}): string {
  const { trade, profile, breakdown, clusterSize } = args;
  const who = profile?.name ?? `insider ${trade.insiderId}`;
  const side = trade.side === "buy" ? "bought" : trade.side === "sell" ? "sold" : "exchanged";
  const range = formatUsdRange(trade.amountUsdLow, trade.amountUsdHigh);
  const parts: string[] = [`${who} ${side} ${trade.ticker} (${range}) filed ${trade.filingLagDays}d after transaction.`];
  if (breakdown.cluster > 0.5 && clusterSize >= 2) {
    parts.push(`${clusterSize} insiders filed on ${trade.ticker} inside 30d.`);
  }
  if (breakdown.committee > 0 && profile?.committees?.length) {
    parts.push(`Committees: ${profile.committees.join(", ")}.`);
  }
  if (breakdown.timing >= 0.6) {
    parts.push("Filing lag is unusually short.");
  }
  return parts.join(" ");
}

export async function runSignalAgent(options: SignalRunOptions = {}): Promise<SignalRunResult> {
  const lookbackHours = options.lookbackHours ?? 24;
  const minViralScore = options.minViralScore ?? 0.45;
  const maxEvents = options.maxEvents ?? 20;

  const trace = new ToolCallTrace();
  const trades = new TradesClient(trace);
  const memory = new ContentMemoryClient(trace);

  const sinceIso = new Date(Date.now() - lookbackHours * 3600 * 1000).toISOString();
  const recent = await trades.searchTrades({ sinceIso, limit: 200 });

  const clusters = await trades.findCrossFilings(30, 2);

  // Enrich each trade's insider and score.
  const profilesById = new Map<string, InsiderProfile | null>();
  for (const trade of recent) {
    if (!profilesById.has(trade.insiderId)) {
      profilesById.set(trade.insiderId, await trades.getInsiderProfile(trade.insiderId));
    }
  }

  const events: SignalEvent[] = [];
  let skippedCoveredRecently = 0;

  for (const trade of recent) {
    const profile = profilesById.get(trade.insiderId) ?? null;
    const clusterInfo = clusters.find((c) => c.ticker === trade.ticker);
    const breakdown = scoreTrade({ trade, profile, clusters });
    if (breakdown.total < minViralScore) continue;

    const history = await memory.getNarrativeHistory({
      entities: [trade.ticker, trade.insiderId],
      windowDays: 14,
    });
    const hasBeenCoveredRecently = history.length > 0;
    if (hasBeenCoveredRecently) {
      skippedCoveredRecently++;
    }

    const { triggerType, suggestedAngle } = pickTriggerAndAngle(
      breakdown,
      clusterInfo?.insiderIds.length ?? 0,
    );

    events.push({
      id: randomUUID(),
      triggerType,
      viralScore: Number(breakdown.total.toFixed(3)),
      relatedTrades: [trade.filingId],
      relatedInsiders: [trade.insiderId],
      relatedTickers: [trade.ticker],
      analysisBrief: buildAnalysisBrief({
        trade,
        profile,
        breakdown,
        clusterSize: clusterInfo?.insiderIds.length ?? 0,
      }),
      suggestedAngle,
      hasBeenCoveredRecently,
      createdAt: new Date().toISOString(),
    });
  }

  events.sort((a, b) => b.viralScore - a.viralScore);
  const truncated = events.slice(0, maxEvents);

  return {
    events: truncated,
    trace,
    stats: {
      tradesScanned: recent.length,
      eventsProduced: truncated.length,
      skippedCoveredRecently,
    },
  };
}
