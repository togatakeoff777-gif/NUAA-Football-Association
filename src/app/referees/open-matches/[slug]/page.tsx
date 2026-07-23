import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RefereeApplicationForm } from "@/components/referees/mvp/referee-application-form";
import { RefereeSubnav } from "@/components/referees/mvp/public-appointment-list";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { getRefereeMemberSession } from "@/lib/referee-member-auth";
import { formatLabels, getPositionTemplate } from "@/lib/referee-roles";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "比赛执裁意向", description: "公开查看比赛岗位需求；已登记裁判员登录后可提交执裁意向。" };
export const dynamic = "force-dynamic";

export default async function OpenMatchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const match = await prisma.match.findUnique({
    where: { slug },
    include: { competition: true, homeTeam: true, awayTeam: true },
  });
  if (!match) notFound();
  const accepting = match.status === "SCHEDULED" && match.applicationWindowStatus === "OPEN" && Boolean(match.applicationDeadline && match.applicationDeadline > new Date());
  const session = await getRefereeMemberSession();
  const positions = getPositionTemplate(match.competition.format);
  const eligible =
    session &&
    (match.competition.format === "ELEVEN_A_SIDE"
      ? session.referee.elevenASide
      : session.referee.futsal);

  return <><SiteHeader /><main className="functional-page" id="main-content"><section className="functional-hero"><div className="detail-shell"><p>MATCH APPOINTMENT</p><h1>{match.homeTeam.name} vs {match.awayTeam.name}</h1><p>{match.competition.name} · {match.stage}</p></div></section><RefereeSubnav /><section className="functional-section"><div className="detail-shell referee-match-detail"><article><header><span>{formatLabels[match.competition.format]}</span>{match.isTestData ? <strong>本地功能测试数据</strong> : <strong>{accepting ? "开放报名" : "报名已关闭"}</strong>}</header><dl><div><dt>开球时间</dt><dd>{formatRefereeDateTime(match.kickoff)}</dd></div><div><dt>比赛场地</dt><dd>{match.venue}</dd></div><div><dt>比赛阶段</dt><dd>{match.stage}</dd></div><div><dt>报名截止</dt><dd>{match.applicationDeadline ? formatRefereeDateTime(match.applicationDeadline) : "未开放"}</dd></div></dl><h2>本场岗位模板</h2><ol>{positions.map((position) => <li key={position.key}><span>{String(position.order).padStart(2, "0")}</span>{position.label}</li>)}</ol></article><aside><h2>提交执裁意向</h2>{accepting && eligible ? <RefereeApplicationForm matchId={match.id} positions={positions.map(({ key, label }) => ({ key, label }))} referee={session.referee} /> : accepting && !session ? <div className="functional-empty functional-empty-compact referee-login-prompt"><strong>登录后提交</strong><p>比赛和岗位信息对访客公开，正式执裁意向仅限已登记裁判员提交。</p><Link href="/referees/login">裁判员登录 →</Link></div> : accepting && !eligible ? <div className="functional-empty functional-empty-compact"><strong>当前账号不适用该赛制</strong><p>如需更新可执裁赛制，请联系协会管理员核验名录信息。</p></div> : <div className="functional-empty functional-empty-compact"><strong>当前不可提交</strong><p>比赛不存在、未开放、已截止或状态已变化时，服务端也会拒绝写入。</p></div>}<Link className="detail-link" href="/referees/open-matches">← 返回待选派比赛</Link></aside></div></section></main><SiteFooter /></>;
}
