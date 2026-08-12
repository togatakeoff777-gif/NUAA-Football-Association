import type { Metadata } from "next";

import { CompetitionRecordExplorer } from "@/components/competitions/competition-record-explorer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { competitionRecords } from "@/data/competition-records";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/scorers" }, title: "射手记录", description: "赛事射手与奖项记录入口。" };

export default function CompetitionScorersPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page competition-record-page" id="main-content">
        <section className="functional-hero"><div className="detail-shell"><p>SCORING RECORDS</p><h1>射手记录</h1><p>按赛季和赛事查看已经公开的进球统计与射手奖项。</p></div></section>
        <section className="functional-section"><div className="detail-shell">
          <CompetitionRecordExplorer records={competitionRecords} mode="scorers" />
        </div></section>
      </main>
      <SiteFooter />
    </>
  );
}
