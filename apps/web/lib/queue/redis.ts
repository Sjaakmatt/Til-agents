import IORedis, { type Redis } from "ioredis";
import { getServerEnv } from "../env.js";

let connection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (connection) return connection;
  const env = getServerEnv();
  const url = env.REDIS_URL ?? "redis://127.0.0.1:6379";
  connection = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  return connection;
}
