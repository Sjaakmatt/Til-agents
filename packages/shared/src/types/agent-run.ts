import type { AgentId } from "./drafts.js";

export type AgentRunStatus = "running" | "completed" | "failed" | "skipped";

export interface ToolCallRecord {
  tool: string;
  durationMs: number;
  succeeded: boolean;
}

export interface AgentRun {
  id: string;
  agentId: AgentId;
  triggeredBy: "cron" | "event" | "manual";
  startedAt: string;
  completedAt: string | null;
  status: AgentRunStatus;
  outputSummary: string | null;
  costUsd: number;
  toolCalls: ToolCallRecord[];
}
