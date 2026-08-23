import { NextResponse } from "next/server";

import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { setTeamUnitAffiliations } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readEnum, readShortText, readShortTextArray } from "@/lib/referee-validation";

export async function PUT(request: Request) {
  const authorization = await authorizeLegacyAdminRequest(request, "competitions:write");
  if (!authorization.ok) return authorization.response;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("球队组织关联格式不正确。");
    const unitIds = readShortTextArray(body.unitIds ?? body.collegeIds, "组织单位", 64, 30);
    const inferredType = unitIds.length > 1 ? "JOINT" : unitIds.length === 1 ? "ORGANIZATION" : "FREEFORM";
    await setTeamUnitAffiliations(
      readShortText(body.teamId, "球队", 64),
      unitIds,
      readEnum(body.teamType ?? inferredType, ["ORGANIZATION", "JOINT", "FREEFORM"] as const, "球队类型"),
      authorization.actor,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "球队组织关联更新失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
