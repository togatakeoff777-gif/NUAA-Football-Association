import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";

import { formatMatchDateTime, formatMatchScore, formatMatchStage } from "./archive-utils";

export function CompetitionResults() {
  const { matches } = mensIntercollegeCup2026;

  return (
    <section className="cup-archive-section cup-archive-section-tint" id="schedule" aria-labelledby="cup-schedule-title">
      <div className="page-shell">
        <div className="cup-section-heading">
          <div><p>FIXTURES & RESULTS</p><h2 id="cup-schedule-title">赛程与赛果</h2></div>
          <span>16场比赛均已结束；桌面端使用数据表，移动端自动切换为比赛卡片。</span>
        </div>

        <div className="cup-results-table-wrap">
          <table className="cup-results-table">
            <caption>2026男子足球院际杯完整赛果</caption>
            <thead><tr><th>场次</th><th>阶段</th><th>日期</th><th>主队</th><th>比分</th><th>客队</th><th>场地</th></tr></thead>
            <tbody>
              {matches.map((match) => (
                <tr id={`match-${match.id}`} key={match.id}>
                  <td>#{String(match.id).padStart(2, "0")}</td>
                  <td>{formatMatchStage(match)}</td>
                  <td>{formatMatchDateTime(match.dateTime)}</td>
                  <td><strong>{match.homeTeam}</strong></td>
                  <td><b>{formatMatchScore(match)}</b></td>
                  <td><strong>{match.awayTeam}</strong></td>
                  <td>{match.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cup-results-mobile" aria-label="移动端赛程与赛果">
          {matches.map((match) => (
            <article id={`mobile-match-${match.id}`} key={match.id}>
              <header><span>#{String(match.id).padStart(2, "0")} · {formatMatchStage(match)}</span><time>{formatMatchDateTime(match.dateTime)}</time></header>
              <div><strong>{match.homeTeam}</strong><b>{formatMatchScore(match)}</b><strong>{match.awayTeam}</strong></div>
              <footer>{match.venue}</footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
