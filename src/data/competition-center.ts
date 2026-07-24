import mensMatches from "@/data/archives/2026-mens-intercollege-cup/matches.json";
import womensArchive from "@/data/archives/2026-womens-intercollege-cup/womens-cup-2026.json";
import { coreCompetitionDirectory } from "@/data/competition-directory";
import { disciplineDecisions } from "@/data/public-information";
import type {
  PublicCompetitionFile,
  PublicCompetitionRecord,
  PublicMatchRecord,
} from "@/types/competition-center";

export const publicCompetitionStatusLabels = {
  preparing: "筹备中",
  registration: "报名中",
  ongoing: "进行中",
  completed: "已结束",
  "pending-confirmation": "资料待确认",
} as const;

export const publicCompetitions: readonly PublicCompetitionRecord[] =
  coreCompetitionDirectory.map((competition) => ({
    id: competition.currentEditionId,
    slug: competition.slug,
    name: competition.name,
    year: competition.year,
    season: competition.season,
    campus: competition.campus,
    type: competition.eventType,
    format: competition.format,
    formatLabel: competition.formatLabel,
    status: competition.status,
    statusLabel: competition.statusLabel,
    registrationWindow: competition.registrationWindow,
    matchWindow: competition.matchWindow,
    venue: competition.venue,
    host: competition.host,
    organizer: competition.organizer,
    scale: competition.scale,
    summary: competition.summary,
    requirements: competition.requirements,
    filesHref: competition.filesHref,
    notice: competition.notice,
    detailHref: competition.detailHref,
  }));

function formatIsoDateTime(value: string) {
  const date = value.slice(0, 10);
  const time = value.slice(11, 16);
  return { dateLabel: date.replaceAll("-", "."), timeLabel: time };
}

const mensSchedule: PublicMatchRecord[] = mensMatches.map((match) => {
  const { dateLabel, timeLabel } = formatIsoDateTime(match.dateTime);
  const penaltyScore = "homePenaltyScore" in match && "awayPenaltyScore" in match
    ? `${match.homePenaltyScore}:${match.awayPenaltyScore}`
    : undefined;

  return {
    id: `mens-2026-${match.id}`,
    competitionId: "2026-mens-intercollege-cup",
    competitionName: "2026男子足球院际杯",
    competitionHref: "/competitions/2026-mens-intercollege-cup",
    stage: match.round,
    teamIds: [match.homeTeamId, match.awayTeamId],
    dateTime: match.dateTime,
    dateLabel,
    timeLabel,
    venue: match.venue,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    penaltyScore,
    status: "completed",
    statusLabel: "已结束",
    detailHref: `/competitions/2026-mens-intercollege-cup#match-${match.id}`,
    refereeHref: `/competitions/2026-mens-intercollege-cup#officials`,
  };
});

const womensTeamIds: Record<string, string> = {
  "人文外国语自动化联队": "humanities-languages-automation-united",
  "经济与管理学院": "economics-management-college",
  "致和-致慧-致元联队": "zhihe-zhihui-zhiyuan-united",
};

const womensSchedule: PublicMatchRecord[] = womensArchive.matches.map((match) => {
  const dateTime = `${match.kickoff.replace(" ", "T")}:00+08:00`;
  const { dateLabel, timeLabel } = formatIsoDateTime(dateTime);
  return {
    id: `womens-2026-${match.number}`,
    competitionId: "2026-womens-intercollege-cup",
    competitionName: "2026女子足球院际杯",
    competitionHref: "/competitions/2026-womens-intercollege-cup",
    stage: match.stage,
    teamIds: [womensTeamIds[match.home], womensTeamIds[match.away]],
    dateTime,
    dateLabel,
    timeLabel,
    venue: womensArchive.competition.venue,
    homeTeam: match.home,
    awayTeam: match.away,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    status: "completed",
    statusLabel: "已结束",
    detailHref: `/competitions/2026-womens-intercollege-cup#match-${match.number}`,
    refereeHref: `/competitions/2026-womens-intercollege-cup#officials`,
  };
});

export const publicMatchRecords = [...mensSchedule, ...womensSchedule]
  .sort((a, b) => b.dateTime.localeCompare(a.dateTime)) satisfies PublicMatchRecord[];

export const publicCompetitionFiles: readonly PublicCompetitionFile[] = [
  {
    id: "futsal-laws-2025-26",
    title: "五人制足球竞赛规则 2025/2026",
    category: "regulations",
    categoryLabel: "竞赛规则",
    fileType: "PDF",
    version: "2025/2026",
    publishedAt: "版本年份 2025/2026",
    scope: "五人制足球赛事",
    href: "/documents/rules/futsal/2025-26-fifa-futsal-laws-zh.pdf",
    source: "国际足联 / 中国足球协会审定",
  },
  {
    id: "football-laws-2025-26",
    title: "足球竞赛规则 2025/2026",
    category: "regulations",
    categoryLabel: "竞赛规则",
    fileType: "PDF",
    version: "2025/2026",
    publishedAt: "版本年份 2025/2026",
    scope: "十一人制足球赛事",
    href: "/documents/rules/football/2025-26-laws-of-the-game-zh.pdf",
    source: "国际足球协会理事会 / 中文版本",
  },
  {
    id: "football-laws-changes-2026-27",
    title: "《足球竞赛规则 2026/2027》变更及详解",
    category: "regulations",
    categoryLabel: "规则更新",
    fileType: "PDF",
    version: "2026/2027",
    publishedAt: "2026.06",
    scope: "十一人制足球赛事",
    href: "/documents/rules/football/2026-27-changes-explained-zh.pdf",
    source: "中国足球协会裁判委员会",
  },
  {
    id: "mens-2026-guidebook",
    title: "2026男子足球院际杯赛事秩序册",
    category: "guidebooks",
    categoryLabel: "赛事秩序册",
    fileType: "PDF",
    version: "2026.03",
    publishedAt: "2026.03",
    scope: "2026男子足球院际杯",
    href: "/documents/competitions/2026-mens-intercollege-cup/guidebook.pdf",
    source: "南京航空航天大学天目湖学生足球协会",
  },
  ...disciplineDecisions.map((decision) => ({
    id: decision.id,
    title: decision.title,
    category: "discipline" as const,
    categoryLabel: decision.category,
    fileType: decision.fileType,
    version: decision.version,
    publishedAt: decision.dateLabel,
    scope: decision.scope,
    href: decision.href,
    source: decision.source,
  })),
] as const;
