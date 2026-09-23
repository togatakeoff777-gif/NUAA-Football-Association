import { NextResponse } from "next/server";
import { updateTeamDirectoryEntriesBulk } from "@/lib/admin-team-directory-service";
import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { revalidatePublicTeamDirectory } from "@/lib/public-competition-revalidation";
import { readRefereeApiJson, refereeApiErrorResponse, RefereeApiInputError } from "@/lib/referee-api";

export async function PATCH(request: Request) {
  const authorization = await authorizeLegacyAdminRequest(request, "competitions:write");
  if (!authorization.ok) return authorization.response;
  try {
    const body = await readRefereeApiJson(request, "批量操作格式不正确。");
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new RefereeApiInputError("批量操作格式不正确。");
    const result = await updateTeamDirectoryEntriesBulk(body as Record<string, unknown>, authorization.authorization);
    revalidatePublicTeamDirectory();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return refereeApiErrorResponse(error, "批量操作失败，请稍后重试。");
  }
}
