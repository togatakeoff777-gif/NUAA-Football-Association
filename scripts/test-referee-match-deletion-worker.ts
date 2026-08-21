import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function applyMigrations(url: string) {
  const client = createClient({ url });
  const entries = await readdir(path.resolve("prisma/migrations"), { withFileTypes: true });
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    await client.executeMultiple(await readFile(path.resolve("prisma/migrations", entry.name, "migration.sql"), "utf8"));
  }
  client.close();
}

async function main() {
  const databasePath = process.env.REFEREE_MATCH_DELETION_TEST_DATABASE_PATH;
  if (!databasePath) throw new Error("REFEREE_MATCH_DELETION_TEST_DATABASE_PATH is required.");
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  process.env.DATABASE_URL = url;
  await applyMigrations(url);

  const verifier = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  const { deleteMatchSafely, RefereeServiceError } = await import("../src/lib/referee-service");
  const { prisma } = await import("../src/lib/prisma");

  try {
    const admin = await verifier.adminAccount.create({
      data: {
        username: "match-delete-admin",
        displayName: "删除测试管理员",
        passwordHash: "test-only-hash",
        role: "SUPER_ADMIN",
      },
    });
    const actor = { id: admin.id, role: "SUPER_ADMIN" as const };
    const competition = await verifier.competition.create({
      data: {
        slug: "match-deletion-competition",
        name: "比赛删除验收赛事",
        campus: "天目湖校区",
        format: "ELEVEN_A_SIDE",
        status: "ONGOING",
      },
    });
    const [homeTeam, awayTeam] = await Promise.all([
      verifier.team.create({ data: { competitionId: competition.id, name: "能源与动力学院" } }),
      verifier.team.create({ data: { competitionId: competition.id, name: "航空学院" } }),
    ]);
    const referee = await verifier.referee.create({
      data: { publicCode: "DEL-001", name: "删除测试裁判", status: "ACTIVE" },
    });
    const createMatch = (slug: string, status: "SCHEDULED" | "COMPLETED" | "CANCELLED" = "SCHEDULED") => verifier.match.create({
      data: {
        slug,
        competitionId: competition.id,
        stage: slug,
        kickoff: new Date("2031-05-01T16:00:00+08:00"),
        endAt: new Date("2031-05-01T18:00:00+08:00"),
        venue: "西操场",
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        status,
        applicationWindowStatus: "CLOSED",
        positionRequirements: {
          create: { key: "REFEREE", label: "裁判员", count: 1, sortOrder: 1 },
        },
      },
    });

    const untouchedMatch = await createMatch("untouched-match");
    const deletableMatch = await createMatch("deletable-test-match");
    const draftAppointment = await verifier.refereeAppointment.create({
      data: {
        matchId: deletableMatch.id,
        status: "DRAFT",
        positions: {
          create: { key: "REFEREE", label: "裁判员", sortOrder: 1, refereeId: referee.id },
        },
      },
    });
    await verifier.refereeApplication.create({
      data: {
        matchId: deletableMatch.id,
        refereeId: referee.id,
        preferredPositions: JSON.stringify(["REFEREE"]),
        status: "PENDING",
      },
    });

    await deleteMatchSafely(deletableMatch.id, "测试数据：验收清理", actor);
    assert(await verifier.match.findUnique({ where: { id: deletableMatch.id } }) === null, "可删除比赛仍存在于比赛列表数据源。");
    assert(await verifier.competition.count({ where: { id: competition.id } }) === 1, "删除比赛误删了 Competition。");
    assert(await verifier.team.count({ where: { id: { in: [homeTeam.id, awayTeam.id] } } }) === 2, "删除比赛误删了 Team。");
    assert(await verifier.match.count({ where: { id: untouchedMatch.id } }) === 1, "删除比赛影响了其他 Match。");
    assert(await verifier.refereeAppointment.count({ where: { id: draftAppointment.id } }) === 0, "纯草稿选派未随可删除比赛安全清理。");
    assert(await verifier.refereeApplication.count({ where: { matchId: deletableMatch.id } }) === 0, "纯报名意向未随可删除比赛安全清理。");
    assert(await verifier.matchPositionRequirement.count({ where: { matchId: deletableMatch.id } }) === 0, "比赛岗位要求未随可删除比赛清理。");
    const deletionAudit = await verifier.auditLog.findFirst({
      where: { action: "MATCH_DELETED", entityId: deletableMatch.id },
    });
    assert(deletionAudit?.actorId === admin.id, "删除日志未记录具体管理员。");
    assert(deletionAudit.summary.includes("能源与动力学院 vs 航空学院"), "删除日志未记录比赛名称。");
    assert(deletionAudit.metadata?.includes("测试数据：验收清理"), "删除日志未记录删除原因。");

    const publishedMatch = await createMatch("published-protected-match");
    const publishedAppointment = await verifier.refereeAppointment.create({
      data: { matchId: publishedMatch.id, status: "PUBLISHED", revision: 1, publishedAt: new Date() },
    });
    const publishedVersion = await verifier.appointmentVersion.create({
      data: {
        appointmentId: publishedAppointment.id,
        revision: 1,
        status: "PUBLISHED",
        snapshot: JSON.stringify({ positions: [] }),
        createdByAdminId: admin.id,
      },
    });
    let publishedRejected = false;
    try {
      await deleteMatchSafely(publishedMatch.id, "信息录入错误", actor);
    } catch (error) {
      publishedRejected = error instanceof RefereeServiceError && error.status === 409 && error.message.includes("取消比赛");
    }
    assert(publishedRejected, "已发布选派的 Match 未被禁止 hard delete。");
    assert(await verifier.match.count({ where: { id: publishedMatch.id } }) === 1, "受保护 Match 被直接服务调用删除。");
    assert(await verifier.appointmentVersion.count({ where: { id: publishedVersion.id } }) === 1, "删除拦截仍抹掉了 AppointmentVersion。");

    const completedMatch = await createMatch("completed-protected-match", "COMPLETED");
    let completedRejected = false;
    try {
      await deleteMatchSafely(completedMatch.id, "测试数据", actor);
    } catch (error) {
      completedRejected = error instanceof RefereeServiceError && error.status === 409;
    }
    assert(completedRejected && await verifier.match.count({ where: { id: completedMatch.id } }) === 1, "COMPLETED Match 未被保护。");

    const completedAppointmentMatch = await createMatch("completed-appointment-protected-match");
    await verifier.refereeAppointment.create({
      data: { matchId: completedAppointmentMatch.id, status: "COMPLETED", revision: 1, completedAt: new Date() },
    });
    let completedAppointmentRejected = false;
    try {
      await deleteMatchSafely(completedAppointmentMatch.id, "测试数据", actor);
    } catch (error) {
      completedAppointmentRejected = error instanceof RefereeServiceError && error.status === 409;
    }
    assert(completedAppointmentRejected, "COMPLETED appointment 未被保护，统计来源可能被删除。");

    const cancelledMatch = await createMatch("cancelled-match-kept", "CANCELLED");
    let cancelledRejected = false;
    try {
      await deleteMatchSafely(cancelledMatch.id, "重复创建", actor);
    } catch (error) {
      cancelledRejected = error instanceof RefereeServiceError && error.status === 409;
    }
    assert(cancelledRejected && await verifier.match.count({ where: { id: cancelledMatch.id } }) === 1, "真实 CANCELLED 比赛未被保留。");

    const routeSource = await readFile(path.resolve("src/app/api/referees/admin/matches/[id]/route.ts"), "utf8");
    const uiSource = await readFile(path.resolve("src/components/referees/admin/admin-match-danger-actions.tsx"), "utf8");
    const deleteHandler = routeSource.slice(routeSource.indexOf("export async function DELETE"));
    assert(deleteHandler.includes("await authorize(request)") && deleteHandler.includes("deleteMatchSafely"), "DELETE API 未先执行统一管理员鉴权或未复用安全删除服务。");
    assert(routeSource.includes("getAdminSession") && !routeSource.includes("getRefereeSession"), "普通裁判员会话可能被误用于 Match 删除权限。");
    assert(routeSource.includes("isSameOrigin"), "DELETE API 未保留同源 / CSRF 保护。");
    assert(uiSource.includes("确定删除") && uiSource.includes("确认删除") && uiSource.includes("删除与取消比赛不同"), "前端缺少二次确认或删除/取消语义提示。");
    assert(uiSource.includes("测试数据") && uiSource.includes("重复创建") && uiSource.includes("信息录入错误"), "删除原因选项不完整。");

    const competitionAfterDeletion = await verifier.competition.findUniqueOrThrow({
      where: { id: competition.id },
      include: { _count: { select: { matches: true } } },
    });
    assert(competitionAfterDeletion._count.matches === 5, "Competition 的比赛数量未与删除结果同步。");

    console.log(JSON.stringify({
      deletableDraftRemoved: true,
      listAndCompetitionCountUpdated: true,
      competitionAndTeamsPreserved: true,
      unrelatedMatchPreserved: true,
      publishedAndVersionHistoryProtected: true,
      completedMatchAndStatisticsSourceProtected: true,
      cancelledMatchPreserved: true,
      auditIncludesAdminMatchReasonAndTime: Boolean(deletionAudit?.createdAt),
      adminOnlyAndSameOriginApi: true,
      directProtectedServiceCallRejected: true,
      twoStepDangerConfirmation: true,
    }, null, 2));
  } finally {
    await verifier.$disconnect();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "Match deletion test failed.");
  process.exit(1);
});
