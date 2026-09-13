import { randomBytes } from "node:crypto";

import type {
  CompetitionFormat,
  CompetitionStatus,
} from "@/generated/prisma-v29/client";
import type { CompetitionMutationInput } from "@/lib/referee-competition-input";
import { prisma } from "@/lib/prisma";
import type { AdminActor } from "@/lib/referee-service";
import { RefereeServiceError } from "@/lib/referee-service-error";

type CompetitionInput = {
  slug?: string;
  name: string;
  year?: number | null;
  campus?: string;
  format: CompetitionFormat;
  status: CompetitionStatus;
} & Partial<Omit<CompetitionMutationInput, "name" | "year" | "campus" | "format" | "status">>;

const publicProfileFields = [
  "name",
  "year",
  "campus",
  "format",
  "status",
  "shortName",
  "semesterLabel",
  "teamFormation",
  "publicPublished",
  "homepageFeatured",
  "publicOrder",
  "registrationStartAt",
  "registrationEndAt",
  "matchStartAt",
  "matchEndAt",
  "venue",
  "host",
  "organizer",
  "summary",
  "notice",
  "registrationUrl",
] as const;

function manualCompetitionSlug(year?: number | null) {
  return `manual-${year ?? "competition"}-${randomBytes(6).toString("hex")}`;
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function dateValue(value: unknown) {
  return value instanceof Date ? value.getTime() : value;
}

function changedFields(existing: Record<string, unknown>, updated: Record<string, unknown>) {
  return publicProfileFields.filter((field) => dateValue(existing[field]) !== dateValue(updated[field]));
}

export async function createCompetition(input: CompetitionInput, actor: AdminActor) {
  const slug = input.slug ?? manualCompetitionSlug(input.year);
  try {
    return await prisma.$transaction(async (tx) => {
      const competition = await tx.competition.create({
        data: {
          slug,
          name: input.name,
          shortName: input.shortName ?? null,
          year: input.year ?? null,
          campus: input.campus ?? "天目湖校区",
          format: input.format,
          status: input.status,
          semesterLabel: input.semesterLabel ?? null,
          teamFormation: input.teamFormation ?? null,
          publicPublished: input.publicPublished ?? false,
          homepageFeatured: input.homepageFeatured ?? false,
          publicOrder: input.publicOrder ?? 0,
          registrationStartAt: input.registrationStartAt ?? null,
          registrationEndAt: input.registrationEndAt ?? null,
          matchStartAt: input.matchStartAt ?? null,
          matchEndAt: input.matchEndAt ?? null,
          venue: input.venue ?? null,
          host: input.host ?? null,
          organizer: input.organizer ?? null,
          summary: input.summary ?? null,
          notice: input.notice ?? null,
          registrationUrl: input.registrationUrl ?? null,
          source: "MANUAL",
        },
      });
      await tx.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorId: actor.id,
          action: "COMPETITION_CREATED",
          entityType: "Competition",
          entityId: competition.id,
          summary: `创建赛事 ${competition.name}`,
          metadata: JSON.stringify({
            slug: competition.slug,
            source: competition.source,
            status: competition.status,
            publicPublished: competition.publicPublished,
            homepageFeatured: competition.homepageFeatured,
            changedFields: ["slug", ...publicProfileFields],
          }),
        },
      });
      return competition;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new RefereeServiceError("赛事 Slug 已存在，请使用另一个稳定标识。", 409);
    }
    throw error;
  }
}

export async function updateCompetition(id: string, input: CompetitionInput, actor: AdminActor) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.competition.findUnique({
      where: { id },
      include: { _count: { select: { matches: true } } },
    });
    if (!existing) throw new RefereeServiceError("赛事不存在。", 404);
    if (existing.format !== input.format && existing._count.matches > 0) {
      throw new RefereeServiceError("已有比赛的赛事不能直接更改比赛制式。", 409);
    }
    const data = {
      name: input.name,
      shortName: input.shortName === undefined ? existing.shortName : input.shortName,
      year: input.year === undefined ? existing.year : input.year,
      campus: input.campus ?? existing.campus,
      format: input.format,
      status: input.status,
      semesterLabel: input.semesterLabel === undefined ? existing.semesterLabel : input.semesterLabel,
      teamFormation: input.teamFormation === undefined ? existing.teamFormation : input.teamFormation,
      publicPublished: input.publicPublished ?? existing.publicPublished,
      homepageFeatured: input.homepageFeatured ?? existing.homepageFeatured,
      publicOrder: input.publicOrder ?? existing.publicOrder,
      registrationStartAt: input.registrationStartAt === undefined ? existing.registrationStartAt : input.registrationStartAt,
      registrationEndAt: input.registrationEndAt === undefined ? existing.registrationEndAt : input.registrationEndAt,
      matchStartAt: input.matchStartAt === undefined ? existing.matchStartAt : input.matchStartAt,
      matchEndAt: input.matchEndAt === undefined ? existing.matchEndAt : input.matchEndAt,
      venue: input.venue === undefined ? existing.venue : input.venue,
      host: input.host === undefined ? existing.host : input.host,
      organizer: input.organizer === undefined ? existing.organizer : input.organizer,
      summary: input.summary === undefined ? existing.summary : input.summary,
      notice: input.notice === undefined ? existing.notice : input.notice,
      registrationUrl: input.registrationUrl === undefined ? existing.registrationUrl : input.registrationUrl,
    };
    const fields = changedFields(existing, data);
    const competition = await tx.competition.update({ where: { id }, data });
    await tx.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorId: actor.id,
        action: "COMPETITION_UPDATED",
        entityType: "Competition",
        entityId: competition.id,
        summary: `更新赛事 ${competition.name}`,
        metadata: JSON.stringify({
          changedFields: fields,
          ...(existing.status !== competition.status
            ? { statusChange: { from: existing.status, to: competition.status } }
            : {}),
          ...(existing.publicPublished !== competition.publicPublished
            ? { publicPublishedChange: { from: existing.publicPublished, to: competition.publicPublished } }
            : {}),
          ...(existing.homepageFeatured !== competition.homepageFeatured
            ? { homepageFeaturedChange: { from: existing.homepageFeatured, to: competition.homepageFeatured } }
            : {}),
        }),
      },
    });
    return competition;
  });
}
