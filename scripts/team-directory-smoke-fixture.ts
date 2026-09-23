import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";
import { readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";

const databasePath = path.resolve("prisma/test-team-directory-smoke.db");
const url = `file:${databasePath.replaceAll("\\", "/")}`;
const state = process.argv[2];
if (!state || !["prepare", "empty", "zero", "a", "b", "one", "long"].includes(state)) throw new Error("Expected prepare, empty, zero, a, b, one, or long.");

async function main() {
  if (state === "prepare") {
    for (const target of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) await rm(target, { force: true });
    const sql = createClient({ url });
    try {
      const directory = path.resolve("prisma/migrations");
      const entries = (await readdir(directory, { withFileTypes: true })).filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) await sql.executeMultiple(await readFile(path.join(directory, entry.name, "migration.sql"), "utf8"));
    } finally { sql.close(); }
  }
  const db = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  try {
    if (state === "prepare") {
      for (const [slug, name] of [["smoke-a", "2027 男子院际杯"], ["smoke-b", "2027 新生杯"]]) {
        const competition = await db.competition.create({ data: { slug, name, year: 2027, campus: "天目湖校区", format: "FUTSAL", status: "PREPARING" } });
        const names = slug === "smoke-a" ? ["航空学院", "民航学院"] : ["材料学院", "机电学院"];
        for (const [index, teamName] of names.entries()) await db.team.create({ data: { competitionId: competition.id, name: teamName, publicStatus: index ? "已组队" : "招募中", publicContactName: index ? "李四" : "张三", publicContactQQ: `${123456 + index}`, publicContactEmail: `team${index}@example.com`, directoryIsPublic: true, directoryPublicOrder: index } });
      }
      await db.teamDirectorySettings.create({ data: { id: "current", directoryPublished: false, contactName: "负责人 A", contactTitle: "组队联络", contactQQ: "123456", contactEmail: "contact@example.com" } });
    } else {
      const a = await db.competition.findUniqueOrThrow({ where: { slug: "smoke-a" } });
      const b = await db.competition.findUniqueOrThrow({ where: { slug: "smoke-b" } });
      await db.teamDirectorySettings.update({ where: { id: "current" }, data: { activeCompetitionId: state === "empty" ? null : state === "b" ? b.id : a.id, directoryPublished: state !== "empty", contactName: state === "b" ? "负责人 B" : "负责人 A" } });
      await db.team.updateMany({ where: { competitionId: a.id }, data: { directoryIsPublic: true } });
      if (state === "zero") await db.team.updateMany({ where: { competitionId: a.id }, data: { directoryIsPublic: false } });
      if (state === "one") await db.team.updateMany({ where: { competitionId: a.id, name: "民航学院" }, data: { directoryIsPublic: false } });
      if (state === "long") await db.team.updateMany({ where: { competitionId: a.id, name: "航空学院" }, data: { name: "航空学院与跨校联合代表队超长名称示例", publicContactName: "张三四五六七八九十特别长的负责人姓名", publicContactEmail: "very.long.contact.address@example.com" } });
    }
    console.log(`Team Directory smoke fixture: ${state} (${url})`);
  } finally { await db.$disconnect(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
