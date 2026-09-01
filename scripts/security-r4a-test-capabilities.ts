import type { UnifiedAdminRole } from "../src/generated/prisma-v29/client";
import {
  issueAdminServiceAuthorization,
  issueRefereeSelfServiceAuthorization,
} from "../src/lib/privileged-service-authorization";
import type {
  UnifiedAdminActor,
  UnifiedAdminPermission,
} from "../src/lib/unified-admin-rbac";

function assertIsolatedTestContext() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NUAAFA_ISOLATED_SECURITY_TEST !== "1"
  ) {
    throw new Error("R4A test authorization may only be issued by an explicitly isolated non-production test.");
  }
}

export function testUnifiedAdminActor(input: {
  id?: string | null;
  displayName?: string;
  isLegacy?: boolean;
  roles?: readonly UnifiedAdminRole[];
} = {}): UnifiedAdminActor {
  return {
    id: input.id ?? null,
    displayName: input.displayName ?? "R4A isolated test administrator",
    isLegacy: input.isLegacy ?? false,
    roles: [...(input.roles ?? ["SUPER_ADMIN"])],
  };
}

export function issueTestAdminServiceAuthorization<P extends UnifiedAdminPermission>(
  permission: P,
  actor: UnifiedAdminActor = testUnifiedAdminActor(),
) {
  assertIsolatedTestContext();
  return issueAdminServiceAuthorization(actor, permission);
}

export function issueTestRefereeSelfServiceAuthorization(refereeId: string) {
  assertIsolatedTestContext();
  return issueRefereeSelfServiceAuthorization(refereeId);
}
