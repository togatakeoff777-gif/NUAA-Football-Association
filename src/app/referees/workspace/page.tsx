import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RefereeMemberLogoutButton } from "@/components/referees/mvp/referee-member-logout-button";
import { RefereeSubnav } from "@/components/referees/mvp/public-appointment-list";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { getRefereeMemberSession } from "@/lib/referee-member-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "裁判员工作区",
  description: "查看个人执裁意向、审核状态和已发布任务。",
};
export const dynamic = "force-dynamic";

const applicationStatusLabels = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
  WITHDRAWN: "已撤回",
} as const;

export default async function RefereeWorkspacePage() {
  const session = await getRefereeMemberSession();
  if (!session) redirect("/referees/login");

  const [applications, assignedPositions] = await Promise.all([
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
        appointment: { status: "PUBLISHED" },
      },
      include: {
        appointment: {
          include: {
            match: {
              include: { competition: true, homeTeam: true, awayTeam: true },
            },
          },
        },
      },
      orderBy: { appointment: { updatedAt: "desc" } },
    }),
  ]);

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
          </div>
        </section>
        <RefereeSubnav />
        <section className="functional-section">
          <div className="detail-shell referee-workspace-grid">
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
