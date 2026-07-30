import type {
  AppointmentPositionKey,
  ApplicationStatus,
  CompetitionFormat,
  MatchStatus,
  RefereeStatus,
  TrainingStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPositionTemplate } from "@/lib/referee-roles";
import { hashPassword, verifyPassword } from "@/lib/referee-security";

export class RefereeServiceError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function writeAudit(input: {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  actorType?: "ADMIN" | "REFEREE" | "SYSTEM";
  actorId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      actorType: input.actorType ?? "ADMIN",
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

export async function createRefereeAccount(input: {
  publicCode: string;
  name: string;
  initialPassword: string;
  status: RefereeStatus;
  elevenASide: boolean;
  futsal: boolean;
  certificateNote?: string;
  trainingStatus: TrainingStatus;
  publicDirectoryEnabled: boolean;
  publicBio?: string;
  internalNote?: string;
}) {
  const passwordHash = await hashPassword(input.initialPassword);
  try {
    const referee = await prisma.referee.create({
      data: {
        publicCode: input.publicCode,
        name: input.name,
        passwordHash,
        mustChangePassword: true,
        status: input.status,
        elevenASide: input.elevenASide,
        futsal: input.futsal,
        certificateNote: input.certificateNote || null,
        trainingStatus: input.trainingStatus,
        publicDirectoryEnabled: input.publicDirectoryEnabled,
        publicBio: input.publicBio || null,
        internalNote: input.internalNote || null,
      },
    });
    await writeAudit({
      action: "REFEREE_ACCOUNT_CREATED",
      entityType: "Referee",
      entityId: referee.id,
      summary: `创建裁判员账号 ${referee.publicCode}`,
    });
    return referee;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      throw new RefereeServiceError("裁判员编号已存在。", 409);
    }
    throw error;
  }
}

export async function updateRefereeAccount(
  id: string,
  input: {
    publicCode: string;
    name: string;
    status: RefereeStatus;
    elevenASide: boolean;
    futsal: boolean;
    certificateNote?: string;
    trainingStatus: TrainingStatus;
    publicDirectoryEnabled: boolean;
    publicBio?: string;
    internalNote?: string;
  },
) {
  const existing = await prisma.referee.findUnique({ where: { id } });
  if (!existing) throw new RefereeServiceError("裁判员账号不存在。", 404);
  let referee;
  try {
    referee = await prisma.referee.update({
      where: { id },
      data: {
        publicCode: input.publicCode,
        name: input.name,
        status: input.status,
        elevenASide: input.elevenASide,
        futsal: input.futsal,
        certificateNote: input.certificateNote || null,
        trainingStatus: input.trainingStatus,
        publicDirectoryEnabled: input.publicDirectoryEnabled,
        publicBio: input.publicBio || null,
        internalNote: input.internalNote || null,
        ...(input.status === "ACTIVE" ? {} : { sessions: { deleteMany: {} } }),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      throw new RefereeServiceError("裁判员编号已存在。", 409);
    }
    throw error;
  }
  await writeAudit({
    action: "REFEREE_ACCOUNT_UPDATED",
    entityType: "Referee",
    entityId: referee.id,
    summary: `更新裁判员账号 ${referee.publicCode}（${referee.status}）`,
  });
  return referee;
}

export async function resetRefereePassword(id: string, initialPassword: string) {
  const referee = await prisma.referee.findUnique({ where: { id } });
  if (!referee) throw new RefereeServiceError("裁判员账号不存在。", 404);
  const passwordHash = await hashPassword(initialPassword);
  await prisma.$transaction([
    prisma.referee.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true, passwordChangedAt: new Date() },
    }),
    prisma.refereeSession.deleteMany({ where: { refereeId: id } }),
  ]);
  await writeAudit({
    action: "REFEREE_PASSWORD_RESET",
    entityType: "Referee",
    entityId: id,
    summary: `重置裁判员账号 ${referee.publicCode} 的密码`,
  });
}

