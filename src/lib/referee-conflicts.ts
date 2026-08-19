import type { AppointmentPositionKey, Prisma } from "@/generated/prisma-v29/client";
import { prisma } from "@/lib/prisma";

export type AppointmentWarningCode =
  | "COLLEGE_CONFLICT"
  | "UNAVAILABLE"
  | "MATCH_OVERLAP"
  | "ADJACENT_MATCH";

export type AppointmentWarning = {
  code: AppointmentWarningCode;
  refereeId: string;
  refereeName: string;
  message: string;
  overridable: boolean;
  details: Record<string, string | number | null>;
};

export type ConflictPositionInput = {
  key: AppointmentPositionKey;
  refereeId: string | null;
};

type ConflictDb = Prisma.TransactionClient | typeof prisma;

function intervalsOverlap(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
) {
  if (firstStart.getTime() === firstEnd.getTime()) {
    return firstStart >= secondStart && firstStart <= secondEnd;
  }
  if (secondStart.getTime() === secondEnd.getTime()) {
    return secondStart >= firstStart && secondStart <= firstEnd;
  }
  return firstStart < secondEnd && firstEnd > secondStart;
}

export async function detectAppointmentWarnings(
  matchId: string,
  positions: ConflictPositionInput[],
  db: ConflictDb = prisma,
): Promise<AppointmentWarning[]> {
  const refereeIds = [...new Set(positions.flatMap((item) => item.refereeId ? [item.refereeId] : []))];
  if (!refereeIds.length) return [];

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      kickoff: true,
      endAt: true,
      homeTeam: {
        select: { affiliations: { select: { collegeId: true, college: { select: { name: true } } } } },
      },
      awayTeam: {
        select: { affiliations: { select: { collegeId: true, college: { select: { name: true } } } } },
      },
    },
  });
  if (!match) return [];

  const [referees, existingAssignments] = await Promise.all([
    db.referee.findMany({
      where: { id: { in: refereeIds } },
      select: {
        id: true,
        name: true,
        collegeId: true,
        college: { select: { name: true } },
        availability: {
          where: { kind: "UNAVAILABLE", startAt: { lte: match.endAt ?? match.kickoff }, endAt: { gte: match.kickoff } },
          select: { id: true, startAt: true, endAt: true, note: true },
        },
      },
    }),
    db.appointmentPosition.findMany({
      where: {
        refereeId: { in: refereeIds },
        appointment: {
          status: { in: ["PUBLISHED", "COMPLETED"] },
          matchId: { not: matchId },
          match: { status: { not: "CANCELLED" } },
        },
      },
      select: {
        refereeId: true,
        appointment: {
          select: {
            id: true,
            match: {
              select: {
                id: true,
                kickoff: true,
                endAt: true,
                homeTeam: { select: { name: true } },
                awayTeam: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const targetStart = match.kickoff;
  const targetEnd = match.endAt ?? match.kickoff;
  const teamColleges = new Map(
    [...match.homeTeam.affiliations, ...match.awayTeam.affiliations]
      .map((item) => [item.collegeId, item.college.name] as const),
  );
  const warnings: AppointmentWarning[] = [];

  for (const referee of referees) {
    if (referee.collegeId && teamColleges.has(referee.collegeId)) {
      warnings.push({
        code: "COLLEGE_CONFLICT",
        refereeId: referee.id,
        refereeName: referee.name,
        message: `⚠ 同院回避：${referee.name}与参赛球队同属${teamColleges.get(referee.collegeId)}。`,
        overridable: true,
        details: { collegeId: referee.collegeId, collegeName: referee.college?.name ?? null },
      });
    }

    for (const unavailable of referee.availability) {
      if (!intervalsOverlap(targetStart, targetEnd, unavailable.startAt, unavailable.endAt)) continue;
      warnings.push({
        code: "UNAVAILABLE",
        refereeId: referee.id,
        refereeName: referee.name,
        message: `⚠ 不可执裁：${referee.name}在本场时间段标记为不可执裁。`,
        overridable: true,
        details: {
          availabilityId: unavailable.id,
          startAt: unavailable.startAt.toISOString(),
          endAt: unavailable.endAt.toISOString(),
          note: unavailable.note,
        },
      });
    }

    const otherAssignments = existingAssignments.filter((item) => item.refereeId === referee.id);
    let nearestAdjacent: { gapMinutes: number; matchId: string; matchup: string } | null = null;
    for (const item of otherAssignments) {
      const other = item.appointment.match;
      const otherStart = other.kickoff;
      const otherEnd = other.endAt ?? other.kickoff;
      const matchup = `${other.homeTeam.name} vs ${other.awayTeam.name}`;
      if (intervalsOverlap(targetStart, targetEnd, otherStart, otherEnd)) {
        warnings.push({
          code: "MATCH_OVERLAP",
          refereeId: referee.id,
          refereeName: referee.name,
          message: `⚠ 时间重叠：${referee.name}已有任务 ${matchup}。`,
          overridable: true,
          details: {
            appointmentId: item.appointment.id,
            matchId: other.id,
            kickoff: otherStart.toISOString(),
            endAt: other.endAt?.toISOString() ?? null,
          },
        });
        continue;
      }
      const gapMs = otherEnd <= targetStart
        ? targetStart.getTime() - otherEnd.getTime()
        : otherStart.getTime() - targetEnd.getTime();
      const candidate = {
        gapMinutes: Math.max(0, Math.round(gapMs / 60_000)),
        matchId: other.id,
        matchup,
      };
      if (!nearestAdjacent || candidate.gapMinutes < nearestAdjacent.gapMinutes) {
        nearestAdjacent = candidate;
      }
    }
    if (nearestAdjacent) {
      warnings.push({
        code: "ADJACENT_MATCH",
        refereeId: referee.id,
        refereeName: referee.name,
        message: `相邻任务：${referee.name}距离 ${nearestAdjacent.matchup} ${nearestAdjacent.gapMinutes} 分钟。`,
        overridable: false,
        details: nearestAdjacent,
      });
    }
  }

  return warnings;
}

export function warningsRequiringOverride(warnings: AppointmentWarning[]) {
  return warnings.filter((warning) => warning.overridable);
}
