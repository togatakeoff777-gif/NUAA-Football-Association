import { redirect } from "next/navigation";
import { requireUnifiedAdminActor, UnifiedAdminAccessError } from "@/lib/unified-admin-rbac";

export default async function LegacySystemGuard({ children }: { children: React.ReactNode }) {
  try { await requireUnifiedAdminActor("system:read"); }
  catch (error) { if (error instanceof UnifiedAdminAccessError) redirect("/admin?denied=system"); throw error; }
  return children;
}
