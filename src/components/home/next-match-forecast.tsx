import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { getCoreCompetition } from "@/data/competition-directory";
import type { CoreCompetitionDirectoryEntry } from "@/types/competition-center";

const forecastCompetitionIds = [
  "freshman-cup",
  "tianmuhu-futsal-league",
] as const;

function ForecastCard({
  competition,
  index,
}: {
  competition: CoreCompetitionDirectoryEntry;
  index: number;
}) {
  const forecast = competition.nextMatch;
  const actionHref =
    forecast.state === "scheduled"
      ? forecast.detailHref
      : forecast.state === "completed"
        ? forecast.archiveHref
        : competition.detailHref;
  const actionLabel =
    forecast.state === "scheduled"
      ? "查看比赛详情"
      : forecast.state === "completed"
        ? "查看赛事归档"
        : "进入赛事主页";

  return (
    <article
      className="next-match-forecast-card"
      data-home-delay={String(index + 1)}
      data-home-reveal
    >
      <header>
        <span>{String(index + 1).padStart(2, "0")} / {competition.formatLabel}</span>
        <StatusBadge tone={forecast.state === "scheduled" ? "success" : "neutral"}>
          {forecast.label}
        </StatusBadge>
      </header>
      <div className="next-match-forecast-copy">
        <p>{competition.semesterLabel} · {competition.teamFormation}</p>
        <h3>{competition.name}</h3>
      </div>

      {forecast.state === "scheduled" ? (
        <div className="next-match-fixture">
          <div className="next-match-teams">
            <strong>{forecast.homeTeam}</strong>
            <span>VS</span>
            <strong>{forecast.awayTeam}</strong>
          </div>
          <dl>
            <div><dt>比赛时间</dt><dd>{forecast.dateLabel} {forecast.timeLabel}</dd></div>
            <div><dt>比赛场地</dt><dd>{forecast.venue}</dd></div>
          </dl>
        </div>
      ) : forecast.state === "pending" ? (
        <div className="next-match-pending">
          <strong>{forecast.summary}</strong>
          <dl>
            <div><dt>对阵</dt><dd>待正式发布</dd></div>
            <div><dt>比赛时间</dt><dd>{forecast.dateLabel}</dd></div>
            <div><dt>比赛场地</dt><dd>{forecast.venue}</dd></div>
          </dl>
        </div>
      ) : (
        <div className="next-match-pending">
          <strong>{forecast.summary}</strong>
        </div>
      )}

      <Link className="next-match-forecast-action" href={actionHref}>
        {actionLabel} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

export function NextMatchForecast() {
  const competitions = forecastCompetitionIds.map((id) => {
    const competition = getCoreCompetition(id);
    if (!competition) throw new Error(`Missing homepage competition: ${id}`);
    return competition;
  });

  return (
    <section
      aria-labelledby="home-next-match-title"
      className="home-match-center home-next-match-forecast home-screen"
      data-home-screen="matches"
      id="home-match"
    >
      <div className="page-shell">
        <div className="home-section-bar" data-home-delay="0" data-home-reveal>
          <div>
            <p>NEXT MATCH / 赛事预告</p>
            <h2 id="home-next-match-title">两项赛事，关注最新安排</h2>
          </div>
          <Link className="text-link" href="/competitions">
            进入赛事中心 →
          </Link>
        </div>
        <div className="next-match-forecast-grid">
          {competitions.map((competition, index) => (
            <ForecastCard competition={competition} index={index} key={competition.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
