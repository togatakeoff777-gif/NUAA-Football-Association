import { NextResponse } from "next/server";

import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { readCompetitionInput } from "@/lib/referee-competition-input";
import { createCompetition } from "@/lib/referee-competition-service";
import { RefereeServiceError } from "@/lib/referee-service";

export async function POST(request: Request) {
  const authorization = await authorizeLegacyAdminRequest(request, "competitions:write");
  if (!authorization.ok) return authorization.response;
  try {
    const competition = await createCompetition(
      readCompetitionInput(await request.json()),
      authorization.actor,
    );
    return NextResponse.json({ ok: true, competitionId: competition.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "赛事创建失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
