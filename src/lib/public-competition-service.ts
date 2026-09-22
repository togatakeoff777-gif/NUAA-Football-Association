import "server-only";

import type { CompetitionStatus, Prisma } from "@/generated/prisma-v29/client";
import { formatBeijingDateTime, formatBeijingWindow } from "@/lib/beijing-datetime";
import { prisma } from "@/lib/prisma";
import { isAllowedCompetitionRegistrationUrl } from "@/lib/referee-competition-input";
import type {
  CompetitionNextMatch,
  PublicCompetitionMatch,
  PublicCompetitionStatus,
  PublicCompetitionView,
} from "@/types/competition-center";

const publicCompetitionSelect = {
  id: true,
  slug: true,
  name: true,
  shortName: true,
  year: true,
  campus: true,
  format: true,
  playingFormat: true,
  status: true,
  semesterLabel: true,
  teamFormation: true,
  publicPublished: true,
  homepageFeatured: true,
  publicOrder: true,
  registrationStartAt: true,
  registrationEndAt: true,
  matchStartAt: true,
  matchEndAt: true,
  venue: true,
  host: true,
  organizer: true,
  summary: true,
  notice: true,
  registrationUrl: true,
  createdAt: true,
  teams: {
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, teamType: true },
  },
  matches: {
    where: { isTestData: false },
    orderBy: [{ kickoff: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      stage: true,
      round: true,
      kickoff: true,
      venue: true,
      status: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      appointment: {
        select: {
          id: true,
          status: true,
          positions: {
            orderBy: [{ sortOrder: "asc" }, { slot: "asc" }],
            select: {
              key: true,
              label: true,
              slot: true,
              referee: { select: { name: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CompetitionSelect;

type PublicCompetitionRow = Prisma.CompetitionGetPayload<{
  select: typeof publicCompetitionSelect;
}>;

const statusPresentation: Record<CompetitionStatus, {
  status: Exclude<PublicCompetitionStatus, "pending-confirmation">;
  statusLabel: string;
  badge: string;
  stageLabel: string;
  pendingSummary: string;
}> = {
  PREPARING: { status: "preparing", statusLabel: "筹备中", badge: "筹备工作已启动", stageLabel: "赛事筹备中", pendingSummary: "筹备工作已启动，赛程待正式发布。" },
  REGISTRATION: { status: "registration", statusLabel: "报名中", badge: "报名进行中", stageLabel: "报名进行中", pendingSummary: "报名进行中，赛程待正式发布。" },
  ONGOING: { status: "ongoing", statusLabel: "进行中", badge: "赛事进行中", stageLabel: "赛事进行中", pendingSummary: "当前暂无已正式发布的下一场比赛，请关注赛事公告。" },
  COMPLETED: { status: "completed", statusLabel: "已结束", badge: "赛事已结束", stageLabel: "赛事已结束", pendingSummary: "赛事已结束" },
};

const teamTypeLabels = { ORGANIZATION: "组织代表队", JOINT: "联合队", FREEFORM: "自由组队" } as const;
const matchStatusLabels = { SCHEDULED: "已安排", COMPLETED: "已完成", CANCELLED: "已取消" } as const;

function legacyPlayingFormat(format: PublicCompetitionRow["format"]) {
  if (format === "ELEVEN_A_SIDE") return "十一人制";
  if (format === "FUTSAL") return "五人制";
  return "自定义制式";
}

function publicMatch(match: PublicCompetitionRow["matches"][number]): PublicCompetitionMatch {
  const kickoff = formatBeijingDateTime(match.kickoff);
  const appointment = match.appointment && ["PUBLISHED", "COMPLETED"].includes(match.appointment.status)
    ? {
        id: match.appointment.id,
        positions: match.appointment.positions.flatMap((position) => position.referee
          ? [{ key: `${position.key}-${position.slot}`, label: `${position.label}${position.slot > 1 ? ` ${position.slot}` : ""}`, refereeName: position.referee.name }]
          : []),
      }
    : null;
  return {
    id: match.id,
    slug: match.slug,
    stage: match.stage,
    round: match.round,
    kickoff: match.kickoff,
    dateLabel: kickoff.dateLabel,
    timeLabel: kickoff.timeLabel,
    venue: match.venue,
    status: match.status.toLowerCase() as PublicCompetitionMatch["status"],
    statusLabel: matchStatusLabels[match.status],
    homeTeam: { id: match.homeTeam.id, name: match.homeTeam.name },
    awayTeam: { id: match.awayTeam.id, name: match.awayTeam.name },
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    appointment,
  };
}

export function selectCompetitionNextMatch(
  matches: readonly PublicCompetitionMatch[],
  status: CompetitionStatus,
  fallbackVenue: string | null,
  detailHref: string,
  now = new Date(),
): CompetitionNextMatch {
  if (status === "COMPLETED") return { state: "completed", label: "赛事已结束", summary: "赛事已结束", archiveHref: detailHref };
  const match = matches.find((item) => item.status === "scheduled" && item.kickoff > now);
  if (match) {
    return {
      state: "scheduled",
      label: "下一场",
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      dateLabel: match.dateLabel,
      timeLabel: match.timeLabel,
      venue: match.venue,
      detailHref: `${detailHref}#match-${match.id}`,
    };
  }
  return { state: "pending", label: "赛程待发布", summary: statusPresentation[status].pendingSummary, dateLabel: "待正式发布", venue: fallbackVenue ?? "待正式确认" };
}

function databaseView(row: PublicCompetitionRow, now = new Date()): PublicCompetitionView {
  const presentation = statusPresentation[row.status];
  const detailHref = `/competitions/${row.slug}`;
  const matches = row.matches.map(publicMatch);
  return {
    id: row.id,
    currentEditionId: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName ?? row.name,
    currentEdition: row.year ? String(row.year) : "届次待确认",
    year: row.year,
    season: row.year ? `${row.year} 赛季` : "赛季待确认",
    semesterLabel: row.semesterLabel ?? "学期待确认",
    campus: row.campus,
    eventType: "公开赛事",
    formatLabel: row.playingFormat?.trim() || legacyPlayingFormat(row.format),
    teamFormation: row.teamFormation ?? "组队方式待确认",
    status: presentation.status,
    statusLabel: presentation.statusLabel,
    badge: presentation.badge,
    stageLabel: presentation.stageLabel,
    registrationWindow: formatBeijingWindow(row.registrationStartAt, row.registrationEndAt, "待正式通知"),
    matchWindow: formatBeijingWindow(row.matchStartAt, row.matchEndAt, "待正式发布"),
    venue: row.venue ?? "待正式确认",
    host: row.host ?? "待正式通知",
    organizer: row.organizer ?? "待正式通知",
    scale: row.teams.length ? `${row.teams.length} 支球队` : "参赛规模待确认",
    summary: row.summary ?? "赛事公开简介尚未发布。",
    requirements: [],
    notice: row.notice ?? "赛事公告尚未发布。",
    registrationUrl: row.registrationUrl && isAllowedCompetitionRegistrationUrl(row.registrationUrl) ? row.registrationUrl : null,
    publicPublished: row.publicPublished,
    homepageFeatured: row.homepageFeatured,
    publicOrder: row.publicOrder,
    detailHref,
    filesHref: "/competitions/files",
    links: {
      overview: `${detailHref}#overview`, schedule: `${detailHref}#schedule`, results: `${detailHref}#schedule`, standings: `${detailHref}#standings`, knockout: `${detailHref}#standings`, teams: `${detailHref}#teams`, referees: `${detailHref}#officials`, files: "/competitions/files", news: `${detailHref}#reports`,
    },
    teams: row.teams.map((team) => ({ id: team.id, name: team.name, teamType: team.teamType, teamTypeLabel: teamTypeLabels[team.teamType] })),
    matches,
    nextMatch: selectCompetitionNextMatch(matches, row.status, row.venue, detailHref, now),
    dataOrigin: "database",
  };
}

async function loadPublishedCompetitions(homepageOnly = false) {
  return prisma.competition.findMany({
    where: { publicPublished: true, isTestData: false, ...(homepageOnly ? { homepageFeatured: true } : {}) },
    select: publicCompetitionSelect,
    orderBy: [{ publicOrder: "asc" }, { year: "desc" }, { createdAt: "asc" }, { id: "asc" }],
    ...(homepageOnly ? { take: 2 } : {}),
  });
}

export async function getPublicCompetitionCatalog(): Promise<PublicCompetitionView[]> {
  try {
    const now = new Date();
    return (await loadPublishedCompetitions()).map((row) => databaseView(row, now));
  } catch (error) {
    console.error("[public-competition] catalogue unavailable", { errorName: error instanceof Error ? error.name : "UnknownError" });
    return [];
  }
}

export const getCurrentPublicCompetitions = getPublicCompetitionCatalog;

export async function getPublicCompetition(slug: string): Promise<PublicCompetitionView | undefined> {
  try {
    const row = await prisma.competition.findFirst({ where: { slug, publicPublished: true, isTestData: false }, select: publicCompetitionSelect });
    return row ? databaseView(row) : undefined;
  } catch (error) {
    console.error("[public-competition] detail unavailable", { slug, errorName: error instanceof Error ? error.name : "UnknownError" });
    return undefined;
  }
}

export async function getHomepagePublicCompetitions(): Promise<PublicCompetitionView[]> {
  try {
    const now = new Date();
    return (await loadPublishedCompetitions(true)).map((row) => databaseView(row, now));
  } catch (error) {
    console.error("[public-competition] homepage selection unavailable", { errorName: error instanceof Error ? error.name : "UnknownError" });
    return [];
  }
}
