import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RefereeApplicationForm } from "@/components/referees/mvp/referee-application-form";
import { JsonLd } from "@/components/seo/json-ld";
import { ShareActions } from "@/components/share/share-actions";
import { RefereeSubnav } from "@/components/referees/mvp/public-appointment-list";
import { ASSOCIATION_EMAIL } from "@/data/platforms";
import {
  getRefereeMemberConfigurationIssue,
  getRefereeMemberSession,
} from "@/lib/referee-member-auth";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { formatLabels, getPositionTemplate } from "@/lib/referee-roles";
import { prisma } from "@/lib/prisma";
import { sportsEventJsonLd } from "@/lib/structured-data";

type OpenMatchDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: OpenMatchDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    alternates: { canonical: `/referees/open-matches/${slug}` },
    title: "比赛执裁意向",
    description:
      "公开查看比赛岗位需求；裁判工作区正式启用后，已登记裁判员可提交执裁意向。",
  };
}

export const dynamic = "force-dynamic";

export default async function OpenMatchDetailPage({
  params,
}: OpenMatchDetailPageProps) {
  const { slug } = await params;
  const match = await prisma.match.findFirst({
    where: {
      slug,
      isTestData: false,
      competition: { isTestData: false },
    },
    include: { competition: true, homeTeam: true, awayTeam: true, positionRequirements: { orderBy: { sortOrder: "asc" } } },
  });
  if (!match) notFound();

  const accepting =
    match.status === "SCHEDULED" &&
    match.applicationWindowStatus === "OPEN" &&
    Boolean(
      match.applicationDeadline && match.applicationDeadline > new Date(),
    );
  const workspaceAvailable = !getRefereeMemberConfigurationIssue();
  const session = await getRefereeMemberSession();
  const fallbackPositions = getPositionTemplate(match.competition.format).map((item) => ({ key: item.key, label: item.label, count: 1, order: item.order }));
  const positions = match.positionRequirements.length
    ? match.positionRequirements.map((item) => ({ key: item.key, label: item.label, count: item.count, order: item.sortOrder }))
    : fallbackPositions;
  const eligible =
    session &&
    !session.referee.mustChangePassword &&
    (match.competition.format === "ELEVEN_A_SIDE"
      ? session.referee.elevenASide
      : session.referee.futsal);

  let applicationPanel = (
    <div className="functional-empty functional-empty-compact">
      <strong>当前不可提交</strong>
      <p>比赛尚未开放、报名已截止或场次状态已发生变化。</p>
    </div>
  );

  if (accepting && eligible) {
    applicationPanel = (
      <RefereeApplicationForm
        matchId={match.id}
        positions={positions.map(({ key, label }) => ({ key, label }))}
        referee={session.referee}
      />
    );
  } else if (accepting && !workspaceAvailable) {
    applicationPanel = (
      <div className="functional-empty functional-empty-compact" role="status">
        <strong>裁判员工作区暂未开放</strong>
        <p>
          裁判员账号申请功能暂未开放。未来将由裁判员自主申请，经协会审核通过后启用账号。如需联系裁判事务，请发送邮件至{" "}
          <a href={`mailto:${ASSOCIATION_EMAIL}`}>{ASSOCIATION_EMAIL}</a>。
        </p>
      </div>
    );
  } else if (accepting && !session) {
    applicationPanel = (
      <div className="functional-empty functional-empty-compact referee-login-prompt">
        <strong>登录后提交</strong>
        <p>比赛和岗位信息对访客公开，正式执裁意向仅限已登记裁判员提交。</p>
        <Link href="/referees/login">裁判员登录 →</Link>
      </div>
    );
  } else if (accepting && !eligible) {
    applicationPanel = (
      <div className="functional-empty functional-empty-compact">
        <strong>{session?.referee.mustChangePassword ? "请先修改初始密码" : "当前账号不适用该赛制"}</strong>
        <p>{session?.referee.mustChangePassword ? <Link href="/referees/workspace/account">前往账号与密码设置 →</Link> : "如需更新可执裁赛制，请联系协会管理员核验名录信息。"}</p>
      </div>
    );
  }

  return (
    <>
      <SiteHeader />
      <JsonLd data={sportsEventJsonLd({ name: `${match.homeTeam.name} vs ${match.awayTeam.name}`, description: `${match.competition.name} · ${match.stage}`, path: `/referees/open-matches/${match.slug}`, status: match.status === "CANCELLED" ? "EventCancelled" : match.status === "COMPLETED" ? "EventCompleted" : "EventScheduled", startDate: match.kickoff.toISOString(), location: match.venue })} />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>MATCH APPOINTMENT</p>
            <h1>
              {match.homeTeam.name} vs {match.awayTeam.name}
            </h1>
            <p>
              {match.competition.name} · {match.stage}
            </p>
          </div>
        </section>
        <RefereeSubnav />
        <section className="functional-section">
          <div className="detail-shell referee-match-detail">
            <article>
              <header>
                <span>{formatLabels[match.competition.format]}</span>
                <strong>{accepting ? "开放报名" : "报名已关闭"}</strong>
              </header>
              <dl>
                <div>
                  <dt>开球时间</dt>
                  <dd>{formatRefereeDateTime(match.kickoff)}</dd>
                </div>
                <div>
                  <dt>比赛场地</dt>
                  <dd>{match.venue}</dd>
                </div>
                <div>
                  <dt>比赛阶段</dt>
                  <dd>{match.stage}</dd>
                </div>
                <div>
                  <dt>报名截止</dt>
                  <dd>
                    {match.applicationDeadline
                      ? formatRefereeDateTime(match.applicationDeadline)
                      : "未开放"}
                  </dd>
                </div>
              </dl>
              <h2>本场岗位</h2>
              <ol>
                {positions.map((position) => (
                  <li key={position.key}>
                    <span>{String(position.order).padStart(2, "0")}</span>
                    {position.label} · {position.count} 人
                  </li>
                ))}
              </ol>
              {match.publicNote ? <p className="referee-public-note">{match.publicNote}</p> : null}
              <ShareActions title={`${match.homeTeam.name} vs ${match.awayTeam.name}`} text={`${match.competition.name} · ${match.stage}`} />
            </article>
            <aside>
              <h2>提交执裁意向</h2>
              {applicationPanel}
              <Link className="detail-link" href="/referees/open-matches">
                ← 返回待选派比赛
              </Link>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
