import { NextResponse } from "next/server";
import { destroyAdminSession, isSameOrigin } from "@/lib/referee-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
