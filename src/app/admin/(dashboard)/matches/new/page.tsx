import ExistingPage from "@/app/referees/admin/(dashboard)/matches/new/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedNewMatchPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("competitions:write", "matches-write");
  return ExistingPage(props);
}
