import { NextResponse } from "next/server";

import { getAdminActor, getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { setTeamAffiliations } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readShortText } from "@/lib/referee-validation";

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || !Array.isArray(body.collegeIds)) throw new Error("球队学院关联格式不正确。");
    await setTeamAffiliations(
      readShortText(body.teamId, "球队", 64),
      body.collegeIds.map((item) => readShortText(item, "学院", 64)),
      getAdminActor(session)!,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "球队学院关联更新失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
