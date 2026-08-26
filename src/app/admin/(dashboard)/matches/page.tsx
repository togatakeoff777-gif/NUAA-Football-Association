import { AdminMatchesPageContent, type AdminMatchesPageProps } from "@/components/referees/admin/admin-matches-page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedMatchesPage(props: AdminMatchesPageProps) {
  await guardUnifiedAdminPage("competitions:read", "matches");
  return <AdminMatchesPageContent {...props} mode="matches" />;
}
