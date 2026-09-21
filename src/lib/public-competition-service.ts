import "server-only";

import type { CompetitionStatus, Prisma } from "@/generated/prisma-v29/client";
import { getCoreCompetition } from "@/data/competition-directory";
import { formatBeijingDateTime, formatBeijingWindow } from "@/lib/beijing-datetime";
import { prisma } from "@/lib/prisma";
import { isAllowedCompetitionRegistrationUrl } from "@/lib/referee-competition-input";
import type {
  CompetitionNextMatch,
  CoreCompetitionDirectoryEntry,
  PublicCompetitionStatus,
  PublicCompetitionView,
} from "@/types/competition-center";

const currentPublicCompetitionSlugs = [
  "freshman-cup",
  "tianmuhu-futsal-league",
] as const;

const publicCompetitionSelect = {
  id: true,
  slug: true,
  name: true,
  shortName: true,
  year: true,
  campus: true,
  format: true,
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
  matches: {
    where: {
      status: "SCHEDULED",
      isTestData: false,
      kickoff: { gte: new Date(0) },
    },
    orderBy: { kickoff: "asc" },
    take: 1,
    select: {
      slug: true,
      kickoff: true,
      venue: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
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
  PREPARING: {
    status: "preparing",
    statusLabel: "筹备中",
    badge: "筹备工作已启动",
    stageLabel: "赛事筹备中",
    pendingSummary: "筹备工作已启动，赛程待正式发布。",
  },
  REGISTRATION: {
    status: "registration",
    statusLabel: "报名中",
    badge: "报名进行中",
    stageLabel: "报名进行中",
    pendingSummary: "报名进行中，赛程待正式发布。",
  },
  ONGOING: {
    status: "ongoing",
    statusLabel: "进行中",
    badge: "赛事进行中",
    stageLabel: "赛事进行中",
    pendingSummary: "当前暂无已正式发布的下一场比赛，请关注赛事公告。",
  },
  COMPLETED: {
    status: "completed",
    statusLabel: "已结束",
    badge: "赛事已结束",
    stageLabel: "赛事已结束",
    pendingSummary: "赛事已结束",
  },
};

function staticFallback(staticCompetition: CoreCompetitionDirectoryEntry): PublicCompetitionView {
  return {
    ...staticCompetition,
    registrationUrl: null,
    publicPublished: false,
    homepageFeatured: true,
    publicOrder: currentPublicCompetitionSlugs.findIndex((slug) => slug === staticCompetition.slug),
    dataOrigin: "static-fallback",
  };
}

function nextMatch(row: PublicCompetitionRow, fallback: CoreCompetitionDirectoryEntry): CompetitionNextMatch {
  const presentation = statusPresentation[row.status];
  if (row.status === "COMPLETED") {
    return {
      state: "completed",
      label: "赛事已结束",
      summary: "赛事已结束",
      archiveHref: fallback.detailHref,
    };
  }
  const match = row.matches[0];
  if (match) {
    const kickoff = formatBeijingDateTime(match.kickoff);
    return {
      state: "scheduled",
      label: "下一场",
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      dateLabel: kickoff.dateLabel,
      timeLabel: kickoff.timeLabel,
      venue: match.venue,
      detailHref: `/referees/open-matches/${match.slug}`,
    };
  }
  return {
    state: "pending",
    label: "赛程待发布",
    summary: presentation.pendingSummary,
    dateLabel: "待正式发布",
    venue: row.venue ?? "待正式确认",
  };
}

function databaseView(
  row: PublicCompetitionRow,
  staticCompetition: CoreCompetitionDirectoryEntry,
): PublicCompetitionView {
  const presentation = statusPresentation[row.status];
  const format = row.format === "FUTSAL" ? "futsal" : "eleven-a-side";
  const formatLabel = row.format === "FUTSAL" ? "五人制" : "十一人制";
  return {
    ...staticCompetition,
    id: row.id,
    currentEditionId: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName ?? row.name,
    currentEdition: row.year ? String(row.year) : "届次待确认",
    year: row.year,
    semesterLabel: row.semesterLabel ?? "学期待确认",
    campus: row.campus,
    format,
    formatLabel,
    teamFormation: row.teamFormation ?? "待正式通知",
    status: presentation.status,
    statusLabel: presentation.statusLabel,
    badge: presentation.badge,
    stageLabel: presentation.stageLabel,
    nextMatch: nextMatch(row, staticCompetition),
    registrationWindow: formatBeijingWindow(
      row.registrationStartAt,
      row.registrationEndAt,
      "待正式通知",
    ),
    matchWindow: formatBeijingWindow(row.matchStartAt, row.matchEndAt, "待正式发布"),
    venue: row.venue ?? "待正式确认",
    host: row.host ?? "待正式通知",
    organizer: row.organizer ?? "待正式通知",
    summary: row.summary ?? "赛事公开简介待正式发布。",
    notice: row.notice ?? "赛事公告与具体安排待正式发布。",
    registrationUrl: row.registrationUrl && isAllowedCompetitionRegistrationUrl(row.registrationUrl)
      ? row.registrationUrl
      : null,
    publicPublished: row.publicPublished,
    homepageFeatured: row.homepageFeatured,
    publicOrder: row.publicOrder,
    dataOrigin: "database",
  };
}

async function loadPublishedCompetition(slug: string) {
  const now = new Date();
  return prisma.competition.findFirst({
    where: { slug, publicPublished: true, isTestData: false },
    select: {
      ...publicCompetitionSelect,
      matches: {
        ...publicCompetitionSelect.matches,
        where: {
          status: "SCHEDULED",
          isTestData: false,
          kickoff: { gte: now },
        },
      },
    },
  });
}

export async function getPublicCompetition(slug: string): Promise<PublicCompetitionView | undefined> {
  const staticCompetition = getCoreCompetition(slug);
  if (!staticCompetition) return undefined;
  try {
    const row = await loadPublishedCompetition(slug);
    return row ? databaseView(row, staticCompetition) : staticFallback(staticCompetition);
  } catch (error) {
    console.error("[public-competition] dynamic profile unavailable; using static fallback", {
      slug,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return staticFallback(staticCompetition);
  }
}

export async function getCurrentPublicCompetitions() {
  const competitions = await Promise.all(
    currentPublicCompetitionSlugs.map((slug) => getPublicCompetition(slug)),
  );
  return competitions.filter((competition): competition is PublicCompetitionView => Boolean(competition));
}

export async function getHomepagePublicCompetitions() {
  const competitions = await getCurrentPublicCompetitions();
  return competitions
    .map((competition) => {
      if (competition.dataOrigin === "database" && competition.homepageFeatured) {
        return competition;
      }
      const fallback = getCoreCompetition(competition.slug);
      return fallback ? staticFallback(fallback) : undefined;
    })
    .filter((competition): competition is PublicCompetitionView => Boolean(competition))
    .sort((left, right) => left.publicOrder - right.publicOrder);
}
