import { NextResponse } from "next/server";

import { getAdminActor, getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { setTeamUnitAffiliations } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readEnum, readShortText, readShortTextArray } from "@/lib/referee-validation";

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("球队组织关联格式不正确。");
    const unitIds = readShortTextArray(body.unitIds ?? body.collegeIds, "组织单位", 64, 30);
    const inferredType = unitIds.length > 1 ? "JOINT" : unitIds.length === 1 ? "ORGANIZATION" : "FREEFORM";
    await setTeamUnitAffiliations(
      readShortText(body.teamId, "球队", 64),
      unitIds,
      readEnum(body.teamType ?? inferredType, ["ORGANIZATION", "JOINT", "FREEFORM"] as const, "球队类型"),
      getAdminActor(session)!,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "球队组织关联更新失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
