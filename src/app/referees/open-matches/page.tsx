import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RefereeSubnav } from "@/components/referees/mvp/public-appointment-list";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { formatLabels } from "@/lib/referee-roles";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/open-matches" },
  title: "公开场次",
  description: "访客可查看开放场次；裁判工作区正式启用后，已登记裁判员可提交执裁意向。",
};
export const dynamic = "force-dynamic";

export default async function OpenRefereeMatchesPage() {
  const matches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      applicationWindowStatus: "OPEN",
      applicationDeadline: { gt: new Date() },
      isTestData: false,
      competition: { isTestData: false },
    },
    include: { competition: true, homeTeam: true, awayTeam: true, positionRequirements: true },
    orderBy: { kickoff: "asc" },
  });
  return <><SiteHeader /><main className="functional-page" id="main-content"><section className="functional-hero"><div className="detail-shell"><p>OPEN APPOINTMENTS</p><h1>公开场次</h1><p>访客可查看开放比赛和岗位信息；已登记并启用的裁判员可登录提交执裁意向。</p></div></section><RefereeSubnav /><section className="functional-section"><div className="detail-shell">{matches.length ? <div className="referee-match-list">{matches.map((match) => <article key={match.id}><header><div><span>{match.competition.name}</span><h2>{match.homeTeam.name} vs {match.awayTeam.name}</h2></div><strong>开放报名</strong></header><dl><div><dt>赛制 / 阶段</dt><dd>{formatLabels[match.competition.format]} · {match.stage}</dd></div><div><dt>开球时间</dt><dd>{formatRefereeDateTime(match.kickoff)}</dd></div><div><dt>报名截止</dt><dd>{formatRefereeDateTime(match.applicationDeadline!)}</dd></div><div><dt>岗位需求</dt><dd>{match.positionRequirements.reduce((total, item) => total + item.count, 0)} 人</dd></div></dl>{match.publicNote ? <p>{match.publicNote}</p> : null}<Link href={`/referees/open-matches/${match.slug}`}>查看岗位信息 →</Link></article>)}</div> : <div className="functional-empty"><strong>当前暂无开放执裁意向的比赛</strong><p>请关注后续赛事通知与选派安排。</p></div>}</div></section></main><SiteFooter /></>;
}
