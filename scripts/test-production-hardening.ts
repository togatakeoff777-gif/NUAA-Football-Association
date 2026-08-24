import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { access, cp, mkdir, mkdtemp, readFile, rm, stat, symlink, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";

import {
  applyBackupRetention,
  assertMinimumFreeSpace,
  calculateBackupCapacity,
  planBackupRetention,
} from "../src/lib/backup-operations";
import {
  createCombinedBackup,
  readAndVerifyCombinedBackup,
  restoreCombinedBackup,
} from "../src/lib/combined-backup";
import { scanMediaStorage } from "../src/lib/media-orphan-monitor";
import { validateUploadPathBoundary, verifyUploadProvisioning } from "../src/lib/upload-provisioning";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function rejects(operation: () => Promise<unknown>, message: string) {
  try {
    await operation();
  } catch {
    return;
  }
  throw new Error(message);
}

async function runPrisma(databaseUrl: string) {
  const code = await new Promise<number>((resolve, reject) => {
    const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : process.execPath;
    const args = process.platform === "win32"
      ? ["/d", "/s", "/c", "npx.cmd prisma migrate deploy"]
      : [path.resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"];
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl, RUST_LOG: "trace" },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve(exitCode ?? 1));
  });
  if (code !== 0) throw new Error(`Prisma migrate deploy exited ${code}.`);
}

