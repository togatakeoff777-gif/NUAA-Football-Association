import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/referee-auth";
import { getRefereeMemberSession } from "@/lib/referee-member-auth";
import { acknowledgeAppointment } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getRefereeMemberSession();
  if (!session) return NextResponse.json({ error: "请先登录裁判员工作区。" }, { status: 401 });
  try {
    const { id } = await context.params;
    await acknowledgeAppointment(id, session.refereeId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "确认失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
