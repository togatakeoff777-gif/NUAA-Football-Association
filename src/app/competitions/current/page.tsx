import type { Metadata } from "next";

import { CompetitionCatalog } from "@/components/competitions/competition-catalog";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { publicCompetitions } from "@/data/competition-center";

export const metadata: Metadata = {
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
            <p>统一展示筹备、报名、进行中与已结束状态；未公布的日期和场地保持“待赛事通知确认”。</p>
          </div>
        </section>
        <section className="functional-section">
          <div className="detail-shell">
            <div className="functional-section-head"><div><span>FOUR CORE COMPETITIONS</span><h2>四项年度核心赛事</h2></div><p>已结束赛事进入完整归档；未来赛事仍使用同一数据结构，无需另建展示组件。</p></div>
            <CompetitionCatalog competitions={publicCompetitions} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
