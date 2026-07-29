import { womensIntercollegeCup2026 } from "@/data/womens-intercollege-cup-2026";

export function WomensCompetitionTeams() {
  const { discipline, rosters, scorers } = womensIntercollegeCup2026;

  return (
    <section className="cup-archive-section" id="teams" aria-labelledby="womens-teams-title">
      <div className="page-shell">
        <div className="cup-section-heading">
          <div><p>TEAMS & RECORDS</p><h2 id="womens-teams-title">球队名单与赛事记录</h2></div>
          <span>24名球员为赛事汇总数量；公开姓名严格以现有赛事资料可核验内容为限。</span>
        </div>
        <div className="cup-team-list cup-womens-roster-list">
          {rosters.map((roster, index) => (
            <details key={roster.team}>
              <summary>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{roster.team}</strong><small>{roster.coverage === "verified" ? "名单已核验" : "部分资料已核验"}</small></div>
                <b>{roster.players.length}<small>公开球员</small></b>
                <i aria-hidden="true">+</i>
              </summary>
              <div className="cup-team-roster">
                <section>
                  <h4>球员名单</h4>
                  {roster.players.length ? <div>{roster.players.map((player) => <span key={`${roster.team}-${player.number}`}><b>{player.number}</b>{player.name}</span>)}</div> : <p>现有来源未提供可完整核验的球员姓名。</p>}
                </section>
                <section>
                  <h4>工作人员</h4>
                  {roster.staff.length ? <div>{roster.staff.map((person) => <span key={`${person.role}-${person.name}`}><b>{person.role}</b>{person.name}</span>)}</div> : <p>工作人员姓名资料整理中。</p>}
                </section>
                <p className="cup-roster-note">{roster.note}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="cup-womens-record-grid">
          <section>
            <p>SCORERS</p>
            <h3>射手记录</h3>
            <div>{scorers.leaders.map((player) => <article key={player.name}><strong>{player.name}</strong><span>{player.basis}</span><small>个人进球数：资料整理中</small></article>)}</div>
            <p>{scorers.note}</p>
          </section>
          <section>
            <p>DISCIPLINE</p>
            <h3>纪律记录</h3>
            <dl><div><dt>平台汇总黄牌</dt><dd>{discipline.summaryYellowCards}</dd></div><div><dt>平台汇总红牌</dt><dd>{discipline.summaryRedCards}</dd></div></dl>
            <p>{discipline.unresolved}</p>
          </section>
        </div>
      </div>
    </section>
  );
}
