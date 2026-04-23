import { NextResponse } from "next/server";
import { listPendingApprovalItems } from "@/lib/storage/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const items = await listPendingApprovalItems();
  return NextResponse.json({ items });
}
