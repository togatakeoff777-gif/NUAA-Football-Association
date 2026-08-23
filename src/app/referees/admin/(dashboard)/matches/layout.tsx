import { redirect } from "next/navigation";
import { getUnifiedAdminActor, hasUnifiedAdminPermission } from "@/lib/unified-admin-rbac";

export default async function LegacyMatchesGuard({ children }: { children: React.ReactNode }) {
  const actor = await getUnifiedAdminActor();
  if (!actor || (!hasUnifiedAdminPermission(actor.roles, "competitions:read") && !hasUnifiedAdminPermission(actor.roles, "referees:read"))) {
    redirect("/admin?denied=matches");
  }
  return children;
}
