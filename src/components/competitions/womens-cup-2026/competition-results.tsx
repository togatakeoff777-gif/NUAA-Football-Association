import {
  ArchiveMatchTable,
  ArchiveStandingTable,
  type ArchiveMatchRow,
  type ArchiveStandingRow,
} from "@/components/competitions/archive/archive-data-tables";
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

export function WomensCompetitionSchedule() {
  const { competition, matches } = womensIntercollegeCup2026;
  const rows: readonly ArchiveMatchRow[] = matches.map((match) => {
    const { date, time } = splitKickoff(match.kickoff);
    return {
      id: `match-${match.number}`,
      number: `#${String(match.number).padStart(2, "0")}`,
      stage: match.stage,
      date,
      time,
      homeTeam: match.home,
      awayTeam: match.away,
      score: `${match.homeScore} : ${match.awayScore}`,
      venue: competition.venue,
    };
  });

  return (
    <section className="cup-archive-section cup-archive-section-tint" id="schedule" aria-labelledby="womens-schedule-title">
      <div className="page-shell">
        <div className="cup-section-heading"><div><p>FIXTURES & RESULTS</p><h2 id="womens-schedule-title">赛程与赛果</h2></div><span>8场比赛均已结束；桌面端使用数据表，移动端自动切换为比赛卡片。</span></div>
        <ArchiveMatchTable caption="2026女子足球院际杯完整赛果" rows={rows} />
      </div>
    </section>
  );
}

export function WomensCompetitionStandings() {
  const { teams } = womensIntercollegeCup2026;
  const rows: readonly ArchiveStandingRow[] = teams.map((team) => ({
    id: team.name,
    position: team.rank,
    team: team.name,
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    goalsFor: team.goalsFor,
    goalsAgainst: team.goalsAgainst,
    goalDifference: team.goalDifference,
    points: team.points,
  }));

  return (
    <section className="cup-archive-section" id="standings" aria-labelledby="womens-standings-title">
      <div className="page-shell">
        <div className="cup-section-heading"><div><p>FINAL TABLE</p><h2 id="womens-standings-title">最终积分榜</h2></div><span>排名与积分来自赛事平台数据；淘汰赛成绩不计入积分榜统计。</span></div>
        <ArchiveStandingTable caption="2026女子足球院际杯最终积分榜" rows={rows} />
      </div>
    </section>
  );
}

export function WomensCompetitionOfficials() {
  const { matches } = womensIntercollegeCup2026;
  return (
    <section className="cup-archive-section cup-archive-section-tint" id="officials" aria-labelledby="womens-officials-title">
      <div className="page-shell">
        <div className="cup-section-heading"><div><p>MATCH OFFICIALS</p><h2 id="womens-officials-title">裁判选派</h2></div><span>仅录入截图中可清晰辨认的岗位；无法确认的姓名显示“资料整理中”。</span></div>
        <div className="cup-assignment-list cup-womens-assignment-list">
          {matches.map((match) => <details key={match.number}><summary><span>#{String(match.number).padStart(2, "0")}</span><div><strong>{match.home} vs {match.away}</strong><small>{match.stage} · {match.kickoff}</small></div><i aria-hidden="true">+</i></summary><dl>{Object.entries(officialLabels).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{match.officials[key as keyof typeof match.officials] ?? "资料整理中"}</dd></div>)}</dl></details>)}
        </div>
      </div>
    </section>
  );
}
