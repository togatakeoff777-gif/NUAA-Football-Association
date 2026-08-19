import type {
  AdminRole,
  AppointmentPositionKey,
  AvailabilityKind,
  CompetitionFormat,
  ConflictReportStatus,
} from "@/generated/prisma-v29/client";
import { prisma } from "@/lib/prisma";
import type { AdminActor } from "@/lib/referee-service";
import { RefereeServiceError } from "@/lib/referee-service";
import { hashPassword, verifyPassword } from "@/lib/referee-security";

async function audit(input: {
  actorType: "ADMIN" | "REFEREE";
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      actorType: input.actorType,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

export async function inferCollegeSuggestion(studentId: string) {
  const prefix = studentId.trim().slice(0, 2);
  if (prefix.length !== 2) return null;
  return prisma.collegeCodeMapping.findUnique({
    where: { prefix },
    select: { prefix: true, college: { select: { id: true, name: true } } },
  });
}

export async function createCollege(name: string, actor: AdminActor) {
  const college = await prisma.college.create({ data: { name } });
  await audit({
    actorType: "ADMIN",
    actorId: actor.id,
    action: "COLLEGE_CREATED",
    entityType: "College",
    entityId: college.id,
    summary: `创建学院 ${college.name}`,
  });
  return college;
}

export async function upsertCollegeCodeMapping(
  prefix: string,
  collegeId: string,
  note: string,
  actor: AdminActor,
) {
  if (!/^\d{2}$/.test(prefix)) throw new RefereeServiceError("学号前缀必须是两位数字。");
  const mapping = await prisma.collegeCodeMapping.upsert({
    where: { prefix },
    update: { collegeId, note: note || null },
    create: { prefix, collegeId, note: note || null },
  });
  await audit({
    actorType: "ADMIN",
    actorId: actor.id,
    action: "COLLEGE_CODE_MAPPING_UPDATED",
    entityType: "CollegeCodeMapping",
    entityId: mapping.id,
    summary: `更新学号前缀映射 ${prefix}`,
    metadata: { collegeId },
  });
  return mapping;
}

export async function setTeamAffiliations(
  teamId: string,
  collegeIds: string[],
  actor: AdminActor,
) {
  const uniqueIds = [...new Set(collegeIds)];
  const result = await prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } });
    if (!team) throw new RefereeServiceError("球队不存在。", 404);
    const collegeCount = await tx.college.count({ where: { id: { in: uniqueIds } } });
    if (collegeCount !== uniqueIds.length) throw new RefereeServiceError("球队学院关联包含无效学院。");
    await tx.teamAffiliation.deleteMany({ where: { teamId } });
    if (uniqueIds.length) {
      await tx.teamAffiliation.createMany({
        data: uniqueIds.map((collegeId) => ({ teamId, collegeId })),
      });
    }
    await tx.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorId: actor.id,
        action: "TEAM_AFFILIATIONS_UPDATED",
        entityType: "Team",
        entityId: teamId,
        summary: `更新球队 ${team.name} 的学院关联`,
        metadata: JSON.stringify({ collegeIds: uniqueIds }),
      },
    });
    return team;
  });
  return result;
}

export async function saveRefereeAvailability(input: {
  id?: string;
  refereeId: string;
  startAt: Date;
  endAt: Date;
  kind: AvailabilityKind;
  note?: string;
  actor: { type: "ADMIN" | "REFEREE"; id: string | null };
}) {
  if (input.endAt <= input.startAt) throw new RefereeServiceError("结束时间必须晚于开始时间。");
  if (input.id) {
    const existing = await prisma.refereeAvailability.findUnique({ where: { id: input.id } });
    if (!existing || existing.refereeId !== input.refereeId) {
      throw new RefereeServiceError("可执裁时间记录不存在。", 404);
    }
  }
  const availability = input.id
    ? await prisma.refereeAvailability.update({
        where: { id: input.id },
        data: { startAt: input.startAt, endAt: input.endAt, kind: input.kind, note: input.note || null },
      })
    : await prisma.refereeAvailability.create({
        data: {
          refereeId: input.refereeId,
          startAt: input.startAt,
          endAt: input.endAt,
          kind: input.kind,
          note: input.note || null,
        },
      });
  await audit({
    actorType: input.actor.type,
    actorId: input.actor.id,
    action: "REFEREE_AVAILABILITY_SAVED",
    entityType: "RefereeAvailability",
    entityId: availability.id,
    summary: "保存裁判员可执裁时间",
    metadata: { refereeId: input.refereeId, kind: input.kind },
  });
  return availability;
}

export async function deleteRefereeAvailability(
  id: string,
  refereeId: string,
  actor: { type: "ADMIN" | "REFEREE"; id: string | null },
) {
  const existing = await prisma.refereeAvailability.findUnique({ where: { id } });
  if (!existing || existing.refereeId !== refereeId) {
    throw new RefereeServiceError("可执裁时间记录不存在。", 404);
  }
  await prisma.refereeAvailability.delete({ where: { id } });
  await audit({
    actorType: actor.type,
    actorId: actor.id,
    action: "REFEREE_AVAILABILITY_DELETED",
    entityType: "RefereeAvailability",
    entityId: id,
    summary: "删除裁判员可执裁时间",
    metadata: { refereeId },
  });
}

