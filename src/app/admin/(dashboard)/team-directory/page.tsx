import { AdminPageHeader } from "@/components/referees/admin/admin-ui";
import { TeamDirectoryManager } from "@/components/admin/team-directory-manager";
import { getAdminTeamDirectory } from "@/lib/admin-team-directory-service";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";
import { hasUnifiedAdminPermission } from "@/lib/unified-admin-rbac";

export default async function TeamDirectoryAdminPage({ searchParams }: {
  searchParams: Promise<{ competition?: string }>;
}) {
  const actor = await guardUnifiedAdminPage("competitions:read", "team-directory");
  const query = await searchParams;
  const data = await getAdminTeamDirectory(query.competition);
  return <>
    <AdminPageHeader eyebrow="PUBLIC TEAM DIRECTORY" title="公开组队目录" description="管理球队信息页的当前赛事、公开联系人和球队组队资料。球队创建与赛事归属仍在“组织与球队”维护。" />
    <TeamDirectoryManager
      settings={data.settings ? {
        activeCompetitionId: data.settings.activeCompetitionId,
        directoryPublished: data.settings.directoryPublished,
        contactName: data.settings.contactName,
        contactTitle: data.settings.contactTitle,
        contactQQ: data.settings.contactQQ,
        contactEmail: data.settings.contactEmail,
      } : null}
      competitions={data.competitions}
      selectedId={data.selectedId}
      teams={data.teams}
      canWrite={hasUnifiedAdminPermission(actor.roles, "competitions:write")}
    />
  </>;
}
