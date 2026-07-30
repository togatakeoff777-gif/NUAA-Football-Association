import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ApplicationStatus } from "@/generated/prisma/client";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminOperationsPanel } from "@/components/referees/mvp/admin-operations-panel";
import { AdminRefereePanel } from "@/components/referees/mvp/admin-referee-panel";
import { getAdminSession } from "@/lib/referee-auth";
import {
  applicationStatusLabels,
  appointmentStatusLabels,
  formatRefereeDateTime,
  parsePreferredPositions,
} from "@/lib/referee-presenters";
import { getPositionTemplate } from "@/lib/referee-roles";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/admin" },
  title: "裁判管理后台",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const allowedStatuses = [
  "PENDING",
  "REVIEWING",
  "APPROVED",
  "REJECTED",
  "NOT_SELECTED",
  "APPOINTED",
  "WITHDRAWN",
] as const;

function localInput(value: Date | null) {
  return value
    ? new Date(value.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16)
    : "";
}

export default async function RefereeAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; match?: string; status?: string }>;
}) {
  if (!(await getAdminSession())) redirect("/referees/admin/login");
  const query = await searchParams;
  const status = allowedStatuses.includes(query.status as ApplicationStatus)
    ? query.status as ApplicationStatus
    : undefined;

  const [
    competitions,
    matchOptions,
    applications,
    editableMatches,
    allReferees,
    appointmentHistory,
    audit,
  ] = await Promise.all([
    prisma.competition.findMany({
      include: { teams: { orderBy: { name: "asc" } } },
      orderBy: [{ year: "desc" }, { name: "asc" }],
    }),
    prisma.match.findMany({
      include: {
        competition: true,
        homeTeam: true,
        awayTeam: true,
        positionRequirements: true,
      },
      orderBy: { kickoff: "desc" },
    }),
    prisma.refereeApplication.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(query.match ? { matchId: query.match } : {}),
        ...(query.competition
          ? { match: { competitionId: query.competition } }
          : {}),
      },
      include: {
        referee: true,
        match: {
          include: { competition: true, homeTeam: true, awayTeam: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.findMany({
      where: { status: "SCHEDULED" },
      include: {
        competition: true,
        homeTeam: true,
        awayTeam: true,
        positionRequirements: true,
        appointment: { include: { positions: true } },
      },
      orderBy: { kickoff: "asc" },
    }),
    prisma.referee.findMany({ orderBy: { publicCode: "asc" } }),
    prisma.refereeAppointment.findMany({
      include: {
        match: {
          include: { competition: true, homeTeam: true, awayTeam: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const activeReferees = allReferees.filter((item) => item.status === "ACTIVE");
  const operationCompetitions = competitions.map((item) => ({
    id: item.id,
    name: item.name,
    format: item.format,
    teams: item.teams.map((team) => ({ id: team.id, name: team.name })),
    positions: getPositionTemplate(item.format).map(({ key, label }) => ({ key, label })),
  }));
  const operationMatches = matchOptions.map((item) => ({
    id: item.id,
    slug: item.slug,
    competitionId: item.competitionId,
    stage: item.stage,
    kickoff: localInput(item.kickoff),
    venue: item.venue,
    homeTeamId: item.homeTeamId,
    awayTeamId: item.awayTeamId,
    status: item.status,
    applicationWindowStatus: item.applicationWindowStatus,
    applicationDeadline: localInput(item.applicationDeadline),
    publicNote: item.publicNote ?? "",
    internalNote: item.internalNote ?? "",
    cancellationReason: item.cancellationReason ?? "",
    positionCounts: Object.fromEntries(
      item.positionRequirements.map((position) => [position.key, position.count]),
    ),
  }));

  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>REFEREE OPERATIONS</p>
            <h1>裁判管理后台</h1>
            <p>管理裁判员账号与开放场次，审核执裁意向，保存、发布、撤回或重新发布选派，并保留审计记录。</p>
          </div>
        </section>
        <section className="functional-section referee-admin-page">
          <div className="detail-shell">
            <AdminOperationsPanel
              accounts={allReferees.map((item) => ({
                id: item.id,
                publicCode: item.publicCode,
                name: item.name,
                status: item.status,
                elevenASide: item.elevenASide,
                futsal: item.futsal,
                certificateNote: item.certificateNote ?? "",
                trainingStatus: item.trainingStatus,
                publicDirectoryEnabled: item.publicDirectoryEnabled,
                publicBio: item.publicBio ?? "",
                internalNote: item.internalNote ?? "",
                mustChangePassword: item.mustChangePassword,
              }))}
              competitions={operationCompetitions}
              matches={operationMatches}
              audit={audit.map((item) => ({
                id: item.id,
                action: item.action,
                summary: item.summary,
                createdAt: formatRefereeDateTime(item.createdAt),
              }))}
            />
            <form className="referee-admin-filters" method="get">
              <label>
                <span>赛事</span>
                <select defaultValue={query.competition ?? ""} name="competition">
                  <option value="">全部赛事</option>
                  {competitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>
                <span>比赛</span>
                <select defaultValue={query.match ?? ""} name="match">
                  <option value="">全部比赛</option>
                  {matchOptions.map((item) => <option key={item.id} value={item.id}>{item.homeTeam.name} vs {item.awayTeam.name}</option>)}
                </select>
              </label>
              <label>
                <span>报名状态</span>
                <select defaultValue={status ?? ""} name="status">
                  <option value="">全部状态</option>
                  {allowedStatuses.map((value) => <option key={value} value={value}>{applicationStatusLabels[value]}</option>)}
                </select>
              </label>
              <button type="submit">应用筛选</button>
            </form>
            <AdminRefereePanel
              applications={applications.map((item) => ({
                id: item.id,
                referee: `${item.referee.publicCode} · ${item.referee.name}`,
                match: `${item.match.homeTeam.name} vs ${item.match.awayTeam.name}`,
                competition: item.match.competition.name,
                status: applicationStatusLabels[item.status],
                statusKey: item.status,
                preferred: parsePreferredPositions(item.preferredPositions)
                  .map((key) =>
                    getPositionTemplate(item.match.competition.format)
                      .find((position) => position.key === key)?.label ?? key,
                  )
                  .join(" / "),
                note: item.note,
                createdAt: formatRefereeDateTime(item.createdAt),
              }))}
              matches={editableMatches.map((item) => {
                const configuredPositions = item.positionRequirements.length
                  ? item.positionRequirements
                  : getPositionTemplate(item.competition.format).map((position) => ({
                      ...position,
                      count: 1,
                    }));
                return {
                  id: item.id,
                  appointmentId: item.appointment?.id ?? null,
                  label: `${item.competition.name} · ${item.homeTeam.name} vs ${item.awayTeam.name}`,
                  status: item.appointment
                    ? appointmentStatusLabels[item.appointment.status]
                    : "未建草稿",
                  publicationNote: item.appointment?.publicationNote ?? "",
                  format: item.competition.format,
                  template: configuredPositions.flatMap((position) =>
                    Array.from({ length: position.count }, (_, index) => ({
                      key: position.key,
                      label: position.label,
                      slot: index + 1,
                    })),
                  ),
                  positions:
                    item.appointment?.positions.map(({ key, slot, refereeId }) => ({
                      key,
                      slot,
                      refereeId,
                    })) ?? [],
                };
              })}
              referees={activeReferees.map((item) => ({
                id: item.id,
                label: `${item.publicCode} · ${item.name}`,
                elevenASide: item.elevenASide,
                futsal: item.futsal,
              }))}
              history={appointmentHistory.map((item) => ({
                id: item.id,
                match: `${item.match.homeTeam.name} vs ${item.match.awayTeam.name}`,
                competition: item.match.competition.name,
                status: appointmentStatusLabels[item.status],
                updatedAt: formatRefereeDateTime(item.updatedAt),
              }))}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
