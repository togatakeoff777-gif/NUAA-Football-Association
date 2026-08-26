import ExistingPage from "@/app/referees/admin/(dashboard)/matches/[id]/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedAppointmentDetailPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("referees:read", "appointments");
  return ExistingPage({ ...props, appointmentOnly: true });
}
