import { NextResponse } from "next/server";

import { refereeApiErrorResponse, readRefereeApiJson, RefereeApiInputError } from "@/lib/referee-api";
import { authorizeRefereeMemberBusinessRequest } from "@/lib/referee-member-api";
import {
  deleteRefereeAvailability,
  saveRefereeAvailability,
} from "@/lib/referee-r1-service";
import { isRecord, readDate, readEnum, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRefereeMemberBusinessRequest(request, { mutation: true });
    if (!authorization.ok) return authorization.response;
    const body = await readRefereeApiJson(request, "可执裁时间格式不正确。");
    if (!isRecord(body)) throw new RefereeApiInputError("可执裁时间格式不正确。");
    const result = await saveRefereeAvailability({
      id: readShortText(body.id, "记录 ID", 64, false) || undefined,
      refereeId: authorization.session.refereeId,
      startAt: readDate(body.startAt, "开始时间")!,
      endAt: readDate(body.endAt, "结束时间")!,
      kind: readEnum(body.kind, ["AVAILABLE", "UNAVAILABLE"] as const, "时间类型"),
      note: readShortText(body.note, "说明", 240, false),
      actor: { type: "REFEREE", id: authorization.session.refereeId },
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return refereeApiErrorResponse(error, "保存失败，请稍后重试。");
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = await authorizeRefereeMemberBusinessRequest(request, { mutation: true });
    if (!authorization.ok) return authorization.response;
    const body = await readRefereeApiJson(request, "删除内容格式不正确。");
    if (!isRecord(body)) throw new RefereeApiInputError("删除内容格式不正确。");
    await deleteRefereeAvailability(
      readShortText(body.id, "记录 ID", 64),
      authorization.session.refereeId,
      { type: "REFEREE", id: authorization.session.refereeId },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return refereeApiErrorResponse(error, "删除失败，请稍后重试。");
  }
}
