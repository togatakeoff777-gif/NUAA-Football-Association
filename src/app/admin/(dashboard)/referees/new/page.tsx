import ExistingPage from "@/app/referees/admin/(dashboard)/referees/new/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedNewRefereePage() {
  await guardUnifiedAdminPage("referees:write", "referees-write");
  return ExistingPage();
}
