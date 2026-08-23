import ExistingPage from "@/app/referees/admin/(dashboard)/matches/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedMatchesPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("competitions:read", "matches");
  return ExistingPage(props);
}
