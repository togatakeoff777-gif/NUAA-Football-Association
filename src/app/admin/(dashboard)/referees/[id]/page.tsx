import { redirect } from "next/navigation";

import ExistingRefereeDetailPage from "@/app/referees/admin/(dashboard)/referees/[id]/page";
import { requireUnifiedAdminActor, UnifiedAdminAccessError } from "@/lib/unified-admin-rbac";

export default async function UnifiedAdminRefereeDetailPage(
  props: Parameters<typeof ExistingRefereeDetailPage>[0],
) {
  try {
    await requireUnifiedAdminActor("referees:read");
  } catch (error) {
    if (error instanceof UnifiedAdminAccessError) redirect("/admin?denied=referees");
    throw error;
  }
  return ExistingRefereeDetailPage(props);
}
