import ExistingPage from "@/app/referees/admin/(dashboard)/matches/competitions/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedCompetitionsPage() {
  await guardUnifiedAdminPage("competitions:read", "competitions");
  return ExistingPage();
}
