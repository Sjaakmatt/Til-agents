import { NextResponse } from "next/server";
import { executeSignalRun } from "@/lib/agents/signal-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
): Promise<NextResponse> {
  const { agentId } = await context.params;

  if (agentId !== "signal") {
    return NextResponse.json(
      { error: `Agent '${agentId}' is not implemented in Sprint 1` },
      { status: 501 },
    );
  }

  try {
    const { agentRun, result, skipped } = await executeSignalRun({ triggeredBy: "manual" });
    return NextResponse.json({
      agentRunId: agentRun.id,
      status: agentRun.status,
      skipped,
      stats: result?.stats ?? null,
      events: result?.events ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}
