import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/referee-auth";
import { createRefereeApplication, RefereeServiceError } from "@/lib/referee-service";
import { isRecord, positionKeys, readEnum, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("提交内容格式不正确。" );
    if (!Array.isArray(body.preferredPositions) || body.preferredPositions.length > 5) {
      throw new Error("意向岗位格式不正确。" );
    }
    const application = await createRefereeApplication({
      matchId: readShortText(body.matchId, "比赛", 64),
      refereeId: readShortText(body.refereeId, "裁判员", 64),
      preferredPositions: body.preferredPositions.map((item) => readEnum(item, positionKeys, "意向岗位")),
      note: readShortText(body.note, "补充说明", 240, false),
    });
    return NextResponse.json({ ok: true, applicationId: application.id }, { status: 201 });
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "提交失败，请稍后重试。" },
      { status },
    );
  }
}
