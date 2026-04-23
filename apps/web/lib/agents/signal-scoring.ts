import type { InsiderProfile, TradeFiling } from "@insiders-lab/shared";

// Section 5.1 — viral-score components. Each returns a 0..1 contribution.

const COMMITTEE_SECTOR_MATCH: Record<string, string[]> = {
  "Armed Services": ["LMT", "RTX", "BA", "NOC", "GD"],
  "Energy and Commerce": ["XOM", "CVX", "COP", "OXY"],
  "Foreign Affairs": ["LMT", "RTX", "BA"],
  "Homeland Security": ["PLTR", "LMT", "RTX"],
  "Agriculture": ["ADM", "DE", "CAT"],
};

export function scoreBigDollar(trade: TradeFiling): number {
  const mid = (trade.amountUsdLow + trade.amountUsdHigh) / 2;
  if (mid <= 0) return 0;
  // Log-scale: $15k maps to ~0, $5M maps to ~1.
  const normalized = (Math.log10(mid) - Math.log10(15_000)) / (Math.log10(5_000_000) - Math.log10(15_000));
  return Math.max(0, Math.min(1, normalized));
}

export function scoreNotability(profile: InsiderProfile | null): number {
  if (!profile) return 0;
  return profile.notable ? 0.85 : 0.25;
}

export function scoreTimingAnomaly(trade: TradeFiling): number {
  // Trades filed unusually fast after transaction are more interesting.
  // Filing lag < 10 days is fast; < 3 days is extremely fast.
  if (trade.filingLagDays <= 3) return 1;
  if (trade.filingLagDays <= 10) return 0.6;
  if (trade.filingLagDays <= 30) return 0.2;
  return 0;
}

export function scoreCommitteeMatch(
  profile: InsiderProfile | null,
  trade: TradeFiling,
): number {
  if (!profile?.committees?.length) return 0;
  for (const committee of profile.committees) {
    const tickers = COMMITTEE_SECTOR_MATCH[committee];
    if (!tickers) continue;
    if (tickers.includes(trade.ticker)) return 1;
  }
  return 0;
}

export function scoreClusterMembership(
  ticker: string,
  clusters: Array<{ ticker: string; insiderIds: string[] }>,
): number {
  const cluster = clusters.find((c) => c.ticker === ticker);
  if (!cluster) return 0;
  if (cluster.insiderIds.length >= 5) return 1;
  if (cluster.insiderIds.length >= 3) return 0.7;
  if (cluster.insiderIds.length >= 2) return 0.3;
  return 0;
}

export interface ScoringInputs {
  trade: TradeFiling;
  profile: InsiderProfile | null;
  clusters: Array<{ ticker: string; insiderIds: string[] }>;
}

export interface ScoringBreakdown {
  bigDollar: number;
  notability: number;
  timing: number;
  committee: number;
  cluster: number;
  total: number;
}

// Weighted blend. Weights chosen so any single signal caps the total around 0.5
// on its own; combinations push into "content-worthy" territory (>0.6).
const WEIGHTS = {
  bigDollar: 0.25,
  notability: 0.2,
  timing: 0.15,
  committee: 0.15,
  cluster: 0.25,
} as const;

export function scoreTrade(inputs: ScoringInputs): ScoringBreakdown {
  const bigDollar = scoreBigDollar(inputs.trade);
  const notability = scoreNotability(inputs.profile);
  const timing = scoreTimingAnomaly(inputs.trade);
  const committee = scoreCommitteeMatch(inputs.profile, inputs.trade);
  const cluster = scoreClusterMembership(inputs.trade.ticker, inputs.clusters);
  const total =
    bigDollar * WEIGHTS.bigDollar +
    notability * WEIGHTS.notability +
    timing * WEIGHTS.timing +
    committee * WEIGHTS.committee +
    cluster * WEIGHTS.cluster;
  return {
    bigDollar,
    notability,
    timing,
    committee,
    cluster,
    total: Math.max(0, Math.min(1, total)),
  };
}
