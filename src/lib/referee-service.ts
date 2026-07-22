import type { AppointmentPositionKey, ApplicationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPositionTemplate } from "@/lib/referee-roles";

export class RefereeServiceError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function createRefereeApplication(input: {
  matchId: string;
  refereeId: string;
  preferredPositions: AppointmentPositionKey[];
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: input.matchId },
      include: { competition: true },
    });
    if (!match) throw new RefereeServiceError("比赛不存在。", 404);
    if (match.status !== "SCHEDULED" || match.applicationWindowStatus !== "OPEN") {
      throw new RefereeServiceError("该场比赛当前不接受执裁意向。", 409);
    }
    if (!match.applicationDeadline || match.applicationDeadline <= new Date()) {
      throw new RefereeServiceError("该场比赛的报名时间已截止。", 409);
    }

    const referee = await tx.referee.findUnique({ where: { id: input.refereeId } });
    if (!referee || referee.status !== "ACTIVE") {
      throw new RefereeServiceError("裁判员名录记录不存在或当前不可报名。", 404);
    }
    const supportsFormat =
      match.competition.format === "ELEVEN_A_SIDE" ? referee.elevenASide : referee.futsal;
    if (!supportsFormat) throw new RefereeServiceError("该裁判员未登记为本项目可执裁人员。", 409);

    const allowed = new Set(getPositionTemplate(match.competition.format).map((item) => item.key));
    const preferred = [...new Set(input.preferredPositions)];
    if (!preferred.length || preferred.some((key) => !allowed.has(key))) {
      throw new RefereeServiceError("请至少选择一个符合本场赛制的意向岗位。" );
    }
    const duplicate = await tx.refereeApplication.findUnique({
      where: { matchId_refereeId: { matchId: match.id, refereeId: referee.id } },
    });
    if (duplicate) throw new RefereeServiceError("该裁判员已经报名本场比赛，请勿重复提交。", 409);

    return tx.refereeApplication.create({
      data: {
        matchId: match.id,
        refereeId: referee.id,
        preferredPositions: JSON.stringify(preferred),
        note: input.note || null,
      },
    });
  });
}

export async function reviewApplication(id: string, status: ApplicationStatus, reviewNote: string) {
  const existing = await prisma.refereeApplication.findUnique({ where: { id } });
  if (!existing) throw new RefereeServiceError("报名记录不存在。", 404);
  return prisma.refereeApplication.update({
    where: { id },
    data: { status, reviewNote: reviewNote || null, reviewedAt: new Date() },
  });
}

export async function saveAppointmentDraft(input: {
  matchId: string;
  publicationNote: string;
  positions: { key: AppointmentPositionKey; refereeId: string | null }[];
}) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: input.matchId },
      include: { competition: true },
    });
    if (!match) throw new RefereeServiceError("比赛不存在。", 404);
    const template = getPositionTemplate(match.competition.format);
    const allowed = new Map(template.map((item) => [item.key, item]));
    const keys = input.positions.map((item) => item.key);
    if (new Set(keys).size !== keys.length || keys.some((key) => !allowed.has(key))) {
      throw new RefereeServiceError("岗位配置包含重复或不适用于本场赛制的岗位。" );
    }

    const refereeIds = input.positions.flatMap((item) => item.refereeId ? [item.refereeId] : []);
    if (new Set(refereeIds).size !== refereeIds.length) {
      throw new RefereeServiceError("同一裁判员不能在同一场比赛承担多个岗位。" );
    }
    if (refereeIds.length) {
      const referees = await tx.referee.findMany({ where: { id: { in: refereeIds }, status: "ACTIVE" } });
      if (referees.length !== refereeIds.length) throw new RefereeServiceError("岗位中包含无效裁判员。" );
      const incompatible = referees.some((referee) =>
        match.competition.format === "ELEVEN_A_SIDE" ? !referee.elevenASide : !referee.futsal,
      );
      if (incompatible) throw new RefereeServiceError("岗位中包含未登记为本项目可执裁的人员。" );
    }

    const appointment = await tx.refereeAppointment.upsert({
      where: { matchId: match.id },
      update: { status: "DRAFT", publicationNote: input.publicationNote || null, withdrawnAt: null },
      create: { matchId: match.id, status: "DRAFT", publicationNote: input.publicationNote || null },
    });
    await tx.appointmentPosition.deleteMany({ where: { appointmentId: appointment.id } });
    if (input.positions.length) {
      await tx.appointmentPosition.createMany({
        data: input.positions.map((item) => {
          const definition = allowed.get(item.key)!;
          return {
            appointmentId: appointment.id,
            refereeId: item.refereeId,
            key: item.key,
            label: definition.label,
            sortOrder: definition.order,
          };
        }),
      });
    }
    return tx.refereeAppointment.findUniqueOrThrow({
      where: { id: appointment.id }, include: { positions: true },
    });
  });
}

export async function publishAppointment(matchId: string) {
  const appointment = await prisma.refereeAppointment.findUnique({
    where: { matchId }, include: { positions: true },
  });
  if (!appointment) throw new RefereeServiceError("请先保存选派草稿。", 409);
  if (!appointment.positions.length || appointment.positions.some((item) => !item.refereeId)) {
    throw new RefereeServiceError("发布前须为所有已启用岗位分配裁判员。", 409);
  }
  return prisma.refereeAppointment.update({
    where: { id: appointment.id },
    data: { status: "PUBLISHED", publishedAt: new Date(), withdrawnAt: null },
  });
}

export async function withdrawAppointment(matchId: string) {
  const appointment = await prisma.refereeAppointment.findUnique({ where: { matchId } });
  if (!appointment || appointment.status !== "PUBLISHED") {
    throw new RefereeServiceError("当前没有可撤回的已发布选派。", 409);
  }
  return prisma.refereeAppointment.update({
    where: { id: appointment.id },
    data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  });
}
