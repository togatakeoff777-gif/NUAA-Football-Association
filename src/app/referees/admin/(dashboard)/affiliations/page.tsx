import { AffiliationsManager } from "@/components/referees/admin/admin-data-managers";
import { AdminPageHeader } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";

export default async function AdminAffiliationsPage() {
  const [colleges, teams] = await Promise.all([
    prisma.college.findMany({ include: { codeMappings: { orderBy: { prefix: "asc" } } }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ include: { competition: { select: { name: true } }, affiliations: { select: { collegeId: true } } }, orderBy: [{ competition: { name: "asc" } }, { name: "asc" }] }),
  ]);
  return <><AdminPageHeader eyebrow="COLLEGES & TEAMS" title="学院与球队" description="集中维护学院、学号代码建议与球队多学院归属。" /><AffiliationsManager colleges={colleges.map((item) => ({ id: item.id, name: item.name, mappings: item.codeMappings.map((mapping) => ({ id: mapping.id, prefix: mapping.prefix, note: mapping.note ?? "" })) }))} teams={teams.map((item) => ({ id: item.id, name: item.name, competition: item.competition.name, collegeIds: item.affiliations.map((affiliation) => affiliation.collegeId) }))} /></>;
}
