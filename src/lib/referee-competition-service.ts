import { randomBytes } from "node:crypto";

import type {
  CompetitionFormat,
  CompetitionStatus,
} from "@/generated/prisma-v29/client";
import { prisma } from "@/lib/prisma";
import type { AdminActor } from "@/lib/referee-service";
import { RefereeServiceError } from "@/lib/referee-service-error";

type CompetitionInput = {
  name: string;
  year?: number;
  format: CompetitionFormat;
  status: CompetitionStatus;
};

function manualCompetitionSlug(year?: number) {
  return `manual-${year ?? "competition"}-${randomBytes(6).toString("hex")}`;
}

export async function createCompetition(input: CompetitionInput, actor: AdminActor) {
  return prisma.$transaction(async (tx) => {
    const competition = await tx.competition.create({
      data: {
        slug: manualCompetitionSlug(input.year),
        name: input.name,
        year: input.year ?? null,
        campus: "天目湖校区",
        format: input.format,
        status: input.status,
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
          format: competition.format,
          status: competition.status,
          source: competition.source,
        }),
      },
    });
    return competition;
  });
}

export async function updateCompetition(
  id: string,
  input: CompetitionInput,
  actor: AdminActor,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.competition.findUnique({
      where: { id },
      select: { id: true, name: true, format: true, _count: { select: { matches: true } } },
    });
    if (!existing) throw new RefereeServiceError("赛事不存在。", 404);
    if (existing.format !== input.format && existing._count.matches > 0) {
      throw new RefereeServiceError("已有比赛的赛事不能直接更改比赛制式。", 409);
    }
    const competition = await tx.competition.update({
      where: { id },
      data: {
        name: input.name,
        year: input.year ?? null,
        format: input.format,
        status: input.status,
      },
    });
    await tx.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorId: actor.id,
        action: "COMPETITION_UPDATED",
        entityType: "Competition",
        entityId: competition.id,
        summary: `更新赛事 ${competition.name}`,
        metadata: JSON.stringify({
          previousName: existing.name,
          format: competition.format,
          status: competition.status,
        }),
      },
    });
    return competition;
  });
}
