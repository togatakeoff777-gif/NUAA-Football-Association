import ExistingPage from "@/app/referees/admin/(dashboard)/audit-log/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedSystemAuditPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("system:read", "system");
  return ExistingPage(props);
}
