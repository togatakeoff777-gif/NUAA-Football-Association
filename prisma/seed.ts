import { PrismaLibSql } from "@prisma/adapter-libsql";
import {
  AppointmentStatus,
  ApplicationWindowStatus,
  CompetitionFormat,
  CompetitionStatus,
  MatchStatus,
  PrismaClient,
  RefereeStatus,
} from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }) });

const publicReferees = [
  { code: "R-001", name: "王相翰", eleven: true, futsal: true },
  { code: "R-002", name: "胡兵", eleven: true, futsal: true },
  { code: "R-003", name: "李子杨", eleven: false, futsal: true },
  { code: "R-004", name: "朱俊驰", eleven: false, futsal: true },
  { code: "R-005", name: "马俊", eleven: true, futsal: true },
  { code: "R-006", name: "颜铭宣", eleven: true, futsal: true },
  { code: "R-007", name: "高羽键", eleven: true, futsal: true },
  { code: "R-008", name: "魏宇轩", eleven: true, futsal: true },
  { code: "R-009", name: "彭云逸", eleven: true, futsal: false },
  { code: "R-011", name: "陈飞宇", eleven: true, futsal: false },
  { code: "R-012", name: "陈昊", eleven: true, futsal: false },
  { code: "R-013", name: "顾一帆", eleven: true, futsal: false },
  { code: "R-014", name: "郭原序", eleven: true, futsal: false },
  { code: "R-015", name: "黄泽鑫", eleven: true, futsal: true },
  { code: "R-016", name: "季子杨", eleven: true, futsal: false },
  { code: "R-017", name: "李乐言", eleven: true, futsal: false },
  { code: "R-018", name: "刘晋毅", eleven: true, futsal: false },
  { code: "R-019", name: "穆怡馨", eleven: true, futsal: false },
  { code: "R-020", name: "倪树伟", eleven: true, futsal: false },
  { code: "R-021", name: "王睿阳", eleven: true, futsal: false },
  { code: "R-022", name: "吴佳宇", eleven: true, futsal: false },
  { code: "R-023", name: "吴作昊", eleven: true, futsal: false },
  { code: "R-024", name: "阿合卓勒·叶尔麦克", eleven: true, futsal: false },
  { code: "R-025", name: "朱俊弛", eleven: true, futsal: false },
  { code: "R-026", name: "张娟", eleven: false, futsal: true },
] as const;

async function main() {
  await prisma.referee.updateMany({ data: { status: RefereeStatus.INACTIVE } });
  for (const referee of publicReferees) {
    await prisma.referee.upsert({
      where: { publicCode: referee.code },
      update: {
        name: referee.name,
        status: RefereeStatus.ACTIVE,
        elevenASide: referee.eleven,
        futsal: referee.futsal,
      },
      create: {
        publicCode: referee.code,
        name: referee.name,
        status: RefereeStatus.ACTIVE,
        elevenASide: referee.eleven,
        futsal: referee.futsal,
        sourceNote: "赛制标记仅依据男子杯注册裁判员名单或女足实际执裁岗位；不含联系方式。",
      },
    });
  }

  const women = await prisma.competition.upsert({
    where: { slug: "2026-womens-intercollege-cup" },
    update: {},
    create: {
      slug: "2026-womens-intercollege-cup",
      name: "2026年南京航空航天大学女子足球院际杯（天目湖校区）",
      year: 2026,
      campus: "天目湖校区",
      format: CompetitionFormat.FUTSAL,
      status: CompetitionStatus.COMPLETED,
    },
  });
  const humanities = await prisma.team.upsert({
    where: { competitionId_name: { competitionId: women.id, name: "人文外国语自动化联队" } },
    update: {}, create: { competitionId: women.id, name: "人文外国语自动化联队" },
  });
  const economics = await prisma.team.upsert({
    where: { competitionId_name: { competitionId: women.id, name: "经济与管理学院" } },
    update: {}, create: { competitionId: women.id, name: "经济与管理学院" },
  });
  const womenFinal = await prisma.match.upsert({
    where: { slug: "2026-womens-intercollege-cup-final" },
    update: {},
    create: {
      slug: "2026-womens-intercollege-cup-final", competitionId: women.id, stage: "决赛",
      kickoff: new Date("2026-05-30T19:00:00+08:00"), venue: "天目湖校区西操场五人制球场",
      homeTeamId: humanities.id, awayTeamId: economics.id, homeScore: 2, awayScore: 0,
      status: MatchStatus.COMPLETED, applicationWindowStatus: ApplicationWindowStatus.CLOSED,
    },
  });

  const finalOfficials = [
    ["REFEREE", "裁判员", 1, "R-005"],
    ["SECOND_REFEREE", "第二裁判员", 2, "R-007"],
    ["THIRD_REFEREE", "第三裁判员", 3, "R-008"],
    ["TIMEKEEPER", "计时员", 4, "R-002"],
  ] as const;
  const historical = await prisma.refereeAppointment.upsert({
    where: { matchId: womenFinal.id },
    update: { status: AppointmentStatus.PUBLISHED },
    create: {
      matchId: womenFinal.id, status: AppointmentStatus.PUBLISHED,
      publicationNote: "根据公开赛事归档录入。", publishedAt: new Date("2026-05-30T12:00:00+08:00"),
    },
  });
  for (const [key, label, sortOrder, publicCode] of finalOfficials) {
    const referee = await prisma.referee.findUniqueOrThrow({ where: { publicCode } });
    await prisma.appointmentPosition.upsert({
      where: { appointmentId_key: { appointmentId: historical.id, key } },
      update: { refereeId: referee.id, label, sortOrder },
      create: { appointmentId: historical.id, refereeId: referee.id, key, label, sortOrder },
    });
  }

  const testCompetition = await prisma.competition.upsert({
    where: { slug: "local-referee-mvp-test" },
    update: {},
    create: {
      slug: "local-referee-mvp-test", name: "裁判中心本地功能测试赛",
      year: 2099, campus: "本地测试环境", format: CompetitionFormat.ELEVEN_A_SIDE,
      status: CompetitionStatus.PREPARING, isTestData: true,
    },
  });
  const testHome = await prisma.team.upsert({
    where: { competitionId_name: { competitionId: testCompetition.id, name: "功能测试甲队" } },
    update: {}, create: { competitionId: testCompetition.id, name: "功能测试甲队" },
  });
  const testAway = await prisma.team.upsert({
    where: { competitionId_name: { competitionId: testCompetition.id, name: "功能测试乙队" } },
    update: {}, create: { competitionId: testCompetition.id, name: "功能测试乙队" },
  });
  await prisma.match.upsert({
    where: { slug: "local-referee-mvp-open-match" },
    update: {
      applicationWindowStatus: ApplicationWindowStatus.OPEN,
      applicationDeadline: new Date("2099-09-28T20:00:00+08:00"),
    },
    create: {
      slug: "local-referee-mvp-open-match", competitionId: testCompetition.id, stage: "功能验收",
      kickoff: new Date("2099-10-01T14:00:00+08:00"), venue: "本地功能测试场地",
      homeTeamId: testHome.id, awayTeamId: testAway.id, status: MatchStatus.SCHEDULED,
      applicationWindowStatus: ApplicationWindowStatus.OPEN,
      applicationDeadline: new Date("2099-09-28T20:00:00+08:00"), isTestData: true,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : "unknown error");
    await prisma.$disconnect();
    process.exit(1);
  });
