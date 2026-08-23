import { redirect } from "next/navigation";
import { requireUnifiedAdminActor, UnifiedAdminAccessError } from "@/lib/unified-admin-rbac";

export default async function LegacyOrganizationsGuard({ children }: { children: React.ReactNode }) {
  try { await requireUnifiedAdminActor("competitions:read"); }
  catch (error) { if (error instanceof UnifiedAdminAccessError) redirect("/admin?denied=competitions"); throw error; }
  return children;
}
