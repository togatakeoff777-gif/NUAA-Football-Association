import { NextResponse } from "next/server";

import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { resolveAppointmentConflictReport } from "@/lib/referee-r1-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { isRecord, readEnum, readShortText } from "@/lib/referee-validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeLegacyAdminRequest(request, "referees:write");
  if (!authorization.ok) return authorization.response;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("处理内容格式不正确。");
    const { id } = await context.params;
    await resolveAppointmentConflictReport(
      id,
      readEnum(body.status, ["RESOLVED", "DISMISSED"] as const, "处理状态"),
      readShortText(body.resolutionNote, "处理说明", 500),
      authorization.actor,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "处理失败。" },
      { status: error instanceof RefereeServiceError ? error.status : 400 },
    );
  }
}
