import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { publicMatchRecords } from "@/data/competition-center";
import { freshmanCupPreparationNews, freshmanCupPreparationNotice } from "@/data/freshman-cup-2026";

const serviceStatus = [
  { label: "当前状态", value: "赛事筹备工作已启动", confirmed: true },
  { label: "报名", value: "待正式通知", confirmed: false },
  { label: "竞赛规程", value: "待正式发布", confirmed: false },
  { label: "比赛场地", value: "待正式确认", confirmed: false },
  { label: "完整赛程", value: "待正式发布", confirmed: false },
] as const;

const seasonFinals = [
  { id: "mens-2026-16", label: "男子院际杯决赛" },
  { id: "womens-2026-8", label: "女子院际杯决赛" },
] as const;

export function FreshmanCupServiceDesk() {
  const finalRecords = seasonFinals.map(({ id, label }) => {
    const match = publicMatchRecords.find((item) => item.id === id);
    if (!match) throw new Error(`Missing verified homepage match: ${id}`);
    return { ...match, reviewLabel: label };
  });

  return (
    <section className="home-match-center home-freshman-service home-screen" data-home-screen="matches" id="home-match" aria-labelledby="home-freshman-service-title">
      <div className="page-shell">
        <div className="home-section-bar" data-home-reveal data-home-delay="0">
          <div><p>FRESHMAN CUP SERVICE / 新生杯赛事服务</p><h2 id="home-freshman-service-title">2026 新生杯赛事服务台</h2></div>
          <StatusBadge tone="success">筹备工作已启动</StatusBadge>
        </div>

        <div className="freshman-service-grid">
          <article className="freshman-service-primary" data-home-reveal data-home-delay="1">
            <div className="freshman-service-status">
              {serviceStatus.map((item) => <div key={item.label} data-confirmed={item.confirmed || undefined}><span>{item.label}</span><strong>{item.value}</strong></div>)}
            </div>
            <div className="freshman-service-actions">
              <Link className="button button-primary" href="/competitions/freshman-cup">查看新生杯 <span aria-hidden="true">→</span></Link>
              <Link className="button button-secondary" href="/participation">参赛指南 <span aria-hidden="true">→</span></Link>
              <Link className="button button-secondary" href="/teams">球队信息 <span aria-hidden="true">→</span></Link>
            </div>
          </article>

          <div className="freshman-service-side" data-home-reveal data-home-delay="2">
            <article className="freshman-service-updates">
              <div><span>LATEST UPDATES</span><h3>筹备动态与公告</h3></div>
              <Link href={freshmanCupPreparationNews.href}><small>{freshmanCupPreparationNews.dateLabel} · 新闻</small><strong>{freshmanCupPreparationNews.title}</strong><span aria-hidden="true">→</span></Link>
              <Link href={freshmanCupPreparationNotice.href}><small>{freshmanCupPreparationNotice.dateLabel} · 公告</small><strong>{freshmanCupPreparationNotice.title}</strong><span aria-hidden="true">→</span></Link>
            </article>
            <article className="freshman-season-review">
              <div><span>2026 SEASON REVIEW</span><h3>已结束赛事归档</h3></div>
              {finalRecords.map((match) => <Link href={match.competitionHref} key={match.id}><span>{match.reviewLabel}</span><strong>{match.homeTeam} {match.homeScore}:{match.awayScore} {match.awayTeam}</strong><small>{match.dateLabel} · 查看归档 →</small></Link>)}
            </article>
          </div>
        </div>
        <p className="home-demo-note" data-home-reveal data-home-delay="3">新生杯后续安排以正式公告为准。</p>
      </div>
    </section>
  );
}
