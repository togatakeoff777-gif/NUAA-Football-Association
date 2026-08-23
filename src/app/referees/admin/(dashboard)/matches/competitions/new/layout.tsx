import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function NewCompetitionWriteGuard({ children }: { children: React.ReactNode }) {
  await guardUnifiedAdminPage("competitions:write", "competitions-write");
  return children;
}
