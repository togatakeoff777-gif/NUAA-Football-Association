import { NextResponse } from "next/server";

import { getAdminActor, getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { createAdminAccount, setAdminAccountStatus } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readBoolean, readEnum, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("管理员账号格式不正确。");
    const account = await createAdminAccount({
      username: readShortText(body.username, "账号", 64),
      displayName: readShortText(body.displayName, "姓名", 80),
      password: readShortText(body.password, "初始密码", 256),
      role: readEnum(body.role, ["SUPER_ADMIN", "REFEREE_MANAGER"] as const, "角色"),
    }, getAdminActor(session)!);
    return NextResponse.json({ ok: true, id: account.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "管理员账号创建失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("管理员账号格式不正确。");
    await setAdminAccountStatus(
      readShortText(body.id, "管理员账号", 64),
      readBoolean(body.isActive, "启用状态"),
      getAdminActor(session)!,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "管理员账号更新失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
