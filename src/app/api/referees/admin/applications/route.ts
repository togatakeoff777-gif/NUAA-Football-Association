import { NextResponse } from "next/server";

import { getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import {
  createAdminApplicationException,
  RefereeServiceError,
} from "@/lib/referee-service";
import {
  isRecord,
  positionKeys,
  readEnum,
  readShortText,
} from "@/lib/referee-validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  }
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  }
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || !Array.isArray(body.preferredPositions)) {
      throw new Error("补录内容格式不正确。");
    }
    const application = await createAdminApplicationException({
      matchId: readShortText(body.matchId, "比赛", 64),
      refereeId: readShortText(body.refereeId, "裁判员", 64),
      preferredPositions: body.preferredPositions.map((item) =>
        readEnum(item, positionKeys, "意向岗位"),
      ),
      note: readShortText(body.note, "补充说明", 240, false),
      exceptionReason: readShortText(body.exceptionReason, "人工例外原因", 240),
    });
    return NextResponse.json(
      { ok: true, applicationId: application.id },
      { status: 201 },
    );
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "补录失败。" },
      { status },
    );
  }
}
