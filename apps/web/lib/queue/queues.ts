import { Queue, type QueueOptions } from "bullmq";
import { getRedisConnection } from "./redis.js";

export const QUEUE_NAMES = {
  signal: "signal",
  analysis: "analysis",
  historian: "historian",
  profiler: "profiler",
  editor: "editor",
  community: "community",
  growthDigest: "growth-digest",
  video: "video",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const queues = new Map<string, Queue>();

const defaultOptions: QueueOptions = {
  defaultJobOptions: {
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 },
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
  },
};

export function getQueue(name: QueueName): Queue {
  const existing = queues.get(name);
  if (existing) return existing;
  const queue = new Queue(name, {
    connection: getRedisConnection(),
    ...defaultOptions,
  });
  queues.set(name, queue);
  return queue;
}

export interface SignalScanJob {
  triggeredBy: "cron" | "manual";
}

export interface AnalysisJob {
  signalEventId: string;
}
