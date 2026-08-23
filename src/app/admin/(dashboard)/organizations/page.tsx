import ExistingPage from "@/app/referees/admin/(dashboard)/affiliations/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedOrganizationsPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("competitions:read", "organizations");
  return ExistingPage(props);
}
