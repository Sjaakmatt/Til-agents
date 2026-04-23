import type {
  ContentMemoryMcp,
  EngagementPatterns,
  NarrativeHistoryEntry,
  SearchPastContentResult,
} from "./types.js";

// In-memory store so the mock behaves consistently within a process.
// Signal Agent can register narratives it has seen covered so subsequent
// ticks flag `hasBeenCoveredRecently` correctly.
const narratives: NarrativeHistoryEntry[] = [];

export class MockContentMemoryAdapter implements ContentMemoryMcp {
  async getNarrativeHistory(params: {
    entities?: string[];
    angleTags?: string[];
    windowDays?: number;
  }): Promise<NarrativeHistoryEntry[]> {
    const windowDays = params.windowDays ?? 14;
    const cutoff = Date.now() - windowDays * 24 * 3600 * 1000;
    return narratives.filter((n) => {
      if (Date.parse(n.publishedAt) < cutoff) return false;
      if (params.entities?.length) {
        const hit = params.entities.some((e) => n.relatedEntities.includes(e));
        if (!hit) return false;
      }
      if (params.angleTags?.length) {
        const hit = params.angleTags.some((a) => n.angleTags.includes(a));
        if (!hit) return false;
      }
      return true;
    });
  }

  async searchPastContent(params: {
    query: string;
    limit?: number;
    similarityThreshold?: number;
  }): Promise<SearchPastContentResult[]> {
    const tokens = params.query.toLowerCase().split(/\s+/).filter(Boolean);
    return narratives
      .map<SearchPastContentResult>((n) => {
        const hay = `${n.headline} ${n.angleTags.join(" ")} ${n.relatedEntities.join(" ")}`.toLowerCase();
        const hits = tokens.filter((t) => hay.includes(t)).length;
        return {
          contentId: n.contentId,
          publishedAt: n.publishedAt,
          headline: n.headline,
          similarity: tokens.length ? hits / tokens.length : 0,
        };
      })
      .filter((r) => r.similarity >= (params.similarityThreshold ?? 0.3))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, params.limit ?? 10);
  }

  async getEngagementPatterns(windowDays: number): Promise<EngagementPatterns> {
    return {
      windowDays,
      samples: [],
      byAngleEngagement: {},
      byKanaalEngagement: {},
      signupAttribution: 0,
    };
  }

  recordNarrative(entry: NarrativeHistoryEntry): void {
    narratives.push(entry);
  }
}
