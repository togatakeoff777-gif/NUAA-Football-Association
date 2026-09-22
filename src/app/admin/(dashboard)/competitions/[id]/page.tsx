import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminCompetitionWorkspace } from "@/components/referees/admin/admin-competition-workspace";
import { AdminPageHeader, competitionStatusLabels } from "@/components/referees/admin/admin-ui";
import { affiliationOptionLabel, sortAffiliationOptions } from "@/lib/referee-affiliation-options";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { prisma } from "@/lib/prisma";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";
import { hasUnifiedAdminPermission } from "@/lib/unified-admin-rbac";

export default async function CompetitionWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await guardUnifiedAdminPage("competitions:read", "competitions");
  const { id } = await params;
  const [competition, rawUnits] = await Promise.all([
    prisma.competition.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            unitAffiliations: { select: { unitId: true } },
            _count: { select: { homeMatches: true, awayMatches: true } },
          },
          orderBy: { name: "asc" },
        },
        matches: {
          include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
          orderBy: { kickoff: "asc" },
        },
        _count: { select: { disciplineDetails: true } },
      },
    }),
    prisma.affiliationUnit.findMany({ include: { legacyCollege: { include: { codeMappings: true } } } }),
  ]);
  if (!competition) notFound();
  const units = sortAffiliationOptions(rawUnits.map((unit) => ({ id: unit.id, name: unit.name, type: unit.type, prefixes: unit.legacyCollege?.codeMappings.map((mapping) => mapping.prefix) ?? [] })))
    .map((unit) => ({ ...unit, label: affiliationOptionLabel(unit) }));
  const canWrite = hasUnifiedAdminPermission(actor.roles, "competitions:write");
  return <>
    <AdminPageHeader eyebrow="COMPETITION WORKSPACE" title={competition.name} description={`${competition.playingFormat ?? (competition.format === "FUTSAL" ? "五人制" : competition.format === "ELEVEN_A_SIDE" ? "十一人制" : "比赛制式待补充")} · 当前赛事工作台`} actions={<Link className="admin-button admin-button-secondary" href="/admin/competitions">返回赛事列表</Link>} />
    <AdminCompetitionWorkspace
      canWrite={canWrite}
      competition={{
        id: competition.id,
        name: competition.name,
        formatLabel: competition.playingFormat ?? (competition.format === "FUTSAL" ? "五人制" : competition.format === "ELEVEN_A_SIDE" ? "十一人制" : "比赛制式待补充"),
        statusLabel: competitionStatusLabels[competition.status],
        year: competition.year,
        slug: competition.slug,
        deletionProtectedReason: competition.teams.length || competition.matches.length || competition._count.disciplineDetails || competition.publicPublished || competition.homepageFeatured || competition.source !== "MANUAL" || competition.externalCompetitionId
          ? "该赛事已有参赛球队、比赛、公开发布或其他正式数据，不能直接删除。请保留历史并逐项核对。"
          : undefined,
      }}
      matches={competition.matches.map((match) => ({ id: match.id, matchup: `${match.homeTeam.name} vs ${match.awayTeam.name}`, kickoff: formatRefereeDateTime(match.kickoff), venue: match.venue, status: match.status }))}
      teams={competition.teams.map((team) => ({ id: team.id, name: team.name, teamType: team.teamType, unitIds: team.unitAffiliations.map((item) => item.unitId), matchCount: team._count.homeMatches + team._count.awayMatches }))}
      units={units}
    />
  </>;
}
