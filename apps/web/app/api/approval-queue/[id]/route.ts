import { NextResponse } from "next/server";
import { schemas } from "@insiders-lab/shared";
import { decideApproval } from "@/lib/storage/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = schemas.approvalActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await decideApproval(
    id,
    parsed.data.action,
    parsed.data.approver,
    parsed.data.editedText,
  );
  if (!result) {
    return NextResponse.json({ error: "approval item not found" }, { status: 404 });
  }
  return NextResponse.json({ item: result });
}
