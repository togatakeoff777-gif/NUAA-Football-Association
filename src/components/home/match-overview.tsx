import Link from "next/link";
import { recentMatches } from "@/data/competitions";
import { DemoLabel } from "@/components/ui/demo-label";

export function MatchOverview() {
  return (
    <section className="match-overview" aria-labelledby="match-overview-title">
      <div className="page-shell">
        <div className="match-overview-head">
          <div>
            <p className="section-eyebrow">MATCH BRIEF / 比赛速览</p>
            <h2 id="match-overview-title">最近赛果与下一场</h2>
          </div>
          <DemoLabel>演示数据 · 非真实历史记录</DemoLabel>
        </div>
        <div className="match-overview-grid">
          {recentMatches.map((match) => {
            const finished = match.status === "completed";
            return (
              <article className="snapshot-card" key={match.id}>
                <div className="snapshot-label">
                  <span>{finished ? "最近赛果" : "下一场比赛"}</span>
                  <strong>{match.competitionName}</strong>
                </div>
                <div className="snapshot-meta">
                  <time>{match.dateLabel}</time><span>{match.venue}</span>
                </div>
                <div className="snapshot-teams">
                  <div><i aria-hidden="true">A</i><strong>{match.homeTeam}</strong></div>
                  <div className="snapshot-score" aria-label={finished ? `${match.homeScore} 比 ${match.awayScore}` : "对阵"}>
                    {finished ? <><b>{match.homeScore}</b><span>:</span><b>{match.awayScore}</b></> : <b>VS</b>}
                  </div>
                  <div><i aria-hidden="true">B</i><strong>{match.awayTeam}</strong></div>
                </div>
              </article>
            );
          })}
        </div>
        <div className="match-overview-foot">
          <p>页面中的比分、球队、日期和场地均为界面演示数据。</p>
          <Link className="text-link" href="/competitions">进入赛事中心 <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </section>
  );
}
