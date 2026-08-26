import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";
import { hashPassword } from "../src/lib/referee-security";

async function main() {
  const databasePath = process.env.UNIFIED_ADMIN_SMOKE_DATABASE_PATH;
  const uploadRoot = process.env.NUAAFA_UPLOAD_DIR;
  if (!databasePath || !path.isAbsolute(databasePath)) {
    throw new Error("UNIFIED_ADMIN_SMOKE_DATABASE_PATH must be an isolated absolute path.");
  }
  if (!uploadRoot || !path.isAbsolute(uploadRoot)) throw new Error("NUAAFA_UPLOAD_DIR must be an isolated absolute path.");
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
      prisma.adminAccount.create({ data: { username: "smoke-multi", displayName: "冒烟竞赛部部长", passwordHash, role: "REFEREE_MANAGER" } }),
    ]);
    const requiredAccounts = await Promise.all([
      prisma.adminAccount.create({ data: { username: "required-super", displayName: "强制改密超级管理员", passwordHash, role: "SUPER_ADMIN", mustChangePassword: true } }),
      prisma.adminAccount.create({ data: { username: "required-content", displayName: "强制改密内容编辑", passwordHash, role: "REFEREE_MANAGER", mustChangePassword: true } }),
      prisma.adminAccount.create({ data: { username: "required-competition", displayName: "强制改密赛事管理员", passwordHash, role: "REFEREE_MANAGER", mustChangePassword: true } }),
      prisma.adminAccount.create({ data: { username: "required-referee", displayName: "强制改密裁判管理员", passwordHash, role: "REFEREE_MANAGER", mustChangePassword: true } }),
    ]);
    await prisma.adminRoleAssignment.createMany({ data: [
      { adminAccountId: accounts[1].id, role: "CONTENT_EDITOR" },
      { adminAccountId: accounts[2].id, role: "COMPETITION_ADMIN" },
      { adminAccountId: accounts[3].id, role: "REFEREE_ADMIN" },
      { adminAccountId: accounts[4].id, role: "COMPETITION_ADMIN" },
      { adminAccountId: accounts[4].id, role: "REFEREE_ADMIN" },
      { adminAccountId: requiredAccounts[0].id, role: "SUPER_ADMIN" },
      { adminAccountId: requiredAccounts[1].id, role: "CONTENT_EDITOR" },
      { adminAccountId: requiredAccounts[2].id, role: "COMPETITION_ADMIN" },
      { adminAccountId: requiredAccounts[3].id, role: "REFEREE_ADMIN" },
    ] });
    const mediaDirectory = path.join(uploadRoot, "2026", "08");
    await mkdir(mediaDirectory, { recursive: true });
    const coverKey = "2026/08/11111111-1111-4111-8111-111111111111.png";
    const pdfKey = "2026/08/22222222-2222-4222-8222-222222222222.pdf";
    const coverBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    const pdfBytes = new TextEncoder().encode("%PDF-1.7\nNUAAFA R1-2 SMOKE\n%%EOF");
    await writeFile(path.join(uploadRoot, ...coverKey.split("/")), coverBytes);
    await writeFile(path.join(uploadRoot, ...pdfKey.split("/")), pdfBytes);
    const cover = await prisma.mediaAsset.create({ data: { storageKey: coverKey, originalFilename: "r1-2-cover.png", storedFilename: path.basename(coverKey), mimeType: "image/png", size: coverBytes.length, visibility: "PUBLIC", altText: "R1-2 新闻封面", uploadedByAdminId: accounts[1].id } });
    const pdf = await prisma.mediaAsset.create({ data: { storageKey: pdfKey, originalFilename: "r1-2-discipline.pdf", storedFilename: path.basename(pdfKey), mimeType: "application/pdf", size: pdfBytes.length, visibility: "PUBLIC", uploadedByAdminId: accounts[1].id } });
    const document = (text: string) => ({ schemaVersion: 1, document: { type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "R1-2 富文本标题" }] }, { type: "paragraph", content: [{ type: "text", text, marks: [{ type: "bold" }] }] }, { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "列表项目" }] }] }] }] } });
    const baseTime = Date.parse("2026-08-01T00:00:00.000Z");
    for (let index = 1; index <= 30; index += 1) {
      await prisma.contentPost.create({ data: {
        slug: index <= 5 ? `smoke-pinned-${index}` : `smoke-news-${String(index - 5).padStart(2, "0")}`,
        type: "NEWS",
        title: index <= 5 ? `R1-2 置顶新闻 ${index}` : `R1-2 数据库新闻 ${String(index - 5).padStart(2, "0")}`,
        summary: "用于隔离浏览器验收的数据库新闻摘要。",
        content: document(`这是第 ${index} 条数据库新闻正文。`),
        status: "PUBLISHED",
        source: "NUAAFA R1-2 Smoke",
        publishedAt: new Date(baseTime + index * 60_000),
        pinned: index <= 5,
        featured: index === 6,
        coverMediaId: cover.id,
        authorAdminId: accounts[1].id,
      } });
    }
    const discipline = await prisma.contentPost.create({ data: { slug: "smoke-discipline", type: "DISCIPLINE", title: "R1-2 浏览器纪律处罚", summary: "验证纪律处罚正文与正式 PDF。", content: document("纪律处罚正文可由数据库安全渲染。"), status: "PUBLISHED", source: "NUAAFA", publishedAt: new Date("2026-07-01T00:00:00.000Z"), authorAdminId: accounts[1].id, discipline: { create: { officialMediaId: pdf.id, versionLabel: "正式决定", scopeLabel: "R1-2 隔离赛事" } } } });
    const draft = await prisma.contentPost.create({ data: { slug: "smoke-draft", type: "NEWS", title: "R1-2 安全预览草稿", summary: "该内容不得公开，仅用于后台安全预览。", content: document("草稿正文仅 content:read 管理员可见。"), status: "DRAFT", authorAdminId: accounts[1].id } });
    await prisma.contentPost.createMany({ data: [
      { slug: "smoke-archived", type: "NEWS", title: "R1-2 已归档", summary: "不得公开", content: document("归档"), status: "ARCHIVED", authorAdminId: accounts[1].id },
      { slug: "smoke-future", type: "NEWS", title: "R1-2 未来发布", summary: "不得提前公开", content: document("未来"), status: "PUBLISHED", publishedAt: new Date("2030-01-01T00:00:00.000Z"), authorAdminId: accounts[1].id },
    ] });
    const competition = await prisma.competition.create({ data: {
      slug: "smoke-competition",
      name: "R1 浏览器隔离测试赛事",
      year: 2026,
      campus: "天目湖",
      format: "ELEVEN_A_SIDE",
      status: "ONGOING",
      isTestData: false,
    } });
    const smokeReferee = await prisma.referee.create({ data: {
      publicCode: "SMOKE-R1-001",
      name: "R1 浏览器隔离测试裁判",
      passwordHash,
      mustChangePassword: true,
      status: "ACTIVE",
      trainingStatus: "PENDING_ASSESSMENT",
      assignmentEligibility: "NOT_ELIGIBLE",
      elevenASide: true,
      currentAffiliationUnitId: null,
      capabilities: { create: { format: "ELEVEN_A_SIDE", positionKey: "REFEREE", status: "READY" } },
    } });
    const teams = await Promise.all([
      prisma.team.create({ data: { competitionId: competition.id, name: "R1 Smoke 主队" } }),
      prisma.team.create({ data: { competitionId: competition.id, name: "R1 Smoke 客队" } }),
    ]);
    const openMatch = await prisma.match.create({ data: {
      slug: "r1-3a-smoke-open-match",
      competitionId: competition.id,
      stage: "R1-3A Smoke",
      kickoff: new Date("2027-08-30T10:00:00.000Z"),
      endAt: new Date("2027-08-30T12:00:00.000Z"),
      venue: "R1-3A Smoke 场地",
      homeTeamId: teams[0].id,
      awayTeamId: teams[1].id,
      status: "SCHEDULED",
      applicationWindowStatus: "OPEN",
      applicationDeadline: new Date("2027-08-29T10:00:00.000Z"),
      isTestData: false,
      positionRequirements: { create: { key: "REFEREE", label: "裁判员", count: 1, sortOrder: 10 } },
    } });
    const admission = await prisma.refereeAdmissionApplication.create({ data: {
      name: "R1-3A 待审核申请人",
      studentId: "16269999",
      phone: "13800000999",
      qq: "123456789",
      note: "隔离 Browser / HTTP smoke",
    } });
    console.log(JSON.stringify({ databasePath, uploadRoot, password, competitionId: competition.id, openMatchSlug: openMatch.slug, admissionId: admission.id, refereeId: smokeReferee.id, accounts: accounts.map(({ username }) => username), requiredAccounts: requiredAccounts.map(({ username }) => username), coverMediaId: cover.id, pdfMediaId: pdf.id, disciplineId: discipline.id, draftId: draft.id }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
