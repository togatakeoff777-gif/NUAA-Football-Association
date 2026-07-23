import { ArchiveMatchTable, type ArchiveMatchRow } from "@/components/competitions/archive/archive-data-tables";
import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";

import { formatMatchStage } from "./archive-utils";

export function CompetitionResults() {
  const { matches } = mensIntercollegeCup2026;
  const rows: readonly ArchiveMatchRow[] = matches.map((match) => ({
    id: `match-${match.id}`,
    number: `#${String(match.id).padStart(2, "0")}`,
    stage: formatMatchStage(match),
    date: match.dateTime.slice(0, 10).replaceAll("-", "."),
    time: match.dateTime.slice(11, 16),
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    score: `${match.homeScore} : ${match.awayScore}`,
    scoreNote: typeof match.homePenaltyScore === "number" && typeof match.awayPenaltyScore === "number" ? `点球 ${match.homePenaltyScore}:${match.awayPenaltyScore}` : undefined,
    venue: match.venue,
  }));

  return (
    <section className="cup-archive-section cup-archive-section-tint" id="schedule" aria-labelledby="cup-schedule-title">
      <div className="page-shell">
        <div className="cup-section-heading"><div><p>FIXTURES & RESULTS</p><h2 id="cup-schedule-title">赛程与赛果</h2></div><span>16场比赛均已结束；桌面端使用数据表，移动端自动切换为比赛卡片。</span></div>
        <ArchiveMatchTable caption="2026男子足球院际杯完整赛果" rows={rows} />
      </div>
    </section>
  );
}
