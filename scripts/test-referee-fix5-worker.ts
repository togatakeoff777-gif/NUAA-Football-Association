import { randomBytes } from "node:crypto";
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
  const databasePath = process.env.REFEREE_FIX5_TEST_DATABASE_PATH;
  if (!databasePath) throw new Error("REFEREE_FIX5_TEST_DATABASE_PATH is required.");
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  process.env.DATABASE_URL = url;
  process.env.REFEREE_ADMIN_SESSION_SECRET = randomBytes(32).toString("base64url");
  process.env.REFEREE_MEMBER_SESSION_SECRET = randomBytes(32).toString("base64url");
  await applyMigrations(url);

  const verifier = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  const competitionService = await import("../src/lib/referee-competition-service");
  const refereeService = await import("../src/lib/referee-service");
  const r1 = await import("../src/lib/referee-r1-service");
  const affiliationOptions = await import("../src/lib/referee-affiliation-options");
  const { prisma } = await import("../src/lib/prisma");
  const actor = { id: null, role: "SUPER_ADMIN" as const };

  try {
    assert(await verifier.competition.count() === 0, "增量迁移后的空数据库不应预生成赛事。");
    const competitionListSource = await readFile(path.resolve("src/app/referees/admin/(dashboard)/matches/competitions/page.tsx"), "utf8");
    const newMatchSource = await readFile(path.resolve("src/app/referees/admin/(dashboard)/matches/new/page.tsx"), "utf8");
    const matchFormSource = await readFile(path.resolve("src/components/referees/admin/admin-match-form.tsx"), "utf8");
    const affiliationManagerSource = await readFile(path.resolve("src/components/referees/admin/admin-data-managers.tsx"), "utf8");
    assert(competitionListSource.includes("当前尚未创建赛事") && competitionListSource.includes("新建赛事"), "赛事列表缺少明确空状态和新建入口。");
    assert(newMatchSource.includes("当前没有可用赛事，请先创建赛事"), "新建比赛页缺少空赛事提示。");
    assert(affiliationManagerSource.includes("请先创建赛事后再创建参赛球队"), "组织与球队操作缺少空赛事提示。");

    const competition = await competitionService.createCompetition({
      name: "2026 新生杯",
      year: 2026,
      format: "ELEVEN_A_SIDE",
      status: "ONGOING",
    }, actor);
    assert(competition.source === "MANUAL" && competition.externalCompetitionId === null && competition.lastSyncedAt === null, "手工赛事数据来源或同步预留字段不正确。");
    assert((await verifier.competition.findMany()).some((item) => item.id === competition.id), "新建赛事未出现在赛事列表数据源。");
    await competitionService.updateCompetition(competition.id, {
      name: "2026 新生杯（验收）",
      year: 2026,
      format: "ELEVEN_A_SIDE",
      status: "REGISTRATION",
    }, actor);
    const editedCompetition = await verifier.competition.findUniqueOrThrow({ where: { id: competition.id } });
    assert(editedCompetition.name === "2026 新生杯（验收）" && editedCompetition.status === "REGISTRATION" && editedCompetition.source === "MANUAL", "赛事基础资料编辑或 source 保持失败。");

    const units = await verifier.affiliationUnit.findMany({
      include: { legacyCollege: { include: { codeMappings: true } } },
    });
    const sortedUnits = affiliationOptions.sortAffiliationOptions(units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      type: unit.type,
      prefixes: unit.legacyCollege?.codeMappings.map((mapping) => mapping.prefix) ?? [],
    })));
    const collegeLabels = sortedUnits.filter((unit) => unit.type === "COLLEGE").map(affiliationOptions.affiliationOptionLabel);
    const expectedCollegeLabels = [
      "01 航空学院", "02 能源与动力学院", "03 自动化学院", "04 电子信息工程学院", "05 机电学院",
      "06 材料科学与技术学院", "07 民航学院", "08 数学学院", "09 经济与管理学院", "10 人文与社会科学学院",
      "11 艺术学院", "12 外国语学院", "15 航天学院", "16 计算机科学与技术学院/软件学院", "17 马克思主义学院",
      "18 长空学院", "19 国际教育学院", "20 通用航空与飞行学院", "21 物理学院", "22 集成电路学院",
      "24 人工智能学院", "26 伦敦国际学院", "CG/CZ 继续教育学院",
    ];
    assert(collegeLabels.join("|") === expectedCollegeLabels.join("|"), "学院未按统一权威前缀顺序排列或展示代码标签。");
    assert(
      sortedUnits.filter((unit) => unit.type === "SHUYUAN").map((unit) => unit.name).join("|")
        === "致慧书院|致元书院|致微书院|致和书院",
      "书院未独立分组或顺序不正确。",
    );
    const selectorSources = await Promise.all([
      "src/app/referees/admin/(dashboard)/affiliations/page.tsx",
      "src/app/referees/admin/(dashboard)/referees/page.tsx",
      "src/app/referees/admin/(dashboard)/referees/new/page.tsx",
      "src/app/referees/admin/(dashboard)/referees/[id]/page.tsx",
      "src/app/referees/admin/(dashboard)/matches/new/page.tsx",
      "src/app/referees/admin/(dashboard)/matches/[id]/edit/page.tsx",
    ].map((file) => readFile(path.resolve(file), "utf8")));
    assert(selectorSources.every((source) => source.includes("referee-affiliation-options")), "仍有后台组织选择器未复用统一排序 helper。");
    assert(affiliationManagerSource.includes("AdminAffiliationOptionGroups") && matchFormSource.includes('optgroup label="学院代表队"') && matchFormSource.includes('optgroup label="书院代表队"'), "学院与书院未在联合队、批量代表队或比赛选择器中正确分组。");

    const aviation = units.find((unit) => unit.name === "航空学院")!;
    const energy = units.find((unit) => unit.name === "能源与动力学院")!;
    const civilAviation = units.find((unit) => unit.name === "民航学院")!;
    const zhihui = units.find((unit) => unit.name === "致慧书院")!;
    assert(aviation && energy && civilAviation && zhihui, "测试所需组织单位缺失。");

    const freeformResult = await r1.createTeamsBulk({
      competitionId: competition.id,
      names: ["快乐足球队", "银河战舰"],
      actor,
    });
    assert(freeformResult.createdNames.length === 2, "自由队批量创建回归失败。");
    const freeform = await verifier.team.findUniqueOrThrow({ where: { competitionId_name: { competitionId: competition.id, name: "快乐足球队" } } });
    assert(freeform.teamType === "FREEFORM" && await verifier.teamUnitAffiliation.count({ where: { teamId: freeform.id } }) === 0, "自由队不应强制组织归属。");
    const joint = await r1.createJointTeam({ competitionId: competition.id, name: "航空能动联队", unitIds: [aviation.id, energy.id], actor });
    assert(joint.teamType === "JOINT" && await verifier.teamUnitAffiliation.count({ where: { teamId: joint.id } }) === 2, "联合队多组织关联回归失败。");
    const fromUnits = await r1.createTeamsFromUnits({ competitionId: competition.id, unitIds: [civilAviation.id], actor });
    assert(fromUnits.createdNames.join() === "民航学院", "从组织批量创建代表队回归失败。");

    const matchInput = {
      competitionId: competition.id,
      kickoff: new Date("2030-09-18T16:00:00+08:00"),
      endAt: new Date("2030-09-18T18:00:00+08:00"),
      venue: "西操场",
      status: "SCHEDULED" as const,
      applicationWindowStatus: "CLOSED" as const,
      positionCounts: { REFEREE: 1 },
    };
    const firstMatch = await refereeService.createMatchFromSelections({
      ...matchInput,
      slug: "fix5-on-demand-first",
      stage: "第一轮",
      homeTeamSelection: `unit:${aviation.id}`,
      awayTeamSelection: `unit:${zhihui.id}`,
    }, actor);
    const firstMatchRecord = await verifier.match.findUniqueOrThrow({
      where: { id: firstMatch.id },
      include: { homeTeam: { include: { unitAffiliations: true } }, awayTeam: { include: { unitAffiliations: true } } },
    });
    assert(firstMatchRecord.competitionId === competition.id && firstMatchRecord.homeTeam.name === "航空学院" && firstMatchRecord.awayTeam.name === "致慧书院", "比赛的 Competition / Team 引用不正确。");
    assert(firstMatchRecord.homeTeam.unitAffiliations.some((link) => link.unitId === aviation.id) && firstMatchRecord.awayTeam.unitAffiliations.some((link) => link.unitId === zhihui.id), "按需创建的学院或书院代表队缺少组织关联。");
    assert(!/^\d{2}\s/.test(firstMatchRecord.homeTeam.name) && !firstMatchRecord.homeTeam.name.includes("CG/CZ"), "正式 Team.name 错误包含学院代码。");

    await refereeService.createMatchFromSelections({
      ...matchInput,
      slug: "fix5-on-demand-reuse",
      stage: "第二轮",
      kickoff: new Date("2030-09-19T16:00:00+08:00"),
      endAt: new Date("2030-09-19T18:00:00+08:00"),
      homeTeamSelection: `unit:${aviation.id}`,
      awayTeamSelection: `team:${freeform.id}`,
    }, actor);
    assert(await verifier.team.count({ where: { competitionId: competition.id, name: "航空学院" } }) === 1, "再次使用组织代表队时产生重复 Team。");
    assert((await verifier.team.findMany({ where: { competitionId: competition.id } })).some((team) => team.id === joint.id), "联合队未保持为比赛候选球队。");
    assert((await verifier.team.findMany({ where: { competitionId: competition.id } })).some((team) => team.id === freeform.id), "自由队未保持为比赛候选球队。");

    const rollbackCompetition = await competitionService.createCompetition({ name: "回滚测试赛事", format: "FUTSAL", status: "PREPARING" }, actor);
    let sameTeamRejected = false;
    try {
      await refereeService.createMatchFromSelections({
        ...matchInput,
        competitionId: rollbackCompetition.id,
        slug: "fix5-same-team",
        stage: "同队检查",
        homeTeamSelection: `unit:${energy.id}`,
        awayTeamSelection: `unit:${energy.id}`,
      }, actor);
    } catch (error) {
      sameTeamRejected = error instanceof Error && error.message === "比赛双方不能相同。";
    }
    assert(sameTeamRejected, "服务端未拒绝相同主客队。");
    assert(await verifier.team.count({ where: { competitionId: rollbackCompetition.id } }) === 0, "相同主客队失败后按需创建 Team 未事务回滚。");

    assert(matchFormSource.includes("disabled={!competition}") && matchFormSource.includes("请先选择赛事"), "未选择赛事时主客队未禁用或缺少提示。");
    assert(matchFormSource.includes('setHomeTeamSelection(""); setAwayTeamSelection("")'), "更换赛事时未清空原主客队选择。");
    assert(matchFormSource.includes('optgroup label="本赛事已有球队"'), "新建比赛未列出本赛事已有球队组。");
    assert(competitionListSource.includes("新建比赛") && competitionListSource.includes("管理球队"), "赛事列表缺少后续工作流快捷入口。");
    assert(affiliationManagerSource.includes("普通学院/书院代表队可在创建比赛时按需自动建立"), "球队关联页定位说明不清楚。");
    assert(await verifier.team.count({ where: { competitionId: competition.id } }) >= 6, "创建出的球队未保存在球队关联页的数据源中。");

    console.log(JSON.stringify({
      competitionEmptyState: true,
      manualCompetitionCreateListEdit: true,
      manualSourcePreserved: true,
      competitionAvailableToMatchAndTeams: true,
      unifiedCollegeSorting: true,
      groupedShuyuan: true,
      directCollegeAndShuyuanSelection: true,
      organizationTeamsCreatedOnDemand: true,
      organizationTeamsReused: true,
      formalTeamNamesExcludeCodes: true,
      jointAndFreeformRegression: true,
      fromUnitsRegression: true,
      matchReferencesCorrect: true,
      noCompetitionFormState: true,
      competitionChangeClearsTeams: true,
      sameTeamRejectedAndRolledBack: true,
    }, null, 2));
  } finally {
    await verifier.$disconnect();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "Referee Fix #5 test failed.");
  process.exit(1);
});
