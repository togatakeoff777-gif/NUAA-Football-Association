import Link from "next/link";
import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { verifiedCompetitionTeams } from "@/data/teams";

export const metadata: Metadata = {
  title: "球队信息",
  description: "2026男、女子足球院际杯真实参赛队伍入口。",
};

export default function TeamsPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero"><div className="detail-shell"><p>VERIFIED COMPETITION TEAMS</p><h1>球队信息</h1><p>按赛事展示已经核验的真实参赛队伍，详细名单与赛事数据复用对应归档，不建立重复常量。</p></div></section>
        <section className="functional-section"><div className="detail-shell">
          <div className="functional-section-head"><div><span>TEAM DIRECTORY</span><h2>2026参赛队伍</h2></div><p>不公开手机号、证件号等个人信息；名单范围以赛事归档的公开资料为准。</p></div>
          <div className="verified-team-groups">
            {verifiedCompetitionTeams.map((competition) => (
              <section key={competition.competitionId}>
                <header><div><span>COMPETITION ARCHIVE</span><h2>{competition.competitionName}</h2><p>{competition.summary}</p></div><Link href={competition.competitionHref}>进入赛事归档 →</Link></header>
                <div>{competition.teams.map((team, index) => <article key={team.id}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{team.name}</h3><p>{team.meta}</p><small>{team.description}</small></div><strong>{team.contact}</strong></article>)}</div>
              </section>
            ))}
          </div>
          <section className="team-join-guide" aria-labelledby="team-join-title">
            <div><span>FOR NEW STUDENTS</span><h2 id="team-join-title">新生如何加入球队</h2></div>
            <ol>
              <li><strong>01</strong><span>先查看对应年度赛事的真实参赛队伍目录。</span></li>
              <li><strong>02</strong><span>球队负责人公开联系方式确认后，再按球队说明联系。</span></li>
              <li><strong>03</strong><span>如暂未公布联系人，可通过协会公开邮箱咨询，不提交手机号等敏感信息。</span></li>
            </ol>
            <a href="mailto:nuaafootball@163.com">nuaafootball@163.com</a>
          </section>
          <div className="functional-notice"><strong>球队信息维护与隐私</strong><p>当前不开放独立后台或公开报名表单。所有未获球队负责人确认的联系方式统一标注“联系方式待球队负责人确认”。</p></div>
        </div></section>
      </main>
      <SiteFooter />
    </>
  );
}
