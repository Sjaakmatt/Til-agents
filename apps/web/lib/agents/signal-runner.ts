import { randomUUID } from "node:crypto";
import type { AgentRun } from "@insiders-lab/shared";
import { runSignalAgent, type SignalRunOptions, type SignalRunResult } from "./signal-agent.js";
import {
  getKillSwitchState,
  saveAgentRun,
  saveSignalEvents,
} from "../storage/repository.js";

export interface SignalRunnerArgs extends SignalRunOptions {
  triggeredBy: "cron" | "manual" | "event";
}

export async function executeSignalRun(args: SignalRunnerArgs): Promise<{
  agentRun: AgentRun;
  result: SignalRunResult | null;
  skipped: boolean;
}> {
  const killSwitch = await getKillSwitchState();
  if (killSwitch.enabled) {
    const skippedRun: AgentRun = {
      id: randomUUID(),
      agentId: "signal",
      triggeredBy: args.triggeredBy,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "skipped",
      outputSummary: `Skipped: kill-switch active (${killSwitch.reason})`,
      costUsd: 0,
      toolCalls: [],
    };
    await saveAgentRun(skippedRun);
    return { agentRun: skippedRun, result: null, skipped: true };
  }

  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  const initial: AgentRun = {
    id: runId,
    agentId: "signal",
    triggeredBy: args.triggeredBy,
    startedAt,
    completedAt: null,
    status: "running",
    outputSummary: null,
    costUsd: 0,
    toolCalls: [],
  };
  await saveAgentRun(initial);

  try {
    const result = await runSignalAgent(args);
    await saveSignalEvents(result.events, runId);
    const completed: AgentRun = {
      ...initial,
      completedAt: new Date().toISOString(),
      status: "completed",
      outputSummary: `Scanned ${result.stats.tradesScanned} filings, produced ${result.stats.eventsProduced} events (${result.stats.skippedCoveredRecently} already covered).`,
      toolCalls: result.trace.snapshot(),
    };
    await saveAgentRun(completed);
    return { agentRun: completed, result, skipped: false };
  } catch (err) {
    const failed: AgentRun = {
      ...initial,
      completedAt: new Date().toISOString(),
      status: "failed",
      outputSummary: err instanceof Error ? err.message : String(err),
    };
    await saveAgentRun(failed);
    throw err;
  }
}
