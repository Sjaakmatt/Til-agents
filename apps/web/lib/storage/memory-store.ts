import type {
  AgentRun,
  ApprovalItem,
  Channel,
  Draft,
  SignalEvent,
} from "@insiders-lab/shared";

// In-memory fallback so the dashboard and workers can function without
// Supabase creds during local bring-up. Real persistence arrives in Sprint 3.
class MemoryStore {
  agentRuns: AgentRun[] = [];
  signalEvents: SignalEvent[] = [];
  drafts: Draft[] = [];
  approvals: ApprovalItem[] = [];
  killSwitch = { enabled: false, reason: "initial", updatedAt: new Date().toISOString() };

  upsertAgentRun(run: AgentRun): void {
    const idx = this.agentRuns.findIndex((r) => r.id === run.id);
    if (idx >= 0) this.agentRuns[idx] = run;
    else this.agentRuns.unshift(run);
  }

  addSignalEvent(event: SignalEvent): void {
    this.signalEvents.unshift(event);
  }

  listSignalEvents(limit = 50): SignalEvent[] {
    return this.signalEvents.slice(0, limit);
  }

  listAgentRuns(limit = 50): AgentRun[] {
    return this.agentRuns.slice(0, limit);
  }

  listPendingApprovals(): ApprovalItem[] {
    return this.approvals.filter((a) => a.status === "pending");
  }

  findApproval(id: string): ApprovalItem | undefined {
    return this.approvals.find((a) => a.id === id);
  }

  findDraft(id: string): Draft | undefined {
    return this.drafts.find((d) => d.id === id);
  }

  setKillSwitch(enabled: boolean, reason: string): void {
    this.killSwitch = { enabled, reason, updatedAt: new Date().toISOString() };
  }

  insertDraft(draft: Draft, kanalen: Channel[]): ApprovalItem[] {
    this.drafts.unshift(draft);
    const items: ApprovalItem[] = kanalen.map((k) => ({
      id: crypto.randomUUID(),
      draftId: draft.id,
      kanaal: k,
      status: "pending",
      priority: "normal",
      bundleId: kanalen.length > 1 ? crypto.randomUUID() : null,
      approvedBy: null,
      approvedAt: null,
      editedText: null,
      createdAt: new Date().toISOString(),
    }));
    this.approvals.unshift(...items);
    return items;
  }
}

declare global {
  var __insidersLabMemoryStore: MemoryStore | undefined;
}

export function getMemoryStore(): MemoryStore {
  if (!globalThis.__insidersLabMemoryStore) {
    globalThis.__insidersLabMemoryStore = new MemoryStore();
  }
  return globalThis.__insidersLabMemoryStore;
}
