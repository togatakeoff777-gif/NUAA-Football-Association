import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createClient } from "@libsql/client";

import { assertProductionStaticContentPreflight } from "../src/lib/static-content-import-preflight";
import { buildStaticContentManifest } from "../src/lib/static-content-migration";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function rejects(operation: () => Promise<unknown>, message: string) {
  try { await operation(); } catch { return; }
  throw new Error(message);
}

async function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("exit", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

function databaseUrl(databasePath: string) {
  return `file:${databasePath.replaceAll("\\", "/")}`;
}

async function migrate(databasePath: string) {
  const prismaRoot = `${path.resolve("prisma")}${path.sep}`;
  if (!databasePath.startsWith(prismaRoot)) throw new Error("Migration fixture database escaped the workspace prisma directory.");
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : process.execPath;
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npx.cmd prisma migrate deploy"]
    : [path.resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"];
  const result = await run(
    command,
    args,
    { ...process.env, DATABASE_URL: `file:./prisma/${path.basename(databasePath)}`, RUST_LOG: "trace" },
  );
  if (result.code !== 0) throw new Error(`Test migration failed.\n${result.stdout}\n${result.stderr}`);
}

async function counts(databasePath: string) {
  const client = createClient({ url: databaseUrl(databasePath) });
  try {
    const result: Record<string, number> = {};
    for (const table of ["ContentPost", "MediaAsset", "DisciplineDetail"] as const) {
      const rows = await client.execute(`SELECT COUNT(*) AS count FROM "${table}"`);
      result[table] = Number(rows.rows[0]?.count ?? 0);
    }
    return result;
  } finally {
    client.close();
  }
}

function sameCounts(left: Record<string, number>, right: Record<string, number>) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function main() {
  const root = await mkdtemp(path.join(os.tmpdir(), "nuaafa-static-import-gate-"));
  const databasePrefix = `r1-3d-static-import-${randomUUID()}`;
  const productionDatabase = path.resolve("prisma", `${databasePrefix}-production.db`);
  const uploadRoot = path.join(root, "uploads");
  const migrationMismatchDatabase = path.resolve("prisma", `${databasePrefix}-migration-mismatch.db`);
  const wrongSchemaDatabase = path.join(root, "wrong-schema.sqlite");
  await mkdir(uploadRoot, { recursive: true });
  try {
    await migrate(productionDatabase);
    await cp(productionDatabase, migrationMismatchDatabase);
    await writeFile(wrongSchemaDatabase, "");

    const cli = async (
      databasePath: string,
      args: string[],
      authorization: { productionApply?: boolean; isolated?: boolean } = {},
    ) => {
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        DATABASE_URL: databaseUrl(databasePath),
        NUAAFA_UPLOAD_DIR: uploadRoot,
        NUAAFA_CONTENT_SOURCE: "STATIC_SENTINEL_MUST_NOT_CHANGE",
      };
      delete env.NUAAFA_STATIC_IMPORT_PRODUCTION_APPLY;
      delete env.NUAAFA_STATIC_IMPORT_ISOLATED;
      if (authorization.productionApply) env.NUAAFA_STATIC_IMPORT_PRODUCTION_APPLY = "1";
      if (authorization.isolated) env.NUAAFA_STATIC_IMPORT_ISOLATED = "1";
      return run(
        process.execPath,
        [path.resolve("node_modules/tsx/dist/cli.mjs"), path.resolve("scripts/migrate-static-content.ts"), ...args],
        env,
      );
    };

    const initial = await counts(productionDatabase);
    assert(initial.ContentPost === 0 && initial.MediaAsset === 0 && initial.DisciplineDetail === 0, "Production import fixture was not empty.");

    const dryRun = await cli(productionDatabase, ["--production"]);
    assert(dryRun.code === 0 && sameCounts(await counts(productionDatabase), initial), "Production dry run wrote content.");

    const missingAuthorization = await cli(productionDatabase, ["--production", "--apply"]);
    assert(missingAuthorization.code !== 0 && sameCounts(await counts(productionDatabase), initial), "--apply without dedicated authorization wrote content.");

    const environmentOnly = await cli(productionDatabase, ["--production"], { productionApply: true });
    assert(environmentOnly.code === 0 && sameCounts(await counts(productionDatabase), initial), "Production authorization environment without --apply wrote content.");

    const isolatedFlagReuse = await cli(productionDatabase, ["--production", "--apply"], { isolated: true });
    assert(isolatedFlagReuse.code !== 0 && sameCounts(await counts(productionDatabase), initial), "Isolated authorization unlocked production apply.");

    const applied = await cli(productionDatabase, ["--production", "--apply"], { productionApply: true });
    assert(applied.code === 0, `Authorized production import failed.\n${applied.stdout}\n${applied.stderr}`);
    const appliedOutput = JSON.parse(applied.stdout);
    const afterApply = await counts(productionDatabase);
    assert(afterApply.ContentPost === 12 && afterApply.MediaAsset === 11, "Authorized production import did not write the exact frozen inventory.");
    assert(appliedOutput.reconciliation.differences.length === 0, "Authorized production import did not reconcile exactly.");

    const reconcile = await cli(productionDatabase, ["--production", "--reconcile"]);
    assert(reconcile.code === 0 && JSON.parse(reconcile.stdout).reconciliation.differences.length === 0, "Read-only production reconciliation failed.");

    const repeated = await cli(productionDatabase, ["--production", "--apply"], { productionApply: true });
    assert(repeated.code === 0 && sameCounts(await counts(productionDatabase), afterApply), "Repeated authorized production import was not idempotent.");

    const productionFlagCannotUnlockIsolated = await cli(productionDatabase, ["--import"], { productionApply: true });
    assert(productionFlagCannotUnlockIsolated.code !== 0 && sameCounts(await counts(productionDatabase), afterApply), "Production authorization unlocked isolated --import.");
    const isolatedImport = await cli(productionDatabase, ["--import"], { isolated: true });
    assert(isolatedImport.code === 0 && sameCounts(await counts(productionDatabase), afterApply), "Existing isolated importer contract regressed.");

    const wrongSchema = await cli(wrongSchemaDatabase, ["--production"]);
    assert(wrongSchema.code !== 0, "Production preflight accepted a database with the wrong schema.");

    const mismatchClient = createClient({ url: databaseUrl(migrationMismatchDatabase) });
    try {
      await mismatchClient.execute('DELETE FROM "_prisma_migrations" WHERE "migration_name" = ?', ["20260824120000_referee_admission_eligibility"]);
    } finally {
      mismatchClient.close();
    }
    const migrationMismatchBefore = await counts(migrationMismatchDatabase);
    const migrationMismatch = await cli(migrationMismatchDatabase, ["--production"]);
    assert(migrationMismatch.code !== 0 && sameCounts(await counts(migrationMismatchDatabase), migrationMismatchBefore), "Production preflight accepted mismatched migration inventory.");

    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalUploadRoot = process.env.NUAAFA_UPLOAD_DIR;
    process.env.DATABASE_URL = databaseUrl(productionDatabase);
    process.env.NUAAFA_UPLOAD_DIR = uploadRoot;
    try {
      const blockingManifest = await buildStaticContentManifest();
      blockingManifest.issues.push({ severity: "error", code: "TEST_BLOCKER", message: "Injected blocking inventory issue." });
      await rejects(() => assertProductionStaticContentPreflight(blockingManifest), "Production preflight accepted a blocking inventory issue.");

      const unsafeManifest = await buildStaticContentManifest();
      const entryWithCover = unsafeManifest.entries.find((entry) => entry.cover);
      assert(entryWithCover?.cover, "Static fixture did not contain a cover path.");
      entryWithCover.cover.path = "/../escape.pdf";
      await rejects(() => assertProductionStaticContentPreflight(unsafeManifest), "Production preflight accepted an unsafe media path.");
    } finally {
      if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalDatabaseUrl;
      if (originalUploadRoot === undefined) delete process.env.NUAAFA_UPLOAD_DIR;
      else process.env.NUAAFA_UPLOAD_DIR = originalUploadRoot;
    }

    assert(!dryRun.stdout.includes("STATIC_SENTINEL_MUST_NOT_CHANGE") && !applied.stdout.includes("STATIC_SENTINEL_MUST_NOT_CHANGE"), "Import gate exposed or changed the content-source sentinel.");
    console.log(JSON.stringify({
      productionGate: {
        defaultDryRunZeroWrites: true,
        applyWithoutEnvironmentRejected: true,
        environmentWithoutApplyZeroWrites: true,
        isolatedAuthorizationNotReused: true,
        authorizedApply: true,
        exactInventory: afterApply,
        exactReconciliation: true,
        idempotentRepeat: true,
        wrongSchemaRejected: true,
        migrationMismatchRejected: true,
        blockingInventoryRejected: true,
        unsafeMediaPathRejected: true,
        contentSourceUnchanged: true,
        serviceRestartAttempted: false,
      },
      isolatedImporter: { remainsLockedByDedicatedEnvironment: true, idempotentImportPassed: true },
    }, null, 2));
  } finally {
    await Promise.all([
      rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }),
      ...[productionDatabase, migrationMismatchDatabase].flatMap((target) => [target, `${target}-wal`, `${target}-shm`]).map(
        (target) => rm(target, { force: true, maxRetries: 10, retryDelay: 100 }),
      ),
    ]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "Static content import gate tests failed.");
  process.exitCode = 1;
});
