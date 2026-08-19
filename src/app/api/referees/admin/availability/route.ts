import { NextResponse } from "next/server";

import { getAdminActor, getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { deleteRefereeAvailability, saveRefereeAvailability } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readDate, readEnum, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("可执裁时间格式不正确。");
    const actor = getAdminActor(session)!;
    const result = await saveRefereeAvailability({
      id: readShortText(body.id, "记录 ID", 64, false) || undefined,
      refereeId: readShortText(body.refereeId, "裁判员", 64),
      startAt: readDate(body.startAt, "开始时间")!,
      endAt: readDate(body.endAt, "结束时间")!,
      kind: readEnum(body.kind, ["AVAILABLE", "UNAVAILABLE"] as const, "时间类型"),
      note: readShortText(body.note, "说明", 240, false),
      actor: { type: "ADMIN", id: actor.id },
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
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("删除内容格式不正确。");
    const actor = getAdminActor(session)!;
    await deleteRefereeAvailability(
      readShortText(body.id, "记录 ID", 64),
      readShortText(body.refereeId, "裁判员", 64),
      { type: "ADMIN", id: actor.id },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
