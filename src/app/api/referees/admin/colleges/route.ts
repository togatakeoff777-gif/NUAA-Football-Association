import { NextResponse } from "next/server";

import { getAdminActor, getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { createCollege, upsertCollegeCodeMapping } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readEnum, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  const actor = getAdminActor(session)!;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("学院内容格式不正确。");
    const action = readEnum(body.action, ["create-college", "upsert-mapping"] as const, "操作");
    const result = action === "create-college"
      ? await createCollege(readShortText(body.name, "学院名称", 80), actor)
      : await upsertCollegeCodeMapping(
          readShortText(body.prefix, "学号前缀", 2),
          readShortText(body.collegeId, "学院", 64),
          readShortText(body.note, "说明", 240, false),
          actor,
        );
    return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "学院配置失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
