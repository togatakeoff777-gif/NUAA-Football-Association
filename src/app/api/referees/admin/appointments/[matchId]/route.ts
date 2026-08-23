import { NextResponse } from "next/server";
import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import {
  cancelAppointment,
  completeAppointment,
  publishAppointment,
  RefereeServiceError,
  saveAppointmentDraft,
  withdrawAppointment,
} from "@/lib/referee-service";
import { isRecord, readEnum, readPositionAssignments, readShortText } from "@/lib/referee-validation";

export async function PUT(request: Request, context: { params: Promise<{ matchId: string }> }) {
  const authorization = await authorizeLegacyAdminRequest(request, "referees:write");
  if (!authorization.ok) return authorization.response;
  const actor = authorization.actor;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("选派内容格式不正确。" );
    const { matchId } = await context.params;
    const result = await saveAppointmentDraft({
      matchId,
      positions: readPositionAssignments(body.positions),
      publicationNote: readShortText(body.publicationNote, "公示备注", 240, false),
      changeReason: readShortText(body.changeReason, "改派原因", 240, false),
      overrideReason: readShortText(body.overrideReason, "冲突覆盖原因", 500, false),
    }, actor);
    return NextResponse.json({ ok: true, warnings: result.warnings });
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json({
      error: error instanceof Error ? error.message : "草稿保存失败。",
      warnings: error instanceof RefereeServiceError ? error.warnings : [],
    }, { status });
  }
}

export async function POST(request: Request, context: { params: Promise<{ matchId: string }> }) {
  const authorization = await authorizeLegacyAdminRequest(request, "referees:write");
  if (!authorization.ok) return authorization.response;
  const actor = authorization.actor;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("操作内容格式不正确。" );
    const action = readEnum(
      body.action,
      ["publish", "withdraw", "complete", "cancel"] as const,
      "操作",
    );
    const { matchId } = await context.params;
    const reason = readShortText(body.reason, "操作原因", 240, false);
    const overrideReason = readShortText(body.overrideReason, "冲突覆盖原因", 500, false);
    const result = action === "publish"
      ? await publishAppointment(matchId, reason, overrideReason, actor)
      : action === "withdraw"
        ? await withdrawAppointment(matchId, reason, actor)
        : action === "complete"
          ? await completeAppointment(matchId, reason, actor)
          : await cancelAppointment(matchId, reason, actor);
    return NextResponse.json({
      ok: true,
      warnings: "warnings" in result ? result.warnings : [],
    });
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json({
      error: error instanceof Error ? error.message : "选派操作失败。",
      warnings: error instanceof RefereeServiceError ? error.warnings : [],
    }, { status });
  }
}
