import type {
  AgentRun,
  ApprovalItem,
  Channel,
  Draft,
  SignalEvent,
} from "@insiders-lab/shared";
import { getSupabaseServerClient } from "../supabase/server.js";
import { getMemoryStore } from "./memory-store.js";

// Thin repository. When Supabase credentials are available it writes there;
// otherwise everything lives in the in-memory store. This lets Sprint 1 run
// end-to-end locally without infrastructure.

export async function saveAgentRun(run: AgentRun): Promise<void> {
  const mem = getMemoryStore();
  mem.upsertAgentRun(run);
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("agent_runs").upsert({
    id: run.id,
    agent_id: run.agentId,
    triggered_by: run.triggeredBy,
    started_at: run.startedAt,
    completed_at: run.completedAt,
    status: run.status,
    output_summary: run.outputSummary,
    cost_usd: run.costUsd,
    tool_calls: run.toolCalls,
  });
}

export async function saveSignalEvents(
  events: SignalEvent[],
  agentRunId: string,
): Promise<void> {
  const mem = getMemoryStore();
  for (const e of events) mem.addSignalEvent(e);
  const supabase = getSupabaseServerClient();
  if (!supabase || events.length === 0) return;
  await supabase.from("signal_events").insert(
    events.map((e) => ({
      id: e.id,
      agent_run_id: agentRunId,
      trigger_type: e.triggerType,
      viral_score: e.viralScore,
      related_trades: e.relatedTrades,
      related_insiders: e.relatedInsiders,
      related_tickers: e.relatedTickers,
      analysis_brief: e.analysisBrief,
      suggested_angle: e.suggestedAngle,
      has_been_covered_recently: e.hasBeenCoveredRecently,
      created_at: e.createdAt,
    })),
  );
}

export async function listRecentSignalEvents(limit = 50): Promise<SignalEvent[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("signal_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (data) {
      return data.map(mapSignalEventRow);
    }
  }
  return getMemoryStore().listSignalEvents(limit);
}

export async function listRecentAgentRuns(limit = 50): Promise<AgentRun[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("agent_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);
    if (data) return data.map(mapAgentRunRow);
  }
  return getMemoryStore().listAgentRuns(limit);
}

export async function listPendingApprovalItems(): Promise<
  Array<{ approval: ApprovalItem; draft: Draft }>
> {
  const mem = getMemoryStore();
  const items = mem.listPendingApprovals();
  return items.flatMap((a) => {
    const d = mem.findDraft(a.draftId);
    return d ? [{ approval: a, draft: d }] : [];
  });
}

export async function getKillSwitchState(): Promise<{
  enabled: boolean;
  reason: string;
  updatedAt: string;
}> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("kill_switch_state")
      .select("enabled, reason, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      return {
        enabled: data.enabled,
        reason: data.reason ?? "",
        updatedAt: data.updated_at,
      };
    }
  }
  return getMemoryStore().killSwitch;
}

export async function setKillSwitchState(
  enabled: boolean,
  reason: string,
  actor: string,
): Promise<void> {
  getMemoryStore().setKillSwitch(enabled, reason);
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  await supabase
    .from("kill_switch_state")
    .update({
      enabled,
      reason,
      updated_at: new Date().toISOString(),
      updated_by: actor,
    })
    .eq("id", 1);
}

export async function submitDraftForApproval(
  draft: Draft,
  kanalen: Channel[],
): Promise<ApprovalItem[]> {
  return getMemoryStore().insertDraft(draft, kanalen);
}

export async function decideApproval(
  id: string,
  action: "approve" | "reject" | "edit",
  approver: string,
  editedText?: string,
): Promise<ApprovalItem | null> {
  const mem = getMemoryStore();
  const item = mem.findApproval(id);
  if (!item) return null;
  const now = new Date().toISOString();
  if (action === "approve") item.status = "approved";
  else if (action === "reject") item.status = "rejected";
  else if (action === "edit") {
    item.status = "edited";
    item.editedText = editedText ?? item.editedText;
  }
  item.approvedBy = approver;
  item.approvedAt = now;
  return item;
}

// Row mappers ----------------------------------------------------------------

function mapSignalEventRow(row: Record<string, unknown>): SignalEvent {
  return {
    id: String(row.id),
    triggerType: row.trigger_type as SignalEvent["triggerType"],
    viralScore: Number(row.viral_score),
    relatedTrades: (row.related_trades as string[]) ?? [],
    relatedInsiders: (row.related_insiders as string[]) ?? [],
    relatedTickers: (row.related_tickers as string[]) ?? [],
    analysisBrief: String(row.analysis_brief ?? ""),
    suggestedAngle: row.suggested_angle as SignalEvent["suggestedAngle"],
    hasBeenCoveredRecently: Boolean(row.has_been_covered_recently),
    createdAt: String(row.created_at),
  };
}

function mapAgentRunRow(row: Record<string, unknown>): AgentRun {
  return {
    id: String(row.id),
    agentId: row.agent_id as AgentRun["agentId"],
    triggeredBy: row.triggered_by as AgentRun["triggeredBy"],
    startedAt: String(row.started_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    status: row.status as AgentRun["status"],
    outputSummary: (row.output_summary as string | null) ?? null,
    costUsd: Number(row.cost_usd ?? 0),
    toolCalls: (row.tool_calls as AgentRun["toolCalls"]) ?? [],
  };
}
