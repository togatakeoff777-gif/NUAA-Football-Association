import { AdminAccountsManager } from "@/components/admin/admin-accounts-manager";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { listUnifiedAdminAccounts } from "@/lib/unified-admin-account-service";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedSystemAdminsPage() {
  const actor = await guardUnifiedAdminPage("system:read", "system");
  const accounts = await listUnifiedAdminAccounts(actor);
  return <>
    <AdminPageHeader eyebrow="SYSTEM · ADMIN ACCOUNTS" title="管理员账号" description="维护实名管理员的 Unified roles 与启用状态；系统始终保留至少一个已启用超级管理员。" />
    <AdminPanel title={`管理员列表 · ${accounts.length}`} description="超级管理员包含全部权限；其他角色可按职责组合。">
      <AdminAccountsManager accounts={accounts.map((account) => ({
        id: account.id,
        username: account.username,
        displayName: account.displayName,
        roles: account.roles,
        isActive: account.isActive,
        lastLoginAt: account.lastLoginAt ? formatRefereeDateTime(account.lastLoginAt) : "",
      }))} />
    </AdminPanel>
  </>;
}
