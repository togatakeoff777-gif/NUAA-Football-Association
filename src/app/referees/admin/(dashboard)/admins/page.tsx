import { redirect } from "next/navigation";

import { AdminAccountsManager } from "@/components/referees/admin/admin-data-managers";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { getAdminActor, getAdminSession } from "@/lib/referee-auth";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { prisma } from "@/lib/prisma";

export default async function AdminAccountsPage() {
  const session = await getAdminSession();
  const actor = getAdminActor(session);
  if (!actor || actor.role !== "SUPER_ADMIN") redirect("/referees/admin");
  const accounts = await prisma.adminAccount.findMany({ select: { id: true, username: true, displayName: true, role: true, isActive: true, lastLoginAt: true }, orderBy: { username: "asc" } });
  return <><AdminPageHeader eyebrow="SYSTEM · ADMIN ACCOUNTS" title="管理员账号" description="仅裁判中心最高管理员可查看和维护实名管理员。" /><AdminPanel title={`管理员列表 · ${accounts.length}`} description="创建表单仅在需要时打开。"><AdminAccountsManager accounts={accounts.map((item) => ({ ...item, lastLoginAt: item.lastLoginAt ? formatRefereeDateTime(item.lastLoginAt) : "" }))} /></AdminPanel></>;
}
