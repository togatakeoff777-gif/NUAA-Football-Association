import { NextResponse } from "next/server";

import { getAdminActor, getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { readCompetitionInput } from "@/lib/referee-competition-input";
import { updateCompetition } from "@/lib/referee-competition-service";
import { RefereeServiceError } from "@/lib/referee-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  try {
    const { id } = await context.params;
    const competition = await updateCompetition(
      id,
      readCompetitionInput(await request.json()),
      getAdminActor(session)!,
    );
    return NextResponse.json({ ok: true, competitionId: competition.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "赛事更新失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
