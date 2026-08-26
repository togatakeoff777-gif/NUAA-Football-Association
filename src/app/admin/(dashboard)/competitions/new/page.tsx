import ExistingPage from "@/app/referees/admin/(dashboard)/matches/competitions/new/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedNewCompetitionPage() {
  await guardUnifiedAdminPage("competitions:write", "competitions-write");
  return ExistingPage();
}
