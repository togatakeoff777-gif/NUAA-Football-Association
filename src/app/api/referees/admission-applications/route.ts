import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/referee-auth";
import { submitRefereeAdmissionApplication } from "@/lib/referee-admission-service";
import { RefereeServiceError } from "@/lib/referee-service-error";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  }

  try {
    const application = await submitRefereeAdmissionApplication(await request.json());
    return NextResponse.json(
      { ok: true, applicationId: application.id, status: application.status },
      { status: 201 },
    );
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "申请提交失败，请稍后重试。" },
      { status },
    );
  }
}
