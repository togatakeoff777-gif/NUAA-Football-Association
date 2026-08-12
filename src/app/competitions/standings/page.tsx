import type { Metadata } from "next";

import { CompetitionRecordExplorer } from "@/components/competitions/competition-record-explorer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { competitionRecords } from "@/data/competition-records";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/standings" }, title: "积分榜", description: "校园足球赛事积分榜入口。" };

export default function CompetitionStandingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page competition-record-page" id="main-content">
        <section className="functional-hero"><div className="detail-shell"><p>STANDINGS</p><h1>积分榜</h1><p>按赛季和赛事查看已经公开的积分数据。</p></div></section>
        <section className="functional-section"><div className="detail-shell">
          <CompetitionRecordExplorer records={competitionRecords} mode="standings" />
        </div></section>
      </main>
      <SiteFooter />
    </>
  );
}