export async function changeRefereePassword(
  refereeId: string,
  currentPassword: string,
  newPassword: string,
) {
  const referee = await prisma.referee.findUnique({ where: { id: refereeId } });
  if (
    !referee ||
    referee.status !== "ACTIVE" ||
    !referee.passwordHash ||
    !(await verifyPassword(currentPassword, referee.passwordHash))
  ) {
    throw new RefereeServiceError("当前密码不正确。", 401);
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.referee.update({
      where: { id: refereeId },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    }),
    prisma.refereeSession.deleteMany({ where: { refereeId } }),
  ]);
  await writeAudit({
    actorType: "REFEREE",
    actorId: refereeId,
    action: "PASSWORD_CHANGED",
    entityType: "Referee",
    entityId: refereeId,
    summary: "裁判员修改个人密码",
  });
}

export async function createRefereeApplication(input: {
  matchId: string;
  refereeId: string;
  preferredPositions: AppointmentPositionKey[];
  note?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
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
    if (!referee || referee.status !== "ACTIVE" || referee.mustChangePassword) {
      throw new RefereeServiceError("裁判员账号当前不可报名。", 403);
    }
    const supportsFormat =
      match.competition.format === "ELEVEN_A_SIDE" ? referee.elevenASide : referee.futsal;
    if (!supportsFormat) {
      throw new RefereeServiceError("该裁判员未登记为本项目可执裁人员。", 409);
    }

    const allowed = new Set(getPositionTemplate(match.competition.format).map((item) => item.key));
    const preferred = [...new Set(input.preferredPositions)];
    if (!preferred.length || preferred.some((key) => !allowed.has(key))) {
      throw new RefereeServiceError("请至少选择一个符合本场赛制的意向岗位。");
    }
    const duplicate = await tx.refereeApplication.findUnique({
      where: { matchId_refereeId: { matchId: match.id, refereeId: referee.id } },
    });
    if (duplicate) {
      throw new RefereeServiceError("该裁判员已经报名本场比赛，请勿重复提交。", 409);
    }

    return tx.refereeApplication.create({
      data: {
        matchId: match.id,
        refereeId: referee.id,
        preferredPositions: JSON.stringify(preferred),
        note: input.note || null,
      },
    });
  });
  await writeAudit({
    actorType: "REFEREE",
    actorId: input.refereeId,
    action: "APPLICATION_CREATED",
    entityType: "RefereeApplication",
    entityId: result.id,
    summary: "裁判员提交执裁意向",
    metadata: { matchId: input.matchId },
  });
  return result;
}

export async function withdrawRefereeApplication(id: string, refereeId: string) {
  const application = await prisma.refereeApplication.findUnique({
    where: { id },
    include: { match: true },
  });
  if (!application || application.refereeId !== refereeId) {
    throw new RefereeServiceError("报名记录不存在。", 404);
  }
  if (
    application.status === "APPOINTED" ||
    application.status === "WITHDRAWN" ||
    !application.match.applicationDeadline ||
    application.match.applicationDeadline <= new Date()
  ) {
    throw new RefereeServiceError("该报名记录当前不能自行撤回。", 409);
  }
  const result = await prisma.refereeApplication.update({
    where: { id },
    data: { status: "WITHDRAWN" },
  });
  await writeAudit({
    actorType: "REFEREE",
    actorId: refereeId,
    action: "APPLICATION_WITHDRAWN",
    entityType: "RefereeApplication",
    entityId: id,
    summary: "裁判员在截止前撤回执裁意向",
  });
  return result;
}

