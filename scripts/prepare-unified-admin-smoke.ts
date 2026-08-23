import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";
import { hashPassword } from "../src/lib/referee-security";

async function main() {
  const databasePath = process.env.UNIFIED_ADMIN_SMOKE_DATABASE_PATH;
  if (!databasePath || !path.isAbsolute(databasePath)) {
    throw new Error("UNIFIED_ADMIN_SMOKE_DATABASE_PATH must be an isolated absolute path.");
  }
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  const raw = createClient({ url });
  const entries = (await readdir(path.resolve("prisma/migrations"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    await raw.executeMultiple(await readFile(path.resolve("prisma/migrations", entry.name, "migration.sql"), "utf8"));
  }
  raw.close();

  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  try {
    const password = "Smoke-Password-2026!";
    const passwordHash = await hashPassword(password);
    const accounts = await Promise.all([
      prisma.adminAccount.create({ data: { username: "smoke-super", displayName: "冒烟超级管理员", passwordHash, role: "SUPER_ADMIN" } }),
      prisma.adminAccount.create({ data: { username: "smoke-content", displayName: "冒烟内容编辑", passwordHash, role: "REFEREE_MANAGER" } }),
      prisma.adminAccount.create({ data: { username: "smoke-competition", displayName: "冒烟赛事管理员", passwordHash, role: "REFEREE_MANAGER" } }),
      prisma.adminAccount.create({ data: { username: "smoke-referee", displayName: "冒烟裁判管理员", passwordHash, role: "REFEREE_MANAGER" } }),
    ]);
    await prisma.adminRoleAssignment.createMany({ data: [
      { adminAccountId: accounts[1].id, role: "CONTENT_EDITOR" },
      { adminAccountId: accounts[2].id, role: "COMPETITION_ADMIN" },
      { adminAccountId: accounts[3].id, role: "REFEREE_ADMIN" },
    ] });
    const competition = await prisma.competition.create({ data: {
      slug: "smoke-competition",
      name: "R1 浏览器隔离测试赛事",
      year: 2026,
      campus: "天目湖",
      format: "ELEVEN_A_SIDE",
      status: "ONGOING",
      isTestData: true,
    } });
    await prisma.referee.create({ data: {
      publicCode: "SMOKE-R1-001",
      name: "R1 浏览器隔离测试裁判",
      status: "ACTIVE",
      elevenASide: true,
      currentAffiliationUnitId: null,
    } });
    console.log(JSON.stringify({ databasePath, password, competitionId: competition.id, accounts: accounts.map(({ username }) => username) }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
