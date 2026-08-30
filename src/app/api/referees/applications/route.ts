import { NextResponse } from "next/server";
import { refereeApiErrorResponse, readRefereeApiJson, RefereeApiInputError } from "@/lib/referee-api";
import { authorizeRefereeMemberBusinessRequest } from "@/lib/referee-member-api";
import { createRefereeApplication } from "@/lib/referee-service";
import { isRecord, positionKeys, readEnum, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRefereeMemberBusinessRequest(request, { mutation: true });
    if (!authorization.ok) return authorization.response;
    const body = await readRefereeApiJson(request, "提交内容格式不正确。");
    if (!isRecord(body)) throw new RefereeApiInputError("提交内容格式不正确。" );
    if (!Array.isArray(body.preferredPositions) || body.preferredPositions.length > 5) {
      throw new RefereeApiInputError("意向岗位格式不正确。" );
    }
    const application = await createRefereeApplication({
      matchId: readShortText(body.matchId, "比赛", 64),
      refereeId: authorization.session.refereeId,
      preferredPositions: body.preferredPositions.map((item) => readEnum(item, positionKeys, "意向岗位")),
      note: readShortText(body.note, "补充说明", 240, false),
    });
    return NextResponse.json({ ok: true, applicationId: application.id }, { status: 201 });
  } catch (error) {
    return refereeApiErrorResponse(error, "提交失败，请稍后重试。");
  }
}
