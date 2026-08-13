"use client";

import Link from "next/link";
import { useState } from "react";

import { ArchiveStandingTable } from "@/components/competitions/archive/archive-data-tables";
import type { CompetitionRecord } from "@/data/competition-records";

type RecordMode = "standings" | "scorers";

export function CompetitionRecordExplorer({
  records,
  mode,
}: {
  records: readonly CompetitionRecord[];
  mode: RecordMode;
}) {
  const seasons = Array.from(new Set(records.map((record) => record.season))).sort((a, b) => b - a);
  const [selectedSeason, setSelectedSeason] = useState(seasons[0] ?? 0);
  const initialRecord = records.find((record) => record.season === selectedSeason) ?? records[0];
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(initialRecord?.id ?? "");
  const seasonRecords = records.filter((record) => record.season === selectedSeason);
  const selectedRecord =
    seasonRecords.find((record) => record.id === selectedCompetitionId) ?? seasonRecords[0];

  if (!selectedRecord) {
    return <div className="functional-empty"><strong>当前暂无已公开赛事数据</strong></div>;
  }

  function handleSeasonChange(value: string) {
    const season = Number(value);
    const firstRecord = records.find((record) => record.season === season);
    setSelectedSeason(season);
    setSelectedCompetitionId(firstRecord?.id ?? "");
  }

  return (
    <div className="competition-record-explorer">
      <div className="competition-record-filters" aria-label="赛事数据筛选">
        <label>
          <span>赛季</span>
          <select value={selectedSeason} onChange={(event) => handleSeasonChange(event.target.value)}>
            {seasons.map((season) => <option key={season} value={season}>{season}</option>)}
          </select>
        </label>
        <label>
          <span>赛事</span>
          <select value={selectedRecord.id} onChange={(event) => setSelectedCompetitionId(event.target.value)}>
            {seasonRecords.map((record) => <option key={record.id} value={record.id}>{record.shortName}</option>)}
          </select>
        </label>
      </div>

      <section className="competition-record-result" aria-live="polite">
        <header>
          <div>
            <span>{selectedRecord.season} SEASON · {selectedRecord.formatLabel}</span>
            <h2>{selectedRecord.competitionName}</h2>
          </div>
          <Link href={selectedRecord.archiveHref}>进入赛事档案 →</Link>
        </header>

        {mode === "standings" ? (
          selectedRecord.standings.length ? (
            <div className="competition-standing-groups">
              {selectedRecord.standings.map((group) => (
                <section key={group.label}>
                  <h3>{group.label}</h3>
                  <ArchiveStandingTable rows={group.rows} caption={`${selectedRecord.competitionName}${group.label}积分榜`} />
                  {group.note ? <p className="competition-record-note">{group.note}</p> : null}
                </section>
              ))}
            </div>
          ) : (
            <div className="functional-empty"><strong>当前暂无已公开积分榜数据</strong></div>
          )
        ) : selectedRecord.scorers.length ? (
          <>
            <div className="competition-scorer-table-wrap">
              <table className="competition-scorer-table">
                <caption className="sr-only">{selectedRecord.competitionName}射手记录</caption>
                <thead><tr><th>排名</th><th>球员</th><th>球队</th><th>号码</th><th>进球数</th></tr></thead>
                <tbody>
                  {selectedRecord.scorers.map((player) => (
                    <tr key={player.id}>
                      <td>{player.position}</td>
                      <td><strong>{player.player}</strong></td>
                      <td>{player.team ?? "-"}</td>
                      <td>{player.number ?? "-"}</td>
                      <td><b>{player.goals ?? player.basis ?? "未公开"}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="competition-scorer-mobile" aria-label={`${selectedRecord.competitionName}射手记录移动端列表`}>
              {selectedRecord.scorers.map((player) => (
                <article key={player.id}>
                  <span>{String(player.position).padStart(2, "0")}</span>
                  <div><strong>{player.player}</strong><small>{player.team ?? player.basis ?? "赛事奖项记录"}</small></div>
                  <b>{player.goals === null ? "已确认" : `${player.goals}球`}</b>
                </article>
              ))}
            </div>
            {selectedRecord.scorerNote ? <p className="competition-record-note">{selectedRecord.scorerNote}</p> : null}
          </>
        ) : (
          <div className="functional-empty"><strong>当前暂无已公开射手数据</strong></div>
        )}
      </section>
    </div>
  );
}
