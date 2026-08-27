import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/referee-auth";
import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { changeAdminPassword } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readShortText } from "@/lib/referee-validation";

class AdminPasswordInputError extends Error {}

async function readAdminPasswordInput(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AdminPasswordInputError("密码内容格式不正确。");
  }
  if (!isRecord(body)) throw new AdminPasswordInputError("密码内容格式不正确。");
  try {
    return {
      currentPassword: readShortText(body.currentPassword, "当前密码", 256),
      newPassword: readShortText(body.newPassword, "新密码", 256),
    };
  } catch (error) {
    if (error instanceof Error) throw new AdminPasswordInputError(error.message);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await authorizeLegacyAdminRequest(request, "dashboard:read", {
      allowPasswordChangeRequired: true,
    });
    if (!authorization.ok) return authorization.response;
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
    if (!session.adminAccount) {
      return NextResponse.json(
        { error: "兼容管理员须先切换到持久化实名账号。" },
        { status: 409 },
      );
    }
    const input = await readAdminPasswordInput(request);
    await changeAdminPassword({
      adminAccountId: session.adminAccount.id,
      currentSessionId: session.id,
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminPasswordInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof RefereeServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[unified-admin-password] unexpected runtime failure", error);
    return NextResponse.json({ error: "密码修改失败，请稍后再试。" }, { status: 500 });
  }
}
