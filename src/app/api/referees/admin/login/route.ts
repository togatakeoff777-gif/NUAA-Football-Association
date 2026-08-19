import { NextResponse } from "next/server";
import { createAdminSession, getAdminConfigurationIssue, isSameOrigin } from "@/lib/referee-auth";
import { isRecord, readShortText } from "@/lib/referee-validation";
import {
  assertLoginAllowed,
  clearLoginFailures,
  getLoginKey,
  recordLoginFailure,
} from "@/lib/referee-security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const configurationIssue = getAdminConfigurationIssue();
  if (configurationIssue) return NextResponse.json({ error: "裁判管理后台暂未开放。" }, { status: 503 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("登录信息格式不正确。" );
    const username = readShortText(body.username, "管理员账号", 64, false);
    const password = readShortText(body.password, "管理员密码", 256);
    const loginKey = getLoginKey(request, username || "legacy-administrator");
    await assertLoginAllowed("admin", loginKey);
    if (!(await createAdminSession(username, password))) {
      await recordLoginFailure("admin", loginKey);
      return NextResponse.json({ error: "登录信息不正确或后台当前不可用。" }, { status: 401 });
    }
    await clearLoginFailures("admin", loginKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("过于频繁")) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "登录失败。" },
      { status: 400 },
    );
  }
}
