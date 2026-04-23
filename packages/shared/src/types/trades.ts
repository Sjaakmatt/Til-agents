export type InsiderRole = "house" | "senate" | "executive" | "director" | "ten_percent_owner";

export type TradeSide = "buy" | "sell" | "exchange";

export interface InsiderProfile {
  insiderId: string;
  name: string;
  role: InsiderRole;
  party?: "D" | "R" | "I";
  committees?: string[];
  notable: boolean;
}

export interface TradeFiling {
  filingId: string;
  insiderId: string;
  ticker: string;
  side: TradeSide;
  amountUsdLow: number;
  amountUsdHigh: number;
  transactionDate: string;
  filedDate: string;
  filingLagDays: number;
  sourceUrl: string;
}

export interface TradeDetail extends TradeFiling {
  returnSinceFiling?: number;
  sector?: string;
}
