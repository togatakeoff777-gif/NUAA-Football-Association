import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/referee-auth";
import { getRefereeMemberSession } from "@/lib/referee-member-auth";
import { reportAppointmentConflict } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getRefereeMemberSession();
  if (!session) return NextResponse.json({ error: "请先登录裁判员工作区。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("冲突报告格式不正确。");
    const { id } = await context.params;
    await reportAppointmentConflict(
      id,
      session.refereeId,
      readShortText(body.reason, "冲突原因", 500),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "报告失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
