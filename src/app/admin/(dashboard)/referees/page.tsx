import { redirect } from "next/navigation";

import ExistingRefereeAdminPage from "@/app/referees/admin/(dashboard)/referees/page";
import { requireUnifiedAdminActor, UnifiedAdminAccessError } from "@/lib/unified-admin-rbac";

export default async function UnifiedAdminRefereesPage(
  props: Parameters<typeof ExistingRefereeAdminPage>[0],
) {
  try {
    await requireUnifiedAdminActor("referees:read");
  } catch (error) {
    if (error instanceof UnifiedAdminAccessError) redirect("/admin?denied=referees");
    throw error;
  }
  return ExistingRefereeAdminPage(props);
}
