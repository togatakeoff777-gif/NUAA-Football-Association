import { redirect } from "next/navigation";
import { requireUnifiedAdminActor, UnifiedAdminAccessError, type UnifiedAdminPermission } from "@/lib/unified-admin-rbac";

export async function guardUnifiedAdminPage(permission: UnifiedAdminPermission, denied: string) {
  try { return await requireUnifiedAdminActor(permission); }
  catch (error) { if (error instanceof UnifiedAdminAccessError) redirect(`/admin?denied=${encodeURIComponent(denied)}`); throw error; }
}
