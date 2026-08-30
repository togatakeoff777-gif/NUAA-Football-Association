import { NextResponse } from "next/server";

import { refereeApiErrorResponse, readRefereeApiJson, RefereeApiInputError } from "@/lib/referee-api";
import { authorizeRefereeMemberBusinessRequest } from "@/lib/referee-member-api";
import { updateSelfRefereeProfile } from "@/lib/referee-r1-service";
import { isRecord, readShortText } from "@/lib/referee-validation";

export async function PATCH(request: Request) {
  try {
    const authorization = await authorizeRefereeMemberBusinessRequest(request, { mutation: true });
    if (!authorization.ok) return authorization.response;
    const body = await readRefereeApiJson(request, "个人资料格式不正确。");
    if (!isRecord(body)) throw new RefereeApiInputError("个人资料格式不正确。");
    await updateSelfRefereeProfile(authorization.session.refereeId, {
      phone: readShortText(body.phone, "手机号", 32, false),
      qq: readShortText(body.qq, "QQ", 32, false),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return refereeApiErrorResponse(error, "个人资料更新失败，请稍后重试。");
  }
}
