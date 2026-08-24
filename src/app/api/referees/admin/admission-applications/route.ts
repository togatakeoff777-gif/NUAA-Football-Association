import { NextResponse } from "next/server";

import type { RefereeAdmissionApplicationStatus } from "@/generated/prisma-v29/client";
import { listRefereeAdmissionApplications } from "@/lib/referee-admission-service";
import {
  authorizeUnifiedAdminRequest,
  unifiedAdminErrorResponse,
  UnifiedAdminInputError,
} from "@/lib/unified-admin-api";

const statuses = new Set<RefereeAdmissionApplicationStatus>([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export async function GET(request: Request) {
  try {
    const actor = await authorizeUnifiedAdminRequest(request, "referees:read");
    const rawStatus = new URL(request.url).searchParams.get("status");
    if (rawStatus && !statuses.has(rawStatus as RefereeAdmissionApplicationStatus)) {
      throw new UnifiedAdminInputError("准入申请状态筛选无效。");
    }
    const applications = await listRefereeAdmissionApplications(
      rawStatus as RefereeAdmissionApplicationStatus | undefined,
      actor,
    );
    return NextResponse.json({ applications });
  } catch (error) {
    return unifiedAdminErrorResponse(error, "裁判准入申请读取失败。");
  }
}
