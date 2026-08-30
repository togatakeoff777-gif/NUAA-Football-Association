import { NextResponse } from "next/server";

import type { AdminActor } from "@/lib/referee-service";
import { refereeApiErrorResponse } from "@/lib/referee-api";
import { getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import {
  isUnifiedAdminPasswordChangeRequired,
  getUnifiedAdminActor,
  hasUnifiedAdminPermission,
  unifiedAdminPasswordChangeRequiredCode,
  type UnifiedAdminPermission,
} from "@/lib/unified-admin-rbac";

type LegacyAdminAuthorization =
  | { ok: true; actor: AdminActor }
  | { ok: false; response: NextResponse };

export async function authorizeLegacyAdminRequest(
  request: Request,
  permission: UnifiedAdminPermission,
  options: {
    mutation?: boolean;
    allowPasswordChangeRequired?: boolean;
    failureMessage?: string;
  } = { mutation: true },
): Promise<LegacyAdminAuthorization> {
  try {
    if (options.mutation !== false && !isSameOrigin(request)) {
      return { ok: false, response: NextResponse.json({ error: "请求来源无效。" }, { status: 403 }) };
    }
    const session = await getAdminSession();
    const actor = await getUnifiedAdminActor(session);
    if (!session || !actor) {
      return { ok: false, response: NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 }) };
    }
    if (!hasUnifiedAdminPermission(actor.roles, permission)) {
      return { ok: false, response: NextResponse.json({ error: "当前管理员没有执行此操作的权限。" }, { status: 403 }) };
    }
    if (
      isUnifiedAdminPasswordChangeRequired(session) &&
      options.allowPasswordChangeRequired !== true
    ) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: "请先修改管理员初始密码。",
            code: unifiedAdminPasswordChangeRequiredCode,
          },
          { status: 403 },
        ),
      };
    }
    return {
      ok: true,
      actor: {
        id: actor.id,
        role: hasUnifiedAdminPermission(actor.roles, "system:write") ? "SUPER_ADMIN" : "REFEREE_MANAGER",
      },
    };
  } catch (error) {
    return {
      ok: false,
      response: refereeApiErrorResponse(
        error,
        options.failureMessage ?? "管理员授权检查失败，请稍后重试。",
      ),
    };
  }
}
