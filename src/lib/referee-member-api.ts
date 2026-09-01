import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/referee-auth";
import { getRefereeMemberSession } from "@/lib/referee-member-auth";
import { issueRefereeSelfServiceAuthorization } from "@/lib/privileged-service-authorization";

export const memberPasswordChangeRequiredCode = "MEMBER_PASSWORD_CHANGE_REQUIRED";

export async function authorizeRefereeMemberBusinessRequest(
  request: Request,
  options: { mutation?: boolean } = {},
) {
  if (options.mutation && !isSameOrigin(request)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "请求来源无效。" }, { status: 403 }),
    };
  }

  const session = await getRefereeMemberSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "请先登录裁判员工作区。" }, { status: 401 }),
    };
  }
  if (session.referee.mustChangePassword) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: "请先修改初始密码。",
          code: memberPasswordChangeRequiredCode,
        },
        { status: 403 },
      ),
    };
  }
  return {
    ok: true as const,
    session,
    authorization: issueRefereeSelfServiceAuthorization(session.refereeId),
  };
}

export async function authorizeRefereeMemberSecurityRequest(request: Request) {
  if (!isSameOrigin(request)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "请求来源无效。" }, { status: 403 }),
    };
  }
  const session = await getRefereeMemberSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "请先登录裁判员工作区。" }, { status: 401 }),
    };
  }
  return {
    ok: true as const,
    session,
    authorization: issueRefereeSelfServiceAuthorization(session.refereeId),
  };
}
