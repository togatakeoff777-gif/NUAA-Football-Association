import { randomBytes } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
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
  const databasePath = process.env.REFEREE_FIX2_TEST_DATABASE_PATH;
  if (!databasePath) throw new Error("REFEREE_FIX2_TEST_DATABASE_PATH is required.");
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  process.env.DATABASE_URL = url;
  process.env.REFEREE_ADMIN_SESSION_SECRET = randomBytes(32).toString("base64url");
  process.env.REFEREE_MEMBER_SESSION_SECRET = randomBytes(32).toString("base64url");
  process.env.NUAAFA_ISOLATED_SECURITY_TEST = "1";
  await applyMigrations(url);

  const verifier = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  const service = await import("../src/lib/referee-service");
  const r1 = await import("../src/lib/referee-r1-service");
  const conflicts = await import("../src/lib/referee-conflicts");
  const roles = await import("../src/lib/referee-roles");
  const qualifications = await import("../src/lib/referee-qualifications");
  const teamImport = await import("../src/lib/referee-team-import");
  const dto = await import("../src/lib/referee-dto");
  const capabilities = await import("./security-r4a-test-capabilities");
  const { prisma } = await import("../src/lib/prisma");
  const actor = { id: null, role: "SUPER_ADMIN" as const };
  const refereeAuthorization = capabilities.issueTestAdminServiceAuthorization(
    "referees:write",
    capabilities.testUnifiedAdminActor({ isLegacy: true }),
  );

  try {
    const futsalTemplate = roles.getPositionTemplate("FUTSAL");
    assert(
      futsalTemplate.map((item) => `${item.key}:${item.label}`).join("|") ===
        "REFEREE:裁判员|SECOND_REFEREE:第二裁判员|THIRD_REFEREE:第三裁判员|FOURTH_REFEREE:第四裁判员|TIMEKEEPER:计时员",
      "五人制岗位模板未正确包含第四裁判员。",
    );
    assert(qualifications.refereeQualifications.length === 7 && qualifications.refereeQualifications[0] === "暂无正式裁判资质", "裁判资质选项不完整。",
    );

    const unitCounts = await verifier.affiliationUnit.groupBy({ by: ["type"], _count: true });
    assert(unitCounts.find((item) => item.type === "COLLEGE")?._count === 23, "学院权威名单不是 23 个。");
    assert(unitCounts.find((item) => item.type === "SHUYUAN")?._count === 4, "未初始化 4 个书院。");
    assert(await verifier.affiliationUnit.count({ where: { name: "牧星学院" } }) === 0, "错误初始化了牧星学院。");
    assert(await verifier.affiliationUnit.count({ where: { name: "国家卓越工程师学院" } }) === 0, "未移除国家卓越工程师学院。");

    const competition = await verifier.competition.create({
      data: { slug: "fix2-competition", name: "Fix2 校园赛事", campus: "天目湖校区", format: "ELEVEN_A_SIDE", status: "ONGOING" },
    });
    const freeHome = await verifier.team.create({ data: { competitionId: competition.id, name: "自由主队", teamType: "FREEFORM" } });
    const freeAway = await verifier.team.create({ data: { competitionId: competition.id, name: "自由客队", teamType: "FREEFORM" } });

    const capabilities = [
      { format: "ELEVEN_A_SIDE" as const, positionKey: "REFEREE" as const, status: "READY" as const },
      { format: "ELEVEN_A_SIDE" as const, positionKey: "ASSISTANT_REFEREE_1" as const, status: "TRAINING" as const },
      { format: "ELEVEN_A_SIDE" as const, positionKey: "FOURTH_OFFICIAL" as const, status: "NOT_ASSIGNED" as const },
    ];
    const capabilityReferee = await service.createRefereeAccount({
      publicCode: "FIX2-CAP", name: "培养状态裁判", initialPassword: "Fix2-Test-Password-2026", status: "ACTIVE",
      elevenASide: true, futsal: false, trainingStatus: "IN_TRAINING", assignmentEligibility: "ELIGIBLE", publicDirectoryEnabled: false,
      refereeLevel: "国家三级", certificateNote: "CERT-001", qualificationNote: "测试资质备注", capabilities,
    }, refereeAuthorization);
    const savedCapabilities = await verifier.refereePositionCapability.findMany({ where: { refereeId: capabilityReferee.id } });
    assert(new Set(savedCapabilities.map((item) => item.status)).size === 3, "岗位能力三状态未被持久化。" );

    let sequence = 0;
    async function makeReferee(code: string, collegeId?: string) {
      return service.createRefereeAccount({
        publicCode: code, name: code, initialPassword: "Fix2-Test-Password-2026", status: "ACTIVE",
        elevenASide: true, futsal: false, trainingStatus: "QUALIFIED", assignmentEligibility: "ELIGIBLE", publicDirectoryEnabled: true,
        refereeLevel: "暂无正式裁判资质", collegeId,
        capabilities: [{ format: "ELEVEN_A_SIDE", positionKey: "REFEREE", status: "READY" }],
      }, refereeAuthorization);
    }
    async function createMatch(label: string, start: Date, end: Date | null, homeTeamId = freeHome.id, awayTeamId = freeAway.id) {
      sequence += 1;
      return verifier.match.create({ data: {
        slug: `fix2-${label}-${sequence}`, competitionId: competition.id, stage: label, kickoff: start, endAt: end,
        venue: "测试场地", homeTeamId, awayTeamId, status: "SCHEDULED",
      } });
    }
    async function timeWarnings(label: string, gapMinutes: number | null, overlap = false) {
      const referee = await makeReferee(`FIX2-${label}`);
      const targetStart = new Date("2030-01-01T11:00:00+08:00");
      const targetEnd = new Date("2030-01-01T12:00:00+08:00");
      const otherEnd = gapMinutes === null ? null : overlap ? new Date("2030-01-01T11:10:00+08:00") : new Date(targetStart.getTime() - gapMinutes * 60_000);
      const other = await createMatch(`${label}-previous`, new Date("2030-01-01T09:00:00+08:00"), otherEnd);
      await verifier.refereeAppointment.create({ data: { matchId: other.id, status: "PUBLISHED", positions: { create: { key: "REFEREE", label: "裁判员", sortOrder: 1, refereeId: referee.id } } } });
      const target = await createMatch(`${label}-target`, targetStart, targetEnd);
      return conflicts.detectAppointmentWarnings(target.id, [{ key: "REFEREE", refereeId: referee.id }], verifier);
    }
    assert(!(await timeWarnings("GAP30", 30)).some((item) => item.code === "ADJACENT_MATCH"), "30 分钟间隔被错误警告。");
    assert((await timeWarnings("GAP9", 9)).some((item) => item.code === "ADJACENT_MATCH" && item.details.gapMinutes === 9), "9 分钟间隔未产生连续执裁提醒。");
    assert(!(await timeWarnings("GAP10", 10)).some((item) => item.code === "ADJACENT_MATCH"), "10 分钟间隔被错误警告。");
    assert(!(await timeWarnings("GAP11", 11)).some((item) => item.code === "ADJACENT_MATCH"), "11 分钟间隔被错误警告。");
    assert((await timeWarnings("GAP5", 5)).some((item) => item.code === "ADJACENT_MATCH" && item.details.gapMinutes === 5), "5 分钟间隔未产生连续执裁提醒。");
    assert((await timeWarnings("GAP0", 0)).some((item) => item.code === "ADJACENT_MATCH" && item.message.includes("无休息时间")), "0 分钟间隔提示不正确。");
    assert((await timeWarnings("OVERLAP", 0, true)).some((item) => item.code === "MATCH_OVERLAP" && item.details.overlapMinutes === 10), "时间重叠未按 endAt 计算。");
    const missingEndWarnings = await timeWarnings("NOEND", null);
    assert(!missingEndWarnings.some((item) => item.code === "ADJACENT_MATCH" || item.code === "MATCH_OVERLAP"), "缺少 endAt 时系统自行推测了比赛时长。");

    const civil = await verifier.affiliationUnit.findUniqueOrThrow({ where: { name: "民航学院" } });
    const aviation = await verifier.affiliationUnit.findUniqueOrThrow({ where: { name: "航空学院" } });
    const energy = await verifier.affiliationUnit.findUniqueOrThrow({ where: { name: "能源与动力学院" } });
    const zhihui = await verifier.affiliationUnit.findUniqueOrThrow({ where: { name: "致慧书院" } });
    const expectedRelations: Record<string, string[]> = {
      致慧书院: ["民航学院", "自动化学院", "通用航空与飞行学院"],
      致元书院: ["材料科学与技术学院", "数学学院", "计算机科学与技术学院/软件学院", "人工智能学院"],
      致微书院: ["电子信息工程学院", "物理学院", "集成电路学院"],
      致和书院: ["经济与管理学院", "人文与社会科学学院", "艺术学院", "外国语学院"],
    };
    for (const [parentName, children] of Object.entries(expectedRelations)) {
      const actual = await verifier.affiliationUnitRelation.findMany({
        where: { parentUnit: { name: parentName } },
        select: { childUnit: { select: { name: true } } },
      });
      assert(
        actual.map((item) => item.childUnit.name).sort().join("|") === children.sort().join("|"),
        `${parentName}组成关系不正确。`,
      );
    }

    const civilTeam = await verifier.team.create({ data: { competitionId: competition.id, name: "民航学院代表队", teamType: "ORGANIZATION" } });
    await r1.setTeamUnitAffiliations(civilTeam.id, [civil.id], "ORGANIZATION", actor);
    const civilReferee = await makeReferee("FIX2-CIVIL", civil.id);
    const civilMatch = await createMatch("civil-conflict", new Date("2031-01-01T10:00:00+08:00"), new Date("2031-01-01T12:00:00+08:00"), civilTeam.id);
    assert((await conflicts.detectAppointmentWarnings(civilMatch.id, [{ key: "REFEREE", refereeId: civilReferee.id }], verifier)).some((item) => item.code === "COLLEGE_CONFLICT" && item.message.includes("民航学院")), "民航学院直接组织回避未提示。");

    const zhihuiTeam = await verifier.team.create({ data: { competitionId: competition.id, name: "致慧书院", teamType: "ORGANIZATION" } });
    await r1.setTeamUnitAffiliations(zhihuiTeam.id, [zhihui.id], "ORGANIZATION", actor);
    const zhihuiMatch = await createMatch("zhihui-conflict", new Date("2031-01-02T10:00:00+08:00"), new Date("2031-01-02T12:00:00+08:00"), zhihuiTeam.id);
    const zhihuiWarning = (await conflicts.detectAppointmentWarnings(zhihuiMatch.id, [{ key: "REFEREE", refereeId: civilReferee.id }], verifier)).find((item) => item.code === "COLLEGE_CONFLICT");
    assert(zhihuiWarning?.message.includes("组成单位") && !zhihuiWarning.message.includes(`${civilReferee.name}所属致慧书院`), "书院组成单位关联提示错误宣称了直接归属。");

    const jointTeam = await r1.createJointTeam({ competitionId: competition.id, name: "航空能动联队", unitIds: [aviation.id, energy.id], actor });
    const aviationReferee = await makeReferee("FIX2-AVIATION", aviation.id);
    const jointMatch = await createMatch("joint-conflict", new Date("2031-01-03T10:00:00+08:00"), new Date("2031-01-03T12:00:00+08:00"), jointTeam.id);
    assert((await conflicts.detectAppointmentWarnings(jointMatch.id, [{ key: "REFEREE", refereeId: aviationReferee.id }], verifier)).some((item) => item.message.includes("航空学院") && item.message.includes("航空能动联队")), "联合队多组织关联未参与回避判断。");

    const pasted = teamImport.parsePastedTeamNames("丁丁历险记\n\n 海底小纵队 \nBGV\n丁丁历险记\n", []);
    assert(pasted.names.join("|") === "丁丁历险记|海底小纵队|BGV" && pasted.duplicates.length === 1, "粘贴球队名单未正确去空行或去重复。");
    const csv = teamImport.parseTeamCsv('球队名称,备注\n"南波,赛文",A\n蒙的都对,B\n', []);
    assert(csv.names.join("|") === "南波,赛文|蒙的都对" && csv.errors.length === 0, "CSV 球队名称列解析失败。");
    const bulk = await r1.createTeamsBulk({ competitionId: competition.id, names: pasted.names, actor });
    assert(bulk.createdNames.length === 3 && await verifier.team.count({ where: { competitionId: competition.id, teamType: "FREEFORM", unitAffiliations: { none: {} } } }) >= 3, "自由组队被错误要求组织归属或批量创建失败。");

    const publicRecord = await verifier.referee.findUniqueOrThrow({ where: { id: civilReferee.id }, select: dto.publicDirectoryRefereeSelect });
    const publicJson = JSON.stringify(publicRecord);
    assert(!publicJson.includes("民航学院") && !("affiliations" in publicRecord) && !("studentId" in publicRecord), "public DTO 因组织模型扩展泄露了内部归属或敏感字段。");

    console.log(JSON.stringify({
      futsalFourthReferee: true, qualificationOptions: true, capabilityThreeStates: true,
      gap30NoWarning: true, gap9AdjacentWarning: true, gap10NoWarning: true, gap11NoWarning: true, gap5AdjacentWarning: true, zeroGapWarning: true,
      matchOverlap: true, missingEndNotInferred: true, directOrganizationConflict: true,
      shuyuanCompositionConflict: true, jointTeamConflict: true, freeformWithoutAffiliation: true,
      pastedImportDeduplicates: true, csvImport: true, publicDtoBoundary: true,
      colleges: 23, shuyuan: 4, allShuyuanRelations: true,
    }, null, 2));
  } finally {
    await verifier.$disconnect();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "Referee Fix #2 test failed.");
  process.exit(1);
});
