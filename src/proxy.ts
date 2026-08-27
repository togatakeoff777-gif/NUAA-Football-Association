import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  adminSessionCookieName,
  getAdminSessionByToken,
} from "@/lib/referee-auth";
import {
  getUnifiedAdminActor,
  isUnifiedAdminPasswordChangeRequired,
} from "@/lib/unified-admin-rbac";
import { resolveAuthorizedLegacyAdminDestination } from "@/lib/unified-admin-routing";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/referees/admin/login") {
    return NextResponse.next();
  }

  try {
    const session = await getAdminSessionByToken(
      request.cookies.get(adminSessionCookieName)?.value,
    );
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (isUnifiedAdminPasswordChangeRequired(session)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    const actor = await getUnifiedAdminActor(session);
    if (!actor) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const destination = resolveAuthorizedLegacyAdminDestination(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      actor.roles,
    );
    return NextResponse.redirect(
      new URL(destination ?? "/admin?denied=legacy", request.url),
    );
  } catch (error) {
    console.error("[legacy-admin-compatibility] redirect resolution failed", error);
    return NextResponse.json(
      { error: "旧版管理入口暂时不可用。" },
      { status: 500 },
    );
  }
}

export const config = {
  matcher: ["/referees/admin", "/referees/admin/:path*"],
};
