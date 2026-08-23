import ExistingPage from "@/app/referees/admin/(dashboard)/conflicts/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedConflictsPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("referees:read", "conflicts");
  return ExistingPage(props);
}
