import mensMatches from "@/data/archives/2026-mens-intercollege-cup/matches.json";
import womensArchive from "@/data/archives/2026-womens-intercollege-cup/womens-cup-2026.json";
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

export const publicCompetitions: readonly PublicCompetitionRecord[] = [
  {
    id: "freshman-cup",
    slug: "freshman-cup",
    name: "南京航空航天大学新生杯足球赛",
    year: null,
    season: "上半学年",
    campus: "天目湖校区 / 将军路校区",
    type: "跨校区院系赛事",
    format: "eleven-a-side",
    formatLabel: "十一人制",
    status: "preparing",
    statusLabel: "筹备中",
    registrationWindow: "待赛事通知确认",
    matchWindow: "日期待定",
    venue: "待赛事通知确认",
    host: "待赛事通知确认",
    organizer: "待赛事通知确认",
    scale: "参赛规模待赛事通知确认",
    summary: "面向新生的院系足球赛事，跨校区阶段以对应赛事通知为准。",
    requirements: ["面向新生", "院系组队", "淘汰赛阶段跨校区主客场"],
    filesHref: "/competitions/files#notices",
    notice: "天目湖与将军路相关足球组织分别开展工作，并在新生杯淘汰赛阶段产生交集。",
    detailHref: "/competitions/cross-campus",
  },
  {
    id: "tianmuhu-futsal-league",
    slug: "tianmuhu-futsal-league",
    name: "南京航空航天大学天目湖五人制联赛",
    year: null,
    season: "上半学年",
    campus: "天目湖校区",
    type: "校区联赛",
    format: "futsal",
    formatLabel: "五人制",
    status: "preparing",
    statusLabel: "筹备中",
    registrationWindow: "待赛事通知确认",
    matchWindow: "日期待定",
    venue: "待赛事通知确认",
    host: "待赛事通知确认",
    organizer: "南京航空航天大学天目湖学生足球协会",
    scale: "参赛规模待赛事通知确认",
    summary: "天目湖校区五人制联赛，下一赛季安排尚未公布。",
    requirements: ["自由组队", "通过足球中国完成注册", "具体要求以赛事通知为准"],
    filesHref: "/competitions/files#regulations",
    notice: "下一赛季报名日期、场地与队伍要求尚未公布。",
    detailHref: "/competitions/current#tianmuhu-futsal-league",
  },
  {
    id: "2026-mens-intercollege-cup",
    slug: "2026-mens-intercollege-cup",
    name: "2026年南京航空航天大学男子足球院际杯",
    year: 2026,
    season: "下半学年",
    campus: "天目湖校区",
    type: "男子院系赛事",
    format: "eleven-a-side",
    formatLabel: "十一人制",
    status: "completed",
    statusLabel: "已结束",
    registrationWindow: "已结束",
    matchWindow: "2026.03.20 - 2026.05.17",
    venue: "天目湖校区西操场",
    host: "南京航空航天大学体育部等单位",
    organizer: "南京航空航天大学天目湖学生足球协会",
    scale: "8支球队 / 169名注册球员 / 16场比赛",
    summary: "2026年男子院系十一人制赛事，完整赛果、积分、名单与裁判选派均已归档。",
    requirements: ["8支球队", "169名注册球员", "16场比赛"],
    filesHref: "/competitions/files#guidebooks",
    notice: "完整赛程、积分榜、射手与纪律数据已归档。",
    detailHref: "/competitions/2026-mens-intercollege-cup",
  },
  {
    id: "2026-womens-intercollege-cup",
    slug: "2026-womens-intercollege-cup",
    name: womensArchive.competition.name,
    year: 2026,
    season: "下半学年",
    campus: womensArchive.competition.campus,
    type: "女子院系赛事",
    format: "futsal",
    formatLabel: "五人制",
    status: "completed",
    statusLabel: "已结束",
    registrationWindow: "2026.04.12 01:00 - 2026.04.13 14:49",
    matchWindow: "2026.04.14 - 2026.05.30",
    venue: womensArchive.competition.venue,
    host: "待赛事资料进一步确认",
    organizer: "南京航空航天大学天目湖学生足球协会",
    scale: "3支球队 / 24名注册球员 / 8场比赛",
    summary: "2026年天目湖校区女子五人制院系赛事，完整赛果、积分、名单与已核验选派均已归档。",
    requirements: ["3支球队", "24名注册球员", "8场比赛"],
    filesHref: "/competitions/files#notices",
    notice: "完整赛果、积分榜与已核验裁判选派已归档。",
    detailHref: "/competitions/2026-womens-intercollege-cup",
  },
] as const;

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
