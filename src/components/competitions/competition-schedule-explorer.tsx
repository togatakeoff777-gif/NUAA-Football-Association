"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { PublicMatchRecord } from "@/types/competition-center";

function MatchScore({ match }: { match: PublicMatchRecord }) {
  return (
    <div className="functional-score">
      <strong>{match.homeScore} : {match.awayScore}</strong>
      {match.penaltyScore ? <small>点球 {match.penaltyScore}</small> : null}
    </div>
  );
}

export function CompetitionScheduleExplorer({ matches }: { matches: readonly PublicMatchRecord[] }) {
  const [competition, setCompetition] = useState("all");
  const [stage, setStage] = useState("all");
  const [team, setTeam] = useState("all");

  const competitions = useMemo(() => Array.from(new Map(matches.map((match) => [match.competitionId, match.competitionName]))), [matches]);
  const stages = useMemo(() => Array.from(new Set(matches.filter((match) => competition === "all" || match.competitionId === competition).map((match) => match.stage))), [competition, matches]);
  const teams = useMemo(() => Array.from(new Set(matches.filter((match) => competition === "all" || match.competitionId === competition).flatMap((match) => [match.homeTeam, match.awayTeam]))).sort((a, b) => a.localeCompare(b, "zh-CN")), [competition, matches]);

  const filteredMatches = matches.filter((match) => {
    if (competition !== "all" && match.competitionId !== competition) return false;
    if (stage !== "all" && match.stage !== stage) return false;
    if (team !== "all" && match.homeTeam !== team && match.awayTeam !== team) return false;
    return true;
  });

  function resetDependentFilters() {
    setStage("all");
    setTeam("all");
  }

  return (
    <>
      <div className="functional-filters" aria-label="赛程筛选">
        <label>赛事<select value={competition} onChange={(event) => { setCompetition(event.target.value); resetDependentFilters(); }}><option value="all">全部赛事</option>{competitions.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
        <label>阶段<select value={stage} onChange={(event) => setStage(event.target.value)}><option value="all">全部阶段</option>{stages.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label>球队<select value={team} onChange={(event) => setTeam(event.target.value)}><option value="all">全部球队</option>{teams.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <span>共 {filteredMatches.length} 场已核验比赛</span>
      </div>

      {filteredMatches.length ? (
        <>
          <div className="functional-schedule-table-wrap">
            <table className="functional-schedule-table">
              <caption>已归档赛事的统一赛程与赛果</caption>
              <thead><tr><th>日期 / 时间</th><th>赛事 / 阶段</th><th>主队</th><th>比分</th><th>客队</th><th>场地</th><th>入口</th></tr></thead>
              <tbody>{filteredMatches.map((match) => <tr key={match.id}><td><strong>{match.dateLabel}</strong><small>{match.timeLabel}</small></td><td><Link href={match.competitionHref}>{match.competitionName}</Link><small>{match.stage}</small></td><td>{match.homeTeam}</td><td><MatchScore match={match} /></td><td>{match.awayTeam}</td><td>{match.venue}</td><td><Link href={match.detailHref}>比赛记录</Link>{match.refereeHref ? <Link href={match.refereeHref}>裁判选派</Link> : null}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="functional-schedule-mobile">
            {filteredMatches.map((match) => <article key={match.id}><header><span>{match.competitionName} · {match.stage}</span><time>{match.dateLabel} {match.timeLabel}</time></header><div><strong>{match.homeTeam}</strong><MatchScore match={match} /><strong>{match.awayTeam}</strong></div><p>{match.venue}</p><footer><Link href={match.detailHref}>比赛记录 →</Link>{match.refereeHref ? <Link href={match.refereeHref}>裁判选派 →</Link> : null}</footer></article>)}
          </div>
        </>
      ) : (
        <div className="functional-empty"><strong>没有符合条件的比赛</strong><p>请调整赛事、阶段或球队筛选条件。</p></div>
      )}
    </>
  );
}