export async function createAdminApplicationException(input: {
  matchId: string;
  refereeId: string;
  preferredPositions: AppointmentPositionKey[];
  note?: string;
  exceptionReason: string;
}) {
  if (!input.exceptionReason.trim()) {
    throw new RefereeServiceError("请填写人工例外原因。");
  }
  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: input.matchId },
      include: { competition: true },
    });
    if (!match) throw new RefereeServiceError("比赛不存在。", 404);
    const referee = await tx.referee.findUnique({ where: { id: input.refereeId } });
    if (!referee || referee.status !== "ACTIVE") {
      throw new RefereeServiceError("裁判员账号当前不可用。", 409);
    }
    const supportsFormat =
      match.competition.format === "ELEVEN_A_SIDE" ? referee.elevenASide : referee.futsal;
    if (!supportsFormat) throw new RefereeServiceError("裁判员未登记为本项目可执裁人员。", 409);
    const allowed = new Set(getPositionTemplate(match.competition.format).map((item) => item.key));
    const preferred = [...new Set(input.preferredPositions)];
    if (!preferred.length || preferred.some((key) => !allowed.has(key))) {
      throw new RefereeServiceError("请选择符合本场赛制的意向岗位。");
    }
    const duplicate = await tx.refereeApplication.findUnique({
      where: { matchId_refereeId: { matchId: input.matchId, refereeId: input.refereeId } },
    });
    if (duplicate) throw new RefereeServiceError("该裁判员已有本场报名记录。", 409);
    return tx.refereeApplication.create({
      data: {
        matchId: input.matchId,
        refereeId: input.refereeId,
        preferredPositions: JSON.stringify(preferred),
        note: input.note || null,
        status: "REVIEWING",
        reviewNote: `人工例外：${input.exceptionReason}`,
        reviewedAt: new Date(),
      },
    });
  });
  await writeAudit({
    action: "APPLICATION_EXCEPTION_CREATED",
    entityType: "RefereeApplication",
    entityId: result.id,
    summary: "管理员补录执裁意向例外",
    metadata: { matchId: input.matchId, reason: input.exceptionReason },
  });
  return result;
}

export async function reviewApplication(
  id: string,
  status: ApplicationStatus,
  reviewNote: string,
) {
  const existing = await prisma.refereeApplication.findUnique({ where: { id } });
  if (!existing) throw new RefereeServiceError("报名记录不存在。", 404);
  const result = await prisma.refereeApplication.update({
    where: { id },
    data: { status, reviewNote: reviewNote || null, reviewedAt: new Date() },
  });
  await writeAudit({
    action: "APPLICATION_REVIEWED",
    entityType: "RefereeApplication",
    entityId: id,
    summary: `报名审核状态更新为 ${status}`,
  });
  return result;
}

export async function createMatch(input: {
  slug: string;
  competitionId: string;
  stage: string;
  kickoff: Date;
  venue: string;
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  applicationDeadline?: Date;
  applicationWindowStatus: "OPEN" | "CLOSED";
  publicNote?: string;
  internalNote?: string;
  positionCounts: Partial<Record<AppointmentPositionKey, number>>;
}) {
  if (input.homeTeamId === input.awayTeamId) {
    throw new RefereeServiceError("比赛双方不能相同。");
  }
  if (
    input.applicationWindowStatus === "OPEN" &&
    (!input.applicationDeadline ||
      input.applicationDeadline <= new Date() ||
      input.applicationDeadline >= input.kickoff)
  ) {
    throw new RefereeServiceError("开放报名时，截止时间须晚于当前时间且早于开球时间。");
  }
  const competition = await prisma.competition.findUnique({
    where: { id: input.competitionId },
    include: { teams: true },
  });
  if (!competition) throw new RefereeServiceError("赛事不存在。", 404);
  const teamIds = new Set(competition.teams.map((team) => team.id));
  if (!teamIds.has(input.homeTeamId) || !teamIds.has(input.awayTeamId)) {
    throw new RefereeServiceError("比赛球队不属于所选赛事。");
  }
  const match = await prisma.match.create({
    data: {
      slug: input.slug,
      competitionId: input.competitionId,
      stage: input.stage,
      kickoff: input.kickoff,
      venue: input.venue,
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      status: input.status,
      applicationWindowStatus: input.applicationWindowStatus,
      applicationDeadline: input.applicationDeadline,
      publicNote: input.publicNote || null,
      internalNote: input.internalNote || null,
      positionRequirements: {
        create: buildPositionRequirements(competition.format, input.positionCounts),
      },
    },
  });
  await writeAudit({
    action: "MATCH_CREATED",
    entityType: "Match",
    entityId: match.id,
    summary: `创建裁判开放场次 ${match.slug}`,
  });
  return match;
}

