import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/referee-auth";
import {
  assertUnifiedAdminPermission,
  getUnifiedAdminActor,
  isUnifiedAdminPasswordChangeRequired,
  requireUnifiedAdminActor,
  UnifiedAdminAccessError,
  unifiedAdminPasswordChangeRequiredCode,
  type UnifiedAdminPermission,
} from "@/lib/unified-admin-rbac";

export async function guardUnifiedAdminPage(permission: UnifiedAdminPermission, denied: string) {
  try { return await requireUnifiedAdminActor(permission); }
  catch (error) {
    if (error instanceof UnifiedAdminAccessError) {
      redirect(
        error.code === unifiedAdminPasswordChangeRequiredCode
          ? "/admin"
          : `/admin?denied=${encodeURIComponent(denied)}`,
      );
    }
    throw error;
  }
}

export async function getUnifiedAdminLandingPageActor() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?next=/admin");
  if (isUnifiedAdminPasswordChangeRequired(session)) return null;
  const actor = await getUnifiedAdminActor(session);
  if (!actor) redirect("/admin/login?next=/admin");
  assertUnifiedAdminPermission(actor, "dashboard:read");
  return actor;
}
