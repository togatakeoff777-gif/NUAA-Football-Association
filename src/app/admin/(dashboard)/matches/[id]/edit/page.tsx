import ExistingPage from "@/app/referees/admin/(dashboard)/matches/[id]/edit/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedEditMatchPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("competitions:write", "matches-write");
  return ExistingPage(props);
}
