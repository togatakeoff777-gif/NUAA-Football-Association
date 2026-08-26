import ExistingPage from "@/app/referees/admin/(dashboard)/matches/competitions/[id]/edit/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedEditCompetitionPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("competitions:write", "competitions-write");
  return ExistingPage(props);
}
