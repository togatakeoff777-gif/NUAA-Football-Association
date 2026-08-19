import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/referees/admin/admin-shell";
import { getAdminActor, getAdminSession } from "@/lib/referee-auth";
import "@/styles/referee-admin.css";

export const metadata: Metadata = {
  title: { default: "裁判管理后台", template: "%s | 裁判管理后台" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function RefereeAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/referees/admin/login");
  const actor = getAdminActor(session)!;
  return (
    <AdminShell
      actorName={actor.displayName}
      actorRole={actor.role}
      isLegacy={actor.isLegacy}
      mustChangePassword={session.adminAccount?.mustChangePassword ?? false}
    >
      {children}
    </AdminShell>
  );
}
