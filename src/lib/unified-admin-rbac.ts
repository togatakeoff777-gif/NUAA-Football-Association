import type { UnifiedAdminRole } from "@/generated/prisma-v29/client";
import { prisma } from "@/lib/prisma";
import { getAdminActor, getAdminSession } from "@/lib/referee-auth";

export type UnifiedAdminPermission =
  | "dashboard:read"
  | "content:read"
  | "content:write"
  | "media:read"
  | "media:write"
  | "competitions:read"
  | "competitions:write"
  | "referees:read"
  | "referees:write"
  | "system:read"
  | "system:write";

export type UnifiedAdminActor = {
  id: string | null;
  displayName: string;
  isLegacy: boolean;
  roles: UnifiedAdminRole[];
};

export const allUnifiedAdminPermissions = [
  "dashboard:read",
  "content:read",
  "content:write",
  "media:read",
  "media:write",
  "competitions:read",
  "competitions:write",
  "referees:read",
  "referees:write",
  "system:read",
  "system:write",
] as const satisfies readonly UnifiedAdminPermission[];

export const unifiedAdminPermissionsByRole: Record<
  UnifiedAdminRole,
  readonly UnifiedAdminPermission[]
> = {
  SUPER_ADMIN: allUnifiedAdminPermissions,
  CONTENT_EDITOR: [
    "dashboard:read",
    "content:read",
    "content:write",
    "media:read",
    "media:write",
    "competitions:read",
  ],
  COMPETITION_ADMIN: ["dashboard:read", "competitions:read", "competitions:write"],
  REFEREE_ADMIN: ["dashboard:read", "competitions:read", "referees:read", "referees:write"],
};

export const unifiedAdminRoleLabels: Record<UnifiedAdminRole, string> = {
  SUPER_ADMIN: "超级管理员",
  CONTENT_EDITOR: "内容运营",
  COMPETITION_ADMIN: "赛事管理员",
  REFEREE_ADMIN: "裁判管理员",
};

export class UnifiedAdminAccessError extends Error {
  constructor(message: string, readonly status: 401 | 403) {
    super(message);
    this.name = "UnifiedAdminAccessError";
  }
}

export function resolveUnifiedAdminRoles(input: {
  explicitRoles: readonly UnifiedAdminRole[];
  legacyRole?: "SUPER_ADMIN" | "REFEREE_MANAGER";
  isLegacy?: boolean;
}) {
  if (input.isLegacy) return ["SUPER_ADMIN"] satisfies UnifiedAdminRole[];
  if (input.explicitRoles.length) return [...new Set(input.explicitRoles)];
  if (input.legacyRole === "SUPER_ADMIN") return ["SUPER_ADMIN"] satisfies UnifiedAdminRole[];
  if (input.legacyRole === "REFEREE_MANAGER") {
    return ["REFEREE_ADMIN"] satisfies UnifiedAdminRole[];
  }
  return [] satisfies UnifiedAdminRole[];
}

export function hasUnifiedAdminPermission(
  roles: readonly UnifiedAdminRole[],
  permission: UnifiedAdminPermission,
) {
  return roles.some((role) => unifiedAdminPermissionsByRole[role].includes(permission));
}

export function assertUnifiedAdminPermission(
  actor: UnifiedAdminActor,
  permission: UnifiedAdminPermission,
) {
  if (!hasUnifiedAdminPermission(actor.roles, permission)) {
    throw new UnifiedAdminAccessError("当前管理员没有执行此操作的权限。", 403);
  }
}

export async function getUnifiedAdminActor(
  session?: Awaited<ReturnType<typeof getAdminSession>>,
): Promise<UnifiedAdminActor | null> {
  const currentSession = session === undefined ? await getAdminSession() : session;
  const legacyActor = getAdminActor(currentSession);
  if (!currentSession || !legacyActor) return null;

  const assignments = currentSession.adminAccountId
    ? await prisma.adminRoleAssignment.findMany({
        where: { adminAccountId: currentSession.adminAccountId },
        select: { role: true },
        orderBy: { role: "asc" },
      })
    : [];

  return {
    id: legacyActor.id,
    displayName: legacyActor.displayName,
    isLegacy: legacyActor.isLegacy,
    roles: resolveUnifiedAdminRoles({
      explicitRoles: assignments.map(({ role }) => role),
      legacyRole: legacyActor.role,
      isLegacy: legacyActor.isLegacy,
    }),
  };
}

export async function requireUnifiedAdminActor(permission?: UnifiedAdminPermission) {
  const actor = await getUnifiedAdminActor();
  if (!actor) throw new UnifiedAdminAccessError("请先登录管理员后台。", 401);
  if (permission) assertUnifiedAdminPermission(actor, permission);
  return actor;
}
