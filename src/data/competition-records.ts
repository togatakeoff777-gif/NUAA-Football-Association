import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";
import { womensIntercollegeCup2026 } from "@/data/womens-intercollege-cup-2026";

export type PublicStandingRow = {
  id: string;
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type PublicScorerRow = {
  id: string;
  position: number;
  player: string;
  team?: string;
  number?: number;
  goals: number | null;
  basis?: string;
};

export type CompetitionRecord = {
  id: string;
  season: number;
  competitionName: string;
  shortName: string;
  formatLabel: string;
  archiveHref: string;
  standings: readonly {
    label: string;
    rows: readonly PublicStandingRow[];
    note?: string;
  }[];
  scorers: readonly PublicScorerRow[];
  scorerNote?: string;
};

export const competitionRecords: readonly CompetitionRecord[] = [
  {
    id: "2026-mens-intercollege-cup",
    season: 2026,
    competitionName: "2026男子足球院际杯（天目湖校区）",
    shortName: "男子足球院际杯",
    formatLabel: "十一人制",
    archiveHref: "/competitions/2026-mens-intercollege-cup",
    standings: mensIntercollegeCup2026.standings.groups.map((group) => ({
      label: `${group.group}组`,
      rows: group.table.map((row) => ({
        id: row.teamId,
        position: row.position,
        team: row.team,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
        points: row.points,
      })),
      note: "sourceNote" in group ? group.sourceNote : undefined,
    })),
    scorers: mensIntercollegeCup2026.statistics.topScorers.map((player) => ({
      id: `${player.team}-${player.number}-${player.player}`,
      position: player.position,
      player: player.player,
      team: player.team,
      number: player.number,
      goals: player.goals,
    })),
  },
  {
    id: "2026-womens-intercollege-cup",
    season: 2026,
    competitionName: "2026女子足球院际杯（天目湖校区）",
    shortName: "女子足球院际杯",
    formatLabel: "五人制",
    archiveHref: "/competitions/2026-womens-intercollege-cup",
    standings: [
      {
        label: "最终积分",
        rows: womensIntercollegeCup2026.teams.map((team) => ({
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
        })),
      },
    ],
    scorers: womensIntercollegeCup2026.scorers.leaders.map((player, index) => ({
      id: player.name,
      position: index + 1,
      player: player.name,
      goals: player.goals,
      basis: player.basis,
    })),
    scorerNote: womensIntercollegeCup2026.scorers.note,
  },
];
