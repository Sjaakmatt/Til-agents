import type { InsiderProfile, TradeFiling, TradeDetail } from "@insiders-lab/shared";

export interface SearchTradesParams {
  sinceIso?: string;
  untilIso?: string;
  tickers?: string[];
  insiderIds?: string[];
  minAmountUsd?: number;
  minReturn?: number;
  limit?: number;
}

export interface CrossFiling {
  ticker: string;
  insiderIds: string[];
  windowDays: number;
  totalAmountUsdLow: number;
  totalAmountUsdHigh: number;
}

export interface SectorFlowRow {
  sector: string;
  netBuyUsd: number;
  insiderCount: number;
  windowDays: number;
}

export interface TradesMcp {
  searchTrades(params: SearchTradesParams): Promise<TradeFiling[]>;
  getTradeDetail(filingId: string): Promise<TradeDetail | null>;
  getInsiderProfile(insiderId: string): Promise<InsiderProfile | null>;
  findCrossFilings(windowDays: number, minInsiders: number): Promise<CrossFiling[]>;
  getSectorFlow(windowDays: number): Promise<SectorFlowRow[]>;
}
