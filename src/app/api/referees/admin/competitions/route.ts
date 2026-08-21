import { NextResponse } from "next/server";

import { getAdminActor, getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { readCompetitionInput } from "@/lib/referee-competition-input";
import { createCompetition } from "@/lib/referee-competition-service";
import { RefereeServiceError } from "@/lib/referee-service";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  try {
    const competition = await createCompetition(
      readCompetitionInput(await request.json()),
      getAdminActor(session)!,
    );
    return NextResponse.json({ ok: true, competitionId: competition.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "赛事创建失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
