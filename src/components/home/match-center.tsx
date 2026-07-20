import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { annualCompetitions, demoMatchCentre } from "@/data/competitions";
import type { DemoMatch } from "@/types";

function Team({ name, side }: { name: string; side: "A" | "B" }) {
  return <div className="match-team"><span aria-hidden="true">{side}</span><strong>{name}</strong></div>;
}

function Matchup({ match, compact = false }: { match: DemoMatch; compact?: boolean }) {
  const finished = match.status === "completed";
  return (
    <div className={compact ? "matchup matchup-compact" : "matchup"}>
      <Team name={match.homeTeam} side="A" />
      <div className="matchup-score" aria-label={finished ? `${match.homeTeam} ${match.homeScore} 比 ${match.awayScore} ${match.awayTeam}` : `${match.homeTeam} 对阵 ${match.awayTeam}`}>
        {finished ? <><b>{match.homeScore}</b><span>:</span><b>{match.awayScore}</b></> : <b>VS</b>}
      </div>
      <Team name={match.awayTeam} side="B" />
    </div>
  );
}

export function MatchCenter() {
  const nextMatch: DemoMatch | null = demoMatchCentre.nextMatch;
  const recentResult: DemoMatch | null = demoMatchCentre.recentResult;

  return (
    <section className="home-match-center home-screen" data-home-screen="matches" id="home-match" aria-labelledby="home-match-center-title">
      <div className="page-shell">
        <div className="home-section-bar" data-home-reveal data-home-delay="0">
          <div><p>MATCH CONTROL / 比赛信息中心</p><h2 id="home-match-center-title">下一场，从这里开始</h2></div>
          <StatusBadge>演示数据 · 非真实赛程</StatusBadge>
        </div>
        <div className="match-center-grid">
          <div className="next-match-panel" data-home-reveal data-home-delay="1">
            {nextMatch ? (
              <>
                <div className="match-panel-topline">
                  <div><span>下一场比赛</span><strong>{nextMatch.competitionName}</strong></div>
                  <StatusBadge tone="warning">{nextMatch.statusLabel}</StatusBadge>
                </div>
                <div className="match-context"><span>{nextMatch.stageLabel}</span><span>{nextMatch.roundLabel}</span></div>
                <Matchup match={nextMatch} />
                <dl className="match-facts">
                  <div><dt>比赛时间</dt><dd>{nextMatch.dateLabel}</dd></div>
                  <div><dt>比赛场地</dt><dd>{nextMatch.venue}</dd></div>
                </dl>
                <Link className="button button-primary" href={nextMatch.detailHref}>查看比赛详情 <span aria-hidden="true">→</span></Link>
              </>
            ) : <EmptyState title="当前暂无已公布赛程" description="请关注赛事公告。" href="/news" actionLabel="查看公告" />}
          </div>

          <div className="match-center-side" data-home-reveal data-home-delay="2">
            <article className="recent-result-panel">
              <div className="side-panel-heading"><div><span>RECENT RESULT</span><h3>最近赛果</h3></div><Link href="/competitions/schedule">全部赛果 →</Link></div>
              {recentResult ? <><p>{recentResult.competitionName} · {recentResult.roundLabel}</p><Matchup compact match={recentResult} /></> : <EmptyState compact title="暂无赛果" description="经核验后发布。" />}
            </article>
            <article className="competition-pulse-panel">
              <div className="side-panel-heading"><div><span>SEASON STATUS</span><h3>当前赛事状态</h3></div></div>
              <div className="competition-pulse-list">
                {annualCompetitions.slice(0, 3).map((competition) => (
                  <Link href={competition.detailHref} key={competition.id}>
                    <span>{competition.shortName}</span><small>{competition.stageLabel}</small><b>{competition.displayStatus.label}</b>
                  </Link>
                ))}
              </div>
              <Link className="text-link" href="/competitions/schedule">查看完整赛程 <span aria-hidden="true">→</span></Link>
            </article>
          </div>
        </div>
        <p className="home-demo-note" data-home-reveal data-home-delay="3">日期、球队、场地、比分及赛事状态均为界面演示数据，正式信息以协会公告为准。</p>
      </div>
    </section>
  );
}