async function main() {
  const root = process.env.R1_3C_OPS_ROOT;
  if (!root || !path.isAbsolute(root)) throw new Error("R1-3C ops worker requires an absolute temporary root.");
  const databasePath = process.env.R1_3C_OPS_DATABASE_PATH;
  if (!databasePath || !path.isAbsolute(databasePath)) throw new Error("R1-3C ops worker requires an absolute database path.");
  const databaseUrl = `file:${databasePath.replaceAll("\\", "/")}`;
  const prismaDatabaseUrl = `file:./prisma/${path.basename(databasePath)}`;
  const uploadRoot = path.join(root, "uploads");
  const retentionRoot = path.join(root, "retention");
  let client: PrismaClient | null = null;
  try {
    await mkdir(uploadRoot, { recursive: true });
    await mkdir(path.join(uploadRoot, ".staging"), { recursive: true });
    await mkdir(retentionRoot, { recursive: true });
    await runPrisma(prismaDatabaseUrl);
    client = new PrismaClient({ adapter: new PrismaLibSql({ url: databaseUrl }) });
    const validBytes = Buffer.from("%PDF-1.4\nvalid\n", "utf8");
    const validKey = "2026/08/10000000-0000-0000-0000-000000000001.pdf";
    await client.mediaAsset.create({
      data: {
        storageKey: validKey,
        originalFilename: "valid.pdf",
        storedFilename: "10000000-0000-0000-0000-000000000001.pdf",
        mimeType: "application/pdf",
        size: validBytes.length,
        visibility: "PUBLIC",
      },
    });
    const validTarget = path.join(uploadRoot, ...validKey.split("/"));
    await mkdir(path.dirname(validTarget), { recursive: true });
    await writeFile(validTarget, validBytes, { flag: "wx", mode: 0o600 });

    const incompleteAfterDatabase = path.join(retentionRoot, "incomplete-after-database");
    await rejects(
      () => createCombinedBackup({
        databaseUrl,
        uploadRoot,
        outputDirectory: incompleteAfterDatabase,
        onPhase: (phase) => {
          if (phase === "database-snapshot-complete") throw new Error("Injected upload packaging failure.");
        },
      }),
      "Injected post-database failure did not fail backup.",
    );
    await rejects(() => readAndVerifyCombinedBackup(incompleteAfterDatabase), "Incomplete post-database backup was accepted.");

    const incompleteBeforeCompletion = path.join(retentionRoot, "incomplete-before-completion");
    await rejects(
      () => createCombinedBackup({
        databaseUrl,
        uploadRoot,
        outputDirectory: incompleteBeforeCompletion,
        onPhase: (phase) => {
          if (phase === "completion-publish") throw new Error("Injected completion publish failure.");
        },
      }),
      "Injected completion failure did not fail backup.",
    );
    await rejects(() => readAndVerifyCombinedBackup(incompleteBeforeCompletion), "Backup without final completion marker was accepted.");

    const generatedDates = [
      new Date("2026-08-21T01:00:00.000Z"),
      new Date("2026-08-22T01:00:00.000Z"),
      new Date("2026-08-23T01:00:00.000Z"),
    ];
    const validBackups: string[] = [];
    for (let index = 0; index < generatedDates.length; index += 1) {
      const target = path.join(retentionRoot, `valid-${index + 1}`);
      await createCombinedBackup({ databaseUrl, uploadRoot, outputDirectory: target, generatedAt: generatedDates[index] });
      validBackups.push(target);
    }
    const verified = await readAndVerifyCombinedBackup(validBackups[2]);
    assert(verified.manifest.formatVersion === 3, "Hardened backup manifest version was not emitted.");
    assert(verified.completion.backupId === verified.manifest.backupId, "Completion marker did not bind to manifest backup ID.");
    assert(verified.database.integrityCheck === "ok" && verified.database.foreignKeyViolations === 0, "Backup database validation failed.");

    const corruptBackup = path.join(root, "corrupt-backup");
    await createCombinedBackup({ databaseUrl, uploadRoot, outputDirectory: corruptBackup });
    await writeFile(path.join(corruptBackup, "database.sqlite"), Buffer.from("corrupt"));
    await rejects(() => readAndVerifyCombinedBackup(corruptBackup), "Corrupted backup checksum was accepted.");

    const existingDatabase = path.join(root, "existing-restore.sqlite");
    const existingUploads = path.join(root, "existing-restore-uploads");
    await writeFile(existingDatabase, "DO_NOT_OVERWRITE");
    await mkdir(existingUploads);
    await rejects(
      () => restoreCombinedBackup({
        backupDirectory: validBackups[2],
        databasePath: existingDatabase,
        uploadRoot: existingUploads,
        allowedTargetRoot: root,
      }),
      "Restore overwrote an existing destination.",
    );
    assert((await readFile(existingDatabase, "utf8")) === "DO_NOT_OVERWRITE", "Existing restore destination was modified.");

    const corruptStagedDatabase = path.join(root, "corrupt-staged-restore.sqlite");
    const corruptStagedUploads = path.join(root, "corrupt-staged-restore-uploads");
    await rejects(
      () => restoreCombinedBackup({
        backupDirectory: validBackups[2],
        databasePath: corruptStagedDatabase,
        uploadRoot: corruptStagedUploads,
        allowedTargetRoot: root,
        onPhase: async (phase, staging) => {
          if (phase !== "uploads-copy-complete") return;
          const stagedUpload = path.join(staging.uploadRoot, ...validKey.split("/"));
          await writeFile(stagedUpload, Buffer.alloc(validBytes.length, 0x58));
        },
      }),
      "Corrupted staged restore upload was accepted.",
    );
    await rejects(() => access(corruptStagedDatabase), "Corrupted staged restore published the database destination.");
    await rejects(() => access(corruptStagedUploads), "Corrupted staged restore published the upload destination.");

    const malformed = path.join(retentionRoot, "malformed-backup");
    await mkdir(malformed);
    await writeFile(path.join(malformed, "manifest.json"), "not-json");
    const unknownFile = path.join(retentionRoot, "README-unrelated.txt");
    await writeFile(unknownFile, "unrelated");
    const symlinkTarget = path.join(root, "symlink-target");
    const symlinkEntry = path.join(retentionRoot, "symlink-backup");
    await mkdir(symlinkTarget);
    await symlink(symlinkTarget, symlinkEntry, process.platform === "win32" ? "junction" : "dir");
    const retentionPlan = await planBackupRetention({ backupRoot: retentionRoot, keepCount: 1 });
    assert(retentionPlan.keep.length === 1 && retentionPlan.deleteCandidates.length === 2, "Retention did not classify valid backups by age.");
    assert(retentionPlan.anomalies.some((item) => item.classification === "SYMLINK"), "Retention did not reject symlink entry.");
    assert(retentionPlan.anomalies.some((item) => item.classification === "UNKNOWN_ENTRY"), "Retention did not preserve unknown file.");
    assert(retentionPlan.anomalies.filter((item) => item.classification === "INCOMPLETE_OR_INVALID_BACKUP").length >= 3, "Retention did not reject incomplete and malformed entries.");
    await rejects(
      () => applyBackupRetention({ backupRoot: retentionRoot, keepCount: 1, confirmApply: true }),
      "Retention apply proceeded with unsafe entries.",
    );
    await access(unknownFile);
    const cleanRetentionRoot = path.join(root, "clean-retention");
    await mkdir(cleanRetentionRoot);
    for (let index = 0; index < validBackups.length; index += 1) {
      await cp(validBackups[index], path.join(cleanRetentionRoot, `valid-copy-${index + 1}`), { recursive: true });
    }
    const appliedRetention = await applyBackupRetention({ backupRoot: cleanRetentionRoot, keepCount: 1, confirmApply: true });
    if (!("deleted" in appliedRetention)) throw new Error("Retention apply unexpectedly returned a dry-run plan.");
    assert(appliedRetention.deleted.length === 2, "Retention did not delete exactly the approved isolated candidates.");
    assert((await planBackupRetention({ backupRoot: cleanRetentionRoot, keepCount: 1 })).keep.length === 1, "Retention did not preserve newest backup.");

    const missingKey = "2026/08/20000000-0000-0000-0000-000000000002.pdf";
    await client.mediaAsset.create({
      data: {
        storageKey: missingKey,
        originalFilename: "missing.pdf",
        storedFilename: "20000000-0000-0000-0000-000000000002.pdf",
        mimeType: "application/pdf",
        size: 9,
      },
    });
    const orphanKey = "2026/08/30000000-0000-0000-0000-000000000003.pdf";
    const orphanTarget = path.join(uploadRoot, ...orphanKey.split("/"));
    await mkdir(path.dirname(orphanTarget), { recursive: true });
    await writeFile(orphanTarget, "%PDF-orphan");
    const staleStaging = path.join(uploadRoot, ".staging", "stale.upload");
    await writeFile(staleStaging, "stale");
    await utimes(staleStaging, new Date("2026-08-20T00:00:00.000Z"), new Date("2026-08-20T00:00:00.000Z"));
    const invalidTarget = path.join(uploadRoot, "unexpected.txt");
    await writeFile(invalidTarget, "unexpected");
    const invalidSymlink = path.join(uploadRoot, "unsafe-link");
    await symlink(path.dirname(validTarget), invalidSymlink, process.platform === "win32" ? "junction" : "dir");
    const orphanReport = await scanMediaStorage({
      databaseUrl,
      uploadRoot,
      now: new Date("2026-08-24T00:00:00.000Z"),
      staleStagingAgeMs: 60 * 60 * 1_000,
    });
    assert(orphanReport.counts.DB_RECORD_MISSING_FILE === 1, "Missing physical file was not classified.");
    assert(orphanReport.counts.FILE_WITHOUT_DB_RECORD === 1, "Physical orphan was not classified.");
    assert(orphanReport.counts.STALE_STAGING_FILE === 1, "Stale staging file was not classified.");
    assert(orphanReport.counts.INVALID_STORAGE_PATH === 2, "Invalid storage entries were not classified.");
    await Promise.all([access(orphanTarget), access(staleStaging), access(invalidTarget), access(invalidSymlink)]);

    await rejects(
      () => calculateBackupCapacity({ databasePath, uploadRoot, retentionCount: 14 }),
      "Capacity scan followed an unsafe media symlink.",
    );
    const capacity = await calculateBackupCapacity({
      databaseBytes: (await stat(databasePath)).size,
      uploadBytes: validBytes.length,
      retentionCount: 14,
      thresholds: { warningPercent: 20, criticalPercent: 10 },
    });
    assert(capacity.currentDatasetEstimate > 0 && capacity.recommendedMinimumFreeSpace > capacity.retentionEstimate, "Capacity formula omitted temporary or reserve overhead.");
    const disk = await assertMinimumFreeSpace(root, 1);
    assert(disk.freeBytes > 0, "Disk free-space preflight failed.");
    assert(validateUploadPathBoundary(uploadRoot, validKey), "Valid storage key escaped upload root.");
    assert(!validateUploadPathBoundary(uploadRoot, "../../escape.pdf"), "Traversal storage key was accepted.");
    let provisioning: Awaited<ReturnType<typeof verifyUploadProvisioning>> | null = null;
    if (process.platform !== "linux") {
      provisioning = await verifyUploadProvisioning({
        configuredPath: uploadRoot,
        expectedPath: uploadRoot,
        expectedOwner: "nuaafa",
        expectedGroup: "nuaafa",
        expectedMode: "0700",
        minimumFreeBytes: 1,
      });
      assert(!provisioning.ownership.enforced, "Non-Linux rehearsal incorrectly claimed POSIX ownership enforcement.");
    }

    console.log(JSON.stringify({
      combinedBackup: {
        formatVersion: verified.manifest.formatVersion,
        backupId: verified.manifest.backupId,
        completionMarker: true,
        manifestChecksumBinding: true,
        databaseIntegrity: verified.database.integrityCheck,
        foreignKeyViolations: verified.database.foreignKeyViolations,
        postDatabaseFailureRejected: true,
        preCompletionFailureRejected: true,
        corruptionRejected: true,
        existingRestoreDestinationRejected: true,
        stagedUploadCorruptionRejectedBeforePublish: true,
      },
      retention: {
        dryRun: true,
        malformedRejected: true,
        unknownPreserved: true,
        symlinkRejected: true,
        incompleteRejected: true,
        isolatedApplyDeleted: appliedRetention.deleted.length,
      },
      orphanMonitoring: {
        exitCodeContract: { clean: 0, anomaly: 2, scannerFailure: 3 },
        report: orphanReport,
        automaticDeletion: false,
      },
      capacity,
      diskPreflight: disk,
      uploadProvisioning: {
        frozenContract: { path: "/srv/nuaafa/shared/uploads", owner: "nuaafa", group: "nuaafa", mode: "0700" },
        pathTraversalRejected: true,
        localReadOnlyVerification: provisioning,
      },
    }, null, 2));
  } finally {
    await client?.$disconnect();
  }
}

async function entry() {
  if (process.env.R1_3C_OPS_WORKER === "1") {
    await main();
    return;
  }
  const databasePath = path.resolve("prisma", `r1-3c-ops-${randomUUID()}.db`);
  const root = await mkdtemp(path.join(os.tmpdir(), "nuaafa-r1-3c-ops-"));
  const prismaRoot = `${path.resolve("prisma")}${path.sep}`;
  if (!databasePath.startsWith(prismaRoot)) throw new Error("R1-3C ops database escaped the workspace prisma directory.");
  const code = await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [path.resolve("node_modules/tsx/dist/cli.mjs"), path.resolve("scripts/test-production-hardening.ts")], {
      cwd: process.cwd(),
      env: { ...process.env, R1_3C_OPS_WORKER: "1", R1_3C_OPS_DATABASE_PATH: databasePath, R1_3C_OPS_ROOT: root },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve(exitCode ?? 1));
  });
  await Promise.all([
    ...[databasePath, `${databasePath}-wal`, `${databasePath}-shm`].map((target) => rm(target, { force: true, maxRetries: 10, retryDelay: 100 })),
    rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }),
  ]);
  if (code !== 0) process.exitCode = code;
}

entry().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "Production hardening tests failed.");
  process.exitCode = 1;
});
