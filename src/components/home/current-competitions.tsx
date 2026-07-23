import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { annualCompetitions } from "@/data/competitions";
import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";

export function CurrentCompetitions() {
  const featured = annualCompetitions.find((item) => item.displayStatus.dataStatus === "confirmed") ?? annualCompetitions[0];
  const secondary = annualCompetitions.filter((item) => item.id !== featured.id);
  const featuredIsOfficialArchive = featured.id === mensIntercollegeCup2026.competition.competitionId;

  return (
    <section className="home-current-competitions home-screen" data-home-screen="competitions" id="home-competitions" aria-labelledby="home-competitions-title">
      <div className="page-shell">
        <div className="home-section-bar" data-home-reveal data-home-delay="0">
          <div><p>ACTIVE COMPETITIONS / 当前赛事</p><h2 id="home-competitions-title">一项主赛，三条赛季航线</h2></div>
          <Link className="text-link" href="/competitions/current">查看全部赛事 →</Link>
        </div>
        <div className="current-competition-layout">
          <article className="featured-competition-card" id={featured.slug} data-home-reveal data-home-delay="1">
            <div className="featured-competition-top"><span>PRIMARY COMPETITION</span><StatusBadge tone="success">{featured.displayStatus.label} · {featured.displayStatus.badge}</StatusBadge></div>
            <p>{featured.semesterLabel} · {featured.eventType} · {featured.formatLabel}</p>
            <h3>{featured.name}</h3>
            <dl>
              <div><dt>当前阶段</dt><dd>{featured.stageLabel}</dd></div>
              <div><dt>参赛队数量</dt><dd>{featuredIsOfficialArchive ? `${mensIntercollegeCup2026.competition.summary.teams}支` : "资料待公布"}</dd></div>
              <div><dt>最近动态</dt><dd>{featuredIsOfficialArchive ? "致慧书院夺冠 · 2026赛季已归档" : "赛程待协会发布"}</dd></div>
            </dl>
            <Link className="button button-light" href={featured.detailHref}>进入赛事入口 <span aria-hidden="true">↗</span></Link>
            <div className="featured-flight-route" aria-hidden="true"><i /><i /><i /></div>
          </article>
          <div className="compact-competition-list" data-home-reveal data-home-delay="2">
            {secondary.map((competition, index) => (
              <Link href={competition.detailHref} id={competition.slug} key={competition.id}>
                <span>{String(index + 2).padStart(2, "0")}</span>
                <div><small>{competition.semesterLabel} · {competition.formatLabel}</small><h3>{competition.shortName}</h3><p>{competition.stageLabel}</p></div>
                <div><StatusBadge tone={competition.displayStatus.dataStatus === "confirmed" ? "success" : "neutral"}>{competition.displayStatus.label} · {competition.displayStatus.badge}</StatusBadge><b aria-hidden="true">→</b></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
