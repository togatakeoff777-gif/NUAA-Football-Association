import { NextResponse } from "next/server";

import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { refereeApiErrorResponse } from "@/lib/referee-api";
import { deleteTeamSafely } from "@/lib/referee-r1-service";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeLegacyAdminRequest(request, "competitions:write");
  if (!authorization.ok) return authorization.response;
  try {
    const { id } = await context.params;
    await deleteTeamSafely(id, authorization.authorization);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return refereeApiErrorResponse(error, "球队删除失败，请稍后重试。");
  }
}
