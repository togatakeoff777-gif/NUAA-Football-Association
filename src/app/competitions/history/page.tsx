import Link from "next/link";
import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { coreCompetitionDirectory } from "@/data/competition-directory";
import { historicalCompetitionYears } from "@/data/historical-competitions";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/history" },
  title: "历届赛事",
  description: "南京航空航天大学天目湖足球协会年度赛事档案与赛季记录。",
  openGraph: {
    title: "历届赛事 | 南京航空航天大学天目湖足球协会",
    description: "查看2026赛事完整档案及2025、2024年已核实的历史赛事记录。",
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
        <section className="functional-hero"><div className="detail-shell"><p>COMPETITION ARCHIVE</p><h1>历届赛事</h1><p>按年度查看赛事信息、赛果、球队与新闻报道。</p></div></section>
        <section className="functional-section"><div className="detail-shell">
          <div className="v25-section-heading"><div><p>2026 ARCHIVE NODE</p><h2>2026 年度赛事档案</h2></div><p>查看2026男子、女子足球院际杯赛事档案。</p></div>
          <div className="history-year-node">
            <div className="history-year-marker"><strong>2026</strong><span>年度赛事档案</span></div>
            <div className="history-archive-list">
              {archives2026.map((competition) => <article key={competition.id}><div><span>{competition.formatLabel} · {competition.campus}</span><h3>{competition.name}</h3><p>{competition.summary}</p></div><dl><div><dt>赛事状态</dt><dd>{competition.statusLabel}</dd></div><div><dt>比赛周期</dt><dd>{competition.matchWindow}</dd></div></dl><Link href={competition.detailHref}>查看完整赛事档案 →</Link></article>)}
            </div>
          </div>
        </div></section>
        <section className="functional-section functional-section-tint history-exhibition"><div className="detail-shell">
          <div className="v25-section-heading"><div><p>EARLIER YEARS</p><h2>历届赛事回顾</h2></div><p>按年度回顾已归档的校园足球赛事。</p></div>
          <div className="historical-year-list">
            {historicalCompetitionYears.map((year) => (
              <section className="historical-year" key={year.year} aria-labelledby={`history-${year.year}`}>
                <header><strong id={`history-${year.year}`}>{year.year}</strong><span>年度赛事记录</span></header>
                <div className="historical-competition-grid">
                  {year.competitions.map((competition) => (
                    <article className="historical-competition-card" key={competition.id}>
                      <div className="historical-card-heading">
                        <span>{competition.format ?? "历史赛事"}</span>
                        <h3>{competition.name}</h3>
                      </div>
                      {competition.teamCount || competition.startDate || competition.venue ? (
                        <dl className="historical-card-meta">
                          {competition.teamCount ? <div><dt>参赛队伍</dt><dd>{competition.teamCount}支</dd></div> : null}
                          {competition.startDate ? <div><dt>赛事起始日期</dt><dd>{competition.startDate}</dd></div> : null}
                          {competition.venue ? <div><dt>决赛场地</dt><dd>{competition.venue}</dd></div> : null}
                        </dl>
                      ) : null}
                      {competition.final ? (
                        <section className="historical-final">
                          <span>决赛</span>
                          <div><strong>{competition.final.home}</strong><b>{competition.final.score}</b><strong>{competition.final.away}</strong></div>
                          <small>{competition.final.date}</small>
                        </section>
                      ) : null}
                      {competition.standings?.length ? (
                        <section className="historical-ranking">
                          <h4>{year.year === 2024 ? "公开名次" : "最终名次"}</h4>
                          <ol>
                            {competition.standings.map((standing) => (
                              <li key={`${competition.id}-${standing.position}`}>
                                <span>{standing.position}</span>
                                <div><strong>{standing.team}</strong>{standing.record ? <small>{standing.record}{standing.goals ? ` · 进/失 ${standing.goals}` : ""}</small> : null}</div>
                                {standing.points !== undefined ? <b>{standing.points}分</b> : null}
                              </li>
                            ))}
                          </ol>
                        </section>
                      ) : null}
                      {competition.officials?.length ? (
                        <section className="historical-officials"><h4>决赛裁判组</h4><dl>{competition.officials.map((official) => <div key={official.role}><dt>{official.role}</dt><dd>{official.name}</dd></div>)}</dl></section>
                      ) : null}
                      {competition.note ? <p className="historical-note">{competition.note}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div></section>
      </main>
      <SiteFooter />
    </>
  );
}
