import { AdminMatchesPageContent, type AdminMatchesPageProps } from "@/components/referees/admin/admin-matches-page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedAppointmentsPage(props: AdminMatchesPageProps) {
  await guardUnifiedAdminPage("referees:read", "appointments");
  return <AdminMatchesPageContent {...props} mode="appointments" />;
}