export async function updateMatch(
  id: string,
  input: Parameters<typeof createMatch>[0] & { cancellationReason?: string },
) {
  const existing = await prisma.match.findUnique({ where: { id } });
  if (!existing) throw new RefereeServiceError("比赛不存在。", 404);
  if (input.homeTeamId === input.awayTeamId) {
    throw new RefereeServiceError("比赛双方不能相同。");
  }
  if (
    input.applicationWindowStatus === "OPEN" &&
    (!input.applicationDeadline ||
      input.applicationDeadline <= new Date() ||
      input.applicationDeadline >= input.kickoff)
  ) {
    throw new RefereeServiceError("开放报名时，截止时间须晚于当前时间且早于开球时间。");
  }
  const competition = await prisma.competition.findUnique({
    where: { id: input.competitionId },
    include: { teams: true },
  });
  if (!competition) throw new RefereeServiceError("赛事不存在。", 404);
  const teamIds = new Set(competition.teams.map((team) => team.id));
  if (!teamIds.has(input.homeTeamId) || !teamIds.has(input.awayTeamId)) {
    throw new RefereeServiceError("比赛球队不属于所选赛事。");
  }
  const match = await prisma.$transaction(async (tx) => {
    await tx.matchPositionRequirement.deleteMany({ where: { matchId: id } });
    return tx.match.update({
      where: { id },
      data: {
        slug: input.slug,
        competitionId: input.competitionId,
        stage: input.stage,
        kickoff: input.kickoff,
        venue: input.venue,
        homeTeamId: input.homeTeamId,
        awayTeamId: input.awayTeamId,
        status: input.status,
        applicationWindowStatus: input.applicationWindowStatus,
        applicationDeadline: input.applicationDeadline,
        publicNote: input.publicNote || null,
        internalNote: input.internalNote || null,
        cancellationReason: input.cancellationReason || null,
        cancelledAt: input.status === "CANCELLED" ? new Date() : null,
        positionRequirements: {
          create: buildPositionRequirements(competition.format, input.positionCounts),
        },
      },
    });
  });
  await writeAudit({
    action: "MATCH_UPDATED",
    entityType: "Match",
    entityId: match.id,
    summary: `更新裁判开放场次 ${match.slug}`,
  });
  return match;
}

function buildPositionRequirements(
  format: CompetitionFormat,
  counts: Partial<Record<AppointmentPositionKey, number>>,
) {
  return getPositionTemplate(format)
    .map((position) => ({
      key: position.key,
      label: position.label,
      sortOrder: position.order,
      count: Math.max(0, Math.min(5, Math.trunc(counts[position.key] ?? 0))),
    }))
    .filter((position) => position.count > 0);
}

type PositionInput = {
  key: AppointmentPositionKey;
  slot?: number;
  refereeId: string | null;
};

