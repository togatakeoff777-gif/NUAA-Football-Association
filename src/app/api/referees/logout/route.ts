import { NextResponse } from "next/server";
import { destroyRefereeMemberSession } from "@/lib/referee-member-auth";
import { isSameOrigin } from "@/lib/referee-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  }
  await destroyRefereeMemberSession();
  return NextResponse.json({ ok: true });
}
