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
    <AdminPageHeader eyebrow="PUBLIC TEAM DIRECTORY" title="公开组队目录" description="选择官网当前展示的赛事，维护协会联系人，并从正式组织与球队记录中管理组队信息。" />
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
      units={data.units}
      selectedId={data.selectedId}
      teams={data.teams}
      canWrite={hasUnifiedAdminPermission(actor.roles, "competitions:write")}
    />
  </>;
}
