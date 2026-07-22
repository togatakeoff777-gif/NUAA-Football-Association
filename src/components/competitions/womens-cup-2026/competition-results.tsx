import { womensIntercollegeCup2026 } from "@/data/womens-intercollege-cup-2026";

const officialLabels = {
  matchSupervisor: "比赛监督",
  refereeAssessor: "裁判监督",
  referee: "裁判员",
  secondReferee: "第二裁判员",
  thirdReferee: "第三裁判员",
  timekeeper: "计时员",
} as const;

function splitKickoff(kickoff: string) {
  const [date, time] = kickoff.split(" ");
  return { date: date.replaceAll("-", "."), time };
}

export function WomensCompetitionResults() {
  const { competition, matches, teams } = womensIntercollegeCup2026;

  return (
    <>
      <section className="cup-archive-section cup-archive-section-tint" id="schedule" aria-labelledby="womens-schedule-title">
        <div className="page-shell">
          <div className="cup-section-heading">
            <div><p>FIXTURES & RESULTS</p><h2 id="womens-schedule-title">赛程与赛果</h2></div>
            <span>8场比赛均已结束；移动端自动切换为分组比赛卡片。</span>
          </div>
          <div className="cup-results-table-wrap">
            <table className="cup-results-table">
              <caption>2026女子足球院际杯完整赛果</caption>
              <thead><tr><th>场次</th><th>阶段</th><th>日期</th><th>主队</th><th>比分</th><th>客队</th><th>场地</th></tr></thead>
              <tbody>
                {matches.map((match) => {
                  const { date, time } = splitKickoff(match.kickoff);
                  return (
                    <tr id={`match-${match.number}`} key={match.number}>
                      <td>#{String(match.number).padStart(2, "0")}</td>
                      <td>{match.stage}</td>
                      <td>{date}<small>{time}</small></td>
                      <td><strong>{match.home}</strong></td>
                      <td><b>{match.homeScore} : {match.awayScore}</b></td>
                      <td><strong>{match.away}</strong></td>
                      <td>{competition.venue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="cup-results-mobile" aria-label="移动端女子足球院际杯赛果">
            {matches.map((match) => {
              const { date, time } = splitKickoff(match.kickoff);
              return (
                <article id={`mobile-match-${match.number}`} key={match.number}>
                  <header><span>#{String(match.number).padStart(2, "0")} · {match.stage}</span><time>{date} {time}</time></header>
                  <div><strong>{match.home}</strong><b>{match.homeScore} : {match.awayScore}</b><strong>{match.away}</strong></div>
                  <footer>{competition.venue}</footer>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cup-archive-section" id="standings" aria-labelledby="womens-standings-title">
        <div className="page-shell">
          <div className="cup-section-heading">
            <div><p>FINAL TABLE</p><h2 id="womens-standings-title">最终积分榜</h2></div>
            <span>排名与积分来自赛事平台数据；淘汰赛成绩不计入积分榜统计。</span>
          </div>
          <div className="cup-standing-table-wrap">
            <table className="cup-standing-table">
              <caption>2026女子足球院际杯最终积分榜</caption>
              <thead><tr><th>排名</th><th>球队</th><th>赛</th><th>胜</th><th>平</th><th>负</th><th>进</th><th>失</th><th>净胜</th><th>积分</th></tr></thead>
              <tbody>{teams.map((team) => <tr key={team.name}><td>{team.rank}</td><td><strong>{team.name}</strong></td><td>{team.played}</td><td>{team.won}</td><td>{team.drawn}</td><td>{team.lost}</td><td>{team.goalsFor}</td><td>{team.goalsAgainst}</td><td>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td><td><b>{team.points}</b></td></tr>)}</tbody>
            </table>
          </div>
          <div className="cup-standing-mobile" aria-label="移动端女子足球院际杯积分榜">
            {teams.map((team) => <div key={team.name}><span>{team.rank}</span><section><strong>{team.name}</strong><small>{team.played}场 · {team.won}胜 {team.drawn}平 {team.lost}负 · 净胜{team.goalDifference}</small></section><b>{team.points}<small>分</small></b></div>)}
          </div>
        </div>
      </section>

      <section className="cup-archive-section cup-archive-section-tint" id="officials" aria-labelledby="womens-officials-title">
        <div className="page-shell">
          <div className="cup-section-heading">
            <div><p>MATCH OFFICIALS</p><h2 id="womens-officials-title">裁判选派</h2></div>
            <span>仅录入截图中可清晰辨认的岗位；无法确认的姓名显示“资料整理中”。</span>
          </div>
          <div className="cup-assignment-list cup-womens-assignment-list">
            {matches.map((match) => (
              <details key={match.number}>
                <summary>
                  <span>#{String(match.number).padStart(2, "0")}</span>
                  <div><strong>{match.home} vs {match.away}</strong><small>{match.stage} · {match.kickoff}</small></div>
                  <i aria-hidden="true">+</i>
                </summary>
                <dl>
                  {Object.entries(officialLabels).map(([key, label]) => (
                    <div key={key}><dt>{label}</dt><dd>{match.officials[key as keyof typeof match.officials] ?? "资料整理中"}</dd></div>
                  ))}
                </dl>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
