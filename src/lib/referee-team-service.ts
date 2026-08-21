import type { Prisma } from "@/generated/prisma-v29/client";
import { prisma } from "@/lib/prisma";
import { RefereeServiceError } from "@/lib/referee-service-error";

type TeamServiceDb = Prisma.TransactionClient | typeof prisma;

export async function ensureOrganizationTeam(
  db: TeamServiceDb,
  input: { competitionId: string; unitId: string },
) {
  const unit = await db.affiliationUnit.findUnique({
    where: { id: input.unitId },
    select: { id: true, name: true, legacyCollegeId: true },
  });
  if (!unit) throw new RefereeServiceError("组织单位不存在。", 404);

  const existing = await db.team.findUnique({
    where: {
      competitionId_name: {
        competitionId: input.competitionId,
        name: unit.name,
      },
    },
    include: {
      unitAffiliations: { select: { unitId: true } },
      affiliations: { select: { collegeId: true } },
    },
  });
  if (existing) {
    const linkedUnitIds = existing.unitAffiliations.map((item) => item.unitId);
    const linkedCollegeIds = existing.affiliations.map((item) => item.collegeId);
    if (
      (linkedUnitIds.length > 0 && (linkedUnitIds.length !== 1 || linkedUnitIds[0] !== unit.id))
      || linkedCollegeIds.some((collegeId) => collegeId !== unit.legacyCollegeId)
    ) {
      throw new RefereeServiceError(`球队名称“${unit.name}”已被其他组织关系使用。`, 409);
    }
    await db.team.update({
      where: { id: existing.id },
      data: { teamType: "ORGANIZATION" },
    });
    await db.teamUnitAffiliation.upsert({
      where: { teamId_unitId: { teamId: existing.id, unitId: unit.id } },
      update: {},
      create: { teamId: existing.id, unitId: unit.id },
    });
    if (unit.legacyCollegeId) {
      await db.teamAffiliation.upsert({
        where: {
          teamId_collegeId: {
            teamId: existing.id,
            collegeId: unit.legacyCollegeId,
          },
        },
        update: {},
        create: { teamId: existing.id, collegeId: unit.legacyCollegeId },
      });
    }
    return { team: existing, created: false };
  }

  const team = await db.team.create({
    data: {
      competitionId: input.competitionId,
      name: unit.name,
      teamType: "ORGANIZATION",
      source: "MANUAL",
      unitAffiliations: { create: { unitId: unit.id } },
      affiliations: unit.legacyCollegeId
        ? { create: { collegeId: unit.legacyCollegeId } }
        : undefined,
    },
  });
  return { team, created: true };
}

export async function resolveCompetitionTeamSelection(
  db: TeamServiceDb,
  input: { competitionId: string; selection: string },
) {
  const [kind, id, ...rest] = input.selection.split(":");
  if (!id || rest.length || (kind !== "team" && kind !== "unit")) {
    throw new RefereeServiceError("参赛球队选择无效。");
  }
  if (kind === "unit") {
    return ensureOrganizationTeam(db, { competitionId: input.competitionId, unitId: id });
  }
  const team = await db.team.findFirst({
    where: { id, competitionId: input.competitionId },
  });
  if (!team) throw new RefereeServiceError("比赛球队不属于所选赛事。");
  return { team, created: false };
}
