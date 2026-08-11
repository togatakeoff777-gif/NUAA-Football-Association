import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { publicCompetitions, publicMatchRecords } from "@/data/competition-center";
import type { PublicMatchRecord } from "@/types/competition-center";

function displayTeamName(name: string) {
  return name === "民航通飞联队" ? "民航·通飞联队" : name;
}

function Team({ name, side }: { name: string; side: "主" | "客" }) {
  return <div className="match-team"><span aria-hidden="true">{side}</span><strong>{displayTeamName(name)}</strong></div>;
}

function Matchup({ match, compact = false }: { match: PublicMatchRecord; compact?: boolean }) {
  return (
    <div className={compact ? "matchup matchup-compact" : "matchup"}>
      <Team name={match.homeTeam} side="主" />
      <div className="matchup-score" aria-label={`${displayTeamName(match.homeTeam)} ${match.homeScore} 比 ${match.awayScore} ${displayTeamName(match.awayTeam)}`}>
        <b>{match.homeScore}</b><span>:</span><b>{match.awayScore}</b>
      </div>
      <Team name={match.awayTeam} side="客" />
    </div>
  );
}

function requireMatch(id: string) {
  const match = publicMatchRecords.find((item) => item.id === id);
  if (!match) throw new Error(`Missing verified homepage match: ${id}`);
  return match;
}

export function MatchCenter() {
  const womensFinal = requireMatch("womens-2026-8");
  const mensFinal = requireMatch("mens-2026-16");

  return (
    <section className="home-match-center home-screen" data-home-screen="matches" id="home-match" aria-labelledby="home-match-center-title">
      <div className="page-shell">
        <div className="home-section-bar" data-home-reveal data-home-delay="0">
          <div><p>MATCH CONTROL / 比赛信息中心</p><h2 id="home-match-center-title">决赛回顾，见证冠军时刻</h2></div>
          <StatusBadge>真实赛事归档</StatusBadge>
        </div>
        <div className="match-center-grid">
          <div className="next-match-panel" data-home-reveal data-home-delay="1">
            <div className="match-panel-topline">
              <div><span>焦点赛果</span><strong>{womensFinal.competitionName}</strong></div>
              <StatusBadge tone="neutral">{womensFinal.statusLabel}</StatusBadge>
            </div>
            <div className="match-context"><span>{womensFinal.stage}</span><span>冠军：{womensFinal.homeTeam}</span></div>
            <Matchup match={womensFinal} />
            <dl className="match-facts">
              <div><dt>比赛时间</dt><dd>{womensFinal.dateLabel} {womensFinal.timeLabel}</dd></div>
              <div><dt>比赛场地</dt><dd>{womensFinal.venue}</dd></div>
            </dl>
            <Link className="button button-primary" href={womensFinal.competitionHref}>查看女子决赛归档 <span aria-hidden="true">→</span></Link>
          </div>

          <div className="match-center-side" data-home-reveal data-home-delay="2">
            <article className="recent-result-panel">
              <div className="side-panel-heading"><div><span>FINAL REVIEW</span><h3>男子决赛</h3></div><Link href={mensFinal.competitionHref}>赛事归档 →</Link></div>
              <p>{mensFinal.competitionName} · {mensFinal.stage} · {mensFinal.dateLabel} {mensFinal.timeLabel}</p>
              <Matchup compact match={mensFinal} />
              {mensFinal.penaltyScore ? <p className="match-penalty-note">点球 {mensFinal.penaltyScore} · 致慧书院夺冠</p> : null}
            </article>
            <article className="competition-pulse-panel">
              <div className="side-panel-heading"><div><span>SEASON STATUS</span><h3>年度赛事状态</h3></div></div>
              <div className="competition-pulse-list">
                {publicCompetitions.slice(0, 3).map((competition) => (
                  <Link href={competition.detailHref} key={competition.id}>
                    <span>{competition.name}</span><small>{competition.season}</small><b>{competition.statusLabel}</b>
                  </Link>
                ))}
              </div>
              <Link className="text-link" href="/competitions/schedule">查看完整赛程与赛果 <span aria-hidden="true">→</span></Link>
            </article>
          </div>
        </div>
        <p className="home-demo-note" data-home-reveal data-home-delay="3">2026男、女子足球院际杯均已结束并完成赛事归档。</p>
      </div>
    </section>
  );
}
