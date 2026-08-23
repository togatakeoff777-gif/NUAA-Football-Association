import ExistingPage from "@/app/referees/admin/(dashboard)/statistics/page";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedStatisticsPage(props: Parameters<typeof ExistingPage>[0]) {
  await guardUnifiedAdminPage("referees:read", "statistics");
  return ExistingPage(props);
}
