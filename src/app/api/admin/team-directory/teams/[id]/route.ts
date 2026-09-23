import { NextResponse } from "next/server";
import { updateTeamDirectoryEntry } from "@/lib/admin-team-directory-service";
import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { revalidatePublicTeamDirectory } from "@/lib/public-competition-revalidation";
import { readRefereeApiJson, refereeApiErrorResponse, RefereeApiInputError } from "@/lib/referee-api";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeLegacyAdminRequest(request, "competitions:write");
  if (!authorization.ok) return authorization.response;
  try {
    const { id } = await context.params;
    const body = await readRefereeApiJson(request, "球队目录内容格式不正确。");
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new RefereeApiInputError("球队目录内容格式不正确。");
    const input = body as Record<string, unknown>;
    if (typeof input.competitionId !== "string") throw new RefereeApiInputError("请选择有效赛事。");
    await updateTeamDirectoryEntry(id, input.competitionId, input, authorization.authorization);
    revalidatePublicTeamDirectory();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return refereeApiErrorResponse(error, "球队目录信息保存失败，请稍后重试。");
  }
}