async function getCurrentPublishedVersion(appointmentId: string, refereeId: string) {
  const appointment = await prisma.refereeAppointment.findFirst({
    where: {
      id: appointmentId,
      status: "PUBLISHED",
      positions: { some: { refereeId } },
    },
    select: {
      id: true,
      revision: true,
      versions: {
        where: { status: "PUBLISHED" },
        orderBy: { revision: "desc" },
        take: 1,
        select: { id: true, revision: true },
      },
    },
  });
  const version = appointment?.versions[0];
  if (!appointment || !version || version.revision !== appointment.revision) {
    throw new RefereeServiceError("当前没有可确认的已发布版本。", 409);
  }
  return { appointment, version };
}

export async function acknowledgeAppointment(appointmentId: string, refereeId: string) {
  const { version } = await getCurrentPublishedVersion(appointmentId, refereeId);
  const acknowledgement = await prisma.appointmentAcknowledgement.upsert({
    where: { versionId_refereeId: { versionId: version.id, refereeId } },
    update: { acknowledgedAt: new Date() },
    create: { appointmentId, versionId: version.id, refereeId },
  });
  await audit({
    actorType: "REFEREE",
    actorId: refereeId,
    action: "APPOINTMENT_ACKNOWLEDGED",
    entityType: "RefereeAppointment",
    entityId: appointmentId,
    summary: "裁判员确认知悉已发布选派",
    metadata: { versionId: version.id },
  });
  return acknowledgement;
}

export async function reportAppointmentConflict(
  appointmentId: string,
  refereeId: string,
  reason: string,
) {
  if (!reason.trim()) throw new RefereeServiceError("请填写冲突原因。");
  const { version } = await getCurrentPublishedVersion(appointmentId, refereeId);
  const report = await prisma.appointmentConflictReport.upsert({
    where: { versionId_refereeId: { versionId: version.id, refereeId } },
    update: { reason, reportedAt: new Date(), status: "PENDING", resolutionNote: null, resolvedAt: null, resolvedByAdminId: null },
    create: { appointmentId, versionId: version.id, refereeId, reason },
  });
  await audit({
    actorType: "REFEREE",
    actorId: refereeId,
    action: "APPOINTMENT_CONFLICT_REPORTED",
    entityType: "AppointmentConflictReport",
    entityId: report.id,
    summary: "裁判员报告已发布选派冲突",
    metadata: { appointmentId, versionId: version.id },
  });
  return report;
}

export async function resolveAppointmentConflictReport(
  id: string,
  status: Exclude<ConflictReportStatus, "PENDING">,
  resolutionNote: string,
  actor: AdminActor,
) {
  if (!resolutionNote.trim()) throw new RefereeServiceError("请填写处理说明。");
  const report = await prisma.appointmentConflictReport.update({
    where: { id },
    data: { status, resolutionNote, resolvedAt: new Date(), resolvedByAdminId: actor.id },
  });
  await audit({
    actorType: "ADMIN",
    actorId: actor.id,
    action: "APPOINTMENT_CONFLICT_REPORT_RESOLVED",
    entityType: "AppointmentConflictReport",
    entityId: id,
    summary: `处理裁判选派冲突报告：${status}`,
    metadata: { appointmentId: report.appointmentId, resolutionNote },
  });
  return report;
}

export async function updateSelfRefereeProfile(
  refereeId: string,
  input: { phone?: string; qq?: string },
) {
  const referee = await prisma.referee.update({
    where: { id: refereeId },
    data: { phone: input.phone || null, qq: input.qq || null },
    select: { id: true, phone: true, qq: true },
  });
  await audit({
    actorType: "REFEREE",
    actorId: refereeId,
    action: "REFEREE_SELF_PROFILE_UPDATED",
    entityType: "Referee",
    entityId: refereeId,
    summary: "裁判员更新基础个人资料",
  });
  return referee;
}

export async function createAdminAccount(input: {
  username: string;
  displayName: string;
  password: string;
  role: AdminRole;
}, actor: AdminActor) {
  if (actor.role !== "SUPER_ADMIN") throw new RefereeServiceError("只有最高权限管理员可以创建管理员账号。", 403);
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,64}$/.test(username)) {
    throw new RefereeServiceError("管理员账号须为 3 至 64 位字母、数字、点、下划线或连字符。");
  }
  if (input.password.length < 12) {
    throw new RefereeServiceError("管理员初始密码不能少于 12 个字符。");
  }
  const passwordHash = await hashPassword(input.password);
  const account = await prisma.adminAccount.create({
      data: {
        username,
        displayName: input.displayName,
        passwordHash,
        role: input.role,
        mustChangePassword: true,
      },
      select: { id: true, username: true, displayName: true, role: true, isActive: true },
    }).catch((error: unknown) => {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      throw new RefereeServiceError("管理员账号已存在。", 409);
    }
    throw error;
  });
  await audit({
    actorType: "ADMIN",
    actorId: actor.id,
    action: "ADMIN_ACCOUNT_CREATED",
    entityType: "AdminAccount",
    entityId: account.id,
    summary: `创建管理员账号 ${account.username}`,
  });
  return account;
}

