import { NextResponse } from "next/server";
import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { RefereeServiceError, reviewApplication } from "@/lib/referee-service";
import { isRecord, readEnum, readShortText } from "@/lib/referee-validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeLegacyAdminRequest(request, "referees:write");
  if (!authorization.ok) return authorization.response;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("审核内容格式不正确。" );
    const { id } = await context.params;
    await reviewApplication(
      id,
      readEnum(
        body.status,
        ["PENDING", "REVIEWING", "APPROVED", "REJECTED", "NOT_SELECTED", "APPOINTED"] as const,
        "审核状态",
      ),
      readShortText(body.reviewNote, "审核备注", 240, false),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "审核失败。" }, { status });
  }
}
