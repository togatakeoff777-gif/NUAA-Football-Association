import Link from "next/link";
import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { coreCompetitionDirectory } from "@/data/competition-directory";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/history" },
  title: "历届赛事",
  description: "南京航空航天大学天目湖足球协会年度赛事档案与已核验赛季记录。",
  openGraph: {
    title: "历届赛事 | 南京航空航天大学天目湖足球协会",
    description: "查看 2026 男、女子足球院际杯正式归档及后续历史资料整理状态。",
    url: "/competitions/history",
  },
};

const archives2026 = coreCompetitionDirectory.filter((competition) =>
  ["mens-intercollege-cup", "womens-intercollege-cup"].includes(competition.id),
);

export default function CompetitionHistoryPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page competition-history-v25" id="main-content">
        <section className="functional-hero"><div className="detail-shell"><p>COMPETITION ARCHIVE</p><h1>历届赛事</h1><p>按年度整理经协会确认的赛事信息、赛果、球队与报道；资料不足的年份不补写未经核验的记录。</p></div></section>
        <section className="functional-section"><div className="detail-shell">
          <div className="v25-section-heading"><div><p>2026 ARCHIVE NODE</p><h2>2026 年度赛事档案</h2></div><p>首批接入网站已有且完成核验的男、女子足球院际杯归档。</p></div>
          <div className="history-year-node">
            <div className="history-year-marker"><strong>2026</strong><span>已核验年度节点</span></div>
            <div className="history-archive-list">
              {archives2026.map((competition) => <article key={competition.id}><div><span>{competition.formatLabel} · {competition.campus}</span><h3>{competition.name}</h3><p>{competition.summary}</p></div><dl><div><dt>赛事状态</dt><dd>{competition.statusLabel}</dd></div><div><dt>比赛周期</dt><dd>{competition.matchWindow}</dd></div></dl><Link href={competition.detailHref}>查看完整赛事档案 →</Link></article>)}
            </div>
          </div>
        </div></section>
        <section className="functional-section functional-section-tint"><div className="detail-shell"><div className="history-pending"><span>EARLIER YEARS</span><h2>更早年份资料整理中</h2><p>冠军、比分、参赛队伍、比赛日期与影像资料将在完成来源核验后逐步补充。</p></div></div></section>
      </main>
      <SiteFooter />
    </>
  );
}
