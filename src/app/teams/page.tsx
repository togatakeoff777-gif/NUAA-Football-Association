import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SectionContactCard } from "@/components/ui/section-contact-card";
import { publicSectionContacts } from "@/data/contacts";
import {
  currentTeamDirectory,
  currentTeamDirectoryStatuses,
  teamContactPendingLabel,
  verifiedCompetitionTeams,
} from "@/data/teams";

export const metadata: Metadata = {
  alternates: { canonical: "/teams" },
  title: "球队信息",
  description: "当前招募与组队信息，以及2026男、女子足球院际杯真实参赛队伍档案。",
};

export default function TeamsPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero"><div className="detail-shell"><p>CURRENT TEAM DIRECTORY</p><h1>球队信息</h1><p>优先发布当前招募、组建与成队状态；历届参赛队伍继续保留在赛事归档，不混作长期固定球队。</p></div></section>
        <section className="functional-section team-join-section"><div className="detail-shell">
          <section className="team-join-guide" aria-labelledby="team-join-title">
            <div><span>FOR NEW STUDENTS</span><h2 id="team-join-title">新生如何加入球队</h2></div>
            <ol>
              <li><strong>01</strong><span>先查看下方“当前招募与组队目录”，确认对应赛事与队伍状态。</span></li>
              <li><strong>02</strong><span>仅使用球队负责人已经确认可公开的联系方式；未确认时不展示私人账号。</span></li>
              <li><strong>03</strong><span>如暂未公布联系人，请持续关注学院组队信息、赛事公告与官网更新。</span></li>
            </ol>
          </section>
          <SectionContactCard contact={publicSectionContacts.teams} note="组队与参赛事务咨询" />
        </div></section>
        <section className="functional-section functional-section-tint"><div className="detail-shell">
          <div className="functional-section-head"><div><span>2026 FRESHMAN CUP DIRECTORY</span><h2>2026 新生杯组队目录</h2></div><p>目录支持{Object.values(currentTeamDirectoryStatuses).join("、")}四种状态；只有经负责人确认可公开的联系方式才会展示。</p></div>
          {currentTeamDirectory.length ? (
            <div className="current-team-directory">
              {currentTeamDirectory.map((team) => (
                <article key={team.id}>
                  <div><span>{team.statusLabel}</span><h3>{team.name}</h3><p>{team.schoolOrOrganization}</p></div>
                  <dl>
                    <div><dt>对应赛事</dt><dd><Link href={team.competitionHref}>{team.competitionName}</Link></dd></div>
                    <div><dt>招募对象 / 位置</dt><dd>{team.targetOrPositions}</dd></div>
                    <div><dt>负责人</dt><dd>{team.confirmedLead ?? "待球队负责人确认"}</dd></div>
                    <div><dt>联系方式</dt><dd>{team.contactIsPublic ? team.publicContact ?? teamContactPendingLabel : teamContactPendingLabel}</dd></div>
                    <div><dt>更新时间</dt><dd>{team.updatedAt}</dd></div>
                    <div><dt>备注</dt><dd>{team.note}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="当前暂无经协会确认的 2026 新生杯组队信息"
              description="2026新生杯组队资料尚未发布，请关注赛事公告与球队信息页后续更新。"
              href="/participation"
              actionLabel="查看参赛指南"
            />
          )}
        </div></section>
        <section className="functional-section"><div className="detail-shell">
          <div className="functional-section-head"><div><span>VERIFIED COMPETITION ARCHIVES</span><h2>真实参赛队伍档案</h2></div><p>2026男、女子足球院际杯名单与比赛数据复用对应结构化归档，不重复维护。</p></div>
          <div className="verified-team-groups">
            {verifiedCompetitionTeams.map((competition) => (
              <section key={competition.competitionId}>
                <header><div><span>COMPETITION ARCHIVE</span><h2>{competition.competitionName}</h2><p>{competition.summary}</p></div><Link href={competition.competitionHref}>进入赛事归档 →</Link></header>
                <div>{competition.teams.map((team, index) => <article key={team.id}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{team.name}</h3><p>{team.meta}</p><small>{team.description}</small></div><strong>{team.contact}</strong></article>)}</div>
              </section>
            ))}
          </div>
        </div></section>
      </main>
      <SiteFooter />
    </>
  );
}
