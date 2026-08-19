import { NextResponse } from "next/server";

import { getAdminActor, getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { resolveAppointmentConflictReport } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readEnum, readShortText } from "@/lib/referee-validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("处理内容格式不正确。");
    const { id } = await context.params;
    await resolveAppointmentConflictReport(
      id,
      readEnum(body.status, ["RESOLVED", "DISMISSED"] as const, "处理状态"),
      readShortText(body.resolutionNote, "处理说明", 500),
      getAdminActor(session)!,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "处理失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