export async function saveAppointmentDraft(input: {
  matchId: string;
  publicationNote: string;
  changeReason?: string;
  positions: PositionInput[];
}) {
  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: input.matchId },
      include: { competition: true, positionRequirements: true },
    });
    if (!match) throw new RefereeServiceError("比赛不存在。", 404);
    if (match.status !== "SCHEDULED") {
      throw new RefereeServiceError("只有已安排且未取消的比赛可以配置选派。", 409);
    }
    const template = getPositionTemplate(match.competition.format);
    const allowed = new Map(template.map((item) => [item.key, item]));
    const requirements = new Map(
      match.positionRequirements.map((item) => [item.key, item.count]),
    );
    const normalized = input.positions.map((item) => ({
      ...item,
      slot: item.slot ?? 1,
    }));
    const identities = normalized.map((item) => `${item.key}:${item.slot}`);
    if (
      new Set(identities).size !== identities.length ||
      normalized.some(
        (item) =>
          !allowed.has(item.key) ||
          item.slot < 1 ||
          item.slot > (requirements.get(item.key) ?? 1),
      )
    ) {
      throw new RefereeServiceError("岗位配置包含重复、超额或不适用于本场赛制的岗位。");
    }

    const refereeIds = normalized.flatMap((item) => (item.refereeId ? [item.refereeId] : []));
    if (new Set(refereeIds).size !== refereeIds.length) {
      throw new RefereeServiceError("同一裁判员不能在同一场比赛承担多个岗位。");
    }
    if (refereeIds.length) {
      const referees = await tx.referee.findMany({
        where: { id: { in: refereeIds }, status: "ACTIVE" },
      });
      if (referees.length !== refereeIds.length) {
        throw new RefereeServiceError("岗位中包含无效或已停用裁判员。");
      }
      const incompatible = referees.some((referee) =>
        match.competition.format === "ELEVEN_A_SIDE"
          ? !referee.elevenASide
          : !referee.futsal,
      );
      if (incompatible) {
        throw new RefereeServiceError("岗位中包含未登记为本项目可执裁的人员。");
      }
      const conflictStart = new Date(match.kickoff.getTime() - 3 * 60 * 60 * 1000);
      const conflictEnd = new Date(match.kickoff.getTime() + 3 * 60 * 60 * 1000);
      const conflicts = await tx.appointmentPosition.findMany({
        where: {
          refereeId: { in: refereeIds },
          appointment: {
            status: "PUBLISHED",
            match: {
              id: { not: match.id },
              kickoff: { gte: conflictStart, lte: conflictEnd },
            },
          },
        },
        include: { referee: true, appointment: { include: { match: true } } },
      });
      if (conflicts.length) {
        throw new RefereeServiceError(
          `${conflicts[0].referee?.name ?? "所选裁判员"}与已发布任务时间冲突。`,
          409,
        );
      }
    }

    const existingAppointment = await tx.refereeAppointment.findUnique({
      where: { matchId: match.id },
    });
    if (existingAppointment?.status === "PUBLISHED") {
      throw new RefereeServiceError("请先撤回当前公示，再修改选派草稿。", 409);
    }
    if (existingAppointment?.revision && !input.changeReason?.trim()) {
      throw new RefereeServiceError("修改已发布或已撤回选派时，请填写改派原因。");
    }
    const appointment = await tx.refereeAppointment.upsert({
      where: { matchId: match.id },
      update: {
        status: "DRAFT",
        publicationNote: input.publicationNote || null,
        lastChangeReason: input.changeReason || null,
        withdrawnAt: null,
      },
      create: {
        matchId: match.id,
        status: "DRAFT",
        publicationNote: input.publicationNote || null,
        lastChangeReason: input.changeReason || null,
      },
    });
    await tx.appointmentPosition.deleteMany({ where: { appointmentId: appointment.id } });
    if (normalized.length) {
      await tx.appointmentPosition.createMany({
        data: normalized.map((item) => {
          const definition = allowed.get(item.key)!;
          return {
            appointmentId: appointment.id,
            refereeId: item.refereeId,
            key: item.key,
            label: definition.label,
            sortOrder: definition.order,
            slot: item.slot,
          };
        }),
      });
    }
    return tx.refereeAppointment.findUniqueOrThrow({
      where: { id: appointment.id },
      include: { positions: true },
    });
  });
  await writeAudit({
    action: "APPOINTMENT_DRAFT_SAVED",
    entityType: "RefereeAppointment",
    entityId: result.id,
    summary: "保存裁判选派草稿",
    metadata: { matchId: input.matchId, reason: input.changeReason || null },
  });
  return result;
}

