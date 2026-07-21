import Image from "next/image";
import Link from "next/link";

import { ArchiveSectionNav } from "@/components/competitions/archive/archive-section-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";

import { CompetitionFinal } from "./competition-final";
import { CompetitionOfficials } from "./competition-officials";
import { CompetitionOverview } from "./competition-overview";
import { CompetitionResults } from "./competition-results";
import { CompetitionStandings } from "./competition-standings";
import { CompetitionStatistics } from "./competition-statistics";
import { CompetitionStories } from "./competition-stories";
import { CompetitionTeams } from "./competition-teams";

const archiveNavigation = [
  { id: "overview", label: "赛事概览" },
  { id: "schedule", label: "赛程赛果" },
  { id: "standings", label: "积分榜" },
  { id: "final", label: "决赛档案" },
  { id: "statistics", label: "赛事数据" },
  { id: "teams", label: "参赛球队" },
  { id: "officials", label: "裁判安排" },
  { id: "stories", label: "新闻影像" },
] as const;

export function CompetitionArchivePage() {
  const { competition } = mensIntercollegeCup2026;

  return (
    <>
      <SiteHeader fixed />
      <main className="cup-archive-page" id="main-content">
        <section className="cup-archive-hero" aria-labelledby="cup-archive-title">
          <Image className="cup-archive-hero-image" src={competition.heroImage} alt="天目湖校区西操场晚霞与足球" fill preload sizes="100vw" />
          <div className="cup-archive-hero-overlay" aria-hidden="true" />
          <div className="page-shell cup-archive-hero-inner">
            <div className="cup-archive-hero-copy">
              <p>OFFICIAL COMPETITION ARCHIVE · 2026</p>
              <span className="cup-official-status">已结束 / 官方数据</span>
              <h1 id="cup-archive-title">{competition.name}</h1>
              <p>{competition.structure.groupStage}。赛事于2026年5月17日完成决赛，致慧书院夺得冠军。</p>
              <div><a href="#schedule">查看完整赛果 <span aria-hidden="true">↓</span></a><a href={competition.guidebook} download>下载赛事秩序册 <span aria-hidden="true">↗</span></a></div>
            </div>
            <dl className="cup-archive-hero-summary">
              <div><dt>冠军</dt><dd>致慧书院</dd></div>
              <div><dt>赛期</dt><dd>2026.03.20—05.17</dd></div>
              <div><dt>规模</dt><dd>{competition.summary.teams}队 / {competition.summary.matches}场</dd></div>
              <div><dt>进球</dt><dd>{competition.summary.goals}球</dd></div>
            </dl>
          </div>
        </section>

        <ArchiveSectionNav items={archiveNavigation} />

        <CompetitionOverview />
        <CompetitionResults />
        <CompetitionStandings />
        <CompetitionFinal />
        <CompetitionStatistics />
        <CompetitionTeams />
        <CompetitionOfficials />
        <CompetitionStories />

        <div className="cup-archive-return"><div className="page-shell"><Link href="/competitions">← 返回赛事中心</Link><span>档案状态：已结束 / 官方数据</span></div></div>
      </main>
      <SiteFooter />
    </>
  );
}
