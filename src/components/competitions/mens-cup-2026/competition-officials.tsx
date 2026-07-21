import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";

import { formatMatchDateTime, formatMatchScore } from "./archive-utils";

const assignmentRoles = [
  ["matchSupervisor", "比赛监督"],
  ["refereeAssessor", "裁判监督"],
  ["referee", "裁判员"],
  ["assistantReferee1", "第一助理裁判员"],
  ["assistantReferee2", "第二助理裁判员"],
  ["fourthOfficial", "第四官员"],
  ["reserveAssistantReferee", "候补助理裁判员"],
] as const;

export function CompetitionOfficials() {
  const { matches, officials } = mensIntercollegeCup2026;
  const matchById = new Map(matches.map((match) => [match.id, match]));

  return (
    <section className="cup-archive-section cup-archive-section-tint" id="officials" aria-labelledby="cup-officials-title">
      <div className="page-shell">
        <div className="cup-section-heading">
          <div><p>MATCH OFFICIALS</p><h2 id="cup-officials-title">裁判委员会与每场安排</h2></div>
          <span>16场比赛的裁判员安排均按迁移包原始记录展示。</span>
        </div>

        <div className="cup-official-overview">
          <article><p>CHIEF REFEREE</p><span>裁判长</span><strong>{officials.committee.chiefReferee}</strong></article>
          <section><p>REGISTERED REFEREES</p><h3>注册裁判员</h3><div>{officials.committee.registeredReferees.map((name) => <span key={name}>{name}</span>)}</div></section>
        </div>

        <div className="cup-assignment-list">
          {officials.assignments.map((assignment) => {
            const match = matchById.get(assignment.matchId);
            if (!match) return null;
            return (
              <details key={assignment.matchId} open={assignment.matchId === 16}>
                <summary><span>#{String(assignment.matchId).padStart(2, "0")}</span><div><strong>{match.homeTeam} {formatMatchScore(match)} {match.awayTeam}</strong><small>{match.round} · {formatMatchDateTime(match.dateTime)}</small></div><p>主裁判：{assignment.referee}</p><i aria-hidden="true">＋</i></summary>
                <dl>{assignmentRoles.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{assignment[key] ?? "—"}</dd></div>)}</dl>
              </details>
            );
          })}
        </div>

        <div className="cup-final-officials">
          <div><p>FINAL OFFICIALS</p><h3>决赛裁判组</h3></div>
          <dl>{assignmentRoles.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{officials.finalOfficials[key]}</dd></div>)}</dl>
        </div>
      </div>
    </section>
  );
}
