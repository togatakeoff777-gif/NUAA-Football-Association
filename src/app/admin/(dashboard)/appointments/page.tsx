import ExistingPage from "@/app/referees/admin/(dashboard)/matches/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedAppointmentsPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("referees:read", "appointments");
  return ExistingPage(props);
}
