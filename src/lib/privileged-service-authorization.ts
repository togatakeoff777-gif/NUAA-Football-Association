import { RefereeServiceError } from "@/lib/referee-service-error";
import {
  assertUnifiedAdminPermission,
  type UnifiedAdminActor,
  type UnifiedAdminPermission,
} from "@/lib/unified-admin-rbac";

declare const adminServiceAuthorizationBrand: unique symbol;
declare const refereeSelfServiceAuthorizationBrand: unique symbol;

export type AdminServiceAuthorization<P extends UnifiedAdminPermission> = Readonly<{
  [adminServiceAuthorizationBrand]: P;
}>;

export type RefereeSelfServiceAuthorization = Readonly<{
  [refereeSelfServiceAuthorizationBrand]: true;
}>;

type AdminGrant = {
  permission: UnifiedAdminPermission;
  actor: Readonly<UnifiedAdminActor>;
};

const adminGrants = new WeakMap<object, AdminGrant>();
const refereeSelfGrants = new WeakMap<object, string>();

function isObject(value: unknown): value is object {
  return (typeof value === "object" && value !== null) || typeof value === "function";
}

/**
 * Internal issuer. Imports are restricted to authenticated server adapters and
 * the isolated-test helper by the R4A authorization-boundary test.
 */
export function issueAdminServiceAuthorization<P extends UnifiedAdminPermission>(
  actor: UnifiedAdminActor,
  permission: P,
): AdminServiceAuthorization<P> {
  try {
    assertUnifiedAdminPermission(actor, permission);
  } catch {
    throw new RefereeServiceError("当前管理员没有执行此操作的权限。", 403);
  }
  const trustedActor = Object.freeze({
    ...actor,
    roles: Object.freeze([...actor.roles]),
  }) as Readonly<UnifiedAdminActor>;
  const authorization = Object.freeze({});
  adminGrants.set(authorization, { permission, actor: trustedActor });
  return authorization as AdminServiceAuthorization<P>;
}

export function requireAdminServiceAuthorization<P extends UnifiedAdminPermission>(
  authorization: AdminServiceAuthorization<P> | unknown,
  permission: P,
): Readonly<UnifiedAdminActor> {
  const grant = isObject(authorization) ? adminGrants.get(authorization) : undefined;
  if (!grant || grant.permission !== permission) {
    throw new RefereeServiceError("可信服务授权上下文无效。", 403);
  }
  try {
    assertUnifiedAdminPermission(grant.actor, permission);
  } catch {
    throw new RefereeServiceError("可信服务授权上下文无效。", 403);
  }
  return grant.actor;
}

/**
 * Internal issuer for a live, server-authenticated referee member session.
 */
export function issueRefereeSelfServiceAuthorization(
  refereeId: string,
): RefereeSelfServiceAuthorization {
  if (!refereeId) throw new RefereeServiceError("裁判员服务授权上下文无效。", 403);
  const authorization = Object.freeze({});
  refereeSelfGrants.set(authorization, refereeId);
  return authorization as RefereeSelfServiceAuthorization;
}

export function requireRefereeSelfServiceAuthorization(
  authorization: RefereeSelfServiceAuthorization | unknown,
  refereeId: string,
) {
  const authorizedRefereeId = isObject(authorization)
    ? refereeSelfGrants.get(authorization)
    : undefined;
  if (!authorizedRefereeId || authorizedRefereeId !== refereeId) {
    throw new RefereeServiceError("裁判员服务授权上下文无效。", 403);
  }
  return authorizedRefereeId;
}
