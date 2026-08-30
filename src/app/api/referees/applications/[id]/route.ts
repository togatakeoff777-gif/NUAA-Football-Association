import { NextResponse } from "next/server";

import { refereeApiErrorResponse } from "@/lib/referee-api";
import { authorizeRefereeMemberBusinessRequest } from "@/lib/referee-member-api";
import {
  withdrawRefereeApplication,
} from "@/lib/referee-service";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authorization = await authorizeRefereeMemberBusinessRequest(request, { mutation: true });
    if (!authorization.ok) return authorization.response;
    const { id } = await context.params;
    await withdrawRefereeApplication(id, authorization.session.refereeId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return refereeApiErrorResponse(error, "撤回失败，请稍后重试。");
  }
}
