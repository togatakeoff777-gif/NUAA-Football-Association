import ExistingRefereeDetailPage from "@/app/referees/admin/(dashboard)/referees/[id]/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedAdminRefereeDetailPage(
  props: Parameters<typeof ExistingRefereeDetailPage>[0],
) {
  await guardUnifiedAdminPage("referees:read", "referees");
  return ExistingRefereeDetailPage(props);
}
