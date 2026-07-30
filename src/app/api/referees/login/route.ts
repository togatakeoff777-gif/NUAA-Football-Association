import { NextResponse } from "next/server";
import {
  createRefereeMemberSession,
  getRefereeMemberConfigurationIssue,
} from "@/lib/referee-member-auth";
import { isSameOrigin } from "@/lib/referee-auth";
import { isRecord, readShortText } from "@/lib/referee-validation";
import {
  assertLoginAllowed,
  clearLoginFailures,
  getLoginKey,
  recordLoginFailure,
} from "@/lib/referee-security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  }
  const configurationIssue = getRefereeMemberConfigurationIssue();
  if (configurationIssue) {
    return NextResponse.json({ error: "裁判员工作区暂未开放。" }, { status: 503 });
  }
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("登录信息格式不正确。");
    const publicCode = readShortText(body.publicCode, "裁判员编号", 32);
    const password = readShortText(body.password, "密码", 256);
    const loginKey = getLoginKey(request, publicCode);
    await assertLoginAllowed("referee", loginKey);
    const referee = await createRefereeMemberSession(publicCode, password);
    if (!referee) {
      await recordLoginFailure("referee", loginKey);
      return NextResponse.json({ error: "登录信息不正确或账号当前不可用。" }, { status: 401 });
    }
    await clearLoginFailures("referee", loginKey);
    return NextResponse.json({ ok: true, mustChangePassword: referee.mustChangePassword });
  } catch (error) {
    if (error instanceof Error && error.message.includes("过于频繁")) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "登录失败，请稍后重试。" },
      { status: 400 },
    );
  }
}
