import { Worker } from "bullmq";
import { QUEUE_NAMES, type SignalScanJob } from "../lib/queue/queues.js";
import { getRedisConnection } from "../lib/queue/redis.js";
import { executeSignalRun } from "../lib/agents/signal-runner.js";

export function createSignalWorker(): Worker<SignalScanJob> {
  return new Worker<SignalScanJob>(
    QUEUE_NAMES.signal,
    async (job) => {
      const triggeredBy = job.data.triggeredBy === "manual" ? "manual" : "cron";
      const { agentRun, result, skipped } = await executeSignalRun({ triggeredBy });
      return {
        agentRunId: agentRun.id,
        skipped,
        events: result?.events.length ?? 0,
      };
    },
    { connection: getRedisConnection(), concurrency: 1 },
  );
}
