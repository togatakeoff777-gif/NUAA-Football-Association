import { NextResponse } from "next/server";
import { destroyAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { refereeApiErrorResponse } from "@/lib/referee-api";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  try {
    await destroyAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return refereeApiErrorResponse(error, "退出失败，请稍后重试。");
  }
}
