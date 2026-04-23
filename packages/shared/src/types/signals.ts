export type TriggerType =
  | "cluster"
  | "big_dollar"
  | "timing_anomaly"
  | "committee_match"
  | "comeback_trade";

export type SuggestedAngle =
  | "cross_filing"
  | "track_record"
  | "sector_rotation"
  | "timing"
  | "missed_opportunity";

export interface SignalEvent {
  id: string;
  triggerType: TriggerType;
  viralScore: number;
  relatedTrades: string[];
  relatedInsiders: string[];
  relatedTickers: string[];
  analysisBrief: string;
  suggestedAngle: SuggestedAngle;
  hasBeenCoveredRecently: boolean;
  createdAt: string;
}
