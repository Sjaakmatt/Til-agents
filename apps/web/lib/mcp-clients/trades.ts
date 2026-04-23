import { MockTradesAdapter, type TradesMcp } from "@insiders-lab/mcp-trades";
import type { InsiderProfile, TradeDetail, TradeFiling } from "@insiders-lab/shared";
import type { CrossFiling, SearchTradesParams, SectorFlowRow } from "@insiders-lab/mcp-trades";
import { getServerEnv } from "../env.js";
import type { ToolCallTrace } from "./trace.js";

let adapter: TradesMcp | null = null;

function getAdapter(): TradesMcp {
  if (adapter) return adapter;
  const env = getServerEnv();
  if (env.MCP_MODE === "supabase") {
    // Sprint 3: replace with SupabaseTradesAdapter backed by the production trade schema.
    throw new Error("Supabase trades adapter not implemented yet (Sprint 3).");
  }
  adapter = new MockTradesAdapter();
  return adapter;
}

export class TradesClient {
  constructor(private readonly trace: ToolCallTrace) {}

  searchTrades(params: SearchTradesParams): Promise<TradeFiling[]> {
    return this.trace.record("trades.search_trades", () => getAdapter().searchTrades(params));
  }

  getTradeDetail(filingId: string): Promise<TradeDetail | null> {
    return this.trace.record("trades.get_trade_detail", () => getAdapter().getTradeDetail(filingId));
  }

  getInsiderProfile(insiderId: string): Promise<InsiderProfile | null> {
    return this.trace.record("trades.get_insider_profile", () =>
      getAdapter().getInsiderProfile(insiderId),
    );
  }

  findCrossFilings(windowDays: number, minInsiders: number): Promise<CrossFiling[]> {
    return this.trace.record("trades.find_cross_filings", () =>
      getAdapter().findCrossFilings(windowDays, minInsiders),
    );
  }

  getSectorFlow(windowDays: number): Promise<SectorFlowRow[]> {
    return this.trace.record("trades.get_sector_flow", () =>
      getAdapter().getSectorFlow(windowDays),
    );
  }
}
