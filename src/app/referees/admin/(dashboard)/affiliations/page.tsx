import { AffiliationsManager } from "@/components/referees/admin/admin-data-managers";
import { AdminPageHeader } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";

export default async function AdminAffiliationsPage() {
  const [units, teams, competitions] = await Promise.all([
    prisma.affiliationUnit.findMany({
      include: {
        legacyCollege: { include: { codeMappings: { orderBy: { prefix: "asc" } } } },
        parentRelations: { select: { childUnitId: true } },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.team.findMany({ include: { competition: { select: { name: true } }, unitAffiliations: { select: { unitId: true } } }, orderBy: [{ competition: { name: "asc" } }, { name: "asc" }] }),
    prisma.competition.findMany({ select: { id: true, name: true }, orderBy: [{ year: "desc" }, { name: "asc" }] }),
  ]);
  return <><AdminPageHeader eyebrow="ORGANIZATIONS & TEAMS" title="组织与球队" description="维护学院、书院、组成关系、学号学院建议与球队组织关联。" /><AffiliationsManager competitions={competitions} units={units.map((item) => ({ id: item.id, name: item.name, type: item.type, childIds: item.parentRelations.map((relation) => relation.childUnitId), mappings: item.legacyCollege?.codeMappings.map((mapping) => ({ id: mapping.id, prefix: mapping.prefix, note: mapping.note ?? "" })) ?? [] }))} teams={teams.map((item) => ({ id: item.id, name: item.name, competitionId: item.competitionId, competition: item.competition.name, teamType: item.teamType, unitIds: item.unitAffiliations.map((affiliation) => affiliation.unitId) }))} /></>;
}
