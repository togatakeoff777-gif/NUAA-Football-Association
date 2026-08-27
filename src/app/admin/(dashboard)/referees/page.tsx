import ExistingRefereeAdminPage from "@/app/referees/admin/(dashboard)/referees/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedAdminRefereesPage(
  props: Parameters<typeof ExistingRefereeAdminPage>[0],
) {
  await guardUnifiedAdminPage("referees:read", "referees");
  return ExistingRefereeAdminPage(props);
}
