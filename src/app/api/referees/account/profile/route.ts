import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/referee-auth";
import { getRefereeMemberSession } from "@/lib/referee-member-auth";
import { updateSelfRefereeProfile } from "@/lib/referee-r1-service";
import { isRecord, readShortText } from "@/lib/referee-validation";

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getRefereeMemberSession();
  if (!session) return NextResponse.json({ error: "请先登录裁判员工作区。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("个人资料格式不正确。");
    await updateSelfRefereeProfile(session.refereeId, {
      phone: readShortText(body.phone, "手机号", 32, false),
      qq: readShortText(body.qq, "QQ", 32, false),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "个人资料更新失败。" },
      { status: 400 },
    );
  }
}
