import { NextResponse } from "next/server";

import { getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import { RefereeServiceError } from "@/lib/referee-service-error";
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
  const actor = await getUnifiedAdminActor(session);
  if (!session || !actor) throw new UnifiedAdminAccessError("请先登录管理员后台。", 401);
  assertUnifiedAdminPermission(actor, permission);
  assertUnifiedAdminPasswordChangeCompleted(session);
  return actor;
}

export function unifiedAdminErrorResponse(error: unknown, fallback: string) {
  if (
    error instanceof UnifiedAdminAccessError ||
    error instanceof UnifiedAdminInputError ||
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
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
