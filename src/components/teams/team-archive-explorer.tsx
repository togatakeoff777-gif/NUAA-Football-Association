"use client";

import Link from "next/link";
import { useState } from "react";

import type { VerifiedCompetitionTeamArchive } from "@/data/teams";

type TeamArchiveExplorerProps = {
  records: readonly VerifiedCompetitionTeamArchive[];
};

export function TeamArchiveExplorer({ records }: TeamArchiveExplorerProps) {
  const seasons = Array.from(new Set(records.map((entry) => entry.season))).sort((a, b) => b - a);
  const [selectedSeason, setSelectedSeason] = useState<number>(seasons[0] ?? 0);
  const seasonCompetitions = records.filter((entry) => entry.season === selectedSeason);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(seasonCompetitions[0]?.competitionId ?? "");
  const selectedCompetition =
    seasonCompetitions.find((entry) => entry.competitionId === selectedCompetitionId) ?? seasonCompetitions[0];

  function handleSeasonChange(value: string) {
    const season = Number(value);
    const firstCompetition = records.find((entry) => entry.season === season);
    setSelectedSeason(season);
    setSelectedCompetitionId(firstCompetition?.competitionId ?? "");
  }

  if (!selectedCompetition) {
    return <div className="functional-empty"><strong>当前暂无已确认参赛球队档案</strong></div>;
  }

  return (
    <div className="team-archive-explorer">
      <div className="team-archive-filters">
        <label>
          <span>赛季</span>
          <select value={selectedSeason} onChange={(event) => handleSeasonChange(event.target.value)}>
            {seasons.map((season) => <option key={season} value={season}>{season}</option>)}
          </select>
        </label>
        <div>
          <span>赛事</span>
          <div role="group" aria-label="选择赛事">
            {seasonCompetitions.map((competition) => (
              <button
                aria-pressed={competition.competitionId === selectedCompetition.competitionId}
                key={competition.competitionId}
                onClick={() => setSelectedCompetitionId(competition.competitionId)}
                type="button"
              >
                {competition.competitionName.replace(String(competition.season), "").trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="team-archive-result" aria-live="polite">
        <header>
          <div><span>COMPETITION TEAMS</span><h3>{selectedCompetition.competitionName}</h3><p>{selectedCompetition.summary}</p></div>
          <Link href={selectedCompetition.competitionHref}>进入赛事归档 →</Link>
        </header>
        <div className="team-archive-grid">
          {selectedCompetition.teams.map((team, index) => (
            <article key={team.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h4>{team.name}</h4>
              <dl>
                {"group" in team ? <div><dt>分组</dt><dd>{team.group}</dd></div> : null}
                {"finalRank" in team ? <div><dt>最终名次</dt><dd>第{team.finalRank}名</dd></div> : null}
                {team.publicRosterCount > 0 ? <div><dt>公开名单</dt><dd>{team.publicRosterCount}名球员</dd></div> : null}
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
