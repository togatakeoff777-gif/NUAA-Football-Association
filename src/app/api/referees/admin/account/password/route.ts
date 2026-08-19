import { NextResponse } from "next/server";

import { getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { changeAdminPassword } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  }
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  }
  if (!session.adminAccount) {
    return NextResponse.json(
      { error: "兼容管理员须先切换到持久化实名账号。" },
      { status: 409 },
    );
  }
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("密码内容格式不正确。");
    await changeAdminPassword({
      adminAccountId: session.adminAccount.id,
      currentSessionId: session.id,
      currentPassword: readShortText(body.currentPassword, "当前密码", 256),
      newPassword: readShortText(body.newPassword, "新密码", 256),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "密码修改失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
