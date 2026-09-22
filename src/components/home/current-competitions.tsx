import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { getHomepagePublicCompetitions } from "@/lib/public-competition-service";

export async function CurrentCompetitions() {
  const competitions = await getHomepagePublicCompetitions();
  const [featured, ...secondary] = competitions;

  return (
    <section className="home-current-competitions home-screen" data-home-screen="competitions" id="home-competitions" aria-labelledby="home-competitions-title">
      <div className="page-shell">
        <div className="home-section-bar" data-home-reveal data-home-delay="0">
          <div><p>ACTIVE COMPETITIONS / 当前赛事</p><h2 id="home-competitions-title">首页重点赛事动态</h2></div>
          <Link className="text-link" href="/competitions">查看全部赛事 →</Link>
        </div>
        {featured ? <div className={`current-competition-layout${secondary.length ? "" : " is-single"}`}>
          <article className="featured-competition-card" id={featured.slug} data-home-reveal data-home-delay="1">
            <div className="featured-competition-top"><span>PRIMARY COMPETITION</span><StatusBadge tone="success">{featured.statusLabel} · {featured.badge}</StatusBadge></div>
            <p>{featured.semesterLabel} · {featured.formatLabel}</p>
            <h3>{featured.name}</h3>
            <dl>
              <div><dt>当前阶段</dt><dd>{featured.stageLabel}</dd></div>
              <div><dt>比赛周期</dt><dd>{featured.matchWindow}</dd></div>
              <div><dt>下一项安排</dt><dd>{featured.nextMatch.state === "scheduled" ? `${featured.nextMatch.homeTeam} vs ${featured.nextMatch.awayTeam} · ${featured.nextMatch.dateLabel} ${featured.nextMatch.timeLabel}` : featured.nextMatch.summary}</dd></div>
            </dl>
            <Link className="button button-light" href={featured.detailHref}>进入赛事入口 <span aria-hidden="true">↗</span></Link>
            <div className="featured-flight-route" aria-hidden="true"><i /><i /><i /></div>
          </article>
          <div className="compact-competition-list" data-home-reveal data-home-delay="2">
            {secondary.map((competition, index) => (
              <Link href={competition.detailHref} id={competition.slug} key={competition.id}>
                <span>{String(index + 2).padStart(2, "0")}</span>
                <div><small>{competition.semesterLabel} · {competition.formatLabel}</small><h3>{competition.name}</h3><p>{competition.stageLabel}</p></div>
                <div><StatusBadge tone={competition.status === "ongoing" ? "success" : "neutral"}>{competition.statusLabel} · {competition.badge}</StatusBadge><b aria-hidden="true">→</b></div>
              </Link>
            ))}
          </div>
        </div> : <div className="functional-empty home-current-competitions-empty" data-home-reveal data-home-delay="1"><strong>当前暂无首页重点赛事</strong><p>赛事由管理员公开发布并设为首页展示后，将在这里同步呈现。</p></div>}
      </div>
    </section>
  );
}
