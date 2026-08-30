import { NextResponse } from "next/server";

import { refereeApiErrorResponse } from "@/lib/referee-api";
import { authorizeRefereeMemberBusinessRequest } from "@/lib/referee-member-api";
import { acknowledgeAppointment } from "@/lib/referee-r1-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await authorizeRefereeMemberBusinessRequest(request, { mutation: true });
    if (!authorization.ok) return authorization.response;
    const { id } = await context.params;
    await acknowledgeAppointment(id, authorization.session.refereeId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return refereeApiErrorResponse(error, "确认失败，请稍后重试。");
  }
}
