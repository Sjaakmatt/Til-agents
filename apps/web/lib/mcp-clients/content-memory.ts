import {
  MockContentMemoryAdapter,
  type ContentMemoryMcp,
  type NarrativeHistoryEntry,
  type SearchPastContentResult,
  type EngagementPatterns,
} from "@insiders-lab/mcp-content-memory";
import { getServerEnv } from "../env.js";
import type { ToolCallTrace } from "./trace.js";

let adapter: ContentMemoryMcp | null = null;

function getAdapter(): ContentMemoryMcp {
  if (adapter) return adapter;
  const env = getServerEnv();
  if (env.MCP_MODE === "supabase") {
    throw new Error("Supabase content-memory adapter not implemented yet (Sprint 3).");
  }
  adapter = new MockContentMemoryAdapter();
  return adapter;
}

export class ContentMemoryClient {
  constructor(private readonly trace: ToolCallTrace) {}

  getNarrativeHistory(params: {
    entities?: string[];
    angleTags?: string[];
    windowDays?: number;
  }): Promise<NarrativeHistoryEntry[]> {
    return this.trace.record("content_memory.get_narrative_history", () =>
      getAdapter().getNarrativeHistory(params),
    );
  }

  searchPastContent(params: {
    query: string;
    limit?: number;
    similarityThreshold?: number;
  }): Promise<SearchPastContentResult[]> {
    return this.trace.record("content_memory.search_past_content", () =>
      getAdapter().searchPastContent(params),
    );
  }

  getEngagementPatterns(windowDays: number): Promise<EngagementPatterns> {
    return this.trace.record("content_memory.get_engagement_patterns", () =>
      getAdapter().getEngagementPatterns(windowDays),
    );
  }
}
