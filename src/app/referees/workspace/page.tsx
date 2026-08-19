import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RefereeMemberLogoutButton } from "@/components/referees/mvp/referee-member-logout-button";
import { RefereeWorkspaceR1 } from "@/components/referees/mvp/referee-workspace-r1";
import { ApplicationWithdrawButton } from "@/components/referees/mvp/application-withdraw-button";
import { RefereeSubnav } from "@/components/referees/mvp/public-appointment-list";
import { applicationStatusLabels, formatRefereeDateTime } from "@/lib/referee-presenters";
import { getRefereeMemberSession } from "@/lib/referee-member-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/workspace" },
  title: "裁判员工作区",
  description: "查看个人执裁意向、审核状态和已发布任务。",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function RefereeWorkspacePage() {
  const session = await getRefereeMemberSession();
  if (!session) redirect("/referees/login");
  if (session.referee.mustChangePassword) redirect("/referees/workspace/account");

  const [applications, assignedPositions, availability] = await Promise.all([
    prisma.refereeApplication.findMany({
      where: { refereeId: session.refereeId },
      include: {
        match: {
          include: { competition: true, homeTeam: true, awayTeam: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appointmentPosition.findMany({
      where: {
        refereeId: session.refereeId,
        appointment: { status: { in: ["PUBLISHED", "COMPLETED"] } },
      },
      include: {
        appointment: {
          include: {
            versions: {
              orderBy: { revision: "desc" },
              take: 1,
              include: {
                acknowledgements: { where: { refereeId: session.refereeId } },
                conflictReports: { where: { refereeId: session.refereeId } },
              },
            },
            match: {
              include: { competition: true, homeTeam: true, awayTeam: true },
            },
          },
        },
      },
      orderBy: { appointment: { updatedAt: "desc" } },
    }),
    prisma.refereeAvailability.findMany({
      where: { refereeId: session.refereeId },
      orderBy: { startAt: "asc" },
    }),
  ]);

  const now = new Date();
  const upcomingPositions = assignedPositions.filter(
    (item) => item.appointment.status === "PUBLISHED" && item.appointment.match.kickoff > now,
  );
  const historicalPositions = assignedPositions.filter(
    (item) => item.appointment.status === "COMPLETED" || item.appointment.match.kickoff <= now,
  );
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero referee-workspace-hero">
          <div className="detail-shell">
            <p>REFEREE WORKSPACE</p>
            <h1>{session.referee.name}的裁判员工作区</h1>
            <p>
              {session.referee.publicCode} · 可查看个人申请、审核状态与正式发布的选派结果。
            </p>
            <RefereeMemberLogoutButton />
            <Link href="/referees/workspace/account">账号与密码设置 →</Link>
          </div>
        </section>
        <RefereeSubnav showWorkspace />
        <section className="functional-section">
          <div className="detail-shell referee-workspace-grid">
            <RefereeWorkspaceR1
              availability={availability.map((item) => ({
                id: item.id,
                startAt: formatRefereeDateTime(item.startAt),
                endAt: formatRefereeDateTime(item.endAt),
                kind: item.kind,
                note: item.note ?? "",
              }))}
              profile={{
                phone: session.referee.phone ?? "",
                qq: session.referee.qq ?? "",
                studentId: session.referee.studentId ?? "",
                college: session.referee.college?.name ?? "",
                grade: session.referee.grade ?? "",
                refereeLevel: session.referee.refereeLevel ?? "",
              }}
              tasks={assignedPositions.map((position) => {
                const version = position.appointment.versions[0];
                return {
                  appointmentId: position.appointment.id,
                  competition: position.appointment.match.competition.name,
                  matchup: `${position.appointment.match.homeTeam.name} vs ${position.appointment.match.awayTeam.name}`,
                  kickoff: formatRefereeDateTime(position.appointment.match.kickoff),
                  position: position.label,
                  status: position.appointment.status,
                  versionId: version?.id ?? null,
                  acknowledgedAt: version?.acknowledgements[0]
                    ? formatRefereeDateTime(version.acknowledgements[0].acknowledgedAt)
                    : null,
                  reportStatus: version?.conflictReports[0]?.status ?? null,
                };
              })}
            />
            <section>
              <header className="functional-section-heading">
                <div>
                  <p>APPLICATIONS</p>
                  <h2>我的执裁意向</h2>
                </div>
                <Link href="/referees/open-matches">查看开放比赛</Link>
              </header>
              {applications.length ? (
                <div className="referee-personal-list">
                  {applications.map((application) => (
                    <article key={application.id}>
                      <div>
                        <span>{application.match.competition.name}</span>
                        <h3>
                          {application.match.homeTeam.name} vs {application.match.awayTeam.name}
                        </h3>
                        <p>{formatRefereeDateTime(application.match.kickoff)}</p>
                      </div>
                      <strong data-status={application.status}>
                        {applicationStatusLabels[application.status]}
                      </strong>
                      {application.match.applicationDeadline &&
                      application.match.applicationDeadline > now &&
                      !["APPOINTED", "WITHDRAWN"].includes(application.status) ? (
                        <ApplicationWithdrawButton applicationId={application.id} />
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="functional-empty functional-empty-compact">
                  <strong>暂无执裁意向记录</strong>
                  <p>登录后可在开放比赛详情页提交个人执裁意向。</p>
                </div>
              )}
            </section>
            <section>
              <header className="functional-section-heading">
                <div>
                  <p>ASSIGNMENTS</p>
                  <h2>我的正式任务</h2>
                </div>
              </header>
              {assignedPositions.length ? (
                <div className="referee-personal-list">
                  {assignedPositions.map((position) => (
                    <article key={position.id}>
                      <div>
                        <span>{position.appointment.match.competition.name}</span>
                        <h3>
                          {position.appointment.match.homeTeam.name} vs{" "}
                          {position.appointment.match.awayTeam.name}
                        </h3>
                        <p>{formatRefereeDateTime(position.appointment.match.kickoff)}</p>
                      </div>
                      <strong>{position.label}</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="functional-empty functional-empty-compact">
                  <strong>暂无已发布任务</strong>
                  <p>只有管理员正式发布且未撤回的选派会显示在这里。</p>
                </div>
              )}
            </section>
            <section>
              <header className="functional-section-heading"><div><p>UPCOMING</p><h2>即将进行的任务</h2></div></header>
              {upcomingPositions.length ? <div className="referee-personal-list">{upcomingPositions.map((position) => <article key={`upcoming-${position.id}`}><div><span>{position.appointment.match.competition.name}</span><h3>{position.appointment.match.homeTeam.name} vs {position.appointment.match.awayTeam.name}</h3><p>{formatRefereeDateTime(position.appointment.match.kickoff)}</p></div><strong>{position.label}</strong></article>)}</div> : <div className="functional-empty functional-empty-compact"><strong>暂无即将进行的任务</strong><p>新任务将在正式发布后显示。</p></div>}
            </section>
            <section>
              <header className="functional-section-heading"><div><p>HISTORY</p><h2>历史任务</h2></div></header>
              {historicalPositions.length ? <div className="referee-personal-list">{historicalPositions.map((position) => <article key={`history-${position.id}`}><div><span>{position.appointment.match.competition.name}</span><h3>{position.appointment.match.homeTeam.name} vs {position.appointment.match.awayTeam.name}</h3><p>{formatRefereeDateTime(position.appointment.match.kickoff)}</p></div><strong>{position.label}</strong></article>)}</div> : <div className="functional-empty functional-empty-compact"><strong>暂无历史任务</strong><p>已完成的正式任务会保留在这里。</p></div>}
            </section>
            <section className="referee-training-panel">
              <p>TRAINING & DEVELOPMENT</p>
              <h2>培训与发展</h2>
              <p>培训时间、课程安排与考核通知以协会正式通知为准，当前暂无已确认的公开计划。</p>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
