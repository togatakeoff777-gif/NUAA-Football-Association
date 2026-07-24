import { ArchiveStandingTable, type ArchiveStandingRow } from "@/components/competitions/archive/archive-data-tables";
import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";

export function CompetitionStandings() {
  const { standings } = mensIntercollegeCup2026;
  return (
    <section className="cup-archive-section" id="standings" aria-labelledby="cup-standings-title">
      <div className="page-shell">
        <div className="cup-section-heading"><div><p>GROUP TABLES</p><h2 id="cup-standings-title">A、B组积分榜</h2></div><span>胜场3分；各组前两名晋级半决赛。</span></div>
        <div className="cup-standing-groups">
          {standings.groups.map((group) => {
            const rows: readonly ArchiveStandingRow[] = group.table.map((row) => ({ id: row.teamId, position: row.position, team: row.team, played: row.played, won: row.won, drawn: row.drawn, lost: row.lost, goalsFor: row.goalsFor, goalsAgainst: row.goalsAgainst, goalDifference: row.goalDifference, points: row.points }));
            return <article className="cup-standing-group" key={group.group}><header><span>GROUP</span><strong>{group.group}</strong><p>{group.group}组最终积分</p></header><ArchiveStandingTable caption={`${group.group}组最终积分榜`} rows={rows} />{"sourceNote" in group && group.sourceNote ? <p className="cup-data-note">{group.sourceNote}</p> : null}</article>;
          })}
        </div>
      </div>
    </section>
  );
}
