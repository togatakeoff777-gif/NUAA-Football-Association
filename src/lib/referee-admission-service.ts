import type { Prisma, RefereeAdmissionApplicationStatus } from "@/generated/prisma-v29/client";
import { prisma } from "@/lib/prisma";
import {
  createRefereeAccountInTransaction,
  type AdminActor,
} from "@/lib/referee-service";
import { RefereeServiceError } from "@/lib/referee-service-error";
import { hashPassword } from "@/lib/referee-security";
import {
  assertUnifiedAdminPermission,
  type UnifiedAdminActor,
} from "@/lib/unified-admin-rbac";
import { isRecord, readShortText } from "@/lib/referee-validation";

function readAdmissionApplicationInput(input: unknown) {
  if (!isRecord(input)) {
    throw new RefereeServiceError("提交内容格式不正确。");
  }

  try {
    const name = readShortText(input.name, "姓名", 48);
    const studentId = readShortText(input.studentId, "学号", 32, false);
    const phone = readShortText(input.phone, "手机号", 32, false);
    const qq = readShortText(input.qq, "QQ", 32, false);
    const note = readShortText(input.note, "补充说明", 240, false);

    if (phone && !/^\d{11}$/.test(phone)) {
      throw new RefereeServiceError("手机号须为 11 位纯数字。");
    }
    if (qq && !/^\d{5,12}$/.test(qq)) {
      throw new RefereeServiceError("QQ 须为 5 至 12 位纯数字。");
    }
    if (!phone && !qq) {
      throw new RefereeServiceError("请至少填写手机号或 QQ。");
    }

    return { name, studentId, phone, qq, note };
  } catch (error) {
    if (error instanceof RefereeServiceError) throw error;
    throw new RefereeServiceError(
      error instanceof Error ? error.message : "提交内容格式不正确。",
    );
  }
}

export async function submitRefereeAdmissionApplication(input: unknown) {
  const { name, studentId, phone, qq, note } = readAdmissionApplicationInput(input);

  return prisma.refereeAdmissionApplication.create({
    data: {
      name,
      studentId: studentId || null,
      phone: phone || null,
      qq: qq || null,
      note: note || null,
      status: "PENDING",
    },
    select: {
      id: true,
      status: true,
    },
  });
}

function assertAdmissionRead(actor: UnifiedAdminActor) {
  assertUnifiedAdminPermission(actor, "referees:read");
}

function assertAdmissionWrite(actor: UnifiedAdminActor) {
  assertUnifiedAdminPermission(actor, "referees:write");
}

function refereeAdminActor(actor: UnifiedAdminActor): AdminActor {
  return {
    id: actor.id,
    role: actor.roles.includes("SUPER_ADMIN") ? "SUPER_ADMIN" : "REFEREE_MANAGER",
  };
}

const admissionDetailSelect = {
  id: true,
  name: true,
  studentId: true,
  phone: true,
  qq: true,
  note: true,
  status: true,
  reviewedAt: true,
  reviewNote: true,
  createdAt: true,
  updatedAt: true,
  reviewedByAdmin: {
    select: { id: true, username: true, displayName: true },
  },
  referee: {
    select: {
      id: true,
      publicCode: true,
      name: true,
      status: true,
      trainingStatus: true,
      assignmentEligibility: true,
    },
  },
} satisfies Prisma.RefereeAdmissionApplicationSelect;

export async function listRefereeAdmissionApplications(
  status: RefereeAdmissionApplicationStatus | undefined,
  actor: UnifiedAdminActor,
) {
  assertAdmissionRead(actor);
  return prisma.refereeAdmissionApplication.findMany({
    where: status ? { status } : undefined,
    select: admissionDetailSelect,
    orderBy: { createdAt: "desc" },
    take: 300,
  });
}

export async function getRefereeAdmissionApplication(
  id: string,
  actor: UnifiedAdminActor,
) {
  assertAdmissionRead(actor);
  const application = await prisma.refereeAdmissionApplication.findUnique({
    where: { id },
    select: admissionDetailSelect,
  });
  if (!application) throw new RefereeServiceError("裁判准入申请不存在。", 404);
  return application;
}

type AdmissionReviewInput =
  | { action: "REJECT"; reviewNote: string }
  | {
      action: "APPROVE";
      reviewNote: string;
      mode: "CREATE_NEW";
      publicCode: string;
      initialPassword: string;
    }
  | {
      action: "APPROVE";
      reviewNote: string;
      mode: "LINK_EXISTING";
      existingRefereeId: string;
      initialPassword: string;
    };

function validateReviewInput(input: AdmissionReviewInput) {
  if (!input.reviewNote.trim()) throw new RefereeServiceError("请填写审核意见。");
  if (input.action === "APPROVE" && input.initialPassword.length < 12) {
    throw new RefereeServiceError("裁判员初始密码不能少于 12 个字符。");
  }
  if (input.action === "APPROVE" && input.mode === "CREATE_NEW" && !input.publicCode.trim()) {
    throw new RefereeServiceError("请填写裁判员编号。");
  }
  if (input.action === "APPROVE" && input.mode === "LINK_EXISTING" && !input.existingRefereeId.trim()) {
    throw new RefereeServiceError("请选择要明确关联的裁判员账号。");
  }
}

