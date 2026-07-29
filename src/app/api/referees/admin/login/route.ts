import { NextResponse } from "next/server";
import { createAdminSession, getAdminConfigurationIssue, isSameOrigin } from "@/lib/referee-auth";
import { isRecord, readShortText } from "@/lib/referee-validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const configurationIssue = getAdminConfigurationIssue();
  if (configurationIssue) return NextResponse.json({ error: "裁判管理后台暂未开放。" }, { status: 503 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("登录信息格式不正确。" );
    const password = readShortText(body.password, "管理员密码", 256);
    if (!(await createAdminSession(password))) {
      return NextResponse.json({ error: "管理员密码不正确。" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "登录失败。" },
      { status: 400 },
    );
  }
}
