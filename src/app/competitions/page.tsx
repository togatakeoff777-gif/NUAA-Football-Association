import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SectionContactCard } from "@/components/ui/section-contact-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { coreCompetitionDirectory } from "@/data/competition-directory";
import { publicSectionContacts } from "@/data/contacts";
import { competitionNavigation } from "@/data/navigation";
import type { CoreCompetitionDirectoryEntry } from "@/types/competition-center";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions" },
  title: "赛事中心",
  description: "查看南京航空航天大学天目湖足球协会当前赛事、赛程、数据、文件与赛事服务。",
};

const currentCompetitions = coreCompetitionDirectory.filter(
  (competition) => competition.semester === "first",
);

function getNextArrangement(competition: CoreCompetitionDirectoryEntry) {
  const forecast = competition.nextMatch;
  if (forecast.state === "scheduled") {
    return `${forecast.homeTeam} vs ${forecast.awayTeam} · ${forecast.dateLabel} ${forecast.timeLabel}`;
  }
  return forecast.summary;
}

export default function CompetitionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page competition-center-v28" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>TIANMUHU COMPETITIONS</p>
            <h1>赛事中心</h1>
            <p>直接查看当前学期赛事，并由赛事导航进入赛程、数据、文件与赛事治理服务。</p>
          </div>
        </section>

        <section className="functional-section">
          <div className="detail-shell competition-center-layout">
            <aside className="competition-center-sidebar">
              <nav aria-labelledby="competition-navigation-title" className="competition-service-navigation">
                <span>COMPETITION SERVICES</span>
                <h2 id="competition-navigation-title">赛事导航</h2>
                <div>
                  {competitionNavigation.map((item, index) => (
                    <Link href={item.href} key={item.href}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{item.label}</strong>
                    </Link>
                  ))}
                </div>
              </nav>
              <SectionContactCard contact={publicSectionContacts.competitions} />
            </aside>

            <div className="competition-center-main">
              <div className="functional-section-head">
                <div>
                  <span>CURRENT TERM</span>
                  <h2>当前学期赛事</h2>
                </div>
                <p>新生杯与天目湖五人制联赛目前均处于筹备阶段，未发布事项保持明确状态。</p>
              </div>

              <div className="current-competition-grid">
                {currentCompetitions.map((competition, index) => (
                  <article className="current-competition-card" key={competition.id}>
                    <header>
                      <span>{String(index + 1).padStart(2, "0")} / {competition.semesterLabel}</span>
                      <StatusBadge tone="neutral">
                        {competition.statusLabel} · {competition.nextMatch.label}
                      </StatusBadge>
                    </header>
                    <div className="current-competition-card-copy">
                      <p>{competition.eventType} · {competition.formatLabel}</p>
                      <h2>{competition.name}</h2>
                    </div>
                    <dl>
                      <div>
                        <dt>赛制 / 组队</dt>
                        <dd>{competition.formatLabel} · {competition.teamFormation}</dd>
                      </div>
                      <div>
                        <dt>当前阶段</dt>
                        <dd>{competition.stageLabel}</dd>
                      </div>
                      <div>
                        <dt>时间状态</dt>
                        <dd>{competition.matchWindow}</dd>
                      </div>
                      <div>
                        <dt>下一项安排</dt>
                        <dd>{getNextArrangement(competition)}</dd>
                      </div>
                    </dl>
                    <Link href={competition.detailHref}>
                      进入赛事详情 <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                ))}
              </div>

              <aside className="competition-pending-notice" aria-labelledby="competition-pending-title">
                <div>
                  <span>PENDING ANNOUNCEMENTS</span>
                  <h2 id="competition-pending-title">待后续公告事项</h2>
                </div>
                <p>报名时间、比赛日期、比赛场地、参赛规模及具体赛程尚未全部正式发布。请以赛事组委会后续公告和正式竞赛文件为准。</p>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
