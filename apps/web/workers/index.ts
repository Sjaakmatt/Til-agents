import { getQueue, QUEUE_NAMES } from "../lib/queue/queues.js";
import { createSignalWorker } from "./signal-worker.js";

// Entry-point for background workers. Launched via `pnpm worker`.
// Sprint 1 only enables the Signal schedule; later sprints register their
// queues here (Analyst, Historian, Community, Growth, Video).

async function registerSchedules(): Promise<void> {
  const signalQueue = getQueue(QUEUE_NAMES.signal);

  // Remove existing repeatables so we don't stack duplicates across restarts.
  const repeatables = await signalQueue.getRepeatableJobs();
  await Promise.all(repeatables.map((r) => signalQueue.removeRepeatableByKey(r.key)));

  await signalQueue.add(
    "scan",
    { triggeredBy: "cron" },
    { repeat: { pattern: "*/15 * * * *" } },
  );
}

async function main(): Promise<void> {
  const workers = [createSignalWorker()];
  await registerSchedules();

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[workers] received ${signal}, shutting down`);
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  console.log("[workers] running — Signal Agent scheduled every 15 minutes");
}

void main().catch((err: unknown) => {
  console.error("[workers] fatal", err);
  process.exit(1);
});