export async function reviewRefereeAdmissionApplication(
  id: string,
  input: AdmissionReviewInput,
  actor: UnifiedAdminActor,
) {
  assertAdmissionWrite(actor);
  validateReviewInput(input);

  try {
    return await prisma.$transaction(async (tx) => {
      const application = await tx.refereeAdmissionApplication.findUnique({ where: { id } });
      if (!application) throw new RefereeServiceError("裁判准入申请不存在。", 404);
      if (application.status !== "PENDING") {
        throw new RefereeServiceError("该准入申请已经完成审核，不能重复处理。", 409);
      }

      const reviewedAt = new Date();
      const reviewNote = input.reviewNote.trim();
      if (input.action === "REJECT") {
        const rejected = await tx.refereeAdmissionApplication.update({
          where: { id },
          data: {
            status: "REJECTED",
            reviewedAt,
            reviewNote,
            reviewedByAdminId: actor.id,
          },
          select: admissionDetailSelect,
        });
        await tx.auditLog.create({
          data: {
            actorType: "ADMIN",
            actorId: actor.id,
            action: "REFEREE_ADMISSION_REJECTED",
            entityType: "RefereeAdmissionApplication",
            entityId: id,
            summary: `拒绝裁判准入申请：${application.name}`,
            metadata: JSON.stringify({
              applicationId: id,
              reviewer: actor.displayName,
              result: "REJECTED",
              reason: reviewNote,
              refereeId: null,
            }),
          },
        });
        return rejected;
      }

      let refereeId: string;
      if (input.mode === "LINK_EXISTING") {
        const existing = await tx.referee.findUnique({
          where: { id: input.existingRefereeId },
          select: { id: true, publicCode: true, status: true },
        });
        if (!existing) throw new RefereeServiceError("明确选择的裁判员账号不存在。", 404);
        const passwordHash = await hashPassword(input.initialPassword);
        await tx.referee.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            passwordHash,
            mustChangePassword: true,
            passwordChangedAt: reviewedAt,
            sessions: { deleteMany: {} },
          },
        });
        await tx.auditLog.create({
          data: {
            actorType: "ADMIN",
            actorId: actor.id,
            action: "REFEREE_ACCOUNT_ENABLED",
            entityType: "Referee",
            entityId: existing.id,
            summary: `准入审核明确关联并启用裁判员账号 ${existing.publicCode}`,
            metadata: JSON.stringify({
              admissionApplicationId: id,
              from: existing.status,
              to: "ACTIVE",
              mustChangePassword: true,
            }),
          },
        });
        refereeId = existing.id;
      } else {
        if (application.studentId) {
          const studentIdOwner = await tx.referee.findUnique({
            where: { studentId: application.studentId },
            select: { id: true, publicCode: true },
          });
          if (studentIdOwner) {
            throw new RefereeServiceError(
              `该学号已对应裁判员 ${studentIdOwner.publicCode}，请明确选择关联现有账号。`,
              409,
            );
          }
        }
        const referee = await createRefereeAccountInTransaction({
          publicCode: input.publicCode.trim(),
          name: application.name,
          initialPassword: input.initialPassword,
          status: "ACTIVE",
          trainingStatus: "PENDING_ASSESSMENT",
          assignmentEligibility: "NOT_ELIGIBLE",
          elevenASide: false,
          futsal: false,
          publicDirectoryEnabled: false,
          studentId: application.studentId ?? undefined,
          phone: application.phone ?? undefined,
          qq: application.qq ?? undefined,
          capabilities: [],
        }, refereeAdminActor(actor), tx, {
          admissionApplicationId: id,
          source: "REFEREE_ADMISSION_APPROVAL",
        });
        refereeId = referee.id;
      }

      const approved = await tx.refereeAdmissionApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt,
          reviewNote,
          reviewedByAdminId: actor.id,
          refereeId,
        },
        select: admissionDetailSelect,
      });
      await tx.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorId: actor.id,
          action: "REFEREE_ADMISSION_APPROVED",
          entityType: "RefereeAdmissionApplication",
          entityId: id,
          summary: `通过裁判准入申请：${application.name}`,
          metadata: JSON.stringify({
            applicationId: id,
            reviewer: actor.displayName,
            result: "APPROVED",
            reason: reviewNote,
            refereeId,
            accountMode: input.mode,
          }),
        },
      });
      return approved;
    });
  } catch (error) {
    if (error instanceof RefereeServiceError) throw error;
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      throw new RefereeServiceError("裁判员编号或学号已存在，请改为明确关联现有账号。", 409);
    }
    throw error;
  }
}
