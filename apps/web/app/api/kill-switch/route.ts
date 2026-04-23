import { NextResponse } from "next/server";
import { schemas } from "@insiders-lab/shared";
import { getKillSwitchState, setKillSwitchState } from "@/lib/storage/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const state = await getKillSwitchState();
  return NextResponse.json(state);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = schemas.killSwitchActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const actor = request.headers.get("x-actor") ?? "dashboard";
  await setKillSwitchState(parsed.data.enable, parsed.data.reason, actor);
  const state = await getKillSwitchState();
  return NextResponse.json(state);
}
