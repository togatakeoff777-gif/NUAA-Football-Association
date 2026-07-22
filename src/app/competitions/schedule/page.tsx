import type { Metadata } from "next";

import { CompetitionScheduleExplorer } from "@/components/competitions/competition-schedule-explorer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { publicMatchRecords } from "@/data/competition-center";

export const metadata: Metadata = {
  title: "赛程与赛果",
  description: "按赛事、阶段和球队筛选已核验的校园足球赛程与赛果。",
};

export default function CompetitionSchedulePage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell"><p>FIXTURES & RESULTS</p><h1>赛程与赛果</h1><p>男子、女子院际杯使用同一比赛数据视图；未来赛程可继续接入相同字段与筛选器。</p></div>
        </section>
        <section className="functional-section">
          <div className="detail-shell">
            <div className="functional-section-head"><div><span>VERIFIED MATCH RECORDS</span><h2>比赛记录</h2></div><p>当前展示2026男、女子院际杯已核验赛果，不混入演示比赛。</p></div>
            <CompetitionScheduleExplorer matches={publicMatchRecords} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
