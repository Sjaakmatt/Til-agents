import type { InsiderProfile, TradeDetail, TradeFiling } from "@insiders-lab/shared";
import type {
  CrossFiling,
  SearchTradesParams,
  SectorFlowRow,
  TradesMcp,
} from "./types.js";

const KNOWN_INSIDERS: InsiderProfile[] = [
  {
    insiderId: "pelosi-n",
    name: "Nancy Pelosi",
    role: "house",
    party: "D",
    committees: [],
    notable: true,
  },
  {
    insiderId: "crenshaw-d",
    name: "Dan Crenshaw",
    role: "house",
    party: "R",
    committees: ["Homeland Security", "Energy and Commerce"],
    notable: true,
  },
  {
    insiderId: "mccaul-m",
    name: "Michael McCaul",
    role: "house",
    party: "R",
    committees: ["Foreign Affairs"],
    notable: true,
  },
  {
    insiderId: "tuberville-t",
    name: "Tommy Tuberville",
    role: "senate",
    party: "R",
    committees: ["Armed Services", "Agriculture"],
    notable: true,
  },
  {
    insiderId: "khanna-r",
    name: "Ro Khanna",
    role: "house",
    party: "D",
    committees: ["Armed Services"],
    notable: false,
  },
];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function seededFilings(count: number, seedSalt: string): TradeFiling[] {
  const now = Date.now();
  const rng = rand(hashSeed(`trades-${seedSalt}`));
  const tickers = ["NVDA", "PLTR", "LMT", "RTX", "XOM", "META", "MSFT", "TSM", "BA", "CAT"];
  const sides: TradeFiling["side"][] = ["buy", "buy", "buy", "sell", "exchange"];

  const out: TradeFiling[] = [];
  for (let i = 0; i < count; i++) {
    const insider = KNOWN_INSIDERS[Math.floor(rng() * KNOWN_INSIDERS.length)]!;
    const ticker = tickers[Math.floor(rng() * tickers.length)]!;
    const side = sides[Math.floor(rng() * sides.length)]!;
    const amountLow = Math.round((1000 + rng() * 1_000_000) / 1000) * 1000;
    const amountHigh = Math.round(amountLow * (1.1 + rng() * 4));
    const txDate = new Date(now - rng() * 30 * 24 * 3600 * 1000);
    const filedLag = Math.floor(rng() * 45);
    const filed = new Date(txDate.getTime() + filedLag * 24 * 3600 * 1000);
    out.push({
      filingId: `mock-${seedSalt}-${i}`,
      insiderId: insider.insiderId,
      ticker,
      side,
      amountUsdLow: amountLow,
      amountUsdHigh: amountHigh,
      transactionDate: txDate.toISOString(),
      filedDate: filed.toISOString(),
      filingLagDays: filedLag,
      sourceUrl: `https://example.gov/filings/${seedSalt}-${i}`,
    });
  }
  return out;
}

export class MockTradesAdapter implements TradesMcp {
  private readonly seedSalt: string;

  constructor(seedSalt = "default") {
    this.seedSalt = seedSalt;
  }

  async searchTrades(params: SearchTradesParams): Promise<TradeFiling[]> {
    const base = seededFilings(32, this.seedSalt);
    let filtered = base;
    if (params.tickers?.length) {
      const set = new Set(params.tickers);
      filtered = filtered.filter((t) => set.has(t.ticker));
    }
    if (params.insiderIds?.length) {
      const set = new Set(params.insiderIds);
      filtered = filtered.filter((t) => set.has(t.insiderId));
    }
    if (params.sinceIso) {
      const since = Date.parse(params.sinceIso);
      filtered = filtered.filter((t) => Date.parse(t.filedDate) >= since);
    }
    if (params.untilIso) {
      const until = Date.parse(params.untilIso);
      filtered = filtered.filter((t) => Date.parse(t.filedDate) <= until);
    }
    if (params.minAmountUsd !== undefined) {
      const min = params.minAmountUsd;
      filtered = filtered.filter((t) => t.amountUsdHigh >= min);
    }
    return filtered.slice(0, params.limit ?? 50);
  }

  async getTradeDetail(filingId: string): Promise<TradeDetail | null> {
    const base = seededFilings(32, this.seedSalt);
    const hit = base.find((t) => t.filingId === filingId);
    if (!hit) return null;
    const rng = rand(hashSeed(filingId));
    return {
      ...hit,
      returnSinceFiling: -0.2 + rng() * 0.8,
      sector: ["tech", "defense", "energy", "healthcare"][Math.floor(rng() * 4)],
    };
  }

  async getInsiderProfile(insiderId: string): Promise<InsiderProfile | null> {
    return KNOWN_INSIDERS.find((i) => i.insiderId === insiderId) ?? null;
  }

  async findCrossFilings(windowDays: number, minInsiders: number): Promise<CrossFiling[]> {
    const base = seededFilings(32, this.seedSalt);
    const byTicker = new Map<string, Set<string>>();
    const amounts = new Map<string, { low: number; high: number }>();
    const cutoff = Date.now() - windowDays * 24 * 3600 * 1000;
    for (const t of base) {
      if (Date.parse(t.filedDate) < cutoff) continue;
      if (t.side !== "buy") continue;
      const set = byTicker.get(t.ticker) ?? new Set();
      set.add(t.insiderId);
      byTicker.set(t.ticker, set);
      const cur = amounts.get(t.ticker) ?? { low: 0, high: 0 };
      amounts.set(t.ticker, {
        low: cur.low + t.amountUsdLow,
        high: cur.high + t.amountUsdHigh,
      });
    }
    const out: CrossFiling[] = [];
    for (const [ticker, set] of byTicker) {
      if (set.size < minInsiders) continue;
      const totals = amounts.get(ticker)!;
      out.push({
        ticker,
        insiderIds: [...set],
        windowDays,
        totalAmountUsdLow: totals.low,
        totalAmountUsdHigh: totals.high,
      });
    }
    return out.sort((a, b) => b.insiderIds.length - a.insiderIds.length);
  }

  async getSectorFlow(windowDays: number): Promise<SectorFlowRow[]> {
    const rng = rand(hashSeed(`sector-${this.seedSalt}-${windowDays}`));
    const sectors = ["tech", "defense", "energy", "healthcare", "financials"];
    return sectors.map((sector) => ({
      sector,
      netBuyUsd: Math.round((rng() - 0.3) * 10_000_000),
      insiderCount: Math.floor(rng() * 8),
      windowDays,
    }));
  }
}
