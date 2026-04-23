export interface NarrativeHistoryEntry {
  contentId: string;
  publishedAt: string;
  kanaal: string;
  angleTags: string[];
  relatedEntities: string[];
  headline: string;
}

export interface EngagementSample {
  contentId: string;
  kanaal: string;
  publishedAt: string;
  impressions: number;
  engagements: number;
  attributedSignups: number;
}

export interface EngagementPatterns {
  windowDays: number;
  samples: EngagementSample[];
  byAngleEngagement: Record<string, number>;
  byKanaalEngagement: Record<string, number>;
  signupAttribution: number;
}

export interface SearchPastContentResult {
  contentId: string;
  publishedAt: string;
  headline: string;
  similarity: number;
}

export interface ContentMemoryMcp {
  getNarrativeHistory(params: {
    entities?: string[];
    angleTags?: string[];
    windowDays?: number;
  }): Promise<NarrativeHistoryEntry[]>;

  searchPastContent(params: {
    query: string;
    limit?: number;
    similarityThreshold?: number;
  }): Promise<SearchPastContentResult[]>;

  getEngagementPatterns(windowDays: number): Promise<EngagementPatterns>;
}
