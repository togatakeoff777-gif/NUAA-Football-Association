import { AdminAccountsManager } from "@/components/referees/admin/admin-data-managers";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { prisma } from "@/lib/prisma";

export default async function AdminAccountsPage() {
  const accounts = await prisma.adminAccount.findMany({ select: { id: true, username: true, displayName: true, role: true, isActive: true, lastLoginAt: true }, orderBy: { username: "asc" } });
  return <><AdminPageHeader eyebrow="SYSTEM · ADMIN ACCOUNTS" title="管理员账号" description="统一 system:read / system:write 权限保护实名管理员维护。" /><AdminPanel title={`管理员列表 · ${accounts.length}`} description="创建表单仅在需要时打开。"><AdminAccountsManager accounts={accounts.map((item) => ({ ...item, lastLoginAt: item.lastLoginAt ? formatRefereeDateTime(item.lastLoginAt) : "" }))} /></AdminPanel></>;
}
