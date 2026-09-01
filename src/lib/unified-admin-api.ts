import { NextResponse } from "next/server";

import { getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { refereeApiErrorResponse, RefereeApiInputError } from "@/lib/referee-api";
import { RefereeServiceError } from "@/lib/referee-service-error";
import { issueAdminServiceAuthorization } from "@/lib/privileged-service-authorization";
import {
  assertUnifiedAdminPasswordChangeCompleted,
  assertUnifiedAdminPermission,
  getUnifiedAdminActor,
  UnifiedAdminAccessError,
  type UnifiedAdminPermission,
} from "@/lib/unified-admin-rbac";

export class UnifiedAdminInputError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 408 | 409 | 413 | 415 | 429 = 400) {
    super(message);
    this.name = "UnifiedAdminInputError";
  }
}

export async function authorizeUnifiedAdminRequest(
  request: Request,
  permission: UnifiedAdminPermission,
  options: { mutation?: boolean } = {},
) {
  if (options.mutation && !isSameOrigin(request)) {
    throw new UnifiedAdminAccessError("请求来源无效。", 403);
  }
  const session = await getAdminSession();
  if (!session) throw new UnifiedAdminAccessError("请先登录管理员后台。", 401);
  assertUnifiedAdminPasswordChangeCompleted(session);
  const actor = await getUnifiedAdminActor(session);
  if (!actor) throw new UnifiedAdminAccessError("请先登录管理员后台。", 401);
  assertUnifiedAdminPermission(actor, permission);
  return actor;
}

export async function authorizeUnifiedAdminServiceRequest<P extends UnifiedAdminPermission>(
  request: Request,
  permission: P,
  options: { mutation?: boolean } = {},
) {
  const actor = await authorizeUnifiedAdminRequest(request, permission, options);
  return {
    actor,
    authorization: issueAdminServiceAuthorization(actor, permission),
  };
}

export function unifiedAdminErrorResponse(error: unknown, fallback: string) {
  if (
    error instanceof UnifiedAdminAccessError ||
    error instanceof UnifiedAdminInputError ||
    error instanceof RefereeApiInputError ||
    error instanceof RefereeServiceError
  ) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error instanceof UnifiedAdminAccessError && error.code ? { code: error.code } : {}),
      },
      { status: error.status },
    );
  }
  return refereeApiErrorResponse(error, fallback);
}
