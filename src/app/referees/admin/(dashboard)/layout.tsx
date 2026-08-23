import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/referees/admin/admin-shell";
import { getAdminSession } from "@/lib/referee-auth";
import { getUnifiedAdminActor, hasUnifiedAdminPermission, unifiedAdminRoleLabels } from "@/lib/unified-admin-rbac";
import "@/styles/referee-admin.css";

export const metadata: Metadata = {
  title: { default: "裁判管理后台", template: "%s | 裁判管理后台" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function RefereeAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/referees/admin/login");
  const actor = (await getUnifiedAdminActor(session))!;
  return (
    <AdminShell
      actorName={actor.displayName}
      canCompetitions={hasUnifiedAdminPermission(actor.roles, "competitions:read")}
      canReferees={hasUnifiedAdminPermission(actor.roles, "referees:read")}
      canSystem={hasUnifiedAdminPermission(actor.roles, "system:read")}
      isLegacy={actor.isLegacy}
      mustChangePassword={session.adminAccount?.mustChangePassword ?? false}
      roleLabel={actor.roles.map((role) => unifiedAdminRoleLabels[role]).join(" / ") || "未授权"}
    >
      {children}
    </AdminShell>
  );
}
