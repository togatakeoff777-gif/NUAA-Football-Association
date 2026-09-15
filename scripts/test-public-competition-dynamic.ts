import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createClient, type Client } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";

const migrationName = "20260913120000_public_competition_dynamic_r1";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function runPrismaMigrate(databaseUrl: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
      {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databaseUrl, RUST_LOG: "trace" },
        stdio: "inherit",
      },
    );
    child.once("error", reject);
    child.once("exit", (code) => code === 0
      ? resolve()
      : reject(new Error(`Prisma migrate deploy exited ${code ?? "unknown"}.`)));
  });
}

async function migrationEntries() {
  return (await readdir(path.resolve("prisma/migrations"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function apply(client: Client, name: string) {
  const sql = await readFile(path.resolve("prisma/migrations", name, "migration.sql"), "utf8");
  await client.executeMultiple(sql);
}

async function rowCount(client: Client, table: string) {
  const result = await client.execute(`SELECT COUNT(*) AS count FROM "${table}"`);
  return Number(result.rows[0]?.count ?? 0);
}

async function verifyExistingDatabaseMigration(databasePath: string) {
  const client = createClient({ url: `file:${databasePath.replaceAll("\\", "/")}` });
  try {
    const entries = await migrationEntries();
    const migrationIndex = entries.indexOf(migrationName);
    assert(migrationIndex >= 0, "The public Competition migration is missing.");
    for (const entry of entries.slice(0, migrationIndex)) await apply(client, entry);
    await client.executeMultiple(`
      INSERT INTO "Competition" ("id","slug","name","year","campus","format","status","isTestData","source","createdAt","updatedAt")
      VALUES ('existing-competition','existing-competition','既有赛事',2026,'天目湖校区','ELEVEN_A_SIDE','ONGOING',0,'MANUAL',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
      INSERT INTO "Team" ("id","competitionId","name","teamType","source") VALUES
        ('existing-home','existing-competition','既有主队','FREEFORM','MANUAL'),
        ('existing-away','existing-competition','既有客队','FREEFORM','MANUAL');
      INSERT INTO "Match" ("id","slug","competitionId","stage","kickoff","venue","source","homeTeamId","awayTeamId","status","applicationWindowStatus","isTestData","createdAt","updatedAt")
      VALUES ('existing-match','existing-match','existing-competition','小组赛','2030-09-01T10:00:00.000Z','既有球场','MANUAL','existing-home','existing-away','SCHEDULED','CLOSED',0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
    `);
    const tables = ["Competition", "Team", "Match"] as const;
    const before = Object.fromEntries(await Promise.all(tables.map(async (table) => [table, await rowCount(client, table)])));
    await apply(client, migrationName);
    const after = Object.fromEntries(await Promise.all(tables.map(async (table) => [table, await rowCount(client, table)])));
    assert(JSON.stringify(after) === JSON.stringify(before), "Existing Competition relationships changed during migration.");
    const row = (await client.execute(`
      SELECT c."name", c."publicPublished", c."homepageFeatured", c."publicOrder",
             t."competitionId" AS teamCompetitionId, m."competitionId" AS matchCompetitionId
      FROM "Competition" c
      JOIN "Team" t ON t."id" = 'existing-home'
      JOIN "Match" m ON m."id" = 'existing-match'
      WHERE c."id" = 'existing-competition'
    `)).rows[0];
    assert(
      row?.name === "既有赛事" &&
      Number(row.publicPublished) === 0 &&
      Number(row.homepageFeatured) === 0 &&
      Number(row.publicOrder) === 0 &&
      row.teamCompetitionId === "existing-competition" &&
      row.matchCompetitionId === "existing-competition",
      "Existing data or additive defaults were not preserved.",
    );
    const foreignKeys = await client.execute("PRAGMA foreign_key_check");
    assert(foreignKeys.rows.length === 0, "Existing database migration produced foreign key violations.");
    const integrity = await client.execute("PRAGMA integrity_check");
    assert(integrity.rows[0]?.integrity_check === "ok", "Existing database integrity check failed.");
    return { before, foreignKeyViolations: foreignKeys.rows.length, integrity: "ok" };
  } finally {
    client.close();
  }
}

async function expectInputFailure(run: () => unknown, text: string) {
  try {
    run();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(text), `Expected input failure containing ${text}.`);
    return;
  }
  throw new Error(`Expected input failure containing ${text}.`);
}

async function verifyDomain(databaseUrl: string) {
  process.env.DATABASE_URL = databaseUrl;
  process.env.TZ = "Europe/London";
  const input = await import("../src/lib/referee-competition-input");
  const time = await import("../src/lib/beijing-datetime");
  const service = await import("../src/lib/referee-competition-service");
  const verifier = new PrismaClient({ adapter: new PrismaLibSql({ url: databaseUrl }) });
  const actor = { id: "dynamic-test-admin", role: "SUPER_ADMIN" as const };
  const valid = {
    slug: "freshman-cup",
    name: "动态新生杯",
    shortName: "动态新生杯",
    year: 2026,
    campus: "将军路校区",
    format: "ELEVEN_A_SIDE",
    status: "PREPARING",
    semesterLabel: "上半学期",
    teamFormation: "院系组队",
    publicPublished: false,
    homepageFeatured: true,
    publicOrder: 10,
    registrationStartAt: "2026-09-25T18:30",
    registrationEndAt: "2026-09-30T18:30",
    matchStartAt: "2026-10-01T18:30",
    matchEndAt: "2026-10-31T20:30",
    venue: "动态测试球场",
    host: "动态测试主办",
    organizer: "动态测试承办",
    summary: "不得写入审计元数据的动态简介标记",
    notice: "不得写入审计元数据的动态公告标记",
    registrationUrl: "https://example.edu.cn/register",
  } as const;
  try {
    const parsed = input.readCompetitionCreateInput(valid);
    assert(parsed.registrationStartAt?.toISOString() === "2026-09-25T10:30:00.000Z", "Beijing input was stored at the wrong instant.");
    assert(time.formatBeijingDateTime(parsed.registrationStartAt!).dateTimeLabel === "2026.09.25 18:30", "Beijing display drifted under a non-China process timezone.");
    const created = await service.createCompetition(parsed, actor);
    assert(created.slug === "freshman-cup" && created.source === "MANUAL", "Stable manual Competition creation failed.");
    const createAudit = await verifier.auditLog.findFirstOrThrow({ where: { entityId: created.id, action: "COMPETITION_CREATED" } });
    assert(createAudit.actorId === actor.id, "Competition creation did not record its actor.");
    assert(!createAudit.metadata?.includes(valid.summary) && !createAudit.metadata?.includes(valid.notice), "Long public text leaked into creation audit metadata.");

    const { slug: stableSlug, ...editable } = valid;
    assert(stableSlug === "freshman-cup", "Test fixture stable slug changed unexpectedly.");
    const updatedInput = input.readCompetitionUpdateInput({ ...editable, status: "REGISTRATION", publicPublished: true });
    const updated = await service.updateCompetition(created.id, updatedInput, actor);
    assert(updated.status === "REGISTRATION" && updated.publicPublished, "Competition update did not persist public status.");
    const updateAudit = await verifier.auditLog.findFirstOrThrow({ where: { entityId: created.id, action: "COMPETITION_UPDATED" }, orderBy: { createdAt: "desc" } });
    const metadata = JSON.parse(updateAudit.metadata ?? "{}") as Record<string, unknown>;
    assert(JSON.stringify(metadata).includes("statusChange") && JSON.stringify(metadata).includes("publicPublishedChange"), "Audit metadata omitted status/publication changes.");
    assert(!updateAudit.metadata?.includes(valid.summary) && !updateAudit.metadata?.includes(valid.notice), "Long public text leaked into update audit metadata.");

    await expectInputFailure(() => input.readCompetitionCreateInput({ ...valid, slug: "Freshman-Cup" }), "小写字母");
    await expectInputFailure(() => input.readCompetitionCreateInput({ ...valid, slug: "../freshman-cup" }), "小写字母");
    await expectInputFailure(() => input.readCompetitionCreateInput({ ...valid, slug: "freshman cup" }), "小写字母");
    await expectInputFailure(() => input.readCompetitionCreateInput({ ...valid, registrationUrl: "javascript:alert(1)" }), "仅支持");
    await expectInputFailure(() => input.readCompetitionCreateInput({ ...valid, registrationUrl: "//evil.example" }), "安全的");
    await expectInputFailure(() => input.readCompetitionCreateInput({ ...valid, summary: "x".repeat(2001) }), "2000");
    await expectInputFailure(() => input.readCompetitionCreateInput({ ...valid, registrationEndAt: "2026-09-20T18:30" }), "不能晚于");
    await expectInputFailure(() => input.readCompetitionCreateInput({ ...valid, registrationStartAt: "2026-02-30T18:30" }), "不是有效");
    await expectInputFailure(() => input.readCompetitionUpdateInput({ ...valid }), "创建后不可");

    let duplicateRejected = false;
    try {
      await service.createCompetition(parsed, actor);
    } catch (error) {
      duplicateRejected = error instanceof Error && error.message.includes("已存在");
    }
    assert(duplicateRejected, "Duplicate stable slug was not rejected cleanly.");

    const legacy = await service.createCompetition({
      name: "既有内部调用兼容赛事",
      format: "FUTSAL",
      status: "PREPARING",
    }, actor);
    assert(legacy.slug.startsWith("manual-competition-"), "Legacy internal create compatibility regressed.");
    return {
      stableSlug: true,
      auditFieldNamesOnly: true,
      inputValidation: true,
      beijingStoredInstant: parsed.registrationStartAt?.toISOString(),
      beijingDisplay: time.formatBeijingDateTime(parsed.registrationStartAt!).dateTimeLabel,
    };
  } finally {
    await verifier.$disconnect();
    await (await import("../src/lib/prisma")).prisma.$disconnect();
  }
}

async function runWorker(root: string) {
  const freshPath = path.join(root, "fresh.db");
  const existingPath = path.join(root, "existing.db");
  const freshUrl = `file:${freshPath.replaceAll("\\", "/")}`;
  await runPrismaMigrate(freshUrl);
  const fresh = createClient({ url: freshUrl });
  const columns = await fresh.execute('PRAGMA table_info("Competition")');
  const columnNames = new Set(columns.rows.map((row) => String(row.name)));
  for (const name of ["publicPublished", "homepageFeatured", "registrationStartAt", "registrationUrl"]) {
    assert(columnNames.has(name), `Fresh migration is missing Competition.${name}.`);
  }
  const freshForeignKeys = await fresh.execute("PRAGMA foreign_key_check");
  assert(freshForeignKeys.rows.length === 0, "Fresh migration produced foreign key violations.");
  fresh.close();
  const existing = await verifyExistingDatabaseMigration(existingPath);
  const domain = await verifyDomain(freshUrl);
  console.log(JSON.stringify({
    migration: migrationName,
    freshDatabase: "PASS",
    existingDatabase: "PASS",
    freshForeignKeyViolations: freshForeignKeys.rows.length,
    existing,
    domain,
  }, null, 2));
}

async function main() {
  const workerRoot = process.env.PUBLIC_COMPETITION_DYNAMIC_WORKER_ROOT;
  if (workerRoot) {
    await runWorker(workerRoot);
    return;
  }
  const root = await mkdtemp(path.join(os.tmpdir(), "nuaafa-public-competition-dynamic-"));
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        ["--import", "tsx", path.resolve("scripts/test-public-competition-dynamic.ts")],
        {
          cwd: process.cwd(),
          env: { ...process.env, PUBLIC_COMPETITION_DYNAMIC_WORKER_ROOT: root },
          stdio: "inherit",
        },
      );
      child.once("error", reject);
      child.once("exit", (code) => code === 0
        ? resolve()
        : reject(new Error(`Public Competition dynamic worker exited ${code ?? "unknown"}.`)));
    });
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  },
);
