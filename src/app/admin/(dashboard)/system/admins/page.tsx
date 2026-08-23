import ExistingPage from "@/app/referees/admin/(dashboard)/admins/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedSystemAdminsPage() {
  await guardUnifiedAdminPage("system:read", "system");
  return ExistingPage();
}
