import { NextResponse } from "next/server";
import { createAdminSession, getAdminConfigurationIssue, isSameOrigin } from "@/lib/referee-auth";
import { isRecord, readShortText } from "@/lib/referee-validation";
import {
  assertLoginAllowed,
  clearLoginFailures,
  getLoginKey,
  LoginRateLimitError,
  recordLoginFailure,
} from "@/lib/referee-security";
import { resolveUnifiedAdminRoles } from "@/lib/unified-admin-rbac";
import { getAuthorizedUnifiedAdminReturnTo } from "@/lib/unified-admin-routing";

class AdminLoginInputError extends Error {}

async function readAdminLoginInput(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AdminLoginInputError("登录信息格式不正确。");
  }
  if (!isRecord(body)) throw new AdminLoginInputError("登录信息格式不正确。");
  try {
    return {
      username: readShortText(body.username, "管理员账号", 64, false),
      password: readShortText(body.password, "管理员密码", 256),
      next: typeof body.next === "string" ? body.next : undefined,
    };
  } catch (error) {
    if (error instanceof Error) throw new AdminLoginInputError(error.message);
    throw error;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const configurationIssue = getAdminConfigurationIssue();
  if (configurationIssue) return NextResponse.json({ error: "裁判管理后台暂未开放。" }, { status: 503 });
  try {
    const { username, password, next } = await readAdminLoginInput(request);
    const loginKey = getLoginKey(request, username || "legacy-administrator");
    await assertLoginAllowed("admin", loginKey);
    const identity = await createAdminSession(username, password);
    if (!identity) {
      await recordLoginFailure("admin", loginKey);
      return NextResponse.json({ error: "登录信息不正确或后台当前不可用。" }, { status: 401 });
    }
    await clearLoginFailures("admin", loginKey);
    const roles = resolveUnifiedAdminRoles(identity);
    return NextResponse.json({
      ok: true,
      returnTo: identity.mustChangePassword
        ? "/admin"
        : getAuthorizedUnifiedAdminReturnTo(
            next,
            roles,
          ),
    });
  } catch (error) {
    if (error instanceof AdminLoginInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof LoginRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error("[unified-admin-login] unexpected runtime failure", error);
    return NextResponse.json({ error: "登录失败，请稍后再试。" }, { status: 500 });
  }
}
