# The Insiders Lab — Agent Platform

Autonomous content and growth platform described in `AGENT_PLATFORM.md` and
`MCP_PLAN.md`. This repository implements that plan sprint by sprint.

## Current sprint

**Sprint 1 — fundament.** Signal Agent produces ranked triggers on a 15-minute
schedule. No publishing yet.

Exit criterium: Signal runs every 15 min, generates `SignalEvent`s, events are
visible in the dashboard.

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm --filter @insiders-lab/web dev      # Next.js dashboard on :3000
pnpm --filter @insiders-lab/web worker   # BullMQ worker + scheduler
```

Without Supabase or Redis configured the app runs in mock mode against an
in-memory store; you can still trigger the Signal agent from
`/dashboard/insights` and inspect produced events.

## Layout

```
apps/web                      # Next.js 15 App Router dashboard + API + workers
packages/shared               # @insiders-lab/shared types + Zod schemas
packages/mcp-trades           # Typed trades MCP, mock adapter
packages/mcp-content-memory   # Typed content-memory MCP, mock adapter
supabase/migrations           # Platform schema SQL
```

## Sprints in the plan

1. Fundament — **this sprint**
2. First autonomous output (Analyst + Historian + Editor + Publisher)
3. X autonomous (Supabase adapters + Community + Profiler + Growth)
4. Instagram / YouTube Shorts / TikTok + A/B
5. Video pipeline (mcp-video-pipeline end-to-end)

Follow the sprints in order. Do not unlock later-sprint autonomy without the
guardrails and brand voice that Sprint 2 establishes.
