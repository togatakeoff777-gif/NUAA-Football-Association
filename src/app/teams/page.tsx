import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SectionContactCard } from "@/components/ui/section-contact-card";
import { TeamArchiveExplorer } from "@/components/teams/team-archive-explorer";
import { verifiedCompetitionTeams } from "@/data/teams";
import { getPublicTeamDirectory } from "@/lib/team-directory-service";

export const metadata: Metadata = {
  alternates: { canonical: "/teams" },
  title: "球队信息",
  description: "当前招募与组队信息，以及2026男、女子足球院际杯参赛球队档案。",
};

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const directory = await getPublicTeamDirectory();
  const activeCompetition = directory.competition;
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero"><div className="detail-shell"><p>CURRENT TEAM DIRECTORY</p><h1>球队信息</h1><p>查看新赛季组队信息，以及2026男、女子足球院际杯参赛球队档案。</p></div></section>
        <section className="functional-section team-join-section"><div className="detail-shell">
          <section className="team-join-guide" aria-labelledby="team-join-title">
            <div><span>FOR NEW STUDENTS</span><h2 id="team-join-title">新生如何加入球队</h2></div>
            <ol>
              <li><strong>01</strong><span>先查看下方“当前招募与组队目录”，确认对应赛事与队伍状态。</span></li>
              <li><strong>02</strong><span>仅使用球队负责人已经确认可公开的联系方式；未确认时不展示私人账号。</span></li>
              <li><strong>03</strong><span>如暂未公布联系人，请持续关注学院组队信息、赛事公告与官网更新。</span></li>
            </ol>
          </section>
          <SectionContactCard contact={{ label: "球队信息负责人", name: directory.contact.name ?? undefined, role: directory.contact.title ?? undefined, qq: directory.contact.qq ?? undefined, email: directory.contact.email ?? undefined }} note="组队与参赛事务咨询" />
        </div></section>
        <section className="functional-section functional-section-tint"><div className="detail-shell">
          <div className="functional-section-head"><div><span>CURRENT TEAM DIRECTORY / 当前组队目录</span><h2>{activeCompetition?.title ?? "当前暂无公开组队目录"}</h2></div><p>查看各学院或队伍的组建进度、招募状态与公开联系方式。</p></div>
          {activeCompetition && directory.teams.length ? (
            <div className="current-team-directory">
              {directory.teams.map((team) => (
                <article key={team.id}>
                  <div>{team.publicStatus ? <span>{team.publicStatus}</span> : null}<h3>{team.name}</h3></div>
                  <dl>
                    <div><dt>对应赛事</dt><dd>{activeCompetition.href ? <Link href={activeCompetition.href}>{activeCompetition.name}</Link> : activeCompetition.name}</dd></div>
                    {team.publicContactName ? <div><dt>负责人</dt><dd>{team.publicContactName}{team.publicContactRole ? ` · ${team.publicContactRole}` : ""}</dd></div> : null}
                    {team.publicContactQQ ? <div><dt>公开 QQ</dt><dd>{team.publicContactQQ}</dd></div> : null}
                    {team.publicContactEmail ? <div><dt>公开邮箱</dt><dd><a href={`mailto:${team.publicContactEmail}`}>{team.publicContactEmail}</a></dd></div> : null}
                    {team.publicDirectoryNote ? <div><dt>备注</dt><dd>{team.publicDirectoryNote}</dd></div> : null}
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={directory.competition ? "当前赛事组队信息尚未发布" : "当前暂无公开组队目录"}
              description={directory.competition ? "当前赛事组队信息尚未发布，请关注后续更新。" : "请关注赛事公告与球队信息更新。"}
              href="/participation"
              actionLabel="查看参赛指南"
            />
          )}
        </div></section>
        <section className="functional-section"><div className="detail-shell">
          <div className="functional-section-head"><div><span>COMPETITION ARCHIVES</span><h2>参赛球队档案</h2></div><p>按赛季和赛事查看参赛球队及公开名单。</p></div>
          <TeamArchiveExplorer records={verifiedCompetitionTeams} />
        </div></section>
      </main>
      <SiteFooter />
    </>
  );
}
