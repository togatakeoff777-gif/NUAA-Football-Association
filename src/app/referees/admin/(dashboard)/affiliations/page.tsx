import { AffiliationsManager } from "@/components/referees/admin/admin-data-managers";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { affiliationOptionLabel, sortAffiliationOptions } from "@/lib/referee-affiliation-options";
import { getUnifiedAdminActor, hasUnifiedAdminPermission } from "@/lib/unified-admin-rbac";

export default async function AdminAffiliationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const initialTab = query.tab === "teams" ? "teams" : "colleges";
  const initialCompetitionId = typeof query.competition === "string" ? query.competition : "";
  const [actor, units, teams, competitions] = await Promise.all([
    getUnifiedAdminActor(),
    prisma.affiliationUnit.findMany({
      include: {
        legacyCollege: { include: { codeMappings: { orderBy: { prefix: "asc" } } } },
        parentRelations: { select: { childUnitId: true } },
      },
    }),
    prisma.team.findMany({ include: { competition: { select: { name: true } }, unitAffiliations: { select: { unitId: true } } }, orderBy: [{ competition: { name: "asc" } }, { name: "asc" }] }),
    prisma.competition.findMany({ select: { id: true, name: true }, orderBy: [{ year: "desc" }, { name: "asc" }] }),
  ]);
  const canWrite = Boolean(actor && hasUnifiedAdminPermission(actor.roles, "competitions:write"));
  const unitOptions = sortAffiliationOptions(units.map((item) => ({
    id: item.id, name: item.name, type: item.type, childIds: item.parentRelations.map((relation) => relation.childUnitId),
    mappings: item.legacyCollege?.codeMappings.map((mapping) => ({ id: mapping.id, prefix: mapping.prefix, note: mapping.note ?? "" })) ?? [],
    prefixes: item.legacyCollege?.codeMappings.map((mapping) => mapping.prefix) ?? [],
  }))).map((item) => ({ ...item, label: affiliationOptionLabel(item) }));
  const teamRows = teams.map((item) => ({ id: item.id, name: item.name, competitionId: item.competitionId, competition: item.competition.name, teamType: item.teamType, unitIds: item.unitAffiliations.map((affiliation) => affiliation.unitId) }));
  return <><AdminPageHeader eyebrow="ORGANIZATIONS & TEAMS" title="组织与球队" description="管理学院、书院及参赛球队的组织归属关系，用于球队创建与裁判选派时的组织关联提醒。日常创建比赛时可直接选择学院或书院代表队。" />{canWrite ? <AffiliationsManager competitions={competitions} initialCompetitionId={initialCompetitionId} initialTab={initialTab} units={unitOptions} teams={teamRows} /> : <><AdminPanel title={`组织单位 · ${unitOptions.length}`} description="当前账号拥有只读权限。"><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>名称</th><th>类型</th><th>学号映射</th><th>关联球队</th></tr></thead><tbody>{unitOptions.map((unit) => <tr key={unit.id}><td><strong>{unit.label}</strong></td><td>{unit.type === "COLLEGE" ? "学院" : "书院"}</td><td>{unit.prefixes.join("、") || "—"}</td><td>{teamRows.filter((team) => team.unitIds.includes(unit.id)).length}</td></tr>)}</tbody></table></div></AdminPanel><AdminPanel title={`参赛球队 · ${teamRows.length}`} description="球队与赛事、组织的现有关联。"><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>球队</th><th>赛事</th><th>类型</th><th>组织数</th></tr></thead><tbody>{teamRows.map((team) => <tr key={team.id}><td><strong>{team.name}</strong></td><td>{team.competition}</td><td>{team.teamType}</td><td>{team.unitIds.length}</td></tr>)}</tbody></table></div></AdminPanel></>}</>;
}
