import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";
import { hashPassword } from "../src/lib/referee-security";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const databasePath = process.env.PUBLIC_COMPETITION_R3_PREVIEW_DATABASE_PATH;
  const password = process.env.PUBLIC_COMPETITION_R3_PREVIEW_PASSWORD;
  assert(databasePath && path.isAbsolute(databasePath), "PUBLIC_COMPETITION_R3_PREVIEW_DATABASE_PATH must be an absolute isolated path.");
  assert(password && password.length >= 12, "PUBLIC_COMPETITION_R3_PREVIEW_PASSWORD must contain at least 12 characters.");
  const databaseUrl = `file:${databasePath.replaceAll("\\", "/")}`;
  const raw = createClient({ url: databaseUrl });
  try {
    const migrations = (await readdir(path.resolve("prisma/migrations"), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const migration of migrations) {
      await raw.executeMultiple(await readFile(path.resolve("prisma/migrations", migration.name, "migration.sql"), "utf8"));
    }
  } finally {
    raw.close();
  }

  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: databaseUrl }) });
  try {
    const admin = await prisma.adminAccount.create({ data: {
      username: "r3-preview-admin",
      displayName: "R3 本地预览管理员",
      passwordHash: await hashPassword(password),
      role: "SUPER_ADMIN",
      mustChangePassword: false,
    } });
    await prisma.adminRoleAssignment.create({ data: { adminAccountId: admin.id, role: "SUPER_ADMIN" } });

    const seven = await prisma.competition.create({ data: {
      slug: "seven-a-side-test",
      name: "2030校园七人制联赛",
      shortName: "七人制联赛",
      year: 2030,
      campus: "天目湖校区",
      playingFormat: "七人制",
      format: "CUSTOM",
      status: "ONGOING",
      semesterLabel: "下半学期",
      teamFormation: "自由组队",
      publicPublished: true,
      homepageFeatured: true,
      publicOrder: 10,
      matchStartAt: new Date("2030-10-01T10:30:00.000Z"),
      matchEndAt: new Date("2030-10-31T12:30:00.000Z"),
      venue: "七人制测试场",
      host: "南京航空航天大学天目湖足球协会",
      organizer: "赛事部",
      summary: "用于验证任意比赛制式、动态公开目录与赛事详情的一套本地隔离数据。",
      notice: "本页面数据仅用于 R3 本地预览与人工验收。",
    } });
    const six = await prisma.competition.create({ data: {
      slug: "six-a-side-test",
      name: "2030六人制邀请赛",
      shortName: "六人制邀请赛",
      year: 2030,
      campus: "天目湖校区",
      playingFormat: "六人制",
      format: "CUSTOM",
      status: "ONGOING",
      semesterLabel: "下半学期",
      teamFormation: "自由组队",
      publicPublished: true,
      homepageFeatured: false,
      publicOrder: 20,
      matchStartAt: new Date("2030-10-01T10:30:00.000Z"),
      matchEndAt: new Date("2030-10-31T12:30:00.000Z"),
      venue: "六人制测试场",
      host: "南京航空航天大学天目湖足球协会",
      organizer: "赛事部",
      summary: "用于验证未来比赛制式无需新增枚举或页面模板的本地隔离数据。",
      notice: "本页面数据仅用于 R3 本地预览与人工验收。",
    } });
    const [teamA, teamB, teamC, teamD] = await Promise.all([
      prisma.team.create({ data: { competitionId: seven.id, name: "A学院" } }),
      prisma.team.create({ data: { competitionId: seven.id, name: "B学院" } }),
      prisma.team.create({ data: { competitionId: six.id, name: "C学院" } }),
      prisma.team.create({ data: { competitionId: six.id, name: "D学院" } }),
    ]);
    await Promise.all([
      prisma.match.create({ data: {
        slug: "r3-preview-seven-match",
        competitionId: seven.id,
        stage: "小组赛第一轮",
        round: "第一轮",
        kickoff: new Date("2030-10-03T12:15:00.000Z"),
        venue: "七人制测试场",
        homeTeamId: teamA.id,
        awayTeamId: teamB.id,
        status: "SCHEDULED",
        applicationWindowStatus: "CLOSED",
      } }),
      prisma.match.create({ data: {
        slug: "r3-preview-six-match",
        competitionId: six.id,
        stage: "邀请赛第一轮",
        round: "第一轮",
        kickoff: new Date("2030-10-04T10:00:00.000Z"),
        venue: "六人制测试场",
        homeTeamId: teamC.id,
        awayTeamId: teamD.id,
        status: "SCHEDULED",
        applicationWindowStatus: "CLOSED",
      } }),
    ]);
    console.log(JSON.stringify({
      databasePath,
      adminUsername: admin.username,
      competitions: [seven.slug, six.slug],
      publicRoutes: ["/", "/competitions", "/competitions/seven-a-side-test", "/competitions/six-a-side-test"],
      adminRoute: `/admin/competitions/${seven.id}/edit`,
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
