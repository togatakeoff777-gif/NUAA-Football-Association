import Link from "next/link";

import { AdminMatchForm, type CompetitionOption } from "@/components/referees/admin/admin-match-form";
import { AdminMatchNavigation } from "@/components/referees/admin/admin-match-navigation";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { affiliationOptionLabel, sortAffiliationOptions } from "@/lib/referee-affiliation-options";
import { getPositionTemplate } from "@/lib/referee-roles";

export default async function NewAdminMatchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const initialCompetitionId = typeof query.competition === "string" ? query.competition : "";
  const [competitions, units] = await Promise.all([
    prisma.competition.findMany({ include: { teams: { include: { unitAffiliations: { select: { unitId: true } } }, orderBy: { name: "asc" } } }, orderBy: [{ year: "desc" }, { name: "asc" }] }),
    prisma.affiliationUnit.findMany({ include: { legacyCollege: { include: { codeMappings: true } } } }),
  ]);
  const options: CompetitionOption[] = competitions.map((item) => ({ id: item.id, name: item.name, format: item.format, teams: item.teams.map((team) => ({ id: team.id, name: team.name, teamType: team.teamType, unitIds: team.unitAffiliations.map((link) => link.unitId) })), positions: getPositionTemplate(item.format).map((position) => ({ key: position.key, label: position.label })) }));
  const organizationUnits = sortAffiliationOptions(units.map((unit) => ({ id: unit.id, name: unit.name, type: unit.type, prefixes: unit.legacyCollege?.codeMappings.map((mapping) => mapping.prefix) ?? [] }))).map((unit) => ({ ...unit, label: affiliationOptionLabel(unit) }));
  return <><AdminPageHeader eyebrow="NEW MATCH" title="新建比赛" description="先选择赛事，再选择已有球队或按需建立学院、书院代表队。" /><AdminMatchNavigation active="matches" /><AdminPanel title="比赛资料">{options.length ? <AdminMatchForm competitions={options} initialCompetitionId={initialCompetitionId} organizationUnits={organizationUnits} /> : <div className="admin-empty-state"><strong>当前没有可用赛事，请先创建赛事</strong><p>赛事是球队和具体比赛的上级对象。</p><Link className="admin-button" href="/referees/admin/matches/competitions/new">新建赛事</Link></div>}</AdminPanel></>;
}
