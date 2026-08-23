import { NextResponse } from "next/server";

import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { createAffiliationUnit, setAffiliationUnitChildren } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readEnum, readShortText, readShortTextArray } from "@/lib/referee-validation";

export async function POST(request: Request) {
  const authorization = await authorizeLegacyAdminRequest(request, "competitions:write");
  if (!authorization.ok) return authorization.response;
  const actor = authorization.actor;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("组织单位内容格式不正确。");
    const action = readEnum(body.action, ["create", "set-children"] as const, "操作");
    const result = action === "create"
      ? await createAffiliationUnit(
          readShortText(body.name, "组织单位名称", 80),
          readEnum(body.type, ["COLLEGE", "SHUYUAN"] as const, "组织单位类型"),
          actor,
        )
      : await setAffiliationUnitChildren(
          readShortText(body.parentUnitId, "书院", 64),
          readShortTextArray(body.childUnitIds, "组成学院", 64, 30),
          actor,
        );
    return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "组织单位配置失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
