import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/referee-auth";
import { submitRefereeAdmissionApplication } from "@/lib/referee-admission-service";
import { refereeApiErrorResponse } from "@/lib/referee-api";
import { getAdmissionRateLimitKey } from "@/lib/referee-security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "提交内容格式不正确。" }, { status: 400 });
  }

  try {
    const application = await submitRefereeAdmissionApplication(body, {
      rateLimitKey: getAdmissionRateLimitKey(request),
    });
    return NextResponse.json(
      { ok: true, applicationId: application.id, status: application.status },
      { status: 201 },
    );
  } catch (error) {
    return refereeApiErrorResponse(
      error,
      "申请提交失败，请稍后重试。",
      { includeInternalCode: false },
    );
  }
}
