import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/referee-auth";
import {
  requireUnifiedAdminActor,
  UnifiedAdminAccessError,
  type UnifiedAdminPermission,
} from "@/lib/unified-admin-rbac";

export class UnifiedAdminInputError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 | 413 | 415 = 400) {
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
  return requireUnifiedAdminActor(permission);
}

export function unifiedAdminErrorResponse(error: unknown, fallback: string) {
  if (error instanceof UnifiedAdminAccessError || error instanceof UnifiedAdminInputError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