export async function setAdminAccountStatus(id: string, isActive: boolean, actor: AdminActor) {
  if (actor.role !== "SUPER_ADMIN") throw new RefereeServiceError("只有最高权限管理员可以管理管理员账号。", 403);
  if (actor.id === id && !isActive) throw new RefereeServiceError("不能停用当前登录账号。");
  const account = await prisma.adminAccount.update({
    where: { id },
    data: { isActive, ...(!isActive ? { sessions: { deleteMany: {} } } : {}) },
    select: { id: true, username: true, isActive: true },
  });
  await audit({
    actorType: "ADMIN",
    actorId: actor.id,
    action: "ADMIN_ACCOUNT_STATUS_UPDATED",
    entityType: "AdminAccount",
    entityId: id,
    summary: `${isActive ? "启用" : "停用"}管理员账号 ${account.username}`,
  });
  return account;
}

export async function changeAdminPassword(input: {
  adminAccountId: string;
  currentSessionId: string;
  currentPassword: string;
  newPassword: string;
}) {
  if (input.newPassword.length < 12) {
    throw new RefereeServiceError("管理员新密码不能少于 12 个字符。");
  }
  const account = await prisma.adminAccount.findUnique({
    where: { id: input.adminAccountId },
    select: { id: true, username: true, passwordHash: true, isActive: true },
  });
  if (
    !account?.isActive ||
    !(await verifyPassword(input.currentPassword, account.passwordHash))
  ) {
    throw new RefereeServiceError("当前管理员密码不正确。", 401);
  }
  if (await verifyPassword(input.newPassword, account.passwordHash)) {
    throw new RefereeServiceError("新密码不能与当前密码相同。");
  }
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction(async (tx) => {
    await tx.adminAccount.update({
      where: { id: account.id },
      data: { passwordHash, mustChangePassword: false },
    });
    await tx.adminSession.deleteMany({
      where: {
        adminAccountId: account.id,
        id: { not: input.currentSessionId },
      },
    });
    await tx.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorId: account.id,
        action: "ADMIN_PASSWORD_CHANGED",
        entityType: "AdminAccount",
        entityId: account.id,
        summary: `管理员 ${account.username} 修改个人密码`,
      },
    });
  });
}

export async function getCompletedRefereeStatistics() {
  const positions = await prisma.appointmentPosition.findMany({
    where: { refereeId: { not: null }, appointment: { status: "COMPLETED" } },
    select: {
      refereeId: true,
      key: true,
      label: true,
      appointmentId: true,
      referee: { select: { publicCode: true, name: true } },
      appointment: {
        select: {
          completedAt: true,
          match: {
            select: {
              kickoff: true,
              competition: { select: { id: true, name: true } },
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { appointment: { match: { kickoff: "desc" } } },
  });
  const byReferee = new Map<string, {
    refereeId: string;
    publicCode: string;
    name: string;
    appointmentIds: Set<string>;
    positions: Record<string, number>;
    competitions: Record<string, { name: string; count: number }>;
    recent: Array<{ appointmentId: string; matchup: string; kickoff: Date; position: string }>;
  }>();
  for (const position of positions) {
    if (!position.refereeId || !position.referee) continue;
    const row = byReferee.get(position.refereeId) ?? {
      refereeId: position.refereeId,
      publicCode: position.referee.publicCode,
      name: position.referee.name,
      appointmentIds: new Set<string>(),
      positions: {},
      competitions: {},
      recent: [],
    };
    row.appointmentIds.add(position.appointmentId);
    row.positions[position.key] = (row.positions[position.key] ?? 0) + 1;
    const competition = position.appointment.match.competition;
    row.competitions[competition.id] = {
      name: competition.name,
      count: (row.competitions[competition.id]?.count ?? 0) + 1,
    };
    if (row.recent.length < 5) {
      row.recent.push({
        appointmentId: position.appointmentId,
        matchup: `${position.appointment.match.homeTeam.name} vs ${position.appointment.match.awayTeam.name}`,
        kickoff: position.appointment.match.kickoff,
        position: position.label,
      });
    }
    byReferee.set(position.refereeId, row);
  }
  return [...byReferee.values()].map((row) => ({
    refereeId: row.refereeId,
    publicCode: row.publicCode,
    name: row.name,
    totalMatches: row.appointmentIds.size,
    positions: row.positions,
    competitions: Object.values(row.competitions),
    recent: row.recent,
  }));
}

export function capabilityInput(
  values: Array<{ format: CompetitionFormat; positionKey: AppointmentPositionKey }>,
) {
  return values;
}
