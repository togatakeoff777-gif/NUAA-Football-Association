import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/referee-auth";
import {
  destroyRefereeMemberSession,
  getRefereeMemberSession,
} from "@/lib/referee-member-auth";
import {
  changeRefereePassword,
  RefereeServiceError,
} from "@/lib/referee-service";
import { isRecord, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  }
  const session = await getRefereeMemberSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录裁判员工作区。" }, { status: 401 });
  }
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("密码内容格式不正确。");
    const currentPassword = readShortText(body.currentPassword, "当前密码", 256);
    const newPassword = readShortText(body.newPassword, "新密码", 256);
    if (currentPassword === newPassword) throw new Error("新密码不能与当前密码相同。");
    await changeRefereePassword(session.refereeId, currentPassword, newPassword);
    await destroyRefereeMemberSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "密码修改失败。" },
      { status },
    );
  }
}
