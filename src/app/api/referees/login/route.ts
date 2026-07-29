import { NextResponse } from "next/server";
import {
  createRefereeMemberSession,
  getRefereeMemberConfigurationIssue,
} from "@/lib/referee-member-auth";
import { isSameOrigin } from "@/lib/referee-auth";
import { isRecord, readShortText } from "@/lib/referee-validation";

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
    const accessCode = readShortText(body.accessCode, "访问码", 256);
    const referee = await createRefereeMemberSession(publicCode, accessCode);
    if (!referee) {
      return NextResponse.json({ error: "裁判员编号或访问码不正确。" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "登录失败。" },
      { status: 400 },
    );
  }
}
