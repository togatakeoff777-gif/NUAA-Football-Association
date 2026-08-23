import ExistingPage from "@/app/referees/admin/(dashboard)/availability/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedAvailabilityPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("referees:read", "availability");
  return ExistingPage(props);
}
