import type { Metadata } from "next";

import { CompetitionScheduleExplorer } from "@/components/competitions/competition-schedule-explorer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { publicMatchRecords } from "@/data/competition-center";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/schedule" },
  title: "赛程与赛果",
  description: "按赛事、阶段和球队筛选校园足球赛程与赛果。",
};

export default function CompetitionSchedulePage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell"><p>FIXTURES & RESULTS</p><h1>赛程与赛果</h1><p>按赛事查看已收录的赛程与赛果。</p></div>
        </section>
        <section className="functional-section">
          <div className="detail-shell">
            <div className="functional-section-head"><div><span>OFFICIAL MATCH RECORDS</span><h2>比赛记录</h2></div><p>浏览2026男子、女子足球院际杯赛程与赛果。</p></div>
            <CompetitionScheduleExplorer matches={publicMatchRecords} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
