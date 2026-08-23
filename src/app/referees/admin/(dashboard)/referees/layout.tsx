import { redirect } from "next/navigation";
import { requireUnifiedAdminActor, UnifiedAdminAccessError } from "@/lib/unified-admin-rbac";

export default async function LegacyRefereesGuard({ children }: { children: React.ReactNode }) {
  try { await requireUnifiedAdminActor("referees:read"); }
  catch (error) { if (error instanceof UnifiedAdminAccessError) redirect("/admin?denied=referees"); throw error; }
  return children;
}
