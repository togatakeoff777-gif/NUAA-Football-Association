import {
  ASSOCIATION_CONTENT_OWNER,
  ASSOCIATION_ORGANIZATION_ID,
} from "@/data/association";
import { coreCompetitionDirectory } from "@/data/competition-directory";
import type { DemoMatch, DemoScorer, DemoStanding } from "@/types";

export const competitionStatusLabels = {
  preparing: "筹备中",
  registration: "报名中",
  ongoing: "进行中",
  completed: "已结束",
} as const;

const sharedMetadata = {
  organizationId: ASSOCIATION_ORGANIZATION_ID,
  contentOwner: ASSOCIATION_CONTENT_OWNER,
  dataSource: "local",
} as const;

export const coreCompetitions = coreCompetitionDirectory.map((competition) => ({
  ...competition,
  organizerNote: competition.notice,
  tags: [competition.eventType, competition.formatLabel, competition.teamFormation],
  displayStatus: {
    key: competition.status,
    label: competitionStatusLabels[competition.status],
    dataStatus: competition.dataStatus,
    badge: competition.badge,
  },
}));

export const annualCompetitions = coreCompetitions;

export const annualCompetitionGroups = [
  {
    id: "first-semester",
    label: "上半学期",
    competitionIds: ["freshman-cup", "tianmuhu-futsal-league"],
  },
  {
    id: "second-semester",
    label: "下半学期",
    competitionIds: ["mens-intercollege-cup", "womens-intercollege-cup"],
  },
] as const;

export const matchDemoNotice =
  "以下状态、日期、对阵、比分、球队与榜单均为演示数据，仅用于展示页面结构，不代表真实赛程或历史记录。";

export const demoMatchCentre = {
  dataStatus: "demo",
  badge: "演示数据",
  notice: matchDemoNotice,
  recentResult: {
    ...sharedMetadata,
    id: "demo-recent-result",
    campus: "tianmuhu",
    competitionId: "tianmuhu-futsal-league",
    competitionName: "天目湖五人制联赛",
    dateLabel: "演示日期",
    venue: "天目湖校区足球场（演示）",
    homeTeam: "演示球队 A",
    awayTeam: "演示球队 B",
    homeScore: 3,
    awayScore: 1,
    status: "completed",
    statusLabel: "已结束",
    stageLabel: "联赛阶段 · 演示",
    roundLabel: "演示轮次",
    detailHref: "/competitions/schedule#demo-recent-result",
    dataStatus: "demo",
    badge: "演示赛果",
  },
  nextMatch: {
    ...sharedMetadata,
    id: "demo-next-match",
    campus: "tianmuhu",
    competitionId: "mens-intercollege-cup",
    competitionName: "男子足球院际杯",
    dateLabel: "演示日期",
    venue: "天目湖校区足球场（演示）",
    homeTeam: "演示球队 C",
    awayTeam: "演示球队 D",
    status: "upcoming",
    statusLabel: "下一场",
    stageLabel: "院际杯阶段 · 演示",
    roundLabel: "演示轮次",
    detailHref: "/competitions/schedule#demo-next-match",
    dataStatus: "demo",
    badge: "演示赛程",
  },
} as const;

export const recentMatches = [
  demoMatchCentre.recentResult,
  demoMatchCentre.nextMatch,
] as const satisfies readonly DemoMatch[];

export const demoStandings = [
  {
    position: 1,
    team: "演示球队 A",
    played: 3,
    won: 2,
    drawn: 1,
    lost: 0,
    goalDifference: 4,
    points: 7,
    dataStatus: "demo",
    badge: "演示榜单",
  },
  {
    position: 2,
    team: "演示球队 B",
    played: 3,
    won: 2,
    drawn: 0,
    lost: 1,
    goalDifference: 2,
    points: 6,
    dataStatus: "demo",
    badge: "演示榜单",
  },
  {
    position: 3,
    team: "演示球队 C",
    played: 3,
    won: 1,
    drawn: 0,
    lost: 2,
    goalDifference: -1,
    points: 3,
    dataStatus: "demo",
    badge: "演示榜单",
  },
  {
    position: 4,
    team: "演示球队 D",
    played: 3,
    won: 0,
    drawn: 1,
    lost: 2,
    goalDifference: -5,
    points: 1,
    dataStatus: "demo",
    badge: "演示榜单",
  },
] as const satisfies readonly DemoStanding[];

export const demoScorers = [
  {
    position: 1,
    player: "演示球员 01",
    team: "演示球队 A",
    goals: 4,
    dataStatus: "demo",
    badge: "演示榜单",
  },
  {
    position: 2,
    player: "演示球员 02",
    team: "演示球队 B",
    goals: 3,
    dataStatus: "demo",
    badge: "演示榜单",
  },
  {
    position: 3,
    player: "演示球员 03",
    team: "演示球队 C",
    goals: 2,
    dataStatus: "demo",
    badge: "演示榜单",
  },
] as const satisfies readonly DemoScorer[];
