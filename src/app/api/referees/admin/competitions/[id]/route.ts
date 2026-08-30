import { NextResponse } from "next/server";

import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { refereeApiErrorResponse } from "@/lib/referee-api";
import { readCompetitionInput } from "@/lib/referee-competition-input";
import { updateCompetition } from "@/lib/referee-competition-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeLegacyAdminRequest(request, "competitions:write");
  if (!authorization.ok) return authorization.response;
  try {
    const { id } = await context.params;
    const competition = await updateCompetition(
      id,
      readCompetitionInput(await request.json()),
      authorization.actor,
    );
    return NextResponse.json({ ok: true, competitionId: competition.id });
  } catch (error) {
    return refereeApiErrorResponse(error, "赛事更新失败，请稍后重试。");
  }
}