async function saveAppointmentVersion(
  appointmentId: string,
  status: "DRAFT" | "PUBLISHED" | "WITHDRAWN",
  reason?: string,
) {
  const appointment = await prisma.refereeAppointment.findUniqueOrThrow({
    where: { id: appointmentId },
    include: { positions: { orderBy: [{ sortOrder: "asc" }, { slot: "asc" }] } },
  });
  const revision = appointment.revision + 1;
  await prisma.$transaction([
    prisma.refereeAppointment.update({
      where: { id: appointmentId },
      data: { revision, lastChangeReason: reason || null },
    }),
    prisma.appointmentVersion.create({
      data: {
        appointmentId,
        revision,
        status,
        reason: reason || null,
        snapshot: JSON.stringify({
          publicationNote: appointment.publicationNote,
          positions: appointment.positions.map(({ key, slot, refereeId, label }) => ({
            key,
            slot,
            refereeId,
            label,
          })),
        }),
      },
    }),
  ]);
}

export async function publishAppointment(matchId: string, reason = "") {
  const appointment = await prisma.refereeAppointment.findUnique({
    where: { matchId },
    include: { positions: true, match: true },
  });
  if (!appointment) throw new RefereeServiceError("请先保存选派草稿。", 409);
  if (appointment.match.status !== "SCHEDULED") {
    throw new RefereeServiceError("比赛已结束或取消，不能发布选派。", 409);
  }
  if (!appointment.positions.length || appointment.positions.some((item) => !item.refereeId)) {
    throw new RefereeServiceError("发布前须为所有已启用岗位分配裁判员。", 409);
  }
  await saveAppointmentVersion(appointment.id, "PUBLISHED", reason);
  const selectedIds = appointment.positions.flatMap((item) =>
    item.refereeId ? [item.refereeId] : [],
  );
  const result = await prisma.$transaction(async (tx) => {
    await tx.refereeApplication.updateMany({
      where: { matchId, refereeId: { in: selectedIds } },
      data: { status: "APPOINTED", reviewedAt: new Date() },
    });
    await tx.refereeApplication.updateMany({
      where: {
        matchId,
        refereeId: { notIn: selectedIds },
        status: { in: ["PENDING", "REVIEWING", "APPROVED"] },
      },
      data: { status: "NOT_SELECTED", reviewedAt: new Date() },
    });
    return tx.refereeAppointment.update({
      where: { id: appointment.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        withdrawnAt: null,
        lastChangeReason: reason || null,
      },
    });
  });
  await writeAudit({
    action: appointment.revision > 0 ? "APPOINTMENT_REPUBLISHED" : "APPOINTMENT_PUBLISHED",
    entityType: "RefereeAppointment",
    entityId: appointment.id,
    summary: "发布裁判选派公示",
    metadata: { matchId, reason: reason || null },
  });
  return result;
}

export async function withdrawAppointment(matchId: string, reason = "") {
  const appointment = await prisma.refereeAppointment.findUnique({ where: { matchId } });
  if (!appointment || appointment.status !== "PUBLISHED") {
    throw new RefereeServiceError("当前没有可撤回的已发布选派。", 409);
  }
  if (!reason.trim()) throw new RefereeServiceError("请填写撤回或改派原因。");
  await saveAppointmentVersion(appointment.id, "WITHDRAWN", reason);
  const result = await prisma.refereeAppointment.update({
    where: { id: appointment.id },
    data: {
      status: "WITHDRAWN",
      withdrawnAt: new Date(),
      lastChangeReason: reason,
    },
  });
  await writeAudit({
    action: "APPOINTMENT_WITHDRAWN",
    entityType: "RefereeAppointment",
    entityId: appointment.id,
    summary: "撤回裁判选派公示",
    metadata: { matchId, reason },
  });
  return result;
}
