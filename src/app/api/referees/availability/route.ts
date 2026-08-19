import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/referee-auth";
import { getRefereeMemberSession } from "@/lib/referee-member-auth";
import {
  deleteRefereeAvailability,
  saveRefereeAvailability,
} from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readDate, readEnum, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getRefereeMemberSession();
  if (!session) return NextResponse.json({ error: "请先登录裁判员工作区。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("可执裁时间格式不正确。");
    const result = await saveRefereeAvailability({
      id: readShortText(body.id, "记录 ID", 64, false) || undefined,
      refereeId: session.refereeId,
      startAt: readDate(body.startAt, "开始时间")!,
      endAt: readDate(body.endAt, "结束时间")!,
      kind: readEnum(body.kind, ["AVAILABLE", "UNAVAILABLE"] as const, "时间类型"),
      note: readShortText(body.note, "说明", 240, false),
      actor: { type: "REFEREE", id: session.refereeId },
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getRefereeMemberSession();
  if (!session) return NextResponse.json({ error: "请先登录裁判员工作区。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("删除内容格式不正确。");
    await deleteRefereeAvailability(
      readShortText(body.id, "记录 ID", 64),
      session.refereeId,
      { type: "REFEREE", id: session.refereeId },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
