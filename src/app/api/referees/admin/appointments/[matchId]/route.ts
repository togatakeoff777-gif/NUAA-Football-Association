import { NextResponse } from "next/server";
import { getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import {
  publishAppointment,
  RefereeServiceError,
  saveAppointmentDraft,
  withdrawAppointment,
} from "@/lib/referee-service";
import { isRecord, readEnum, readPositionAssignments, readShortText } from "@/lib/referee-validation";

async function authorize(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  if (!(await getAdminSession())) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  return null;
}

export async function PUT(request: Request, context: { params: Promise<{ matchId: string }> }) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("选派内容格式不正确。" );
    const { matchId } = await context.params;
    await saveAppointmentDraft({
      matchId,
      positions: readPositionAssignments(body.positions),
      publicationNote: readShortText(body.publicationNote, "公示备注", 240, false),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "草稿保存失败。" }, { status });
  }
}

export async function POST(request: Request, context: { params: Promise<{ matchId: string }> }) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("操作内容格式不正确。" );
    const action = readEnum(body.action, ["publish", "withdraw"] as const, "操作" );
    const { matchId } = await context.params;
    if (action === "publish") await publishAppointment(matchId);
    else await withdrawAppointment(matchId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "选派操作失败。" }, { status });
  }
}
