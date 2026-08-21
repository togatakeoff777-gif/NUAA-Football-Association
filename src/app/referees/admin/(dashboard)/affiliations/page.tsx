import { AffiliationsManager } from "@/components/referees/admin/admin-data-managers";
import { AdminPageHeader } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { affiliationOptionLabel, sortAffiliationOptions } from "@/lib/referee-affiliation-options";

export default async function AdminAffiliationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const initialTab = query.tab === "teams" ? "teams" : "colleges";
  const initialCompetitionId = typeof query.competition === "string" ? query.competition : "";
  const [units, teams, competitions] = await Promise.all([
    prisma.affiliationUnit.findMany({
      include: {
        legacyCollege: { include: { codeMappings: { orderBy: { prefix: "asc" } } } },
        parentRelations: { select: { childUnitId: true } },
      },
    }),
    prisma.team.findMany({ include: { competition: { select: { name: true } }, unitAffiliations: { select: { unitId: true } } }, orderBy: [{ competition: { name: "asc" } }, { name: "asc" }] }),
    prisma.competition.findMany({ select: { id: true, name: true }, orderBy: [{ year: "desc" }, { name: "asc" }] }),
  ]);
  const unitOptions = sortAffiliationOptions(units.map((item) => ({
    id: item.id, name: item.name, type: item.type, childIds: item.parentRelations.map((relation) => relation.childUnitId),
    mappings: item.legacyCollege?.codeMappings.map((mapping) => ({ id: mapping.id, prefix: mapping.prefix, note: mapping.note ?? "" })) ?? [],
    prefixes: item.legacyCollege?.codeMappings.map((mapping) => mapping.prefix) ?? [],
  }))).map((item) => ({ ...item, label: affiliationOptionLabel(item) }));
  return <><AdminPageHeader eyebrow="ORGANIZATIONS & TEAMS" title="组织与球队" description="管理学院、书院及参赛球队的组织归属关系，用于球队创建与裁判选派时的组织关联提醒。日常创建比赛时可直接选择学院或书院代表队。" /><AffiliationsManager competitions={competitions} initialCompetitionId={initialCompetitionId} initialTab={initialTab} units={unitOptions} teams={teams.map((item) => ({ id: item.id, name: item.name, competitionId: item.competitionId, competition: item.competition.name, teamType: item.teamType, unitIds: item.unitAffiliations.map((affiliation) => affiliation.unitId) }))} /></>;
}
