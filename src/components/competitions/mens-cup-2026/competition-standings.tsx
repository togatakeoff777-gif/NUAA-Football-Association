import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";

export function CompetitionStandings() {
  const { standings } = mensIntercollegeCup2026;

  return (
    <section className="cup-archive-section" id="standings" aria-labelledby="cup-standings-title">
      <div className="page-shell">
        <div className="cup-section-heading">
          <div><p>GROUP TABLES</p><h2 id="cup-standings-title">A、B组积分榜</h2></div>
          <span>胜场3分；各组前两名晋级半决赛。</span>
        </div>
        <div className="cup-standing-groups">
          {standings.groups.map((group) => (
            <article className="cup-standing-group" key={group.group}>
              <header><span>GROUP</span><strong>{group.group}</strong><p>{group.group}组最终积分</p></header>
              <div className="cup-standing-table-wrap">
                <table className="cup-standing-table">
                  <thead><tr><th>排名</th><th>球队</th><th>赛</th><th>胜</th><th>平</th><th>负</th><th>进/失</th><th>净胜</th><th>积分</th></tr></thead>
                  <tbody>{group.table.map((row) => <tr key={row.teamId}><td>{row.position}</td><td><strong>{row.team}</strong></td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.goalsFor}/{row.goalsAgainst}</td><td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td><td><b>{row.points}</b></td></tr>)}</tbody>
                </table>
              </div>
              <div className="cup-standing-mobile">
                {group.table.map((row) => <div key={row.teamId}><span>{row.position}</span><section><strong>{row.team}</strong><small>{row.played}赛 · {row.won}胜 {row.drawn}平 {row.lost}负 · 净胜{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</small></section><b>{row.points}<small>分</small></b></div>)}
              </div>
              {"sourceNote" in group && group.sourceNote ? <p className="cup-data-note">{group.sourceNote}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
