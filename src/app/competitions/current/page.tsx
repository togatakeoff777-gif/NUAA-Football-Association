import type { Metadata } from "next";

import { CompetitionCatalog } from "@/components/competitions/competition-catalog";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { publicCompetitions } from "@/data/competition-center";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/current" },
  title: "当前赛事",
  description: "南航天目湖足协四项核心赛事的公开状态、时间、场地和赛事入口。",
};

export default function CurrentCompetitionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>CURRENT COMPETITIONS</p>
            <h1>当前赛事</h1>
            <p>统一展示筹备、报名、进行中与已结束状态；已确认信息直接列出，未公布事项集中说明。</p>
          </div>
        </section>
        <section className="functional-section">
          <div className="detail-shell">
            <div className="functional-section-head"><div><span>FOUR CORE COMPETITIONS</span><h2>四项年度核心赛事</h2></div><p>已结束赛事进入完整归档；后续赛季继续沿用统一的赛事类别与归档入口。</p></div>
            <CompetitionCatalog competitions={publicCompetitions} />
            <aside className="competition-pending-notice" aria-labelledby="competition-pending-title">
              <div><span>PENDING ANNOUNCEMENTS</span><h2 id="competition-pending-title">待后续公告事项</h2></div>
              <p>2026 新生杯和天目湖五人制联赛的报名时间、比赛日期、比赛场地、参赛规模及相关组织信息尚未全部正式发布。具体安排以赛事组委会后续公告和正式竞赛文件为准。</p>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
