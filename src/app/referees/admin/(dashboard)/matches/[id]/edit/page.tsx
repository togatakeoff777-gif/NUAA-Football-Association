import { notFound } from "next/navigation";

import { AdminMatchForm, type AdminMatchRecord, type CompetitionOption } from "@/components/referees/admin/admin-match-form";
import { toShanghaiDateTimeInput } from "@/components/referees/admin/admin-presenters";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { getPositionTemplate } from "@/lib/referee-roles";
import { prisma } from "@/lib/prisma";

export default async function EditAdminMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, competitions] = await Promise.all([
    prisma.match.findUnique({ where: { id }, include: { positionRequirements: true } }),
    prisma.competition.findMany({ include: { teams: { orderBy: { name: "asc" } } }, orderBy: [{ year: "desc" }, { name: "asc" }] }),
  ]);
  if (!match) notFound();
  const options: CompetitionOption[] = competitions.map((item) => ({ id: item.id, name: item.name, format: item.format, teams: item.teams.map((team) => ({ id: team.id, name: team.name })), positions: getPositionTemplate(item.format).map((position) => ({ key: position.key, label: position.label })) }));
  const record: AdminMatchRecord = {
    id: match.id, slug: match.slug, competitionId: match.competitionId, stage: match.stage,
    kickoff: toShanghaiDateTimeInput(match.kickoff), endAt: toShanghaiDateTimeInput(match.endAt), venue: match.venue,
    round: match.round ?? "", source: match.source, externalMatchId: match.externalMatchId ?? "", homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId, status: match.status, applicationWindowStatus: match.applicationWindowStatus,
    applicationDeadline: toShanghaiDateTimeInput(match.applicationDeadline), publicNote: match.publicNote ?? "", internalNote: match.internalNote ?? "",
    cancellationReason: match.cancellationReason ?? "", positionCounts: Object.fromEntries(match.positionRequirements.map((position) => [position.key, position.count])),
  };
  return <><AdminPageHeader eyebrow="EDIT MATCH" title="编辑比赛" description="调整赛程与报名配置；选派业务在比赛详情中处理。" /><AdminPanel title="比赛资料"><AdminMatchForm competitions={options} match={record} /></AdminPanel></>;
}
