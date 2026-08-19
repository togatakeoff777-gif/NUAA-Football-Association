import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ApplicationStatus } from "@/generated/prisma-v29/client";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminOperationsPanel } from "@/components/referees/mvp/admin-operations-panel";
import { AdminR1Panel } from "@/components/referees/mvp/admin-r1-panel";
import { AdminRefereePanel } from "@/components/referees/mvp/admin-referee-panel";
import { getAdminActor, getAdminSession } from "@/lib/referee-auth";
import { adminRefereeSelect } from "@/lib/referee-dto";
import {
  applicationStatusLabels,
  appointmentStatusLabels,
  formatRefereeDateTime,
  parsePreferredPositions,
} from "@/lib/referee-presenters";
import { getPositionTemplate } from "@/lib/referee-roles";
import { prisma } from "@/lib/prisma";
import { getCompletedRefereeStatistics } from "@/lib/referee-r1-service";

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

function localDate(value: Date | null) {
  return value ? localInput(value).slice(0, 10) : "";
}

function shanghaiDayRange(now = new Date()) {
  const shifted = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const start = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 8 * 60 * 60 * 1000);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export default async function RefereeAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; match?: string; status?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/referees/admin/login");
  const actor = getAdminActor(session)!;
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
        referee: { select: { id: true, publicCode: true, name: true } },
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
    prisma.referee.findMany({
      select: {
        ...adminRefereeSelect,
        availability: { orderBy: { startAt: "asc" } },
      },
      orderBy: { publicCode: "asc" },
    }),
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

  const { start: todayStart, end: todayEnd } = shanghaiDayRange();
  const [
    colleges,
    affiliatedTeams,
    conflictReports,
    statistics,
    versions,
    adminAccounts,
    todayMatches,
    awaitingAssignment,
    publishedAppointments,
  ] = await Promise.all([
    prisma.college.findMany({
      include: { codeMappings: { orderBy: { prefix: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      include: { competition: { select: { name: true } }, affiliations: true },
      orderBy: { name: "asc" },
    }),
    prisma.appointmentConflictReport.findMany({
      include: {
        referee: { select: { publicCode: true, name: true } },
        appointment: {
          select: {
            match: { select: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
          },
        },
      },
      orderBy: { reportedAt: "desc" },
      take: 100,
    }),
    getCompletedRefereeStatistics(),
    prisma.appointmentVersion.findMany({
      include: {
        createdByAdmin: { select: { displayName: true, username: true } },
        appointment: {
          select: {
            match: { select: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    actor.role === "SUPER_ADMIN"
      ? prisma.adminAccount.findMany({
          select: { id: true, username: true, displayName: true, role: true, isActive: true, lastLoginAt: true },
          orderBy: { username: "asc" },
        })
      : Promise.resolve([]),
    prisma.match.count({ where: { kickoff: { gte: todayStart, lt: todayEnd }, status: { not: "CANCELLED" } } }),
    prisma.match.count({ where: { status: "SCHEDULED", OR: [{ appointment: null }, { appointment: { status: { in: ["DRAFT", "WITHDRAWN"] } } }] } }),
    prisma.refereeAppointment.count({ where: { status: "PUBLISHED" } }),
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
    endAt: localInput(item.endAt),
    venue: item.venue,
    round: item.round ?? "",
    source: item.source,
    externalMatchId: item.externalMatchId ?? "",
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
            <AdminR1Panel
              actorName={actor.displayName}
              actorRole={actor.role}
              mustChangePassword={session.adminAccount?.mustChangePassword ?? false}
              adminAccounts={adminAccounts.map((account) => ({
                ...account,
                lastLoginAt: account.lastLoginAt ? formatRefereeDateTime(account.lastLoginAt) : "",
              }))}
              colleges={colleges.map((college) => ({
                id: college.id,
                name: college.name,
                mappings: college.codeMappings.map((mapping) => ({
                  id: mapping.id,
                  prefix: mapping.prefix,
                })),
              }))}
              conflictReports={conflictReports.map((report) => ({
                id: report.id,
                referee: `${report.referee.publicCode} · ${report.referee.name}`,
                match: `${report.appointment.match.homeTeam.name} vs ${report.appointment.match.awayTeam.name}`,
                reason: report.reason,
                reportedAt: formatRefereeDateTime(report.reportedAt),
                status: report.status,
                resolutionNote: report.resolutionNote ?? "",
              }))}
              isLegacy={actor.isLegacy}
              overview={{
                todayMatches,
                awaitingAssignment,
                published: publishedAppointments,
                pendingReports: conflictReports.filter((report) => report.status === "PENDING").length,
              }}
              referees={allReferees.map((referee) => ({
                id: referee.id,
                label: `${referee.publicCode} · ${referee.name}`,
                availability: referee.availability.map((item) => ({
                  id: item.id,
                  kind: item.kind,
                  startAt: formatRefereeDateTime(item.startAt),
                  endAt: formatRefereeDateTime(item.endAt),
                  note: item.note ?? "",
                })),
              }))}
              statistics={statistics.map((item) => ({
                refereeId: item.refereeId,
                publicCode: item.publicCode,
                name: item.name,
                totalMatches: item.totalMatches,
                positions: item.positions,
                competitions: item.competitions,
              }))}
              teams={affiliatedTeams.map((team) => ({
                id: team.id,
                name: team.name,
                competition: team.competition.name,
                collegeIds: team.affiliations.map((affiliation) => affiliation.collegeId),
              }))}
              versions={versions.map((version) => ({
                id: version.id,
                appointment: `${version.appointment.match.homeTeam.name} vs ${version.appointment.match.awayTeam.name}`,
                revision: version.revision,
                status: version.status,
                reason: version.reason ?? "",
                overrideReason: version.overrideReason ?? "",
                actor: version.createdByAdmin
                  ? `${version.createdByAdmin.displayName} (${version.createdByAdmin.username})`
                  : "Legacy / 未记录",
                createdAt: formatRefereeDateTime(version.createdAt),
              }))}
            />
            <AdminOperationsPanel
              accounts={allReferees.map((item) => ({
                id: item.id,
                publicCode: item.publicCode,
                name: item.name,
                studentId: item.studentId ?? "",
                collegeId: item.collegeId ?? "",
                grade: item.grade ?? "",
                phone: item.phone ?? "",
                qq: item.qq ?? "",
                refereeLevel: item.refereeLevel ?? "",
                joinedAt: localDate(item.joinedAt),
                status: item.status,
                elevenASide: item.elevenASide,
                futsal: item.futsal,
                certificateNote: item.certificateNote ?? "",
                trainingStatus: item.trainingStatus,
                publicDirectoryEnabled: item.publicDirectoryEnabled,
                publicBio: item.publicBio ?? "",
                internalNote: item.internalNote ?? "",
                mustChangePassword: item.mustChangePassword,
                capabilities: item.capabilities.map((capability) => `${capability.format}:${capability.positionKey}`),
              }))}
              colleges={colleges.map((college) => ({ id: college.id, name: college.name }))}
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
                  statusKey: item.appointment?.status ?? "NONE",
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
                capabilities: item.capabilities.map((capability) => `${capability.format}:${capability.positionKey}`),
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
