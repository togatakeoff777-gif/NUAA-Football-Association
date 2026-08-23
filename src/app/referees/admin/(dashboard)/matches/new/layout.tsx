import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function NewMatchWriteGuard({ children }: { children: React.ReactNode }) {
  await guardUnifiedAdminPage("competitions:write", "matches-write");
  return children;
}
